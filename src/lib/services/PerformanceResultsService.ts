// ════════════════════════════════════════════════════════════════════════════
// PERFORMANCE RESULTS SERVICE - Consolidación Resultados 360°
// src/lib/services/PerformanceResultsService.ts
// ════════════════════════════════════════════════════════════════════════════
// Patrón: Lattice, 15Five, Culture Amp
// Filosofía: Consolidar self + manager + peer + upward en una sola vista
// ════════════════════════════════════════════════════════════════════════════

import { prisma } from '@/lib/prisma'
import type { CompetencySnapshot } from '@/lib/services/CompetencyService'

// ════════════════════════════════════════════════════════════════════════════
// TIPOS
// ════════════════════════════════════════════════════════════════════════════

export interface EvaluateeResults360 {
  evaluateeId: string
  evaluateeName: string
  evaluateePosition: string | null
  cycleId: string
  cycleName: string

  // Scores por tipo evaluador
  selfScore: number | null
  managerScore: number | null
  peerAvgScore: number | null
  upwardAvgScore: number | null
  overallAvgScore: number

  // Detalle por competencia
  competencyScores: CompetencyScore[]

  // Gap Analysis
  gapAnalysis: GapAnalysisResult

  // Feedback cualitativo
  qualitativeFeedback: QualitativeFeedback[]

  // Metadata
  totalEvaluations: number
  completedEvaluations: number
  evaluationCompleteness: number // % completado
}

export interface CompetencyScore {
  competencyCode: string
  competencyName: string
  competencyCategory: 'CORE' | 'LEADERSHIP' | 'STRATEGIC' | 'TECHNICAL'

  selfScore: number | null
  managerScore: number | null
  peerAvgScore: number | null
  upwardAvgScore: number | null
  overallAvgScore: number

  // Gap self vs others
  selfVsOthersGap: number | null
}

export interface GapAnalysisResult {
  strengths: Array<{
    competencyCode: string
    competencyName: string
    avgScore: number
    highlight: string
  }>

  developmentAreas: Array<{
    competencyCode: string
    competencyName: string
    avgScore: number
    priority: 'ALTA' | 'MEDIA' | 'BAJA'
  }>

  selfAwarenessGap: {
    overestimated: string[] // Competencias donde self > others significativamente
    underestimated: string[] // Competencias donde self < others significativamente
  }
}

export interface QualitativeFeedback {
  evaluatorType: 'SELF' | 'MANAGER_TO_EMPLOYEE' | 'PEER' | 'EMPLOYEE_TO_MANAGER'
  comments: string
  timestamp: Date
}

// ════════════════════════════════════════════════════════════════════════════
// SERVICE
// ════════════════════════════════════════════════════════════════════════════

export class PerformanceResultsService {

