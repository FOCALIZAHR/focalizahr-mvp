// src/app/api/goals/[id]/request-closure/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  extractUserContext,
  hasPermission,
  getChildDepartmentIds,
  GLOBAL_ACCESS_ROLES
} from '@/lib/services/AuthorizationService'

// ════════════════════════════════════════════════════════════════════════════
// POST - Solicitar cierre de meta
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
    // Cualquiera que puede ver metas puede solicitar cierre de las suyas
    if (!hasPermission(context.role, 'goals:view')) {
      return NextResponse.json(
        { error: 'Sin permisos', success: false },
        { status: 403 }
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
            email: true,
            managerId: true,
            departmentId: true
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

    // ═══ Validación: Estado actual ═══
    if (goal.status === 'COMPLETED') {
      return NextResponse.json(
        { error: 'La meta ya está completada', success: false },
        { status: 400 }
      )
    }

    if (goal.status === 'CANCELLED') {
      return NextResponse.json(
        { error: 'No se puede cerrar una meta cancelada', success: false },
        { status: 400 }
      )
    }

    if (goal.status === 'PENDING_CLOSURE') {
      return NextResponse.json(
        { error: 'La meta ya tiene una solicitud de cierre pendiente', success: false },
        { status: 400 }
      )
    }

    // ═══ Validación: Progreso mínimo 80% ═══
    if (goal.progress < 80) {
      return NextResponse.json(
        {
          error: `La meta debe tener al menos 80% de progreso para solicitar cierre. Progreso actual: ${goal.progress}%`,
          success: false
        },
        { status: 400 }
      )
    }

    // ═══ Validación: Permisos sobre la meta ═══
    // Obtener el empleado actual
    const currentEmployee = await prisma.employee.findFirst({
      where: {
        accountId: context.accountId,
        email: userEmail,
        status: 'ACTIVE'
      },
      select: { id: true, fullName: true }
    })

    const hasGlobalAccess = GLOBAL_ACCESS_ROLES.includes(context.role as any)
    let canRequestClosure = false
    let requestedByName = 'Sistema'

    if (hasGlobalAccess) {
      // Roles globales pueden solicitar cierre de cualquier meta
      canRequestClosure = true
      requestedByName = currentEmployee?.fullName || 'Administrador'
    } else if (context.role === 'AREA_MANAGER' && context.departmentId) {
      // AREA_MANAGER puede cerrar metas de su scope
      const childIds = await getChildDepartmentIds(context.departmentId)
      const allowedDepts = [context.departmentId, ...childIds]

      if (goal.level === 'COMPANY') {
        canRequestClosure = false // No puede cerrar corporativas
      } else if (goal.level === 'AREA' && goal.departmentId) {
        canRequestClosure = allowedDepts.includes(goal.departmentId)
      } else if (goal.level === 'INDIVIDUAL' && goal.owner?.departmentId) {
        canRequestClosure = allowedDepts.includes(goal.owner.departmentId)
      }
      requestedByName = currentEmployee?.fullName || 'Gerente de Área'
    } else if (context.role === 'EVALUATOR' && currentEmployee) {
      // EVALUATOR puede cerrar metas de sus subordinados directos
      if (goal.level === 'INDIVIDUAL' && goal.owner?.managerId === currentEmployee.id) {
        canRequestClosure = true
      }
      requestedByName = currentEmployee.fullName
    } else if (currentEmployee) {
      // Usuario regular: solo puede cerrar sus propias metas
      if (goal.level === 'INDIVIDUAL' && goal.employeeId === currentEmployee.id) {
        canRequestClosure = true
      }
      requestedByName = currentEmployee.fullName
    }

    if (!canRequestClosure) {
      return NextResponse.json(
        { error: 'No tiene permisos para solicitar cierre de esta meta', success: false },
        { status: 403 }
      )
    }

    // ═══ Actualizar meta a PENDING_CLOSURE ═══
    const updatedGoal = await prisma.goal.update({
      where: { id },
      data: {
        status: 'PENDING_CLOSURE',
        closureRequestedAt: new Date(),
        closureRequestedBy: requestedByName,
      },
      include: {
        owner: { select: { id: true, fullName: true } },
        department: { select: { id: true, displayName: true } },
      }
    })

    // ═══ Crear registro en historial de progreso ═══
    await prisma.goalProgressUpdate.create({
      data: {
        goalId: id,
        accountId: context.accountId,
        previousValue: goal.currentValue,
        newValue: goal.currentValue,
        previousProgress: goal.progress,
        newProgress: goal.progress,
        comment: `Solicitud de cierre enviada por ${requestedByName}`,
        updatedById: currentEmployee?.id || context.userId || context.accountId,
      }
    })

    return NextResponse.json({
      data: updatedGoal,
      message: 'Solicitud de cierre enviada correctamente',
      success: true,
    })

  } catch (error) {
    console.error('[API Request Closure]:', error)
    return NextResponse.json(
      { error: 'Error solicitando cierre de meta', success: false },
      { status: 500 }
    )
  }
}
