// ════════════════════════════════════════════════════════════════════════════
// EXECUTIVE HUB - RISK PROFILES API
// src/app/api/executive-hub/pl-talent/risk-profiles/route.ts
// ════════════════════════════════════════════════════════════════════════════
// GET: Individual risk profiles via TalentRiskOrchestrator
// Filters: gerencia, onlyCritical, onlyLeaders
// ════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { extractUserContext, hasPermission, getChildDepartmentIds } from '@/lib/services/AuthorizationService'
import { TalentRiskOrchestrator } from '@/lib/services/TalentRiskOrchestrator'
import { prisma } from '@/lib/prisma'

const GLOBAL_ROLES = ['FOCALIZAHR_ADMIN', 'ACCOUNT_OWNER', 'HR_MANAGER', 'HR_ADMIN', 'CEO']

export async function GET(request: NextRequest) {
  try {
    const userContext = extractUserContext(request)

    if (!userContext.accountId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    if (!hasPermission(userContext.role, 'pl-talent:view')) {
      return NextResponse.json({ success: false, error: 'Sin permisos' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const cycleId = searchParams.get('cycleId')
    const gerencia = searchParams.get('gerencia')
    const onlyCritical = searchParams.get('onlyCritical') === 'true'
    const onlyLeaders = searchParams.get('onlyLeaders') === 'true'

    if (!cycleId) {
      return NextResponse.json({ success: false, error: 'cycleId requerido' }, { status: 400 })
    }

    // RBAC: department filtering
    let departmentIds: string[] | undefined

    if (!GLOBAL_ROLES.includes(userContext.role || '') && userContext.departmentId) {
      const childIds = await getChildDepartmentIds(userContext.departmentId)
      departmentIds = [userContext.departmentId, ...childIds]
    }

    if (gerencia) {
      const gerenciaDepts = await prisma.department.findMany({
        where: {
          accountId: userContext.accountId,
          isActive: true,
          OR: [
            { displayName: gerencia },
            { parent: { displayName: gerencia } },
          ],
        },
        select: { id: true },
      })
      const gIds = gerenciaDepts.map(d => d.id)
      if (gIds.length > 0) {
        departmentIds = departmentIds ? departmentIds.filter(id => gIds.includes(id)) : gIds
      }
    }

    // Fetch profiles
    let profiles = await TalentRiskOrchestrator.buildPayloads(
      cycleId,
      userContext.accountId,
      departmentIds
    )

    // Post-fetch filters
    if (onlyCritical) {
      profiles = profiles.filter(p => p.data.isIncumbentOfCriticalPosition)
    }
    if (onlyLeaders) {
      profiles = profiles.filter(p => p.data.isLeader)
    }

    // Summary
    const summary = {
      total: profiles.length,
      withLeadershipRisk: profiles.filter(p => p.narratives.leadershipRisk !== null).length,
      criticalPositions: profiles.filter(p => p.data.isIncumbentOfCriticalPosition).length,
      withoutSuccessor: profiles.filter(p =>
        p.data.isIncumbentOfCriticalPosition && !p.data.hasSuccessor
      ).length,
      byTenureTrend: {
        A1: profiles.filter(p => p.data.tenureTrend === 'A1').length,
        A2: profiles.filter(p => p.data.tenureTrend === 'A2').length,
        A3: profiles.filter(p => p.data.tenureTrend === 'A3').length,
      },
      byFitLevel: {
        low: profiles.filter(p => p.data.roleFitScore < 75).length,
        high: profiles.filter(p => p.data.roleFitScore >= 75).length,
      },
    }

    return NextResponse.json({ success: true, data: { profiles, summary } })

  } catch (error: any) {
    console.error('[risk-profiles] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
