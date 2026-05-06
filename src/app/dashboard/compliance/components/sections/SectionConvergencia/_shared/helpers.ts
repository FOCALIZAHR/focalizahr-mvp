// Helpers puros para SectionConvergencia v2 (rebuild final).
// Plan: .claude/tasks/PLAN_UI_C3_SECCION_CONVERGENCIA_v2.md

import type {
  ComplianceReportResponse,
  ComplianceReportAlert,
  DepartmentConvergencia,
} from '@/types/compliance';
import type {
  ConvergenciaInternaResult,
  ConvergenciaExternaResult,
  NivelFinal,
  CasoMotorA,
} from '@/lib/services/compliance/ConvergenciaEngine';
import type { DepartmentSafetyScore } from '@/lib/services/SafetyScoreService';

// ════════════════════════════════════════════════════════════════════════════
// Tipo unificado MergedDept
// ════════════════════════════════════════════════════════════════════════════

/**
 * Departamento con todos los datos cruzados que la UI necesita.
 * Combina:
 *   - report.data.convergencia.departments[i] (Motor A/B/nivelFinal)
 *   - report.data.departments[i] (isaScore, dimensionScores, deltaVsAnterior)
 *   - report.data.alerts filtradas por departmentId
 *   - previousIsaScore derivado (isaScore - deltaVsAnterior)
 *   - a4Partner si dept está en grupo criticalByManager
 */
export interface MergedDept {
  departmentId: string;
  departmentName: string;
  convergenciaInterna: ConvergenciaInternaResult;
  convergenciaExterna: ConvergenciaExternaResult;
  nivelFinal: NivelFinal;
  isaScore: number | null;
  deltaVsAnterior: number | null;
  previousIsaScore: number | null;
  dimensionScores: DepartmentSafetyScore['dimensionScores'];
  teatroCumplimiento: boolean;
  complianceAlerts: ComplianceReportAlert[];
  a4Partner?: A4PartnerInfo;
}

export interface A4PartnerInfo {
  departmentName: string;
  isaScore: number;
  deltaIsa: number;
}

const EMPTY_DIMENSIONS: DepartmentSafetyScore['dimensionScores'] = {
  P2_seguridad: null,
  P3_disenso: null,
  P4_microagresiones: null,
  P5_equidad: null,
  P7_liderazgo: null,
  P8_agotamiento: null,
};

// ════════════════════════════════════════════════════════════════════════════
// Defaults defensivos — backward compat con campañas legacy
// ════════════════════════════════════════════════════════════════════════════
//
// El JSON persistido en `result_payload.convergencia` para campañas cerradas
// ANTES de los commits 2b08d38/872856f/5089e54 NO tiene los sub-objetos
// `convergenciaInterna` / `convergenciaExterna` / `nivelFinal`.
//
// route.ts hace passthrough crudo. La defensa vive acá:
// `mergeDepartmentData` aplica defaults si los sub-objetos faltan.
// El backfill (script C) regenera los JSON legacy — pero hasta que corra,
// estos defaults previenen el crash del frontend.

const EMPTY_INTERNA: ConvergenciaInternaResult = {
  casosActivos: [],
  nivelConvergencia: 'ninguna',
  teatroDetectado: false,
  silencioDetectado: false,
  enCriticalByManagerGroup: false,
};

const EMPTY_EXTERNA: ConvergenciaExternaResult = {
  exoSignal: 0,
  eisSignal: 0,
  pesoAlertas: 0,
  scoreTotal: 0,
  tieneAlertaCritica: false,
  fallaCicloDeVida: false,
  alertasConsideradas: [],
};

// ════════════════════════════════════════════════════════════════════════════
// derivePreviousIsa
// ════════════════════════════════════════════════════════════════════════════

/**
 * Deriva el ISA del ciclo anterior desde isaScore actual + deltaVsAnterior.
 * Defensive: si delta o isa son null → null. Si previous calculado es
 * negativo o > 100 (degenerado), también null.
 */
export function derivePreviousIsa(
  isaScore: number | null,
  deltaVsAnterior: number | null
): number | null {
  if (isaScore === null || deltaVsAnterior === null) return null;
  const previous = isaScore - deltaVsAnterior;
  if (previous < 0 || previous > 100) return null;
  return previous;
}

