// src/lib/services/compliance/ComplianceAlertService.ts
// Ambiente Sano - Creación de alertas a partir del ConvergenciaEngine v2.
//
// Idempotente: si ya existe una alerta ACTIVA (pending|acknowledged) del mismo
// tipo para el mismo (campaignId, departmentId), no se duplica. Resolved/dismissed
// se ignoran en el check — una alerta cerrada puede volver a dispararse si el
// cuadro reaparece.
//
// Motor A v2 (FASE 1) — las condiciones se evalúan sobre:
//   - dept.convergenciaInterna.casosActivos (A1-A5)
//   - dept.convergenciaInterna.nivelConvergencia
//   - dimensionScores (P2-P8) del safetyDetail
//   - patronesOutput LLM
//   - isaScore + previousIsaScore (para senal_ignorada)
//
// Spec: .claude/tasks/SPEC_CONVERGENCIA_ENGINE_v2_FINAL.md sec 4.

import { prisma } from '@/lib/prisma';
import {
  COMPLIANCE_ALERT_TYPES,
  ComplianceAlertType,
  ComplianceSource,
} from '@/config/complianceAlertConfig';
import type {
  ConvergenciaResult,
  DepartmentConvergencia,
} from './ConvergenciaEngine';
import {
  loadDepartmentExternalAlerts,
  computeConvergenciaExterna,
} from './ConvergenciaEngine';
import { getHistoricalWeight } from '@/config/compliance/convergenciaWeights';
import type { PatronAnalysisOutput } from './complianceTypes';
import type { DepartmentSafetyScore } from '@/lib/services/SafetyScoreService';

export interface AlertCreationResult {
  created: number;
  skipped: number;
  errors: string[];
  byType: Partial<Record<ComplianceAlertType, number>>;
}

/**
 * Contexto extendido per-dept para evaluar condiciones del spec v2 que no
 * viven en `DepartmentConvergencia` (dimensionScores, patronesOutput, ISAs,
 * alertas externas resumidas).
 * El orchestrator construye este Map antes de invocar el service.
 */
export interface DeptAlertContext {
  isaScore: number | null;
  previousIsaScore: number | null;
  dimensionScores: DepartmentSafetyScore['dimensionScores'];
  patronesOutput: PatronAnalysisOutput | null;
  /**
   * Flag org-level derivado de MetaAnalysisOutput.origen_organizacional === 'vertical'.
   * Mismo valor para todos los deptos del ciclo (es agregado org). Usado en
   * condición C de liderazgo_toxico.
   */
  origenVertical: boolean;
  /**
   * Alertas resolved/dismissed del ciclo anterior (mismo dept) — count.
   * Conservado para diagnóstico/narrativa. La decisión de senal_ignorada
   * v2 usa `previousCycleAlertsClosedWeight` (Fase 3).
   */
  previousCycleAlertsClosed: number;
  // ─── Motor B Fase 2 — convergencia externa ────────────────────────
  /** ExternalRiskScore = exoSignal + eisSignal + sum(pesoEfectivo de alertas). */
  externalRiskScore: number;
  /** Alguna alerta crítica con peso ≥ 0.9 ([ley_karin, toxic_exit, DESENGANCHE]). */
  tieneAlertaCritica: boolean;
  /** Flag fallaCicloDeVida del Motor B. */
  fallaCicloDeVida: boolean;
  /** Peso efectivo máximo de alertas tipo `liderazgo_concentracion` (rama D). */
  liderazgoConcentracionPeso: number;
  /** Peso efectivo máximo de alertas tipo `toxic_exit_detected` (rama E). */
  toxicExitDetectedPeso: number;
  // ─── Fase 3 — memoria histórica ───────────────────────────────────
  /**
   * Suma de pesoEfectivo de alertas resolved/dismissed del ciclo ANTERIOR
   * de Ambiente Sano para este dept (con decaimiento histórico).
   * senal_ignorada v2 se activa si > 0.
   */
  previousCycleAlertsClosedWeight: number;
  /**
   * Suma de pesoEfectivo de alertas externas (Exit + Onboarding)
   * resolved/dismissed en últimos 6 meses para este dept.
   * deterioro_sostenido v2 exige >= 0.9 (o motorACicloAnteriorTuvoCasos).
   */
  historicalAlertsLast6mWeight: number;
  /**
   * Boolean: el ciclo anterior de Ambiente Sano del mismo dept tuvo casos
   * Motor A activos (`convergenciaInterna.casosActivos.length > 0` en JSON).
   * Defensive: false si campaña pre-Fase-1 sin sub-objeto persistido.
   */
  motorACicloAnteriorTuvoCasos: boolean;
  /**
   * Flag computado al final del flujo de createDepartmentAlerts.
   * True si el dept ya tiene `liderazgo_toxico` o `riesgo_convergente`
   * activa (creada en este pass o pre-existente). Usado por
   * deterioro_sostenido v2 para evitar duplicación con alertas más severas.
   * NO se popula en buildAlertContextsFromDb — se evalúa en runtime.
   */
  hayAlertaMasSeveraActivaHoy: boolean;
}

