// ════════════════════════════════════════════════════════════════════════════
// EXECUTIVE HUB - CAPABILITIES DETAIL API
// src/app/api/executive-hub/capabilities/route.ts
// ════════════════════════════════════════════════════════════════════════════
// Retorna: RoleFit matrix + investmentPriorities + cell drill-down
// Query params: ?cycleId=X&layer=Y&gerencia=Z (drill-down opcional)
// ════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { extractUserContext, getChildDepartmentIds } from '@/lib/services/AuthorizationService'
import { RoleFitAnalyzer } from '@/lib/services/RoleFitAnalyzer'
import { StrategicFocusService, type StrategicFocus } from '@/lib/services/StrategicFocusService'
import { TALENT_INTELLIGENCE_THRESHOLDS } from '@/config/performanceClassification'
import { prisma } from '@/lib/prisma'
import { getOrgCompetencyGaps } from '@/lib/services/CompetencyScoreService'

const GLOBAL_ROLES = ['FOCALIZAHR_ADMIN', 'ACCOUNT_OWNER', 'HR_MANAGER', 'HR_ADMIN', 'CEO']

// Mapeo de acotadoGroup → standardJobLevels
const ACOTADO_TO_LEVELS: Record<string, string[]> = {
  'alta_gerencia': ['gerente_director', 'subgerente_subdirector'],
  'mandos_medios': ['jefe', 'supervisor_coordinador'],
  'profesionales': ['profesional_analista'],
  'base_operativa': ['asistente_otros', 'operativo_auxiliar']
}

