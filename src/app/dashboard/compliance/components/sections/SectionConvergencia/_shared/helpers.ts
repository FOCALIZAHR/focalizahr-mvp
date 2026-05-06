// Helpers puros para SectionConvergencia (C3 "Las Señales").
// Sin I/O, sin React, sin acceso a hook — funciones de transformación de data
// del report shape para alimentar las 3 sub-vistas.

import type {
  ComplianceReportResponse,
  ComplianceReportAlert,
  ComplianceReportDepartment,
  DepartmentConvergencia,
} from '@/types/compliance';
import type { ComplianceSource } from '@/config/complianceAlertConfig';

// ════════════════════════════════════════════════════════════════════════════
// CLASIFICACIÓN DEL STATE MACHINE
// ════════════════════════════════════════════════════════════════════════════

export type ConvergenciaCondicion =
  | 'una_sola_fuente'   // Condición 1: solo Ambiente Sano (típico)
  | 'parciales'         // Condición 2: 2+ fuentes, sin convergencia crítica
  | 'confirmada';       // Condición 3: convergencia crítica O criticalByManager

/**
 * Clasifica la sub-vista a renderizar.
 *
 * Orden de evaluación:
 *   1. activeSources <= 1 → 'una_sola_fuente'
 *   2. hay deptos en nivel convergente/critico O criticalByManager poblado
 *      → 'confirmada'
 *   3. resto → 'parciales'
 *
 * Edge case AREA_MANAGER: el backend filtra criticalByManager a []. Si el
 * AREA_MANAGER no tiene deptos en nivel crítico en su scope, el state machine
 * cae a 'parciales' — nunca ve la Tarjeta de Liderazgo. Comportamiento
 * correcto y privacy-safe.
 */
export function classifyConvergencia(
  report: ComplianceReportResponse
): ConvergenciaCondicion {
  const { activeSources, departments, criticalByManager } =
    report.data.convergencia;

  if (activeSources.length <= 1) return 'una_sola_fuente';

  const hayConvergenciaCritica = departments.some(
    (d) => d.level === 'convergente' || d.level === 'critico'
  );
  if (hayConvergenciaCritica || criticalByManager.length > 0) {
    return 'confirmada';
  }

  return 'parciales';
}

// ════════════════════════════════════════════════════════════════════════════
// CRITICAL BY MANAGER — agrupación con privacy hardened
// ════════════════════════════════════════════════════════════════════════════

export interface CriticalGroup {
  /** SOLO para usar como key React. NUNCA renderizar al usuario. */
  managerId: string;
  /** Nombres de deptos resueltos. Único output visible. */
  departmentNames: string[];
}

/**
 * Resuelve criticalByManager (que viene con departmentIds) a CriticalGroup
 * con departmentNames lookup'd. Privacy: managerId solo se usa como React
 * key — nunca aparece en el UI.
 *
 * Filtra grupos donde no se pudo resolver al menos 2 nombres
 * (defensive: en teoría buildGlobalConvergencia ya garantiza >=2).
 */
export function deriveCriticalGroups(
  criticalByManager: ComplianceReportResponse['data']['convergencia']['criticalByManager'],
  departments: DepartmentConvergencia[]
): CriticalGroup[] {
  const nameById = new Map(
    departments.map((d) => [d.departmentId, d.departmentName])
  );

  return criticalByManager
    .map((g) => ({
      managerId: g.managerId,
      departmentNames: g.departmentIds
        .map((id) => nameById.get(id))
        .filter((n): n is string => typeof n === 'string'),
    }))
    .filter((g) => g.departmentNames.length >= 2);
}

// ════════════════════════════════════════════════════════════════════════════
// FLAGS OCULTOS — silencio / deterioro / señal ignorada / teatro
// ════════════════════════════════════════════════════════════════════════════

export type FlagOcultoKey = 'silencio' | 'deterioro' | 'ignorada' | 'teatro';

export interface DeptHiddenFlags {
  departmentId: string;
  departmentName: string;
  flags: FlagOcultoKey[];
}