// Threshold para `liderazgo_toxico` C (origen vertical + miedo/silencio fuerte).
const C_INTENSIDAD_VERTICAL = 0.6;
const DIM_LIDERAZGO_BAJA = 2.5;

// Thresholds Motor B Fase 2 (spec sec 4)
const RIESGO_CONVERGENTE_EXT_RAMA_A = 1.2;  // ExternalRiskScore mínimo rama A
const RIESGO_CONVERGENTE_EXT_RAMA_B = 3.0;  // ExternalRiskScore mínimo rama B
const LIDERAZGO_TOXICO_D_PESO_MIN = 1.2;    // peso liderazgo_concentracion
const LIDERAZGO_TOXICO_D_DIM_MAX = 2.8;     // p3_disenso o p7_liderazgo
const LIDERAZGO_TOXICO_E_PESO_MIN = 2.0;    // peso toxic_exit_detected
const LIDERAZGO_TOXICO_E_P7_MAX = 3.0;      // p7_liderazgo

function computeDueDate(slaHours: number | null): Date | null {
  if (slaHours === null) return null;
  return new Date(Date.now() + slaHours * 3600_000);
}

function formatTemplate(
  tpl: string,
  vars: Record<string, string | number>
): string {
  return tpl.replace(/\{(\w+)\}/g, (_, key) => String(vars[key] ?? `{${key}}`));
}

/** Crea una alerta si no existe ya una activa del mismo (type, campaign, department). */
async function upsertAlertOnce(params: {
  accountId: string;
  campaignId: string;
  departmentId: string | null;
  alertType: ComplianceAlertType;
  title: string;
  description: string;
  triggerSources: ComplianceSource[];
  triggerScore: number | null;
  signalsCount: number | null;
  context: Record<string, unknown>;
}): Promise<'created' | 'skipped'> {
  const config = COMPLIANCE_ALERT_TYPES[params.alertType];

  // Idempotencia: buscar alerta activa del mismo tipo y scope.
  const existing = await prisma.complianceAlert.findFirst({
    where: {
      accountId: params.accountId,
      campaignId: params.campaignId,
      departmentId: params.departmentId,
      alertType: params.alertType,
      status: { in: ['pending', 'acknowledged'] },
    },
    select: { id: true },
  });
  if (existing) return 'skipped';

  const dueDate = computeDueDate(config.slaHours);
  await prisma.complianceAlert.create({
    data: {
      accountId: params.accountId,
      campaignId: params.campaignId,
      departmentId: params.departmentId,
      alertType: params.alertType,
      severity: config.severity,
      title: params.title,
      description: params.description,
      context: params.context as object,
      triggerSources: params.triggerSources,
      triggerScore: params.triggerScore,
      signalsCount: params.signalsCount,
      slaHours: config.slaHours,
      dueDate,
      slaStatus: dueDate ? 'on_track' : null,
      status: 'pending',
    },
  });
  return 'created';
}

function bump(
  byType: Partial<Record<ComplianceAlertType, number>>,
  type: ComplianceAlertType
) {
  byType[type] = (byType[type] ?? 0) + 1;
}

/**
 * Genera alertas para un departamento según las señales convergentes.
 * Spec v2 Fase 1 — condiciones evaluadas sobre Motor A (casos A1-A5) +
 * dimensionScores + patronesOutput + ISA actual/anterior.
 */
