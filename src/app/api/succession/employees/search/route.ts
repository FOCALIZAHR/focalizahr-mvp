// ════════════════════════════════════════════════════════════════════════════
// API: /api/succession/employees/search
// GET - Buscar empleados por nombre para nominación manual (dominó)
// ════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  extractUserContext,
  hasPermission,
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
    const query = searchParams.get('q')?.trim()
    const positionId = searchParams.get('positionId')
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 20)

    if (!query || query.length < 2) {
      return NextResponse.json({ success: true, data: [] })
    }

    // Buscar empleados por nombre
    const employees = await prisma.employee.findMany({
      where: {
        accountId: userContext.accountId,
        status: 'ACTIVE',
        fullName: { contains: query, mode: 'insensitive' },
      },
      select: {
        id: true,
        fullName: true,
        position: true,
        department: { select: { displayName: true } },
      },
      take: limit,
      orderBy: { fullName: 'asc' },
    })

    // Si hay positionId, verificar cuáles ya están nominados
    let nominatedEmployeeIds = new Set<string>()
    if (positionId) {
      const nominated = await prisma.successionCandidate.findMany({
        where: {
          criticalPositionId: positionId,
          status: 'ACTIVE',
        },
        select: { employeeId: true },
      })
      nominatedEmployeeIds = new Set(nominated.map(n => n.employeeId))
    }

    // Buscar roleFitScore del ciclo activo
    const cycle = await prisma.performanceCycle.findFirst({
      where: {
        accountId: userContext.accountId,
        status: { in: ['ACTIVE', 'IN_REVIEW', 'COMPLETED'] },
        performanceRatings: { some: { roleFitScore: { not: null } } },
      },
      orderBy: { endDate: 'desc' },
      select: { id: true },
    })

    let roleFitMap = new Map<string, number>()
    if (cycle) {
      const ratings = await prisma.performanceRating.findMany({
        where: {
          cycleId: cycle.id,
          employeeId: { in: employees.map(e => e.id) },
          roleFitScore: { not: null },
        },
        select: { employeeId: true, roleFitScore: true },
      })
      for (const r of ratings) {
        if (r.roleFitScore != null) {
          roleFitMap.set(r.employeeId, r.roleFitScore)
        }
      }
    }

    const data = employees.map(e => ({
      id: e.id,
      fullName: e.fullName,
      position: e.position,
      departmentName: e.department?.displayName || null,
      roleFitScore: roleFitMap.get(e.id) ?? 0,
      meetsThreshold: (roleFitMap.get(e.id) ?? 0) >= 75,
      alreadyNominated: nominatedEmployeeIds.has(e.id),
    }))

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('[GET /api/succession/employees/search]', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Error buscando empleados' },
      { status: 500 }
    )
  }
}
