// ════════════════════════════════════════════════════════════════════════════
// API: /api/succession/candidates/[id]/backfill-suggestions
// GET - Sugerencias de talento interno para cubrir la vacante del candidato
// ════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  extractUserContext,
  hasPermission,
} from '@/lib/services/AuthorizationService'
import { SuccessionService } from '@/lib/services/SuccessionService'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userContext = extractUserContext(request)
    const { id: candidateId } = await params

    if (!userContext.accountId) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    if (!hasPermission(userContext.role, 'succession:manage')) {
      return NextResponse.json({ success: false, error: 'Sin permisos' }, { status: 403 })
    }

    // 1. Get candidate + employee data
    const candidate = await prisma.successionCandidate.findFirst({
      where: { id: candidateId, accountId: userContext.accountId, status: 'ACTIVE' },
      select: {
        employeeId: true,
        employee: {
          select: { departmentId: true },
        },
      },
    })

    if (!candidate) {
      return NextResponse.json({ success: false, error: 'Candidato no encontrado' }, { status: 404 })
    }

    const vacatedDepartmentId = candidate.employee.departmentId
    if (!vacatedDepartmentId) {
      return NextResponse.json({ success: true, data: [] })
    }

    // 2. Get latest cycle
    const cycleId = await SuccessionService.getCurrentCycleId(userContext.accountId)
    if (!cycleId) {
      return NextResponse.json({ success: true, data: [] })
    }

    // 3. Query: employees in same department with roleFitScore >= 75, exclude the candidate
    const ratings = await prisma.performanceRating.findMany({
      where: {
        accountId: userContext.accountId,
        cycleId,
        roleFitScore: { gte: 75 },
        employee: {
          departmentId: vacatedDepartmentId,
          status: 'ACTIVE',
          id: { not: candidate.employeeId },
        },
      },
      orderBy: { roleFitScore: 'desc' },
      take: 4,
      select: {
        roleFitScore: true,
        employee: {
          select: {
            id: true,
            fullName: true,
            position: true,
            department: { select: { displayName: true } },
          },
        },
      },
    })

    const data = ratings.map(r => ({
      employeeId: r.employee.id,
      employeeName: r.employee.fullName,
      position: r.employee.position,
      departmentName: r.employee.department?.displayName ?? null,
      roleFitScore: r.roleFitScore ?? 0,
    }))

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('[GET /api/succession/candidates/[id]/backfill-suggestions]', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Error obteniendo sugerencias' },
      { status: 500 }
    )
  }
}
