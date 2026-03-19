// ════════════════════════════════════════════════════════════════════════════
// EXECUTIVE HUB - TALENT DETAIL API
// src/app/api/executive-hub/talent/route.ts
// ════════════════════════════════════════════════════════════════════════════
// Retorna: 9-Box, distribución, ADN org, concentración de estrellas por gerencia
// ════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { extractUserContext, getChildDepartmentIds } from '@/lib/services/AuthorizationService'
import { PerformanceRatingService } from '@/lib/services/PerformanceRatingService'
import { prisma } from '@/lib/prisma'
import { getOrgCompetencyGaps } from '@/lib/services/CompetencyScoreService'

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

    // Fetch paralelo: 9-box + distribución + concentración estrellas
    const [nineBoxData, ratingDistribution, starConcentration] = await Promise.all([
      PerformanceRatingService.get9BoxData(cycleId, userContext.accountId, departmentIds),
      PerformanceRatingService.getRatingDistribution(cycleId, userContext.accountId, departmentIds),
      getStarConcentrationByGerencia(cycleId, userContext.accountId, departmentIds)
    ])

    // ADN Organizacional: top competency gaps del ciclo
    const orgDNA = await getOrgDNA(cycleId, userContext.accountId, departmentIds)

    return NextResponse.json({
      success: true,
      data: {
        nineBox: nineBoxData,
        distribution: ratingDistribution,
        starConcentration,
        orgDNA
      }
    })

  } catch (error: any) {
    console.error('[Executive Hub Talent] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// ═══════════════════════════════════════════════════════════════════════
// CONCENTRACIÓN DE ESTRELLAS POR GERENCIA
// Responde: "45% de estrellas en Comercial = RIESGO de concentración"
// ═══════════════════════════════════════════════════════════════════════

async function getStarConcentrationByGerencia(
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

  // Agrupar por gerencia
  const gerenciaCount = new Map<string, number>()
  for (const s of stars) {
    const gerencia = s.employee.department?.parent?.displayName
      || s.employee.department?.displayName
      || 'Sin Gerencia'
    gerenciaCount.set(gerencia, (gerenciaCount.get(gerencia) || 0) + 1)
  }

  const totalStars = stars.length
  const concentration = Array.from(gerenciaCount.entries())
    .map(([gerencia, count]) => ({
      gerencia,
      starsCount: count,
      starsPercent: totalStars > 0 ? Math.round((count / totalStars) * 100) : 0
    }))
    .sort((a, b) => b.starsCount - a.starsCount)

  // Alerta si > 40% de estrellas en una sola gerencia
  const topGerencia = concentration[0]
  const concentrationRisk = topGerencia && topGerencia.starsPercent > 40

  return {
    totalStars,
    concentration,
    concentrationRisk,
    riskMessage: concentrationRisk
      ? `${topGerencia.starsPercent}% de estrellas concentradas en ${topGerencia.gerencia}`
      : null
  }
}

// ═══════════════════════════════════════════════════════════════════════
// ADN ORGANIZACIONAL
// Top fortaleza + top área de desarrollo (competencias agregadas)
// Usa gaps de RoleFit: competencias con mayor/menor gap promedio
// ═══════════════════════════════════════════════════════════════════════

async function getOrgDNA(
  cycleId: string,
  accountId: string,
  departmentIds?: string[]
) {
  // Gaps REALES: score_real - target_esperado via CompetencyScoreService
  const orgGaps = await getOrgCompetencyGaps(cycleId, accountId, departmentIds)

  if (orgGaps.length === 0) {
    return { topStrength: null, topDevelopment: null, insight: null }
  }

  // Fortaleza = gap positivo más alto (gente SUPERA lo que se les pide)
  // Oportunidad = gap negativo más severo (gente FALLA respecto al target)
  const sorted = [...orgGaps].sort((a, b) => b.gap - a.gap)
  const best = sorted[0]
  const worst = sorted[sorted.length - 1]

  // avgTarget ahora es el SCORE REAL (actual), no el target
  // Solo es fortaleza real si gap > 0 (la gente SUPERA el target, no solo iguala)
  const topStrength = best && best.gap > 0
    ? { competency: best.competencyName, avgTarget: best.actual, expected: best.expected, gap: best.gap }
    : null

  const topDevelopment = worst && worst.gap < 0
    ? { competency: worst.competencyName, avgTarget: worst.actual, expected: worst.expected, gap: worst.gap }
    : null

  let insight: string | null = null
  if (topStrength && topDevelopment) {
    insight = `Fortaleza en "${topStrength.competency}" (${best.actual} vs ${best.expected} esperado). Oportunidad: "${topDevelopment.competency}" (${worst.actual} vs ${worst.expected} esperado).`
  } else if (!topStrength && topDevelopment) {
    insight = `Ninguna competencia supera el estandar aun. La brecha mas urgente: "${topDevelopment.competency}" (${worst.actual} vs ${worst.expected} esperado).`
  } else if (topStrength && !topDevelopment) {
    insight = `Tu organizacion supera lo esperado en "${topStrength.competency}" (${best.actual} vs ${best.expected} esperado). Sin brechas criticas.`
  }

  return { topStrength, topDevelopment, insight }
}

async function resolveGerenciaDepts(accountId: string, name: string): Promise<string[]> {
  const dept = await prisma.department.findFirst({
    where: { accountId, displayName: name, isActive: true },
    select: { id: true }
  })
  if (!dept) return []
  const childIds = await getChildDepartmentIds(dept.id)
  return [dept.id, ...childIds]
}
