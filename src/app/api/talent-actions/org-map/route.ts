/**
 * GET /api/talent-actions/org-map
 *
 * Mapa organizacional: gerencias con patrón + ICC + sucesores + P&L
 * Respeta filtrado jerárquico RBAC (3 capas)
 *
 * Response incluye avgSalary + salarySource para componentes client-side
 *
 * Permiso: talent-actions:view
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  extractUserContext,
  hasPermission,
  getChildDepartmentIds
} from '@/lib/services/AuthorizationService'
import { TalentActionService } from '@/lib/services/TalentActionService'

export async function GET(request: NextRequest) {
  const startTime = Date.now()

  try {
    // CAPA 1: Autenticación multi-tenant
    const userContext = extractUserContext(request)

    if (!userContext.accountId) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    // CAPA 2: Permisos
    if (!hasPermission(userContext.role, 'talent-actions:view')) {
      return NextResponse.json(
        { success: false, error: 'Sin permisos para Talent Action Center' },
        { status: 403 }
      )
    }

    // CAPA 3: Filtrado jerárquico AREA_MANAGER
    let allowedDepartmentIds: string[] | undefined

    if (userContext.role === 'AREA_MANAGER' && userContext.departmentId) {
      const childIds = await getChildDepartmentIds(userContext.departmentId)
      allowedDepartmentIds = [userContext.departmentId, ...childIds]
    }

    const result = await TalentActionService.getOrgMap(
      userContext.accountId,
      allowedDepartmentIds ? { allowedDepartmentIds } : undefined
    )

    return NextResponse.json({
      success: true,
      data: result,
      userRole: userContext.role,
      responseTime: Date.now() - startTime
    })

  } catch (error: any) {
    console.error('[TAC org-map] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Error interno' },
      { status: 500 }
    )
  }
}
