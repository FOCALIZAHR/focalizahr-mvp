// src/app/api/goals/[id]/approve-closure/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  extractUserContext,
  hasPermission,
  getChildDepartmentIds,
  GLOBAL_ACCESS_ROLES
} from '@/lib/services/AuthorizationService'
import { z } from 'zod'

// Schema de validación
const approveSchema = z.object({
  action: z.enum(['approve', 'reject']),
  notes: z.string().optional(),
  reason: z.string().optional(), // Obligatorio si reject
})

// ════════════════════════════════════════════════════════════════════════════
// POST - Aprobar o rechazar cierre de meta
// ════════════════════════════════════════════════════════════════════════════

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

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
    if (!hasPermission(context.role, 'goals:approve')) {
      return NextResponse.json(
        { error: 'Sin permisos para aprobar cierres', success: false },
        { status: 403 }
      )
    }

    // Validar body
    const body = await request.json()
    const validation = approveSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: validation.error.flatten(), success: false },
        { status: 400 }
      )
    }

    const { action, notes, reason } = validation.data

    // Validar reason obligatorio para reject
    if (action === 'reject' && !reason) {
      return NextResponse.json(
        { error: 'Debe proporcionar un motivo para rechazar', success: false },
        { status: 400 }
      )
    }

    // ═══ Obtener la meta ═══
    const goal = await prisma.goal.findFirst({
      where: {
        id,
        accountId: context.accountId,
      },
      include: {
        owner: {
          select: {
            id: true,
            fullName: true,
            departmentId: true,
            managerId: true
          }
        },
        department: { select: { id: true, displayName: true } },
      }
    })

    if (!goal) {
      return NextResponse.json(
        { error: 'Meta no encontrada', success: false },
        { status: 404 }
      )
    }

    // ═══ Validación: Estado debe ser PENDING_CLOSURE ═══
    if (goal.status !== 'PENDING_CLOSURE') {
      return NextResponse.json(
        { error: 'La meta no está pendiente de aprobación', success: false },
        { status: 400 }
      )
    }

    // ═══ Validación: Scope según rol ═══
    const currentEmployee = await prisma.employee.findFirst({
      where: {
        accountId: context.accountId,
        email: userEmail,
        status: 'ACTIVE'
      },
      select: { id: true, fullName: true }
    })

    const hasGlobalAccess = GLOBAL_ACCESS_ROLES.includes(context.role as any)
    let canApprove = false
    const approverName = currentEmployee?.fullName || 'Administrador'

    if (hasGlobalAccess) {
      // Roles globales pueden aprobar cualquier meta
      canApprove = true
    } else if (context.role === 'AREA_MANAGER' && context.departmentId) {
      // AREA_MANAGER puede aprobar metas de su scope (excepto COMPANY)
      const childIds = await getChildDepartmentIds(context.departmentId)
      const allowedDepts = [context.departmentId, ...childIds]

      if (goal.level === 'COMPANY') {
        canApprove = false // No puede aprobar corporativas
      } else if (goal.level === 'AREA' && goal.departmentId) {
        canApprove = allowedDepts.includes(goal.departmentId)
      } else if (goal.level === 'INDIVIDUAL' && goal.owner?.departmentId) {
        canApprove = allowedDepts.includes(goal.owner.departmentId)
      }
    }

    if (!canApprove) {
      return NextResponse.json(
        { error: 'No tiene permisos para aprobar esta meta', success: false },
        { status: 403 }
      )
    }

    // ═══ Ejecutar acción ═══
    let updatedGoal

    if (action === 'approve') {
      // APROBAR: Pasar a COMPLETED
      updatedGoal = await prisma.goal.update({
        where: { id },
        data: {
          status: 'COMPLETED',
          closedAt: new Date(),
          closedBy: approverName,
          closureApprovedBy: approverName,
          closureNotes: notes || null,
          completedAt: new Date(),
        },
        include: {
          owner: { select: { id: true, fullName: true } },
          department: { select: { id: true, displayName: true } },
        }
      })

      // Registrar en historial
      await prisma.goalProgressUpdate.create({
        data: {
          goalId: id,
          accountId: context.accountId,
          previousValue: goal.currentValue,
          newValue: goal.currentValue,
          previousProgress: goal.progress,
          newProgress: goal.progress,
          comment: `Meta aprobada y completada por ${approverName}${notes ? `. Notas: ${notes}` : ''}`,
          updatedById: currentEmployee?.id || context.userId || context.accountId,
        }
      })

    } else {
      // RECHAZAR: Volver a estado anterior basado en progreso
      const previousStatus = goal.progress >= 90 ? 'ON_TRACK'
        : goal.progress >= 70 ? 'AT_RISK'
        : goal.progress > 0 ? 'BEHIND'
        : 'NOT_STARTED'

      updatedGoal = await prisma.goal.update({
        where: { id },
        data: {
          status: previousStatus,
          closureRequestedAt: null,
          closureRequestedBy: null,
          closureNotes: reason || null,
        },
        include: {
          owner: { select: { id: true, fullName: true } },
          department: { select: { id: true, displayName: true } },
        }
      })

      // Registrar en historial
      await prisma.goalProgressUpdate.create({
        data: {
          goalId: id,
          accountId: context.accountId,
          previousValue: goal.currentValue,
          newValue: goal.currentValue,
          previousProgress: goal.progress,
          newProgress: goal.progress,
          comment: `Solicitud de cierre rechazada por ${approverName}. Motivo: ${reason}`,
          updatedById: currentEmployee?.id || context.userId || context.accountId,
        }
      })
    }

    return NextResponse.json({
      data: updatedGoal,
      action,
      message: action === 'approve'
        ? 'Meta aprobada y completada correctamente'
        : 'Solicitud de cierre rechazada',
      success: true,
    })

  } catch (error) {
    console.error('[API Approve Closure]:', error)
    return NextResponse.json(
      { error: 'Error procesando aprobación', success: false },
      { status: 500 }
    )
  }
}
