// src/lib/services/vitals/VitalSignsService.ts
// ════════════════════════════════════════════════════════════════════════════
// Servicio de la portada "Signos Vitales" (SPEC_HOME_SIGNOS_VITALES_v1.1).
//
// SOLO LECTURA. Este archivo no contiene ni un create/update/upsert/delete.
// accountId va en TODAS las queries (multi-tenant, Regla Enterprise #2).
//
// Fuente de clima — REGLA SELLADA (Victor, 2026-07-20), dos capas:
//   1. VEREDICTO: última fila experiencia-full con isFollowUp=false. Única
//      fuente de la zona; se lee del campo riskZone persistido, jamás se
//      recalcula.
//   2. SEGUIMIENTO: fila isFollowUp=true posterior → señal aparte. No pisa la
//      zona ni la recalcula.
//   Pulso Express queda FUERA: es señal direccional, nunca veredicto. La
//   exclusión vive en el WHERE de la query (esas filas ni se leen).
//
// Department.accumulatedClima* NO se usa: es un promedio rolling 12m construido
// sobre filas pulso-express (ClimaAggregationService.ts:730-738), o sea una zona
// derivada de señal direccional. Usarlo violaría la regla de arriba.
// ════════════════════════════════════════════════════════════════════════════

import { prisma } from '@/lib/prisma';
import type { RiskZone } from '@/lib/services/clima/climaThresholds';
import type { ClimaDriverScore } from '@/types/clima';
import {
  MS_PER_AVERAGE_MONTH,
  VITALS_COMPLIANCE_SCOPE_DEPARTMENT,
  VITALS_COMPLIANCE_STATUS,
  VITALS_VERDICT_PRODUCT_TYPE,
  ZONE_SEVERITY,
} from '@/lib/constants/vitalsThresholds';
import type {
  ClimaInsightRow,
  ClimaLayers,
  DepartmentVitalSigns,
  VitalsCorrelationFlags,
  VitalSignsHeadline,
  VitalSignsSummary,
  VitalsScope,
} from './types';

// ────────────────────────────────────────────────────────────────────────────
// Helpers puros
// ────────────────────────────────────────────────────────────────────────────

const VALID_ZONES: readonly string[] = ['verde', 'amarilla', 'naranja', 'roja'];

/** Normaliza el riskZone persistido (String en BD) al union type. */
function toRiskZone(raw: string | null): RiskZone | null {
  if (raw === null) return null;
  return VALID_ZONES.includes(raw) ? (raw as RiskZone) : null;
}

function monthsBetween(from: Date, to: Date): number {
  return Math.max(0, Math.round((to.getTime() - from.getTime()) / MS_PER_AVERAGE_MONTH));
}

function asDriverScores(raw: unknown): Record<string, ClimaDriverScore> | null {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) return null;
  return raw as Record<string, ClimaDriverScore>;
}

/**
 * FUNCIÓN PURA — selección de las dos capas de clima de UN departamento.
 * Exportada para el test unitario: no toca BD ni reloj global (recibe `now`).
 *
 * Defiende la regla aunque le pasen una lista mixta: descarta todo lo que no
 * sea VITALS_VERDICT_PRODUCT_TYPE antes de mirar nada.
 */
