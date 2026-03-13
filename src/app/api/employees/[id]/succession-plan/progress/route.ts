// ════════════════════════════════════════════════════════════════════════════
// API: /api/employees/[id]/succession-plan/progress
// PUT - Manager updates goal progress on subordinate's succession plan
// ════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { extractUserContext } from '@/lib/services/AuthorizationService'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userContext = extractUserContext(request)
    const userEmail = request.headers.get('x-user-email') || ''
    const { id: employeeId } = await params

    if (!userContext.accountId || !userEmail) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { goalId, progressPercent, status } = body as {
      goalId: string
      progressPercent?: number
      status?: string
    }

    if (!goalId) {
      return NextResponse.json({ success: false, error: 'goalId requerido' }, { status: 400 })
    }

    // Verify requesting user is the direct manager
    const currentUser = await prisma.employee.findFirst({
      where: { accountId: userContext.accountId, email: userEmail, status: 'ACTIVE' },
      select: { id: true },
    })

    if (!currentUser) {
      return NextResponse.json({ success: false, error: 'Usuario no encontrado' }, { status: 404 })
    }

    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, accountId: userContext.accountId },
      select: { managerId: true },
    })

    const isManager = employee?.managerId === currentUser.id
    const isHR = !!userContext.role && ['FOCALIZAHR_ADMIN', 'ACCOUNT_OWNER', 'HR_ADMIN', 'HR_OPERATOR', 'CEO'].includes(userContext.role)

    if (!isManager && !isHR) {
      return NextResponse.json({ success: false, error: 'Sin permisos para editar progreso' }, { status: 403 })
    }

    // Fetch plan and verify edit permissions
    const goal = await prisma.successionDevelopmentGoal.findFirst({
      where: { id: goalId },
      include: {
        plan: {
          select: {
            employeeId: true,
            accountId: true,
            visibleToDirectManager: true,
            managerCanEditProgress: true,
          },
        },
      },
    })

    if (!goal || goal.plan.employeeId !== employeeId || goal.plan.accountId !== userContext.accountId) {
      return NextResponse.json({ success: false, error: 'Goal no encontrado' }, { status: 404 })
    }

    // HR can always edit; managers need explicit permission
    if (!isHR && (!goal.plan.visibleToDirectManager || !goal.plan.managerCanEditProgress)) {
      return NextResponse.json({ success: false, error: 'No tienes permiso para editar progreso' }, { status: 403 })
    }

    // Update goal
    const updateData: Record<string, any> = {}
    if (progressPercent !== undefined) updateData.progressPercent = Math.max(0, Math.min(100, progressPercent))
    if (status !== undefined) updateData.status = status
    if (status === 'COMPLETED') updateData.completedAt = new Date()

    const updated = await prisma.successionDevelopmentGoal.update({
      where: { id: goalId },
      data: updateData,
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error: any) {
    console.error('[Employee SuccessionPlan Progress PUT] Error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
