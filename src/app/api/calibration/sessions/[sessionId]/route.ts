// ════════════════════════════════════════════════════════════════════════════
// API: /api/calibration/sessions/[sessionId]
// GET - Detalle sesión | PUT - Actualizar | DELETE - Eliminar
// ════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { extractUserContext, hasPermission } from '@/lib/services/AuthorizationService'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params
    const userContext = extractUserContext(request)
    const currentUserEmail = request.headers.get('x-user-email') || ''

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
        accountId: userContext.accountId  // ← Defense-in-depth
      },
      include: {
        cycle: true,
        participants: {
          orderBy: { invitedAt: 'asc' }
        },
        adjustments: {
          include: {
            rating: {
              include: {
                employee: {
                  select: {
                    id: true,
                    fullName: true,
                    position: true,
                    departmentId: true
                  }
                }
              }
            }
          },
          orderBy: { adjustedAt: 'desc' }
        },
        _count: {
          select: { adjustments: true, participants: true }
        }
      }
    })

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Sesión no encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        ...session,
        currentUserEmail
      }
    })

  } catch (error) {
    console.error('[API] Error GET session detail:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno' },
      { status: 500 }
    )
  }
}

export async function PUT(
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

    if (!hasPermission(userContext.role, 'calibration:manage')) {
      return NextResponse.json(
        { success: false, error: 'Sin permisos' },
        { status: 403 }
      )
    }

    const session = await prisma.calibrationSession.findFirst({
      where: { id: sessionId, accountId: userContext.accountId }
    })

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Sesión no encontrada' },
        { status: 404 }
      )
    }

    // No permitir editar sesiones cerradas
    if (session.status === 'CLOSED') {
      return NextResponse.json(
        { success: false, error: 'No se pueden editar sesiones cerradas' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { name, description, scheduledAt, status } = body

    const updated = await prisma.calibrationSession.update({
      where: { id: sessionId },
      data: {
        name: name || session.name,
        description: description !== undefined ? description : session.description,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : session.scheduledAt,
        ...(status ? { status } : {}),
        ...(status === 'IN_PROGRESS' && !session.startedAt ? { startedAt: new Date() } : {})
      }
    })

    return NextResponse.json({
      success: true,
      data: updated
    })

  } catch (error) {
    console.error('[API] Error PUT session:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params
    const userContext = extractUserContext(request)
    const userEmail = request.headers.get('x-user-email') || ''

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

    const session = await prisma.calibrationSession.findFirst({
      where: { id: sessionId, accountId: userContext.accountId },
      include: {
        _count: { select: { adjustments: true } }
      }
    })

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Sesión no encontrada' },
        { status: 404 }
      )
    }

    // No permitir eliminar sesiones CLOSED (ya se aplicaron los ratings)
    if (session.status === 'CLOSED') {
      return NextResponse.json(
        { success: false, error: 'No se puede eliminar una sesión cerrada (ratings ya aplicados)' },
        { status: 400 }
      )
    }

    // ═══ ROLLBACK AUTOMÁTICO: Eliminar ajustes PENDING + sesión ═══
    // Como PerformanceRating NUNCA se tocó durante la sesión,
    // solo necesitamos limpiar los ajustes pendientes
    await prisma.$transaction([
      // Eliminar ajustes pendientes (rollback sin daño)
      prisma.calibrationAdjustment.deleteMany({
        where: {
          sessionId,
          status: 'PENDING'
        }
      }),
      // Eliminar sesión (cascade borra participantes también)
      prisma.calibrationSession.delete({
        where: { id: sessionId }
      })
    ])

    // Audit log (fuera de transacción)
    await prisma.auditLog.create({
      data: {
        action: 'CALIBRATION_SESSION_CANCELLED',
        accountId: userContext.accountId,
        entityType: 'calibration_session',
        entityId: sessionId,
        userInfo: {
          email: userEmail,
          sessionName: session.name,
          adjustmentsDiscarded: session._count.adjustments,
          reason: 'Session cancelled by user'
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: `Sesión cancelada. ${session._count.adjustments} ajustes descartados sin aplicar.`
    })

  } catch (error) {
    console.error('[API] Error DELETE session:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno' },
      { status: 500 }
    )
  }
}
