// src/app/api/evaluator/assignments/route.ts
// API para Portal del Jefe - /dashboard/evaluaciones

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
 * GET /api/evaluator/assignments
 * Portal del Jefe - Dashboard de Evaluaciones
 *
 * Retorna las evaluaciones asignadas al usuario actual con formato para UI
 */
export async function GET(request: NextRequest) {
  try {
    console.log('[API] GET /api/evaluator/assignments')

    const userContext = extractUserContext(request);

    if (!userContext.accountId) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Obtener el Employee asociado al usuario actual
    const userEmail = request.headers.get('x-user-email');

    if (!userEmail) {
      return NextResponse.json(
        { success: false, error: 'Email de usuario no disponible' },
        { status: 400 }
      );
    }

    // Buscar employee por email
    const employee = await prisma.employee.findFirst({
      where: {
        accountId: userContext.accountId,
        email: userEmail,
        status: 'ACTIVE'
      }
    });

    if (!employee) {
      return NextResponse.json({
        success: true,
        cycle: null,
        assignments: [],
        stats: { total: 0, completed: 0, pending: 0 },
        message: 'No se encontró empleado asociado a este usuario'
      });
    }

    // Obtener ciclo activo
    const now = new Date()
    const activeCycle = await prisma.performanceCycle.findFirst({
      where: {
        accountId: userContext.accountId,
        status: 'ACTIVE',
        startDate: { lte: now },
        endDate: { gte: now }
      },
      select: {
        id: true,
        name: true,
        description: true,
        startDate: true,
        endDate: true,
        cycleType: true
      }
    })

    // Obtener ALL assignments (pending + completed) para el ciclo activo
    const whereClause: any = {
      accountId: userContext.accountId,
      evaluatorId: employee.id,
      status: { in: ['PENDING', 'IN_PROGRESS', 'COMPLETED'] }
    }

    if (activeCycle) {
      whereClause.cycleId = activeCycle.id
    }

    const assignments = await prisma.evaluationAssignment.findMany({
      where: whereClause,
      include: {
        cycle: true,
        participant: {
          select: {
            uniqueToken: true,
            id: true,
            responses: {
              select: { normalizedScore: true, rating: true }
            }
          }
        },
        evaluatee: {
          select: {
            id: true,
            hireDate: true
          }
        }
      },
      orderBy: [
        { status: 'asc' }, // PENDING primero
        { evaluateeName: 'asc' }
      ]
    });

    // ════════════════════════════════════════════════════════════════════════════
    // BATCH: Obtener potentialScore de PerformanceRating
    // No hay FK directa, usamos cycleId + evaluateeId
    // ════════════════════════════════════════════════════════════════════════════
    const cycleId = activeCycle?.id
    let ratingsMap = new Map<string, { ratingId: string; potentialScore: number | null; potentialLevel: string | null; nineBoxPosition: string | null }>()

    if (cycleId && assignments.length > 0) {
      const employeeIds = [...new Set(assignments.map(a => a.evaluateeId))]

      const performanceRatings = await prisma.performanceRating.findMany({
        where: {
          cycleId,
          employeeId: { in: employeeIds }
        },
        select: {
          id: true,
          employeeId: true,
          potentialScore: true,
          potentialLevel: true,
          nineBoxPosition: true
        }
      })

      ratingsMap = new Map(
        performanceRatings.map(r => [r.employeeId, {
          ratingId: r.id,
          potentialScore: r.potentialScore,
          potentialLevel: r.potentialLevel,
          nineBoxPosition: r.nineBoxPosition
        }])
      )
    }

    // Mapear a formato de UI
    const mappedAssignments = assignments.map(a => {
      // Calculate avgScore for completed assignments (0-100 scale)
      let avgScore: number | null = null
      if (a.status === 'COMPLETED' && a.participant?.responses?.length) {
        // Try normalizedScore first (0-100)
        const normalizedScores = a.participant.responses
          .map(r => r.normalizedScore)
          .filter((s): s is number => s !== null)

        if (normalizedScores.length > 0) {
          avgScore = normalizedScores.reduce((sum, s) => sum + s, 0) / normalizedScores.length
        } else {
          // Fallback: calculate from rating (1-5) → convert to 0-100
          const ratings = a.participant.responses
            .map(r => r.rating)
            .filter((r): r is number => r !== null)
          if (ratings.length > 0) {
            const avgRating = ratings.reduce((sum, r) => sum + r, 0) / ratings.length
            avgScore = (avgRating / 5) * 100
          }
        }
      }

      if (a.status === 'COMPLETED') {
        console.log(`[API] Assignment ${a.id}: participant=${!!a.participant}, responses=${a.participant?.responses?.length ?? 0}, avgScore=${avgScore}`)
      }

      // Lookup de PerformanceRating para datos de potencial
      const ratingData = ratingsMap.get(a.evaluateeId)

      return {
        id: a.id,
        status: a.status.toLowerCase(),
        completedAt: a.status === 'COMPLETED' ? a.updatedAt.toISOString() : undefined,
        dueDate: a.dueDate?.toISOString(),
        evaluationType: a.evaluationType,
        avgScore,
        // Campos de potencial (desde PerformanceRating batch)
        ratingId: ratingData?.ratingId ?? null,
        potentialScore: ratingData?.potentialScore ?? null,
        potentialLevel: ratingData?.potentialLevel ?? null,
        nineBoxPosition: ratingData?.nineBoxPosition ?? null,
        cycleId: a.cycleId,
        evaluatee: {
          id: a.evaluateeId,
          fullName: a.evaluateeName,
          position: a.evaluateePosition,
          departmentName: a.evaluateeDepartment,
          tenure: calculateTenureString(a.evaluatee.hireDate)
        },
        participantToken: a.participant?.uniqueToken || null,
        surveyUrl: a.participant?.uniqueToken
          ? `/encuesta/${a.participant.uniqueToken}`
          : null
      }
    })

    // Stats
    const completed = mappedAssignments.filter(a => a.status === 'completed').length
    const pending = mappedAssignments.filter(a => a.status === 'pending' || a.status === 'in_progress').length

    console.log(`[API] Evaluator ${employee.id}: ${mappedAssignments.length} assignments (${completed} completed, ${pending} pending)`)

    return NextResponse.json({
      success: true,
      cycle: activeCycle ? {
        id: activeCycle.id,
        name: activeCycle.name,
        description: activeCycle.description,
        startDate: activeCycle.startDate.toISOString(),
        endDate: activeCycle.endDate.toISOString(),
        daysRemaining: Math.max(0, Math.ceil((activeCycle.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
      } : null,
      assignments: mappedAssignments,
      stats: {
        total: mappedAssignments.length,
        completed,
        pending
      },
      employee: {
        id: employee.id,
        fullName: employee.fullName,
        position: employee.position
      }
    });

  } catch (error: any) {
    console.error('[API] Error obteniendo evaluator assignments:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
