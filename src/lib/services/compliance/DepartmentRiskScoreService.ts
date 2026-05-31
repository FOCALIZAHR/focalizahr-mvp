// src/lib/services/compliance/DepartmentRiskScoreService.ts
// Score de riesgo por departamento — runtime, no persistido.
//
// Diseño cerrado en `.claude/tasks/SCORE_RIESGO_DEPARTAMENTO_DISENO_CERRADO.md`.
// Task gate-by-gate en `.claude/tasks/TASK_SCORE_RIESGO_BACKEND_PASO2.md`.
//
// Dos drivers (confiabilidad + voz externa) + piso de denuncia.
// Fórmula:
//   C       = 50 · s²                        (s = 1 − participación)
//   A_norm  = pesoAlertas / (pesoAlertas + 3)
//   A       = 50 · A_norm
//   inferido     = min(C + A, 100)
//   piso         = 75 si denuncias12m ≥ 1, 0 si no
//   score        = max(inferido, piso)
//
// El score se computa para TODO el universo del account (todos los deptos
// activos), no solo los con ComplianceAnalysis. Por eso los helpers son
// agnósticos a la presencia de AS.

import { prisma } from '@/lib/prisma';
import {
  PESO_BASE_ALERTA,
  BUMPABLE_ONBOARDING_TYPES,
  applyBumpIfApplicable,
  normalizeExitAlertType,
} from '@/config/compliance/convergenciaWeights';

// ════════════════════════════════════════════════════════════════════════════
// GATE 1 — Bridge de denuncia (ventana 12 meses)
// ════════════════════════════════════════════════════════════════════════════

/** Meses hacia atrás para la ventana de denuncia. Decisión de diseño. */
const DENUNCIA_WINDOW_MONTHS = 12;

/**
 * Suma de `DepartmentMetric.issueCount` por departamento dentro de la ventana
 * de los últimos 12 meses (por `periodEnd`).
 *
 * Regla `null ≠ 0`:
 *   - Dept con ≥1 row con `issueCount` no-null en la ventana → Map con la suma
 *     (puede ser `0` = cargado, sin denuncias).
 *   - Dept sin NINGÚN row con métrica cargada en la ventana → Map con `null`
 *     (sin dato — el frontend no debe leer esto como "sin denuncias").
 *
 * @param accountId  Cuenta dueña de los deptos.
 * @param deptIds    Universo de deptos a consultar (subset filtrado por RBAC
 *                   ya resuelto por el caller).
 * @param now        Reloj inyectable (testing). Default: new Date().
 */
export async function loadDenunciaCountsByDept(
  accountId: string,
  deptIds: string[],
  now: Date = new Date(),
): Promise<Map<string, number | null>> {
  const out = new Map<string, number | null>();
  // Inicializar todos los deptos pedidos a null — "sin dato" hasta probar lo contrario.
  for (const id of deptIds) out.set(id, null);

  if (deptIds.length === 0) return out;

  const cutoff = new Date(now);
  cutoff.setMonth(cutoff.getMonth() - DENUNCIA_WINDOW_MONTHS);

  const rows = await prisma.departmentMetric.findMany({
    where: {
      accountId,
      departmentId: { in: deptIds },
      periodEnd: { gte: cutoff },
      issueCount: { not: null },
    },
    select: { departmentId: true, issueCount: true },
  });

  // Acumular: solo flipear a número (incluso 0) cuando hay al menos un row.
  for (const r of rows) {
    if (r.issueCount === null) continue; // defensive — el where ya filtra
    const current = out.get(r.departmentId);
    const base = current === null || current === undefined ? 0 : current;
    out.set(r.departmentId, base + r.issueCount);
  }

  return out;
}

// ════════════════════════════════════════════════════════════════════════════
// GATE 2 — pesoAlertas + alertas[] para TODOS los deptos del universo
// ════════════════════════════════════════════════════════════════════════════

/**
 * Item de alerta externa expuesto al payload del score.
 * Strict subset de `ExternalAlert` de ConvergenciaEngine — solo los 3 campos
 * que necesita la descomposición del riesgo. `id`, `pesoBase`,
 * `factorDecaimiento`, `status`, `resolvedAt` no se exponen.
 */
export interface ExternalAlertSummary {
  alertType: string;
  producto: 'exit' | 'onboarding';
  pesoEfectivo: number;
}

/** Ventana de 90 días para el bump de alertas Onboarding bumpables. */
const BUMP_90D_LOOKBACK_MS = 90 * 24 * 3600 * 1000;

/** Meses hacia atrás para la ventana de alertas externas (exit + onboarding).
 *  Criterio por FECHA, no por estado: toda alerta creada en los últimos 12
 *  meses cuenta, sin importar status ni alertType. Mismo patrón que
 *  `DENUNCIA_WINDOW_MONTHS` del Gate 1. */