export function selectClimaLayers(rows: ClimaInsightRow[], now: Date): ClimaLayers {
  const fullOnly = rows.filter((r) => r.productType === VITALS_VERDICT_PRODUCT_TYPE);

  const byPeriodEndDesc = (a: ClimaInsightRow, b: ClimaInsightRow) =>
    b.periodEnd.getTime() - a.periodEnd.getTime();

  const verdictRow = fullOnly.filter((r) => !r.isFollowUp).sort(byPeriodEndDesc)[0] ?? null;
  const followUpRows = fullOnly.filter((r) => r.isFollowUp).sort(byPeriodEndDesc);

  // Sin medición completa: NO se inventa zona desde un seguimiento.
  if (!verdictRow) {
    const orphanFollowUp = followUpRows[0] ?? null;
    if (!orphanFollowUp) {
      return { status: 'sin_veredicto', verdict: null, followUp: null };
    }
    return {
      status: 'solo_seguimiento',
      verdict: null,
      followUp: {
        measuredAt: orphanFollowUp.periodEnd.toISOString(),
        period: orphanFollowUp.period,
        dimension: null,
        delta: null,
        deltaUnavailableReason: 'sin_dimension_intervenida',
      },
    };
  }

  const verdict: ClimaLayers['verdict'] = {
    favorability: verdictRow.engagementFavorability,
    riskZone: toRiskZone(verdictRow.riskZone),
    momentum: verdictRow.momentum,
    correlationFlags: (verdictRow.correlationFlags as VitalsCorrelationFlags | null) ?? null,
    topFocusArea: verdictRow.topFocusArea,
    period: verdictRow.period,
    measuredAt: verdictRow.periodEnd.toISOString(),
    monthsAgo: monthsBetween(verdictRow.periodEnd, now),
    respondents: verdictRow.totalResponded,
    productType: VITALS_VERDICT_PRODUCT_TYPE,
  };

  // Seguimiento sólo si es POSTERIOR al veredicto.
  const laterFollowUp =
    followUpRows.find((r) => r.periodEnd.getTime() > verdictRow.periodEnd.getTime()) ?? null;

  if (!laterFollowUp) {
    return { status: 'con_veredicto', verdict, followUp: null };
  }

  // Delta sobre la dimensión intervenida (topFocusArea del veredicto).
  const dimension = verdictRow.topFocusArea;
  let delta: number | null = null;
  let reason: 'sin_dimension_intervenida' | 'dimension_no_medida' | null = null;

  if (!dimension) {
    reason = 'sin_dimension_intervenida';
  } else {
    const before = asDriverScores(verdictRow.driverScores)?.[dimension]?.fav ?? null;
    const after = asDriverScores(laterFollowUp.driverScores)?.[dimension]?.fav ?? null;
    if (before === null || after === null) {
      reason = 'dimension_no_medida';
    } else {
      delta = Math.round((after - before) * 10) / 10;
    }
  }

  return {
    status: 'con_veredicto',
    verdict,
    followUp: {
      measuredAt: laterFollowUp.periodEnd.toISOString(),
      period: laterFollowUp.period,
      dimension,
      delta,
      deltaUnavailableReason: reason,
    },
  };
}

/**
 * FUNCIÓN PURA — hallazgo del día.
 * v1: SOLO clima. Mayor severidad de zona; desempate por menor favorabilidad.
 * No mezcla ISA/EXO/EIS (sería el ISD diferido a v2 por la spec §3).
 */
