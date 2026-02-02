// ════════════════════════════════════════════════════════════════════════════
// API: /api/admin/performance-ratings
// GET - Listar ratings | POST - Generar ratings
// ════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { extractUserContext, hasPermission } from '@/lib/services/AuthorizationService'
import { PerformanceRatingService } from '@/lib/services/PerformanceRatingService'

export async function GET(request: NextRequest) {
  try {
    const userContext = extractUserContext(request)

    if (!userContext.accountId) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    if (!hasPermission(userContext.role, 'performance:view')) {
      return NextResponse.json(
        { success: false, error: 'Sin permisos' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const cycleId = searchParams.get('cycleId')

    if (!cycleId) {
      return NextResponse.json(
        { success: false, error: 'cycleId es requerido' },
        { status: 400 }
      )
    }

    const result = await PerformanceRatingService.listRatingsForCycle(cycleId, {
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
      sortBy: (searchParams.get('sortBy') as 'name' | 'score' | 'level') || 'name',
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'asc',
      filterLevel: searchParams.get('filterLevel') || undefined,
      filterNineBox: searchParams.get('filterNineBox') || undefined,
      filterCalibrated: searchParams.get('filterCalibrated') === 'true' ? true :
                        searchParams.get('filterCalibrated') === 'false' ? false : undefined
    })

    return NextResponse.json({
      success: true,
      ...result
    })

  } catch (error) {
    console.error('[API] Error en GET /api/admin/performance-ratings:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const userContext = extractUserContext(request)

    if (!userContext.accountId) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    if (!hasPermission(userContext.role, 'performance:manage')) {
      return NextResponse.json(
        { success: false, error: 'Sin permisos' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { cycleId, action, employeeId } = body

    if (!cycleId) {
      return NextResponse.json(
        { success: false, error: 'cycleId es requerido' },
        { status: 400 }
      )
    }

    // Acción: generar todos los ratings del ciclo
    if (action === 'generate_all') {
      const result = await PerformanceRatingService.generateRatingsForCycle(
        cycleId,
        userContext.accountId
      )

      return NextResponse.json({
        success: true,
        data: result,
        message: `Generados ${result.success} ratings, ${result.failed} fallidos`
      })
    }

    // Acción: generar rating individual
    if (action === 'generate_single' && employeeId) {
      const result = await PerformanceRatingService.generateRating(
        cycleId,
        employeeId,
        userContext.accountId
      )

      return NextResponse.json({
        success: true,
        data: result
      })
    }

    return NextResponse.json(
      { success: false, error: 'Acción no válida. Use "generate_all" o "generate_single"' },
      { status: 400 }
    )

  } catch (error) {
    console.error('[API] Error en POST /api/admin/performance-ratings:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error interno' },
      { status: 500 }
    )
  }
}
