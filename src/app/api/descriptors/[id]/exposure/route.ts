// GET /api/descriptors/[id]/exposure — Exposición IA desde descriptor editado

import { NextRequest, NextResponse } from 'next/server'
import { extractUserContext, hasPermission } from '@/lib/services/AuthorizationService'
import { AIExposureService } from '@/lib/services/AIExposureService'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userContext = extractUserContext(request)
    if (!userContext.accountId) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }
    if (!hasPermission(userContext.role, 'descriptors:view')) {
      return NextResponse.json({ success: false, error: 'Sin permisos' }, { status: 403 })
    }

    const data = await AIExposureService.getExposureFromDescriptor(
      params.id,
      userContext.accountId
    )

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('[descriptors/[id]/exposure] GET error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
