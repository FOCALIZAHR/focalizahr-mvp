// ════════════════════════════════════════════════════════════════════════════
// API: /api/admin/performance-ratings/[id]/calibrate
// POST - Calibrar rating | DELETE - Revertir calibración
// ════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { extractUserContext } from '@/lib/services/AuthorizationService'
import { PerformanceRatingService } from '@/lib/services/PerformanceRatingService'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: ratingId } = await params
    const userContext = extractUserContext(request)
    const userEmail = request.headers.get('x-user-email')

    if (!userContext.accountId || !userEmail) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Solo ciertos roles pueden calibrar
    const canCalibrate = ['FOCALIZAHR_ADMIN', 'ACCOUNT_OWNER', 'CEO', 'HR_ADMIN'].includes(userContext.role || '')
    if (!canCalibrate) {
      return NextResponse.json(
        { success: false, error: 'Sin permisos para calibrar ratings' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { finalScore, adjustmentReason, sessionId } = body

    // Validaciones
    if (typeof finalScore !== 'number' || finalScore < 0 || finalScore > 5) {
      return NextResponse.json(
        { success: false, error: 'finalScore debe ser un número entre 0 y 5' },
        { status: 400 }
      )
    }

    if (!adjustmentReason || typeof adjustmentReason !== 'string' || adjustmentReason.trim().length < 10) {
      return NextResponse.json(
        { success: false, error: 'adjustmentReason es requerido (mínimo 10 caracteres)' },
        { status: 400 }
      )
    }

    const updated = await PerformanceRatingService.calibrateRating({
      ratingId,
      finalScore,
      adjustmentReason: adjustmentReason.trim(),
      calibratedBy: userEmail,
      sessionId
    })

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Rating calibrado exitosamente'
    })

  } catch (error) {
    console.error('[API] Error en POST /api/admin/performance-ratings/[id]/calibrate:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error interno' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: ratingId } = await params
    const userContext = extractUserContext(request)
    const userEmail = request.headers.get('x-user-email')

    if (!userContext.accountId || !userEmail) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    const canCalibrate = ['FOCALIZAHR_ADMIN', 'ACCOUNT_OWNER', 'CEO', 'HR_ADMIN'].includes(userContext.role || '')
    if (!canCalibrate) {
      return NextResponse.json(
        { success: false, error: 'Sin permisos' },
        { status: 403 }
      )
    }

    const reverted = await PerformanceRatingService.revertCalibration(
      ratingId,
      userEmail
    )

    return NextResponse.json({
      success: true,
      data: reverted,
      message: 'Calibración revertida exitosamente'
    })

  } catch (error) {
    console.error('[API] Error en DELETE /api/admin/performance-ratings/[id]/calibrate:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
