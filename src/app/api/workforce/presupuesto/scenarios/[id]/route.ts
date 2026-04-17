import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  extractUserContext,
  hasPermission,
} from '@/lib/services/AuthorizationService'
import { SalaryConfigService } from '@/lib/services/SalaryConfigService'
import { PositionAdapter } from '@/lib/services/PositionAdapter'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const userContext = extractUserContext(request)
    if (!userContext.accountId) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }
    if (!hasPermission(userContext.role, 'workforce:budget:view')) {
      return NextResponse.json({ success: false, error: 'Sin permisos' }, { status: 403 })
    }

    const scenario = await prisma.budgetScenario.findFirst({
      where: { id: params.id, accountId: userContext.accountId },
    })

    if (!scenario) {
      return NextResponse.json({ success: false, error: 'Escenario no encontrado' }, { status: 404 })
    }

    // ── Detección de cambios vs estado actual ────────────────────────────
    const employees = await prisma.employee.findMany({
      where: { accountId: userContext.accountId, isActive: true, status: 'ACTIVE' },
      select: { id: true, acotadoGroup: true },
    })

    const acotadoGroups = PositionAdapter.getAllAcotadoGroupsOrdered().map(g => g.value)
    const salaryCache = new Map<string, number>()
    for (const group of acotadoGroups) {
      const sr = await SalaryConfigService.getSalaryForAccount(userContext.accountId, group)
      salaryCache.set(group, sr.monthlySalary)
    }
    const defaultSalary = (
      await SalaryConfigService.getSalaryForAccount(userContext.accountId)
    ).monthlySalary

    let masaSalarialActual = 0
    const activeIds = new Set<string>()
    for (const e of employees) {
      masaSalarialActual += salaryCache.get(e.acotadoGroup ?? '') ?? defaultSalary
      activeIds.add(e.id)
    }

    // Personas seleccionadas que ya no están activas (salieron realmente)
    const personasSalieron = scenario.provisionesSeleccionadas.filter(
      id => !activeIds.has(id),
    )

    // Prescindibles que ya salieron
    const prescindiblesSalieron = scenario.prescindiblesIds.filter(
      id => !activeIds.has(id),
    )

    const deltaHeadcount = employees.length - scenario.headcountAlGuardar
    const deltaMasaSalarial = masaSalarialActual - scenario.masaSalarialAlGuardar

    const hayCambios =
      personasSalieron.length > 0 ||
      prescindiblesSalieron.length > 0 ||
      deltaHeadcount !== 0 ||
      Math.abs(deltaMasaSalarial) > 100_000

    return NextResponse.json({
      success: true,
      data: {
        scenario: {
          id: scenario.id,
          name: scenario.name,
          year: scenario.year,
          status: scenario.status,
          createdBy: scenario.createdBy,
          createdAt: scenario.createdAt,
          updatedAt: scenario.updatedAt,
          supuestos: scenario.supuestos,
          movimientos: scenario.movimientos,
          provisionesSeleccionadas: scenario.provisionesSeleccionadas,
          mesesSalidaPorPersona: scenario.mesesSalidaPorPersona,
          prescindiblesIds: scenario.prescindiblesIds,
        },
        cambiosDetectados: {
          hayCambios,
          personasSalieron,
          prescindiblesSalieron,
          deltaHeadcount,
          deltaMasaSalarial: Math.round(deltaMasaSalarial),
          headcountActual: employees.length,
          headcountAlGuardar: scenario.headcountAlGuardar,
        },
      },
    })
  } catch (error: unknown) {
    console.error('[workforce/presupuesto/scenarios/[id]] GET error:', error)
    const message = error instanceof Error ? error.message : 'Error interno'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
