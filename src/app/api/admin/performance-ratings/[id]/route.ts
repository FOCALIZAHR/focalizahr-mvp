// ════════════════════════════════════════════════════════════════════════════
// API: /api/admin/performance-ratings/[id]
// GET - Obtener rating específico
// ════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { extractUserContext, hasPermission } from '@/lib/services/AuthorizationService'
import { PerformanceRatingService } from '@/lib/services/PerformanceRatingService'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: ratingId } = await params
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

    const rating = await PerformanceRatingService.getRatingById(ratingId)

    if (!rating) {
      return NextResponse.json(
        { success: false, error: 'Rating no encontrado' },
        { status: 404 }
      )
    }

    // Verificar que pertenece a la cuenta del usuario
    if (rating.accountId !== userContext.accountId && userContext.role !== 'FOCALIZAHR_ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Sin acceso a este rating' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      success: true,
      data: rating
    })

  } catch (error) {
    console.error('[API] Error en GET /api/admin/performance-ratings/[id]:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
