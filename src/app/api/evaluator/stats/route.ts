// ════════════════════════════════════════════════════════════════════════════
// API: GET /api/evaluator/stats?cycleId=xxx
// Estadísticas de calibración en vivo para el jefe evaluador
// ════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { extractUserContext } from '@/lib/services/AuthorizationService'
import { prisma } from '@/lib/prisma'
import type { EvaluationStatus } from '@/lib/utils/evaluatorStatsEngine'

// ════════════════════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════════════════════

function calculateStats(scores: number[]) {
  if (scores.length === 0) {
    return {
      status: 'OPTIMA' as EvaluationStatus,
      avg: 0,
      stdDev: 0,
      count: 0,
      distribution: [0, 0, 0, 0, 0]
    }
  }

  const count = scores.length
  const avg = scores.reduce((a, b) => a + b, 0) / count
  const variance = scores.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / count
  const stdDev = Math.sqrt(variance)

  // Clasificar (prioridad: CENTRAL > SEVERA > INDULGENTE > OPTIMA)
  let status: EvaluationStatus = 'OPTIMA'
  if (count >= 2 && stdDev < 0.5) status = 'CENTRAL'
  else if (avg < 2.5) status = 'SEVERA'
  else if (avg > 4.0) status = 'INDULGENTE'

  // Distribución en 5 buckets (1-5 scale): [1-1.5, 1.5-2.5, 2.5-3.5, 3.5-4.5, 4.5-5]
  const buckets = [0, 0, 0, 0, 0]
  for (const score of scores) {
    if (score <= 1.5) buckets[0]++
    else if (score <= 2.5) buckets[1]++
    else if (score <= 3.5) buckets[2]++
    else if (score <= 4.5) buckets[3]++
    else buckets[4]++
  }
  const distribution = buckets.map(b => Math.round((b / count) * 100))

  return {
    status,
    avg: Number(avg.toFixed(2)),
    stdDev: Number(stdDev.toFixed(2)),
    count,
    distribution
  }
}

// ════════════════════════════════════════════════════════════════════════════
// ROUTE HANDLER
// ════════════════════════════════════════════════════════════════════════════