  /**
   * Obtiene resultados consolidados 360° de un evaluado
   * @param cycleId - ID del ciclo
   * @param evaluateeId - ID del evaluado (employee)
   * @returns Resultados consolidados
   */
  static async getEvaluateeResults(
    cycleId: string,
    evaluateeId: string
  ): Promise<EvaluateeResults360> {

    // 1. Obtener ciclo con snapshot competencias
    const cycle = await prisma.performanceCycle.findUnique({
      where: { id: cycleId },
      include: {
        account: {
          select: {
            companyName: true
          }
        }
      }
    })

    if (!cycle) {
      throw new Error(`Ciclo ${cycleId} no encontrado`)
    }

    const competencies = (cycle.competencySnapshot as unknown as CompetencySnapshot[]) || []

    // 2. Obtener info del evaluado (Employee, no Participant)
    const evaluatee = await prisma.employee.findUnique({
      where: { id: evaluateeId },
      select: {
        id: true,
        fullName: true,
        position: true
      }
    })

    if (!evaluatee) {
      throw new Error(`Evaluado ${evaluateeId} no encontrado`)
    }

    // 3. Obtener TODAS las evaluaciones donde esta persona es evaluada
    const assignments = await prisma.evaluationAssignment.findMany({
      where: {
        cycleId,
        evaluateeId
      },
      include: {
        evaluator: {
          select: {
            id: true,
            fullName: true
          }
        },
        participant: {
          select: {
            id: true,
            hasResponded: true,
            responses: {
              select: {
                questionId: true,
                rating: true,
                normalizedScore: true,
                textResponse: true
              }
            }
          }
        }
      }
    })

    // 4. Agrupar por tipo de evaluación
    const byType = {
      SELF: assignments.filter(a => a.evaluationType === 'SELF'),
      MANAGER_TO_EMPLOYEE: assignments.filter(a => a.evaluationType === 'MANAGER_TO_EMPLOYEE'),
      PEER: assignments.filter(a => a.evaluationType === 'PEER'),
      EMPLOYEE_TO_MANAGER: assignments.filter(a => a.evaluationType === 'EMPLOYEE_TO_MANAGER')
    }

    // 5. Calcular scores globales por tipo (promedio de normalizedScore de respuestas)
    const getAvgFromAssignments = (assigns: typeof assignments): number | null => {
      const scores: number[] = []
      for (const a of assigns) {
        if (a.status !== 'COMPLETED' || !a.participant?.responses) continue
        const ratings = a.participant.responses
          .map(r => r.normalizedScore ?? r.rating)
          .filter((v): v is number => v !== null)
        if (ratings.length > 0) {
          scores.push(this.calculateAverage(ratings))
        }
      }
      return scores.length > 0 ? this.calculateAverage(scores) : null
    }

    const selfScore = getAvgFromAssignments(byType.SELF)
    const managerScore = getAvgFromAssignments(byType.MANAGER_TO_EMPLOYEE)
    const peerAvgScore = getAvgFromAssignments(byType.PEER)
    const upwardAvgScore = getAvgFromAssignments(byType.EMPLOYEE_TO_MANAGER)

    // 6. Calcular overall average (promedio de promedios)
    const allAvgScores = [
      selfScore,
      managerScore,
      peerAvgScore,
      upwardAvgScore
    ].filter((s): s is number => s !== null)

    const overallAvgScore = allAvgScores.length > 0
      ? this.calculateAverage(allAvgScores)
      : 0

    // 7. Calcular scores por competencia
    const competencyScores = await this.calculateCompetencyScores(
      cycleId,
      evaluateeId,
      competencies
    )

    // 8. Realizar gap analysis
    const gapAnalysis = this.performGapAnalysis(competencyScores)

    // 9. Extraer feedback cualitativo (textResponses de las encuestas)
    const qualitativeFeedback: QualitativeFeedback[] = []
    for (const a of assignments) {
      if (a.status !== 'COMPLETED' || !a.participant?.responses) continue
      const textResponses = a.participant.responses
        .filter(r => r.textResponse && r.textResponse.trim().length > 0)
        .map(r => r.textResponse!)
      if (textResponses.length > 0) {
        qualitativeFeedback.push({
          evaluatorType: a.evaluationType,
          comments: textResponses.join(' | '),
          timestamp: a.updatedAt
        })
      }
    }

    // 10. Calcular completeness
    const totalEvaluations = assignments.length
    const completedEvaluations = assignments.filter(a => a.status === 'COMPLETED').length
    const evaluationCompleteness = totalEvaluations > 0
      ? (completedEvaluations / totalEvaluations) * 100
      : 0

    // 11. Retornar resultado consolidado
    return {
      evaluateeId,
      evaluateeName: evaluatee.fullName,
      evaluateePosition: evaluatee.position,
      cycleId,
      cycleName: cycle.name,

      selfScore,
      managerScore,
      peerAvgScore,
      upwardAvgScore,
      overallAvgScore,

      competencyScores,
      gapAnalysis,
      qualitativeFeedback,

      totalEvaluations,
      completedEvaluations,
      evaluationCompleteness
    }
  }

