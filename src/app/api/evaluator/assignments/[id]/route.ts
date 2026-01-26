// src/app/api/evaluator/assignments/[id]/route.ts
// API para detalle de evaluación asignada - Portal del Jefe

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { extractUserContext } from '@/lib/services/AuthorizationService';

// ════════════════════════════════════════════════════════════════════════════
// UTILITY: Calcular tenure legible
// ════════════════════════════════════════════════════════════════════════════

function calculateTenureString(hireDate: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - hireDate.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays < 30) {
    return `${diffDays} días`
  }

  const months = Math.floor(diffDays / 30.44)
  const years = Math.floor(months / 12)
  const remainingMonths = months % 12

  if (years === 0) {
    return `${months} ${months === 1 ? 'mes' : 'meses'}`
  }

  if (remainingMonths === 0) {
    return `${years} ${years === 1 ? 'año' : 'años'}`
  }

  return `${years} ${years === 1 ? 'año' : 'años'} ${remainingMonths} ${remainingMonths === 1 ? 'mes' : 'meses'}`
}

/**
 * GET /api/evaluator/assignments/[id]
 * Detalle de una evaluación asignada para Portal del Jefe
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

    const assignment = await prisma.evaluationAssignment.findFirst({
      where: {
        id,
        accountId: userContext.accountId
      },
      include: {
        cycle: true,
        evaluator: true,
        evaluatee: {
          select: {
            id: true,
            hireDate: true
          }
        },
        participant: {
          select: { uniqueToken: true }
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

    // Formato para el Portal del Jefe
    return NextResponse.json({
      success: true,
      assignment: {
        id: assignment.id,
        status: assignment.status.toLowerCase(),
        evaluationType: assignment.evaluationType,
        dueDate: assignment.dueDate?.toISOString(),

        // Datos del evaluado
        evaluatee: {
          id: assignment.evaluateeId,
          fullName: assignment.evaluateeName,
          position: assignment.evaluateePosition,
          departmentName: assignment.evaluateeDepartment,
          tenure: calculateTenureString(assignment.evaluatee.hireDate)
        },

        // Datos del ciclo
        cycle: {
          name: assignment.cycle.name,
          endDate: assignment.cycle.endDate.toISOString()
        },

        // Links de encuesta
        surveyUrl: assignment.participant?.uniqueToken
          ? `/encuesta/${assignment.participant.uniqueToken}`
          : null,
        participantToken: assignment.participant?.uniqueToken || null
      }
    });

  } catch (error: any) {
    console.error('[API] Error obteniendo assignment:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/evaluator/assignments/[id]
 * Actualizar estado de una evaluación (iniciar)
 */
export async function PATCH(
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

    const assignment = await prisma.evaluationAssignment.findFirst({
      where: {
        id,
        accountId: userContext.accountId
      },
      include: {
        evaluator: true
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

    const body = await request.json();
    const { action } = body;

    // Acción: iniciar evaluación
    if (action === 'start') {
      if (assignment.status !== 'PENDING') {
        return NextResponse.json(
          { success: false, error: 'Solo se puede iniciar evaluaciones pendientes' },
          { status: 400 }
        );
      }

      const updated = await prisma.evaluationAssignment.update({
        where: { id },
        data: { status: 'IN_PROGRESS' }
      });

      return NextResponse.json({ success: true, data: updated });
    }

    return NextResponse.json(
      { success: false, error: 'Acción no reconocida' },
      { status: 400 }
    );

  } catch (error: any) {
    console.error('[API] Error actualizando assignment:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
