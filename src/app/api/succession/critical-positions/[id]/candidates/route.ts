// ════════════════════════════════════════════════════════════════════════════
// API: /api/succession/critical-positions/[id]/candidates
// GET - Lista candidatos nominados
// POST - Nominar candidato
// ════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  extractUserContext,
  hasPermission,
} from '@/lib/services/AuthorizationService'
import { SuccessionService } from '@/lib/services/SuccessionService'
import { SuccessionSyncService } from '@/lib/services/SuccessionSyncService'
import { sortCandidates, READINESS_LABELS } from '@/config/successionConstants'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userContext = extractUserContext(request)
    const { id } = await params

    if (!userContext.accountId) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    if (!hasPermission(userContext.role, 'succession:view')) {
      return NextResponse.json({ success: false, error: 'Sin permisos' }, { status: 403 })
    }

    // Verify ownership
    const position = await prisma.criticalPosition.findFirst({
      where: { id, accountId: userContext.accountId, isActive: true },
    })
    if (!position) {
      return NextResponse.json({ success: false, error: 'Posicion no encontrada' }, { status: 404 })
    }

    const candidates = await prisma.successionCandidate.findMany({
      where: { criticalPositionId: id, status: 'ACTIVE' },
      include: {
        employee: {
          select: {
            id: true, fullName: true, position: true,
            department: { select: { displayName: true } },
          }
        },
        developmentPlan: { select: { id: true, status: true } },
      },
    })

    // Sort and add labels
    const sorted = sortCandidates(
      candidates.map(c => ({
        ...c,
        readinessLevel: (c.readinessOverride || c.readinessLevel) as string,
        matchPercent: c.matchPercent,
        readinessLabel: READINESS_LABELS[(c.readinessOverride || c.readinessLevel) as string] || c.readinessLevel,
      }))
    )

    return NextResponse.json({ success: true, data: sorted })
  } catch (error: any) {
    console.error('[Succession Candidates GET] Error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userContext = extractUserContext(request)
    const userEmail = request.headers.get('x-user-email') || ''
    const { id } = await params

    if (!userContext.accountId || !userEmail) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    if (!hasPermission(userContext.role, 'succession:manage')) {
      return NextResponse.json({ success: false, error: 'Sin permisos' }, { status: 403 })
    }

    // Verify ownership
    const position = await prisma.criticalPosition.findFirst({
      where: { id, accountId: userContext.accountId, isActive: true },
    })
    if (!position) {
      return NextResponse.json({ success: false, error: 'Posicion no encontrada' }, { status: 404 })
    }

    const body = await request.json()
    const { employeeId } = body

    if (!employeeId) {
      return NextResponse.json({ success: false, error: 'employeeId es requerido' }, { status: 400 })
    }

    // Verify employee belongs to same account
    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, accountId: userContext.accountId, status: 'ACTIVE' },
    })
    if (!employee) {
      return NextResponse.json({ success: false, error: 'Empleado no encontrado' }, { status: 404 })
    }

    // Nominate via service
    const result = await SuccessionService.nominateCandidate(id, employeeId, userEmail)

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 })
    }

    // Sync to PerformanceRating
    if (result.candidateId) {
      await SuccessionSyncService.syncToPerformanceRating(result.candidateId)
    }

    return NextResponse.json({ success: true, candidateId: result.candidateId }, { status: 201 })
  } catch (error: any) {
    console.error('[Succession Candidates POST] Error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
