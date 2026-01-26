// ════════════════════════════════════════════════════════════════════════════
// API: /api/evaluator/assignments/[id]/questions
// GET - Obtiene preguntas filtradas según competencySnapshot y evaluateeTrack
// ════════════════════════════════════════════════════════════════════════════
// COMPETENCY LIBRARY - Filtrado por track:
// - COLABORADOR: Solo preguntas CORE (audienceRule: null)
// - MANAGER: CORE + LEADERSHIP (audienceRule: {minTrack: "MANAGER"})
// - EJECUTIVO: CORE + LEADERSHIP + STRATEGIC (audienceRule: {minTrack: "EJECUTIVO"})
// ════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { extractUserContext } from '@/lib/services/AuthorizationService'
import { CompetencyFilterService } from '@/lib/services/CompetencyFilterService'
import { CompetencyService, type CompetencySnapshot } from '@/lib/services/CompetencyService'

interface RouteParams {
  params: Promise<{ id: string }>
}

// ════════════════════════════════════════════════════════════════════════════
// GET /api/evaluator/assignments/[id]/questions
// Retorna preguntas filtradas por competencySnapshot + evaluateePerformanceTrack
// ════════════════════════════════════════════════════════════════════════════

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  const startTime = Date.now()

  try {
    const { id } = await params
    const userContext = extractUserContext(request)

    if (!userContext.accountId) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    const userEmail = request.headers.get('x-user-email')

    // Obtener el assignment con ciclo y evaluador
    const assignment = await prisma.evaluationAssignment.findFirst({
      where: {
        id,
        accountId: userContext.accountId
      },
      include: {
        cycle: true,
        evaluator: {
          select: { email: true }
        }
      }
    })

    if (!assignment) {
      return NextResponse.json(
        { success: false, error: 'Evaluación no encontrada' },
        { status: 404 }
      )
    }

    // Verificar acceso (el evaluador o admin)
    if (userEmail && assignment.evaluator.email !== userEmail) {
      // Permitir si es admin o tiene permisos
      const isAdmin = userContext.role === 'FOCALIZAHR_ADMIN' ||
                      userContext.role === 'ACCOUNT_OWNER' ||
                      userContext.role === 'HR_ADMIN'
      if (!isAdmin) {
        return NextResponse.json(
          { success: false, error: 'No tienes acceso a esta evaluación' },
          { status: 403 }
        )
      }
    }

    // Obtener el CampaignType de performance-evaluation
    const performanceType = await prisma.campaignType.findUnique({
      where: { slug: 'performance-evaluation' }
    })

    if (!performanceType) {
      return NextResponse.json(
        { success: false, error: 'CampaignType performance-evaluation no encontrado. Ejecutar seed.' },
        { status: 500 }
      )
    }

    // ════════════════════════════════════════════════════════════════
    // COMPETENCY LIBRARY: Filtrar preguntas
    // ════════════════════════════════════════════════════════════════

    const evaluateeTrack = assignment.evaluateePerformanceTrack || 'COLABORADOR'
    const cycleSnapshot = assignment.cycle.competencySnapshot as CompetencySnapshot[] | null

    let questions: any[]

    if (cycleSnapshot && cycleSnapshot.length > 0) {
      // ══════════════════════════════════════════════════════════════
      // CASO 1: Ciclo con competencySnapshot - Filtrar por snapshot + track
      // ══════════════════════════════════════════════════════════════
      questions = await CompetencyFilterService.getAllQuestionsForEvaluatee(
        performanceType.id,
        cycleSnapshot,
        evaluateeTrack
      )

      console.log(`[Questions] Filtrado por snapshot: ${questions.length} preguntas para track ${evaluateeTrack}`)

    } else {
      // ══════════════════════════════════════════════════════════════
      // CASO 2: Sin snapshot - Obtener todas las preguntas activas (fallback)
      // ══════════════════════════════════════════════════════════════
      const allQuestions = await prisma.question.findMany({
        where: {
          campaignTypeId: performanceType.id,
          isActive: true
        },
        orderBy: { questionOrder: 'asc' }
      })

      // Filtrar manualmente por audienceRule
      const trackHierarchy: Record<string, number> = {
        'COLABORADOR': 1,
        'MANAGER': 2,
        'EJECUTIVO': 3
      }
      const evaluateeLevel = trackHierarchy[evaluateeTrack] || 1

      questions = allQuestions.filter(q => {
        if (!q.audienceRule) return true
        const rule = q.audienceRule as { minTrack?: string }
        if (!rule.minTrack) return true
        const minLevel = trackHierarchy[rule.minTrack] || 1
        return evaluateeLevel >= minLevel
      })

      console.log(`[Questions] Filtrado sin snapshot: ${questions.length} preguntas para track ${evaluateeTrack}`)
    }

    // Formatear respuesta
    const formattedQuestions = questions.map(q => ({
      id: q.id,
      text: q.text,
      category: q.category,
      subcategory: q.subcategory,
      questionOrder: q.questionOrder,
      responseType: q.responseType,
      competencyCode: q.competencyCode,
      competencyName: (q as any).competencyName || null,
      competencyCategory: (q as any).competencyCategory || null,
      minValue: q.minValue,
      maxValue: q.maxValue,
      isRequired: q.isRequired,
      choiceOptions: q.choiceOptions || null
    }))

    const processingTime = Date.now() - startTime

    return NextResponse.json({
      success: true,
      data: {
        assignmentId: assignment.id,
        evaluateeTrack,
        hasCompetencySnapshot: !!(cycleSnapshot && cycleSnapshot.length > 0),
        questions: formattedQuestions,
        meta: {
          total: formattedQuestions.length,
          byCategory: {
            competencia: formattedQuestions.filter(q => q.category === 'competencia').length,
            feedback: formattedQuestions.filter(q => q.category === 'feedback').length
          }
        }
      },
      _performance: {
        processingTime: `${processingTime}ms`
      }
    })

  } catch (error: any) {
    console.error('[API] Error obteniendo questions:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}
