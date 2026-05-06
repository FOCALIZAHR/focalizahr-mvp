// src/app/api/compliance/report/route.ts
// Ambiente Sano - Reporte consolidado. Arquitectura:
//
// El Orchestrator persiste todo lo caro al cerrar los jobs:
//   - DEPARTMENT.resultPayload = { patrones, safetyDetail, convergencia }
//   - ORG.resultPayload        = { meta, global, narratives }
//
// Este endpoint solo hace N+1 SELECTs y ensambla. CERO cálculos en el GET.
//
// Query params:
//   campaignId (requerido)
//   type = 'executive' | 'semestral' (default 'executive')

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  extractUserContext,
  hasPermission,
  getChildDepartmentIds,
} from '@/lib/services/AuthorizationService';
import type { DepartmentSafetyScore, SafetyScoreSkip } from '@/lib/services/SafetyScoreService';
import type { DepartmentConvergencia } from '@/lib/services/compliance/ConvergenciaEngine';
import type {
  ReportNarratives,
  MetaAnalysisOutput,
  PatronAnalysisOutput,
  ComplianceSource,
  ComplianceReportDepartmentPatrones,
} from '@/types/compliance';
import { PATRON_LABELS } from '@/lib/services/compliance/ComplianceNarrativeEngine';

type ReportType = 'executive' | 'semestral';

interface DepartmentPayload {
  patrones: PatronAnalysisOutput;
  safetyDetail: DepartmentSafetyScore;
  convergencia: DepartmentConvergencia;
  isa?: number; // ISA 0-100 del depto (opcional para compat con campañas viejas)
}

interface OrgPayload {
  meta: MetaAnalysisOutput;
  global: {
    orgSafetyScore: number | null;
    orgISA?: number | null;
    skippedByPrivacy: SafetyScoreSkip[];
    activeSourcesGlobal: ComplianceSource[];
    criticalByManager: Array<{ managerId: string; departmentIds: string[] }>;
    previousOrgScore: number | null;
    previousCampaignLabel: string | null;
    /** Sumas org-level agregadas en `processOrgMetaIfReady()`. Opcionales para
     *  payloads persistidos antes del deploy — frontend lee `?? null`. */
    totalTextResponses?: number;
    totalRespondents?: number;
  };
  narratives: ReportNarratives;
}

// ════════════════════════════════════════════════════════════════════════════
// Helper: slice de PatronAnalysisOutput por depto para exposición al frontend
// ════════════════════════════════════════════════════════════════════════════
// Reduce el payload LLM bruto a la forma renderable. Devuelve `undefined` si
// el depto no tiene análisis (campañas legacy) — el frontend cae al agregado
// cross-depto en `narratives.artefacto2_patrones[]`.
//
// Casos:
//   - patrones=[] + senal_dominante='ambiente_sano' → patron_dominante=null
//   - patrones=[] + confianza='insuficiente_data'   → patron_dominante=null
//   - patrones[0] poblado                            → patron_dominante={…}
//
// Hereda RBAC del caller — solo se llama sobre deptos ya filtrados por
// visibleDeptIds (línea ~173). Cero nueva superficie de ataque.

function buildDeptPatronesSlice(
  payload: PatronAnalysisOutput | undefined,
): ComplianceReportDepartmentPatrones | undefined {
  if (!payload) return undefined;
  const dominante = payload.patrones[0] ?? null;
  return {
    senal_dominante: payload.senal_dominante,
    confianza_analisis: payload.confianza_analisis,
    patron_dominante: dominante
      ? {
          nombre: dominante.nombre,
          nombreLegible: PATRON_LABELS[dominante.nombre],
          intensidad: dominante.intensidad,
          origen_percibido: dominante.origen_percibido,
          fragmentos: dominante.fragmentos.slice(0, 3),
        }
      : null,
  };
}

