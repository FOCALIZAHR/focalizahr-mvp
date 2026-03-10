// ════════════════════════════════════════════════════════════════════════════
// API: /api/evaluator/potential
// POST - Jefe asigna potencial AAE a un evaluatee
// ════════════════════════════════════════════════════════════════════════════
// Delega a PerformanceRatingService.ratePotential() que calcula:
// - potentialScore, nineBoxPosition (9-Box)
// - mobilityQuadrant, riskQuadrant, riskAlertLevel (Matrices de Talento)
// ════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { extractUserContext } from '@/lib/services/AuthorizationService'
import { prisma } from '@/lib/prisma'
import { getPerformanceLevel } from '@/config/performanceClassification'
import { PerformanceRatingService } from '@/lib/services/PerformanceRatingService'

export async function POST(request: NextRequest) {
  try {
    const userContext = extractUserContext(request)
    const userEmail = request.headers.get('x-user-email')

    if (!userContext.accountId || !userEmail) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { cycleId, employeeId, aspiration, ability, engagement, notes } = body

    // Validar campos requeridos
    if (!cycleId || !employeeId) {
      return NextResponse.json(
        { success: false, error: 'cycleId y employeeId son requeridos' },
        { status: 400 }
      )
    }

    // Validar factores AAE (cada uno debe ser 1, 2 o 3)
    const validLevels = [1, 2, 3]
    if (!validLevels.includes(aspiration) || !validLevels.includes(ability) || !validLevels.includes(engagement)) {
      return NextResponse.json(
        { success: false, error: 'Cada factor (aspiration, ability, engagement) debe ser 1, 2 o 3' },
        { status: 400 }
      )
    }

    // Verificar que el usuario es evaluador de este empleado en este ciclo
    const loggedInEmployee = await prisma.employee.findFirst({
      where: {
        accountId: userContext.accountId,
        email: userEmail,
        isActive: true
      },
      select: { id: true }
    })

    if (!loggedInEmployee) {
      return NextResponse.json(
        { success: false, error: 'Empleado no encontrado para este usuario' },
        { status: 404 }
      )
    }

    // Verificar assignment: el usuario debe ser evaluador del empleado
    const assignment = await prisma.evaluationAssignment.findFirst({
      where: {
        cycleId,
        evaluatorId: loggedInEmployee.id,
        evaluateeId: employeeId,
        accountId: userContext.accountId
      },
      select: { id: true, status: true }
    })

    if (!assignment) {
      return NextResponse.json(
        { success: false, error: 'No tiene asignación de evaluación para este colaborador' },
        { status: 403 }
      )
    }

    // Find or create PerformanceRating
    let rating = await prisma.performanceRating.findUnique({
      where: {
        cycleId_employeeId: { cycleId, employeeId }
      }
    })

    if (!rating) {
      // Auto-crear rating mínimo con score 0 (se recalculará después)
      rating = await prisma.performanceRating.create({
        data: {
          accountId: userContext.accountId,
          cycleId,
          employeeId,
          calculatedScore: 0,
          calculatedLevel: getPerformanceLevel(0)
        }
      })
      console.log('[Evaluator/Potential] Auto-created PerformanceRating:', rating.id)
    }

    // Delegar a ratePotential() — calcula 9-Box + Matrices de Talento
    const updated = await PerformanceRatingService.ratePotential({
      ratingId: rating.id,
      aspiration,
      ability,
      engagement,
      notes,
      ratedBy: userEmail,
    })

    console.log('[Evaluator/Potential] Saved potential:', {
      ratingId: updated.id,
      employeeId,
      nineBoxPosition: updated.nineBoxPosition,
      mobilityQuadrant: updated.mobilityQuadrant,
      riskQuadrant: updated.riskQuadrant,
    })

    return NextResponse.json({
      success: true,
      data: {
        id: updated.id,
        potentialScore: updated.potentialScore,
        potentialLevel: updated.potentialLevel,
        nineBoxPosition: updated.nineBoxPosition,
        potentialRatedBy: updated.potentialRatedBy,
        potentialRatedAt: updated.potentialRatedAt,
        potentialAspiration: updated.potentialAspiration,
        potentialAbility: updated.potentialAbility,
        potentialEngagement: updated.potentialEngagement,
        mobilityQuadrant: updated.mobilityQuadrant,
        riskQuadrant: updated.riskQuadrant,
        riskAlertLevel: updated.riskAlertLevel,
      },
      message: `Potencial asignado: ${updated.potentialLevel} → 9-Box: ${updated.nineBoxPosition}`
    })

  } catch (error) {
    console.error('[API] Error en POST /api/evaluator/potential:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error interno' },
      { status: 500 }
    )
  }
}
