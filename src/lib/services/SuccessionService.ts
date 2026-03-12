// ════════════════════════════════════════════════════════════════════════════
// SUCCESSION SERVICE - Sucesion Inteligente
// src/lib/services/SuccessionService.ts
// ════════════════════════════════════════════════════════════════════════════
// Servicio core que opera sobre CriticalPosition + SuccessionCandidate.
// Mantiene backward compat con Executive Hub via getSuccessionSummary().
// ════════════════════════════════════════════════════════════════════════════

import { prisma } from '@/lib/prisma'
import { ReadinessLevel, BenchStrengthLevel } from '@prisma/client'
import { getChildDepartmentIds } from '@/lib/services/AuthorizationService'
import {
  ROLEFIT_THRESHOLD,
  SUCCESSION_ELIGIBLE_NINEBOX,
  READINESS_THRESHOLDS,
  READINESS_ORDER,
  READINESS_LABELS,
  READINESS_SYNC_MAP,
  BENCH_STRENGTH_RULES,
  categorizeCompetency,
  sortCandidates,
} from '@/config/successionConstants'

// ════════════════════════════════════════════════════════════════════════════
// TYPES (backward compat con Executive Hub)
// ════════════════════════════════════════════════════════════════════════════

export interface UncoveredRole {
  role: string
  bestCandidate: {
    name: string
    readiness: string
    readinessLabel: string
  } | null
}

export interface SuccessionSummary {
  coverage: number
  coveredRoles: number
  totalRoles: number
  uncoveredRoles: UncoveredRole[]
  bench: {
    readyNow: number
    ready1to2Years: number
    notReady: number
  }
  hasData: boolean
}

export type SuccessionGapStatus =
  | 'READY'          // actualScore >= targetObjectiveRole
  | 'GAP_SMALL'      // gap between 0 and -1
  | 'GAP_CRITICAL'   // gap <= -1
  | 'NOT_EVALUATED'  // never evaluated in current role

export interface CompetencyGapDetail {
  competencyCode: string
  competencyName: string
  category: string
  actualScore: number | null      // null = never evaluated
  targetScore: number             // target for OBJECTIVE role
  targetCurrentRole: number | null // target for candidate's CURRENT role (null = N/A)
  rawGap: number | null           // null if actualScore is null
  fitPercent: number
  status: SuccessionGapStatus
  notEvaluated: boolean
}

export interface MatchResult {
  matchPercent: number
  gaps: CompetencyGapDetail[]
  counts: { critical: number; strategic: number; leadership: number; core: number }
}

export interface EligibilityResult {
  eligible: boolean
  roleFitScore: number | null
  nineBoxPosition: string | null
  potentialAspiration: number | null
  potentialAbility: number | null
  potentialEngagement: number | null
  riskQuadrant: string | null
  riskAlertLevel: string | null
  reasons: string[]
}

export interface SuggestedCandidate {
  employeeId: string
  employeeName: string
  position: string | null
  departmentName: string | null
  roleFitScore: number
  nineBoxPosition: string | null
  potentialAspiration: number | null
  matchPercent: number
  readinessLevel: string
  readinessLabel: string
  flightRisk: string | null
  riskQuadrant: string | null
  mobilityQuadrant: string | null
  gapsCriticalCount: number
  hireDate?: string | null
  gaps?: CompetencyGapDetail[]
}

// ════════════════════════════════════════════════════════════════════════════
// SERVICE
// ════════════════════════════════════════════════════════════════════════════

export class SuccessionService {

  private static deriveFlightRisk(riskQuadrant: string | null | undefined, riskAlertLevel: string | null | undefined): string | null {
    if (riskQuadrant === 'FUGA_CEREBROS') return 'HIGH'
    if (riskAlertLevel === 'RED' || riskAlertLevel === 'ORANGE') return 'MEDIUM'
    return null
  }

  // ──────────────────────────────────────────────────────────────────────────
  // getCurrentCycleId: Busca ciclo activo con datos de roleFit
  // ──────────────────────────────────────────────────────────────────────────

  static async getCurrentCycleId(accountId: string): Promise<string | null> {
    const cycle = await prisma.performanceCycle.findFirst({
      where: {
        accountId,
        status: { in: ['ACTIVE', 'IN_REVIEW', 'COMPLETED'] },
        performanceRatings: {
          some: { roleFitScore: { not: null } }
        }
      },
      orderBy: { endDate: 'desc' },
      select: { id: true }
    })
    return cycle?.id ?? null
  }

  // ──────────────────────────────────────────────────────────────────────────
  // checkEligibility: Verifica 3 condiciones para ser candidato
  // ──────────────────────────────────────────────────────────────────────────