async function createDepartmentAlerts(
  accountId: string,
  campaignId: string,
  dept: DepartmentConvergencia,
  ctx: DeptAlertContext,
  byType: Partial<Record<ComplianceAlertType, number>>
): Promise<{ created: number; skipped: number; errors: string[] }> {
  let created = 0;
  let skipped = 0;
  const errors: string[] = [];

  const interna = dept.convergenciaInterna;
  const casos = interna.casosActivos;
  const isa = ctx.isaScore;
  const dims = ctx.dimensionScores;
  const patrones = ctx.patronesOutput?.patrones ?? [];
  const findIntensidad = (nombre: string): number =>
    patrones.find((p) => p.nombre === nombre)?.intensidad ?? 0;
  const sesgoGenero = ctx.patronesOutput?.alerta_sesgo_genero === true;

  // Fase 3 — tracking de alertas más severas activadas en este pass.
  // deterioro_sostenido v2 NO debe duplicarse con liderazgo_toxico ni
  // riesgo_convergente. Tras crear/skipear cada una, marcamos el flag.
  let createdSeveraInThisRun = false;

  // Pre-existentes activas (no creadas en este pass) — el spec dice
  // "ninguna alerta más severa activa hoy" sin distinguir origen.
  const preExisting = await prisma.complianceAlert.findFirst({
    where: {
      accountId,
      campaignId,
      departmentId: dept.departmentId,
      alertType: { in: ['liderazgo_toxico', 'riesgo_convergente'] },
      status: { in: ['pending', 'acknowledged'] },
    },
    select: { id: true },
  });
  const preExistingSevera = !!preExisting;

  // ─── 1. riesgo_convergente ─────────────────────────────────────────
  // Spec sec 4 Fase 2:
  //   Rama A: (ISA<50 OR teatro) AND (
  //             ≥1 caso A
  //             OR ExternalRiskScore ≥ 1.2
  //             OR tieneAlertaCritica
  //             OR sesgo_genero
  //           )
  //   Rama B: ISA 50-74 AND ≥2 casos A AND ExternalRiskScore ≥ 3
  const cond1 = (isa !== null && isa < 50) || interna.teatroDetectado;
  const trigger1 =
    casos.length >= 1 ||
    ctx.externalRiskScore >= RIESGO_CONVERGENTE_EXT_RAMA_A ||
    ctx.tieneAlertaCritica ||
    sesgoGenero;
  const ramaA = cond1 && trigger1;

  const ramaB =
    isa !== null &&
    isa >= 50 &&
    isa <= 74 &&
    casos.length >= 2 &&
    ctx.externalRiskScore >= RIESGO_CONVERGENTE_EXT_RAMA_B;

  const debeRiesgoConvergente = ramaA || ramaB;

  if (debeRiesgoConvergente) {
    const cfg = COMPLIANCE_ALERT_TYPES.riesgo_convergente;
    try {
      const outcome = await upsertAlertOnce({
        accountId,
        campaignId,
        departmentId: dept.departmentId,
        alertType: 'riesgo_convergente',
        title: formatTemplate(cfg.titleTemplate, { department: dept.departmentName }),
        description: formatTemplate(cfg.descriptionTemplate, {
          signalsCount: casos.length,
        }),
        triggerSources: ['ambiente_sano'],
        triggerScore: isa,
        signalsCount: casos.length,
        context: {
          isaScore: isa,
          casosActivos: casos,
          nivelConvergencia: interna.nivelConvergencia,
          teatroDetectado: interna.teatroDetectado,
          sesgoGenero,
          // Fase 2:
          externalRiskScore: ctx.externalRiskScore,
          tieneAlertaCritica: ctx.tieneAlertaCritica,
          fallaCicloDeVida: ctx.fallaCicloDeVida,
          rama: ramaA ? 'A' : 'B',
        },
      });
      if (outcome === 'created') {
        created++;
        bump(byType, 'riesgo_convergente');
      } else skipped++;
      // Fase 3: marcar para evitar deterioro_sostenido en el mismo dept.
      createdSeveraInThisRun = true;
    } catch (e) {
      errors.push(`riesgo_convergente ${dept.departmentId}: ${(e as Error).message}`);
    }
  }

  // ─── 2. silencio_organizacional ────────────────────────────────────
  // Spec sec 4: A) silencio>0.4 + p2<2.5
  //             B) teatro siempre genera (independiente del ISA)
  //             C) Caso A5 activo
  const silencioInt = findIntensidad('silencio_organizacional');
  const p2 = dims.P2_seguridad;
  const ramaSilA = silencioInt > 0.4 && p2 !== null && p2 < 2.5;
  const ramaSilB = interna.teatroDetectado;
  const ramaSilC = casos.includes('A5');
  const debeSilencio = ramaSilA || ramaSilB || ramaSilC;

  if (debeSilencio) {
    const cfg = COMPLIANCE_ALERT_TYPES.silencio_organizacional;
    try {
      const outcome = await upsertAlertOnce({
        accountId,
        campaignId,
        departmentId: dept.departmentId,
        alertType: 'silencio_organizacional',
        title: formatTemplate(cfg.titleTemplate, { department: dept.departmentName }),
        description: cfg.descriptionTemplate,
        triggerSources: ['ambiente_sano'],
        triggerScore: isa,
        signalsCount: 1,
        context: {
          silencioInt,
          p2_seguridad: p2,
          teatroDetectado: interna.teatroDetectado,
          a5: ramaSilC,
        },
      });
      if (outcome === 'created') {
        created++;
        bump(byType, 'silencio_organizacional');
      } else skipped++;
    } catch (e) {
      errors.push(`silencio_organizacional ${dept.departmentId}: ${(e as Error).message}`);
    }
  }

  // ─── 3. liderazgo_toxico per-dept (condiciones B, C, D, E) ─────────
  // A: criticalByManager → se crea cross-dept en createLiderazgoToxicoAlerts.
  // B: A2 + (p3<2.5 OR p7<2.5).
  // C: origen_organizacional='vertical' + (silencio|miedo)>0.6 + p7<2.5.
  // D: alerta liderazgo_concentracion peso ≥ 1.2 + (p3<2.8 OR p7<2.8) — Fase 2.
  // E: alerta toxic_exit_detected peso ≥ 2.0 + p7<3.0 — Fase 2.
  const p3 = dims.P3_disenso;
  const p7 = dims.P7_liderazgo;
  const ramaLidB =
    casos.includes('A2') &&
    ((p3 !== null && p3 < DIM_LIDERAZGO_BAJA) ||
      (p7 !== null && p7 < DIM_LIDERAZGO_BAJA));
  const miedoInt = findIntensidad('miedo_represalias');
  const ramaLidC =
    ctx.origenVertical &&
    (silencioInt > C_INTENSIDAD_VERTICAL || miedoInt > C_INTENSIDAD_VERTICAL) &&
    p7 !== null &&
    p7 < DIM_LIDERAZGO_BAJA;

  const ramaLidD =
    ctx.liderazgoConcentracionPeso >= LIDERAZGO_TOXICO_D_PESO_MIN &&
    ((p3 !== null && p3 < LIDERAZGO_TOXICO_D_DIM_MAX) ||
      (p7 !== null && p7 < LIDERAZGO_TOXICO_D_DIM_MAX));
  const ramaLidE =
    ctx.toxicExitDetectedPeso >= LIDERAZGO_TOXICO_E_PESO_MIN &&
    p7 !== null &&
    p7 < LIDERAZGO_TOXICO_E_P7_MAX;

  if (ramaLidB || ramaLidC || ramaLidD || ramaLidE) {
    const cfg = COMPLIANCE_ALERT_TYPES.liderazgo_toxico;
    try {
      const outcome = await upsertAlertOnce({
        accountId,
        campaignId,
        departmentId: dept.departmentId,
        alertType: 'liderazgo_toxico',
        title: formatTemplate(cfg.titleTemplate, { scope: dept.departmentName }),
        description: formatTemplate(cfg.descriptionTemplate, { departmentsCount: 1 }),
        triggerSources: ['ambiente_sano'],
        triggerScore: isa,
        signalsCount: 1,
        context: {
          rama: ramaLidB
            ? 'B_a2_dim'
            : ramaLidC
              ? 'C_vertical'
              : ramaLidD
                ? 'D_concentracion'
                : 'E_toxic_exit',
          a2: casos.includes('A2'),
          p3_disenso: p3,
          p7_liderazgo: p7,
          origenVertical: ctx.origenVertical,
          silencioInt,
          miedoInt,
          // Fase 2:
          liderazgoConcentracionPeso: ctx.liderazgoConcentracionPeso,
          toxicExitDetectedPeso: ctx.toxicExitDetectedPeso,
        },
      });
      if (outcome === 'created') {
        created++;
        bump(byType, 'liderazgo_toxico');
      } else skipped++;
      // Fase 3: marcar para evitar deterioro_sostenido en el mismo dept.
      createdSeveraInThisRun = true;
    } catch (e) {
      errors.push(`liderazgo_toxico ${dept.departmentId}: ${(e as Error).message}`);
    }
  }

  // ─── 4. deterioro_sostenido v2 — Fase 3 (memoria histórica) ────────
  // Spec sec 4 reemplaza completamente la lógica legacy Pulso (que está
  // fuera del producto en esta versión del spec). Condición:
  //   isaActual < 65
  //   AND previousIsaScore != null
  //   AND isaActual <= previousIsaScore (no mejoró o empeoró)
  //   AND (sum pesoEfectivo alertas resolved últimos 6m >= 0.9
  //        OR Motor A tuvo casos en ciclo anterior)
  //   AND ninguna alerta más severa activa hoy (liderazgo_toxico|riesgo_convergente)
  const hayMasSevera = createdSeveraInThisRun || preExistingSevera;
  if (
    isa !== null &&
    isa < 65 &&
    ctx.previousIsaScore !== null &&
    isa <= ctx.previousIsaScore &&
    (ctx.historicalAlertsLast6mWeight >= 0.9 || ctx.motorACicloAnteriorTuvoCasos) &&
    !hayMasSevera
  ) {
    const cfg = COMPLIANCE_ALERT_TYPES.deterioro_sostenido;
    try {
      const outcome = await upsertAlertOnce({
        accountId,
        campaignId,
        departmentId: dept.departmentId,
        alertType: 'deterioro_sostenido',
        title: formatTemplate(cfg.titleTemplate, { department: dept.departmentName }),
        description: formatTemplate(cfg.descriptionTemplate, { periodsCount: 2 }),
        triggerSources: ['ambiente_sano'],
        triggerScore: isa,
        signalsCount: 1,
        context: {
          isaActual: isa,
          isaPrevio: ctx.previousIsaScore,
          historicalAlertsLast6mWeight: ctx.historicalAlertsLast6mWeight,
          motorACicloAnteriorTuvoCasos: ctx.motorACicloAnteriorTuvoCasos,
          rama:
            ctx.historicalAlertsLast6mWeight >= 0.9
              ? 'historico_alertas'
              : 'motor_a_previo',
        },
      });
      if (outcome === 'created') {
        created++;
        bump(byType, 'deterioro_sostenido');
      } else skipped++;
    } catch (e) {
      errors.push(`deterioro_sostenido ${dept.departmentId}: ${(e as Error).message}`);
    }
  }

  // ─── 5. senal_ignorada v2 — Fase 3 (peso decaído) ──────────────────
  // Spec sec 4: previousIsaScore != null AND isaActual <= previous AND
  //             sum(pesoEfectivo alertas resolved cicloAnterior) > 0.
  // Reemplaza count Fase 1 con peso decaído — alertas viejas pesan menos.
  if (
    ctx.previousIsaScore !== null &&
    ctx.isaScore !== null &&
    ctx.isaScore <= ctx.previousIsaScore &&
    ctx.previousCycleAlertsClosedWeight > 0
  ) {
    const cfg = COMPLIANCE_ALERT_TYPES.senal_ignorada;
    try {
      const outcome = await upsertAlertOnce({
        accountId,
        campaignId,
        departmentId: dept.departmentId,
        alertType: 'senal_ignorada',
        title: formatTemplate(cfg.titleTemplate, { department: dept.departmentName }),
        description: cfg.descriptionTemplate,
        triggerSources: ['ambiente_sano'],
        triggerScore: ctx.isaScore,
        signalsCount: ctx.previousCycleAlertsClosed,
        context: {
          isaActual: ctx.isaScore,
          isaPrevio: ctx.previousIsaScore,
          alertasCerradasCicloAnterior: ctx.previousCycleAlertsClosed,
          pesoDecaidoCicloAnterior: ctx.previousCycleAlertsClosedWeight,
        },
      });
      if (outcome === 'created') {
        created++;
        bump(byType, 'senal_ignorada');
      } else skipped++;
    } catch (e) {
      errors.push(`senal_ignorada ${dept.departmentId}: ${(e as Error).message}`);
    }
  }

  return { created, skipped, errors };
}

