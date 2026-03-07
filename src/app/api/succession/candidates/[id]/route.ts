// ════════════════════════════════════════════════════════════════════════════
// API: /api/succession/candidates/[id]
// PATCH - Actualizar estado de candidato (ej: WITHDRAWN)
// ════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  extractUserContext,
  hasPermission,
} from '@/lib/services/AuthorizationService'
import { CandidateStatus } from '@prisma/client'

const VALID_STATUSES: string[] = ['ACTIVE', 'WITHDRAWN', 'DISQUALIFIED']

export async function PATCH(
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

    const { status } = await request.json()

    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { success: false, error: `Estado invalido. Valores permitidos: ${VALID_STATUSES.join(', ')}` },
        { status: 400 }
      )
    }

    // Verify candidate belongs to this account
    const existing = await prisma.successionCandidate.findFirst({
      where: { id: candidateId, accountId: userContext.accountId },
    })

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Candidato no encontrado' }, { status: 404 })
    }

    // Update status
    const candidate = await prisma.successionCandidate.update({
      where: { id: candidateId },
      data: { status: status as CandidateStatus },
    })

    // Recalculate benchStrength for the position
    const activeCandidates = await prisma.successionCandidate.findMany({
      where: {
        criticalPositionId: candidate.criticalPositionId,
        status: 'ACTIVE',
      },
      select: { readinessLevel: true },
    })

    // Derive bench strength from active candidates
    const readyNow = activeCandidates.filter(c => c.readinessLevel === 'READY_NOW').length
    const ready12 = activeCandidates.filter(c => c.readinessLevel === 'READY_1_2_YEARS').length
    let benchStrength: string
    if (readyNow >= 2) benchStrength = 'STRONG'
    else if (readyNow >= 1 && ready12 >= 2) benchStrength = 'MODERATE'
    else if (ready12 >= 1) benchStrength = 'WEAK'
    else benchStrength = 'NONE'

    await prisma.criticalPosition.update({
      where: { id: candidate.criticalPositionId },
      data: { benchStrength: benchStrength as any },
    })

    return NextResponse.json({ success: true, data: candidate })
  } catch (error) {
    console.error('[PATCH /api/succession/candidates/[id]]', error)
    return NextResponse.json(
      { success: false, error: 'Error actualizando candidato' },
      { status: 500 }
    )
  }
}
