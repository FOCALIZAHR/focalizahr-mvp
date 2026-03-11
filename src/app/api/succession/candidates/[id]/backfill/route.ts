// ════════════════════════════════════════════════════════════════════════════
// API: /api/succession/candidates/[id]/backfill
// POST - Guardar plan de backfill post-nominación
// ════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import {
  extractUserContext,
  hasPermission,
} from '@/lib/services/AuthorizationService'
import { SuccessionService } from '@/lib/services/SuccessionService'

const VALID_RESOLUTIONS = ['PENDING', 'COVERED', 'EXTERNAL_SEARCH', 'POSITION_ELIMINATED']

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userContext = extractUserContext(request)
    const userEmail = request.headers.get('x-user-email') || ''
    const { id: candidateId } = await params

    if (!userContext.accountId) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    if (!hasPermission(userContext.role, 'succession:manage')) {
      return NextResponse.json({ success: false, error: 'Sin permisos' }, { status: 403 })
    }

    const body = await request.json()
    const { resolution, backfillEmployeeId, backfillEmployeeName, externalReason } = body

    if (!resolution || !VALID_RESOLUTIONS.includes(resolution)) {
      return NextResponse.json(
        { success: false, error: `Resolución inválida. Valores: ${VALID_RESOLUTIONS.join(', ')}` },
        { status: 400 }
      )
    }

    const result = await SuccessionService.saveBackfillPlan(
      candidateId,
      { resolution, backfillEmployeeId, backfillEmployeeName, externalReason },
      userEmail || userContext.userId || 'unknown'
    )

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[POST /api/succession/candidates/[id]/backfill]', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Error guardando plan de backfill' },
      { status: 500 }
    )
  }
}