export function selectHeadline(departments: DepartmentVitalSigns[]): VitalSignsHeadline | null {
  const candidates = departments
    .map((d) => ({ dept: d, zone: d.clima.verdict?.riskZone ?? null }))
    .filter((c): c is { dept: DepartmentVitalSigns; zone: RiskZone } => c.zone !== null);

  if (candidates.length === 0) return null;

  candidates.sort((a, b) => {
    const bySeverity = ZONE_SEVERITY[b.zone] - ZONE_SEVERITY[a.zone];
    if (bySeverity !== 0) return bySeverity;
    const favA = a.dept.clima.verdict?.favorability ?? Number.POSITIVE_INFINITY;
    const favB = b.dept.clima.verdict?.favorability ?? Number.POSITIVE_INFINITY;
    return favA - favB;
  });

  const winner = candidates[0];
  return {
    departmentId: winner.dept.departmentId,
    departmentName: winner.dept.departmentName,
    riskZone: winner.zone,
    favorability: winner.dept.clima.verdict?.favorability ?? null,
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Lectura
// ────────────────────────────────────────────────────────────────────────────

export interface GetVitalSignsParams {
  accountId: string;
  /** null = toda la cuenta. Array = scope jerárquico ya resuelto por la API. */
  departmentIds: string[] | null;
  /** Inyectable para tests deterministas. */
  now?: Date;
}

/**
 * Lee los signos vitales del scope. 3 queries batched, cero N+1.
 * accountId presente en las 3.
 */
export async function getVitalSigns({
  accountId,
  departmentIds,
  now = new Date(),
}: GetVitalSignsParams): Promise<VitalSignsSummary> {
  const scope: VitalsScope = departmentIds === null ? 'organization' : 'area';

  // Scope vacío (AREA_MANAGER sin hijos ni depto propio válido) → resultado vacío,
  // nunca "toda la cuenta".
  if (departmentIds !== null && departmentIds.length === 0) {
    return emptySummary(scope);
  }

  // ── Query 1: departamentos del scope + gold caches EXO/EIS (O(1), no clima).
  const departments = await prisma.department.findMany({
    where: {
      accountId,
      isActive: true,
      ...(departmentIds !== null ? { id: { in: departmentIds } } : {}),
    },
    select: {
      id: true,
      displayName: true,
      accumulatedExoScore: true,
      accumulatedEISScore: true,
    },
    orderBy: { displayName: 'asc' },
  });

  if (departments.length === 0) return emptySummary(scope);

  const deptIds = departments.map((d) => d.id);

  // ── Queries 2 y 3 en paralelo.
  const [insightRows, complianceRows] = await Promise.all([
    // Clima: SOLO el producto de veredicto. Pulso Express ni se lee.
    prisma.departmentClimaInsight.findMany({
      where: {
        accountId,
        departmentId: { in: deptIds },
        productType: VITALS_VERDICT_PRODUCT_TYPE,
      },
      select: {
        departmentId: true,
        productType: true,
        isFollowUp: true,
        period: true,
        periodEnd: true,
        engagementFavorability: true,
        riskZone: true,
        momentum: true,
        correlationFlags: true,
        topFocusArea: true,
        driverScores: true,
        totalResponded: true,
      },
    }),
    // ISA: sólo filas COMPLETED de alcance departamental. El isaScore ya viene
    // penalizado por teatro — NO se re-aplica nada.
    prisma.complianceAnalysis.findMany({
      where: {
        accountId,
        scope: VITALS_COMPLIANCE_SCOPE_DEPARTMENT,
        status: VITALS_COMPLIANCE_STATUS,
        departmentId: { in: deptIds },
      },
      select: {
        departmentId: true,
        isaScore: true,
        previousIsaScore: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  // Agrupación en memoria (una pasada por colección).
  const insightsByDept = new Map<string, ClimaInsightRow[]>();
  for (const row of insightRows) {
    const list = insightsByDept.get(row.departmentId);
    const typed: ClimaInsightRow = { ...row, departmentId: row.departmentId };
    if (list) list.push(typed);
    else insightsByDept.set(row.departmentId, [typed]);
  }

  // orderBy createdAt desc → la primera de cada depto es la más reciente.
  const isaByDept = new Map<string, (typeof complianceRows)[number]>();
  for (const row of complianceRows) {
    if (row.departmentId && !isaByDept.has(row.departmentId)) {
      isaByDept.set(row.departmentId, row);
    }
  }

  const result: DepartmentVitalSigns[] = departments.map((dept) => {
    const layers = selectClimaLayers(insightsByDept.get(dept.id) ?? [], now);
    const isa = isaByDept.get(dept.id) ?? null;

    // null ≠ 0: el delta sólo existe si existen ambos extremos.
    const isaScore = isa?.isaScore ?? null;
    const previousIsaScore = isa?.previousIsaScore ?? null;
    const isaDelta =
      isaScore !== null && previousIsaScore !== null ? isaScore - previousIsaScore : null;

    return {
      departmentId: dept.id,
      departmentName: dept.displayName,
      clima: layers,
      onboarding: { exoScore: dept.accumulatedExoScore ?? null },
      exit: { eisScore: dept.accumulatedEISScore ?? null },
      ambiente: { isaScore, previousIsaScore, delta: isaDelta },
    };
  });

  const zoneDistribution = { verde: 0, amarilla: 0, naranja: 0, roja: 0, sinVeredicto: 0 };
  for (const d of result) {
    const zone = d.clima.verdict?.riskZone ?? null;
    if (zone === null) zoneDistribution.sinVeredicto += 1;
    else zoneDistribution[zone] += 1;
  }

  const headline = selectHeadline(result);

  return {
    scope,
    departments: result,
    zoneDistribution,
    headline,
    headlineUnavailableReason: headline === null ? 'sin_veredictos' : null,
    coverage: {
      totalDepartments: result.length,
      withClimaVerdict: result.filter((d) => d.clima.verdict !== null).length,
      withExo: result.filter((d) => d.onboarding.exoScore !== null).length,
      withEis: result.filter((d) => d.exit.eisScore !== null).length,
      withIsa: result.filter((d) => d.ambiente.isaScore !== null).length,
    },
  };
}

function emptySummary(scope: VitalsScope): VitalSignsSummary {
  return {
    scope,
    departments: [],
    zoneDistribution: { verde: 0, amarilla: 0, naranja: 0, roja: 0, sinVeredicto: 0 },
    headline: null,
    headlineUnavailableReason: 'sin_veredictos',
    coverage: {
      totalDepartments: 0,
      withClimaVerdict: 0,
      withExo: 0,
      withEis: 0,
      withIsa: 0,
    },
  };
}
