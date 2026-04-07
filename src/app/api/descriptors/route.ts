// GET /api/descriptors — Lista de cargos con estado + resumen ejecutivo
// Filtrado jerárquico: AREA_MANAGER solo ve su gerencia + sub-departamentos

import { NextRequest, NextResponse } from 'next/server'
import {
  extractUserContext,
  hasPermission,
  getChildDepartmentIds,
  GLOBAL_ACCESS_ROLES,
} from '@/lib/services/AuthorizationService'
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

    // Scope jerárquico para AREA_MANAGER
    let departmentIds: string[] | undefined
    const hasGlobalAccess = GLOBAL_ACCESS_ROLES.includes(userContext.role as any)

    if (!hasGlobalAccess && userContext.role === 'AREA_MANAGER' && userContext.departmentId) {
      const childIds = await getChildDepartmentIds(userContext.departmentId)
      departmentIds = [userContext.departmentId, ...childIds]
    }

    const [positions, summary] = await Promise.all([
      JobDescriptorService.listPositionsWithStatus(userContext.accountId, departmentIds),
      JobDescriptorService.getSummary(userContext.accountId, departmentIds),
    ])

    return NextResponse.json({ success: true, data: { positions, summary } })
  } catch (error: any) {
    console.error('[descriptors] GET error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
