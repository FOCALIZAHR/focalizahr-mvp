/**
 * GET /api/talent-actions/stats
 *
 * Distribución total cuadrantes + alertas críticas organización
 * Respeta filtrado jerárquico RBAC (3 capas)
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
    const userContext = extractUserContext(request)

    if (!userContext.accountId) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    if (!hasPermission(userContext.role, 'talent-actions:view')) {
      return NextResponse.json(
        { success: false, error: 'Sin permisos para Talent Action Center' },
        { status: 403 }
      )
    }

    let allowedDepartmentIds: string[] | undefined

    if (userContext.role === 'AREA_MANAGER' && userContext.departmentId) {
      const childIds = await getChildDepartmentIds(userContext.departmentId)
      allowedDepartmentIds = [userContext.departmentId, ...childIds]
    }

    const stats = await TalentActionService.getStats(
      userContext.accountId,
      allowedDepartmentIds ? { allowedDepartmentIds } : undefined
    )

    return NextResponse.json({
      success: true,
      data: stats,
      responseTime: Date.now() - startTime
    })

  } catch (error: any) {
    console.error('[TAC stats] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Error interno' },
      { status: 500 }
    )
  }
}
