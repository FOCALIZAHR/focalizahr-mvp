// src/app/api/evaluator/assignments/[id]/summary/route.ts
// API para resumen read-only de evaluación completada - Portal del Jefe

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { extractUserContext } from '@/lib/services/AuthorizationService';
import PerformanceResultsService from '@/lib/services/PerformanceResultsService';

/**
 * GET /api/evaluator/assignments/[id]/summary
 * Retorna respuestas de una evaluación completada para vista read-only
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userContext = extractUserContext(request);

    if (!userContext.accountId) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }

    const userEmail = request.headers.get('x-user-email');
    if (!userEmail) {
      return NextResponse.json(
        { success: false, error: 'Email no disponible' },
        { status: 400 }
      );
    }

    // Obtener assignment con participante y respuestas
    const assignment = await prisma.evaluationAssignment.findFirst({
      where: {
        id,
        accountId: userContext.accountId
      },
      include: {
        cycle: {
          select: { id: true, name: true, endDate: true }
        },
        evaluator: {
          select: { email: true }
        },
        participant: {
          select: {
            id: true,
            uniqueToken: true
          }
        }
      }
    });

    if (!assignment) {
      return NextResponse.json(
        { success: false, error: 'Evaluación no encontrada' },
        { status: 404 }
      );
    }

    // Verificar que el usuario es el evaluador
    if (assignment.evaluator.email !== userEmail) {
      return NextResponse.json(
        { success: false, error: 'No tienes acceso a esta evaluación' },
        { status: 403 }
      );
    }

    // Solo permitir ver resumen de evaluaciones completadas
    if (assignment.status !== 'COMPLETED') {
      return NextResponse.json(
        { success: false, error: 'La evaluación aún no ha sido completada' },
        { status: 400 }
      );
    }

    // Obtener respuestas del participante asociado
    let responses: any[] = [];
    if (assignment.participant) {
      responses = await prisma.response.findMany({
        where: {
          participantId: assignment.participant.id
        },
        include: {
          question: {
            select: {
              id: true,
              text: true,
              category: true,
              questionOrder: true,
              responseType: true,
              choiceOptions: true,
              competencyCode: true
            }
          }
        },
        orderBy: {
          question: { questionOrder: 'asc' }
        }
      });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // LOOKUP COMPETENCIAS: code → name
    // ═══════════════════════════════════════════════════════════════════════
    const competencyCodes = [...new Set(
      responses
        .map(r => r.question.competencyCode)
        .filter((c): c is string => c != null && c.trim() !== '')
    )];

    let competencyNameMap: Record<string, string> = {};
    if (competencyCodes.length > 0) {
      const competencies = await prisma.competency.findMany({
        where: {
          accountId: userContext.accountId,
          code: { in: competencyCodes }
        },
        select: { code: true, name: true }
      });
      competencyNameMap = Object.fromEntries(
        competencies.map(c => [c.code, c.name])
      );
    }

    // Agrupar respuestas por competencia (nombre) o categoría
    const categorizedResponses: Record<string, any[]> = {};
    responses.forEach(r => {
      const code = r.question.competencyCode || r.question.category || 'General';
      const groupName = competencyNameMap[code] || code;

      if (!categorizedResponses[groupName]) {
        categorizedResponses[groupName] = [];
      }

      categorizedResponses[groupName].push({
        questionId: r.questionId,
        questionText: r.question.text,
        questionOrder: r.question.questionOrder,
        responseType: r.question.responseType,
        rating: r.rating,
        textResponse: r.textResponse,
        choiceResponse: r.choiceResponse,
        normalizedScore: r.normalizedScore,
        competencyCode: r.question.competencyCode || null
      });
    });

    // Calcular score promedio general
    const scoredResponses = responses.filter(r => r.normalizedScore != null);
    const avgScore = scoredResponses.length > 0
      ? scoredResponses.reduce((sum, r) => sum + (r.normalizedScore || 0), 0) / scoredResponses.length
      : null;

    // ═══════════════════════════════════════════════════════════════════════
    // DATOS ENRIQUECIDOS DE COMPETENCIAS (si aplica)
    // ═══════════════════════════════════════════════════════════════════════
    let competencyData: {
      competencyScores: any[] | null;
      gapAnalysis: any | null;
      overallAvgScore: number | null;
    } = {
      competencyScores: null,
      gapAnalysis: null,
      overallAvgScore: null
    };

    if (assignment.cycle?.id && assignment.evaluateeId) {
      try {
        const results360 = await PerformanceResultsService.getEvaluateeResults(
          assignment.cycle.id,
          assignment.evaluateeId
        );

        competencyData = {
          competencyScores: results360.competencyScores || null,
          gapAnalysis: results360.gapAnalysis || null,
          overallAvgScore: results360.overallAvgScore || null
        };

        console.log('[Summary API] Datos de competencias cargados:', {
          competenciesCount: results360.competencyScores?.length || 0,
          hasGapAnalysis: !!results360.gapAnalysis
        });
      } catch (err) {
        // No fallar si no hay datos de competencias - es opcional
        console.warn('[Summary API] No se pudieron obtener datos de competencias:', err);
      }
    }

    return NextResponse.json({
      success: true,
      summary: {
        assignmentId: assignment.id,
        evaluationType: assignment.evaluationType,
        completedAt: assignment.updatedAt.toISOString(),

        evaluatee: {
          fullName: assignment.evaluateeName,
          position: assignment.evaluateePosition,
          department: assignment.evaluateeDepartment
        },

        cycle: {
          name: assignment.cycle.name,
          endDate: assignment.cycle.endDate.toISOString()
        },

        averageScore: avgScore,
        totalQuestions: responses.length,
        categorizedResponses,

        // Datos de competencias (null si no aplica)
        competencyScores: competencyData.competencyScores,
        gapAnalysis: competencyData.gapAnalysis,
        overallScore: competencyData.overallAvgScore
      }
    });

  } catch (error: any) {
    console.error('[API] Error obteniendo summary:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