// ════════════════════════════════════════════════════════════════════════════
// findA4Partner — busca el partner con mayor delta ISA en el grupo criticalByManager
// ════════════════════════════════════════════════════════════════════════════

/**
 * Para un dept en grupo criticalByManager, encuentra el partner con mayor
 * delta ISA. Decisión arquitectónica (decisión 3): mostrar solo el partner
 * más distinto visualmente — la narrativa A4 menciona "otro departamento" en singular.
 */
export function findA4Partner(
  report: ComplianceReportResponse,
  departmentId: string
): A4PartnerInfo | undefined {
  const groups = report.data.convergencia.criticalByManager;
  const myGroup = groups.find((g) => g.departmentIds.includes(departmentId));
  if (!myGroup || myGroup.departmentIds.length < 2) return undefined;

  // Lookup ISA de cada dept del grupo
  const myDept = report.data.departments.find((d) => d.departmentId === departmentId);
  if (!myDept || myDept.isaScore === null) return undefined;

  let bestPartner: A4PartnerInfo | undefined;
  let bestDelta = 0;
  for (const otherId of myGroup.departmentIds) {
    if (otherId === departmentId) continue;
    const otherDept = report.data.departments.find((d) => d.departmentId === otherId);
    if (!otherDept || otherDept.isaScore === null) continue;
    const delta = Math.abs(myDept.isaScore - otherDept.isaScore);
    if (delta > bestDelta) {
      bestDelta = delta;
      bestPartner = {
        departmentName: otherDept.departmentName,
        isaScore: otherDept.isaScore,
        deltaIsa: delta,
      };
    }
  }
  return bestPartner;
}

// ════════════════════════════════════════════════════════════════════════════
// mergeDepartmentData — construye MergedDept desde los 3 arrays del payload
// ════════════════════════════════════════════════════════════════════════════

export function mergeDepartmentData(
  report: ComplianceReportResponse,
  convergencia: DepartmentConvergencia
): MergedDept {
  const reportDept = report.data.departments.find(
    (d) => d.departmentId === convergencia.departmentId
  );
  const alerts = report.data.alerts.filter(
    (a) => a.departmentId === convergencia.departmentId
  );
  const previousIsaScore = derivePreviousIsa(
    reportDept?.isaScore ?? null,
    reportDept?.deltaVsAnterior ?? null
  );

  // Defensive: campañas legacy cerradas pre-Fase-1/2/3 no tienen los
  // sub-objetos en el JSON persistido. route.ts hace passthrough crudo →
  // aplicamos defaults vacíos acá. El backfill (script C) regenera los JSON
  // legacy con valores reales, pero hasta entonces estos defaults previenen
  // el crash del frontend y dejan el dept fuera de la lista de convergentes.
  const interna: ConvergenciaInternaResult =
    convergencia.convergenciaInterna ?? EMPTY_INTERNA;
  const externa: ConvergenciaExternaResult =
    convergencia.convergenciaExterna ?? EMPTY_EXTERNA;
  const nivelFinal: NivelFinal = convergencia.nivelFinal ?? 'ninguna';

  const a4Partner = interna.enCriticalByManagerGroup
    ? findA4Partner(report, convergencia.departmentId)
    : undefined;

  return {
    departmentId: convergencia.departmentId,
    departmentName: convergencia.departmentName,
    convergenciaInterna: interna,
    convergenciaExterna: externa,
    nivelFinal,
    isaScore: reportDept?.isaScore ?? null,
    deltaVsAnterior: reportDept?.deltaVsAnterior ?? null,
    previousIsaScore,
    dimensionScores: reportDept?.dimensionScores ?? EMPTY_DIMENSIONS,
    teatroCumplimiento: reportDept?.teatroCumplimiento ?? false,
    complianceAlerts: alerts,
    a4Partner,
  };
}

// ════════════════════════════════════════════════════════════════════════════
// Header state machine — 5 estados
// ════════════════════════════════════════════════════════════════════════════

export type HeaderState =
  | 'critical_by_manager'   // Estado 1 — precedencia
  | 'falla_ciclo_vida'      // Estado 2
  | 'teatro_detectado'      // Estado 3
  | 'convergencia_multiple' // Estado 4
  | 'sin_convergencia';     // Estado 5

/**
 * Clasifica el estado del header según los flags agregados de los deptos.
 * Orden de evaluación (decisión 6): criticalByManager > fallaCicloDeVida >
 * teatro > múltiple > sin convergencia.
 */
