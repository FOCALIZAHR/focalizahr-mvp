// src/app/api/evaluator/assignments/[id]/summary/route.ts
// API para resumen read-only de evaluación completada - Portal del Jefe

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { extractUserContext } from '@/lib/services/AuthorizationService';

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
          select: { name: true, endDate: true }
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
              choiceOptions: true
            }
          }
        },
        orderBy: {
          question: { questionOrder: 'asc' }
        }
      });
    }

    // Agrupar respuestas por categoría
    const categorizedResponses: Record<string, any[]> = {};
    responses.forEach(r => {
      const category = r.question.category || 'General';
      if (!categorizedResponses[category]) {
        categorizedResponses[category] = [];
      }

      categorizedResponses[category].push({
        questionId: r.questionId,
        questionText: r.question.text,
        questionOrder: r.question.questionOrder,
        responseType: r.question.responseType,
        rating: r.rating,
        textResponse: r.textResponse,
        choiceResponse: r.choiceResponse,
        normalizedScore: r.normalizedScore
      });
    });

    // Calcular score promedio general
    const scoredResponses = responses.filter(r => r.normalizedScore != null);
    const avgScore = scoredResponses.length > 0
      ? scoredResponses.reduce((sum, r) => sum + (r.normalizedScore || 0), 0) / scoredResponses.length
      : null;

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
        categorizedResponses
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
