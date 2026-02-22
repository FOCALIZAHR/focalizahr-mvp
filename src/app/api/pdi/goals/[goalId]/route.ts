// ════════════════════════════════════════════════════════════════════════════
// API: PATCH /api/pdi/goals/[goalId] - Auto-save individual goal fields
// ════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  extractUserContext,
  hasPermission,
  GLOBAL_ACCESS_ROLES,
  getChildDepartmentIds
} from '@/lib/services/AuthorizationService'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ goalId: string }> }
) {
  try {
    const { goalId } = await params
    const userContext = extractUserContext(request)
    const userEmail = request.headers.get('x-user-email') || ''

    if (!userContext.accountId || !userEmail) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    if (!hasPermission(userContext.role, 'evaluations:view')) {
      return NextResponse.json({ success: false, error: 'Sin permisos' }, { status: 403 })
    }

    const currentEmployee = await prisma.employee.findFirst({
      where: { accountId: userContext.accountId, email: userEmail, status: 'ACTIVE' }
    })

    if (!currentEmployee) {
      return NextResponse.json({ success: false, error: 'Empleado no encontrado' }, { status: 404 })
    }

    // Obtener goal con su plan para verificar acceso
    const goal = await prisma.developmentGoal.findUnique({
      where: { id: goalId },
      include: { plan: { select: { managerId: true, employeeId: true, status: true, accountId: true } } }
    })

    if (!goal) {
      return NextResponse.json({ success: false, error: 'Objetivo no encontrado' }, { status: 404 })
    }

    // Verificar que pertenece a la misma cuenta
    if (goal.plan.accountId !== userContext.accountId) {
      return NextResponse.json({ success: false, error: 'Sin acceso' }, { status: 403 })
    }

    // ════════════════════════════════════════════════════════════════════════
    // Capa 1: GLOBAL_ACCESS_ROLES - Acceso total a la empresa
    // ════════════════════════════════════════════════════════════════════════
    const hasGlobalAccess = GLOBAL_ACCESS_ROLES.includes(userContext.role as any)
    const isDirectManager = goal.plan.managerId === currentEmployee.id

    // ════════════════════════════════════════════════════════════════════════
    // Capa 2: AREA_MANAGER - Filtro jerárquico
    // ════════════════════════════════════════════════════════════════════════
    let hasHierarchicalAccess = false
    if (userContext.role === 'AREA_MANAGER' && userContext.departmentId) {
      const childDeptIds = await getChildDepartmentIds(userContext.departmentId)
      const allowedDepts = [userContext.departmentId, ...childDeptIds]
      const employeeInScope = await prisma.employee.findFirst({
        where: { id: goal.plan.employeeId, departmentId: { in: allowedDepts } },
        select: { id: true }
      })
      hasHierarchicalAccess = !!employeeInScope
    }

    if (!hasGlobalAccess && !isDirectManager && !hasHierarchicalAccess) {
      return NextResponse.json({ success: false, error: 'Solo el manager puede editar' }, { status: 403 })
    }

    // Solo editar en DRAFT
    if (goal.plan.status !== 'DRAFT') {
      return NextResponse.json(
        { success: false, error: 'Solo se puede editar en estado DRAFT' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { title, targetOutcome } = body

    const updateData: Record<string, string> = {}
    if (title !== undefined) updateData.title = title
    if (targetOutcome !== undefined) updateData.targetOutcome = targetOutcome

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ success: true, data: goal })
    }

    const updated = await prisma.developmentGoal.update({
      where: { id: goalId },
      data: updateData
    })

    return NextResponse.json({ success: true, data: updated })

  } catch (error) {
    console.error('[API] Error PATCH /api/pdi/goals/[goalId]:', error)
    return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 })
  }
}
