// ════════════════════════════════════════════════════════════════════════════
// GET /api/descriptors/simulator-list
// src/app/api/descriptors/simulator-list/route.ts
// ════════════════════════════════════════════════════════════════════════════
// Lista de cargos para el selector del DescriptorSimulator (Workforce Cinema).
//
// Devuelve TODOS los cargos únicos del account (no solo los descriptors):
//   • verified  → JobDescriptor confirmado/draft (datos afinados por HR)
//   • proposed  → cargo en Employee con SOC vía OccupationMapping (teórico O*NET)
//   • unmapped  → cargo en Employee sin SOC clasificado (no simulable)
//
// Filosofía: el CEO ve el negocio completo desde el día 1. La verificación
// solo afina precisión, no desbloquea visibilidad.
//
// RBAC: descriptors:view
// ════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import {
  extractUserContext,
  hasPermission,
  getChildDepartmentIds,
  GLOBAL_ACCESS_ROLES,
} from '@/lib/services/AuthorizationService'
import { prisma } from '@/lib/prisma'
import { socCodeVariants } from '@/lib/utils/socCode'
import { normalizePositionText } from '@/lib/utils/normalizePosition'

export type SimulatorListKind = 'verified' | 'proposed' | 'unmapped'

export interface SimulatorDescriptorListItem {
  /** Clave única para el selector. Para verified=descriptorId; para
   *  proposed/unmapped: `prop:<positionText>` / `unm:<positionText>` */
  key: string
  jobTitle: string
  kind: SimulatorListKind

  /** Sólo presente en verified. */
  descriptorId: string | null

  /** SOC code resuelto (verified vía descriptor, proposed vía OccupationMapping). */
  socCode: string | null

  /** focalizaScore teórico de O*NET (Eloundou) — para mostrar en badge propuesto. */
  occupationFocalizaScore: number | null

  /** Empleados activos con este cargo (live count, no denormalizado). */
  employeeCount: number

  standardJobLevel: string | null
  standardCategory: string | null
}

export interface SimulatorListCoverage {
  totalCargos: number
  verified: number
  proposed: number
  unmapped: number
  coveragePct: number  // verified / totalCargos × 100, redondeado
}

/**
 * Normalización canónica para matching position ↔ descriptor ↔ mapping.
 * Alias a `normalizePositionText` (single source of truth) — minimiza diff
 * en los call sites que ya usan `norm`.
 */
const norm = normalizePositionText