  /**
   * Calcula scores por competencia consolidando todos los evaluadores
   */
  static async calculateCompetencyScores(
    cycleId: string,
    evaluateeId: string,
    competencies: CompetencySnapshot[]
  ): Promise<CompetencyScore[]> {
    if (!competencies || competencies.length === 0) return []

    // Obtener assignments completados con sus respuestas
    const assignments = await prisma.evaluationAssignment.findMany({
      where: {
        cycleId,
        evaluateeId,
        status: 'COMPLETED'
      },
      include: {
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

    // Obtener questions del campaign para mapear competencyCode
    const cycle = await prisma.performanceCycle.findUnique({
      where: { id: cycleId },
      select: {
        campaign: {
          select: {
            campaignType: {
              select: {
                questions: {
                  select: {
                    id: true,
                    competencyCode: true
                  }
                }
              }
            }
          }
        }
      }
    })

    const questions = cycle?.campaign?.campaignType?.questions || []
    const questionToCompetency = new Map(
      questions
        .filter(q => q.competencyCode)
        .map(q => [q.id, q.competencyCode!])
    )

    // Calcular scores por competencia y tipo de evaluador
    return competencies.map(comp => {
      const selfScores: number[] = []
      const managerScores: number[] = []
      const peerScores: number[] = []
      const upwardScores: number[] = []

      for (const a of assignments) {
        if (!a.participant?.responses) continue

        const relevantResponses = a.participant.responses.filter(r => {
          const compCode = questionToCompetency.get(r.questionId)
          return compCode === comp.code
        })

        const scores = relevantResponses
          .map(r => r.normalizedScore ?? r.rating)
          .filter((v): v is number => v !== null)

        if (scores.length === 0) continue

        const avg = this.calculateAverage(scores)

        switch (a.evaluationType) {
          case 'SELF': selfScores.push(avg); break
          case 'MANAGER_TO_EMPLOYEE': managerScores.push(avg); break
          case 'PEER': peerScores.push(avg); break
          case 'EMPLOYEE_TO_MANAGER': upwardScores.push(avg); break
        }
      }

      const selfScore = selfScores.length > 0 ? this.calculateAverage(selfScores) : null
      const managerScore = managerScores.length > 0 ? this.calculateAverage(managerScores) : null
      const peerAvgScore = peerScores.length > 0 ? this.calculateAverage(peerScores) : null
      const upwardAvgScore = upwardScores.length > 0 ? this.calculateAverage(upwardScores) : null

      const allScores = [selfScore, managerScore, peerAvgScore, upwardAvgScore]
        .filter((s): s is number => s !== null)

      const overallAvgScore = allScores.length > 0 ? this.calculateAverage(allScores) : 0

      // Self vs Others gap
      const othersScores = [managerScore, peerAvgScore, upwardAvgScore]
        .filter((s): s is number => s !== null)
      const othersAvg = othersScores.length > 0 ? this.calculateAverage(othersScores) : null

      const selfVsOthersGap = selfScore !== null && othersAvg !== null
        ? Math.round((selfScore - othersAvg) * 100) / 100
        : null

      return {
        competencyCode: comp.code,
        competencyName: comp.name,
        competencyCategory: comp.category as 'CORE' | 'LEADERSHIP' | 'STRATEGIC' | 'TECHNICAL',
        selfScore,
        managerScore,
        peerAvgScore,
        upwardAvgScore,
        overallAvgScore,
        selfVsOthersGap
      }
    })
  }

  /**
   * Realiza gap analysis identificando fortalezas y áreas de desarrollo
   */
  static performGapAnalysis(
    competencyScores: CompetencyScore[]
  ): GapAnalysisResult {
    const strengths = this.identifyStrengths(competencyScores)
    const developmentAreas = this.identifyDevelopmentAreas(competencyScores)

    // Self-awareness gap analysis
    const overestimated: string[] = []
    const underestimated: string[] = []

    for (const cs of competencyScores) {
      if (cs.selfVsOthersGap === null) continue
      if (cs.selfVsOthersGap >= 0.5) {
        overestimated.push(cs.competencyName)
      } else if (cs.selfVsOthersGap <= -0.5) {
        underestimated.push(cs.competencyName)
      }
    }

    return {
      strengths,
      developmentAreas,
      selfAwarenessGap: {
        overestimated,
        underestimated
      }
    }
  }

  /**
   * Lista todos los evaluados de un ciclo con stats básicos
   */
  static async listEvaluateesInCycle(cycleId: string): Promise<Array<{
    evaluateeId: string
    evaluateeName: string
    evaluateePosition: string | null
    overallAvgScore: number
    evaluationCompleteness: number
    totalEvaluations: number
    completedEvaluations: number
  }>> {
    // Obtener todos los evaluatees únicos del ciclo
    const assignments = await prisma.evaluationAssignment.findMany({
      where: { cycleId },
      select: {
        evaluateeId: true,
        evaluateeName: true,
        evaluateePosition: true,
        status: true,
        participant: {
          select: {
            responses: {
              select: {
                rating: true,
                normalizedScore: true
              }
            }
          }
        }
      }
    })

    // Agrupar por evaluatee
    const byEvaluatee = new Map<string, typeof assignments>()
    for (const a of assignments) {
      const existing = byEvaluatee.get(a.evaluateeId) || []
      existing.push(a)
      byEvaluatee.set(a.evaluateeId, existing)
    }

    // Calcular stats por evaluatee
    const results = []
    for (const [evaluateeId, evals] of byEvaluatee) {
      const totalEvaluations = evals.length
      const completedEvaluations = evals.filter(a => a.status === 'COMPLETED').length
      const evaluationCompleteness = totalEvaluations > 0
        ? (completedEvaluations / totalEvaluations) * 100
        : 0

      // Calcular score promedio de respuestas completadas
      const allScores: number[] = []
      for (const a of evals) {
        if (a.status !== 'COMPLETED' || !a.participant?.responses) continue
        const scores = a.participant.responses
          .map(r => r.normalizedScore ?? r.rating)
          .filter((v): v is number => v !== null)
        allScores.push(...scores)
      }

      const overallAvgScore = allScores.length > 0 ? this.calculateAverage(allScores) : 0

      results.push({
        evaluateeId,
        evaluateeName: evals[0].evaluateeName,
        evaluateePosition: evals[0].evaluateePosition,
        overallAvgScore: Math.round(overallAvgScore * 100) / 100,
        evaluationCompleteness: Math.round(evaluationCompleteness),
        totalEvaluations,
        completedEvaluations
      })
    }

    return results.sort((a, b) => b.overallAvgScore - a.overallAvgScore)
  }

  // ══════════════════════════════════════════════════════════════════════════
  // HELPERS PRIVADOS
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Calcula el promedio de scores de un array de evaluaciones
   */
  private static calculateAverage(scores: number[]): number {
    if (scores.length === 0) return 0
    return scores.reduce((sum, score) => sum + score, 0) / scores.length
  }

  /**
   * Identifica las top 3 competencias (fortalezas)
   */
  private static identifyStrengths(
    competencyScores: CompetencyScore[],
    threshold: number = 4.0
  ): GapAnalysisResult['strengths'] {
    return competencyScores
      .filter(c => c.overallAvgScore >= threshold)
      .sort((a, b) => b.overallAvgScore - a.overallAvgScore)
      .slice(0, 3)
      .map(c => ({
        competencyCode: c.competencyCode,
        competencyName: c.competencyName,
        avgScore: c.overallAvgScore,
        highlight: `Fortaleza destacada con ${c.overallAvgScore.toFixed(1)}/5.0`
      }))
  }

  /**
   * Identifica las bottom 3 competencias (áreas desarrollo)
   */
  private static identifyDevelopmentAreas(
    competencyScores: CompetencyScore[]
  ): GapAnalysisResult['developmentAreas'] {
    return competencyScores
      .sort((a, b) => a.overallAvgScore - b.overallAvgScore)
      .slice(0, 3)
      .map(c => ({
        competencyCode: c.competencyCode,
        competencyName: c.competencyName,
        avgScore: c.overallAvgScore,
        priority: c.overallAvgScore < 2.5 ? 'ALTA' as const : c.overallAvgScore < 3.5 ? 'MEDIA' as const : 'BAJA' as const
      }))
  }
}

export default PerformanceResultsService
