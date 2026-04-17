import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  extractUserContext,
  hasPermission,
} from '@/lib/services/AuthorizationService'
import { SalaryConfigService } from '@/lib/services/SalaryConfigService'
import { PositionAdapter } from '@/lib/services/PositionAdapter'

// POST — guardar escenario nuevo
export async function POST(request: NextRequest) {
  try {
    const userContext = extractUserContext(request)
    if (!userContext.accountId) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }
    if (!hasPermission(userContext.role, 'workforce:budget:view')) {
      return NextResponse.json({ success: false, error: 'Sin permisos' }, { status: 403 })
    }

    const createdByEmail = request.headers.get('x-user-email') ?? 'unknown'

    const body = await request.json()
    const name = typeof body?.name === 'string' && body.name.trim() ? body.name.trim() : null
    if (!name) {
      return NextResponse.json({ success: false, error: 'Nombre requerido' }, { status: 400 })
    }

    const ws = body?.wizardState
    if (!ws?.supuestos || !Array.isArray(ws?.provisionesSeleccionadas)) {
      return NextResponse.json({ success: false, error: 'Estado del wizard incompleto' }, { status: 400 })
    }

    const year = typeof ws.supuestos?.anioPresupuesto === 'number'
      ? ws.supuestos.anioPresupuesto
      : new Date().getFullYear()

    // Snapshot actual de headcount + masa salarial
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

    let masaSalarial = 0
    for (const e of employees) {
      masaSalarial += salaryCache.get(e.acotadoGroup ?? '') ?? defaultSalary
    }

    const scenario = await prisma.budgetScenario.create({
      data: {
        accountId: userContext.accountId,
        createdBy: createdByEmail,
        name,
        year,
        supuestos: ws.supuestos,
        movimientos: Array.isArray(ws.movimientos) ? ws.movimientos : [],
        provisionesSeleccionadas: ws.provisionesSeleccionadas,
        mesesSalidaPorPersona: ws.mesesSalidaPorPersona ?? {},
        prescindiblesIds: Array.isArray(ws.prescindiblesIds) ? ws.prescindiblesIds : [],
        headcountAlGuardar: employees.length,
        masaSalarialAlGuardar: masaSalarial,
      },
    })

    return NextResponse.json({
      success: true,
      data: { id: scenario.id, name: scenario.name, createdAt: scenario.createdAt },
    })
  } catch (error: unknown) {
    console.error('[workforce/presupuesto/scenarios] POST error:', error)
    const message = error instanceof Error ? error.message : 'Error interno'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

// GET — listar escenarios de la cuenta
export async function GET(request: NextRequest) {
  try {
    const userContext = extractUserContext(request)
    if (!userContext.accountId) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }
    if (!hasPermission(userContext.role, 'workforce:budget:view')) {
      return NextResponse.json({ success: false, error: 'Sin permisos' }, { status: 403 })
    }

    const scenarios = await prisma.budgetScenario.findMany({
      where: { accountId: userContext.accountId },
      select: {
        id: true,
        name: true,
        year: true,
        status: true,
        createdBy: true,
        headcountAlGuardar: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: 'desc' },
      take: 20,
    })

    return NextResponse.json({ success: true, data: scenarios })
  } catch (error: unknown) {
    console.error('[workforce/presupuesto/scenarios] GET error:', error)
    const message = error instanceof Error ? error.message : 'Error interno'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
