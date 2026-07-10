// src/app/api/goals/[id]/request-closure/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { extractUserContext, hasPermission } from '@/lib/services/AuthorizationService'
import { GoalsService, GoalClosureError, type GoalClosureActor } from '@/lib/services/GoalsService'

// ════════════════════════════════════════════════════════════════════════════
// POST - Solicitar cierre de meta
// Thin controller: auth de endpoint + arma el actor + delega en GoalsService.
// La lógica de negocio (estado, gate ≥80%, scope, auditoría) vive en el servicio.
// ════════════════════════════════════════════════════════════════════════════

function mapClosureError(error: GoalClosureError): number {
  return error.code === 'NOT_FOUND' ? 404
    : error.code === 'FORBIDDEN_SCOPE' ? 403
    : 400
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const context = extractUserContext(request)
    const userEmail = request.headers.get('x-user-email') || ''

    if (!context.accountId) {
      return NextResponse.json({ error: 'No autorizado', success: false }, { status: 401 })
    }

    // Cualquiera que puede ver metas puede solicitar cierre de las suyas (el
    // scope fino lo aplica el servicio).
    if (!hasPermission(context.role, 'goals:view')) {
      return NextResponse.json({ error: 'Sin permisos', success: false }, { status: 403 })
    }

    const currentEmployee = await prisma.employee.findFirst({
      where: { accountId: context.accountId, email: userEmail, status: 'ACTIVE' },
      select: { id: true, fullName: true },
    })

    const actor: GoalClosureActor = {
      accountId: context.accountId,
      role: context.role,
      departmentId: context.departmentId,
      userId: context.userId,
      employeeId: currentEmployee?.id ?? null,
      employeeName: currentEmployee?.fullName ?? null,
    }

    const updatedGoal = await GoalsService.requestClosure(id, actor)

    return NextResponse.json({
      data: updatedGoal,
      message: 'Solicitud de cierre enviada correctamente',
      success: true,
    })

  } catch (error) {
    if (error instanceof GoalClosureError) {
      return NextResponse.json(
        { error: error.message, success: false },
        { status: mapClosureError(error) }
      )
    }
    console.error('[API Request Closure]:', error)
    return NextResponse.json(
      { error: 'Error solicitando cierre de meta', success: false },
      { status: 500 }
    )
  }
}
