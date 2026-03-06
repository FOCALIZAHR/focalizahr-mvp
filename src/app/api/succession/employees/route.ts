// ════════════════════════════════════════════════════════════════════════════
// API: /api/succession/employees
// GET - Employees filtered by department + job level (for incumbent selector)
// ════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { extractUserContext, hasPermission } from '@/lib/services/AuthorizationService'

export async function GET(request: NextRequest) {
  try {
    const userContext = extractUserContext(request)

    if (!userContext.accountId) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    if (!hasPermission(userContext.role, 'succession:manage')) {
      return NextResponse.json({ success: false, error: 'Sin permisos' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const departmentId = searchParams.get('departmentId')
    const jobLevel = searchParams.get('jobLevel')

    if (!departmentId) {
      return NextResponse.json({ success: true, data: [] })
    }

    const where: any = {
      accountId: userContext.accountId,
      departmentId,
      status: 'ACTIVE',
    }

    if (jobLevel) {
      where.standardJobLevel = jobLevel
    }

    const employees = await prisma.employee.findMany({
      where,
      select: {
        id: true,
        fullName: true,
        position: true,
        standardJobLevel: true,
      },
      orderBy: { fullName: 'asc' },
      take: 50,
    })

    return NextResponse.json({ success: true, data: employees })
  } catch (error: any) {
    console.error('[Succession Employees] Error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
