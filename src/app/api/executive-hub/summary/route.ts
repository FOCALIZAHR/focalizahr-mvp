// ════════════════════════════════════════════════════════════════════════════
// EXECUTIVE HUB - SUMMARY API
// src/app/api/executive-hub/summary/route.ts
// ════════════════════════════════════════════════════════════════════════════
// Consolida datos de todos los servicios para MissionControl + Rail
// Fetch paralelo con Promise.all para máxima performance
// ════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { extractUserContext, getChildDepartmentIds } from '@/lib/services/AuthorizationService'
import { PerformanceRatingService, calculateIntegrityScore } from '@/lib/services/PerformanceRatingService'
import { RoleFitAnalyzer } from '@/lib/services/RoleFitAnalyzer'
import { TalentIntelligenceService } from '@/lib/services/TalentIntelligenceService'
import { ExecutiveNarrativeService } from '@/lib/services/ExecutiveNarrativeService'
import { ManagerVarianceService } from '@/lib/services/ManagerVarianceService'
import { SuccessionService } from '@/lib/services/SuccessionService'
import { PLTalentService } from '@/lib/services/PLTalentService'
import { GoalsDiagnosticService } from '@/lib/services/GoalsDiagnosticService'
import { ACOTADO_LABELS } from '@/lib/services/PositionAdapter'
import { prisma } from '@/lib/prisma'

const GLOBAL_ROLES = ['FOCALIZAHR_ADMIN', 'ACCOUNT_OWNER', 'HR_MANAGER', 'HR_ADMIN', 'CEO']

