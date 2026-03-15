/**
 * GET /api/talent-actions/pl-summary
 *
 * P&L agregado organizacional del talento
 * Usa SalaryConfigService para costos reales (3-tier fallback)
 * Incluye salarySource para sugerir configurar si es 'default_chile'
 *
 * Permiso: talent-actions:pl-view (sin AREA_MANAGER ni HR_OPERATOR)
 *
 * Calcula:
 * - iccRiskTotal: personas ICC x costo rotacion x expertisePremium 1.5x
 * - potencialPerdidoTotal: sucesores en fuga sin plan x costo rotacion
 * - fugaCerebrosCostTotal: personas FUGA_CEREBROS x costo rotacion
 * - totalTalentRisk: suma de los 3 componentes
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  extractUserContext,
  hasPermission,
  getChildDepartmentIds
} from '@/lib/services/AuthorizationService'
import { SalaryConfigService } from '@/lib/services/SalaryConfigService'
import { PositionAdapter } from '@/lib/services/PositionAdapter'
import { SuccessionService } from '@/lib/services/SuccessionService'

export async function GET(request: NextRequest) {
  const startTime = Date.now()

  try {
    // CAPA 1: Autenticacion
    const userContext = extractUserContext(request)

    if (!userContext.accountId) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    // CAPA 2: Permisos
    if (!hasPermission(userContext.role, 'talent-actions:pl-view')) {
      return NextResponse.json(
        { success: false, error: 'Sin permisos para P&L del Talento' },
        { status: 403 }
      )
    }

    const accountId = userContext.accountId

    // Ciclo activo
    const cycleId = await SuccessionService.getCurrentCycleId(accountId)
    if (!cycleId) {
      return NextResponse.json({
        success: true,
        data: { totalTalentRiskCLP: 0, components: {}, salarySource: 'default_chile' },
        responseTime: Date.now() - startTime
      })
    }

    // Filtrado jerarquico (AREA_MANAGER ya bloqueado por permiso, pero por seguridad)
    let departmentFilter: any = undefined
    if (userContext.role === 'AREA_MANAGER' && userContext.departmentId) {
      const childIds = await getChildDepartmentIds(userContext.departmentId)
      departmentFilter = { in: [userContext.departmentId, ...childIds] }
    }

    // Obtener ratings con datos de empleado
    const where: any = {
      accountId,
      cycleId,
      employee: { isActive: true, status: 'ACTIVE' }
    }
    if (departmentFilter) {
      where.employee.departmentId = departmentFilter
    }

    const ratings = await prisma.performanceRating.findMany({
      where,
      select: {
        employeeId: true,
        riskQuadrant: true,
        mobilityQuadrant: true,
        riskAlertLevel: true,
        roleFitScore: true,
        employee: {
          select: {
            position: true,
            id: true
          }
        }
      }
    })

    // Salario base para calculos
    const salaryResult = await SalaryConfigService.getSalaryForAccount(accountId)
    const baseMonthlySalary = salaryResult.monthlySalary
    const baseAnnualSalary = baseMonthlySalary * 12

    // ═══════════════════════════════════════════════════════════════
    // COMPONENTE 1: ICC Risk
    // Personas (RED|ORANGE + EXPERTO_ANCLA) x costo x 1.5 expertisePremium
    // ═══════════════════════════════════════════════════════════════
    let iccCount = 0
    let iccRiskCLP = 0

    for (const r of ratings) {
      if ((r.riskAlertLevel === 'RED' || r.riskAlertLevel === 'ORANGE') &&
          r.mobilityQuadrant === 'EXPERTO_ANCLA') {
        iccCount++
        const acotado = r.employee.position
          ? PositionAdapter.classifyPosition(r.employee.position).acotadoGroup
          : null
        const salary = acotado
          ? (await SalaryConfigService.getSalaryForAccount(accountId, acotado)).monthlySalary
          : baseMonthlySalary
        const multiplier = getMultiplier(acotado)
        iccRiskCLP += salary * 12 * multiplier * 1.5 // expertisePremium
      }
    }

    // ═══════════════════════════════════════════════════════════════
    // COMPONENTE 2: Potencial Perdido
    // Sucesores en FUGA sin plan de desarrollo
    // ═══════════════════════════════════════════════════════════════
    const fugaEmployeeIds = ratings
      .filter(r => r.riskQuadrant === 'FUGA_CEREBROS')
      .map(r => r.employeeId)

    let potencialPerdidoCount = 0
    let potencialPerdidoCLP = 0

    if (fugaEmployeeIds.length > 0) {
      const fugaSuccessors = await prisma.successionCandidate.findMany({
        where: {
          accountId,
          employeeId: { in: fugaEmployeeIds },
          status: 'ACTIVE',
          developmentPlanId: null // SIN plan formal
        },
        select: {
          employeeId: true,
          employee: { select: { position: true } }
        }
      })

      for (const sc of fugaSuccessors) {
        potencialPerdidoCount++
        const acotado = sc.employee.position
          ? PositionAdapter.classifyPosition(sc.employee.position).acotadoGroup
          : null
        const salary = acotado
          ? (await SalaryConfigService.getSalaryForAccount(accountId, acotado)).monthlySalary
          : baseMonthlySalary
        const multiplier = getMultiplier(acotado)
        potencialPerdidoCLP += salary * 12 * multiplier
      }
    }

    // ═══════════════════════════════════════════════════════════════
    // COMPONENTE 3: Fuga de Cerebros total
    // Todas las personas FUGA_CEREBROS x costo rotacion
    // ═══════════════════════════════════════════════════════════════
    let fugaCerebrosCount = 0
    let fugaCerebrosCLP = 0

    for (const r of ratings) {
      if (r.riskQuadrant === 'FUGA_CEREBROS') {
        fugaCerebrosCount++
        const acotado = r.employee.position
          ? PositionAdapter.classifyPosition(r.employee.position).acotadoGroup
          : null
        const salary = acotado
          ? (await SalaryConfigService.getSalaryForAccount(accountId, acotado)).monthlySalary
          : baseMonthlySalary
        const multiplier = getMultiplier(acotado)
        fugaCerebrosCLP += salary * 12 * multiplier
      }
    }

    const totalTalentRiskCLP = iccRiskCLP + potencialPerdidoCLP + fugaCerebrosCLP

    return NextResponse.json({
      success: true,
      data: {
        totalTalentRiskCLP: Math.round(totalTalentRiskCLP),
        components: {
          iccRisk: {
            count: iccCount,
            costCLP: Math.round(iccRiskCLP),
            label: 'Conocimiento critico en riesgo (ICC x 1.5)'
          },
          potencialPerdido: {
            count: potencialPerdidoCount,
            costCLP: Math.round(potencialPerdidoCLP),
            label: 'Sucesores en fuga sin plan de desarrollo'
          },
          fugaCerebros: {
            count: fugaCerebrosCount,
            costCLP: Math.round(fugaCerebrosCLP),
            label: 'Costo total fuga de cerebros'
          }
        },
        salarySource: salaryResult.source,
        salaryConfigured: salaryResult.source !== 'default_chile',
        totalPersonas: ratings.length
      },
      responseTime: Date.now() - startTime
    })

  } catch (error: any) {
    console.error('[TAC pl-summary] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Error interno' },
      { status: 500 }
    )
  }
}

// Multiplicadores SHRM 2024 por nivel
function getMultiplier(acotadoGroup: string | null): number {
  switch (acotadoGroup) {
    case 'alta_gerencia': return 2.0
    case 'mandos_medios': return 1.5
    case 'profesionales': return 1.25
    case 'base_operativa': return 0.75
    default: return 1.25
  }
}
