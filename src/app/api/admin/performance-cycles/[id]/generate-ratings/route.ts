// src/app/api/admin/performance-cycles/[id]/generate-ratings/route.ts
// Genera/recalcula PerformanceRatings para un ciclo
// Usado por botón manual "Recalcular Ratings" en admin

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { extractUserContext, hasPermission } from '@/lib/services/AuthorizationService'
import { PerformanceRatingService } from '@/lib/services/PerformanceRatingService'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: cycleId } = await params
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

    // Validar ciclo pertenece a la cuenta
    const whereClause = userContext.role === 'FOCALIZAHR_ADMIN'
      ? { id: cycleId }
      : { id: cycleId, accountId: userContext.accountId }

    const cycle = await prisma.performanceCycle.findFirst({
      where: whereClause,
      select: { id: true, accountId: true, status: true, name: true }
    })

    if (!cycle) {
      return NextResponse.json(
        { success: false, error: 'Ciclo no encontrado' },
        { status: 404 }
      )
    }

    // Solo permitir en IN_REVIEW o COMPLETED
    if (!['IN_REVIEW', 'COMPLETED', 'ACTIVE'].includes(cycle.status)) {
      return NextResponse.json(
        { success: false, error: `No se puede generar ratings en estado ${cycle.status}` },
        { status: 400 }
      )
    }

    console.log(`[Performance] Manual generate-ratings for cycle "${cycle.name}" (${cycleId})`)

    const result = await PerformanceRatingService.generateRatingsForCycle(cycleId, cycle.accountId)

    console.log(`[Performance] Generate-ratings result: ${result.success} success, ${result.failed} failed`)

    return NextResponse.json({
      success: true,
      data: {
        generated: result.success,
        failed: result.failed,
        errors: result.errors
      },
      message: `${result.success} ratings generados exitosamente`
    })

  } catch (error) {
    console.error('[API] Error en POST generate-ratings:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error interno' },
      { status: 500 }
    )
  }
}
