// ════════════════════════════════════════════════════════════════════════════
// API: /api/succession/critical-positions
// GET - Lista posiciones criticas
// POST - Crear posicion critica
// ════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  extractUserContext,
  hasPermission,
  getChildDepartmentIds,
} from '@/lib/services/AuthorizationService'

export async function GET(request: NextRequest) {
  try {
    const userContext = extractUserContext(request)

    if (!userContext.accountId) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    if (!hasPermission(userContext.role, 'succession:view')) {
      return NextResponse.json({ success: false, error: 'Sin permisos' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const departmentFilter = searchParams.get('departmentId')
    const benchFilter = searchParams.get('benchStrength')

    // Build WHERE
    const where: any = { accountId: userContext.accountId, isActive: true }

    // AREA_MANAGER: hierarchical filter
    if (userContext.role === 'AREA_MANAGER' && userContext.departmentId) {
      const childIds = await getChildDepartmentIds(userContext.departmentId)
      const allowedDepts = [userContext.departmentId, ...childIds]
      where.departmentId = { in: allowedDepts }
    } else if (departmentFilter) {
      where.departmentId = departmentFilter
    }

    if (benchFilter) {
      where.benchStrength = benchFilter
    }

    const positions = await prisma.criticalPosition.findMany({
      where,
      include: {
        department: { select: { displayName: true } },
        incumbent: { select: { id: true, fullName: true, position: true } },
        _count: { select: { candidates: { where: { status: 'ACTIVE' } } } },
      },
      orderBy: [{ benchStrength: 'asc' }, { createdAt: 'desc' }],
    })

    return NextResponse.json({
      success: true,
      data: positions,
      permissions: { canManage: hasPermission(userContext.role, 'succession:manage') },
    })
  } catch (error: any) {
    console.error('[Succession Positions GET] Error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userContext = extractUserContext(request)
    const userEmail = request.headers.get('x-user-email') || ''

    if (!userContext.accountId || !userEmail) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    if (!hasPermission(userContext.role, 'succession:manage')) {
      return NextResponse.json({ success: false, error: 'Sin permisos' }, { status: 403 })
    }

    const body = await request.json()
    const { positionTitle, standardJobLevel, departmentId, incumbentId } = body

    if (!positionTitle || !standardJobLevel) {
      return NextResponse.json(
        { success: false, error: 'positionTitle y standardJobLevel son requeridos' },
        { status: 400 }
      )
    }

    // Check unique constraint
    const existing = await prisma.criticalPosition.findFirst({
      where: {
        accountId: userContext.accountId,
        positionTitle,
        departmentId: departmentId || null,
        isActive: true,
      }
    })
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Ya existe una posicion critica con ese titulo en este departamento' },
        { status: 409 }
      )
    }

    // Auto-populate incumbentFlightRisk if incumbent provided
    let incumbentFlightRisk: string | null = null
    if (incumbentId) {
      const rating = await prisma.performanceRating.findFirst({
        where: {
          employeeId: incumbentId,
          riskQuadrant: { not: null },
        },
        orderBy: { createdAt: 'desc' },
        select: { riskQuadrant: true, riskAlertLevel: true },
      })
      if (rating?.riskQuadrant === 'FUGA_CEREBROS') incumbentFlightRisk = 'HIGH'
      else if (rating?.riskAlertLevel === 'RED' || rating?.riskAlertLevel === 'ORANGE') incumbentFlightRisk = 'MEDIUM'
      else if (rating?.riskAlertLevel) incumbentFlightRisk = 'LOW'
    }

    const position = await prisma.criticalPosition.create({
      data: {
        accountId: userContext.accountId,
        positionTitle,
        standardJobLevel,
        departmentId: departmentId || null,
        incumbentId: incumbentId || null,
        incumbentFlightRisk,
        createdBy: userEmail,
      },
      include: {
        department: { select: { displayName: true } },
        incumbent: { select: { id: true, fullName: true, position: true } },
      },
    })

    return NextResponse.json({ success: true, data: position }, { status: 201 })
  } catch (error: any) {
    console.error('[Succession Positions POST] Error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
