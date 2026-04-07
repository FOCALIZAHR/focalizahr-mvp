// GET /api/descriptors — Lista de cargos con estado + resumen ejecutivo

import { NextRequest, NextResponse } from 'next/server'
import { extractUserContext, hasPermission } from '@/lib/services/AuthorizationService'
import { JobDescriptorService } from '@/lib/services/JobDescriptorService'

export async function GET(request: NextRequest) {
  try {
    const userContext = extractUserContext(request)
    if (!userContext.accountId) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }
    if (!hasPermission(userContext.role, 'descriptors:view')) {
      return NextResponse.json({ success: false, error: 'Sin permisos' }, { status: 403 })
    }

    const [positions, summary] = await Promise.all([
      JobDescriptorService.listPositionsWithStatus(userContext.accountId),
      JobDescriptorService.getSummary(userContext.accountId),
    ])

    return NextResponse.json({ success: true, data: { positions, summary } })
  } catch (error: any) {
    console.error('[descriptors] GET error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
