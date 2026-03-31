// ════════════════════════════════════════════════════════════════════════════
// EXECUTIVE HUB - RISK PROFILES API
// src/app/api/executive-hub/pl-talent/risk-profiles/route.ts
// ════════════════════════════════════════════════════════════════════════════
// GET: Individual risk profiles via TalentRiskOrchestrator
// Filters: gerencia, onlyCritical, onlyLeaders
// ════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { extractUserContext, hasPermission, getChildDepartmentIds } from '@/lib/services/AuthorizationService'
import { TalentRiskOrchestrator, type ExecutiveRiskPayload } from '@/lib/services/TalentRiskOrchestrator'
import { SUCCESSION_RISK_DICTIONARY } from '@/config/narratives/SuccessionRiskDictionary'
import { buildAggregateNarrative } from '@/config/narratives/TenureRoleFitDictionary'
import { ExecutiveSynthesisEngine } from '@/lib/services/ExecutiveSynthesisEngine'
import { PLTalentService } from '@/lib/services/PLTalentService'
import type { GerenciaImpact } from '@/config/narratives/BusinessImpactDictionary'
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

    // Fetch profiles + brecha en paralelo
    const [profiles_raw, brecha] = await Promise.all([
      TalentRiskOrchestrator.buildPayloads(cycleId, userContext.accountId, departmentIds),
      PLTalentService.getBrechaProductiva(cycleId, userContext.accountId, departmentIds),
    ])
    let profiles = profiles_raw

    // Post-fetch filters
    if (onlyCritical) {
      profiles = profiles.filter(p => p.data.isIncumbentOfCriticalPosition)
    }
    if (onlyLeaders) {
      profiles = profiles.filter(p => p.data.isLeader)
    }

    // Extract unique gerenciaImpacts → summary level (no repetir por persona)
    const gerenciaImpactMap: Record<string, GerenciaImpact> = {}
    for (const p of profiles) {
      const cat = p.data.gerenciaCategory
      if (cat && p.narratives.gerenciaImpact && !gerenciaImpactMap[cat]) {
        gerenciaImpactMap[cat] = p.narratives.gerenciaImpact
      }
    }

    // Strip gerenciaImpact from individual profiles (ya vive en summary)
    const leanProfiles = profiles.map(p => ({
      data: p.data,
      narratives: {
        tenureNarrative: p.narratives.tenureNarrative,
        gerenciaImpact: null,
        leadershipRisk: p.narratives.leadershipRisk,
      },
    }))

    // Summary
    const successionMetrics = TalentRiskOrchestrator.buildSuccessionMetrics(profiles)
    const successionCombination = SUCCESSION_RISK_DICTIONARY.getCombinationType(
      successionMetrics.avgFitCriticos,
      successionMetrics.withImmediateSuccessor
    )
    const successionNarrative = SUCCESSION_RISK_DICTIONARY.buildFullNarrative(successionMetrics)

    // Tenure narrative (Motor 1 agregado) — evalúa 3 tramos con prioridad
    const countTrend = (trend: 'A1' | 'A2' | 'A3') => {
      const all = profiles.filter(p => p.data.tenureTrend === trend)
      const bajo = all.filter(p => p.data.roleFitScore < 75).length
      const total = all.length
      return {
        total,
        pctBajo: total > 0 ? Math.round((bajo / total) * 100) : 0,
        pctAlto: total > 0 ? Math.round(((total - bajo) / total) * 100) : 0,
      }
    }
    const tA1 = countTrend('A1')
    const tA2 = countTrend('A2')
    const tA3 = countTrend('A3')

    // Prioridad: negativos primero (A3 → A2 → A1), luego positivos (A1 → A2 → A3)
    let tenureNarrative: { narrative: string; tone: 'positive' | 'negative'; tramo: 'A1' | 'A2' | 'A3' } | null = null
    if (tA3.pctBajo >= 30) tenureNarrative = buildAggregateNarrative('A3', 'low', tA3.pctBajo)
    else if (tA2.pctBajo >= 35) tenureNarrative = buildAggregateNarrative('A2', 'low', tA2.pctBajo)
    else if (tA1.pctBajo >= 40) tenureNarrative = buildAggregateNarrative('A1', 'low', tA1.pctBajo)
    else if (tA1.pctAlto >= 60) tenureNarrative = buildAggregateNarrative('A1', 'high', tA1.pctAlto)
    else if (tA2.pctAlto >= 50) tenureNarrative = buildAggregateNarrative('A2', 'high', tA2.pctAlto)
    else if (tA3.pctAlto >= 50) tenureNarrative = buildAggregateNarrative('A3', 'high', tA3.pctAlto)

    // Executive Synthesis Engine
    const totalHeadcount = profiles.length
    const underperformersCount = profiles.filter(p => p.data.roleFitScore < 75).length
    const totalMonthlyCost = profiles.reduce((sum, p) => sum + p.data.monthlyGap, 0)
    const globalRoleFit = totalHeadcount > 0
      ? Math.round(profiles.reduce((sum, p) => sum + p.data.roleFitScore, 0) / totalHeadcount)
      : 0
    const totalLeaders = profiles.filter(p => p.data.isLeader).length
    const leadersUnderStandard = profiles.filter(p => p.narratives.leadershipRisk !== null).length
    const peopleAffectedByLeaders = profiles
      .filter(p => p.narratives.leadershipRisk !== null)
      .reduce((sum, p) => sum + p.data.directReportsCount, 0)
    const nCriticosBajoEstandar = profiles.filter(
      p => p.data.isIncumbentOfCriticalPosition && p.data.roleFitScore < 75
    ).length

    // Tenure analysis por banda
    const tenureAnalysis = (['A1', 'A2', 'A3'] as const).map(band => {
      const bandProfiles = profiles.filter(p => p.data.tenureTrend === band)
      const underperf = bandProfiles.filter(p => p.data.roleFitScore < 75).length
      const bandMap = { A1: '0-12', A2: '12-36', A3: '36+' } as const
      return {
        band: bandMap[band],
        headcount: bandProfiles.length,
        percentOfWorkforce: totalHeadcount > 0 ? (bandProfiles.length / totalHeadcount) * 100 : 0,
        avgRoleFit: bandProfiles.length > 0
          ? bandProfiles.reduce((sum, p) => sum + p.data.roleFitScore, 0) / bandProfiles.length
          : 0,
        underperformersCount: underperf,
        underperformersPercent: bandProfiles.length > 0 ? (underperf / bandProfiles.length) * 100 : 0,
      }
    })

    // Gerencia analysis — desde brecha.byGerencia (nombres de gerencia nivel 2 correctos)
    const totalDeficit = brecha.byGerencia.reduce((sum, g) => sum + g.gapMonthly, 0)
    const gerenciaAnalysis = brecha.byGerencia
      .map(g => ({
        name: g.gerenciaName,
        standardCategory: g.standardCategory ?? '',
        headcount: g.headcount,
        avgRoleFit: g.avgRoleFit,
        deficit: 100 - g.avgRoleFit,
        percentOfTotalDeficit: totalDeficit > 0 ? (g.gapMonthly / totalDeficit) * 100 : 0,
        monthlyCost: g.gapMonthly,
      }))
      .sort((a, b) => b.percentOfTotalDeficit - a.percentOfTotalDeficit)

    const executiveSynthesis = ExecutiveSynthesisEngine.generate({
      globalRoleFit,
      totalHeadcount,
      underperformersCount,
      totalMonthlyCost,
      totalLeaders,
      leadersUnderStandard,
      peopleAffectedByLeaders,
      criticalRolesTotal: successionMetrics.totalCriticalPositions,
      criticalRolesUnderStandard: nCriticosBajoEstandar,
      criticalRolesWithSuccessor: successionMetrics.withImmediateSuccessor,
      tenureAnalysis,
      gerenciaAnalysis,
    })

    const summary = {
      total: profiles.length,
      withLeadershipRisk: profiles.filter(p => p.narratives.leadershipRisk !== null).length,
      criticalPositions: profiles.filter(p => p.data.isIncumbentOfCriticalPosition).length,
      withoutSuccessor: profiles.filter(p =>
        p.data.isIncumbentOfCriticalPosition && !p.data.hasSuccessor
      ).length,
      byTenureTrend: {
        A1: tA1.total,
        A2: tA2.total,
        A3: tA3.total,
      },
      byFitLevel: {
        low: profiles.filter(p => p.data.roleFitScore < 75).length,
        high: profiles.filter(p => p.data.roleFitScore >= 75).length,
      },
      successionMetrics,
      successionCombination,
      successionNarrative,
      tenureNarrative,
      gerenciaImpact: gerenciaImpactMap,
      executiveSynthesis,
    }

    return NextResponse.json({ success: true, data: { profiles: leanProfiles, summary } })

  } catch (error: any) {
    console.error('[risk-profiles] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
