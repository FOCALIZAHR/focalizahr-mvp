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

    const { searchParams } = request.nextUrl
    const unreadOnly = searchParams.get('unread') === 'true'
    const page = Math.max(parseInt(searchParams.get('page') || '1'), 1)
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '20'), 1), 50)
    const skip = (page - 1) * limit

    // Sin empleado direccionable → sin bandeja (no error, contrato consistente)
    if (!currentEmployee) {
      return NextResponse.json({
        success: true,
        data: [],
        unreadCount: 0,
        pagination: { page, limit, total: 0, pages: 0 },
      })
    }

    const where: any = {
      accountId: context.accountId,
      recipientEmployeeId: currentEmployee.id,
    }
    if (unreadOnly) {
      where.readAt = null
    }

    // unreadCount = TODOS los no leídos del empleado (independiente de filtro/página)
    const [alerts, total, unreadCount] = await Promise.all([
      prisma.goalAlert.findMany({
        where,
        orderBy: [
          { readAt: { sort: 'asc', nulls: 'first' } }, // no leídos primero
          { createdAt: 'desc' },
        ],
        skip,
        take: limit,
      }),
      prisma.goalAlert.count({ where }),
      prisma.goalAlert.count({
        where: { accountId: context.accountId, recipientEmployeeId: currentEmployee.id, readAt: null },
      }),
    ])

    return NextResponse.json({
      success: true,
      data: alerts,
      unreadCount,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    })

  } catch (error) {
    console.error('[API Goal Alerts GET]:', error)
    return NextResponse.json(
      { error: 'Error obteniendo avisos de metas', success: false },
      { status: 500 }
    )
  }
}