/** Crea alertas de liderazgo_toxico (agrupación de deptos críticos por manager). */
async function createLiderazgoToxicoAlerts(
  accountId: string,
  campaignId: string,
  result: ConvergenciaResult,
  byType: Partial<Record<ComplianceAlertType, number>>
): Promise<{ created: number; skipped: number; errors: string[] }> {
  let created = 0;
  let skipped = 0;
  const errors: string[] = [];

  if (result.criticalByManager.length === 0) return { created, skipped, errors };

  const cfg = COMPLIANCE_ALERT_TYPES.liderazgo_toxico;

  for (const group of result.criticalByManager) {
    const managerDept = await prisma.department.findUnique({
      where: { id: group.managerId },
      select: { displayName: true },
    });
    const scope = managerDept?.displayName ?? 'área sin nombre';
    const affectedNames = result.departments
      .filter((d) => group.departmentIds.includes(d.departmentId))
      .map((d) => d.departmentName);

    try {
      const outcome = await upsertAlertOnce({
        accountId,
        campaignId,
        departmentId: group.managerId, // alerta al nivel gerencia
        alertType: 'liderazgo_toxico',
        title: formatTemplate(cfg.titleTemplate, { scope }),
        description: formatTemplate(cfg.descriptionTemplate, {
          departmentsCount: group.departmentIds.length,
        }),
        triggerSources: ['ambiente_sano'],
        triggerScore: null,
        signalsCount: group.departmentIds.length,
        context: {
          managerId: group.managerId,
          affectedDepartmentIds: group.departmentIds,
          affectedDepartmentNames: affectedNames,
        },
      });
      if (outcome === 'created') {
        created++;
        bump(byType, 'liderazgo_toxico');
      } else skipped++;
    } catch (e) {
      errors.push(`liderazgo_toxico ${group.managerId}: ${(e as Error).message}`);
    }
  }

  return { created, skipped, errors };
}

