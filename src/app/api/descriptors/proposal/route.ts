// POST /api/descriptors/proposal — Genera propuesta sin persistir

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
    const { jobTitle, departmentId } = body

    if (!jobTitle) {
      return NextResponse.json({ success: false, error: 'jobTitle requerido' }, { status: 400 })
    }

    const proposal = await JobDescriptorService.generateProposal(
      jobTitle,
      userContext.accountId,
      departmentId
    )

    return NextResponse.json({ success: true, data: proposal })
  } catch (error: any) {
    console.error('[descriptors/proposal] POST error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
