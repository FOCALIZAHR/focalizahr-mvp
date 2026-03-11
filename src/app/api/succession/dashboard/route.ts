// ════════════════════════════════════════════════════════════════════════════
// API: /api/succession/dashboard
// GET - Summary dashboard de sucesion
// ════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  extractUserContext,
  hasPermission,
  getChildDepartmentIds,
} from '@/lib/services/AuthorizationService'
import { SuccessionService } from '@/lib/services/SuccessionService'

export async function GET(request: NextRequest) {
  try {
    // CHECK 1: Extract user context
    const userContext = extractUserContext(request)

    // CHECK 2: accountId
    if (!userContext.accountId) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    // CHECK 3: Permission
    if (!hasPermission(userContext.role, 'succession:view')) {
      return NextResponse.json({ success: false, error: 'Sin permisos' }, { status: 403 })
    }

    // Get cycleId from query or auto-detect
    const { searchParams } = new URL(request.url)
    const cycleId = searchParams.get('cycleId')
      || await SuccessionService.getCurrentCycleId(userContext.accountId)

    if (!cycleId) {
      return NextResponse.json({
        success: true,
        data: {
          summary: { coverage: 0, coveredRoles: 0, totalRoles: 0, uncoveredRoles: [], bench: { readyNow: 0, ready1to2Years: 0, notReady: 0 }, hasData: false },
          positions: { total: 0, byBenchStrength: {} },
        }
      })
    }

    // CHECK 4: AREA_MANAGER hierarchical filter
    let departmentIds: string[] | undefined
    const GLOBAL_ROLES = ['FOCALIZAHR_ADMIN', 'ACCOUNT_OWNER', 'HR_MANAGER', 'HR_ADMIN', 'CEO']
    if (!GLOBAL_ROLES.includes(userContext.role || '') && userContext.departmentId) {
      const childIds = await getChildDepartmentIds(userContext.departmentId)
      departmentIds = [userContext.departmentId, ...childIds]
    }

    // Fetch summary
    const summary = await SuccessionService.getSuccessionSummary(cycleId, userContext.accountId, departmentIds)

    // Fetch bench strength distribution
    const positionWhere: any = { accountId: userContext.accountId, isActive: true }
    if (departmentIds?.length) {
      positionWhere.departmentId = { in: departmentIds }
    }

    const positions = await prisma.criticalPosition.findMany({
      where: positionWhere,
      select: { benchStrength: true },
    })

    const byBenchStrength: Record<string, number> = {}
    for (const p of positions) {
      byBenchStrength[p.benchStrength] = (byBenchStrength[p.benchStrength] || 0) + 1
    }

    // Chain coverage KPI (backfill resolution)
    const chainCoverage = await SuccessionService.getChainCoverage(userContext.accountId)

    return NextResponse.json({
      success: true,
      data: {
        summary,
        positions: {
          total: positions.length,
          byBenchStrength,
        },
        chainCoverage,
        cycleId,
      }
    })
  } catch (error: any) {
    console.error('[Succession Dashboard] Error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
