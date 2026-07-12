// src/app/api/goals/alerts/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { extractUserContext, hasPermission } from '@/lib/services/AuthorizationService'

// ════════════════════════════════════════════════════════════════════════════
// GET - Bandeja personal de avisos de metas (GoalAlert)
// Devuelve SOLO los avisos cuyo destinatario es el empleado actual.
// ?unread=true → solo no leídos (readAt: null).
// ════════════════════════════════════════════════════════════════════════════

export async function GET(request: NextRequest) {
  try {
    // ═══ CHECK 1: extractUserContext ═══
    const context = extractUserContext(request)
    const userEmail = request.headers.get('x-user-email') || ''

    if (!context.accountId) {
      return NextResponse.json(
        { error: 'No autorizado', success: false },
        { status: 401 }
      )
    }

    // ═══ CHECK 2: hasPermission (el ownership lo cierra recipientEmployeeId) ═══
    if (!hasPermission(context.role, 'goals:view')) {
      return NextResponse.json(
        { error: 'Sin permisos', success: false },
        { status: 403 }
      )
    }

    // ═══ Resolver empleado actual (patrón del dominio: status ACTIVE) ═══
    const currentEmployee = await prisma.employee.findFirst({
      where: { accountId: context.accountId, email: userEmail, status: 'ACTIVE' },
      select: { id: true },
    })

    // Sin empleado direccionable → sin bandeja (no error)
    if (!currentEmployee) {
      return NextResponse.json({ data: [], success: true })
    }

    const unreadOnly = request.nextUrl.searchParams.get('unread') === 'true'

    const where: any = {
      accountId: context.accountId,
      recipientEmployeeId: currentEmployee.id,
    }
    if (unreadOnly) {
      where.readAt = null
    }

    const alerts = await prisma.goalAlert.findMany({
      where,
      include: {
        goal: { select: { id: true, title: true, status: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      data: alerts,
      unreadCount: alerts.filter(a => a.readAt === null).length,
      success: true,
    })

  } catch (error) {
    console.error('[API Goal Alerts GET]:', error)
    return NextResponse.json(
      { error: 'Error obteniendo avisos de metas', success: false },
      { status: 500 }
    )
  }
}
