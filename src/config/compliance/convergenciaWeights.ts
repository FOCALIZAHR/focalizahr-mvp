// src/config/compliance/convergenciaWeights.ts
// Pesos por tipo de alerta externa para Motor B (Fase 2 spec sec 3.3).
//
// Las alertas Exit (ExitAlert) y Onboarding (JourneyAlert) tienen pesos base
// distintos según su severidad clínica/legal. ExternalRiskScore las suma con
// factor de decaimiento histórico (Fase 2: siempre 1.0; Fase 3: 0.6/0.3/0.1).
//
// Bump 90d (Fase 2 implementado):
//   ABANDONO_DIA_1: peso 2 → 3 si 2+ casos en 90 días en el mismo dept
//   BIENVENIDA_FALLIDA: peso 1 → 2 si 2+ casos en 90 días en el mismo dept

/**
 * Peso base por alertType canónico.
 *
 * Exit alerts viven en `ExitAlert.alertType` con aliases que normalizamos
 * vía `EXIT_ALERT_TYPE_TO_CANONICAL` (ver exitActionPlans.ts:466-490).
 * Onboarding alerts viven en `JourneyAlert.alertType` (sin aliases).
 *
 * Si el motor encuentra un alertType desconocido, usa peso = 0 (defensive,
 * con warning en logs). No bloquea el flujo.
 */
export const PESO_BASE_ALERTA: Record<string, number> = {
  // Exit (canónicos post-normalización)
  ley_karin: 3,
  toxic_exit_detected: 3,
  liderazgo_concentracion: 2,
  department_exit_pattern: 2,
  nps_critico: 1,
  onboarding_correlation: 1,
  // Onboarding
  DESENGANCHE_CULTURAL: 3,
  ABANDONO_DIA_1: 2, // → 3 con bump 90d
  RIESGO_FUGA: 2,
  CONFUSION_ROL: 1,
  BIENVENIDA_FALLIDA: 1, // → 2 con bump 90d
};

/**
 * Tipos de alerta que califican como "crítica" para `tieneAlertaCritica`.
 * Spec sec 3.3: si alguna de estas tiene `pesoEfectivo >= 0.9`, el flag se
 * activa y amplifica `riesgo_convergente`.
 */
export const ALERTAS_CRITICAS: ReadonlyArray<string> = [
  'ley_karin',
  'toxic_exit_detected',
  'DESENGANCHE_CULTURAL',
];

/**
 * Threshold para considerar una alerta crítica activa en su peso efectivo.
 * Spec: `pesoEfectivo >= 0.9`.
 */
export const ALERTA_CRITICA_PESO_MIN = 0.9;

/**
 * Bump por casos en últimos 90 días (Fase 2).
 * Si hay 2+ casos del mismo alertType en el mismo dept, el peso base sube.
 */
export const BUMP_90D_THRESHOLD = 2;

export const BUMP_90D_RULES: Record<string, number> = {
  ABANDONO_DIA_1: 3,    // 2 → 3
  BIENVENIDA_FALLIDA: 2, // 1 → 2
};

/**
 * Tipos Onboarding (JourneyAlert.alertType) — para bump 90d.
 * Solo estos 2 califican; los otros tipos onboarding no tienen bump.
 */
export const BUMPABLE_ONBOARDING_TYPES: ReadonlyArray<string> = [
  'ABANDONO_DIA_1',
  'BIENVENIDA_FALLIDA',
];

/**
 * Aplica bump si corresponde. Idempotente — si no aplica, retorna el peso base.
 */
export function applyBumpIfApplicable(
  alertType: string,
  pesoBase: number,
  countLast90Days: number
): number {
  if (countLast90Days < BUMP_90D_THRESHOLD) return pesoBase;
  return BUMP_90D_RULES[alertType] ?? pesoBase;
}

/**
 * Thresholds para señales de score continuo (spec sec 3.1).
 */
export const EXO_SIGNAL_THRESHOLDS = {
  RISK: 70,    // ≥70 → 0 puntos, 50-69 → 1 punto
  CRITICAL: 50, // <50 → 2 puntos
} as const;

export const EIS_SIGNAL_THRESHOLDS = {
  RISK: 60,    // ≥60 → 0 puntos, 40-59 → 1 punto
  CRITICAL: 40, // <40 → 2 puntos
} as const;

/**
 * Threshold ISA para `fallaCicloDeVida` (spec sec 3.2).
 */
export const FALLA_CICLO_VIDA_ISA_MAX = 50;

/**
 * Mapping de aliases de Exit alerts a los canónicos del spec Motor B.
 *
 * NOTA: existen otros aliases internos en `exitActionPlans.ts` para action plans,
 * pero usan canónicos distintos (ej. `toxic_exit_detected → toxic_exit`).
 * El motor de convergencia usa los canónicos del spec sec 3.3 — este mapping
 * resuelve los aliases observados en BD a esos canónicos.
 */
const EXIT_ALIAS_TO_CANONICAL: Record<string, string> = {
  ley_karin: 'ley_karin',
  ley_karin_indicios: 'ley_karin',
  toxic_exit: 'toxic_exit_detected',
  toxic_exit_detected: 'toxic_exit_detected',
  nps_critico: 'nps_critico',
  nps_critical: 'nps_critico',
  liderazgo_concentracion: 'liderazgo_concentracion',
  concentrated_factor: 'liderazgo_concentracion',
  department_pattern: 'department_exit_pattern',
  department_exit_pattern: 'department_exit_pattern',
  onboarding_correlation: 'onboarding_correlation',
  onboarding_exit_correlation: 'onboarding_correlation',
};

/**
 * Normaliza un alertType de Exit a su canónico Motor B. Si no se encuentra,
 * retorna el input sin transformar (defensive — el motor decidirá si lo
 * trata como peso 0 o desconocido).
 */
export function normalizeExitAlertType(alertType: string): string {
  return EXIT_ALIAS_TO_CANONICAL[alertType] ?? alertType;
}