export async function GET(request: NextRequest) {
  try {
    const userContext = extractUserContext(request)
    if (!userContext.accountId) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 },
      )
    }
    if (!hasPermission(userContext.role, 'descriptors:view')) {
      return NextResponse.json(
        { success: false, error: 'Sin permisos' },
        { status: 403 },
      )
    }

    // Scope jerárquico para AREA_MANAGER
    const hasGlobalAccess = GLOBAL_ACCESS_ROLES.includes(userContext.role as any)
    let departmentFilter: { in: string[] } | undefined
    if (
      !hasGlobalAccess &&
      userContext.role === 'AREA_MANAGER' &&
      userContext.departmentId
    ) {
      const childIds = await getChildDepartmentIds(userContext.departmentId)
      departmentFilter = { in: [userContext.departmentId, ...childIds] }
    }

    // ── 1. Empleados activos del account → cargos únicos + counts ───────
    // Cargo `department.standardCategory` para derivar gerencia (SSOT).
    const employees = await prisma.employee.findMany({
      where: {
        accountId: userContext.accountId,
        isActive: true,
        position: { not: null },
        ...(departmentFilter ? { departmentId: departmentFilter } : {}),
      },
      select: {
        position: true,
        department: { select: { standardCategory: true } },
      },
    })
    // Live count por cargo (case-sensitive original text para display)
    const positionCounts = new Map<string, number>()
    // Mode de standardCategory por cargo (SSOT desde Employee.department)
    const categoryCountsByPosition = new Map<string, Map<string, number>>()
    for (const e of employees) {
      const pos = e.position as string
      positionCounts.set(pos, (positionCounts.get(pos) ?? 0) + 1)
      const cat = e.department?.standardCategory
      if (cat) {
        let inner = categoryCountsByPosition.get(pos)
        if (!inner) {
          inner = new Map<string, number>()
          categoryCountsByPosition.set(pos, inner)
        }
        inner.set(cat, (inner.get(cat) ?? 0) + 1)
      }
    }
    /** Devuelve la standardCategory dominante (mode) para una position, o null. */
    function dominantCategory(position: string): string | null {
      const counts = categoryCountsByPosition.get(position)
      if (!counts || counts.size === 0) return null
      let best: string | null = null
      let bestCount = 0
      for (const [cat, c] of counts.entries()) {
        if (c > bestCount) {
          best = cat
          bestCount = c
        }
      }
      return best
    }

    // ── 2. JobDescriptors del account ───────────────────────────────────
    const descriptors = await prisma.jobDescriptor.findMany({
      where: {
        accountId: userContext.accountId,
        ...(departmentFilter ? { departmentId: departmentFilter } : {}),
      },
      select: {
        id: true,
        jobTitle: true,
        socCode: true,
        status: true,
        standardJobLevel: true,
        standardCategory: true,
        employeeCount: true,
      },
    })
    const descByNorm = new Map(descriptors.map(d => [norm(d.jobTitle), d]))

    // ── 3. OccupationMapping del account → SOC para propuestos ──────────
    const mappings = await prisma.occupationMapping.findMany({
      where: { accountId: userContext.accountId, socCode: { not: null } },
      select: { positionText: true, socCode: true },
    })
    const mapByNorm = new Map(
      mappings.map(m => [norm(m.positionText), m.socCode as string]),
    )

    // ── 4. focalizaScore de OnetOccupation para todos los SOC en juego ─
    const allSocCodes = new Set<string>()
    descriptors.forEach(d => d.socCode && allSocCodes.add(d.socCode))
    mappings.forEach(m => m.socCode && allSocCodes.add(m.socCode))
    // Variantes (con y sin .00) para asegurar match
    const socVariants = [...allSocCodes].flatMap(s => socCodeVariants(s))
    const occupations = socVariants.length
      ? await prisma.onetOccupation.findMany({
          where: { socCode: { in: socVariants } },
          select: { socCode: true, focalizaScore: true },
        })
      : []
    // Map por variante (busqueda directa con cualquier formato)
    const focalizaBySoc = new Map<string, number | null>()
    occupations.forEach(o => focalizaBySoc.set(o.socCode, o.focalizaScore))
    function lookupFocaliza(soc: string | null): number | null {
      if (!soc) return null
      for (const v of socCodeVariants(soc)) {
        if (focalizaBySoc.has(v)) return focalizaBySoc.get(v) ?? null
      }
      return null
    }

    // ── 5. Construir lista unificada ────────────────────────────────────
    const items: SimulatorDescriptorListItem[] = []
    const seenDescriptorKeys = new Set<string>()

    // 5a. Para cada cargo de empleados activos: emitir verified | proposed | unmapped
    for (const [position, count] of positionCounts.entries()) {
      const n = norm(position)
      const desc = descByNorm.get(n)
      // SSOT primario: standardCategory desde Employee.department (mode)
      // Aplica a TODOS (verified + proposed + unmapped) para coherencia
      const ssotCategory = dominantCategory(position)

      if (desc) {
        items.push({
          key: desc.id,
          jobTitle: desc.jobTitle,
          kind: 'verified',
          descriptorId: desc.id,
          socCode: desc.socCode,
          occupationFocalizaScore: lookupFocaliza(desc.socCode),
          employeeCount: count,
          standardJobLevel: desc.standardJobLevel,
          // SSOT primario, fallback al cache JobDescriptor (snapshot histórico)
          standardCategory: ssotCategory ?? desc.standardCategory,
        })
        seenDescriptorKeys.add(desc.id)
        continue
      }

      const mappedSoc = mapByNorm.get(n) ?? null
      const focaliza = lookupFocaliza(mappedSoc)

      if (mappedSoc && focaliza !== null) {
        items.push({
          key: `prop:${position}`,
          jobTitle: position,
          kind: 'proposed',
          descriptorId: null,
          socCode: mappedSoc,
          occupationFocalizaScore: focaliza,
          employeeCount: count,
          standardJobLevel: null,
          standardCategory: ssotCategory,
        })
      } else {
        items.push({
          key: `unm:${position}`,
          jobTitle: position,
          kind: 'unmapped',
          descriptorId: null,
          socCode: mappedSoc,
          occupationFocalizaScore: null,
          employeeCount: count,
          standardJobLevel: null,
          standardCategory: ssotCategory,
        })
      }
    }

    // 5b. Descriptors confirmados sin empleados activos asociados
    //     (HR creó descriptor pero el cargo rotó). Mostrar igual con count=0.
    for (const d of descriptors) {
      if (seenDescriptorKeys.has(d.id)) continue
      items.push({
        key: d.id,
        jobTitle: d.jobTitle,
        kind: 'verified',
        descriptorId: d.id,
        socCode: d.socCode,
        occupationFocalizaScore: lookupFocaliza(d.socCode),
        employeeCount: 0,
        standardJobLevel: d.standardJobLevel,
        standardCategory: d.standardCategory,
      })
    }

    // ── 6. Ordenar: verified > proposed > unmapped, luego por count desc ─
    const kindOrder: Record<SimulatorListKind, number> = {
      verified: 0,
      proposed: 1,
      unmapped: 2,
    }
    items.sort((a, b) => {
      if (kindOrder[a.kind] !== kindOrder[b.kind]) {
        return kindOrder[a.kind] - kindOrder[b.kind]
      }
      if (b.employeeCount !== a.employeeCount) {
        return b.employeeCount - a.employeeCount
      }
      return a.jobTitle.localeCompare(b.jobTitle, 'es')
    })

    // ── 7. Coverage ─────────────────────────────────────────────────────
    const verified = items.filter(i => i.kind === 'verified').length
    const proposed = items.filter(i => i.kind === 'proposed').length
    const unmapped = items.filter(i => i.kind === 'unmapped').length
    const totalCargos = items.length
    const coverage: SimulatorListCoverage = {
      totalCargos,
      verified,
      proposed,
      unmapped,
      coveragePct: totalCargos > 0 ? Math.round((verified / totalCargos) * 100) : 0,
    }

    return NextResponse.json({ success: true, data: items, coverage })
  } catch (error: any) {
    console.error('[descriptors/simulator-list] GET error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    )
  }
}