const ALERTAS_WINDOW_MONTHS = 12;

/** Threshold del bump 90d (≥N casos del mismo tipo activan el bump). */
const BUMP_90D_THRESHOLD = 2;

/**
 * Carga `ExternalAlertSummary[]` por depto en 2 queries totales (exit + onboarding),
 * más una groupBy de bump 90d cuando hay onboarding bumpable presente.
 *
 * Ventana por FECHA: alertas creadas en los últimos 12 meses, sin importar
 * estado ni alertType (`factorDecaimiento = 1.0`).
 * Equivalencia: replica la lógica de `loadDepartmentExternalAlerts` per-dept
 * pero en bulk para el universo entero — incluye deptos sin ComplianceAnalysis
 * (los del silencio), que hoy no se cargan en ningún lado.
 *
 * @param accountId  Cuenta dueña.
 * @param deptIds    Universo de deptos a consultar.
 * @param now        Reloj inyectable (testing). Default: new Date().
 */
export async function loadAlertasByDeptBulk(
  accountId: string,
  deptIds: string[],
  now: Date = new Date(),
): Promise<Map<string, ExternalAlertSummary[]>> {
  const out = new Map<string, ExternalAlertSummary[]>();
  for (const id of deptIds) out.set(id, []);

  if (deptIds.length === 0) return out;

  // Ventana de 12 meses por fecha de creación (no por estado).
  const cutoff12m = new Date(now);
  cutoff12m.setMonth(cutoff12m.getMonth() - ALERTAS_WINDOW_MONTHS);

  // Query 1 — Exit alerts de los últimos 12 meses, filtradas al universo.
  const exitAlerts = await prisma.exitAlert.findMany({
    where: {
      accountId,
      departmentId: { in: deptIds },
      createdAt: { gte: cutoff12m },
    },
    select: { departmentId: true, alertType: true },
  });

  // Query 2 — Onboarding alerts de los últimos 12 meses vía journey.departmentId.
  const journeyAlerts = await prisma.journeyAlert.findMany({
    where: {
      accountId,
      createdAt: { gte: cutoff12m },
      journey: { departmentId: { in: deptIds } },
    },
    select: {
      alertType: true,
      journey: { select: { departmentId: true } },
    },
  });

  // Bump 90d — solo si hay onboarding bumpable activo. Una sola groupBy por
  // (journey.departmentId, alertType) para todo el universo.
  const hasBumpables = journeyAlerts.some((a) =>
    (BUMPABLE_ONBOARDING_TYPES as ReadonlyArray<string>).includes(a.alertType),
  );

  // Map<deptId, Map<alertType, count>> para lookup O(1) por dept+type.
  const bumpCountByDept = new Map<string, Map<string, number>>();
  if (hasBumpables) {
    const cutoff = new Date(now.getTime() - BUMP_90D_LOOKBACK_MS);
    const bumpRows = await prisma.journeyAlert.findMany({
      where: {
        accountId,
        alertType: { in: BUMPABLE_ONBOARDING_TYPES as unknown as string[] },
        createdAt: { gte: cutoff },
        journey: { departmentId: { in: deptIds } },
      },
      select: {
        alertType: true,
        journey: { select: { departmentId: true } },
      },
    });
    for (const r of bumpRows) {
      const deptId = r.journey?.departmentId;
      if (!deptId) continue;
      const byType = bumpCountByDept.get(deptId) ?? new Map<string, number>();
      byType.set(r.alertType, (byType.get(r.alertType) ?? 0) + 1);
      bumpCountByDept.set(deptId, byType);
    }
  }

  // Componer Exit summaries.
  for (const a of exitAlerts) {
    if (!a.departmentId) continue;
    const canonical = normalizeExitAlertType(a.alertType);
    const pesoBase = PESO_BASE_ALERTA[canonical] ?? 0;
    // Fase 2: factorDecaimiento = 1.0 → pesoEfectivo = pesoBase.
    const bucket = out.get(a.departmentId);
    if (!bucket) continue;
    bucket.push({ alertType: canonical, producto: 'exit', pesoEfectivo: pesoBase });
  }

  // Componer Onboarding summaries (con bump 90d).
  for (const a of journeyAlerts) {
    const deptId = a.journey?.departmentId;
    if (!deptId) continue;
    const baseRaw = PESO_BASE_ALERTA[a.alertType] ?? 0;
    const count90 = bumpCountByDept.get(deptId)?.get(a.alertType) ?? 0;
    const pesoBase = applyBumpIfApplicable(a.alertType, baseRaw, count90);
    const bucket = out.get(deptId);
    if (!bucket) continue;
    bucket.push({
      alertType: a.alertType,
      producto: 'onboarding',
      pesoEfectivo: pesoBase,
    });
  }

  return out;
}

// Re-export para tests externos que quieran el threshold del bump.
export { BUMP_90D_THRESHOLD };

