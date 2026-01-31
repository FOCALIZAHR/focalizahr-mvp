// src/app/api/reports/[token]/route.ts
// API para acceso anónimo a reportes individuales de desempeño

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/reports/[token]
 * Acceso anónimo - Retorna reporte individual por token
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    // Buscar confirmación por token
    const confirmation = await prisma.feedbackDeliveryConfirmation.findUnique({
      where: { reportToken: token },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        cycle: {
          select: {
            id: true,
            name: true,
            endDate: true,
            accountId: true,
            account: {
              select: {
                companyName: true,
                reportLinkExpirationDays: true
              }
            }
          }
        }
      }
    });

    if (!confirmation) {
      return NextResponse.json(
        { success: false, error: 'Reporte no encontrado', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Verificar expiración
    const expirationDays = confirmation.cycle.account.reportLinkExpirationDays;
    const sentAt = new Date(confirmation.sentAt);
    const expiresAt = new Date(sentAt.getTime() + expirationDays * 24 * 60 * 60 * 1000);
    const isExpired = new Date() > expiresAt;

    if (isExpired) {
      return NextResponse.json({
        success: false,
        error: 'Este enlace ha expirado',
        code: 'EXPIRED',
        expiredAt: expiresAt.toISOString()
      }, { status: 410 });
    }

    // Obtener resultados 360 del empleado
    const assignments = await prisma.evaluationAssignment.findMany({
      where: {
        cycleId: confirmation.cycleId,
        evaluateeId: confirmation.employeeId,
        status: 'COMPLETED'
      },
      include: {
        participant: {
          select: { id: true }
        }
      }
    });

    // Obtener respuestas de todos los evaluadores
    const participantIds = assignments
      .map(a => a.participant?.id)
      .filter(Boolean) as string[];

    const responses = await prisma.response.findMany({
      where: {
        participantId: { in: participantIds }
      },
      include: {
        question: {
          select: {
            id: true,
            text: true,
            category: true,
            questionOrder: true,
            responseType: true
          }
        }
      },
      orderBy: {
        question: { questionOrder: 'asc' }
      }
    });

    // Agrupar por categoría
    const categorizedScores: Record<string, { total: number; count: number; responses: any[] }> = {};
    responses.forEach(r => {
      const cat = r.question.category || 'General';
      if (!categorizedScores[cat]) {
        categorizedScores[cat] = { total: 0, count: 0, responses: [] };
      }
      if (r.normalizedScore != null) {
        categorizedScores[cat].total += r.normalizedScore;
        categorizedScores[cat].count++;
      }
      categorizedScores[cat].responses.push({
        questionText: r.question.text,
        rating: r.rating,
        textResponse: r.textResponse,
        normalizedScore: r.normalizedScore,
        responseType: r.question.responseType
      });
    });

    // Calcular scores por categoría
    const categoryScores = Object.entries(categorizedScores).map(([name, data]) => ({
      category: name,
      avgScore: data.count > 0 ? data.total / data.count : null,
      responseCount: data.count,
      qualitativeFeedback: data.responses
        .filter(r => r.textResponse && r.textResponse.trim())
        .map(r => r.textResponse)
    }));

    // Score general
    const allScores = responses.filter(r => r.normalizedScore != null);
    const overallScore = allScores.length > 0
      ? allScores.reduce((sum, r) => sum + (r.normalizedScore || 0), 0) / allScores.length
      : null;

    return NextResponse.json({
      success: true,
      report: {
        token,
        employeeName: confirmation.employee.name || 'Empleado',
        cycleName: confirmation.cycle.name,
        companyName: confirmation.cycle.account!.companyName,
        sentAt: confirmation.sentAt.toISOString(),
        confirmedAt: confirmation.confirmedAt?.toISOString() || null,
        expiresAt: expiresAt.toISOString(),
        overallScore,
        evaluatorCount: assignments.length,
        categoryScores,
        totalResponses: responses.length
      }
    });

  } catch (error: any) {
    console.error('[API] Error obteniendo report:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
