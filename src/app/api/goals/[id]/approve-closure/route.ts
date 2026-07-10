// src/app/api/goals/[id]/approve-closure/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { extractUserContext, hasPermission } from '@/lib/services/AuthorizationService'
import { GoalsService, GoalClosureError, type GoalClosureActor } from '@/lib/services/GoalsService'
import { z } from 'zod'

// Schema de validación
const approveSchema = z.object({
  action: z.enum(['approve', 'reject']),
  notes: z.string().optional(),
  reason: z.string().optional(), // Obligatorio si reject
})

// ════════════════════════════════════════════════════════════════════════════
// POST - Aprobar o rechazar cierre de meta
// Thin controller: auth de endpoint + validación de body + arma el actor +
// delega en GoalsService. La lógica (estado, scope, reversión, auditoría) vive
// en el servicio.
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

    if (!hasPermission(context.role, 'goals:approve')) {
      return NextResponse.json(
        { error: 'Sin permisos para aprobar cierres', success: false },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validation = approveSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: validation.error.flatten(), success: false },
        { status: 400 }
      )
    }

    const { action, notes, reason } = validation.data

    if (action === 'reject' && !reason) {
      return NextResponse.json(
        { error: 'Debe proporcionar un motivo para rechazar', success: false },
        { status: 400 }
      )
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

    const updatedGoal = action === 'approve'
      ? await GoalsService.approveClosure(id, actor, { notes })
      : await GoalsService.rejectClosure(id, actor, { reason: reason! })

    return NextResponse.json({
      data: updatedGoal,
      action,
      message: action === 'approve'
        ? 'Meta aprobada y completada correctamente'
        : 'Solicitud de cierre rechazada',
      success: true,
    })

  } catch (error) {
    if (error instanceof GoalClosureError) {
      return NextResponse.json(
        { error: error.message, success: false },
        { status: mapClosureError(error) }
      )
    }
    console.error('[API Approve Closure]:', error)
    return NextResponse.json(
      { error: 'Error procesando aprobación', success: false },
      { status: 500 }
    )
  }
}
