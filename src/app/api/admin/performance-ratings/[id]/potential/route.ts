// ════════════════════════════════════════════════════════════════════════════
// API: /api/admin/performance-ratings/[id]/potential
// POST - Asignar rating de potencial (para 9-Box)
// GET - Obtener datos de potencial
// DELETE - Eliminar rating de potencial
// ════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { extractUserContext, hasPermission } from '@/lib/services/AuthorizationService'
import { PerformanceRatingService } from '@/lib/services/PerformanceRatingService'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: ratingId } = await params
    const userContext = extractUserContext(request)
    const userEmail = request.headers.get('x-user-email')

    // Validar autenticación
    if (!userContext.accountId || !userEmail) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Solo ciertos roles pueden asignar potencial
    const canRatePotential = [
      'FOCALIZAHR_ADMIN',
      'ACCOUNT_OWNER',
      'CEO',
      'HR_ADMIN',
      'HR_MANAGER',
      'AREA_MANAGER'
    ].includes(userContext.role || '')

    if (!canRatePotential) {
      return NextResponse.json(
        { success: false, error: 'Sin permisos para asignar potencial' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { potentialScore, notes } = body

    // Validaciones
    if (typeof potentialScore !== 'number' || potentialScore < 1 || potentialScore > 5) {
      return NextResponse.json(
        { success: false, error: 'potentialScore debe ser un número entre 1 y 5' },
        { status: 400 }
      )
    }

    // Asignar potencial usando el service
    const updated = await PerformanceRatingService.ratePotential({
      ratingId,
      potentialScore,
      notes: notes || undefined,
      ratedBy: userEmail
    })

    return NextResponse.json({
      success: true,
      data: {
        id: updated.id,
        potentialScore: updated.potentialScore,
        potentialLevel: updated.potentialLevel,
        nineBoxPosition: updated.nineBoxPosition,
        potentialRatedBy: updated.potentialRatedBy,
        potentialRatedAt: updated.potentialRatedAt
      },
      message: `Potencial asignado: ${updated.potentialLevel} → Posición 9-Box: ${updated.nineBoxPosition}`
    })

  } catch (error) {
    console.error('[API] Error en POST /api/admin/performance-ratings/[id]/potential:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error interno' },
      { status: 500 }
    )
  }
}

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

    const rating = await prisma.performanceRating.findUnique({
      where: { id: ratingId },
      select: {
        id: true,
        calculatedScore: true,
        calculatedLevel: true,
        finalScore: true,
        finalLevel: true,
        potentialScore: true,
        potentialLevel: true,
        potentialRatedBy: true,
        potentialRatedAt: true,
        potentialNotes: true,
        nineBoxPosition: true,
        employee: {
          select: {
            id: true,
            fullName: true,
            position: true
          }
        }
      }
    })

    if (!rating) {
      return NextResponse.json(
        { success: false, error: 'Rating no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: rating
    })

  } catch (error) {
    console.error('[API] Error en GET /api/admin/performance-ratings/[id]/potential:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
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

    if (!userContext.accountId) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    const canRatePotential = [
      'FOCALIZAHR_ADMIN',
      'ACCOUNT_OWNER',
      'CEO',
      'HR_ADMIN',
      'HR_MANAGER'
    ].includes(userContext.role || '')

    if (!canRatePotential) {
      return NextResponse.json(
        { success: false, error: 'Sin permisos' },
        { status: 403 }
      )
    }

    // Limpiar campos de potencial
    const cleared = await prisma.performanceRating.update({
      where: { id: ratingId },
      data: {
        potentialScore: null,
        potentialLevel: null,
        potentialRatedBy: null,
        potentialRatedAt: null,
        potentialNotes: null,
        nineBoxPosition: null,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      data: { id: cleared.id },
      message: 'Rating de potencial eliminado'
    })

  } catch (error) {
    console.error('[API] Error en DELETE /api/admin/performance-ratings/[id]/potential:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
