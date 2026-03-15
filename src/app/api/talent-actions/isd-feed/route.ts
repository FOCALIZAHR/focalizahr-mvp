/**
 * GET /api/talent-actions/isd-feed
 *
 * Metricas limpias para ISD futuro (SIN calcular ISD)
 * Solo expone datos preparados que el ISD consumira en fase posterior
 *
 * Permiso: talent-actions:view
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  extractUserContext,
  hasPermission,
  getChildDepartmentIds
} from '@/lib/services/AuthorizationService'
import { SuccessionService } from '@/lib/services/SuccessionService'

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
        { success: false, error: 'Sin permisos' },
        { status: 403 }
      )
    }

    const accountId = userContext.accountId

    const cycleId = await SuccessionService.getCurrentCycleId(accountId)
    if (!cycleId) {
      return NextResponse.json({
        success: true,
        data: { cycleId: null, calculatedAt: new Date(), feeds: {} },
        responseTime: Date.now() - startTime
      })
    }

    // Filtrado jerarquico
    let departmentFilter: string[] | undefined
    if (userContext.role === 'AREA_MANAGER' && userContext.departmentId) {
      const childIds = await getChildDepartmentIds(userContext.departmentId)
      departmentFilter = [userContext.departmentId, ...childIds]
    }

    // Gerencias (level 2)
    const gerenciaWhere: any = { accountId, isActive: true, level: 2 }
    if (departmentFilter) {
      gerenciaWhere.id = { in: departmentFilter }
    }

    const gerencias = await prisma.department.findMany({
      where: gerenciaWhere,
      select: { id: true, displayName: true }
    })

    // Ratings por gerencia
    const iccByDepartment: Record<string, { icc: number; total: number; classified: number }> = {}
    const riskDistribution: Record<string, Record<string, number>> = {}
    const patternByDepartment: Record<string, string> = {}

    for (const ger of gerencias) {
      const childIds = await getChildDepartmentIds(ger.id)
      const allDeptIds = [ger.id, ...childIds]

      const ratings = await prisma.performanceRating.findMany({
        where: {
          accountId,
          cycleId,
          employee: {
            isActive: true,
            status: 'ACTIVE',
            departmentId: { in: allDeptIds }
          }
        },
        select: {
          riskQuadrant: true,
          mobilityQuadrant: true,
          riskAlertLevel: true
        }
      })

      const total = ratings.length
      let classified = 0
      let iccCount = 0
      const dist: Record<string, number> = {}

      for (const r of ratings) {
        if (r.riskQuadrant) {
          classified++
          dist[r.riskQuadrant] = (dist[r.riskQuadrant] || 0) + 1
        }
        if ((r.riskAlertLevel === 'RED' || r.riskAlertLevel === 'ORANGE') &&
            r.mobilityQuadrant === 'EXPERTO_ANCLA') {
          iccCount++
        }
      }

      const icc = total > 0 ? Math.round((iccCount / total) * 100) : 0
      iccByDepartment[ger.id] = { icc, total, classified }
      riskDistribution[ger.id] = dist
    }

    // Succession coverage global
    const [totalPositions, coveredPositions] = await Promise.all([
      prisma.criticalPosition.count({
        where: { accountId }
      }),
      prisma.criticalPosition.count({
        where: {
          accountId,
          candidates: { some: { status: 'ACTIVE' } }
        }
      })
    ])

    return NextResponse.json({
      success: true,
      data: {
        accountId,
        cycleId,
        calculatedAt: new Date(),
        riskDistribution,
        iccByDepartment,
        patternByDepartment,
        successionCoverage: {
          totalCriticalPositions: totalPositions,
          coveredPositions,
          coveragePercent: totalPositions > 0
            ? Math.round((coveredPositions / totalPositions) * 100)
            : 0
        }
      },
      responseTime: Date.now() - startTime
    })

  } catch (error: any) {
    console.error('[TAC isd-feed] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Error interno' },
      { status: 500 }
    )
  }
}
