// GET /api/descriptors/by-title?jobTitle=xxx — Obtener descriptor confirmado por jobTitle

import { NextRequest, NextResponse } from 'next/server'
import { extractUserContext, hasPermission } from '@/lib/services/AuthorizationService'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const userContext = extractUserContext(request)
    if (!userContext.accountId) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }
    if (!hasPermission(userContext.role, 'descriptors:view')) {
      return NextResponse.json({ success: false, error: 'Sin permisos' }, { status: 403 })
    }

    const jobTitle = request.nextUrl.searchParams.get('jobTitle')
    if (!jobTitle) {
      return NextResponse.json({ success: false, error: 'jobTitle requerido' }, { status: 400 })
    }

    // findFirst: avoid composite key issue (departmentId mismatch between '' and null)
    const descriptor = await prisma.jobDescriptor.findFirst({
      where: {
        accountId: userContext.accountId,
        jobTitle,
      },
    })

    if (!descriptor) {
      return NextResponse.json({ success: false, error: 'Descriptor no encontrado' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: descriptor })
  } catch (error: any) {
    console.error('[descriptors/by-title] GET error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