/**
 * Lee del JSON persistido del ciclo anterior si Motor A tuvo casos activos.
 * Defensive: campañas pre-Fase-1 no tienen `convergenciaInterna` en el sub-objeto
 * → retorna false sin error.
 */
async function loadMotorACicloAnterior(
  departmentId: string,
  accountId: string,
  currentCampaignId: string
): Promise<boolean> {
  const currentCampaign = await prisma.campaign.findUnique({
    where: { id: currentCampaignId },
    select: { endDate: true },
  });
  if (!currentCampaign) return false;

  const previous = await prisma.complianceAnalysis.findFirst({
    where: {
      accountId,
      departmentId,
      scope: 'DEPARTMENT',
      status: 'COMPLETED',
      campaign: {
        status: 'completed',
        endDate: { lt: currentCampaign.endDate },
        campaignType: { slug: 'pulso-ambientes-sanos' },
      },
    },
    orderBy: { campaign: { endDate: 'desc' } },
    select: { resultPayload: true },
  });

  if (!previous?.resultPayload) return false;
  const payload = previous.resultPayload as {
    convergencia?: { convergenciaInterna?: { casosActivos?: string[] } };
  };
  const casos = payload.convergencia?.convergenciaInterna?.casosActivos ?? [];
  return casos.length > 0;
}

