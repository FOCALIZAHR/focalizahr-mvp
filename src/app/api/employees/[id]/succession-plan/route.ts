// ════════════════════════════════════════════════════════════════════════════
// API: /api/employees/[id]/succession-plan
// GET - Manager access to subordinate's succession development plan
// ════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { extractUserContext } from '@/lib/services/AuthorizationService'

export async function GET(
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
      select: { managerId: true, fullName: true },
    })

    if (!employee) {
      return NextResponse.json({ success: false, error: 'Empleado no encontrado' }, { status: 404 })
    }

    // Only direct manager or HR roles can access
    const isManager = employee.managerId === currentUser.id
    const isHR = !!userContext.role && ['FOCALIZAHR_ADMIN', 'ACCOUNT_OWNER', 'HR_ADMIN', 'HR_OPERATOR', 'CEO'].includes(userContext.role)

    if (!isManager && !isHR) {
      return NextResponse.json({ success: false, error: 'Sin permisos para ver este plan' }, { status: 403 })
    }

    // Fetch visible plans for this employee
    const whereClause: any = {
      employeeId,
      accountId: userContext.accountId,
    }

    // Managers only see plans marked as visible
    if (isManager && !isHR) {
      whereClause.visibleToDirectManager = true
    }

    const plans = await prisma.successionDevelopmentPlan.findMany({
      where: whereClause,
      select: {
        id: true,
        status: true,
        managerCanEditProgress: true,
        aiSuggestionsUsed: true,
        createdAt: true,
        // Statement v3.0 fields
        aiDiagnostic: true,
        managerBet: true,
        immediateAction: true,
        targetPositionTitle: true,
        targetJobLevel: true,
        estimatedReadinessMonths: true,
        originGapAnalysis: true,
        goals: { orderBy: [{ priority: 'asc' }, { createdAt: 'asc' }] },
        candidate: {
          select: {
            criticalPosition: {
              select: { positionTitle: true },
            },
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: plans,
      canEditProgress: plans.length > 0 && (isManager ? plans[0].managerCanEditProgress : isHR),
    })
  } catch (error: any) {
    console.error('[Employee SuccessionPlan GET] Error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
