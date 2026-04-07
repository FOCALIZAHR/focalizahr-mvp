// GET /api/workforce/intelligence — Motor de cruces IA × Talento
// ?mode=full|zombies|flight-risk|redundancy|adoption-risk|seniority|inertia-cost|liberated-ftes|severance|retention
// ?departmentId=xxx — filtro departamental

import { NextRequest, NextResponse } from 'next/server'
import { extractUserContext, hasPermission, getChildDepartmentIds } from '@/lib/services/AuthorizationService'
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

    const { searchParams } = new URL(request.url)
    const mode = searchParams.get('mode') ?? 'full'
    const departmentId = searchParams.get('departmentId')

    // RBAC: hierarchical filter for AREA_MANAGER
    let departmentIds: string[] | undefined
    if (!GLOBAL_ROLES.includes(userContext.role || '') && userContext.departmentId) {
      const childIds = await getChildDepartmentIds(userContext.departmentId)
      departmentIds = [userContext.departmentId, ...childIds]
      if (departmentId && !departmentIds.includes(departmentId)) {
        return NextResponse.json({ success: false, error: 'Fuera de scope' }, { status: 403 })
      }
    }
    if (departmentId) {
      departmentIds = departmentIds ? departmentIds.filter(id => id === departmentId) : [departmentId]
    }

    // Full diagnostic
    if (mode === 'full') {
      const data = await WorkforceIntelligenceService.getOrganizationDiagnostic(
        userContext.accountId, departmentIds
      )
      return NextResponse.json({ success: true, data })
    }

    // Individual modes — build enriched dataset once
    const enriched = await WorkforceIntelligenceService.buildEnrichedDataset(
      userContext.accountId, departmentIds
    )

    let data: any
    switch (mode) {
      case 'zombies':
        data = WorkforceIntelligenceService.detectTalentZombies(enriched); break
      case 'flight-risk':
        data = WorkforceIntelligenceService.detectAugmentedFlightRisk(enriched); break
      case 'redundancy':
        data = await WorkforceIntelligenceService.detectRedundantPositions(enriched); break
      case 'adoption-risk':
        data = WorkforceIntelligenceService.detectAdoptionRisk(enriched); break
      case 'seniority':
        data = WorkforceIntelligenceService.detectSeniorityCompression(enriched); break
      case 'inertia-cost':
        data = WorkforceIntelligenceService.calculateInertiaCost(enriched); break
      case 'liberated-ftes':
        data = await WorkforceIntelligenceService.calculateLiberatedFTEs(enriched); break
      case 'severance':
        data = WorkforceIntelligenceService.calculateSeveranceLiability(enriched); break
      case 'retention':
        data = WorkforceIntelligenceService.calculateRetentionPriority(enriched); break
      default:
        return NextResponse.json({ success: false, error: `Modo inválido: ${mode}` }, { status: 400 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('[workforce/intelligence] Error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
