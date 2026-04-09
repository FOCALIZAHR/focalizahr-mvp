// ════════════════════════════════════════════════════════════════════════════
// EXECUTIVE HUB — Exposición IA Spotlight
// src/app/api/executive-hub/exposure-ia/route.ts
//
// Datos para el panel spotlight de la card #8 del Executive Hub.
// Consume AIExposureService + WorkforceIntelligenceService.
// El spotlight muestra un resumen y redirige a /dashboard/workforce/ para
// la cascada completa.
// ════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { extractUserContext, hasPermission, getChildDepartmentIds } from '@/lib/services/AuthorizationService'
import { AIExposureService } from '@/lib/services/AIExposureService'
import { WorkforceIntelligenceService } from '@/lib/services/WorkforceIntelligenceService'

const GLOBAL_ROLES = ['FOCALIZAHR_ADMIN', 'ACCOUNT_OWNER', 'HR_ADMIN', 'HR_MANAGER', 'HR_OPERATOR', 'CEO']

export async function GET(request: NextRequest) {
  try {
    const userContext = extractUserContext(request)
    if (!userContext.accountId) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }
    if (!hasPermission(userContext.role, 'workforce-intelligence:view')) {
      return NextResponse.json({ success: false, error: 'Sin permisos' }, { status: 403 })
    }

    // RBAC: hierarchical filter for AREA_MANAGER
    let departmentIds: string[] | undefined
    if (!GLOBAL_ROLES.includes(userContext.role || '') && userContext.departmentId) {
      const childIds = await getChildDepartmentIds(userContext.departmentId)
      departmentIds = [userContext.departmentId, ...childIds]
    }

    // Fetch paralelo: exposure org + diagnostic completo
    const [exposure, diagnostic] = await Promise.all([
      AIExposureService.getOrganizationExposure(userContext.accountId, departmentIds),
      WorkforceIntelligenceService.getOrganizationDiagnostic(userContext.accountId, departmentIds),
    ])

    // Top 3 gerencias mas expuestas
    const topGerencias = Object.entries(exposure.byCategory)
      .map(([name, val]) => ({ name, avgExposure: val.avgExposure, headcount: val.headcount }))
      .filter(g => g.headcount > 0)
      .sort((a, b) => b.avgExposure - a.avgExposure)
      .slice(0, 3)

    // Hallazgos count
    const hallazgosCount =
      diagnostic.zombies.count +
      diagnostic.flightRisk.count +
      diagnostic.redundancy.pairs.length +
      diagnostic.adoptionRisk.departments.length +
      diagnostic.seniorityCompression.opportunities.length

    return NextResponse.json({
      success: true,
      data: {
        avgExposure: exposure.avgExposure,
        totalEmployees: exposure.totalEmployees,
        mappedEmployees: exposure.mappedEmployees,
        highExposureCount: exposure.highExposureCount,
        confidence: exposure.confidence,
        topGerencias,
        topExposedOccupations: exposure.topExposedOccupations.slice(0, 5),
        hallazgosCount,
        netROI: diagnostic.netROI,
        paybackMonths: diagnostic.paybackMonths,
        inertiaCostMonthly: diagnostic.inertiaCost.totalMonthly,
        liberatedFTEs: diagnostic.liberatedFTEs.totalFTEs,
      },
    })
  } catch (error: unknown) {
    console.error('[executive-hub/exposure-ia] Error:', error)
    const message = error instanceof Error ? error.message : 'Error interno'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
