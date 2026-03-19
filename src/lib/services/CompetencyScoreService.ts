// ════════════════════════════════════════════════════════════════════════════
// COMPETENCY SCORE SERVICE
// src/lib/services/CompetencyScoreService.ts
//
// Calcula scores REALES de competencia a nivel organizacional.
// Extrae la lógica de bulkCompetencyScores + getOrgCompetencyGaps
// que estaba atrapada en capabilities/route.ts
//
// Consumidores:
// - executive-hub/capabilities/route.ts (Strategic Focus)
// - executive-hub/talent/route.ts (ADN Organizacional)
// ════════════════════════════════════════════════════════════════════════════

import { prisma } from '@/lib/prisma'
import {
  resolveEvaluatorWeights,
  calculateWeightedScore,
  type EvaluatorWeights
} from '@/config/performanceClassification'

function numAvg(nums: number[]): number {
  if (nums.length === 0) return 0
  return nums.reduce((a, b) => a + b, 0) / nums.length
}

// ════════════════════════════════════════════════════════════════════════════
// BULK COMPETENCY SCORES
// 2 queries para N empleados (sin N+1)
// Retorna Map<competencyCode, { total, count }> con scores reales promedio
// ════════════════════════════════════════════════════════════════════════════

export async function bulkCompetencyScores(
  cycleId: string,
  employeeIds: string[],
  weights?: EvaluatorWeights
): Promise<Map<string, { total: number; count: number }>> {
  const result = new Map<string, { total: number; count: number }>()
  if (employeeIds.length === 0) return result

  // Query 1: question → competencyCode mapping
  const cycle = await prisma.performanceCycle.findUnique({
    where: { id: cycleId },
    select: {
      campaign: {
        select: {
          campaignType: {
            select: {
              questions: {
                where: { competencyCode: { not: null } },
                select: { id: true, competencyCode: true }
              }
            }
          }
        }
      }
    }
  })

  const questions = cycle?.campaign?.campaignType?.questions || []
  if (questions.length === 0) return result

  const questionToComp = new Map(
    questions.map((q: { id: string; competencyCode: string | null }) => [q.id, q.competencyCode!])
  )

  // Query 2: ALL completed assignments for ALL employees at once
  const assignments = await prisma.evaluationAssignment.findMany({
    where: {
      cycleId,
      evaluateeId: { in: employeeIds },
      status: 'COMPLETED'
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
              normalizedScore: true
            }
          }
        }
      }
    }
  })

  // Group assignments by employee
  const byEmployee = new Map<string, typeof assignments>()
  for (const a of assignments) {
    const arr = byEmployee.get(a.evaluateeId) || []
    arr.push(a)
    byEmployee.set(a.evaluateeId, arr)
  }

  // For each employee: compute per-competency overallAvgScore, then aggregate
  for (const [, empAssignments] of byEmployee) {
    const compBuckets = new Map<string, { self: number[]; mgr: number[]; peer: number[]; up: number[] }>()

    for (const a of empAssignments) {
      if (!a.participant?.responses) continue
      for (const r of a.participant.responses) {
        const compCode = questionToComp.get(r.questionId)
        if (!compCode) continue
        const score = r.normalizedScore ?? r.rating
        if (score === null) continue

        if (!compBuckets.has(compCode)) {
          compBuckets.set(compCode, { self: [], mgr: [], peer: [], up: [] })
        }
        const bucket = compBuckets.get(compCode)!
        switch (a.evaluationType) {
          case 'SELF': bucket.self.push(score); break
          case 'MANAGER_TO_EMPLOYEE': bucket.mgr.push(score); break
          case 'PEER': bucket.peer.push(score); break
          case 'EMPLOYEE_TO_MANAGER': bucket.up.push(score); break
        }
      }
    }

    for (const [code, bucket] of compBuckets) {
      const selfAvg = bucket.self.length ? numAvg(bucket.self) : null
      const mgrAvg = bucket.mgr.length ? numAvg(bucket.mgr) : null
      const peerAvg = bucket.peer.length ? numAvg(bucket.peer) : null
      const upAvg = bucket.up.length ? numAvg(bucket.up) : null

      // Si hay weights, usar ponderación configurable (misma que rating individual)
      // Si no, promedio simple como fallback
      let score: number
      if (weights) {
        score = calculateWeightedScore(
          { self: selfAvg, manager: mgrAvg, peer: peerAvg, upward: upAvg },
          weights
        )
      } else {
        const typeAvgs: number[] = []
        if (selfAvg !== null) typeAvgs.push(selfAvg)
        if (mgrAvg !== null) typeAvgs.push(mgrAvg)
        if (peerAvg !== null) typeAvgs.push(peerAvg)
        if (upAvg !== null) typeAvgs.push(upAvg)
        score = typeAvgs.length > 0 ? numAvg(typeAvgs) : 0
      }

      if (score > 0) {
        const agg = result.get(code) || { total: 0, count: 0 }
        agg.total += score
        agg.count++
        result.set(code, agg)
      }
    }
  }

  return result
}