/**
 * Calcula el peso decaído de las alertas Compliance (propias de Ambiente Sano)
 * resolved/dismissed del ciclo ANTERIOR para un dept.
 * Para senal_ignorada v2.
 */
async function loadPreviousCycleClosedWeight(
  departmentId: string,
  accountId: string,
  previousCampaignId: string
): Promise<number> {
  const closedAlerts = await prisma.complianceAlert.findMany({
    where: {
      campaignId: previousCampaignId,
      accountId,
      departmentId,
      status: { in: ['resolved', 'dismissed'] },
    },
    select: { alertType: true, status: true, resolvedAt: true },
  });

  // Las alertas Compliance no tienen entrada en PESO_BASE_ALERTA (esa tabla
  // es para alertas externas Exit/Onboarding). Para señal ignorada usamos
  // peso base = 1 por alerta cerrada × factor decaimiento.
  // Spec: "alertas que fueron resolved o dismissed" sin peso explícito —
  // tratamos cada una como peso 1 con decaimiento.
  const now = new Date();
  return closedAlerts.reduce(
    (sum, a) => sum + 1 * getHistoricalWeight(a.status, a.resolvedAt, now),
    0
  );
}

/**
 * Carga el Map de DeptAlertContext desde BD para un ciclo dado.
 * Reusable por orchestrator (al cerrar ORG) y endpoint manual de re-run.
 *
 * Lee:
 *   - completedDepts (ComplianceAnalysis scope=DEPARTMENT) para isaScore,
 *     previousIsaScore, dimensionScores, patronesOutput.
 *   - orgRow.resultPayload.meta para origen_organizacional.
 *   - complianceAlert resolved/dismissed del ciclo anterior para el count.
 */
