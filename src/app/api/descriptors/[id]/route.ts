// GET /api/descriptors/[id] — Obtener descriptor por ID
// PUT /api/descriptors/[id] — Actualizar descriptor existente

import { NextRequest, NextResponse } from 'next/server'
import { extractUserContext, hasPermission } from '@/lib/services/AuthorizationService'
import { JobDescriptorService } from '@/lib/services/JobDescriptorService'

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

    const descriptor = await JobDescriptorService.getDescriptorById(
      params.id,
      userContext.accountId
    )

    if (!descriptor) {
      return NextResponse.json({ success: false, error: 'Descriptor no encontrado' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: descriptor })
  } catch (error: any) {
    console.error('[descriptors/[id]] GET error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userContext = extractUserContext(request)
    if (!userContext.accountId) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }
    if (!hasPermission(userContext.role, 'descriptors:manage')) {
      return NextResponse.json({ success: false, error: 'Sin permisos' }, { status: 403 })
    }

    const body = await request.json()

    // Verificar que el descriptor pertenece al account
    const existing = await JobDescriptorService.getDescriptorById(
      params.id,
      userContext.accountId
    )

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Descriptor no encontrado' }, { status: 404 })
    }

    // Actualizar via saveDescriptor (usa upsert)
    const updated = await JobDescriptorService.saveDescriptor(
      userContext.accountId,
      { ...body, jobTitle: existing.jobTitle, departmentId: existing.departmentId }
    )

    return NextResponse.json({ success: true, data: updated })
  } catch (error: any) {
    console.error('[descriptors/[id]] PUT error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
