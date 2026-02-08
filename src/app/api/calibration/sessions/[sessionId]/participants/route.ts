// ════════════════════════════════════════════════════════════════════════════
// API: /api/calibration/sessions/[sessionId]/participants
// GET - Listar | POST - Agregar | DELETE - Eliminar participante
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

    if (!userContext.accountId) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    // ═══ CHECK 3: accountId en WHERE ═══
    const session = await prisma.calibrationSession.findFirst({
      where: { id: sessionId, accountId: userContext.accountId }
    })

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Sesión no encontrada' },
        { status: 404 }
      )
    }

    const participants = await prisma.calibrationParticipant.findMany({
      where: { sessionId },
      orderBy: { invitedAt: 'asc' }
    })

    return NextResponse.json({
      success: true,
      data: participants
    })

  } catch (error) {
    console.error('[API] Error GET participants:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno' },
      { status: 500 }
    )
  }
}

export async function POST(
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

    // ═══ CHECK 2: hasPermission ═══
    if (!hasPermission(userContext.role, 'calibration:manage')) {
      return NextResponse.json(
        { success: false, error: 'Sin permisos' },
        { status: 403 }
      )
    }

    // ═══ CHECK 3: accountId en WHERE ═══
    const session = await prisma.calibrationSession.findFirst({
      where: { id: sessionId, accountId: userContext.accountId }
    })

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Sesión no encontrada' },
        { status: 404 }
      )
    }

    if (session.status === 'CLOSED') {
      return NextResponse.json(
        { success: false, error: 'No se pueden agregar participantes a sesiones cerradas' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { participantEmail, participantName, role } = body

    if (!participantEmail || !participantName || !role) {
      return NextResponse.json(
        { success: false, error: 'participantEmail, participantName y role son requeridos' },
        { status: 400 }
      )
    }

    if (!['FACILITATOR', 'REVIEWER', 'OBSERVER'].includes(role)) {
      return NextResponse.json(
        { success: false, error: 'role debe ser FACILITATOR, REVIEWER o OBSERVER' },
        { status: 400 }
      )
    }

    // Crear participante
    const participant = await prisma.calibrationParticipant.create({
      data: {
        sessionId,
        participantEmail,
        participantName,
        role
      }
    })

    return NextResponse.json({
      success: true,
      data: participant,
      message: 'Participante agregado exitosamente'
    }, { status: 201 })

  } catch (error: any) {
    // Manejar unique constraint violation
    if (error.code === 'P2002') {
      return NextResponse.json(
        { success: false, error: 'Este participante ya está en la sesión' },
        { status: 409 }
      )
    }

    console.error('[API] Error POST participant:', error)
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
    const { searchParams } = new URL(request.url)
    const participantId = searchParams.get('participantId')

    if (!userContext.accountId) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    // ═══ CHECK 2: hasPermission ═══
    if (!hasPermission(userContext.role, 'calibration:manage')) {
      return NextResponse.json(
        { success: false, error: 'Sin permisos' },
        { status: 403 }
      )
    }

    if (!participantId) {
      return NextResponse.json(
        { success: false, error: 'participantId es requerido' },
        { status: 400 }
      )
    }

    // ═══ CHECK 3: accountId en WHERE ═══
    const session = await prisma.calibrationSession.findFirst({
      where: { id: sessionId, accountId: userContext.accountId }
    })

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Sesión no encontrada' },
        { status: 404 }
      )
    }

    if (session.status === 'CLOSED') {
      return NextResponse.json(
        { success: false, error: 'No se pueden eliminar participantes de sesiones cerradas' },
        { status: 400 }
      )
    }

    await prisma.calibrationParticipant.delete({
      where: { id: participantId }
    })

    return NextResponse.json({
      success: true,
      message: 'Participante eliminado'
    })

  } catch (error) {
    console.error('[API] Error DELETE participant:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno' },
      { status: 500 }
    )
  }
}
