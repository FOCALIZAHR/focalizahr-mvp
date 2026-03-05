// ════════════════════════════════════════════════════════════════════════════
// SUCCESSION SERVICE - Pipeline de Sucesión
// src/lib/services/SuccessionService.ts
// ════════════════════════════════════════════════════════════════════════════
// Maqueta funcional usando datos existentes:
// - PerformanceRating.successionReadiness
// - PerformanceRating.targetRoles (Json array of strings)
// ════════════════════════════════════════════════════════════════════════════

import { prisma } from '@/lib/prisma'

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

export type ReadinessLevel = 'ready_now' | 'ready_1_year' | 'ready_2_years' | 'not_ready'

interface RawCandidate {
  employeeId: string
  employeeName: string
  position: string | null
  successionReadiness: string
  targetRoles: string[]
  nineBoxPosition: string | null
  calculatedScore: number
}

export interface UncoveredRole {
  role: string
  bestCandidate: {
    name: string
    readiness: string
    readinessLabel: string
  } | null
}

export interface SuccessionSummary {
  // Gauge: cobertura
  coverage: number          // 0-100%
  coveredRoles: number      // roles con al menos 1 ready_now o ready_1_year
  totalRoles: number        // total de roles únicos en targetRoles

  // Lista: roles sin sucesor inmediato
  uncoveredRoles: UncoveredRole[]

  // Pipeline bench
  bench: {
    readyNow: number
    ready1to2Years: number
    notReady: number
  }

  // Has any data at all
  hasData: boolean
}

// ════════════════════════════════════════════════════════════════════════════
// READINESS LABELS
// ════════════════════════════════════════════════════════════════════════════

const READINESS_LABELS: Record<string, string> = {
  ready_now: 'Listo ahora',
  ready_1_year: '1 año',
  ready_2_years: '2+ años',
  not_ready: 'No listo'
}

const READINESS_PRIORITY: Record<string, number> = {
  ready_now: 1,
  ready_1_year: 2,
  ready_2_years: 3,
  not_ready: 4
}

// ════════════════════════════════════════════════════════════════════════════
// SERVICE
// ════════════════════════════════════════════════════════════════════════════

export class SuccessionService {