export async function buildAlertContextsFromDb(
  campaignId: string,
  accountId: string
): Promise<Map<string, DeptAlertContext>> {
  const completedDepts = await prisma.complianceAnalysis.findMany({
    where: { campaignId, scope: 'DEPARTMENT', status: 'COMPLETED' },
  });

  const orgRow = await prisma.complianceAnalysis.findFirst({
    where: { campaignId, scope: 'ORG', status: 'COMPLETED' },
    select: { resultPayload: true },
  });
  const orgPayload = (orgRow?.resultPayload ?? {}) as {
    meta?: { origen_organizacional?: string };
  };
  // Spec usa "vertical"; tipo del LLM es 'vertical_descendente'.
  const origenVertical =
    orgPayload.meta?.origen_organizacional === 'vertical_descendente';

  const previousCampaign = await prisma.campaign.findFirst({
    where: {
      accountId,
      id: { not: campaignId },
      status: 'completed',
      campaignType: { slug: 'pulso-ambientes-sanos' },
    },
    orderBy: { endDate: 'desc' },
    select: { id: true },
  });

  // Alertas Compliance (propias) resolved/dismissed del ciclo anterior —
  // count para diagnóstico + peso decaído para senal_ignorada v2.
  const closedCountByDept = new Map<string, number>();
  const closedWeightByDept = new Map<string, number>();
  if (previousCampaign) {
    const closedAlerts = await prisma.complianceAlert.findMany({
      where: {
        campaignId: previousCampaign.id,
        status: { in: ['resolved', 'dismissed'] },
      },
      select: { departmentId: true, status: true, resolvedAt: true },
    });
    const now = new Date();
    for (const a of closedAlerts) {
      if (!a.departmentId) continue;
      closedCountByDept.set(
        a.departmentId,
        (closedCountByDept.get(a.departmentId) ?? 0) + 1
      );
      // Spec: alertas Compliance no están en PESO_BASE_ALERTA (esa tabla es
      // para externas). Tratamos cada cerrada como peso base 1 × decay.
      const w = 1 * getHistoricalWeight(a.status, a.resolvedAt, now);
      closedWeightByDept.set(
        a.departmentId,
        (closedWeightByDept.get(a.departmentId) ?? 0) + w
      );
    }
  }

  // Bulk fetch de Department para gold caches (EXO + EIS) — evita N+1.
  const deptIds = completedDepts
    .map((d) => d.departmentId)
    .filter((id): id is string => id !== null);
  const deptGolds = await prisma.department.findMany({
    where: { id: { in: deptIds } },
    select: {
      id: true,
      accumulatedExoScore: true,
      accumulatedEISScore: true,
    },
  });
  const goldByDeptId = new Map(deptGolds.map((d) => [d.id, d]));

  const map = new Map<string, DeptAlertContext>();
  for (const d of completedDepts) {
    if (!d.departmentId) continue;
    const payload = (d.resultPayload ?? {}) as {
      patrones?: PatronAnalysisOutput;
      safetyDetail?: { dimensionScores?: DepartmentSafetyScore['dimensionScores'] };
    };

    // Motor B Fase 2 — cargar alertas externas + computar resumen.
    // Fase 3: incluir histórico (resolved/dismissed con decaimiento).
    const externalAlerts = await loadDepartmentExternalAlerts(
      d.departmentId,
      accountId,
      { includeHistorical: true }
    );
    const gold = goldByDeptId.get(d.departmentId);
    // Para Motor B (scoreTotal/tieneAlertaCritica/fallaCicloDeVida) solo
    // cuentan las activas (factor 1.0). Filtramos antes de computar.
    const activeAlerts = externalAlerts.filter((a) => a.factorDecaimiento === 1.0);
    const externa = computeConvergenciaExterna(
      gold?.accumulatedExoScore ?? null,
      gold?.accumulatedEISScore ?? null,
      activeAlerts,
      d.isaScore
    );
    // Pesos individuales para ramas D y E del liderazgo_toxico (solo activas).
    let liderazgoConcentracionPeso = 0;
    let toxicExitDetectedPeso = 0;
    for (const a of activeAlerts) {
      if (a.alertType === 'liderazgo_concentracion') {
        liderazgoConcentracionPeso = Math.max(
          liderazgoConcentracionPeso,
          a.pesoEfectivo
        );
      }
      if (a.alertType === 'toxic_exit_detected') {
        toxicExitDetectedPeso = Math.max(toxicExitDetectedPeso, a.pesoEfectivo);
      }
    }

    // Fase 3 — peso decaído de alertas externas resolved/dismissed últimos 6m.
    const historicalAlertsLast6mWeight = externalAlerts
      .filter((a) => a.factorDecaimiento < 1.0)
      .reduce((sum, a) => sum + a.pesoEfectivo, 0);

    // Fase 3 — Motor A en ciclo anterior (lectura del JSON persistido).
    const motorACicloAnteriorTuvoCasos = await loadMotorACicloAnterior(
      d.departmentId,
      accountId,
      campaignId
    );

    map.set(d.departmentId, {
      isaScore: d.isaScore,
      previousIsaScore: d.previousIsaScore,
      dimensionScores: payload.safetyDetail?.dimensionScores ?? {
        P2_seguridad: null,
        P3_disenso: null,
        P4_microagresiones: null,
        P5_equidad: null,
        P7_liderazgo: null,
        P8_agotamiento: null,
      },
      patronesOutput: payload.patrones ?? null,
      origenVertical,
      previousCycleAlertsClosed: closedCountByDept.get(d.departmentId) ?? 0,
      externalRiskScore: externa.scoreTotal,
      tieneAlertaCritica: externa.tieneAlertaCritica,
      fallaCicloDeVida: externa.fallaCicloDeVida,
      liderazgoConcentracionPeso,
      toxicExitDetectedPeso,
      previousCycleAlertsClosedWeight: closedWeightByDept.get(d.departmentId) ?? 0,
      historicalAlertsLast6mWeight,
      motorACicloAnteriorTuvoCasos,
      hayAlertaMasSeveraActivaHoy: false, // se evalúa runtime en createDepartmentAlerts
    });
  }
  return map;
}

