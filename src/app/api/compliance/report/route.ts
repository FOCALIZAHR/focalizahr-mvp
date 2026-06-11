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
import type { ISAResult } from '@/lib/services/compliance/ISAService';
import {
  computeCoverageAnalysis,
  computeOtroMundo,
} from '@/lib/services/compliance/CoverageAnalysisService';
import { computeDepartmentRiskScores } from '@/lib/services/compliance/DepartmentRiskScoreService';
import { detectSilencioConVozExterna } from '@/lib/services/compliance/detectSilencioConVozExterna';
import { SILENCIO_PESO_MIN } from '@/lib/services/compliance/ComplianceAlertService';
import { AmbienteRiskOrchestrator } from '@/lib/services/compliance/AmbienteRiskOrchestrator';
import { AmbienteSynthesisEngine } from '@/lib/services/compliance/AmbienteSynthesisEngine';

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
    isaComponents?: ISAResult['components'] | null;
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

    const [orgAnalysis, deptAnalyses, alerts, previousDeptISAs, totalDeptosUniverso, coverage] = await Promise.all([
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
      // P2 — Universo de análisis: todos los deptos del account con al menos una
      // persona activa. Filtra `Department.isActive` y `Employee.isActive`.
      // El threshold de privacidad (5) NO se aplica acá — el universo es más
      // amplio que lo que entra al análisis AS específico (un dept con 1-4
      // personas sigue contando para el universo, aunque no aparezca en AS).
      // Para AREA_MANAGER se filtra por la jerarquía visible (mismo set que
      // visibleDeptIds) para que el chip refleje su scope, no el global.
      prisma.department.count({
        where: {
          accountId: userContext.accountId,
          isActive: true,
          employees: { some: { isActive: true } },
          ...(visibleDeptIds ? { id: { in: Array.from(visibleDeptIds) } } : {}),
        },
      }),
      // Análisis de cobertura/participación — runtime (no persistido), input del
      // Acto 0 "La Cobertura" de la Cascada Ejecutiva.
      computeCoverageAnalysis(
        campaignId,
        userContext.accountId,
        visibleDeptIds ?? undefined,
      ),
    ]);

    // Score de riesgo por dept — runtime, cubre TODO el universo del coverage
    // (con_isa + sub_threshold + no_invitado). RBAC heredado: deptosCobertura
    // ya viene filtrado por visibleDeptIds desde computeCoverageAnalysis.
    //
    // Map dept→gerencia(level 2) para el rollup del Triage en la cascada.
    // Bloque verbatim de PerformanceRatingService.getCalibrationStatsByGerencia
    // (`src/lib/services/PerformanceRatingService.ts:1704-1741`). Privacy:
    // visibleDeptIds filtra el output — si la gerencia ancestro no está en el
    // scope del caller, el dept se renderiza como unidad propia.
    const allDeptsHierarchy = await prisma.department.findMany({
      where: { accountId: userContext.accountId, isActive: true },
      select: {
        id: true,
        displayName: true,
        level: true,
        parentId: true,
      },
    });
    const deptById = new Map(allDeptsHierarchy.map((d) => [d.id, d]));
    const gerenciaByDeptId = new Map<string, { id: string; name: string } | null>();
    for (const dept of allDeptsHierarchy) {
      if (dept.level === 2) {
        gerenciaByDeptId.set(dept.id, null); // es gerencia — no se agrupa bajo sí misma
      } else if (dept.level === 1) {
        gerenciaByDeptId.set(dept.id, null); // holding — no se agrupa
      } else {
        let current = dept;
        let maxIterations = 10;
        let resolved: { id: string; name: string } | null = null;
        while (current.parentId && current.level > 2 && maxIterations-- > 0) {
          const parent = deptById.get(current.parentId);
          if (!parent) break;
          if (parent.level === 2) {
            resolved = { id: parent.id, name: parent.displayName };
            break;
          }
          current = parent;
        }
        // Privacy: si la gerencia ancestro no está visible para el caller,
        // se renderiza como unidad propia (no se filtra el dept del set).
        if (resolved && visibleDeptIds && !visibleDeptIds.has(resolved.id)) {
          resolved = null;
        }
        gerenciaByDeptId.set(dept.id, resolved);
      }
    }

    const riskScores = await computeDepartmentRiskScores({
      accountId: userContext.accountId,
      coverageItems: coverage.deptosCobertura,
      gerenciaByDeptId,
    });

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
    // SEXTA + OTRO MUNDO (spec MODELO_SEXTA_OTRO_MUNDO_AMBIENTE_SANO).
    //
    // SEXTA: ya persistida en `data.alerts[]` por el orchestrator (Paso 4).
    //        Enriquecemos cada item con `analyzed` (JOIN con coverage) para
    //        que el render decida sub-sabor A/B sin re-llamar al motor.
    //
    // OTRO MUNDO: runtime. Patrón Beat 5 — AREA_MANAGER recibe `[]` (no se
    //             computa ni se expone). Para el resto, motor puro sobre la
    //             fuente paralela company-scope `computeOtroMundo`.
    // ═══════════════════════════════════════════════════════════════════
    const analyzedByDept = new Map(
      coverage.deptosCobertura.map((d) => [d.departmentId, d.analyzed]),
    );

    const otroMundo =
      userContext.role === 'AREA_MANAGER'
        ? []
        : detectSilencioConVozExterna(
            await computeOtroMundo(userContext.accountId, campaignId),
            'no_invitado',
            SILENCIO_PESO_MIN,
          );

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
    const executiveResponse = {
      success: true as const,
      type: 'executive' as const,
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
          ? { ...orgPayload.narratives, criticalByManagerNarrativa: undefined, cascada: undefined }
          : orgPayload.narratives,
      data: {
        orgSafetyScore: orgPayload.global.orgSafetyScore,
        orgISA: orgPayload.global.orgISA ?? null,
        isaComponents: orgPayload.global.isaComponents ?? null,
        totalTextResponses: orgPayload.global.totalTextResponses ?? null,
        totalRespondents: orgPayload.global.totalRespondents ?? null,
        totalDeptosUniverso,
        coverage,
        riskScores,
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
        // Sexta alerta — deptos en bucket sub_threshold con señal externa
        // (modelo post-Paso 4). `analyzed` enriquece desde coverage para que
        // el render decida sub-sabor A (skipped_privacy) / B (no_response)
        // sin re-llamar al motor en cliente.
        silencioVozExterna: filteredAlerts
          .filter((a) => a.alertType === 'silencio_con_voz_externa')
          .map((a) => ({
            departmentId: a.departmentId,
            departmentName: a.department?.displayName ?? null,
            narrativa: a.description,
            signalsCount: a.signalsCount ?? 0,
            analyzed: a.departmentId
              ? analyzedByDept.get(a.departmentId) ?? null
              : null,
          })),
        // OTRO MUNDO — `[]` para AREA_MANAGER (gate por rol, no se computa
        // siquiera). Para el resto, items del motor puro sobre la fuente
        // paralela company-scope. Copy final = paso c.
        otroMundo,
      },
      legalNotice:
        'Análisis de gestión preventiva — No constituye investigación formal.',
    };

    // ═══════════════════════════════════════════════════════════════════
    // Gate 3 — Wire AmbienteRiskOrchestrator + AmbienteSynthesisEngine.
    // El orchestrator wrappea el response actual y emite beat1Seed (capa
    // server-side única para Beat 1 y Beat 6). El engine emite synthesis
    // (Beat 6 motor diferencial — slots de copy vacíos hasta Gate 2.5).
    //
    // No reemplaza nada del response existente — solo agrega 2 keys
    // opcionales bajo `data` que Beat 6 (Gate 4) y la UI nueva consumen.
    // ═══════════════════════════════════════════════════════════════════
    const orchestratorPayload = AmbienteRiskOrchestrator.buildAmbientePayload(
      executiveResponse as Parameters<
        typeof AmbienteRiskOrchestrator.buildAmbientePayload
      >[0],
    );
    const synthesis = AmbienteSynthesisEngine.generate({
      beat1Seed: orchestratorPayload.beat1Seed,
      data: orchestratorPayload.data,
    });

    return NextResponse.json({
      ...executiveResponse,
      data: {
        ...executiveResponse.data,
        beat1Seed: orchestratorPayload.beat1Seed,
        synthesis,
      },
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
