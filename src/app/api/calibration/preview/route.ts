// ════════════════════════════════════════════════════════════════════════════
// API: /api/calibration/preview
// POST - Preview de empleados que coinciden con criterios de filtrado
// Usado en Wizard Step 2 para preview en tiempo real
// ════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { extractUserContext, hasPermission } from '@/lib/services/AuthorizationService'
import { getEmployeesPreview } from '@/lib/services/CalibrationService'

export async function POST(request: NextRequest) {
  try {
    const userContext = extractUserContext(request)

    if (!userContext.accountId) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    if (!hasPermission(userContext.role, 'calibration:manage')) {
      return NextResponse.json(
        { success: false, error: 'Sin permisos' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { cycleId, filterMode, filterConfig } = body

    if (!cycleId) {
      return NextResponse.json(
        { success: false, error: 'cycleId requerido' },
        { status: 400 }
      )
    }

    if (!filterMode || !filterConfig) {
      return NextResponse.json(
        { success: false, error: 'filterMode y filterConfig requeridos' },
        { status: 400 }
      )
    }

    const { employees, totalCount } = await getEmployeesPreview(
      filterMode,
      filterConfig,
      cycleId,
      userContext.accountId,
      20
    )

    return NextResponse.json({
      success: true,
      employees,
      totalCount
    })

  } catch (error) {
    console.error('[API /calibration/preview] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Error generando preview' },
      { status: 500 }
    )
  }
}