export async function GET(request: NextRequest) {
  try {
    const userContext = extractUserContext(request)

    if (!userContext.accountId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const cycleId = searchParams.get('cycleId')
    const drillLayer = searchParams.get('layer')
    const drillGerencia = searchParams.get('gerencia')
    const gerenciaFilter = searchParams.get('gerenciaFilter')

    if (!cycleId) {
      return NextResponse.json({ error: 'cycleId requerido' }, { status: 400 })
    }

    let departmentIds: string[] | undefined

    if (!GLOBAL_ROLES.includes(userContext.role || '') && userContext.departmentId) {
      const childIds = await getChildDepartmentIds(userContext.departmentId)
      departmentIds = [userContext.departmentId, ...childIds]
    }

    // Gerencia drill-down filter (separate from cell drill-down gerencia param)
    if (gerenciaFilter) {
      const gIds = await resolveGerenciaDepts(userContext.accountId, gerenciaFilter)
      if (gIds.length > 0) {
        departmentIds = departmentIds ? departmentIds.filter(id => gIds.includes(id)) : gIds
      }
    }

    // Si hay drill-down, retornar detalle de celda
    if (drillLayer && drillGerencia) {
      const isAdmin = userContext.role === 'FOCALIZAHR_ADMIN'
      const drillDown = await getCellDrillDown(
        cycleId,
        userContext.accountId,
        drillLayer,
        drillGerencia,
        departmentIds,
        isAdmin
      )

      return NextResponse.json({
        success: true,
        data: { drillDown }
      })
    }

    // Default: matriz completa + strategic focus
    const [roleFitMatrix, orgGaps] = await Promise.all([
      RoleFitAnalyzer.getOrgRoleFitMatrix(
        userContext.accountId,
        cycleId,
        departmentIds
      ),
      getOrgCompetencyGaps(cycleId, userContext.accountId, departmentIds)
    ])

    // Classify for all foci so frontend can switch without extra API calls
    const strategicFocus = orgGaps.length > 0
      ? StrategicFocusService.classifyAllFoci(orgGaps)
      : []

    return NextResponse.json({
      success: true,
      data: {
        ...roleFitMatrix,
        strategicFocus,
        availableFoci: StrategicFocusService.getAvailableFoci()
      }
    })

  } catch (error: any) {
    console.error('[Executive Hub Capabilities] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// ═══════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════

// numAvg moved to CompetencyScoreService
function numAvg(nums: number[]): number {
  if (nums.length === 0) return 0
  return nums.reduce((a, b) => a + b, 0) / nums.length
}
// NOTE: bulkCompetencyScores and getOrgCompetencyGaps now imported from CompetencyScoreService
// Local copies below kept for getCellDrillDown which uses bulkCompetencyScores locally

/**
 * Bulk-fetch competency scores for multiple employees in 2 queries.
 * Replaces N sequential calls to PerformanceResultsService.getEvaluateeResults.
 *
 * Returns Map<competencyCode, { total: number; count: number }>
 * where total/count represent the sum/count of per-employee overallAvgScores.
 */
async function bulkCompetencyScores(
  cycleId: string,
  employeeIds: string[]
): Promise<Map<string, { total: number; count: number }>> {
  const result = new Map<string, { total: number; count: number }>()
  if (employeeIds.length === 0) return result

  // Query 1: question → competencyCode mapping
  const cycle = await prisma.performanceCycle.findUnique({
    where: { id: cycleId },
    select: {
      campaign: {
        select: {
          campaignType: {
            select: {
              questions: {
                where: { competencyCode: { not: null } },
                select: { id: true, competencyCode: true }
              }
            }
          }
        }
      }
    }
  })

  const questions = cycle?.campaign?.campaignType?.questions || []
  if (questions.length === 0) return result

  const questionToComp = new Map(
    questions.map((q: { id: string; competencyCode: string | null }) => [q.id, q.competencyCode!])
  )

  // Query 2: ALL completed assignments for ALL employees at once
  const assignments = await prisma.evaluationAssignment.findMany({
    where: {
      cycleId,
      evaluateeId: { in: employeeIds },
      status: 'COMPLETED'
    },
    select: {
      evaluateeId: true,
      evaluationType: true,
      participant: {
        select: {
          responses: {
            select: {
              questionId: true,
              rating: true,
              normalizedScore: true
            }
          }
        }
      }
    }
  })

  // Group assignments by employee
  const byEmployee = new Map<string, typeof assignments>()
  for (const a of assignments) {
    const arr = byEmployee.get(a.evaluateeId) || []
    arr.push(a)
    byEmployee.set(a.evaluateeId, arr)
  }

  // For each employee: compute per-competency overallAvgScore, then aggregate across employees
  for (const [, empAssignments] of byEmployee) {
    // Group scores by competency × evaluator type
    const compBuckets = new Map<string, { self: number[]; mgr: number[]; peer: number[]; up: number[] }>()

    for (const a of empAssignments) {
      if (!a.participant?.responses) continue
      for (const r of a.participant.responses) {
        const compCode = questionToComp.get(r.questionId)
        if (!compCode) continue
        const score = r.normalizedScore ?? r.rating
        if (score === null) continue

        if (!compBuckets.has(compCode)) {
          compBuckets.set(compCode, { self: [], mgr: [], peer: [], up: [] })
        }
        const bucket = compBuckets.get(compCode)!
        switch (a.evaluationType) {
          case 'SELF': bucket.self.push(score); break
          case 'MANAGER_TO_EMPLOYEE': bucket.mgr.push(score); break
          case 'PEER': bucket.peer.push(score); break
          case 'EMPLOYEE_TO_MANAGER': bucket.up.push(score); break
        }
      }
    }

    // overallAvgScore = avg of per-type averages (matches PerformanceResultsService logic)
    for (const [code, bucket] of compBuckets) {
      const typeAvgs: number[] = []
      if (bucket.self.length) typeAvgs.push(numAvg(bucket.self))
      if (bucket.mgr.length) typeAvgs.push(numAvg(bucket.mgr))
      if (bucket.peer.length) typeAvgs.push(numAvg(bucket.peer))
      if (bucket.up.length) typeAvgs.push(numAvg(bucket.up))

      if (typeAvgs.length > 0) {
        const agg = result.get(code) || { total: 0, count: 0 }
        agg.total += numAvg(typeAvgs)
        agg.count++
        result.set(code, agg)
      }
    }
  }

  return result
}

// ═══════════════════════════════════════════════════════════════════════
// CELL DRILL-DOWN
// Clic en "Mandos Medios × Operaciones" → detalle completo
// ═══════════════════════════════════════════════════════════════════════

async function getCellDrillDown(
  cycleId: string,
  accountId: string,
  layer: string,
  gerencia: string,
  departmentIds?: string[],
  showNames: boolean = false
) {
  // Resolver standardJobLevels para esta capa
  const jobLevels = ACOTADO_TO_LEVELS[layer]
  if (!jobLevels) {
    return { error: `Capa desconocida: ${layer}` }
  }

  // Buscar empleados en esta celda (capa + gerencia)
  const where: any = {
    cycleId,
    accountId,
    roleFitScore: { not: null },
    employee: {
      status: 'ACTIVE',
      standardJobLevel: { in: jobLevels },
      department: {
        OR: [
          { displayName: gerencia },
          { parent: { displayName: gerencia } }
        ]
      }
    }
  }

  if (departmentIds?.length) {
    where.employee.departmentId = { in: departmentIds }
  }

  const ratings = await prisma.performanceRating.findMany({
    where,
    select: {
      employeeId: true,
      roleFitScore: true,
      employee: {
        select: {
          fullName: true,
          position: true,
          standardJobLevel: true
        }
      }
    },
    orderBy: { roleFitScore: 'asc' }
  })

  if (ratings.length === 0) {
    return {
      summary: { avgRoleFit: 0, headcount: 0, gap: 0, status: 'SIN_DATOS' },
      competencyGaps: [],
      topEmployees: []
    }
  }

  // Resumen de la celda
  const avgRoleFit = Math.round(
    ratings.reduce((sum: number, r: { roleFitScore: number | null }) => sum + (r.roleFitScore || 0), 0) / ratings.length
  )
  const expectedFit = 80 // Target estándar
  const gap = avgRoleFit - expectedFit
  const status = avgRoleFit >= TALENT_INTELLIGENCE_THRESHOLDS.ROLE_FIT_HIGH ? 'SALUDABLE' : avgRoleFit >= 60 ? 'ATENCION' : 'CRITICO'

  // Obtener unique positions/cargos
  const uniquePositions = new Set(ratings.map((r: typeof ratings[number]) => r.employee.position).filter(Boolean))

  // Competency targets para estos job levels
  const targets = await prisma.competencyTarget.findMany({
    where: {
      accountId,
      standardJobLevel: { in: jobLevels },
      targetScore: { not: null }
    },
    select: {
      competencyCode: true,
      targetScore: true
    }
  })

  // Nombres de competencias
  const competencyCodes = [...new Set(targets.map((t: { competencyCode: string }) => t.competencyCode))]
  const competencies = await prisma.competency.findMany({
    where: { accountId, code: { in: competencyCodes }, isActive: true },
    select: { code: true, name: true }
  })
  const compNameMap = new Map(competencies.map((c: { code: string; name: string }) => [c.code, c.name]))

  // Promedio target por competencia
  const targetMap = new Map<string, number[]>()
  for (const t of targets) {
    if (!t.targetScore) continue
    if (!targetMap.has(t.competencyCode)) targetMap.set(t.competencyCode, [])
    targetMap.get(t.competencyCode)!.push(t.targetScore)
  }

  // BULK: scores de competencia para sample de empleados (max 30)
  // Reemplaza N+1 sequential calls con 2 queries
  const sampleIds = ratings.slice(0, 30).map((r: typeof ratings[number]) => r.employeeId)
  const competencyAggregation = await bulkCompetencyScores(cycleId, sampleIds)

  // Calcular gaps por competencia
  const competencyGaps = competencyCodes
    .map((code: string) => {
      const targetScores = targetMap.get(code) || []
      const avgTarget = targetScores.length > 0
        ? targetScores.reduce((a: number, b: number) => a + b, 0) / targetScores.length
        : 0

      const agg = competencyAggregation.get(code)
      const avgActual = agg ? agg.total / agg.count : 0
      const affected = agg ? agg.count : 0

      return {
        competency: compNameMap.get(code) || code,
        competencyCode: code,
        expected: Math.round(avgTarget * 10) / 10,
        actual: Math.round(avgActual * 10) / 10,
        gap: Math.round((avgActual - avgTarget) * 10) / 10,
        affectedCount: affected,
        affectedPercent: ratings.length > 0
          ? Math.round((affected / Math.min(ratings.length, 30)) * 100)
          : 0
      }
    })
    .filter((g: { expected: number }) => g.expected > 0)
    .sort((a: { gap: number }, b: { gap: number }) => a.gap - b.gap)

  // Top empleados con mayor brecha (solo FOCALIZAHR_ADMIN)
  const topEmployees = showNames
    ? ratings.slice(0, 5).map((r: typeof ratings[number]) => ({
        name: r.employee.fullName,
        position: r.employee.position || 'Sin cargo',
        roleFitScore: Math.round(r.roleFitScore || 0)
      }))
    : []

  return {
    summary: {
      avgRoleFit,
      headcount: ratings.length,
      cargos: uniquePositions.size,
      expectedFit,
      gap,
      status
    },
    competencyGaps,
    topEmployees
  }
}

// ═══════════════════════════════════════════════════════════════════════
// ORG-WIDE COMPETENCY GAPS — ahora importado de CompetencyScoreService
// Esta función local se mantiene como _legacy por si se necesita referencia
// ═══════════════════════════════════════════════════════════════════════

async function _localGetOrgCompetencyGaps_unused(
  cycleId: string,
  accountId: string,
  departmentIds?: string[]
): Promise<Array<{ competencyCode: string; competencyName: string; gap: number; actual: number; expected: number }>> {
  const where: any = {
    cycleId,
    accountId,
    roleFitScore: { not: null },
    employee: { status: 'ACTIVE' }
  }

  if (departmentIds?.length) {
    where.employee.departmentId = { in: departmentIds }
  }

  // Sample up to 50 employees for org-wide view
  const ratings = await prisma.performanceRating.findMany({
    where,
    select: { employeeId: true },
    take: 50,
    orderBy: { roleFitScore: 'asc' }
  })

  if (ratings.length === 0) return []

  const employeeIds = ratings.map(r => r.employeeId)

  // BULK: 2 queries for competency scores instead of 250+
  const [targets, competencyAgg] = await Promise.all([
    prisma.competencyTarget.findMany({
      where: { accountId, targetScore: { not: null } },
      select: { competencyCode: true, targetScore: true }
    }),
    bulkCompetencyScores(cycleId, employeeIds)
  ])

  const targetMap = new Map<string, number[]>()
  for (const t of targets) {
    if (!t.targetScore) continue
    if (!targetMap.has(t.competencyCode)) targetMap.set(t.competencyCode, [])
    targetMap.get(t.competencyCode)!.push(t.targetScore)
  }

  const competencyCodes = [...targetMap.keys()]
  const competencies = await prisma.competency.findMany({
    where: { accountId, code: { in: competencyCodes }, isActive: true },
    select: { code: true, name: true }
  })
  const compNameMap = new Map(competencies.map((c: { code: string; name: string }) => [c.code, c.name]))

  return competencyCodes
    .map(code => {
      const targetScores = targetMap.get(code) || []
      const avgTarget = targetScores.reduce((a, b) => a + b, 0) / targetScores.length
      const agg = competencyAgg.get(code)
      const avgActual = agg ? agg.total / agg.count : 0

      return {
        competencyCode: code,
        competencyName: compNameMap.get(code) || code,
        gap: Math.round((avgActual - avgTarget) * 10) / 10,
        actual: Math.round(avgActual * 10) / 10,
        expected: Math.round(avgTarget * 10) / 10
      }
    })
    .filter(g => g.expected > 0)
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
