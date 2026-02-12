import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { extractUserContext, hasPermission } from '@/lib/services/AuthorizationService';

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

    if (!hasPermission(userContext.role, 'performance:view')) {
      return NextResponse.json(
        { success: false, error: 'Sin permisos' },
        { status: 403 }
      );
    }

    // FOCALIZAHR_ADMIN puede ver ciclos de cualquier cuenta
    const whereClause = userContext.role === 'FOCALIZAHR_ADMIN'
      ? { id }
      : { id, accountId: userContext.accountId };

    const cycle = await prisma.performanceCycle.findFirst({
      where: whereClause,
      include: {
        _count: {
          select: { assignments: true }
        }
      }
    });

    if (!cycle) {
      return NextResponse.json(
        { success: false, error: 'Ciclo no encontrado' },
        { status: 404 }
      );
    }

    // Contar assignments completados
    const completedAssignments = await prisma.evaluationAssignment.count({
      where: {
        cycleId: id,
        accountId: cycle.accountId,
        status: 'COMPLETED'
      }
    });

    // Contar ratings totales y con score calculado
    const totalRatings = await prisma.performanceRating.count({
      where: {
        cycleId: id,
        accountId: cycle.accountId
      }
    });

    const ratingsWithScore = await prisma.performanceRating.count({
      where: {
        cycleId: id,
        accountId: cycle.accountId,
        calculatedScore: { gt: 0 }
      }
    });

    // Contar potencial asignado
    const ratingsWithPotential = await prisma.performanceRating.count({
      where: {
        cycleId: id,
        accountId: cycle.accountId,
        potentialScore: { not: null }
      }
    });

    return NextResponse.json({
      success: true,
      stats: {
        totalAssignments: cycle._count.assignments,
        completedAssignments,
        pendingRatings: totalRatings - ratingsWithScore,
        pendingPotential: ratingsWithScore - ratingsWithPotential
      }
    });

  } catch (error: any) {
    console.error('[API] Error fetching cycle stats:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
