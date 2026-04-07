// GET /api/descriptors/search-tasks?query=xxx — Buscar tareas de otro SOC

import { NextRequest, NextResponse } from 'next/server'
import { extractUserContext, hasPermission } from '@/lib/services/AuthorizationService'
import { JobDescriptorService } from '@/lib/services/JobDescriptorService'

export async function GET(request: NextRequest) {
  try {
    const userContext = extractUserContext(request)
    if (!userContext.accountId) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }
    if (!hasPermission(userContext.role, 'descriptors:manage')) {
      return NextResponse.json({ success: false, error: 'Sin permisos' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('query') ?? ''
    const excludeSocCode = searchParams.get('excludeSocCode') ?? undefined
    const limit = parseInt(searchParams.get('limit') ?? '20', 10)

    if (query.length < 3) {
      return NextResponse.json({ success: true, data: [] })
    }

    const results = await JobDescriptorService.searchTasks(query, excludeSocCode, limit)
    return NextResponse.json({ success: true, data: results })
  } catch (error: any) {
    console.error('[descriptors/search-tasks] GET error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