/**
 * Genera todas las alertas aplicables según el output del ConvergenciaEngine v2.
 * Idempotente: re-ejecutar no duplica alertas activas existentes.
 *
 * Spec v2 Fase 1:
 *   - riesgo_convergente, silencio_organizacional, liderazgo_toxico (B+C),
 *     senal_ignorada (limitada), deterioro_sostenido (legacy Pulso).
 *   - liderazgo_toxico (A) cross-dept se crea por createLiderazgoToxicoAlerts
 *     usando criticalByManager con delta ISA.
 */
export async function createAlertsFromConvergencia(
  accountId: string,
  result: ConvergenciaResult,
  deptContexts: Map<string, DeptAlertContext>
): Promise<AlertCreationResult> {
  const byType: Partial<Record<ComplianceAlertType, number>> = {};
  let created = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const dept of result.departments) {
    const ctx = deptContexts.get(dept.departmentId);
    if (!ctx) {
      // Defensive: dept sin contexto → skip evaluación (no es error, es
      // dept pre-deploy del DTO o inconsistencia upstream).
      continue;
    }
    const r = await createDepartmentAlerts(
      accountId,
      result.campaignId,
      dept,
      ctx,
      byType
    );
    created += r.created;
    skipped += r.skipped;
    errors.push(...r.errors);
  }

  const lt = await createLiderazgoToxicoAlerts(accountId, result.campaignId, result, byType);
  created += lt.created;
  skipped += lt.skipped;
  errors.push(...lt.errors);

  return { created, skipped, errors, byType };
}
