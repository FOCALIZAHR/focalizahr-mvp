// ════════════════════════════════════════════════════════════════════════════
// WORKFORCE AI EXPOSURE API
// src/app/api/workforce/exposure/route.ts
// ════════════════════════════════════════════════════════════════════════════
// GET /api/workforce/exposure?socCode=XX-XXXX.XX  → individual occupation
// GET /api/workforce/exposure?departmentId=xxx    → department aggregation
// GET /api/workforce/exposure                     → organization summary
//
// Seguridad: extractUserContext → hasPermission('exposure:view') → accountId filter
// AREA_MANAGER: filtro jerárquico con getChildDepartmentIds
// ════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import {
  extractUserContext,
  hasPermission,
  getChildDepartmentIds,
} from '@/lib/services/AuthorizationService'
import { AIExposureService } from '@/lib/services/AIExposureService'

const GLOBAL_ROLES = ['FOCALIZAHR_ADMIN', 'ACCOUNT_OWNER', 'HR_ADMIN', 'HR_MANAGER', 'HR_OPERATOR', 'CEO']

export async function GET(request: NextRequest) {
  try {
    // 1. Auth
    const userContext = extractUserContext(request)

    if (!userContext.accountId) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    if (!hasPermission(userContext.role, 'exposure:view')) {
      return NextResponse.json({ success: false, error: 'Sin permisos' }, { status: 403 })
    }

    // 2. Parse query params
    const { searchParams } = new URL(request.url)
    const socCode = searchParams.get('socCode')
    const departmentId = searchParams.get('departmentId')

    // 3. RBAC: departmental filtering for AREA_MANAGER
    let departmentIds: string[] | undefined
    if (!GLOBAL_ROLES.includes(userContext.role || '') && userContext.departmentId) {
      const childIds = await getChildDepartmentIds(userContext.departmentId)
      departmentIds = [userContext.departmentId, ...childIds]

      // Si pide un departmentId específico, validar que esté en su scope
      if (departmentId && !departmentIds.includes(departmentId)) {
        return NextResponse.json({ success: false, error: 'Fuera de scope' }, { status: 403 })
      }
    }

    // 4. Route by query params

    // Caso A: Lookup individual por SOC code
    if (socCode) {
      const data = await AIExposureService.getExposure(socCode)
      return NextResponse.json({ success: true, data })
    }

    // Caso B: Agregado por departamento
    if (departmentId) {
      const data = await AIExposureService.getDepartmentExposure(
        departmentId,
        userContext.accountId
      )
      return NextResponse.json({ success: true, data })
    }

    // Caso C: Resumen organizacional (con filtro jerárquico si aplica)
    const data = await AIExposureService.getOrganizationExposure(
      userContext.accountId,
      departmentIds
    )
    return NextResponse.json({ success: true, data })

  } catch (error: any) {
    console.error('[workforce/exposure] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message ?? 'Error interno' },
      { status: 500 }
    )
  }
}