export function classifyHeaderState(deptos: MergedDept[]): HeaderState {
  if (deptos.some((d) => d.convergenciaInterna.enCriticalByManagerGroup)) {
    return 'critical_by_manager';
  }
  if (deptos.some((d) => d.convergenciaExterna.fallaCicloDeVida)) {
    return 'falla_ciclo_vida';
  }
  if (deptos.some((d) => d.convergenciaInterna.teatroDetectado)) {
    return 'teatro_detectado';
  }
  const conConvergenciaCount = deptos.filter(
    (d) => d.convergenciaInterna.nivelConvergencia !== 'ninguna'
  ).length;
  if (conConvergenciaCount >= 2) {
    return 'convergencia_multiple';
  }
  return 'sin_convergencia';
}

// ════════════════════════════════════════════════════════════════════════════
// byUrgencia — sort de bandas por urgencia descendente
// ════════════════════════════════════════════════════════════════════════════

const NIVEL_RANK: Record<ConvergenciaInternaResult['nivelConvergencia'], number> = {
  ninguna: 0,
  simple: 1,
  multiple: 2,
  critica: 3,
};

/**
 * Comparator para ordenar deptos. Tie-break:
 *   1. nivelConvergencia (critica > multiple > simple > ninguna)
 *   2. tieneAlertaCritica (true antes que false)
 *   3. scoreTotal (mayor primero)
 *   4. departmentName (alfabético, fallback determinista)
 */
export function byUrgencia(a: MergedDept, b: MergedDept): number {
  const nivelDiff =
    NIVEL_RANK[b.convergenciaInterna.nivelConvergencia] -
    NIVEL_RANK[a.convergenciaInterna.nivelConvergencia];
  if (nivelDiff !== 0) return nivelDiff;

  const critA = a.convergenciaExterna.tieneAlertaCritica ? 1 : 0;
  const critB = b.convergenciaExterna.tieneAlertaCritica ? 1 : 0;
  if (critA !== critB) return critB - critA;

  const scoreDiff =
    b.convergenciaExterna.scoreTotal - a.convergenciaExterna.scoreTotal;
  if (scoreDiff !== 0) return scoreDiff;

  return a.departmentName.localeCompare(b.departmentName);
}

// ════════════════════════════════════════════════════════════════════════════
// Empty state variant
// ════════════════════════════════════════════════════════════════════════════

export type EmptyStateVariant =
  | 'sin_ciclo'           // No hay análisis completado
  | 'sin_convergencia'    // Hay deptos analizados pero ninguno con convergencia
  | 'solo_motor_a';       // Activo Motor A pero sin productos externos contratados

/**
 * Determina cuál variante de empty state mostrar.
 * - sin_ciclo: convergencia.departments vacío.
 * - solo_motor_a: 1 sola fuente activa (ambiente_sano) + cero alertas externas.
 * - sin_convergencia: hay deptos con multi-fuente pero ninguno tiene convergencia grave.
 */
export function getEmptyStateVariant(
  report: ComplianceReportResponse
): EmptyStateVariant {
  const conv = report.data.convergencia;
  if (conv.departments.length === 0) return 'sin_ciclo';
  if (conv.activeSources.length <= 1) return 'solo_motor_a';
  return 'sin_convergencia';
}

// ════════════════════════════════════════════════════════════════════════════
// Alert SLA helpers
// ════════════════════════════════════════════════════════════════════════════

export interface AlertSlaSplit {
  enTiempo: ComplianceReportAlert[];
  vencidas: ComplianceReportAlert[];
  sinSLA: ComplianceReportAlert[];
}

/**
 * Particiona alertas por estado de SLA. Filtra resolved/dismissed.
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
    if (due.getTime() < now.getTime()) out.vencidas.push(a);
    else out.enTiempo.push(a);
  }
  return out;
}

/**
 * Mapea severity del backend al level de upsertDecision.
 */
export function severityToLevel(
  severity: string
): 'atencion' | 'riesgo' | 'critico' {
  if (severity === 'critical') return 'critico';
  if (severity === 'high') return 'riesgo';
  return 'atencion';
}

// ════════════════════════════════════════════════════════════════════════════
// Re-export tipos del engine para que los componentes solo importen de helpers
// ════════════════════════════════════════════════════════════════════════════

export type { CasoMotorA, NivelFinal };