  /**
   * Calcula resumen completo de sucesión para el Executive Hub.
   */
  static async getSuccessionSummary(
    cycleId: string,
    accountId: string,
    departmentIds?: string[]
  ): Promise<SuccessionSummary> {

    // Fetch all ratings with succession data
    const where: any = {
      cycleId,
      accountId,
      targetRoles: { not: null as any },
      employee: { status: 'ACTIVE' }
    }

    // Para Prisma, "not: null" en campos Json filtra los que tienen datos
    // Pero Json null check es diferente. Usamos un approach que filtra post-query.

    if (departmentIds?.length) {
      where.employee.departmentId = { in: departmentIds }
    }

    const ratings = await prisma.performanceRating.findMany({
      where: {
        cycleId,
        accountId,
        employee: {
          status: 'ACTIVE',
          ...(departmentIds?.length ? { departmentId: { in: departmentIds } } : {})
        }
      },
      select: {
        employeeId: true,
        successionReadiness: true,
        targetRoles: true,
        nineBoxPosition: true,
        calculatedScore: true,
        employee: {
          select: {
            fullName: true,
            position: true
          }
        }
      }
    })

    // Filter to only those with targetRoles data
    const candidates: RawCandidate[] = []
    for (const r of ratings) {
      if (!r.targetRoles || !r.successionReadiness) continue

      // targetRoles is Json — parse it safely
      let roles: string[] = []
      if (Array.isArray(r.targetRoles)) {
        roles = r.targetRoles as string[]
      } else if (typeof r.targetRoles === 'string') {
        try { roles = JSON.parse(r.targetRoles) } catch { continue }
      }

      if (roles.length === 0) continue

      candidates.push({
        employeeId: r.employeeId,
        employeeName: r.employee.fullName,
        position: r.employee.position,
        successionReadiness: r.successionReadiness,
        targetRoles: roles,
        nineBoxPosition: r.nineBoxPosition,
        calculatedScore: r.calculatedScore
      })
    }

    // Empty state
    if (candidates.length === 0) {
      return {
        coverage: 0,
        coveredRoles: 0,
        totalRoles: 0,
        uncoveredRoles: [],
        bench: { readyNow: 0, ready1to2Years: 0, notReady: 0 },
        hasData: false
      }
    }

    // ── Build role → candidates map ──
    const roleCandidatesMap = new Map<string, RawCandidate[]>()
    for (const c of candidates) {
      for (const role of c.targetRoles) {
        const existing = roleCandidatesMap.get(role) || []
        existing.push(c)
        roleCandidatesMap.set(role, existing)
      }
    }

    // ── Gauge: Cobertura ──
    const totalRoles = roleCandidatesMap.size
    let coveredRoles = 0

    for (const [, roleCandidates] of roleCandidatesMap) {
      const hasReadyCandidate = roleCandidates.some(c =>
        c.successionReadiness === 'ready_now' || c.successionReadiness === 'ready_1_year'
      )
      if (hasReadyCandidate) coveredRoles++
    }

    const coverage = totalRoles > 0 ? Math.round((coveredRoles / totalRoles) * 100) : 0

    // ── Roles sin sucesor inmediato (no ready_now) ──
    const uncoveredRoles: UncoveredRole[] = []
    for (const [role, roleCandidates] of roleCandidatesMap) {
      const hasReadyNow = roleCandidates.some(c => c.successionReadiness === 'ready_now')

      if (!hasReadyNow) {
        // Find best available candidate (sorted by readiness priority)
        const sorted = [...roleCandidates].sort((a, b) =>
          (READINESS_PRIORITY[a.successionReadiness] || 99) -
          (READINESS_PRIORITY[b.successionReadiness] || 99)
        )

        const best = sorted[0]
        uncoveredRoles.push({
          role,
          bestCandidate: best ? {
            name: best.employeeName,
            readiness: best.successionReadiness,
            readinessLabel: READINESS_LABELS[best.successionReadiness] || best.successionReadiness
          } : null
        })
      }
    }

    // Sort uncovered: those with no candidate at all first, then by readiness
    uncoveredRoles.sort((a, b) => {
      if (!a.bestCandidate && b.bestCandidate) return -1
      if (a.bestCandidate && !b.bestCandidate) return 1
      if (!a.bestCandidate || !b.bestCandidate) return 0
      return (READINESS_PRIORITY[a.bestCandidate.readiness] || 99) -
             (READINESS_PRIORITY[b.bestCandidate.readiness] || 99)
    })

    // ── Bench por readiness ──
    const readyNow = candidates.filter(c => c.successionReadiness === 'ready_now').length
    const ready1to2 = candidates.filter(c =>
      c.successionReadiness === 'ready_1_year' || c.successionReadiness === 'ready_2_years'
    ).length
    const notReady = candidates.filter(c => c.successionReadiness === 'not_ready').length

    return {
      coverage,
      coveredRoles,
      totalRoles,
      uncoveredRoles,
      bench: {
        readyNow,
        ready1to2Years: ready1to2,
        notReady
      },
      hasData: true
    }
  }

  /**
   * Lightweight version for summary API (no uncovered details).
   */
  static async getSuccessionCoverage(
    cycleId: string,
    accountId: string,
    departmentIds?: string[]
  ): Promise<{ coverage: number; uncoveredCount: number; hasData: boolean }> {
    const summary = await this.getSuccessionSummary(cycleId, accountId, departmentIds)
    return {
      coverage: summary.coverage,
      uncoveredCount: summary.uncoveredRoles.length,
      hasData: summary.hasData
    }
  }
}
