// ════════════════════════════════════════════════════════════════════════════
// API: GET /api/pdi
// Lista PDIs con filtros (por empleado, ciclo, status)
// ════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { extractUserContext, hasPermission } from '@/lib/services/AuthorizationService'

export async function GET(request: NextRequest) {
  try {
    // 1. Auth
    const userContext = extractUserContext(request)
    const userEmail = request.headers.get('x-user-email') || ''

    if (!userContext.accountId || !userEmail) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    // 2. Resolver Employee del usuario logueado
    const currentEmployee = await prisma.employee.findFirst({
      where: { accountId: userContext.accountId, email: userEmail, status: 'ACTIVE' }
    })

    if (!currentEmployee) {
      return NextResponse.json({ success: true, data: [], count: 0 })
    }

    // 3. Parse query params
    const { searchParams } = new URL(request.url)
    const employeeId = searchParams.get('employeeId')
    const cycleId = searchParams.get('cycleId')
    const status = searchParams.get('status')
    const role = searchParams.get('role') // 'manager' | 'employee' — qué PDIs quiero ver

    // 4. Construir filtro según rol
    const where: any = { accountId: userContext.accountId }

    const isHR = hasPermission(userContext.role, 'employees:read')

    if (isHR && employeeId) {
      // HR puede buscar por cualquier empleado
      where.employeeId = employeeId
    } else if (role === 'employee') {
      // Ver mis propios PDIs como empleado
      where.employeeId = currentEmployee.id
    } else {
      // Por defecto: ver PDIs donde soy manager
      where.managerId = currentEmployee.id
    }

    if (cycleId) where.cycleId = cycleId
    if (status) where.status = status

    // 5. Query
    const pdis = await prisma.developmentPlan.findMany({
      where,
      include: {
        goals: {
          orderBy: { priority: 'asc' }
        },
        checkIns: {
          orderBy: { scheduledDate: 'desc' },
          take: 3
        },
        employee: {
          select: { fullName: true, email: true, performanceTrack: true }
        },
        cycle: {
          select: { name: true, endDate: true }
        }
      },
      orderBy: { updatedAt: 'desc' }
    })

    return NextResponse.json({
      success: true,
      data: pdis,
      count: pdis.length
    })

  } catch (error) {
    console.error('[API] Error GET /api/pdi:', error)
    return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 })
  }
}
