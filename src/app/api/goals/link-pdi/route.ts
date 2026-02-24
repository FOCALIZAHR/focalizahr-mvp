// ════════════════════════════════════════════════════════════════════════════
// API: POST /api/goals/link-pdi
// Vincular una meta existente a un DevelopmentGoal del PDI
// ════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { GoalsService } from '@/lib/services/GoalsService'
import { extractUserContext } from '@/lib/services/AuthorizationService'

export async function POST(request: NextRequest) {
  try {
    const userContext = extractUserContext(request)

    if (!userContext.accountId) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    const { goalId, devGoalId } = await request.json()

    if (!goalId || !devGoalId) {
      return NextResponse.json(
        { success: false, error: 'goalId y devGoalId son requeridos' },
        { status: 400 }
      )
    }

    const goal = await GoalsService.linkExistingGoal(
      userContext.accountId,
      goalId,
      devGoalId
    )

    return NextResponse.json({
      success: true,
      data: goal,
      message: 'Meta vinculada al objetivo de desarrollo'
    })

  } catch (error) {
    console.error('[API /goals/link-pdi] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error vinculando meta'
      },
      { status: 500 }
    )
  }
}
