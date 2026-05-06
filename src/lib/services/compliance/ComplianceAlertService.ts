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
 * viven en `DepartmentConvergencia` (dimensionScores, patronesOutput, ISAs).
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
   * Alertas resolved/dismissed del ciclo anterior (mismo dept).
   * Para senal_ignorada Fase 1: count > 0 → señal de "se cerró el ticket
   * sin resolver la causa". Decaimiento histórico es Fase 3.
   */
  previousCycleAlertsClosed: number;
}

// Threshold para `liderazgo_toxico` C (origen vertical + miedo/silencio fuerte).
const C_INTENSIDAD_VERTICAL = 0.6;
const DIM_LIDERAZGO_BAJA = 2.5;

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

  // ─── 1. riesgo_convergente ─────────────────────────────────────────
  // Spec sec 4: (ISA<50 OR teatro) AND ≥1 caso A
  //   OR ISA 50-74 AND ≥2 casos A
  //   OR sesgo_genero detectado (A3 ya está en casos)
  const ramaA = (isa !== null && isa < 50) || interna.teatroDetectado;
  const ramaB = isa !== null && isa >= 50 && isa <= 74 && casos.length >= 2;
  const debeRiesgoConvergente =
    (ramaA && casos.length >= 1) || ramaB || sesgoGenero;

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
        },
      });
      if (outcome === 'created') {
        created++;
        bump(byType, 'riesgo_convergente');
      } else skipped++;
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

  // ─── 3. liderazgo_toxico per-dept (condiciones B y C) ──────────────
  // A: criticalByManager → se crea cross-dept en createLiderazgoToxicoAlerts.
  // B: A2 + (p3<2.5 OR p7<2.5).
  // C: origen_organizacional='vertical' + (silencio|miedo)>0.6 + p7<2.5.
  // D, E: requieren alertas Exit (Fase 2).
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

  if (ramaLidB || ramaLidC) {
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
          rama: ramaLidB ? 'B_a2_dim' : 'C_vertical',
          a2: casos.includes('A2'),
          p3_disenso: p3,
          p7_liderazgo: p7,
          origenVertical: ctx.origenVertical,
          silencioInt,
          miedoInt,
        },
      });
      if (outcome === 'created') {
        created++;
        bump(byType, 'liderazgo_toxico');
      } else skipped++;
    } catch (e) {
      errors.push(`liderazgo_toxico ${dept.departmentId}: ${(e as Error).message}`);
    }
  }

  // ─── 4. deterioro_sostenido — lógica legacy (Pulso cae 3 períodos) ──
  // Spec v2 redefine sobre previousIsaScore + alertas históricas (Fase 3).
  // En Fase 1 mantenemos la lógica actual: sigue siendo correcta para clientes
  // con Pulso activo, y Fase 3 reemplaza completo.
  if (dept.deterioroPulso) {
    const cfg = COMPLIANCE_ALERT_TYPES.deterioro_sostenido;
    try {
      const outcome = await upsertAlertOnce({
        accountId,
        campaignId,
        departmentId: dept.departmentId,
        alertType: 'deterioro_sostenido',
        title: formatTemplate(cfg.titleTemplate, { department: dept.departmentName }),
        description: formatTemplate(cfg.descriptionTemplate, { periodsCount: 3 }),
        triggerSources: ['pulso'],
        triggerScore: dept.signals.pulso?.value ?? null,
        signalsCount: 1,
        context: { deterioroPulso: true },
      });
      if (outcome === 'created') {
        created++;
        bump(byType, 'deterioro_sostenido');
      } else skipped++;
    } catch (e) {
      errors.push(`deterioro_sostenido ${dept.departmentId}: ${(e as Error).message}`);
    }
  }

  // ─── 5. senal_ignorada — Fase 1 limitada ──────────────────────────
  // Spec sec 4: previousIsaScore != null AND isa actual <= previous AND
  //             alertas resolved en ciclo anterior > 0.
  // Decaimiento histórico de pesos = Fase 3.
  if (
    ctx.previousIsaScore !== null &&
    ctx.isaScore !== null &&
    ctx.isaScore <= ctx.previousIsaScore &&
    ctx.previousCycleAlertsClosed > 0
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

  const closedCountByDept = new Map<string, number>();
  if (previousCampaign) {
    const closedAlerts = await prisma.complianceAlert.findMany({
      where: {
        campaignId: previousCampaign.id,
        status: { in: ['resolved', 'dismissed'] },
      },
      select: { departmentId: true },
    });
    for (const a of closedAlerts) {
      if (!a.departmentId) continue;
      closedCountByDept.set(
        a.departmentId,
        (closedCountByDept.get(a.departmentId) ?? 0) + 1
      );
    }
  }

  const map = new Map<string, DeptAlertContext>();
  for (const d of completedDepts) {
    if (!d.departmentId) continue;
    const payload = (d.resultPayload ?? {}) as {
      patrones?: PatronAnalysisOutput;
      safetyDetail?: { dimensionScores?: DepartmentSafetyScore['dimensionScores'] };
    };
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
