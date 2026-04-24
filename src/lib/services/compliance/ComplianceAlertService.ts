// src/lib/services/compliance/ComplianceAlertService.ts
// Ambiente Sano - Creación de alertas a partir del ConvergenciaEngine.
//
// Idempotente: si ya existe una alerta ACTIVA (pending|acknowledged) del mismo
// tipo para el mismo (campaignId, departmentId), no se duplica. Resolved/dismissed
// se ignoran en el check — una alerta cerrada puede volver a dispararse si el
// cuadro reaparece.
//
// Degradación elegante O4: si el engine no devuelve datos suficientes para un
// tipo (ej. `deterioro_sostenido` sin histórico Pulso), la alerta simplemente
// no se crea — no es error.

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

export interface AlertCreationResult {
  created: number;
  skipped: number;
  errors: string[];
  byType: Partial<Record<ComplianceAlertType, number>>;
}

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
 */
async function createDepartmentAlerts(
  accountId: string,
  campaignId: string,
  dept: DepartmentConvergencia,
  byType: Partial<Record<ComplianceAlertType, number>>
): Promise<{ created: number; skipped: number; errors: string[] }> {
  let created = 0;
  let skipped = 0;
  const errors: string[] = [];

  // 1. riesgo_convergente (nivel convergente o crítico)
  if (dept.level === 'convergente' || dept.level === 'critico') {
    const cfg = COMPLIANCE_ALERT_TYPES.riesgo_convergente;
    try {
      const outcome = await upsertAlertOnce({
        accountId,
        campaignId,
        departmentId: dept.departmentId,
        alertType: 'riesgo_convergente',
        title: formatTemplate(cfg.titleTemplate, { department: dept.departmentName }),
        description: formatTemplate(cfg.descriptionTemplate, {
          signalsCount: dept.riskSignalsCount,
        }),
        triggerSources: dept.activeSources,
        triggerScore: dept.signals.ambiente_sano?.value ?? null,
        signalsCount: dept.riskSignalsCount,
        context: {
          level: dept.level,
          signals: dept.signals,
          activeSources: dept.activeSources,
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

  // 2. silencio_organizacional (patrón LLM detectado)
  if (dept.silencioDetected) {
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
        triggerScore: dept.signals.ambiente_sano?.value ?? null,
        signalsCount: 1,
        context: { silencioDetected: true },
      });
      if (outcome === 'created') {
        created++;
        bump(byType, 'silencio_organizacional');
      } else skipped++;
    } catch (e) {
      errors.push(`silencio_organizacional ${dept.departmentId}: ${(e as Error).message}`);
    }
  }

  // 3. deterioro_sostenido (Pulso cae 3 períodos). Degrada si no hay histórico.
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

  // 4. senal_ignorada (Exit + Onboarding correlacionados). Degrada si faltan.
  if (dept.senalIgnorada) {
    const cfg = COMPLIANCE_ALERT_TYPES.senal_ignorada;
    try {
      const outcome = await upsertAlertOnce({
        accountId,
        campaignId,
        departmentId: dept.departmentId,
        alertType: 'senal_ignorada',
        title: formatTemplate(cfg.titleTemplate, { department: dept.departmentName }),
        description: cfg.descriptionTemplate,
        triggerSources: ['onboarding', 'exit'],
        triggerScore: null,
        signalsCount: 1,
        context: { senalIgnorada: true },
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
 * Genera todas las alertas aplicables según el output del ConvergenciaEngine.
 * Idempotente: re-ejecutar no duplica alertas activas existentes.
 */
export async function createAlertsFromConvergencia(
  accountId: string,
  result: ConvergenciaResult
): Promise<AlertCreationResult> {
  const byType: Partial<Record<ComplianceAlertType, number>> = {};
  let created = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const dept of result.departments) {
    const r = await createDepartmentAlerts(accountId, result.campaignId, dept, byType);
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
