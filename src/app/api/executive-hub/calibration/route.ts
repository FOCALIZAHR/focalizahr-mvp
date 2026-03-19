// ════════════════════════════════════════════════════════════════════════════
// EXECUTIVE HUB - CALIBRATION DETAIL API
// src/app/api/executive-hub/calibration/route.ts
// ════════════════════════════════════════════════════════════════════════════
// Retorna: Calibration stats + distribución vs bell curve + sesgo + varianza
// ════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { extractUserContext, getChildDepartmentIds } from '@/lib/services/AuthorizationService'
import { PerformanceRatingService, calculateIntegrityScore } from '@/lib/services/PerformanceRatingService'
import { ManagerVarianceService } from '@/lib/services/ManagerVarianceService'
import { prisma } from '@/lib/prisma'

const GLOBAL_ROLES = ['FOCALIZAHR_ADMIN', 'ACCOUNT_OWNER', 'HR_MANAGER', 'HR_ADMIN', 'CEO']

// Bell curve ideal (distribución normal forzada)
const IDEAL_BELL_CURVE = [
  { level: 1, label: 'Muy Bajo', idealPercent: 5 },
  { level: 2, label: 'Bajo', idealPercent: 15 },
  { level: 3, label: 'Medio', idealPercent: 60 },
  { level: 4, label: 'Alto', idealPercent: 15 },
  { level: 5, label: 'Muy Alto', idealPercent: 5 }
]

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

    let departmentIds: string[] | undefined

    if (!GLOBAL_ROLES.includes(userContext.role || '') && userContext.departmentId) {
      const childIds = await getChildDepartmentIds(userContext.departmentId)
      departmentIds = [userContext.departmentId, ...childIds]
    }

    if (gerenciaParam) {
      const gIds = await resolveGerenciaDepts(userContext.accountId, gerenciaParam)
      if (gIds.length > 0) {
        departmentIds = departmentIds ? departmentIds.filter(id => gIds.includes(id)) : gIds
      }
    }

    // Fetch paralelo: calibration stats + varianza + distribución org + stats por gerencia
    const [calibrationData, varianceData, orgDistribution, byGerencia] = await Promise.all([
      PerformanceRatingService.getCalibrationStatsByDepartment(
        cycleId,
        userContext.accountId,
        departmentIds
      ),
      ManagerVarianceService.getVarianceByGerencia(
        cycleId,
        userContext.accountId,
        departmentIds
      ),
      getOrgDistribution(cycleId, userContext.accountId, departmentIds),
      PerformanceRatingService.getCalibrationStatsByGerencia(
        cycleId,
        userContext.accountId,
        departmentIds
      )
    ])

    // Detectar sesgo organizacional
    const bias = detectOrgBias(orgDistribution)

    // Calcular varianza promedio desde byGerencia (gerencias con datos)
    const gerenciasConDatos = byGerencia.filter(g => g.evaluatorCount > 0 && g.stdDev !== null)
    const avgVariance = gerenciasConDatos.length > 0
      ? gerenciasConDatos.reduce((sum, g) => sum + g.stdDev!, 0) / gerenciasConDatos.length
      : 0

    // Fórmula de Integridad Focaliza v1.1
    const integrityScore = calculateIntegrityScore({
      optimaCount: calibrationData.byStatus['OPTIMA'] || 0,
      totalDepartments: Object.values(calibrationData.byStatus).reduce((a, b) => a + b, 0),
      biasType: bias.type,
      avgVariance
    })

    // Backward compat: generar gerenciaHeatmap solo con gerencias que tienen datos
    const gerenciaHeatmap = byGerencia
      .filter(g => g.evaluatorCount > 0)
      .map(g => ({
        gerencia: g.gerenciaName,
        OPTIMA: g.counts.OPTIMA,
        CENTRAL: g.counts.CENTRAL,
        SEVERA: g.counts.SEVERA,
        INDULGENTE: g.counts.INDULGENTE,
        total: g.evaluatorCount,
        dominantStatus: g.status!
      }))

    return NextResponse.json({
      success: true,
      data: {
        ...calibrationData,
        overallConfidence: integrityScore.score,
        integrityScore,
        orgDistribution,
        bias,
        gerenciaHeatmap,
        byGerencia,
        variance: varianceData
      }
    })

  } catch (error: any) {
    console.error('[Executive Hub Calibration] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// ═══════════════════════════════════════════════════════════════════════
// DISTRIBUCIÓN ORGANIZACIONAL vs BELL CURVE
// ═══════════════════════════════════════════════════════════════════════

async function getOrgDistribution(
  cycleId: string,
  accountId: string,
  departmentIds?: string[]
) {
  const where: any = {
    cycleId,
    accountId,
    calculatedScore: { gt: 0 }
  }

  if (departmentIds?.length) {
    where.employee = { departmentId: { in: departmentIds } }
  }

  const ratings = await prisma.performanceRating.findMany({
    where,
    select: { calculatedScore: true }
  })

  const total = ratings.length
  if (total === 0) {
    return {
      total: 0,
      buckets: IDEAL_BELL_CURVE.map(b => ({
        ...b,
        actualCount: 0,
        actualPercent: 0,
        deviation: -b.idealPercent
      }))
    }
  }

  // Contar por bucket (1-5)
  const counts = [0, 0, 0, 0, 0]
  for (const r of ratings) {
    const bucket = Math.max(0, Math.min(4, Math.round(r.calculatedScore!) - 1))
    counts[bucket]++
  }

  const buckets = IDEAL_BELL_CURVE.map((b, i) => {
    const actualPercent = total > 0 ? Math.round((counts[i] / total) * 100) : 0
    return {
      ...b,
      actualCount: counts[i],
      actualPercent,
      deviation: actualPercent - b.idealPercent
    }
  })

  return { total, buckets }
}

// ═══════════════════════════════════════════════════════════════════════
// DETECCIÓN DE SESGO ORGANIZACIONAL
// Regla Focaliza: >20% desviación en CUALQUIER bucket = alerta
// ═══════════════════════════════════════════════════════════════════════

function detectOrgBias(orgDistribution: Awaited<ReturnType<typeof getOrgDistribution>>) {
  if (orgDistribution.total === 0) {
    return { type: null, message: null, severity: 'ok' as const, maxDeviation: 0 }
  }

  const buckets = orgDistribution.buckets

  // 1. Detectar desviación máxima por bucket
  let maxDeviation = 0
  let deviationBucket = ''
  for (const b of buckets) {
    const dev = Math.abs(b.deviation)
    if (dev > maxDeviation) {
      maxDeviation = dev
      deviationBucket = b.label
    }
  }

  // 2. Si ningún bucket supera 20% → saludable
  if (maxDeviation <= 20) {
    return { type: null, message: 'Distribución saludable', severity: 'ok' as const, maxDeviation: 0 }
  }

  // 3. Clasificar tipo de sesgo según dónde se concentra
  const lowEnd = buckets.filter(b => b.level <= 2).reduce((s, b) => s + b.actualPercent, 0)
  const highEnd = buckets.filter(b => b.level >= 4).reduce((s, b) => s + b.actualPercent, 0)
  const center = buckets.find(b => b.level === 3)?.actualPercent || 0

  let type: 'SEVERITY' | 'LENIENCY' | 'CENTRAL_TENDENCY'
  let message: string

  if (lowEnd > highEnd && lowEnd > center) {
    type = 'SEVERITY'
    message = `Sesgo de severidad: ${deviationBucket} desvía ${maxDeviation}% del target. ${lowEnd}% de evaluaciones en rango bajo.`
  } else if (highEnd > lowEnd && highEnd > center) {
    type = 'LENIENCY'
    message = `Sesgo de indulgencia: ${deviationBucket} desvía ${maxDeviation}% del target. ${highEnd}% de evaluaciones en rango alto.`
  } else {
    type = 'CENTRAL_TENDENCY'
    message = `Tendencia central: ${deviationBucket} desvía ${maxDeviation}% del target. ${center}% concentrado en nivel medio.`
  }

  return {
    type,
    message,
    severity: (maxDeviation > 30 ? 'critical' : 'warning') as 'critical' | 'warning',
    maxDeviation
  }
}

// ═══════════════════════════════════════════════════════════════════════
// RESOLVER GERENCIA → DEPARTAMENTO IDs
// ═══════════════════════════════════════════════════════════════════════

async function resolveGerenciaDepts(accountId: string, name: string): Promise<string[]> {
  const dept = await prisma.department.findFirst({
    where: { accountId, displayName: name, isActive: true },
    select: { id: true }
  })
  if (!dept) return []
  const childIds = await getChildDepartmentIds(dept.id)
  return [dept.id, ...childIds]
}