  static async checkEligibility(
    employeeId: string,
    cycleId: string
  ): Promise<EligibilityResult> {
    const rating = await prisma.performanceRating.findUnique({
      where: {
        cycleId_employeeId: { cycleId, employeeId }
      },
      select: {
        roleFitScore: true,
        nineBoxPosition: true,
        potentialAspiration: true,
        potentialAbility: true,
        potentialEngagement: true,
        riskQuadrant: true,
        riskAlertLevel: true,
      }
    })

    if (!rating) {
      return {
        eligible: false,
        roleFitScore: null,
        nineBoxPosition: null,
        potentialAspiration: null,
        potentialAbility: null,
        potentialEngagement: null,
        riskQuadrant: null,
        riskAlertLevel: null,
        reasons: ['Sin evaluacion en este ciclo']
      }
    }

    const reasons: string[] = []
    const roleFit = rating.roleFitScore ?? 0
    const nineBox = rating.nineBoxPosition
    const aspiration = rating.potentialAspiration

    if (roleFit < ROLEFIT_THRESHOLD) {
      reasons.push(`Role Fit ${Math.round(roleFit)}% < ${ROLEFIT_THRESHOLD}% requerido`)
    }
    if (!nineBox || !SUCCESSION_ELIGIBLE_NINEBOX.includes(nineBox)) {
      reasons.push(`9-Box "${nineBox || 'sin asignar'}" no elegible`)
    }
    if (aspiration === 1) {
      reasons.push('Aspiracion nivel 1 (no desea crecer)')
    }

    return {
      eligible: reasons.length === 0,
      roleFitScore: roleFit,
      nineBoxPosition: nineBox,
      potentialAspiration: aspiration,
      potentialAbility: rating.potentialAbility ?? null,
      potentialEngagement: rating.potentialEngagement ?? null,
      riskQuadrant: rating.riskQuadrant ?? null,
      riskAlertLevel: rating.riskAlertLevel ?? null,
      reasons,
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // calculateMatch: Gap analysis contra el nivel TARGET (no el actual)
  // ──────────────────────────────────────────────────────────────────────────

  static async calculateMatch(
    employeeId: string,
    targetJobLevel: string,
    cycleId: string,
    accountId: string
  ): Promise<MatchResult> {
    console.time('[CalcMatch] TOTAL')
    // Batch 1: 3 independent reads in parallel
    console.time('[CalcMatch] Batch 1: targets + scores + employee')
    const [targets, competencyScores, employee] = await Promise.all([
      prisma.competencyTarget.findMany({
        where: { accountId, standardJobLevel: targetJobLevel, targetScore: { not: null } },
      }),
      this.getEmployeeScores(employeeId, cycleId),
      prisma.employee.findUnique({
        where: { id: employeeId },
        select: { standardJobLevel: true },
      }),
    ])

    console.timeEnd('[CalcMatch] Batch 1: targets + scores + employee')

    if (targets.length === 0) {
      console.timeEnd('[CalcMatch] TOTAL')
      return { matchPercent: 0, gaps: [], counts: { critical: 0, strategic: 0, leadership: 0, core: 0 } }
    }

    // Batch 2: 2 reads that depend on batch 1 results
    console.time('[CalcMatch] Batch 2: names + currentRoleTargets')
    const [competencyNames, currentRoleTargets] = await Promise.all([
      this.getCompetencyNames(accountId, targets.map(t => t.competencyCode)),
      employee?.standardJobLevel
        ? prisma.competencyTarget.findMany({
            where: { accountId, standardJobLevel: employee.standardJobLevel, targetScore: { not: null } },
          })
        : Promise.resolve([]),
    ])
    console.timeEnd('[CalcMatch] Batch 2: names + currentRoleTargets')
    const currentRoleMap = new Map(currentRoleTargets.map(t => [t.competencyCode, t.targetScore]))

    // 5. Calcular gaps (3-dimension model)
    const gaps: CompetencyGapDetail[] = []
    let totalFitPercent = 0
    let evaluatedCount = 0
    const counts = { critical: 0, strategic: 0, leadership: 0, core: 0 }

    for (const target of targets) {
      const rawScore = competencyScores.get(target.competencyCode)
      const actualScore = rawScore !== undefined ? rawScore : null
      const targetScore = target.targetScore || 1
      const category = categorizeCompetency(target.competencyCode)
      const notEvaluated = actualScore === null
      const rawGap = actualScore !== null ? actualScore - targetScore : null

      let status: SuccessionGapStatus
      if (notEvaluated) {
        status = 'NOT_EVALUATED'
      } else if (rawGap! >= 0) {
        status = 'READY'
      } else if (rawGap! > -1) {
        status = 'GAP_SMALL'
      } else {
        status = 'GAP_CRITICAL'
      }

      // Only count evaluated gaps for matchPercent and gap counts
      if (!notEvaluated) {
        const fitPercent = Math.min((actualScore! / targetScore) * 100, 100)
        totalFitPercent += fitPercent
        evaluatedCount++

        if (rawGap! < 0) {
          const catKey = category.toLowerCase() as keyof typeof counts
          if (catKey === 'strategic' || catKey === 'leadership' || catKey === 'core') {
            counts[catKey]++
          }
        }
        if (rawGap! <= -1) counts.critical++
      }

      gaps.push({
        competencyCode: target.competencyCode,
        competencyName: competencyNames.get(target.competencyCode) || target.competencyCode,
        category,
        actualScore,
        targetScore,
        targetCurrentRole: currentRoleMap.get(target.competencyCode) ?? null,
        rawGap,
        fitPercent: !notEvaluated ? Math.round(Math.min((actualScore! / targetScore) * 100, 100)) : 0,
        status,
        notEvaluated,
      })
    }

    const matchPercent = evaluatedCount > 0
      ? Math.round(totalFitPercent / evaluatedCount)
      : 0

    console.timeEnd('[CalcMatch] TOTAL')
    return {
      matchPercent,
      gaps: gaps.sort((a, b) => {
        if (a.notEvaluated && !b.notEvaluated) return 1
        if (!a.notEvaluated && b.notEvaluated) return -1
        return (a.rawGap ?? 0) - (b.rawGap ?? 0)
      }),
      counts,
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // calculateReadiness: Funcion pura basada en gaps
  // ──────────────────────────────────────────────────────────────────────────

  static calculateReadiness(
    gaps: CompetencyGapDetail[],
    matchScore: number
  ): { level: string; score: number; reasoning: Record<string, unknown>; estimatedMonths: number | null } {
    // Exclude NOT_EVALUATED from readiness calculation
    const evaluatedGaps = gaps.filter(g => !g.notEvaluated && g.status !== 'NOT_EVALUATED')
    const evaluatedMatchScore = evaluatedGaps.length > 0
      ? Math.round(evaluatedGaps.reduce((sum, g) => sum + (g.fitPercent || 0), 0) / evaluatedGaps.length)
      : matchScore
    const gapPercent = 100 - evaluatedMatchScore
    const negativeGaps = evaluatedGaps.filter(g => g.rawGap !== null && g.rawGap < 0)

    // Architecture spec: critical = rawGap <= -1 (any competency)
    const hasCriticalGaps = negativeGaps.some(g => g.rawGap! <= -1)
    // Strategic gaps = any negative gap in STRATEGIC category
    const hasStrategicGaps = negativeGaps.some(g => g.category === 'STRATEGIC')
    const hasLeadershipGaps = negativeGaps.some(g => g.category === 'LEADERSHIP')

    let level: string
    let estimatedMonths: number | null = null
    const reasoning: string[] = []

    // RULE 1: READY NOW — gap < 10% AND no critical gaps (rawGap <= -1)
    if (gapPercent < READINESS_THRESHOLDS.READY_NOW_MAX_GAP && !hasCriticalGaps) {
      level = 'READY_NOW'
      estimatedMonths = 0
      reasoning.push('Gap total < 10% sin brechas criticas')
    }
    // RULE 2: 3+ YEARS — gap > 25% OR strategic gaps
    else if (gapPercent >= READINESS_THRESHOLDS.READY_1_2_MAX_GAP || hasStrategicGaps) {
      level = 'READY_3_PLUS'
      estimatedMonths = 36
      if (hasStrategicGaps) reasoning.push('Gaps en competencias ESTRATEGICAS')
      if (gapPercent > 25) reasoning.push(`Gap total significativo: ${gapPercent.toFixed(0)}%`)
    }
    // RULE 3: 1-2 YEARS — gap 10-25%, or leadership gaps
    else {
      level = 'READY_1_2_YEARS'
      estimatedMonths = Math.round(gapPercent * 0.6 + 6)
      reasoning.push(`Gap total: ${gapPercent.toFixed(0)}%`)
      if (hasLeadershipGaps) reasoning.push('Gaps en competencias de LIDERAZGO')
      if (hasCriticalGaps) reasoning.push('Brechas criticas (<= -1) a priorizar')
    }

    return {
      level,
      score: matchScore,
      reasoning: {
        gapPercent,
        hasCriticalGaps,
        hasStrategicGaps,
        hasLeadershipGaps,
        reasoning,
        thresholds: READINESS_THRESHOLDS,
      },
      estimatedMonths,
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // recalculateFromGaps: Recalculate matchPercent + readiness from gapsJson
  // Used to fix stale stored values from prior nominations
  // ──────────────────────────────────────────────────────────────────────────

  static recalculateFromGaps(candidate: {
    gapsJson: unknown
    matchPercent: number
    readinessLevel: string
  }): { matchPercent: number; readinessLevel: string } {
    const gaps = Array.isArray(candidate.gapsJson) ? candidate.gapsJson as CompetencyGapDetail[] : []
    if (gaps.length === 0) {
      return { matchPercent: candidate.matchPercent, readinessLevel: candidate.readinessLevel }
    }

    // Recalculate matchPercent excluding NOT_EVALUATED
    const evaluated = gaps.filter(g => !g.notEvaluated && g.status !== 'NOT_EVALUATED' && g.actualScore != null)
    const matchPercent = evaluated.length > 0
      ? Math.round(evaluated.reduce((sum, g) => {
          const fit = Math.min(((g.actualScore ?? 0) / (g.targetScore || 1)) * 100, 100)
          return sum + fit
        }, 0) / evaluated.length)
      : candidate.matchPercent

    // Recalculate readiness
    const readiness = this.calculateReadiness(gaps, matchPercent)

    return { matchPercent, readinessLevel: readiness.level }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // calculateBenchStrength: Count candidates por readiness
  // ──────────────────────────────────────────────────────────────────────────

  static async calculateBenchStrength(
    positionId: string
  ): Promise<string> {
    const candidates = await prisma.successionCandidate.findMany({
      where: {
        criticalPositionId: positionId,
        status: 'ACTIVE',
      },
      select: {
        readinessLevel: true,
        readinessOverride: true,
      }
    })

    let readyNow = 0
    let ready12 = 0

    for (const c of candidates) {
      const effective = c.readinessOverride || c.readinessLevel
      if (effective === 'READY_NOW') readyNow++
      else if (effective === 'READY_1_2_YEARS') ready12++
    }

    if (readyNow >= BENCH_STRENGTH_RULES.STRONG.minReadyNow) return 'STRONG'
    if (readyNow >= BENCH_STRENGTH_RULES.MODERATE.minReadyNow && ready12 >= BENCH_STRENGTH_RULES.MODERATE.minReady12) return 'MODERATE'
    if (ready12 >= BENCH_STRENGTH_RULES.WEAK.minReady12) return 'WEAK'
    return 'NONE'
  }

  // ──────────────────────────────────────────────────────────────────────────
  // updateBenchStrength: Recalcula y persiste
  // ──────────────────────────────────────────────────────────────────────────

  static async updateBenchStrength(positionId: string): Promise<void> {
    const strength = await this.calculateBenchStrength(positionId)
    await prisma.criticalPosition.update({
      where: { id: positionId },
      data: {
        benchStrength: strength as BenchStrengthLevel,
        benchCalculatedAt: new Date(),
      }
    })
  }

  // ──────────────────────────────────────────────────────────────────────────
  // getSuggestedCandidates: Busca empleados elegibles no nominados
  // ──────────────────────────────────────────────────────────────────────────

  static async getSuggestedCandidates(
    positionId: string,
    options: { filterByArea?: boolean } = {}
  ): Promise<SuggestedCandidate[]> {
    console.time('[Suggestions] TOTAL')
    console.time('[Suggestions] Paso 1: position + cycleId')
    // Get the position details
    const position = await prisma.criticalPosition.findUnique({
      where: { id: positionId },
      select: {
        accountId: true,
        standardJobLevel: true,
        departmentId: true,
        incumbentId: true,
        candidates: { select: { employeeId: true, status: true } },
      }
    })

    if (!position) { console.timeEnd('[Suggestions] TOTAL'); return [] }

    const cycleId = await this.getCurrentCycleId(position.accountId)
    if (!cycleId) { console.timeEnd('[Suggestions] TOTAL'); return [] }
    console.timeEnd('[Suggestions] Paso 1: position + cycleId')

    // Exclude already-nominated + incumbent
    const excludeIds = [
      ...position.candidates.map(c => c.employeeId),
      ...(position.incumbentId ? [position.incumbentId] : []),
    ]

    // Build employee filter
    const employeeWhere: any = {
      accountId: position.accountId,
      status: 'ACTIVE',
      id: excludeIds.length > 0 ? { notIn: excludeIds } : undefined,
    }

    if (options.filterByArea && position.departmentId) {
      const childIds = await getChildDepartmentIds(position.departmentId)
      employeeWhere.departmentId = { in: [position.departmentId, ...childIds] }
    }

    // Get eligible employees with their ratings
    console.time('[Suggestions] Paso 2: ratings findMany')
    const ratings = await prisma.performanceRating.findMany({
      where: {
        cycleId,
        accountId: position.accountId,
        roleFitScore: { gte: ROLEFIT_THRESHOLD },
        nineBoxPosition: { in: SUCCESSION_ELIGIBLE_NINEBOX },
        employee: employeeWhere,
      },
      select: {
        employeeId: true,
        roleFitScore: true,
        nineBoxPosition: true,
        potentialAspiration: true,
        riskAlertLevel: true,
        riskQuadrant: true,
        mobilityQuadrant: true,
        employee: {
          select: {
            id: true,
            fullName: true,
            position: true,
            standardJobLevel: true,
            hireDate: true,
            department: { select: { displayName: true } },
          }
        }
      }
    })

    console.timeEnd('[Suggestions] Paso 2: ratings findMany')

    // Filter out aspiration=1
    const eligible = ratings.filter(r => r.potentialAspiration !== 1)
    if (eligible.length === 0) { console.timeEnd('[Suggestions] TOTAL'); return [] }

    console.log(`[Suggestions] Eligible employees: ${eligible.length}`)
    const employeeIds = eligible.map(r => r.employeeId)

    // ── PRE-FETCH: all data needed for match calculation (replaces N*5 queries) ──

    console.time('[Suggestions] Paso 3: targets + names')
    // Q1: CompetencyTarget for OBJECTIVE job level
    const targets = await prisma.competencyTarget.findMany({
      where: {
        accountId: position.accountId,
        standardJobLevel: position.standardJobLevel,
        targetScore: { not: null },
      }
    })

    if (targets.length === 0) { console.timeEnd('[Suggestions] TOTAL'); return [] }

    // Q2: Competency names
    const competencyNames = await this.getCompetencyNames(
      position.accountId,
      targets.map(t => t.competencyCode)
    )
    console.timeEnd('[Suggestions] Paso 3: targets + names')
    console.log(`[Suggestions] Targets: ${targets.length}, CompetencyCodes: ${competencyNames.size}`)

    // Q3+Q4: Batch employee scores
    console.time('[Suggestions] Paso 4: getBatchEmployeeScores')
    const batchScores = await this.getBatchEmployeeScores(employeeIds, cycleId)
    console.timeEnd('[Suggestions] Paso 4: getBatchEmployeeScores')

    // Q5: Current role targets for all unique job levels among candidates
    console.time('[Suggestions] Paso 5: currentRoleTargets')
    const uniqueJobLevels = [...new Set(eligible.map(r => r.employee.standardJobLevel).filter(Boolean))] as string[]
    const allCurrentRoleTargets = uniqueJobLevels.length > 0
      ? await prisma.competencyTarget.findMany({
          where: {
            accountId: position.accountId,
            standardJobLevel: { in: uniqueJobLevels },
            targetScore: { not: null },
          }
        })
      : []
    // Map: jobLevel -> Map<competencyCode, targetScore>
    const currentRoleTargetsByLevel = new Map<string, Map<string, number | null>>()
    for (const t of allCurrentRoleTargets) {
      if (!currentRoleTargetsByLevel.has(t.standardJobLevel)) {
        currentRoleTargetsByLevel.set(t.standardJobLevel, new Map())
      }
      currentRoleTargetsByLevel.get(t.standardJobLevel)!.set(t.competencyCode, t.targetScore)
    }

    console.timeEnd('[Suggestions] Paso 5: currentRoleTargets')

    // ── LOOP: pure computation, zero queries ──
    console.time('[Suggestions] Paso 6: gap computation loop')
    const suggestions: SuggestedCandidate[] = []

    for (const r of eligible) {
      const competencyScores = batchScores.get(r.employeeId) || new Map<string, number>()
      const currentRoleMap = r.employee.standardJobLevel
        ? (currentRoleTargetsByLevel.get(r.employee.standardJobLevel) || new Map())
        : new Map<string, number | null>()

      // Inline gap calculation (3-dimension model)
      const gaps: CompetencyGapDetail[] = []
      let totalFitPercent = 0
      let evaluatedCount = 0
      const counts = { critical: 0, strategic: 0, leadership: 0, core: 0 }

      for (const target of targets) {
        const rawScore = competencyScores.get(target.competencyCode)
        const actualScore = rawScore !== undefined ? rawScore : null
        const targetScore = target.targetScore || 1
        const category = categorizeCompetency(target.competencyCode)
        const notEvaluated = actualScore === null
        const rawGap = actualScore !== null ? actualScore - targetScore : null

        let status: SuccessionGapStatus
        if (notEvaluated) {
          status = 'NOT_EVALUATED'
        } else if (rawGap! >= 0) {
          status = 'READY'
        } else if (rawGap! > -1) {
          status = 'GAP_SMALL'
        } else {
          status = 'GAP_CRITICAL'
        }

        if (!notEvaluated) {
          const fitPercent = Math.min((actualScore! / targetScore) * 100, 100)
          totalFitPercent += fitPercent
          evaluatedCount++

          if (rawGap! < 0) {
            const catKey = category.toLowerCase() as keyof typeof counts
            if (catKey === 'strategic' || catKey === 'leadership' || catKey === 'core') {
              counts[catKey]++
            }
          }
          if (rawGap! <= -1) counts.critical++
        }

        gaps.push({
          competencyCode: target.competencyCode,
          competencyName: competencyNames.get(target.competencyCode) || target.competencyCode,
          category,
          actualScore,
          targetScore,
          targetCurrentRole: currentRoleMap.get(target.competencyCode) ?? null,
          rawGap,
          fitPercent: !notEvaluated ? Math.round(Math.min((actualScore! / targetScore) * 100, 100)) : 0,
          status,
          notEvaluated,
        })
      }

      const matchPercent = evaluatedCount > 0
        ? Math.round(totalFitPercent / evaluatedCount)
        : 0
      const sortedGaps = gaps.sort((a, b) => {
        // NOT_EVALUATED last, then by rawGap ascending
        if (a.notEvaluated && !b.notEvaluated) return 1
        if (!a.notEvaluated && b.notEvaluated) return -1
        return (a.rawGap ?? 0) - (b.rawGap ?? 0)
      })

      const readiness = this.calculateReadiness(sortedGaps, matchPercent)
      const flightRisk = this.deriveFlightRisk(r.riskQuadrant, r.riskAlertLevel)

      suggestions.push({
        employeeId: r.employeeId,
        employeeName: r.employee.fullName,
        position: r.employee.position,
        departmentName: r.employee.department?.displayName ?? null,
        roleFitScore: r.roleFitScore ?? 0,
        nineBoxPosition: r.nineBoxPosition,
        potentialAspiration: r.potentialAspiration ?? null,
        matchPercent,
        readinessLevel: readiness.level,
        readinessLabel: READINESS_LABELS[readiness.level] || readiness.level,
        flightRisk,
        riskQuadrant: r.riskQuadrant ?? null,
        mobilityQuadrant: r.mobilityQuadrant ?? null,
        gapsCriticalCount: counts.critical,
        hireDate: r.employee.hireDate?.toISOString() ?? null,
        gaps: sortedGaps,
      })
    }

    console.timeEnd('[Suggestions] Paso 6: gap computation loop')
    console.timeEnd('[Suggestions] TOTAL')
    return sortCandidates(suggestions)
  }

  // ──────────────────────────────────────────────────────────────────────────
  // nominateCandidate: Nominar a un empleado para una posicion critica
  // ──────────────────────────────────────────────────────────────────────────

  static async nominateCandidate(
    positionId: string,
    employeeId: string,
    nominatedBy: string
  ): Promise<{ success: boolean; candidateId?: string; cycleId?: string; error?: string }> {
    console.time('[Nominate] TOTAL')
    // 1. Get position
    console.time('[Nominate] Paso 1: position + cycleId')
    const position = await prisma.criticalPosition.findUnique({
      where: { id: positionId },
      select: { accountId: true, standardJobLevel: true },
    })
    if (!position) { console.timeEnd('[Nominate] TOTAL'); return { success: false, error: 'Posicion no encontrada' } }

    // 2. Get current cycle (ONCE — passed down to all subsequent calls)
    const cycleId = await this.getCurrentCycleId(position.accountId)
    if (!cycleId) { console.timeEnd('[Nominate] TOTAL'); return { success: false, error: 'Sin ciclo activo con datos de Role Fit' } }
    console.timeEnd('[Nominate] Paso 1: position + cycleId')

    // 3+4. Eligibility + duplicate check in parallel (independent reads)
    console.time('[Nominate] Paso 2: eligibility + duplicate check')
    const [eligibility, existing] = await Promise.all([
      this.checkEligibility(employeeId, cycleId),
      prisma.successionCandidate.findUnique({
        where: {
          criticalPositionId_employeeId: { criticalPositionId: positionId, employeeId }
        }
      }),
    ])

    console.timeEnd('[Nominate] Paso 2: eligibility + duplicate check')

    if (!eligibility.eligible) {
      console.timeEnd('[Nominate] TOTAL'); return { success: false, error: `No elegible: ${eligibility.reasons.join(', ')}` }
    }
    if (existing) {
      console.timeEnd('[Nominate] TOTAL'); return { success: false, error: 'Ya nominado para esta posicion' }
    }

    // 5. Calculate match + readiness (cycleId passed, no re-fetch)
    console.time('[Nominate] Paso 3: calculateMatch')
    const match = await this.calculateMatch(
      employeeId,
      position.standardJobLevel,
      cycleId,
      position.accountId
    )
    const readiness = this.calculateReadiness(match.gaps, match.matchPercent)
    console.timeEnd('[Nominate] Paso 3: calculateMatch')

    // 6. ELIMINATED — rating data now comes from expanded checkEligibility
    const flightRisk = this.deriveFlightRisk(eligibility.riskQuadrant, eligibility.riskAlertLevel)

    // 7. Create candidate
    console.time('[Nominate] Paso 4: create + benchStrength')
    const candidate = await prisma.successionCandidate.create({
      data: {
        accountId: position.accountId,
        criticalPositionId: positionId,
        employeeId,
        currentRoleFit: eligibility.roleFitScore ?? 0,
        passedThreshold: true,
        nineBoxPosition: eligibility.nineBoxPosition,
        aspirationLevel: eligibility.potentialAspiration,
        matchPercent: match.matchPercent,
        gapsJson: JSON.parse(JSON.stringify(match.gaps)),
        gapsCriticalCount: match.counts.critical,
        gapsStrategicCount: match.counts.strategic,
        gapsLeadershipCount: match.counts.leadership,
        readinessLevel: readiness.level as ReadinessLevel,
        readinessScore: readiness.score,
        readinessReasoning: JSON.parse(JSON.stringify(readiness.reasoning)),
        estimatedMonths: readiness.estimatedMonths,
        flightRisk,
        ability: eligibility.potentialAbility,
        engagement: eligibility.potentialEngagement,
        nominatedBy,
        status: 'ACTIVE',
      }
    })

    // 8. Recalculate bench strength
    await this.updateBenchStrength(positionId)
    console.timeEnd('[Nominate] Paso 4: create + benchStrength')

    console.timeEnd('[Nominate] TOTAL')
    return { success: true, candidateId: candidate.id, cycleId }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // getSuccessionSummary: BACKWARD COMPATIBLE con Executive Hub
  // Reads from CriticalPosition + SuccessionCandidate, returns same type
  // ──────────────────────────────────────────────────────────────────────────

  static async getSuccessionSummary(
    cycleId: string,
    accountId: string,
    departmentIds?: string[]
  ): Promise<SuccessionSummary> {
    // Try new model first
    const positionWhere: any = {
      accountId,
      isActive: true,
    }
    if (departmentIds?.length) {
      positionWhere.departmentId = { in: departmentIds }
    }

    const positions = await prisma.criticalPosition.findMany({
      where: positionWhere,
      select: {
        id: true,
        positionTitle: true,
        benchStrength: true,
        candidates: {
          where: { status: 'ACTIVE' },
          select: {
            readinessLevel: true,
            readinessOverride: true,
            employee: { select: { fullName: true } },
          }
        }
      }
    })

    // If no critical positions exist yet, fall back to legacy PerformanceRating logic
    if (positions.length === 0) {
      return this.getLegacySuccessionSummary(cycleId, accountId, departmentIds)
    }

    const totalRoles = positions.length
    let coveredRoles = 0
    let benchReadyNow = 0
    let benchReady12 = 0
    let benchNotReady = 0
    const uncoveredRoles: UncoveredRole[] = []

    const sortOrderMap = new Map<number, number>()

    for (const pos of positions) {
      let hasReadyNow = false
      let hasCovered = false
      let bestCandidate: UncoveredRole['bestCandidate'] = null
      let bestOrder = 99

      for (const c of pos.candidates) {
        const effective = c.readinessOverride || c.readinessLevel
        const order = READINESS_ORDER[effective] ?? 99

        if (effective === 'READY_NOW') {
          benchReadyNow++
          hasReadyNow = true
          hasCovered = true
        } else if (effective === 'READY_1_2_YEARS') {
          benchReady12++
          hasCovered = true
        } else {
          benchNotReady++
        }

        if (order < bestOrder) {
          bestOrder = order
          bestCandidate = {
            name: c.employee.fullName,
            readiness: READINESS_SYNC_MAP[effective] || effective,
            readinessLabel: READINESS_LABELS[effective] || effective,
          }
        }
      }

      if (hasCovered) coveredRoles++

      if (!hasReadyNow) {
        uncoveredRoles.push({
          role: pos.positionTitle,
          bestCandidate: pos.candidates.length > 0 ? bestCandidate : null,
        })
        sortOrderMap.set(uncoveredRoles.length - 1, pos.candidates.length > 0 ? bestOrder : 99)
      }
    }

    // Sort uncovered: by readiness order (no candidate = 99, worst last)
    const indexed = uncoveredRoles.map((r, i) => ({ r, order: sortOrderMap.get(i) ?? 99 }))
    indexed.sort((a, b) => a.order - b.order)
    uncoveredRoles.length = 0
    uncoveredRoles.push(...indexed.map(x => x.r))

    return {
      coverage: totalRoles > 0 ? Math.round((coveredRoles / totalRoles) * 100) : 0,
      coveredRoles,
      totalRoles,
      uncoveredRoles,
      bench: { readyNow: benchReadyNow, ready1to2Years: benchReady12, notReady: benchNotReady },
      hasData: true,
    }
  }

  /**
   * Lightweight version for summary API (backward compat).
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
      hasData: summary.hasData,
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // PRIVATE: Legacy fallback (reads from PerformanceRating.targetRoles)
  // ──────────────────────────────────────────────────────────────────────────

  private static async getLegacySuccessionSummary(
    cycleId: string,
    accountId: string,
    departmentIds?: string[]
  ): Promise<SuccessionSummary> {
    const LEGACY_READINESS_PRIORITY: Record<string, number> = {
      ready_now: 1, ready_1_year: 2, ready_1_2_years: 2, ready_2_years: 3,
      needs_development: 3, not_ready: 4, not_suitable: 4,
    }
    const LEGACY_LABELS: Record<string, string> = {
      ready_now: 'Listo ahora', ready_1_year: '1 año', ready_1_2_years: '1-2 años',
      ready_2_years: '2+ años', needs_development: 'En desarrollo', not_ready: 'No listo',
      not_suitable: 'No apto',
    }

    const ratings = await prisma.performanceRating.findMany({
      where: {
        cycleId,
        accountId,
        employee: {
          status: 'ACTIVE',
          ...(departmentIds?.length ? { departmentId: { in: departmentIds } } : {}),
        },
      },
      select: {
        employeeId: true,
        successionReadiness: true,
        targetRoles: true,
        employee: { select: { fullName: true } },
      },
    })

    interface LegacyCandidate {
      employeeName: string
      successionReadiness: string
      targetRoles: string[]
    }

    const candidates: LegacyCandidate[] = []
    for (const r of ratings) {
      if (!r.targetRoles || !r.successionReadiness) continue
      let roles: string[] = []
      if (Array.isArray(r.targetRoles)) roles = r.targetRoles as string[]
      else if (typeof r.targetRoles === 'string') {
        try { roles = JSON.parse(r.targetRoles) } catch { continue }
      }
      if (roles.length === 0) continue
      candidates.push({
        employeeName: r.employee.fullName,
        successionReadiness: r.successionReadiness,
        targetRoles: roles,
      })
    }

    if (candidates.length === 0) {
      return { coverage: 0, coveredRoles: 0, totalRoles: 0, uncoveredRoles: [], bench: { readyNow: 0, ready1to2Years: 0, notReady: 0 }, hasData: false }
    }

    const roleCandidatesMap = new Map<string, LegacyCandidate[]>()
    for (const c of candidates) {
      for (const role of c.targetRoles) {
        const existing = roleCandidatesMap.get(role) || []
        existing.push(c)
        roleCandidatesMap.set(role, existing)
      }
    }

    const totalRoles = roleCandidatesMap.size
    let coveredRoles = 0
    const uncoveredRoles: UncoveredRole[] = []

    for (const [role, roleCands] of roleCandidatesMap) {
      const hasReady = roleCands.some(c =>
        c.successionReadiness === 'ready_now' || c.successionReadiness === 'ready_1_year' || c.successionReadiness === 'ready_1_2_years'
      )
      if (hasReady) coveredRoles++

      const hasReadyNow = roleCands.some(c => c.successionReadiness === 'ready_now')
      if (!hasReadyNow) {
        const sorted = [...roleCands].sort((a, b) =>
          (LEGACY_READINESS_PRIORITY[a.successionReadiness] ?? 99) -
          (LEGACY_READINESS_PRIORITY[b.successionReadiness] ?? 99)
        )
        const best = sorted[0]
        uncoveredRoles.push({
          role,
          bestCandidate: best ? {
            name: best.employeeName,
            readiness: best.successionReadiness,
            readinessLabel: LEGACY_LABELS[best.successionReadiness] || best.successionReadiness,
          } : null,
        })
      }
    }

    uncoveredRoles.sort((a, b) => {
      if (!a.bestCandidate && b.bestCandidate) return -1
      if (a.bestCandidate && !b.bestCandidate) return 1
      if (!a.bestCandidate || !b.bestCandidate) return 0
      return (LEGACY_READINESS_PRIORITY[a.bestCandidate.readiness] ?? 99) -
             (LEGACY_READINESS_PRIORITY[b.bestCandidate.readiness] ?? 99)
    })

    const readyNow = candidates.filter(c => c.successionReadiness === 'ready_now').length
    const ready12 = candidates.filter(c =>
      ['ready_1_year', 'ready_1_2_years', 'ready_2_years', 'needs_development'].includes(c.successionReadiness)
    ).length
    const notReady = candidates.filter(c =>
      c.successionReadiness === 'not_ready' || c.successionReadiness === 'not_suitable'
    ).length

    return {
      coverage: totalRoles > 0 ? Math.round((coveredRoles / totalRoles) * 100) : 0,
      coveredRoles,
      totalRoles,
      uncoveredRoles,
      bench: { readyNow, ready1to2Years: ready12, notReady },
      hasData: true,
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // PRIVATE HELPERS
  // ──────────────────────────────────────────────────────────────────────────

  private static async getEmployeeScores(
    employeeId: string,
    cycleId: string
  ): Promise<Map<string, number>> {
    const scores = new Map<string, number>()

    try {
      const { PerformanceResultsService } = await import('./PerformanceResultsService')
      const results = await PerformanceResultsService.getEvaluateeResults(cycleId, employeeId)

      if (results?.competencyScores) {
        for (const comp of results.competencyScores) {
          const score = comp.overallAvgScore ?? comp.managerScore ?? 0
          if (score > 0) {
            scores.set(comp.competencyCode, score)
          }
        }
      }
    } catch (err) {
      console.error('[Succession] Error obteniendo scores:', err)
    }

    return scores
  }

  private static async getCompetencyNames(
    accountId: string,
    codes: string[]
  ): Promise<Map<string, string>> {
    const names = new Map<string, string>()
    if (codes.length === 0) return names

    const competencies = await prisma.competency.findMany({
      where: { accountId, code: { in: codes }, isActive: true },
      select: { code: true, name: true },
    })

    for (const c of competencies) {
      names.set(c.code, c.name)
    }
    return names
  }

  // ──────────────────────────────────────────────────────────────────────────
  // getBatchEmployeeScores: Batch version — fetches scores for ALL employees
  // in ~3 queries instead of ~5N queries
  // ──────────────────────────────────────────────────────────────────────────

  private static async getBatchEmployeeScores(
    employeeIds: string[],
    cycleId: string
  ): Promise<Map<string, Map<string, number>>> {
    const result = new Map<string, Map<string, number>>()
    if (employeeIds.length === 0) return result

    // Initialize empty maps for all employees
    for (const id of employeeIds) {
      result.set(id, new Map())
    }

    try {
      // Q1: Fetch cycle for competency snapshot + question mapping (1 query)
      console.time('[BatchScores] Q1: cycle + questions')
      const cycle = await prisma.performanceCycle.findUnique({
        where: { id: cycleId },
        select: {
          competencySnapshot: true,
          campaign: {
            select: {
              campaignType: {
                select: {
                  questions: {
                    select: { id: true, competencyCode: true }
                  }
                }
              }
            }
          }
        }
      })

      console.timeEnd('[BatchScores] Q1: cycle + questions')

      if (!cycle) return result

      const competencies = (cycle.competencySnapshot as unknown as Array<{ code: string }>) || []
      const competencyCodes = competencies.map(c => c.code)
      if (competencyCodes.length === 0) return result

      const questions = cycle.campaign?.campaignType?.questions || []
      const questionToCompetency = new Map<string, string>()
      for (const q of questions) {
        if (q.competencyCode) questionToCompetency.set(q.id, q.competencyCode)
      }

      console.log(`[BatchScores] Employees: ${employeeIds.length}, Competencies: ${competencyCodes.length}, Questions mapped: ${questionToCompetency.size}`)

      // Q2: Batch fetch ALL evaluation assignments for ALL employees (1 query)
      console.time('[BatchScores] Q2: assignments findMany')
      const assignments = await prisma.evaluationAssignment.findMany({
        where: {
          cycleId,
          evaluateeId: { in: employeeIds },
          status: 'COMPLETED',
        },
        select: {
          evaluateeId: true,
          evaluationType: true,
          participant: {
            select: {
              responses: {
                select: {
                  questionId: true,
                  rating: true,
                  normalizedScore: true,
                }
              }
            }
          }
        }
      })

      console.timeEnd('[BatchScores] Q2: assignments findMany')
      console.log(`[BatchScores] Total assignments loaded: ${assignments.length}, total responses: ${assignments.reduce((sum, a) => sum + (a.participant?.responses?.length || 0), 0)}`)

      // Group assignments by evaluateeId
      const assignmentsByEmployee = new Map<string, typeof assignments>()
      for (const a of assignments) {
        const list = assignmentsByEmployee.get(a.evaluateeId) || []
        list.push(a)
        assignmentsByEmployee.set(a.evaluateeId, list)
      }

      // Compute competency scores per employee (in-memory, no queries)
      console.time('[BatchScores] Computation loop')
      const avg = (arr: number[]) => arr.length > 0 ? arr.reduce((s, v) => s + v, 0) / arr.length : null

      for (const empId of employeeIds) {
        const empAssignments = assignmentsByEmployee.get(empId) || []
        const scores = result.get(empId)!

        for (const compCode of competencyCodes) {
          const managerScores: number[] = []
          const allTypeScores: number[] = []

          for (const a of empAssignments) {
            if (!a.participant?.responses) continue

            const relevant = a.participant.responses.filter(r => {
              return questionToCompetency.get(r.questionId) === compCode
            })

            const vals = relevant
              .map(r => r.normalizedScore ?? r.rating)
              .filter((v): v is number => v !== null)

            if (vals.length === 0) continue

            const typeAvg = avg(vals)!

            if (a.evaluationType === 'MANAGER_TO_EMPLOYEE') {
              managerScores.push(typeAvg)
            }
            allTypeScores.push(typeAvg)
          }

          // Replicate getEmployeeScores logic: overallAvgScore ?? managerScore ?? 0
          const overallAvg = avg(allTypeScores)
          const managerAvg = avg(managerScores)
          const score = overallAvg ?? managerAvg ?? 0

          if (score > 0) {
            scores.set(compCode, score)
          }
        }
      }
      console.timeEnd('[BatchScores] Computation loop')
    } catch (err) {
      console.error('[Succession] Error batch employee scores:', err)
    }

    return result
  }

  // ──────────────────────────────────────────────────────────────────────────
  // getChainCoverage: KPI — % de backfills resueltos vs total
  // ──────────────────────────────────────────────────────────────────────────

  static async getChainCoverage(accountId: string): Promise<number | null> {
    const stats = await prisma.successionBackfillPlan.groupBy({
      by: ['resolution'],
      where: { accountId },
      _count: true,
    })
    const total = stats.reduce((sum, s) => sum + s._count, 0)
    if (total === 0) return null
    const resolved = stats
      .filter(s => s.resolution !== 'PENDING')
      .reduce((sum, s) => sum + s._count, 0)
    return Math.round((resolved / total) * 100)
  }

  // ──────────────────────────────────────────────────────────────────────────
  // saveBackfillPlan: Guarda plan de backfill para una nominación
  // ──────────────────────────────────────────────────────────────────────────

  static async saveBackfillPlan(
    candidateId: string,
    data: {
      resolution: string
      backfillEmployeeId?: string
      backfillEmployeeName?: string
      externalReason?: string
    },
    resolvedBy: string
  ): Promise<{ success: boolean; error?: string }> {
    // 1. Buscar candidato + employee
    const candidate = await prisma.successionCandidate.findFirst({
      where: { id: candidateId, status: 'ACTIVE' },
      select: {
        id: true,
        accountId: true,
        employeeId: true,
        employee: {
          select: { position: true, departmentId: true },
        },
      },
    })
    if (!candidate) {
      return { success: false, error: 'Candidato no encontrado o no está activo' }
    }

    // 2. Buscar si el cargo es CriticalPosition con incumbentId = employeeId
    const criticalPos = await prisma.criticalPosition.findFirst({
      where: {
        incumbentId: candidate.employeeId,
        isActive: true,
        accountId: candidate.accountId,
      },
      select: { id: true },
    })

    // 3. Upsert BackfillPlan
    const vacatedPositionTitle = candidate.employee.position || 'Cargo no especificado'
    const isResolved = data.resolution !== 'PENDING'

    await prisma.successionBackfillPlan.upsert({
      where: { sourceCandidateId: candidateId },
      create: {
        accountId: candidate.accountId,
        sourceCandidateId: candidateId,
        vacatedPositionTitle,
        vacatedPositionId: criticalPos?.id ?? null,
        vacatedDepartmentId: candidate.employee.departmentId,
        resolution: data.resolution,
        backfillEmployeeId: data.backfillEmployeeId ?? null,
        backfillEmployeeName: data.backfillEmployeeName ?? null,
        externalReason: data.externalReason ?? null,
        resolvedAt: isResolved ? new Date() : null,
        resolvedBy: isResolved ? resolvedBy : null,
      },
      update: {
        resolution: data.resolution,
        backfillEmployeeId: data.backfillEmployeeId ?? null,
        backfillEmployeeName: data.backfillEmployeeName ?? null,
        externalReason: data.externalReason ?? null,
        resolvedAt: isResolved ? new Date() : null,
        resolvedBy: isResolved ? resolvedBy : null,
      },
    })

    return { success: true }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // detectDominoEffect: Detecta si nominar a un candidato genera backfill
  // detected=true si employee.position existe y no está vacío
  // ──────────────────────────────────────────────────────────────────────────

  static async detectDominoEffect(candidateId: string, accountId: string): Promise<{
    detected: boolean
    nivel1: {
      candidatoId: string
      candidatoNombre: string
      posicionAsume: string
      posicionAsumeId: string
      matchPercent: number
      readinessLevel: string
    }
    nivel2: {
      posicionDejaTitulo: string
      posicionDejaId: string | null
      posicionDejaDepartamento: string | null
      posicionDejaJobLevel: string | null
      vacatedDepartmentId: string | null
      esCargoCritico: boolean
      benchStrength: string | null
      benchStatus: 'HEALTHY' | 'EMPTY' | 'NON_CRITICAL'
      benchCandidates: Array<{
        id: string
        employeeId: string
        employeeName: string
        position: string | null
        departmentName: string | null
        readinessLevel: string
        matchPercent: number
      }>
      candidatosDisponibles: Array<{
        id: string
        employeeId: string
        nombre: string
        cargo: string | null
        matchPercent: number
        readinessLevel: string
      }>
    } | null
  }> {
    const candidate = await prisma.successionCandidate.findFirst({
      where: { id: candidateId, accountId, status: 'ACTIVE' },
      select: {
        id: true,
        employeeId: true,
        matchPercent: true,
        readinessLevel: true,
        readinessOverride: true,
        employee: {
          select: {
            fullName: true,
            position: true,
            departmentId: true,
            department: { select: { displayName: true } },
          },
        },
        criticalPosition: { select: { id: true, positionTitle: true } },
      },
    })
    if (!candidate) {
      return { detected: false, nivel1: { candidatoId: '', candidatoNombre: '', posicionAsume: '', posicionAsumeId: '', matchPercent: 0, readinessLevel: '' }, nivel2: null }
    }

    const nivel1 = {
      candidatoId: candidate.id,
      candidatoNombre: candidate.employee.fullName,
      posicionAsume: candidate.criticalPosition.positionTitle,
      posicionAsumeId: candidate.criticalPosition.id,
      matchPercent: candidate.matchPercent,
      readinessLevel: (candidate.readinessOverride || candidate.readinessLevel) as string,
    }

    // ¿El empleado tiene un cargo definido?
    const employeePosition = candidate.employee.position?.trim()
    if (!employeePosition) {
      return { detected: false, nivel1, nivel2: null }
    }

    // ¿Es incumbent de una CriticalPosition?
    const posicionQueDeja = await prisma.criticalPosition.findFirst({
      where: {
        incumbentId: candidate.employeeId,
        isActive: true,
        accountId,
      },
      include: {
        candidates: {
          where: { status: 'ACTIVE' },
          include: {
            employee: {
              select: {
                id: true, fullName: true, position: true,
                department: { select: { displayName: true } },
              },
            },
          },
        },
        department: { select: { displayName: true } },
      },
    })

    const esCargoCritico = !!posicionQueDeja
    const sorted = posicionQueDeja ? sortCandidates(posicionQueDeja.candidates) : []

    // Derive benchStatus from criticality + candidate count
    const benchStatus: 'HEALTHY' | 'EMPTY' | 'NON_CRITICAL' = !esCargoCritico
      ? 'NON_CRITICAL'
      : sorted.length > 0
        ? 'HEALTHY'
        : 'EMPTY'

    // benchCandidates: enriched view of available successors
    const benchCandidates = sorted.map(c => ({
      id: c.id,
      employeeId: c.employee.id,
      employeeName: c.employee.fullName,
      position: c.employee.position,
      departmentName: (c.employee as any).department?.displayName ?? null,
      readinessLevel: ((c as any).readinessOverride || c.readinessLevel) as string,
      matchPercent: c.matchPercent,
    }))

    return {
      detected: true,
      nivel1,
      nivel2: {
        posicionDejaTitulo: esCargoCritico ? posicionQueDeja!.positionTitle : employeePosition,
        posicionDejaId: posicionQueDeja?.id ?? null,
        posicionDejaDepartamento: esCargoCritico
          ? (posicionQueDeja!.department?.displayName || null)
          : (candidate.employee.department?.displayName || null),
        posicionDejaJobLevel: posicionQueDeja?.standardJobLevel || null,
        vacatedDepartmentId: esCargoCritico
          ? (posicionQueDeja!.departmentId || null)
          : (candidate.employee.departmentId || null),
        esCargoCritico,
        benchStrength: posicionQueDeja?.benchStrength as string || null,
        benchStatus,
        benchCandidates,
        candidatosDisponibles: sorted.map(c => ({
          id: c.id,
          employeeId: c.employee.id,
          nombre: c.employee.fullName,
          cargo: c.employee.position,
          matchPercent: c.matchPercent,
          readinessLevel: ((c as any).readinessOverride || c.readinessLevel) as string,
        })),
      },
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // enrichWithTalentQuadrants: Fetch riskQuadrant + mobilityQuadrant
  // from PerformanceRating for a batch of employees (1 query)
  // ──────────────────────────────────────────────────────────────────────────

  static async enrichWithTalentQuadrants(
    employeeIds: string[],
    accountId: string
  ): Promise<Map<string, { riskQuadrant: string | null; mobilityQuadrant: string | null; riskAlertLevel: string | null }>> {
    const result = new Map<string, { riskQuadrant: string | null; mobilityQuadrant: string | null; riskAlertLevel: string | null }>()
    if (employeeIds.length === 0) return result

    const cycleId = await this.getCurrentCycleId(accountId)
    if (!cycleId) return result

    const ratings = await prisma.performanceRating.findMany({
      where: {
        cycleId,
        employeeId: { in: employeeIds },
      },
      select: {
        employeeId: true,
        riskQuadrant: true,
        mobilityQuadrant: true,
        riskAlertLevel: true,
      },
    })

    for (const r of ratings) {
      result.set(r.employeeId, {
        riskQuadrant: r.riskQuadrant ?? null,
        mobilityQuadrant: r.mobilityQuadrant ?? null,
        riskAlertLevel: r.riskAlertLevel ?? null,
      })
    }

    return result
  }
}