export async function GET(request: NextRequest) {
  try {
    const userContext = extractUserContext(request)

    if (!userContext.accountId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const cycleId = searchParams.get('cycleId')
    const gerenciaParam = searchParams.get('gerencia')

    if (!cycleId) {
      return NextResponse.json({ error: 'cycleId requerido' }, { status: 400 })
    }

    // Determinar departmentIds según rol
    let departmentIds: string[] | undefined
    const isGlobalRole = GLOBAL_ROLES.includes(userContext.role || '')

    if (!isGlobalRole && userContext.departmentId) {
      const childIds = await getChildDepartmentIds(userContext.departmentId)
      departmentIds = [userContext.departmentId, ...childIds]
    }

    // Drill-down por gerencia: filtrar a esa gerencia + hijos
    if (gerenciaParam) {
      const gerenciaDeptIds = await resolveGerenciaDepartments(userContext.accountId, gerenciaParam)
      if (gerenciaDeptIds.length > 0) {
        // Intersect with RBAC filter if present
        departmentIds = departmentIds
          ? departmentIds.filter(id => gerenciaDeptIds.includes(id))
          : gerenciaDeptIds
      }
    }

    // Fetch company name
    const account = await prisma.account.findUnique({
      where: { id: userContext.accountId },
      select: { companyName: true },
    })

    // Fetch paralelo de todos los datos + star concentration + variance + succession + orgDistribution
    const [alertsData, nineBoxData, calibrationData, roleFitData, starConcentration, varianceData, successionData, orgDistribution, brechaData, semaforoData, goalsCorrelation] = await Promise.all([
      TalentIntelligenceService.getActiveAlerts(cycleId, userContext.accountId, departmentIds),
      PerformanceRatingService.get9BoxData(cycleId, userContext.accountId, departmentIds),
      PerformanceRatingService.getCalibrationStatsByDepartment(cycleId, userContext.accountId, departmentIds),
      RoleFitAnalyzer.getOrgRoleFitMatrix(userContext.accountId, cycleId, departmentIds),
      getStarConcentrationTop(cycleId, userContext.accountId, departmentIds),
      ManagerVarianceService.getVarianceByGerencia(cycleId, userContext.accountId, departmentIds),
      SuccessionService.getSuccessionCoverage(cycleId, userContext.accountId, departmentIds),
      getOrgDistribution(cycleId, userContext.accountId, departmentIds),
      PLTalentService.getBrechaProductiva(cycleId, userContext.accountId, departmentIds),
      PLTalentService.getSemaforoLegal(cycleId, userContext.accountId, departmentIds),
      GoalsDiagnosticService.getSummary(cycleId, userContext.accountId, departmentIds),
    ])

    // Calcular integrityScore + bias (misma fórmula que /calibration)
    const orgBias = detectOrgBias(orgDistribution)
    const gerenciasConDatos = varianceData.byGerencia.filter((g: any) => g.evaluatorCount > 0)
    const avgVariance = gerenciasConDatos.length > 0
      ? gerenciasConDatos.reduce((sum: number, g: any) => sum + (g.avgVariance || 0), 0) / gerenciasConDatos.length
      : 0
    const integrityScore = calculateIntegrityScore({
      optimaCount: calibrationData.byStatus['OPTIMA'] || 0,
      totalDepartments: Object.values(calibrationData.byStatus).reduce((a: number, b: number) => a + b, 0),
      biasType: orgBias.type,
      avgVariance
    })

    // Determinar rol para narrativas
    const narrativeRole = isGlobalRole ? 'CEO' as const : 'AREA_MANAGER' as const
    const isAdmin = userContext.role === 'FOCALIZAHR_ADMIN'

    // Contexto enriquecido para narrativas
    const talentConcentrationCtx = starConcentration.concentrationRisk
      ? starConcentration.topGerencia
      : undefined

    const worstManagerCtx = isAdmin && varianceData.byGerencia.length > 0
      ? varianceData.byGerencia[0].evaluators[0]?.managerName
      : undefined

    // Generar narrativa principal (Smart Router)
    const missionNarrative = ExecutiveNarrativeService.getMissionNarrative({
      alertas: { criticas: alertsData.critical, altas: alertsData.high },
      calibracion: {
        confianza: integrityScore.score,
        worstDepartment: calibrationData.worstDepartment?.name,
        worstManager: worstManagerCtx
      },
      capacidades: {
        roleFit: roleFitData.overall,
        worstLayer: ACOTADO_LABELS[roleFitData.worstCell.layer] || roleFitData.worstCell.layer,
        worstGerencia: roleFitData.worstCell.gerencia
      },
      talento: {
        starsPercent: nineBoxData.summary?.find((s: { position: string }) => s.position === 'star')?.percent || 0,
        concentration: talentConcentrationCtx
      },
      sucesion: {
        cobertura: successionData.coverage,
        sinCobertura: successionData.uncoveredCount > 0
          ? [`${successionData.uncoveredCount} roles`]
          : []
      },
      metas: {
        disconnectionRate: goalsCorrelation.disconnectionRate,
        coverage: goalsCorrelation.coverage,
        urgentCases: goalsCorrelation.urgentCases,
      }
    }, narrativeRole)

    return NextResponse.json({
      success: true,
      data: {
        // Mission Control
        mission: missionNarrative,

        // Company name for personalized narratives
        companyName: account?.companyName || 'tu organización',

        // User role for client-side UI differentiation
        userRole: userContext.role || 'VIEWER',

        // Rail cards data
        alertas: {
          total: alertsData.total,
          critical: alertsData.critical,
          high: alertsData.high
        },
        talento: {
          starsPercent: nineBoxData.summary?.find((s: { position: string }) => s.position === 'star')?.percent || 0,
          totalEmployees: nineBoxData.total || 0
        },
        calibracion: {
          confidence: integrityScore.score,
          // biasLabel derivado de clasificación por evaluador (misma fuente que CalibrationHealth)
          biasType: calibrationData.byStatus.SEVERA > 0 ? 'SEVERITY'
            : calibrationData.byStatus.INDULGENTE > 0 ? 'LENIENCY'
            : calibrationData.byStatus.CENTRAL > 0 ? 'CENTRAL_TENDENCY'
            : null,
          biasLabel: calibrationData.byStatus.SEVERA > 0 ? 'SEVERA'
            : calibrationData.byStatus.INDULGENTE > 0 ? 'INDULGENTE'
            : calibrationData.byStatus.CENTRAL > 0 ? 'CENTRAL'
            : null,
          integrityLevel: integrityScore.level,
          // Backward compat
          worstStatus: calibrationData.worstDepartment?.status || null,
          worstStatusLabel: calibrationData.worstDepartment?.statusLabel || null
        },
        capacidades: {
          roleFit: roleFitData.overall,
          worstLayer: ACOTADO_LABELS[roleFitData.worstCell.layer] || roleFitData.worstCell.layer,
          worstGerencia: roleFitData.worstCell.gerencia,
          worstCellCount: roleFitData.worstCell.count,
          worstCellScore: roleFitData.worstCell.score
        },
        sucesion: {
          coverage: successionData.coverage,
          uncoveredCount: successionData.uncoveredCount
        },
        plTalento: {
          totalGapMonthly: brechaData.totalGapMonthly,
          underperformerCount: semaforoData.totalPeople,
          totalLiability: semaforoData.totalLiability
        },
        metas: {
          coverage: goalsCorrelation.coverage,
          avgProgress: goalsCorrelation.avgProgress,
          disconnectionRate: goalsCorrelation.disconnectionRate,
          totalWithGoals: goalsCorrelation.totalWithGoals,
          totalEmployees: goalsCorrelation.totalEmployees,
          urgentCases: goalsCorrelation.urgentCases,
          topNarrativeType: goalsCorrelation.topNarrativeType,
          estimatedRisk: goalsCorrelation.estimatedRisk,
        }
      }
    })

  } catch (error: any) {
    console.error('[Executive Hub Summary] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// ═══════════════════════════════════════════════════════════════════════
// STAR CONCENTRATION (lightweight version for summary)
// ═══════════════════════════════════════════════════════════════════════

async function getStarConcentrationTop(
  cycleId: string,
  accountId: string,
  departmentIds?: string[]
) {
  const where: any = {
    cycleId,
    accountId,
    nineBoxPosition: 'star',
    employee: { status: 'ACTIVE' }
  }

  if (departmentIds?.length) {
    where.employee.departmentId = { in: departmentIds }
  }

  const stars = await prisma.performanceRating.findMany({
    where,
    select: {
      employee: {
        select: {
          department: {
            select: {
              displayName: true,
              parent: { select: { displayName: true } }
            }
          }
        }
      }
    }
  })

  const gerenciaCount = new Map<string, number>()
  for (const s of stars) {
    const gerencia = s.employee.department?.parent?.displayName
      || s.employee.department?.displayName
      || 'Sin Gerencia'
    gerenciaCount.set(gerencia, (gerenciaCount.get(gerencia) || 0) + 1)
  }

  const totalStars = stars.length
  let topGerencia: string | undefined
  let topPercent = 0

  for (const [gerencia, count] of gerenciaCount) {
    const pct = totalStars > 0 ? Math.round((count / totalStars) * 100) : 0
    if (pct > topPercent) {
      topPercent = pct
      topGerencia = `${gerencia} (${pct}%)`
    }
  }

  return {
    concentrationRisk: topPercent > 40,
    topGerencia
  }
}

// ═══════════════════════════════════════════════════════════════════════
// ORG DISTRIBUTION + BIAS DETECTION (shared with /calibration)
// ═══════════════════════════════════════════════════════════════════════

const IDEAL_BELL_CURVE = [
  { level: 1, label: 'Muy Bajo', idealPercent: 5 },
  { level: 2, label: 'Bajo', idealPercent: 15 },
  { level: 3, label: 'Medio', idealPercent: 60 },
  { level: 4, label: 'Alto', idealPercent: 15 },
  { level: 5, label: 'Muy Alto', idealPercent: 5 }
]

async function getOrgDistribution(cycleId: string, accountId: string, departmentIds?: string[]) {
  const where: any = { cycleId, accountId, calculatedScore: { gt: 0 } }
  if (departmentIds?.length) {
    where.employee = { departmentId: { in: departmentIds } }
  }
  const ratings = await prisma.performanceRating.findMany({
    where,
    select: { calculatedScore: true }
  })
  const total = ratings.length
  if (total === 0) {
    return { total: 0, buckets: IDEAL_BELL_CURVE.map(b => ({ ...b, actualCount: 0, actualPercent: 0, deviation: -b.idealPercent })) }
  }
  const counts = [0, 0, 0, 0, 0]
  for (const r of ratings) {
    counts[Math.max(0, Math.min(4, Math.round(r.calculatedScore!) - 1))]++
  }
  return {
    total,
    buckets: IDEAL_BELL_CURVE.map((b, i) => {
      const actualPercent = Math.round((counts[i] / total) * 100)
      return { ...b, actualCount: counts[i], actualPercent, deviation: actualPercent - b.idealPercent }
    })
  }
}

function detectOrgBias(orgDist: Awaited<ReturnType<typeof getOrgDistribution>>) {
  if (orgDist.total === 0) return { type: null, message: null, severity: 'ok' as const, maxDeviation: 0 }
  let maxDeviation = 0
  let deviationBucket = ''
  for (const b of orgDist.buckets) {
    const dev = Math.abs(b.deviation)
    if (dev > maxDeviation) { maxDeviation = dev; deviationBucket = b.label }
  }
  if (maxDeviation <= 20) return { type: null, message: 'Distribución saludable', severity: 'ok' as const, maxDeviation: 0 }
  const lowEnd = orgDist.buckets.filter(b => b.level <= 2).reduce((s, b) => s + b.actualPercent, 0)
  const highEnd = orgDist.buckets.filter(b => b.level >= 4).reduce((s, b) => s + b.actualPercent, 0)
  const center = orgDist.buckets.find(b => b.level === 3)?.actualPercent || 0
  let type: 'SEVERITY' | 'LENIENCY' | 'CENTRAL_TENDENCY'
  let message: string
  if (lowEnd > highEnd && lowEnd > center) {
    type = 'SEVERITY'; message = `Sesgo de severidad: ${deviationBucket} desvía ${maxDeviation}%. ${lowEnd}% en rango bajo.`
  } else if (highEnd > lowEnd && highEnd > center) {
    type = 'LENIENCY'; message = `Sesgo de indulgencia: ${deviationBucket} desvía ${maxDeviation}%. ${highEnd}% en rango alto.`
  } else {
    type = 'CENTRAL_TENDENCY'; message = `Tendencia central: ${deviationBucket} desvía ${maxDeviation}%. ${center}% en nivel medio.`
  }
  return { type, message, severity: (maxDeviation > 30 ? 'critical' : 'warning') as 'critical' | 'warning', maxDeviation }
}

// ═══════════════════════════════════════════════════════════════════════
// RESOLVE GERENCIA → departmentIds
// ═══════════════════════════════════════════════════════════════════════

async function resolveGerenciaDepartments(accountId: string, gerenciaName: string): Promise<string[]> {
  const gerencia = await prisma.department.findFirst({
    where: {
      accountId,
      displayName: gerenciaName,
      isActive: true
    },
    select: { id: true }
  })

  if (!gerencia) return []

  const childIds = await getChildDepartmentIds(gerencia.id)
  return [gerencia.id, ...childIds]
}
