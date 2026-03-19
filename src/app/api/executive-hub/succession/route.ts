// ════════════════════════════════════════════════════════════════════════════
// EXECUTIVE HUB - SUCCESSION DETAIL API (v2)
// src/app/api/executive-hub/succession/route.ts
// ════════════════════════════════════════════════════════════════════════════
// Retorna: summary + mapa de vulnerabilidad + domino chains + bench distribution
// ════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { extractUserContext, getChildDepartmentIds } from '@/lib/services/AuthorizationService'
import { SuccessionService } from '@/lib/services/SuccessionService'
import { READINESS_LABELS } from '@/config/successionConstants'
import { calculateUrgency, type VulnerabilityLevel } from '@/config/successionNarratives'
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
    const gerencia = searchParams.get('gerencia')

    if (!cycleId) {
      return NextResponse.json({ error: 'cycleId requerido' }, { status: 400 })
    }

    let departmentIds: string[] | undefined

    if (!GLOBAL_ROLES.includes(userContext.role || '') && userContext.departmentId) {
      const childIds = await getChildDepartmentIds(userContext.departmentId)
      departmentIds = [userContext.departmentId, ...childIds]
    }

    if (gerencia) {
      const gIds = await resolveGerenciaDepts(userContext.accountId, gerencia)
      if (gIds.length > 0) {
        departmentIds = departmentIds ? departmentIds.filter(id => gIds.includes(id)) : gIds
      }
    }

    // Fetch paralelo: summary + vulnerability map + chain coverage
    const [summary, vulnerabilityData, chainCoverage] = await Promise.all([
      SuccessionService.getSuccessionSummary(cycleId, userContext.accountId, departmentIds),
      getVulnerabilityMap(userContext.accountId, departmentIds),
      SuccessionService.getChainCoverage(userContext.accountId),
    ])

    return NextResponse.json({
      success: true,
      data: {
        // Summary (existing)
        ...summary,
        // Vulnerability map (new)
        vulnerabilityMap: vulnerabilityData.rows,
        dominoOpenCount: vulnerabilityData.dominoOpenCount,
        // Chain coverage (new)
        chainCoverage,
        // Bench strength distribution (new)
        benchDistribution: vulnerabilityData.benchDistribution,
      }
    })

  } catch (error: any) {
    console.error('[Executive Hub Succession] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// ════════════════════════════════════════════════════════════════════════════
// VULNERABILITY MAP - La joya: cruza flight risk × bench strength
// ════════════════════════════════════════════════════════════════════════════

async function getVulnerabilityMap(accountId: string, departmentIds?: string[]) {
  const positionWhere: any = { accountId, isActive: true }
  if (departmentIds?.length) {
    positionWhere.departmentId = { in: departmentIds }
  }

  const positions = await prisma.criticalPosition.findMany({
    where: positionWhere,
    select: {
      id: true,
      positionTitle: true,
      benchStrength: true,
      incumbentFlightRisk: true,
      incumbent: {
        select: {
          id: true,
          fullName: true,
        }
      },
      candidates: {
        where: { status: 'ACTIVE' },
        orderBy: [
          { readinessLevel: 'asc' },
          { matchPercent: 'desc' },
        ],
        take: 1,
        select: {
          employeeId: true,
          readinessLevel: true,
          readinessOverride: true,
          matchPercent: true,
          employee: {
            select: {
              id: true,
              fullName: true,
              position: true,
            }
          },
          backfillPlan: {
            select: {
              resolution: true,
              vacatedPositionTitle: true,
              backfillEmployeeName: true,
            }
          },
        }
      }
    }
  })

  // Build rows — chain status from backfillPlan (source of truth)
  const benchDistribution = { STRONG: 0, MODERATE: 0, WEAK: 0, NONE: 0, UNKNOWN: 0 }
  let dominoOpenCount = 0

  const rows = positions.map(pos => {
    const bench = pos.benchStrength || 'UNKNOWN'
    if (bench in benchDistribution) benchDistribution[bench as keyof typeof benchDistribution]++

    const bestCandidate = pos.candidates[0] || null
    const effectiveReadiness = bestCandidate
      ? (bestCandidate.readinessOverride || bestCandidate.readinessLevel)
      : null

    // Chain status from backfillPlan
    let chainStatus: 'covered' | 'domino_open' | 'no_candidate' = 'no_candidate'
    let chainDetail: string | null = null

    if (bestCandidate) {
      const bp = bestCandidate.backfillPlan
      if (!bp) {
        // No backfill plan → candidate doesn't vacate a critical role
        chainStatus = 'covered'
      } else if (bp.resolution === 'PENDING') {
        chainStatus = 'domino_open'
        dominoOpenCount++
        chainDetail = `Activar a ${bestCandidate.employee.fullName.split(' ')[0]} resuelve ${pos.positionTitle} pero deja ${bp.vacatedPositionTitle} sin cobertura confirmada.`
      } else {
        // COVERED, EXTERNAL_SEARCH, POSITION_ELIMINATED → resolved
        chainStatus = 'covered'
      }
    }

    const urgency: VulnerabilityLevel = calculateUrgency(pos.incumbentFlightRisk, bench)

    return {
      positionId: pos.id,
      positionTitle: pos.positionTitle,
      incumbentName: pos.incumbent?.fullName || null,
      flightRisk: pos.incumbentFlightRisk || null,
      benchStrength: bench,
      bestCandidateName: bestCandidate?.employee.fullName || null,
      bestCandidateReadiness: effectiveReadiness,
      bestCandidateReadinessLabel: effectiveReadiness ? (READINESS_LABELS[effectiveReadiness] || effectiveReadiness) : null,
      chainStatus,
      chainDetail,
      urgency,
    }
  })

  // Sort by urgency
  const urgencyOrder: Record<VulnerabilityLevel, number> = { CRITICAL: 0, URGENT: 1, NEEDS_ATTENTION: 2, NORMAL: 3, NO_DATA: 4 }
  rows.sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency])

  return { rows, dominoOpenCount, benchDistribution }
}

// ════════════════════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════════════════════

async function resolveGerenciaDepts(accountId: string, name: string): Promise<string[]> {
  const dept = await prisma.department.findFirst({
    where: { accountId, displayName: name, isActive: true },
    select: { id: true }
  })
  if (!dept) return []
  const childIds = await getChildDepartmentIds(dept.id)
  return [dept.id, ...childIds]
}
