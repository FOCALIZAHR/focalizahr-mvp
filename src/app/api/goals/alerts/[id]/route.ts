// src/app/api/goals/alerts/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { extractUserContext, hasPermission } from '@/lib/services/AuthorizationService'

// ════════════════════════════════════════════════════════════════════════════
// PATCH - Marcar un aviso de meta como leído.
// Ownership: solo el destinatario puede marcar leído el suyo (el updateMany
// filtra por recipientEmployeeId + accountId → count 0 = 404).
// ════════════════════════════════════════════════════════════════════════════

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // ═══ CHECK 2: hasPermission ═══
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

    if (!currentEmployee) {
      return NextResponse.json(
        { error: 'Aviso no encontrado', success: false },
        { status: 404 }
      )
    }

    // ═══ Marcar leído SOLO si es del empleado actual (ownership + multi-tenant) ═══
    const result = await prisma.goalAlert.updateMany({
      where: {
        id: params.id,
        accountId: context.accountId,
        recipientEmployeeId: currentEmployee.id,
      },
      data: {
        readAt: new Date(),
        readBy: currentEmployee.id,
      },
    })

    if (result.count === 0) {
      return NextResponse.json(
        { error: 'Aviso no encontrado', success: false },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: { id: params.id, read: true }, success: true })

  } catch (error) {
    console.error('[API Goal Alerts PATCH]:', error)
    return NextResponse.json(
      { error: 'Error marcando aviso como leído', success: false },
      { status: 500 }
    )
  }
}
