// ════════════════════════════════════════════════════════════════════════════
// API: /api/calibration/sessions/[sessionId]/ratings
// GET - Listar todos los PerformanceRating del ciclo asociado a la sesión
// ════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  extractUserContext,
  hasPermission,
  getChildDepartmentIds
} from '@/lib/services/AuthorizationService'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params
    const userContext = extractUserContext(request)

    if (!userContext.accountId) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    if (!hasPermission(userContext.role, 'calibration:view')) {
      return NextResponse.json(
        { success: false, error: 'Sin permisos' },
        { status: 403 }
      )
    }

    // ═══ CHECK 3: accountId en WHERE ═══
    const session = await prisma.calibrationSession.findFirst({
      where: {
        id: sessionId,
        accountId: userContext.accountId
      },
      select: {
        cycleId: true,
        departmentIds: true,
        accountId: true
      }
    })

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Sesión no encontrada' },
        { status: 404 }
      )
    }

    // ═══ Construir filtro de ratings ═══
    const ratingWhere: any = {
      cycleId: session.cycleId,
      accountId: session.accountId,
      calculatedScore: { gt: 0 }  // Solo empleados con evaluación completada
    }

    // Si la sesión tiene departmentIds, filtrar por esos departamentos
    if (session.departmentIds && session.departmentIds.length > 0) {
      ratingWhere.employee = {
        departmentId: { in: session.departmentIds }
      }
    }

    // ═══ CHECK 4: Si AREA_MANAGER, filtro jerárquico ═══
    if (userContext.role === 'AREA_MANAGER' && userContext.departmentId) {
      const childIds = await getChildDepartmentIds(userContext.departmentId)
      const allowedDepts = [userContext.departmentId, ...childIds]

      ratingWhere.employee = {
        ...ratingWhere.employee,
        departmentId: { in: allowedDepts }
      }
    }

    const ratings = await prisma.performanceRating.findMany({
      where: ratingWhere,
      include: {
        employee: {
          select: {
            id: true,
            fullName: true,
            position: true,
            departmentId: true
          }
        }
      },
      orderBy: { calculatedScore: 'desc' }
    })

    return NextResponse.json({
      success: true,
      data: ratings
    })

  } catch (error) {
    console.error('[API] Error GET ratings:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno' },
      { status: 500 }
    )
  }
}
