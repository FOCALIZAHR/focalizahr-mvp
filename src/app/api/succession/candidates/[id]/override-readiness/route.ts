// ════════════════════════════════════════════════════════════════════════════
// API: /api/succession/candidates/[id]/override-readiness
// PATCH - Override de readiness con accountability
// ════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  extractUserContext,
  hasPermission,
} from '@/lib/services/AuthorizationService'
import { SuccessionService } from '@/lib/services/SuccessionService'
import { SuccessionSyncService } from '@/lib/services/SuccessionSyncService'
import { ReadinessLevel } from '@prisma/client'

const VALID_READINESS = ['READY_NOW', 'READY_1_2_YEARS', 'READY_3_PLUS', 'NOT_VIABLE']

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userContext = extractUserContext(request)
    const userEmail = request.headers.get('x-user-email') || ''
    const { id: candidateId } = await params

    if (!userContext.accountId || !userEmail) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    if (!hasPermission(userContext.role, 'succession:manage')) {
      return NextResponse.json({ success: false, error: 'Sin permisos' }, { status: 403 })
    }

    const body = await request.json()
    const { readinessOverride, overrideReason } = body

    // Validate readiness level
    if (!readinessOverride || !VALID_READINESS.includes(readinessOverride)) {
      return NextResponse.json(
        { success: false, error: `readinessOverride invalido. Valores: ${VALID_READINESS.join(', ')}` },
        { status: 400 }
      )
    }

    // Override reason is mandatory
    if (!overrideReason || overrideReason.trim().length < 10) {
      return NextResponse.json(
        { success: false, error: 'overrideReason es obligatorio (minimo 10 caracteres)' },
        { status: 400 }
      )
    }

    // Verify ownership
    const candidate = await prisma.successionCandidate.findFirst({
      where: { id: candidateId, accountId: userContext.accountId, status: 'ACTIVE' },
      select: { id: true, criticalPositionId: true },
    })

    if (!candidate) {
      return NextResponse.json({ success: false, error: 'Candidato no encontrado' }, { status: 404 })
    }

    // Apply override
    const updated = await prisma.successionCandidate.update({
      where: { id: candidateId },
      data: {
        readinessOverride: readinessOverride as ReadinessLevel,
        overrideReason: overrideReason.trim(),
        overrideBy: userEmail,
        overrideAt: new Date(),
      },
      select: {
        id: true,
        readinessLevel: true,
        readinessOverride: true,
        overrideReason: true,
        overrideBy: true,
        overrideAt: true,
      }
    })

    // Recalculate bench strength for the position
    await SuccessionService.updateBenchStrength(candidate.criticalPositionId)

    // Sync to PerformanceRating
    await SuccessionSyncService.syncToPerformanceRating(candidateId)

    return NextResponse.json({ success: true, data: updated })
  } catch (error: any) {
    console.error('[Succession Override] Error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