// ════════════════════════════════════════════════════════════════════════════
// GATE 3 — Confiabilidad C = W_C · s²
// ════════════════════════════════════════════════════════════════════════════

/** Peso máximo del driver confiabilidad. Diseño cerrado. */
const W_C = 50;

/**
 * Driver 1 — confiabilidad del dato (silencio interno).
 * `C = W_C · s²` donde `s = 1 − participación`. Convexa: el último que calla
 * pesa más que el primero.
 *
 * Bucket "no invitado": cuando el dept no entró al universo de la campaña,
 * `participationRate` es `null` y el driver NO aplica — devolvemos
 * `{value:0, applies:false}` para que la composición lo nombre como tal
 * en la explicación.
 *
 * @param participationRate  0-100, o `null` si el dept no fue invitado.
 *                            Viene tal cual de `CoverageDeptItem.participationRate`.
 */
export function computeConfiabilidad(
  participationRate: number | null,
): { value: number; applies: boolean } {
  if (participationRate === null) {
    return { value: 0, applies: false };
  }
  const p = participationRate / 100;
  const s = 1 - p;
  const C = W_C * s * s;
  return { value: C, applies: true };
}

// Re-export para tests externos.
export { W_C };

// ════════════════════════════════════════════════════════════════════════════
// GATE 4 — Composición del score + descomposición
// ════════════════════════════════════════════════════════════════════════════

import type { CoverageDeptItem } from './CoverageAnalysisService';
import type {
  DepartmentRiskScore,
  DepartmentRiskBucket,
} from '@/types/compliance';

/** Peso máximo del driver voz externa. Diseño cerrado. */
const W_A = 50;
/** Constante Hill para normalización de pesoAlertas. Diseño cerrado. */
const K_A = 3;
/** Valor del piso de denuncia. Diseño cerrado (entrada a banda crítica). */
const PISO_DENUNCIA = 75;

/** Mapeo `CoverageDeptItem.analyzed` → bucket del score. */
function bucketFromAnalyzed(
  analyzed: CoverageDeptItem['analyzed'],
): DepartmentRiskBucket {
  if (analyzed === 'completed') return 'con_isa';
  if (analyzed === 'not_invited') return 'no_invitado';
  // 'skipped_privacy' | 'no_response' → invitado, sin ISA al lado
  return 'sub_threshold';
}

/**
 * Computa el score de riesgo por dept para todo el universo (los items que
 * vengan en `coverageItems` — ya filtrados por RBAC en el caller).
 *
 * Fórmula:
 *   C       = 50·s²  (s = 1 − participación/100), 0 si no invitado
 *   A_norm  = pesoAlertas / (pesoAlertas + 3)
 *   A       = 50·A_norm
 *   inferido = min(C + A, 100)
 *   piso     = 75 si denuncias_12m ≥ 1
 *   score    = round(max(inferido, piso))
 */
export async function computeDepartmentRiskScores(params: {
  accountId: string;
  coverageItems: CoverageDeptItem[];
  now?: Date;
}): Promise<DepartmentRiskScore[]> {
  const { accountId, coverageItems } = params;
  const now = params.now ?? new Date();
  const deptIds = coverageItems.map((d) => d.departmentId);

  const [denunciasByDept, alertasByDept] = await Promise.all([
    loadDenunciaCountsByDept(accountId, deptIds, now),
    loadAlertasByDeptBulk(accountId, deptIds, now),
  ]);

  return coverageItems.map((item): DepartmentRiskScore => {
    const alertas = alertasByDept.get(item.departmentId) ?? [];
    const pesoAlertas = alertas.reduce((s, a) => s + a.pesoEfectivo, 0);
    const denuncias12m = denunciasByDept.get(item.departmentId) ?? null;

    const confiab = computeConfiabilidad(item.participationRate);
    const A_norm = pesoAlertas > 0 ? pesoAlertas / (pesoAlertas + K_A) : 0;
    const A = W_A * A_norm;

    const inferido = Math.min(confiab.value + A, 100);
    const piso = denuncias12m !== null && denuncias12m >= 1 ? PISO_DENUNCIA : 0;
    const scoreRaw = Math.max(inferido, piso);

    return {
      departmentId: item.departmentId,
      departmentName: item.departmentName,
      score: Math.round(scoreRaw),
      bucket: bucketFromAnalyzed(item.analyzed),
      drivers: {
        confiabilidad: Math.round(confiab.value),
        voz_externa: Math.round(A),
        piso_denuncia: piso,
      },
      reason: piso > inferido ? 'piso_aplicado' : 'suma',
      inputs: {
        participacion: item.participationRate,
        pesoAlertas,
        denuncias_12m: denuncias12m,
      },
      alertas,
    };
  });
}

// Re-export para tests externos.
export { W_A, K_A, PISO_DENUNCIA };
