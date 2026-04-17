// POST /api/workforce/presupuesto/movimientos
// Paso 2 del Wizard: calcula el impacto financiero de movimientos de dotacion.
// Valida solo que deltas negativos no excedan el headcount actual del cargo.
// El guardarrail de intocables NO bloquea en este paso — es informativo.
// En el Paso 4, los intocables quedan excluidos automaticamente.

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

interface MovimientoInput {
  acotadoGroup: string
  cargo: string
  delta: number
  mesInicio?: number
}

interface MovimientoProcesado {
  acotadoGroup: string
  cargo: string
  delta: number
  mesInicio: number
  impactoMensual: number
  impactoAnual: number
  bloqueado: boolean
  motivo?: string
  warningIntocables: number
}

// Normaliza strings de cargo de forma consistente entre endpoints.
// Trim + lowercase + colapsa espacios internos multiples.
function normalizeCargo(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, ' ')
}

function keyCargo(acotadoGroup: string | null, position: string | null): string {
  const a = (acotadoGroup ?? '').trim()
  const p = position ? normalizeCargo(position) : ''
  return `${a}::${p}`
}

export async function POST(request: NextRequest) {
  try {
    const userContext = extractUserContext(request)
    if (!userContext.accountId) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }
    if (!hasPermission(userContext.role, 'workforce:budget:view')) {
      return NextResponse.json({ success: false, error: 'Sin permisos' }, { status: 403 })
    }

    const body = await request.json()
    const movimientos: MovimientoInput[] = Array.isArray(body?.movimientos) ? body.movimientos : []
    if (movimientos.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Movimientos requeridos' },
        { status: 400 },
      )
    }

    const validGroups = new Set(
      PositionAdapter.getAllAcotadoGroupsOrdered().map(g => g.value),
    )
    for (const m of movimientos) {
      if (!validGroups.has(m.acotadoGroup)) {
        return NextResponse.json(
          { success: false, error: `Familia invalida: ${m.acotadoGroup}` },
          { status: 400 },
        )
      }
      if (typeof m.delta !== 'number' || Number.isNaN(m.delta)) {
        return NextResponse.json(
          { success: false, error: 'Delta invalido' },
          { status: 400 },
        )
      }
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
      select: { id: true, position: true, acotadoGroup: true },
    })

    const headcountByCargo = new Map<string, number>()
    for (const e of employees) {
      if (!e.position || !e.acotadoGroup) continue
      const k = keyCargo(e.acotadoGroup, e.position)
      headcountByCargo.set(k, (headcountByCargo.get(k) ?? 0) + 1)
    }

    const diagnostic = await WorkforceIntelligenceService.getOrganizationDiagnostic(
      userContext.accountId,
      departmentIds,
    )
    // Conteo de intocables por cargo — para advertencia informativa (NO bloquea).
    const intocablesByCargo = new Map<string, number>()
    for (const r of diagnostic.retentionPriority.ranking) {
      if (r.tier !== 'intocable') continue
      const k = keyCargo(r.acotadoGroup, r.position)
      intocablesByCargo.set(k, (intocablesByCargo.get(k) ?? 0) + 1)
    }

    const uniqueGroups = [...new Set(movimientos.map(m => m.acotadoGroup))]
    const salaryCache = new Map<string, number>()
    for (const group of uniqueGroups) {
      const sr = await SalaryConfigService.getSalaryForAccount(userContext.accountId, group)
      salaryCache.set(group, sr.monthlySalary)
    }

    const procesados: MovimientoProcesado[] = []
    let deltaHeadcount = 0
    let deltaMasa = 0

    for (const m of movimientos) {
      const cargoKey = keyCargo(m.acotadoGroup, m.cargo)
      const headcountActual = headcountByCargo.get(cargoKey) ?? 0
      const salary = salaryCache.get(m.acotadoGroup) ?? 0
      const mesInicio = Math.max(1, Math.min(12, m.mesInicio ?? 1))
      const warningIntocables = intocablesByCargo.get(cargoKey) ?? 0

      let bloqueado = false
      let motivo: string | undefined

      // Unica regla de bloqueo: delta negativo no puede exceder el headcount real.
      if (m.delta < 0 && Math.abs(m.delta) > headcountActual) {
        bloqueado = true
        motivo =
          headcountActual === 0
            ? 'No se encontro el cargo en la dotacion actual'
            : `Solo hay ${headcountActual} ${headcountActual === 1 ? 'persona' : 'personas'} en este cargo`
      }

      const impactoMensual = bloqueado ? 0 : m.delta * salary
      const mesesActivos = bloqueado ? 0 : 12 - (mesInicio - 1)
      const impactoAnual = impactoMensual * mesesActivos

      if (!bloqueado) {
        deltaHeadcount += m.delta
        deltaMasa += impactoMensual
      }

      procesados.push({
        acotadoGroup: m.acotadoGroup,
        cargo: m.cargo,
        delta: m.delta,
        mesInicio,
        impactoMensual: Math.round(impactoMensual),
        impactoAnual: Math.round(impactoAnual),
        bloqueado,
        motivo,
        warningIntocables,
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        nuevoHeadcount: employees.length + deltaHeadcount,
        deltaHeadcount,
        deltaMasaSalarial: Math.round(deltaMasa),
        deltaCostoEmpresa: Math.round(deltaMasa * FACTOR_AMPLIFICACION_DEFAULT),
        movimientosProcesados: procesados,
      },
    })
  } catch (error: unknown) {
    console.error('[workforce/presupuesto/movimientos] Error:', error)
    const message = error instanceof Error ? error.message : 'Error interno'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
