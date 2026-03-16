/**
 * POST /api/talent-actions/mass-action
 *
 * Acciones masivas sobre multiples empleados (Pilar 2 QuadrantBlock)
 * Crea N IntelligenceInsights (1 por persona) targetType = EMPLOYEE
 *
 * Body:
 * {
 *   employeeIds: string[]
 *   quadrant: string
 *   actionCode: string
 * }
 *
 * Permiso: talent-actions:view (cualquiera que vea puede actuar)
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  extractUserContext,
  hasPermission
} from '@/lib/services/AuthorizationService'
import { IntelligenceInsightService } from '@/lib/services/IntelligenceInsightService'

const VALID_ACTIONS = [
  'RETENTION_ROUND', 'WORKLOAD_REVIEW', 'DIRECT_EVALUATION', 'TEAM_RECOGNITION'
]

const MAX_EMPLOYEES = 100

export async function POST(request: NextRequest) {
  try {
    const userContext = extractUserContext(request)

    if (!userContext.accountId) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    if (!hasPermission(userContext.role, 'talent-actions:view')) {
      return NextResponse.json({ success: false, error: 'Sin permisos' }, { status: 403 })
    }

    const body = await request.json()
    const { employeeIds, quadrant, actionCode } = body

    if (!Array.isArray(employeeIds) || employeeIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'employeeIds debe ser un array no vacio' },
        { status: 400 }
      )
    }

    if (employeeIds.length > MAX_EMPLOYEES) {
      return NextResponse.json(
        { success: false, error: `Maximo ${MAX_EMPLOYEES} personas por accion masiva` },
        { status: 400 }
      )
    }

    if (!quadrant || !actionCode) {
      return NextResponse.json(
        { success: false, error: 'quadrant y actionCode son requeridos' },
        { status: 400 }
      )
    }

    if (!VALID_ACTIONS.includes(actionCode)) {
      return NextResponse.json(
        { success: false, error: `Accion invalida. Use: ${VALID_ACTIONS.join(', ')}` },
        { status: 400 }
      )
    }

    const userId = request.headers.get('x-user-id') || request.headers.get('x-user-email') || 'unknown'

    const result = await IntelligenceInsightService.createBulkFromTAC({
      accountId: userContext.accountId,
      employeeIds,
      actionCode,
      quadrant,
      acknowledgedBy: userId
    })

    return NextResponse.json({
      success: true,
      data: result
    })

  } catch (error: any) {
    console.error('[TAC mass-action] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Error interno' },
      { status: 500 }
    )
  }
}
