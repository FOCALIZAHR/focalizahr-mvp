// GET /api/workforce/presupuesto/base
// Paso 1 del Wizard de Presupuesto: foto actual de la organizacion.
// Headcount, masa salarial y costo empresa agrupado por gerencia, con
// exposicion IA promedio y default de rotacion historica.

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  extractUserContext,
  hasPermission,
  getChildDepartmentIds,
  GLOBAL_ACCESS_ROLES,
} from '@/lib/services/AuthorizationService'
import { SalaryConfigService } from '@/lib/services/SalaryConfigService'
import { WorkforceIntelligenceService } from '@/lib/services/WorkforceIntelligenceService'
import { PositionAdapter } from '@/lib/services/PositionAdapter'

const FACTOR_AMPLIFICACION_DEFAULT = 1.35
const ROTACION_DEFAULT = 12

interface GerenciaBase {
  gerenciaId: string
  gerenciaNombre: string
  standardCategory: string | null
  headcount: number
  masaSalarial: number
  costoEmpresa: number
  exposicionIA: number
}

export async function GET(request: NextRequest) {
  try {
    const userContext = extractUserContext(request)
    if (!userContext.accountId) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }
    if (!hasPermission(userContext.role, 'workforce:budget:view')) {
      return NextResponse.json({ success: false, error: 'Sin permisos' }, { status: 403 })
    }

    const hasGlobalAccess = GLOBAL_ACCESS_ROLES.includes(userContext.role as any)
    let departmentIds: string[] | undefined
    if (!hasGlobalAccess && userContext.role === 'AREA_MANAGER' && userContext.departmentId) {
      const childIds = await getChildDepartmentIds(userContext.departmentId)
      departmentIds = [userContext.departmentId, ...childIds]
    }

    const employees = await prisma.employee.findMany({
      where: {
        accountId: userContext.accountId,
        isActive: true,
        status: 'ACTIVE',
        ...(departmentIds ? { departmentId: { in: departmentIds } } : {}),
      },
      select: {
        id: true,
        position: true,
        acotadoGroup: true,
        departmentId: true,
        department: {
          select: { id: true, displayName: true, standardCategory: true },
        },
      },
    })

    const cargosMap = new Map<string, { cargo: string; acotadoGroup: string; headcount: number }>()
    for (const emp of employees) {
      if (!emp.position || !emp.acotadoGroup) continue
      const cargo = emp.position.trim()
      if (!cargo) continue
      const key = `${emp.acotadoGroup}::${cargo.toLowerCase()}`
      const existing = cargosMap.get(key)
      if (existing) {
        existing.headcount += 1
      } else {
        cargosMap.set(key, { cargo, acotadoGroup: emp.acotadoGroup, headcount: 1 })
      }
    }
    const cargosDisponibles = Array.from(cargosMap.values()).sort((a, b) =>
      a.cargo.localeCompare(b.cargo),
    )

    const acotadoGroups = PositionAdapter.getAllAcotadoGroupsOrdered().map(g => g.value)
    const salaryCache = new Map<string, number>()
    for (const group of acotadoGroups) {
      const sr = await SalaryConfigService.getSalaryForAccount(userContext.accountId, group)
      salaryCache.set(group, sr.monthlySalary)
    }
    const defaultSalary = (
      await SalaryConfigService.getSalaryForAccount(userContext.accountId)
    ).monthlySalary

    const diagnostic = await WorkforceIntelligenceService.getOrganizationDiagnostic(
      userContext.accountId,
      departmentIds,
    )

    const exposicionPorGerencia = new Map<string, { sum: number; count: number }>()
    for (const entry of diagnostic.retentionPriority.ranking) {
      const key = entry.standardCategory ?? 'sin_categoria'
      const score = entry.focalizaScore ?? entry.observedExposure ?? 0
      const bucket = exposicionPorGerencia.get(key) ?? { sum: 0, count: 0 }
      bucket.sum += score
      bucket.count += 1
      exposicionPorGerencia.set(key, bucket)
    }

    const gerenciaMap = new Map<string, GerenciaBase>()
    let totalHeadcount = 0
    let totalMasa = 0

    for (const emp of employees) {
      const salary = salaryCache.get(emp.acotadoGroup ?? '') ?? defaultSalary
      const deptId = emp.department?.id ?? emp.departmentId ?? 'sin_departamento'
      const nombre = emp.department?.displayName ?? 'Sin gerencia'
      const category = emp.department?.standardCategory ?? null
      const expKey = category ?? 'sin_categoria'
      const exp = exposicionPorGerencia.get(expKey)
      const exposicion = exp && exp.count > 0 ? (exp.sum / exp.count) * 100 : 0

      const existing = gerenciaMap.get(deptId)
      if (existing) {
        existing.headcount += 1
        existing.masaSalarial += salary
        existing.costoEmpresa = existing.masaSalarial * FACTOR_AMPLIFICACION_DEFAULT
      } else {
        gerenciaMap.set(deptId, {
          gerenciaId: deptId,
          gerenciaNombre: nombre,
          standardCategory: category,
          headcount: 1,
          masaSalarial: salary,
          costoEmpresa: salary * FACTOR_AMPLIFICACION_DEFAULT,
          exposicionIA: Math.round(exposicion),
        })
      }
      totalHeadcount += 1
      totalMasa += salary
    }

    const porGerencia = Array.from(gerenciaMap.values()).sort(
      (a, b) => b.masaSalarial - a.masaSalarial,
    )
    const costoEmpresa = totalMasa * FACTOR_AMPLIFICACION_DEFAULT
    const exposicionPromedio =
      porGerencia.length > 0
        ? Math.round(
            porGerencia.reduce((sum, g) => sum + g.exposicionIA * g.headcount, 0) /
              Math.max(totalHeadcount, 1),
          )
        : 0

    const exitInsights = await prisma.departmentExitInsight.findMany({
      where: {
        accountId: userContext.accountId,
        periodType: 'annual',
      },
      orderBy: { periodStart: 'desc' },
      take: 12,
    })
    let rotacionHistorica = ROTACION_DEFAULT
    if (exitInsights.length > 0 && totalHeadcount > 0) {
      const totalExits = exitInsights.reduce((sum, i) => sum + i.totalExits, 0)
      const periods = Math.max(1, new Set(exitInsights.map(i => i.period)).size)
      rotacionHistorica = Math.round((totalExits / periods / totalHeadcount) * 100)
    }

    return NextResponse.json({
      success: true,
      data: {
        totalHeadcount,
        masaSalarialBruta: Math.round(totalMasa),
        costoEmpresa: Math.round(costoEmpresa),
        factorAmplificacion: FACTOR_AMPLIFICACION_DEFAULT,
        exposicionIAPromedio: exposicionPromedio,
        rotacionHistorica,
        porGerencia,
        intocablesCount: diagnostic.retentionPriority.intocablesCount,
        cargosDisponibles,
      },
    })
  } catch (error: unknown) {
    console.error('[workforce/presupuesto/base] Error:', error)
    const message = error instanceof Error ? error.message : 'Error interno'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