/**
 * Extrae los flags ocultos por dept en orden estable. Solo deptos con
 * al menos 1 flag entran al resultado.
 *
 * Inputs:
 *   - convergenciaDepts: trae silencioDetected, deterioroPulso, senalIgnorada
 *   - reportDepts: trae teatroCumplimiento (vive en column top-level de
 *     ComplianceAnalysis, expuesto vía route.ts en `departments[i]`)
 *
 * Match por departmentId. Si un dept aparece en una lista pero no en la otra,
 * los flags faltantes simplemente no se evalúan (defensive).
 */
export function deriveDeptHiddenFlags(
  convergenciaDepts: DepartmentConvergencia[],
  reportDepts: ComplianceReportDepartment[]
): DeptHiddenFlags[] {
  const teatroById = new Map(
    reportDepts
      .filter((d) => d.teatroCumplimiento === true)
      .map((d) => [d.departmentId, true])
  );

  const out: DeptHiddenFlags[] = [];
  for (const d of convergenciaDepts) {
    const flags: FlagOcultoKey[] = [];
    if (d.silencioDetected) flags.push('silencio');
    if (d.deterioroPulso) flags.push('deterioro');
    if (d.senalIgnorada) flags.push('ignorada');
    if (teatroById.has(d.departmentId)) flags.push('teatro');
    if (flags.length === 0) continue;
    out.push({
      departmentId: d.departmentId,
      departmentName: d.departmentName,
      flags,
    });
  }
  return out;
}

// ════════════════════════════════════════════════════════════════════════════
// ALERTAS — split por SLA + severity mapping
// ════════════════════════════════════════════════════════════════════════════

export interface AlertSlaSplit {
  /** Alertas activas con SLA en plazo. */
  enTiempo: ComplianceReportAlert[];
  /** Alertas con SLA vencido — registro permanente. */
  vencidas: ComplianceReportAlert[];
  /** Alertas sin dueDate (no aplican SLA — informativas). */
  sinSLA: ComplianceReportAlert[];
}

/**
 * Particiona alertas por estado de SLA. Usa `slaStatus` del backend si está
 * presente; fallback a comparar `dueDate` con now si solo viene la fecha.
 *
 * Filtra alertas resolved/dismissed (no se muestran en convergencia).
 */
export function splitAlertsBySLA(
  alerts: ComplianceReportAlert[],
  now: Date = new Date()
): AlertSlaSplit {
  const out: AlertSlaSplit = { enTiempo: [], vencidas: [], sinSLA: [] };

  for (const a of alerts) {
    if (a.status === 'resolved' || a.status === 'dismissed') continue;

    if (!a.dueDate) {
      out.sinSLA.push(a);
      continue;
    }

    if (a.slaStatus === 'overdue') {
      out.vencidas.push(a);
      continue;
    }

    const due = new Date(a.dueDate);
    if (due.getTime() < now.getTime()) {
      out.vencidas.push(a);
    } else {
      out.enTiempo.push(a);
    }
  }

  return out;
}

/**
 * Mapea severity del backend al level del motor de decisiones (C1).
 * Reusable por si SectionConvergencia gatilla upsertDecision sobre alertas.
 */
export function severityToLevel(
  severity: string
): 'atencion' | 'riesgo' | 'critico' {
  if (severity === 'critical') return 'critico';
  if (severity === 'high') return 'riesgo';
  return 'atencion';
}

// ════════════════════════════════════════════════════════════════════════════
// FUENTES INACTIVAS — para Visión Parcial (Condición 1)
// ════════════════════════════════════════════════════════════════════════════

const TODAS_LAS_FUENTES: ComplianceSource[] = [
  'ambiente_sano',
  'exit',
  'onboarding',
  'pulso',
];

/**
 * Devuelve la lista de fuentes que NO están activas en este ciclo.
 * El sistema NO diferencia "no contratado" vs "contratado sin data" — ambos
 * colapsan al mismo branch (decisión de scope confirmada con user).
 */
export function deriveInactiveSources(
  activeSources: ComplianceSource[]
): ComplianceSource[] {
  const activeSet = new Set(activeSources);
  return TODAS_LAS_FUENTES.filter((s) => !activeSet.has(s));
}
