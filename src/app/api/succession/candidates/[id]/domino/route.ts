// ════════════════════════════════════════════════════════════════════════════
// API: /api/succession/candidates/[id]/domino
// GET - Detectar efecto dominó al nominar un candidato
// ════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
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

    const result = await SuccessionService.detectDominoEffect(candidateId, userContext.accountId)

    return NextResponse.json({
      success: true,
      ...result,
    })
  } catch (error: any) {
    console.error('[GET /api/succession/candidates/[id]/domino]', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Error detectando efecto dominó' },
      { status: 500 }
    )
  }
}
