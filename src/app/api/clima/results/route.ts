// src/app/api/clima/results/route.ts
// EX Clima — Resultados de una campaña de clima para el Cinema Mode (Gate 4).
//
// Arquitectura: Gate 2/3 persistieron TODO el diagnóstico en
// DepartmentClimaInsight al cerrar la campaña. Este endpoint solo lee lo
// persistido y deriva la vista de compañía read-time con funciones puras de
// PulseEngine. CERO cómputo pesado, número fijo de queries batched (una
// findMany para todos los deptos visibles), sin loop per-depto, sin N+1.
//
// RBAC: clima:view. Filtrado jerárquico AREA_MANAGER (patrón compliance/report):
// ve solo su departamento + hijos. La vista de compañía (orgFavorability,
// companyPulse) se deriva SOLO sobre su scope visible.

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  extractUserContext,
  hasPermission,
  getChildDepartmentIds,
} from '@/lib/services/AuthorizationService';
import {
  calcOrgFavorability,
  calcOrgMomentum,
  aggregateCompanyPulse,
  rankMomentumMovers,
  type CompanyPulseRow,
  type ClimaCorrelationFlags,
  type DriverImpact,
} from '@/lib/services/clima/PulseEngine';
import { CLIMA_CAMPAIGN_SLUGS } from '@/lib/services/clima/ClimaAggregationService';
import { CLIMA_MIN_RESPONDENTS } from '@/lib/services/clima/climaThresholds';
import {
  rollupClimaHierarchy,
  type ClimaHierarchyNodes,
} from '@/lib/utils/rollupClimaGerencias';
import type {
  ClimaDepartmentInsight,
  ClimaDriverScore,
  ClimaAcotadoGroupScore,
  ClimaProductType,
  ClimaResultsResponse,
  ClimaCrossSignal,
  ClimaExitTopFactor,
  ClimaOnboardingAbandon,
} from '@/types/clima';

/** Trimestre del endDate → "YYYY-Qn" (misma convención que Gate 2). */
function periodFromDate(date: Date): string {
  const q = Math.floor(date.getUTCMonth() / 3) + 1;
  return `${date.getUTCFullYear()}-Q${q}`;
}

// ════════════════════════════════════════════════════════════════════════════
// Cross-signal cross-módulo (Gate 4.5a) — helpers. Ampliación DELIBERADA vs
// semilla §6: se cablean exit + onboarding (señales CONFIRMADAS contra schema).
// El sesgo del evaluador (7.1/7.2) sigue diferido. Guard n≥5 del sistema.
// ════════════════════════════════════════════════════════════════════════════

/** Umbral n≥5 (mismo que privacidad del sistema). Exit → surveysCompleted;
 *  onboarding → totalJourneys. Fuente única en climaThresholds. */
const MIN_CROSS_N = CLIMA_MIN_RESPONDENTS;

/** El factor top de salida nombra jefe/manager (dispara el cruce §7.3). */
const MANAGER_FACTOR_RE = /jefe|jefatura|manager|l[ií]der|supervis/i;

/** Top factor de salida (mayor menciones) de un DepartmentExitInsight, si n≥5. */
function buildExitTopFactor(
  row: { surveysCompleted: number; topExitFactors: unknown } | undefined,
): ClimaExitTopFactor | null {
  if (!row || row.surveysCompleted < MIN_CROSS_N) return null;
  if (!Array.isArray(row.topExitFactors) || row.topExitFactors.length === 0) return null;
  const factors = row.topExitFactors as Array<Record<string, unknown>>;
  const top = [...factors].sort(
    (a, b) => Number(b?.mentions ?? 0) - Number(a?.mentions ?? 0),
  )[0];
  if (!top || typeof top.factor !== 'string') return null;
  return {
    factor: top.factor,
    mentions: Number(top.mentions ?? 0),
    mentionRate: Number(top.mentionRate ?? 0),
    mentionsManager: MANAGER_FACTOR_RE.test(top.factor),
  };
}