export async function GET(request: NextRequest) {
  try {
    const userContext = extractUserContext(request);
    if (!userContext.accountId) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }
    if (!hasPermission(userContext.role, 'compliance:view')) {
      return NextResponse.json(
        { success: false, error: 'Sin permisos' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('campaignId');
    const rawType = (searchParams.get('type') ?? 'executive') as ReportType;
    const type: ReportType = rawType === 'semestral' ? 'semestral' : 'executive';

    if (!campaignId) {
      return NextResponse.json(
        { success: false, error: 'campaignId requerido' },
        { status: 400 }
      );
    }

    // ═══════════════════════════════════════════════════════════════════
    // Queries (N+1 pattern: 4 queries principales independientes).
    // ═══════════════════════════════════════════════════════════════════
    const campaign = await prisma.campaign.findFirst({
      where: { id: campaignId, accountId: userContext.accountId },
      include: {
        account: { select: { companyName: true, country: true } },
        campaignType: { select: { slug: true } },
      },
    });
    if (!campaign) {
      return NextResponse.json(
        { success: false, error: 'Campaña no encontrada' },
        { status: 404 }
      );
    }

    let visibleDeptIds: Set<string> | null = null;
    if (userContext.role === 'AREA_MANAGER') {
      if (!userContext.departmentId) {
        return NextResponse.json(
          { success: false, error: 'AREA_MANAGER sin departamento asignado' },
          { status: 403 }
        );
      }
      const children = await getChildDepartmentIds(userContext.departmentId);
      visibleDeptIds = new Set([userContext.departmentId, ...children]);
    }

    const [orgAnalysis, deptAnalyses, alerts, previousDeptISAs] = await Promise.all([
      prisma.complianceAnalysis.findFirst({
        where: { campaignId, scope: 'ORG', status: 'COMPLETED' },
      }),
      prisma.complianceAnalysis.findMany({
        where: { campaignId, scope: 'DEPARTMENT', status: 'COMPLETED' },
        include: { department: { select: { id: true, displayName: true } } },
      }),
      prisma.complianceAlert.findMany({
        where: { campaignId },
        orderBy: [{ severity: 'asc' }, { createdAt: 'desc' }],
        include: { department: { select: { id: true, displayName: true } } },
      }),
      // ISA por depto en la campaña anterior cerrada del mismo account — para
      // calcular deltaVsAnterior por depto en Track A.
      prisma.complianceAnalysis.findMany({
        where: {
          accountId: userContext.accountId,
          scope: 'DEPARTMENT',
          status: 'COMPLETED',
          campaign: {
            status: 'completed',
            endDate: { lt: campaign.endDate },
            campaignType: { slug: 'pulso-ambientes-sanos' },
          },
        },
        select: { departmentId: true, isaScore: true, campaign: { select: { endDate: true } } },
        orderBy: { campaign: { endDate: 'desc' } },
      }),
    ]);

    // De los posibles múltiples rows (historial), tomar el más reciente por depto.
    const previousIsaByDept = new Map<string, number>();
    for (const row of previousDeptISAs) {
      if (!row.departmentId || row.isaScore === null) continue;
      if (!previousIsaByDept.has(row.departmentId)) {
        previousIsaByDept.set(row.departmentId, row.isaScore);
      }
    }

    const orgPayload = orgAnalysis?.resultPayload as OrgPayload | null;

    if (!orgPayload) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Análisis no disponible. El meta-análisis de la campaña aún no ha completado.',
        },
        { status: 404 }
      );
    }

    // ═══════════════════════════════════════════════════════════════════
    // Filtrado jerárquico (solo lectura de datos ya computados).
    // ═══════════════════════════════════════════════════════════════════
    const deptPayloads: Array<
      DepartmentPayload & { departmentId: string; teatroCumplimiento: boolean | null }
    > = deptAnalyses
      .filter((a) => a.departmentId !== null && a.resultPayload !== null)
      .map((a) => {
        const p = a.resultPayload as unknown as DepartmentPayload;
        // teatroCumplimiento vive como columna top-level en ComplianceAnalysis
        // (NO dentro del JSON resultPayload). Se propaga desde la fila Prisma.
        return {
          ...p,
          departmentId: a.departmentId as string,
          teatroCumplimiento: a.teatroCumplimiento,
        };
      })
      .filter((p) =>
        visibleDeptIds ? visibleDeptIds.has(p.departmentId) : true
      );

    const filteredAlerts = alerts.filter((a) => {
      if (!a.departmentId) return userContext.role !== 'AREA_MANAGER';
      return visibleDeptIds ? visibleDeptIds.has(a.departmentId) : true;
    });

    const filteredSkipped = visibleDeptIds
      ? orgPayload.global.skippedByPrivacy.filter((s) =>
          visibleDeptIds!.has(s.departmentId)
        )
      : orgPayload.global.skippedByPrivacy;

    // ═══════════════════════════════════════════════════════════════════
    // Shape de respuesta.
    // ═══════════════════════════════════════════════════════════════════

    if (type === 'semestral') {
      return NextResponse.json({
        success: true,
        type: 'semestral',
        generatedAt: new Date().toISOString(),
        company: { name: campaign.account.companyName, country: campaign.account.country },
        period: {
          startDate: campaign.startDate,
          endDate: campaign.endDate,
          completedAt: campaign.completedAt,
        },
        aggregates: {
          totalInvited: campaign.totalInvited,
          totalResponded: campaign.totalResponded,
          participationRate:
            campaign.totalInvited > 0
              ? (campaign.totalResponded / campaign.totalInvited) * 100
              : 0,
          orgSafetyScore: orgPayload.global.orgSafetyScore,
          departmentsAnalyzed: deptPayloads.length,
          departmentsSkipped: filteredSkipped.length,
          alertsGenerated: filteredAlerts.length,
        },
        legalNotice:
          'Análisis de gestión preventiva — No constituye investigación formal.',
      });
    }

    // Executive
    return NextResponse.json({
      success: true,
      type: 'executive',
      generatedAt: new Date().toISOString(),
      campaign: {
        id: campaign.id,
        name: campaign.name,
        startDate: campaign.startDate,
        endDate: campaign.endDate,
        completedAt: campaign.completedAt,
      },
      company: { name: campaign.account.companyName, country: campaign.account.country },
      // AREA_MANAGER: suprimir criticalByManagerNarrativa para coherencia con
      // criticalByManager filtrado a [] abajo. Sin esto, el texto seguiría
      // describiendo la agrupación cross-dept aunque la data esté vacía.
      narratives:
        userContext.role === 'AREA_MANAGER'
          ? { ...orgPayload.narratives, criticalByManagerNarrativa: undefined }
          : orgPayload.narratives,
      data: {
        orgSafetyScore: orgPayload.global.orgSafetyScore,
        orgISA: orgPayload.global.orgISA ?? null,
        totalTextResponses: orgPayload.global.totalTextResponses ?? null,
        totalRespondents: orgPayload.global.totalRespondents ?? null,
        departments: deptPayloads.map((p) => {
          const isa = p.isa ?? null;
          const prevIsa = previousIsaByDept.get(p.safetyDetail.departmentId) ?? null;
          const deltaVsAnterior = isa !== null && prevIsa !== null ? isa - prevIsa : null;
          return {
            ...p.safetyDetail,
            isaScore: isa,
            deltaVsAnterior,
            patrones: buildDeptPatronesSlice(p.patrones),
            teatroCumplimiento: p.teatroCumplimiento ?? undefined,
          };
        }),
        skippedByPrivacy: filteredSkipped,
        metaAnalysis: orgPayload.meta,
        convergencia: {
          activeSources: orgPayload.global.activeSourcesGlobal,
          departments: deptPayloads.map((p) => p.convergencia),
          criticalByManager:
            userContext.role === 'AREA_MANAGER'
              ? []
              : orgPayload.global.criticalByManager,
        },
        alerts: filteredAlerts.map((a) => ({
          id: a.id,
          alertType: a.alertType,
          severity: a.severity,
          status: a.status,
          title: a.title,
          description: a.description,
          departmentId: a.departmentId,
          departmentName: a.department?.displayName ?? null,
          dueDate: a.dueDate,
          slaStatus: a.slaStatus,
          createdAt: a.createdAt,
        })),
      },
      legalNotice:
        'Análisis de gestión preventiva — No constituye investigación formal.',
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error desconocido';
    console.error('[compliance/report] GET:', msg);
    if (msg === 'Campaña no encontrada') {
      return NextResponse.json({ success: false, error: msg }, { status: 404 });
    }
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
