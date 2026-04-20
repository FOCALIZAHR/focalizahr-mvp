// ════════════════════════════════════════════════════════════════════════════
// GET /api/efficiency/diagnostic — Hub de Eficiencia: 9 lentes en 3 familias
// src/app/api/efficiency/diagnostic/route.ts
// ════════════════════════════════════════════════════════════════════════════
// Combina:
//   - WorkforceIntelligenceService.buildEnrichedDataset (cross-data L1,L3)
//   - WorkforceIntelligenceService.getOrganizationDiagnostic (9 detecciones)
//   - AIExposureService.getOrganizationExposure (byCategory, byLevel)
//   - EfficiencyDataResolver.resolverTodosLentes (compila 9 lentes)
//   - EfficiencyNarrativeEngine.compilarActo (genera narrativa por lente)
//
// Patrón: extractUserContext → hasPermission('efficiency:view') → filtro
// jerárquico AREA_MANAGER (aunque por ahora su permiso no incluye AM).
// ════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import {
  extractUserContext,
  hasPermission,
  getChildDepartmentIds,
} from '@/lib/services/AuthorizationService'
import { WorkforceIntelligenceService } from '@/lib/services/WorkforceIntelligenceService'
import { AIExposureService } from '@/lib/services/AIExposureService'
import {
  resolverTodosLentes,
  type DiagnosticContext,
} from '@/lib/services/efficiency/EfficiencyDataResolver'
import {
  compilarActo,
  type LenteId,
} from '@/lib/services/efficiency/EfficiencyNarrativeEngine'

const GLOBAL_ROLES = [
  'FOCALIZAHR_ADMIN',
  'ACCOUNT_OWNER',
  'HR_ADMIN',
  'HR_MANAGER',
  'HR_OPERATOR',
  'CEO',
]

// ════════════════════════════════════════════════════════════════════════════
// FAMILIAS — orden y metadatos (color, etc. lo pone el frontend)
// ════════════════════════════════════════════════════════════════════════════

const FAMILIAS = [
  {
    id: 'capital_en_riesgo',
    titulo: 'Capital en riesgo',
    subtitulo: 'Cuánto capital vive en cargos que la IA ya resuelve',
    lentes: ['l1_inercia', 'l4_fantasma'] as LenteId[],
  },
  {
    id: 'ruta_ejecucion',
    titulo: 'Ruta de ejecución',
    subtitulo: 'A quién reentrenar, reubicar o acompañar',
    lentes: ['l2_zombie', 'l5_brecha', 'l7_fuga'] as LenteId[],
  },
  {
    id: 'costo_esperar',
    titulo: 'Costo de esperar',
    subtitulo: 'Cuánto se encarece la decisión cada mes que pasa',
    lentes: ['l3_adopcion', 'l9_pasivo'] as LenteId[],
  },
]

// ════════════════════════════════════════════════════════════════════════════
// GET
// ════════════════════════════════════════════════════════════════════════════

export async function GET(request: NextRequest) {
  try {
    // ── Auth + RBAC ────────────────────────────────────────────────
    const userContext = extractUserContext(request)
    if (!userContext.accountId) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }
    if (!hasPermission(userContext.role, 'efficiency:view')) {
      return NextResponse.json(
        { success: false, error: 'Sin permisos' },
        { status: 403 }
      )
    }

    // ── Filtro jerárquico ──────────────────────────────────────────
    const { searchParams } = new URL(request.url)
    const departmentId = searchParams.get('departmentId')

    let departmentIds: string[] | undefined
    if (
      !GLOBAL_ROLES.includes(userContext.role || '') &&
      userContext.departmentId
    ) {
      const childIds = await getChildDepartmentIds(userContext.departmentId)
      departmentIds = [userContext.departmentId, ...childIds]
      if (departmentId && !departmentIds.includes(departmentId)) {
        return NextResponse.json(
          { success: false, error: 'Fuera de scope' },
          { status: 403 }
        )
      }
    }
    if (departmentId) {
      departmentIds = departmentIds
        ? departmentIds.filter(id => id === departmentId)
        : [departmentId]
    }

    // ── Fetch base (3 llamadas en paralelo, patrón workforce/diagnostic) ─
    const [enriched, diagnostic, exposure] = await Promise.all([
      WorkforceIntelligenceService.buildEnrichedDataset(
        userContext.accountId,
        departmentIds
      ),
      WorkforceIntelligenceService.getOrganizationDiagnostic(
        userContext.accountId,
        departmentIds
      ),
      AIExposureService.getOrganizationExposure(
        userContext.accountId,
        departmentIds
      ),
    ])

    // ── Resolver 9 lentes ──────────────────────────────────────────
    const ctx: DiagnosticContext = {
      accountId: userContext.accountId,
      departmentIds,
      diagnostic,
      exposure,
      enriched,
    }
    const lentesMap = await resolverTodosLentes(ctx)

    // ── Compilar narrativa por lente ───────────────────────────────
    const lentes = Object.fromEntries(
      Object.entries(lentesMap).map(([id, out]) => {
        const narrativa = out.hayData
          ? compilarActo(id as LenteId, out.datos)
          : ''
        return [id, { ...out, narrativa }]
      })
    )

    // ── Response ───────────────────────────────────────────────────
    return NextResponse.json({
      success: true,
      data: {
        familias: FAMILIAS,
        lentes,
        meta: {
          totalEmployees: diagnostic.totalEmployees,
          enrichedCount: diagnostic.enrichedCount,
          confidence: diagnostic.confidence,
          avgExposure: exposure.avgExposure,
        },
      },
    })
  } catch (error: unknown) {
    console.error('[efficiency/diagnostic] Error:', error)
    const message = error instanceof Error ? error.message : 'Error interno'
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}

