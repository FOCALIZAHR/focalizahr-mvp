// ════════════════════════════════════════════════════════════════════════════
// API: POST /api/goals/from-pdi
// Crear meta de negocio desde un DevelopmentGoal del PDI
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

    const body = await request.json()
    const { devGoalId, employeeId, title, targetValue, dueDate } = body

    if (!devGoalId || !title || !targetValue || !dueDate) {
      return NextResponse.json(
        { success: false, error: 'Campos requeridos: devGoalId, title, targetValue, dueDate' },
        { status: 400 }
      )
    }

    if (!employeeId) {
      return NextResponse.json(
        { success: false, error: 'employeeId es requerido' },
        { status: 400 }
      )
    }

    const createdById = userContext.userId || userContext.accountId

    const goal = await GoalsService.createFromDevelopmentGoal(
      userContext.accountId,
      employeeId,
      createdById,
      {
        devGoalId,
        title,
        description: body.description,
        targetValue,
        unit: body.unit,
        dueDate,
        weight: body.weight
      }
    )

    return NextResponse.json({
      success: true,
      data: goal,
      message: 'Meta creada y vinculada al PDI'
    }, { status: 201 })

  } catch (error) {
    console.error('[API /goals/from-pdi] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error creando meta'
      },
      { status: 500 }
    )
  }
}