export async function GET(request: NextRequest) {
  try {
    const userContext = extractUserContext(request)
    const userEmail = request.headers.get('x-user-email')

    if (!userContext.accountId || !userEmail) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const cycleId = searchParams.get('cycleId')

    if (!cycleId) {
      return NextResponse.json(
        { success: false, error: 'cycleId es requerido' },
        { status: 400 }
      )
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 1. Encontrar el Employee del usuario logueado
    // ═══════════════════════════════════════════════════════════════════════
    const employee = await prisma.employee.findFirst({
      where: {
        accountId: userContext.accountId,
        email: userEmail,
        isActive: true
      },
      select: { id: true }
    })

    if (!employee) {
      return NextResponse.json({
        success: true,
        data: {
          desempeno: { status: 'OPTIMA', avg: 0, stdDev: 0, count: 0, distribution: [0, 0, 0, 0, 0] },
          potencial: null,
          teamDna: null
        }
      })
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 2. Obtener evaluaciones MANAGER_TO_EMPLOYEE completadas
    // ═══════════════════════════════════════════════════════════════════════
    const assignments = await prisma.evaluationAssignment.findMany({
      where: {
        cycleId,
        evaluatorId: employee.id,
        evaluationType: 'MANAGER_TO_EMPLOYEE',
        status: 'COMPLETED'
      },
      select: {
        evaluateeId: true,
        participant: {
          select: {
            responses: {
              select: {
                normalizedScore: true,
                rating: true,
                questionId: true
              }
            }
          }
        }
      }
    })

    // ═══════════════════════════════════════════════════════════════════════
    // 3. Calcular scores de DESEMPEÑO (1 score por evaluatee, escala 1-5)
    // ═══════════════════════════════════════════════════════════════════════
    const desempenoScores: number[] = []
    const allResponses: Array<{ normalizedScore: number | null; rating: number | null; questionId: string }> = []

    for (const assignment of assignments) {
      const responses = assignment.participant?.responses || []

      // Collect all responses for Team DNA
      for (const r of responses) {
        allResponses.push({
          normalizedScore: r.normalizedScore,
          rating: r.rating,
          questionId: r.questionId
        })
      }

      // Per-evaluatee average score (convert normalizedScore 0-100 → 1-5)
      const scores = responses
        .map(r => {
          if (r.normalizedScore !== null) return 1 + (r.normalizedScore / 100) * 4
          if (r.rating !== null) return r.rating
          return null
        })
        .filter((s): s is number => s !== null)

      if (scores.length > 0) {
        const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length
        desempenoScores.push(avgScore)
      }
    }

    const desempeno = calculateStats(desempenoScores)

    // ═══════════════════════════════════════════════════════════════════════
    // 4. Obtener scores de POTENCIAL (escala 1-5, ya en ese rango)
    // ═══════════════════════════════════════════════════════════════════════
    const potentialRatings = await prisma.performanceRating.findMany({
      where: {
        cycleId,
        potentialScore: { not: null },
        potentialRatedBy: userEmail
      },
      select: { potentialScore: true }
    })

    const potencialScores = potentialRatings
      .map(r => r.potentialScore)
      .filter((s): s is number => s !== null)

    const potencial = potencialScores.length > 0
      ? calculateStats(potencialScores)
      : null

    // ═══════════════════════════════════════════════════════════════════════
    // 5. Calcular Team DNA (competencias top/low)
    // ═══════════════════════════════════════════════════════════════════════
    let teamDna: { top: { code: string; name: string; avgScore: number }; low: { code: string; name: string; avgScore: number } } | null = null
    let allCompetencyAvgs: Array<{ code: string; name: string; avgScore: number }> = []

    if (allResponses.length > 0) {
      // Get unique questionIds
      const questionIds = [...new Set(allResponses.map(r => r.questionId).filter(Boolean))]

      // Batch query questions for competencyCode
      const questions = await prisma.question.findMany({
        where: { id: { in: questionIds }, competencyCode: { not: null } },
        select: { id: true, competencyCode: true }
      })

      const questionCompetencyMap = new Map(
        questions.map(q => [q.id, q.competencyCode!])
      )

      // Get unique competency codes
      const competencyCodes = [...new Set(questions.map(q => q.competencyCode!).filter(Boolean))]

      if (competencyCodes.length > 0) {
        // Batch query competency names
        const competencies = await prisma.competency.findMany({
          where: { code: { in: competencyCodes } },
          select: { code: true, name: true }
        })
        const competencyNameMap = new Map(competencies.map(c => [c.code, c.name]))

        // Aggregate scores by competency
        const competencyScores: Record<string, number[]> = {}
        for (const response of allResponses) {
          if (!response.questionId) continue
          const code = questionCompetencyMap.get(response.questionId)
          if (!code) continue

          // Convert to 1-5 scale
          let score: number | null = null
          if (response.normalizedScore !== null) score = 1 + (response.normalizedScore / 100) * 4
          else if (response.rating !== null) score = response.rating

          if (score !== null) {
            if (!competencyScores[code]) competencyScores[code] = []
            competencyScores[code].push(score)
          }
        }

        // Calculate averages
        const competencyAvgs = Object.entries(competencyScores).map(([code, scores]) => ({
          code,
          name: competencyNameMap.get(code) || code,
          avgScore: Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2))
        }))

        if (competencyAvgs.length >= 2) {
          const sorted = competencyAvgs.sort((a, b) => b.avgScore - a.avgScore)
          teamDna = {
            top: sorted[0],
            low: sorted[sorted.length - 1]
          }
        }

        // Store all competency averages for diagnostic modal
        allCompetencyAvgs = competencyAvgs
      }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 6. Retornar
    // ═══════════════════════════════════════════════════════════════════════
    return NextResponse.json({
      success: true,
      data: { desempeno, potencial, teamDna, competencies: allCompetencyAvgs }
    })

  } catch (error) {
    console.error('[API] Error en GET /api/evaluator/stats:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error interno' },
      { status: 500 }
    )
  }
}
