// POST /api/descriptors/save — Guarda descriptor como DRAFT

import { NextRequest, NextResponse } from 'next/server'
import { extractUserContext, hasPermission } from '@/lib/services/AuthorizationService'
import { JobDescriptorService } from '@/lib/services/JobDescriptorService'

export async function POST(request: NextRequest) {
  try {
    const userContext = extractUserContext(request)
    if (!userContext.accountId) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }
    if (!hasPermission(userContext.role, 'descriptors:manage')) {
      return NextResponse.json({ success: false, error: 'Sin permisos' }, { status: 403 })
    }

    const body = await request.json()

    if (!body.jobTitle) {
      return NextResponse.json({ success: false, error: 'jobTitle requerido' }, { status: 400 })
    }

    const descriptor = await JobDescriptorService.saveDescriptor(
      userContext.accountId,
      body
    )

    return NextResponse.json({ success: true, data: descriptor })
  } catch (error: any) {
    console.error('[descriptors/save] POST error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
