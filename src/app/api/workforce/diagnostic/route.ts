// GET /api/workforce/diagnostic — Endpoint combinado para Cascada Workforce
// Merge de WorkforceIntelligenceService + AIExposureService en UNA sola llamada.
// La cascada consume este endpoint y tiene todo para renderizar los 7 actos.

import { NextRequest, NextResponse } from 'next/server'
import { extractUserContext, hasPermission, getChildDepartmentIds } from '@/lib/services/AuthorizationService'
import { WorkforceIntelligenceService } from '@/lib/services/WorkforceIntelligenceService'
import { AIExposureService } from '@/lib/services/AIExposureService'

const GLOBAL_ROLES = ['FOCALIZAHR_ADMIN', 'ACCOUNT_OWNER', 'HR_ADMIN', 'HR_MANAGER', 'HR_OPERATOR', 'CEO']

export async function GET(request: NextRequest) {
  try {
    // ── Auth + RBAC ──────────────────────────────────────────────────
    const userContext = extractUserContext(request)
    if (!userContext.accountId) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }
    if (!hasPermission(userContext.role, 'workforce-intelligence:view')) {
      return NextResponse.json({ success: false, error: 'Sin permisos' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const departmentId = searchParams.get('departmentId')

    // Hierarchical filter for AREA_MANAGER
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

    // ── Fetch data — 3 llamadas: enriched + diagnostic + exposure ────
    // buildEnrichedDataset para computar campos extra de la cascada
    // getOrganizationDiagnostic para las 9 detecciones (rebuild enriched internamente — aceptable v1)
    // getOrganizationExposure para byCategory, byLevel, topExposedOccupations

    const [enriched, diagnostic, exposure] = await Promise.all([
      WorkforceIntelligenceService.buildEnrichedDataset(userContext.accountId, departmentIds),
      WorkforceIntelligenceService.getOrganizationDiagnostic(userContext.accountId, departmentIds),
      AIExposureService.getOrganizationExposure(userContext.accountId, departmentIds),
    ])

    // ── Campos extra para la cascada ─────────────────────────────────
    const withExposure = enriched.filter(e => e.socCode !== null)
    const headcountExpuestos = withExposure.length

    // Promedios org de automation/augmentation desde enriched dataset
    let orgAutomationShare = 0
    let orgAugmentationShare = 0
    if (withExposure.length > 0) {
      const totalAuto = withExposure.reduce((sum, e) => sum + e.automationShare, 0)
      const totalAug = withExposure.reduce((sum, e) => sum + e.augmentationShare, 0)
      orgAutomationShare = totalAuto / withExposure.length
      orgAugmentationShare = totalAug / withExposure.length
    }

    // Zona crítica: >70% exposición + baja capacidad de adaptación
    const zonaCriticaCount = enriched.filter(e =>
      e.observedExposure > 0.7 && (e.potentialAbility ?? 0) < 40
    ).length

    // ── Response combinado ───────────────────────────────────────────
    return NextResponse.json({
      success: true,
      data: {
        ...diagnostic,
        exposure,
        orgAutomationShare,
        orgAugmentationShare,
        zonaCriticaCount,
        headcountExpuestos,
      },
    })
  } catch (error: unknown) {
    console.error('[workforce/diagnostic] Error:', error)
    const message = error instanceof Error ? error.message : 'Error interno'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
