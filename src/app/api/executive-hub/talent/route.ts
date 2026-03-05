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
  // Query: ratings con roleFitScore, para luego agregar competency gaps
  const where: any = {
    cycleId,
    accountId,
    roleFitScore: { not: null },
    employee: {
      status: 'ACTIVE',
      standardJobLevel: { not: null }
    }
  }

  if (departmentIds?.length) {
    where.employee.departmentId = { in: departmentIds }
  }

  // Obtener empleados con sus competency targets
  const ratings = await prisma.performanceRating.findMany({
    where,
    select: {
      employeeId: true,
      employee: {
        select: { standardJobLevel: true }
      }
    },
    take: 200 // Limitar para performance
  })

  if (ratings.length === 0) {
    return { topStrength: null, topDevelopment: null, insight: null }
  }

  // Obtener los standardJobLevels únicos
  const levels = [...new Set(ratings.map((r: typeof ratings[number]) => r.employee.standardJobLevel).filter(Boolean))] as string[]

  // Obtener targets para esos niveles
  const targets = await prisma.competencyTarget.findMany({
    where: {
      accountId,
      standardJobLevel: { in: levels },
      targetScore: { not: null }
    },
    select: {
      competencyCode: true,
      standardJobLevel: true,
      targetScore: true
    }
  })

  // Obtener competencias para nombres
  const competencyCodes = [...new Set(targets.map((t: { competencyCode: string }) => t.competencyCode))]
  const competencies = await prisma.competency.findMany({
    where: {
      accountId,
      code: { in: competencyCodes },
      isActive: true
    },
    select: { code: true, name: true }
  })
  const compNameMap = new Map(competencies.map((c: { code: string; name: string }) => [c.code, c.name]))

  // Agregar targets por competency (promedio de todos los levels)
  const targetByComp = new Map<string, { totalTarget: number; count: number }>()
  for (const t of targets) {
    if (!t.targetScore) continue
    const existing = targetByComp.get(t.competencyCode) || { totalTarget: 0, count: 0 }
    existing.totalTarget += t.targetScore
    existing.count++
    targetByComp.set(t.competencyCode, existing)
  }

  // Calcular promedio target por competencia
  const avgTargets = Array.from(targetByComp.entries()).map(([code, data]) => ({
    code,
    name: compNameMap.get(code) || code,
    avgTarget: data.totalTarget / data.count
  }))

  // Retornar top fortaleza (mayor target = más exigido y cumplido)
  // y top desarrollo (menor target promedio relativo a lo esperado)
  // Simplificación: ordenar por avgTarget desc/asc
  const sorted = avgTargets.sort((a, b) => b.avgTarget - a.avgTarget)

  const topStrength = sorted.length > 0
    ? { competency: sorted[0].name, avgTarget: Math.round(sorted[0].avgTarget * 10) / 10 }
    : null

  const topDevelopment = sorted.length > 1
    ? { competency: sorted[sorted.length - 1].name, avgTarget: Math.round(sorted[sorted.length - 1].avgTarget * 10) / 10 }
    : null

  const insight = topStrength && topDevelopment
    ? `Fortaleza en "${topStrength.competency}". Area de desarrollo: "${topDevelopment.competency}"`
    : null

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