// ════════════════════════════════════════════════════════════════════════════
// ORG-WIDE COMPETENCY GAPS
// gap = score_real_promedio - target_esperado
// Positivo = la gente supera lo que se les pide (fortaleza)
// Negativo = la gente falla respecto al target (oportunidad)
// ════════════════════════════════════════════════════════════════════════════

export interface OrgCompetencyGap {
  competencyCode: string
  competencyName: string
  gap: number
  actual: number
  expected: number
}

export async function getOrgCompetencyGaps(
  cycleId: string,
  accountId: string,
  departmentIds?: string[]
): Promise<OrgCompetencyGap[]> {
  const where: any = {
    cycleId,
    accountId,
    roleFitScore: { not: null },
    employee: { status: 'ACTIVE' }
  }

  if (departmentIds?.length) {
    where.employee.departmentId = { in: departmentIds }
  }

  // Resolver ponderación: ciclo → config cliente → default FocalizaHR
  const [cycleConfig, ratingConfig] = await Promise.all([
    prisma.performanceCycle.findUnique({
      where: { id: cycleId },
      select: { evaluatorWeightsOverride: true }
    }),
    prisma.performanceRatingConfig.findUnique({
      where: { accountId },
      select: { evaluatorWeights: true }
    })
  ])
  const weights = resolveEvaluatorWeights(
    cycleConfig?.evaluatorWeightsOverride as EvaluatorWeights | null,
    ratingConfig?.evaluatorWeights as EvaluatorWeights | null
  )

  // Sample up to 50 employees for org-wide view
  const ratings = await prisma.performanceRating.findMany({
    where,
    select: { employeeId: true },
    take: 50,
    orderBy: { roleFitScore: 'asc' }
  })

  if (ratings.length === 0) return []

  const employeeIds = ratings.map(r => r.employeeId)

  // BULK: 2 queries for competency scores instead of 250+
  const [targets, competencyAgg] = await Promise.all([
    prisma.competencyTarget.findMany({
      where: { accountId, targetScore: { not: null } },
      select: { competencyCode: true, targetScore: true }
    }),
    bulkCompetencyScores(cycleId, employeeIds, weights)
  ])

  const targetMap = new Map<string, number[]>()
  for (const t of targets) {
    if (!t.targetScore) continue
    if (!targetMap.has(t.competencyCode)) targetMap.set(t.competencyCode, [])
    targetMap.get(t.competencyCode)!.push(t.targetScore)
  }

  const competencyCodes = [...targetMap.keys()]
  const competencies = await prisma.competency.findMany({
    where: { accountId, code: { in: competencyCodes }, isActive: true },
    select: { code: true, name: true }
  })
  const compNameMap = new Map(competencies.map((c: { code: string; name: string }) => [c.code, c.name]))

  return competencyCodes
    .map(code => {
      const targetScores = targetMap.get(code) || []
      const avgTarget = targetScores.reduce((a, b) => a + b, 0) / targetScores.length
      const agg = competencyAgg.get(code)
      const avgActual = agg ? agg.total / agg.count : 0

      return {
        competencyCode: code,
        competencyName: compNameMap.get(code) || code,
        gap: Math.round((avgActual - avgTarget) * 10) / 10,
        actual: Math.round(avgActual * 10) / 10,
        expected: Math.round(avgTarget * 10) / 10
      }
    })
    .filter(g => g.expected > 0 && g.actual > 0) // Excluir competencias sin datos reales de evaluación
}