/** Abandono temprano de onboarding, si n≥5 Y la tasa supera la del resto de la
 *  organización ("en una proporción mayor que el resto" — §7.4). */
function buildOnboardingAbandon(
  row: { totalJourneys: number; abandonedJourneys: number } | undefined,
  orgAbandonRate: number,
): ClimaOnboardingAbandon | null {
  if (!row || row.totalJourneys < MIN_CROSS_N) return null;
  const rate = row.abandonedJourneys / row.totalJourneys;
  if (rate <= orgAbandonRate) return null;
  return {
    abandonRate: rate,
    abandonedJourneys: row.abandonedJourneys,
    totalJourneys: row.totalJourneys,
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
    if (!hasPermission(userContext.role, 'clima:view')) {
      return NextResponse.json(
        { success: false, error: 'Sin permisos' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('campaignId');
    if (!campaignId) {
      return NextResponse.json(
        { success: false, error: 'campaignId requerido' },
        { status: 400 }
      );
    }

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

    // Filtrado jerárquico (patrón compliance/report).
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
    const scope = visibleDeptIds ? 'area' : 'organization';

    // Una sola query batched: todos los insights de la campaña. Filtrado
    // jerárquico en memoria sobre lo leído (sin loop per-depto).
    const insightRows = await prisma.departmentClimaInsight.findMany({
      where: { accountId: userContext.accountId, campaignId },
      include: { department: { select: { id: true, displayName: true } } },
    });

    const visibleInsights = insightRows.filter((r) =>
      visibleDeptIds ? visibleDeptIds.has(r.departmentId) : true
    );

    // Gold cache de los deptos visibles.
    const goldCacheRows = visibleInsights.length
      ? await prisma.department.findMany({
          where: {
            accountId: userContext.accountId,
            id: { in: visibleInsights.map((r) => r.departmentId) },
          },
          select: {
            id: true,
            accumulatedClimaFavorability: true,
            accumulatedClimaMean: true,
            accumulatedClimaRiskZone: true,
            accumulatedClimaLastUpdated: true,
          },
        })
      : [];

    // ── Cross-signal cross-módulo (Gate 4.5a): exit + onboarding por depto ──
    // 2 findMany batched, período-alineado (latest periodEnd ≤ campaign.endDate),
    // scope = mismos deptos visibles. n≥5 aplicado en los helpers.
    const crossByDept = new Map<string, ClimaCrossSignal>();
    const visibleDeptIdList = visibleInsights.map((r) => r.departmentId);
    if (visibleDeptIdList.length) {
      const [exitRows, onbRows] = await Promise.all([
        prisma.departmentExitInsight.findMany({
          where: {
            accountId: userContext.accountId,
            departmentId: { in: visibleDeptIdList },
            periodEnd: { lte: campaign.endDate },
          },
          orderBy: { periodEnd: 'desc' },
          select: { departmentId: true, surveysCompleted: true, topExitFactors: true },
        }),
        prisma.departmentOnboardingInsight.findMany({
          where: {
            accountId: userContext.accountId,
            departmentId: { in: visibleDeptIdList },
            periodEnd: { lte: campaign.endDate },
          },
          orderBy: { periodEnd: 'desc' },
          select: { departmentId: true, totalJourneys: true, abandonedJourneys: true },
        }),
      ]);

      // Latest-per-dept (filas ya ordenadas periodEnd desc → la primera gana).
      const latestExit = new Map<string, (typeof exitRows)[number]>();
      for (const r of exitRows) if (!latestExit.has(r.departmentId)) latestExit.set(r.departmentId, r);
      const latestOnb = new Map<string, (typeof onbRows)[number]>();
      for (const r of onbRows) if (!latestOnb.has(r.departmentId)) latestOnb.set(r.departmentId, r);

      // Tasa de abandono de la organización (deptos con n≥5) para decidir "elevado".
      let orgAband = 0;
      let orgTotal = 0;
      for (const r of latestOnb.values()) {
        if (r.totalJourneys >= MIN_CROSS_N) {
          orgAband += r.abandonedJourneys;
          orgTotal += r.totalJourneys;
        }
      }
      const orgAbandonRate = orgTotal > 0 ? orgAband / orgTotal : 0;

      for (const deptId of visibleDeptIdList) {
        const exitTopFactor = buildExitTopFactor(latestExit.get(deptId));
        const onboardingAbandon = buildOnboardingAbandon(latestOnb.get(deptId), orgAbandonRate);
        if (exitTopFactor || onboardingAbandon) {
          crossByDept.set(deptId, { exitTopFactor, onboardingAbandon });
        }
      }
    }

    // ── Mapeo a shape renderable (Json → tipado) ──
    const departments: ClimaDepartmentInsight[] = visibleInsights.map((r) => ({
      departmentId: r.departmentId,
      departmentName: r.department?.displayName ?? 'Departamento',
      engagementFavorability: r.engagementFavorability,
      engagementMean: r.engagementMean,
      driverScores: (r.driverScores as unknown as Record<string, ClimaDriverScore> | null) ?? null,
      customDriverScores:
        (r.customDriverScores as unknown as Record<string, ClimaDriverScore> | null) ?? null,
      driverAnalysis: (r.driverAnalysis as unknown as DriverImpact[] | null) ?? null,
      topFocusArea: r.topFocusArea,
      topStrength: r.topStrength,
      riskZone: (r.riskZone as ClimaDepartmentInsight['riskZone']) ?? null,
      momentum: r.momentum,
      correlationFlags:
        (r.correlationFlags as unknown as ClimaCorrelationFlags | null) ?? null,
      npsScore: r.npsScore,
      promotersPct: r.promotersPct,
      detractorsPct: r.detractorsPct,
      acotadoGroupScores:
        (r.acotadoGroupScores as unknown as Record<string, ClimaAcotadoGroupScore> | null) ?? null,
      totalInvited: r.totalInvited,
      totalResponded: r.totalResponded,
      participationRate: r.participationRate,
      turnoverRateAtMeasurement: r.turnoverRateAtMeasurement,
      absenteeismRateAtMeasurement: r.absenteeismRateAtMeasurement,
      overtimeRateAtMeasurement: r.overtimeRateAtMeasurement,
      incidentCountAtMeasurement: r.incidentCountAtMeasurement,
      crossSignals: crossByDept.get(r.departmentId) ?? null,
    }));

    // ── Rollup (A2): agregación RECURSIVA sobre la jerarquía (N≤4) ──
    // Se cargan los nodos del scope para resolver la ascendencia por parentId:
    // AREA_MANAGER solo su subárbol visible (no expone ancestros por encima de su
    // scope); el resto, toda la cuenta (bounded). rollupClimaHierarchy poda a las
    // ramas con hojas-insight y agrega nivel por nivel.
    let gerencias = departments;
    if (visibleDeptIdList.length) {
      const nodeRows = await prisma.department.findMany({
        where: {
          accountId: userContext.accountId,
          isActive: true,
          ...(visibleDeptIds ? { id: { in: [...visibleDeptIds] } } : {}),
        },
        select: { id: true, parentId: true, displayName: true },
      });
      const nodes: ClimaHierarchyNodes = new Map(
        nodeRows.map((n) => [n.id, { id: n.id, parentId: n.parentId, name: n.displayName }]),
      );
      gerencias = rollupClimaHierarchy(departments, nodes);
    }

    // ── Derivación read-time de compañía (scope visible) ──
    const org = calcOrgFavorability(
      departments.map((d) => ({
        engagementFavorability: d.engagementFavorability,
        totalInvited: d.totalInvited,
      }))
    );

    const companyPulseRows: CompanyPulseRow[] = departments.map((d) => ({
      departmentId: d.departmentId,
      riskZone: d.riskZone,
      correlationFlags: d.correlationFlags,
    }));
    const companyPulse = aggregateCompanyPulse(companyPulseRows);

    const momentumMovers = rankMomentumMovers(
      departments.map((d) => ({
        departmentId: d.departmentId,
        departmentName: d.departmentName,
        momentum: d.momentum,
        engagementFavorability: d.engagementFavorability,
      }))
    );

    // ── Momentum organizacional: delta vs la campaña clima anterior ──
    // SAME-TIPO (mismo slug que la actual): unificado con el momentum per-depto
    // ya sellado (Gate 2/3), que compara contra el insight anterior del mismo
    // productType. Con cross-tipo el gauge y el Rail medirían contra bases
    // distintas y un CEO no podría cuadrarlos. Si no hay anterior same-tipo →
    // orgMomentum null → el footer cae a gap vs objetivo (75).
    // Patrón previousDeptISAs de compliance/report (endDate lt + COMPLETED).
    // RBAC: la orgFavorability anterior se recalcula sobre los MISMOS deptos
    // visibles (visibleDeptIds), nunca contra toda la compañía.
    const currentSlug = campaign.campaignType?.slug ?? null;
    const prevCampaign = currentSlug
      ? await prisma.campaign.findFirst({
          where: {
            accountId: userContext.accountId,
            id: { not: campaignId },
            campaignType: { slug: currentSlug },
            climaAggregationStatus: 'COMPLETED',
            endDate: { lt: campaign.endDate },
          },
          orderBy: [{ endDate: 'desc' }, { createdAt: 'desc' }],
          select: { id: true },
        })
      : null;
    let orgMomentum: number | null = null;
    if (prevCampaign) {
      const prevInsights = await prisma.departmentClimaInsight.findMany({
        where: { accountId: userContext.accountId, campaignId: prevCampaign.id },
        select: { departmentId: true, engagementFavorability: true, totalInvited: true },
      });
      const prevVisible = prevInsights.filter((r) =>
        visibleDeptIds ? visibleDeptIds.has(r.departmentId) : true
      );
      const prevOrg = calcOrgFavorability(
        prevVisible.map((r) => ({
          engagementFavorability: r.engagementFavorability,
          totalInvited: r.totalInvited,
        }))
      );
      orgMomentum = calcOrgMomentum(org.favorability, prevOrg.favorability);
    }

    const slug = campaign.campaignType?.slug ?? null;
    const productType = (CLIMA_CAMPAIGN_SLUGS as unknown as string[]).includes(slug ?? '')
      ? (slug as ClimaProductType)
      : null;

    const response: ClimaResultsResponse = {
      success: true,
      scope,
      campaign: {
        id: campaign.id,
        name: campaign.name,
        productType,
        startDate: campaign.startDate.toISOString(),
        endDate: campaign.endDate.toISOString(),
        completedAt: campaign.completedAt ? campaign.completedAt.toISOString() : null,
        period: periodFromDate(campaign.endDate),
      },
      company: { name: campaign.account.companyName, country: campaign.account.country },
      departments,
      gerencias,
      companyPulse,
      orgFavorability: org.favorability,
      orgRiskZone: org.riskZone,
      orgMomentum,
      businessCaseTotals: companyPulse.businessCaseTotals,
      momentumMovers,
      goldCacheByDept: goldCacheRows.map((g) => ({
        departmentId: g.id,
        accumulatedClimaFavorability: g.accumulatedClimaFavorability,
        accumulatedClimaMean: g.accumulatedClimaMean,
        accumulatedClimaRiskZone: g.accumulatedClimaRiskZone,
        accumulatedClimaLastUpdated: g.accumulatedClimaLastUpdated
          ? g.accumulatedClimaLastUpdated.toISOString()
          : null,
      })),
    };

    return NextResponse.json(response);
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error desconocido';
    console.error('[clima/results] GET:', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
