// src/lib/services/clima/climaThresholds.ts
// ════════════════════════════════════════════════════════════════════════════
// Constantes de dominio + calcRiskZone de Clima — FUENTE ÚNICA (sin Prisma).
//
// Extraído de PulseEngine (Gate 3) para eliminar la duplicación client-safe: el
// motor (ClimaSynthesisEngine, que corre en el cliente vía ClimaIntroSequence) y
// la paleta (climaZonePalette) necesitan estos valores SIN bundlear prisma
// (PulseEngine → GoalsDiagnosticService → prisma). Antes se duplicaban a mano;
// ahora hay un solo origen y cero riesgo de divergencia.
//
// EXTRACCIÓN PURA: mismos valores, misma lógica que el Gate 3 sellado. PulseEngine
// re-exporta todo esto para no romper a sus importadores.
//
// Decisiones Victor 2026-07-07 — editables por dev, NO configurables por cliente
// (comparabilidad del diagnóstico entre cuentas).
// ════════════════════════════════════════════════════════════════════════════

export type RiskZone = 'verde' | 'amarilla' | 'naranja' | 'roja';

/**
 * riskZone sobre engagementFavorability (0-100). Anclas 75/60 = estándar de
 * dashboard diario de la industria (Culture Amp: verde ≥75%, amarillo 60-74%,
 * rojo <60%). DISTINTO del modelo de cuartiles (80/70/60) reservado para el
 * benchmarking de mercado (Gate 6C) — coexisten: alerta operativa diaria vs
 * posicionamiento contra el mercado.
 */
export const RISK_ZONE_THRESHOLDS = {
  VERDE_MIN_FAV: 75, // ≥75 verde
  AMARILLA_MIN_FAV: 65, // 65-74.9 amarilla
  NARANJA_MIN_FAV: 60, // 60-64.9 naranja → <60 roja
} as const;

/** Estados de momentum en pp de favorability (MAESTRO ALG 3). */
export const MOMENTUM_CRISIS_PP = -10;
export const MOMENTUM_DECLINING_PP = -5;
export const MOMENTUM_GROWING_PP = 5;

/**
 * Referencia de priorización de gaps (ALG 1): gap = fav − target.
 * Constante SEPARADA de RISK_ZONE_THRESHOLDS.VERDE_MIN_FAV aunque hoy compartan
 * valor — son conceptos distintos (clasificación de riesgo vs referencia de
 * priorización) y pueden divergir. Ancla: cuartil superior de mercado (Culture
 * Amp). Gate 6C migra gapBasis 'fixed_target' → benchmark real pulse_climate.
 */
export const CLIMA_TARGET_FAVORABILITY = 75;

/** Driver de liderazgo en la taxonomía REAL del banco de preguntas. */
export const LEADERSHIP_DRIVER = 'liderazgo';

/**
 * Umbral n≥5 del sistema: privacidad + activación del motor (Gate 4.5a) + cruce
 * cross-signal exit/onboarding. Estándar Gallup ("minimum number of responses
 * before reporting" — gate binario, no descuento gradual).
 */
export const CLIMA_MIN_RESPONDENTS = 5;

const ZONE_ORDER: readonly RiskZone[] = ['verde', 'amarilla', 'naranja', 'roja'];

/**
 * riskZone sobre favorability con modulación por momentum: crisis
 * (≤ MOMENTUM_CRISIS_PP) degrada UNA zona — solo degrada, nunca mejora (un 78%
 * cayendo 12pp no es verde). Con momentum null (p.ej. gold cache rolling 12m,
 * sin momentum puntual) no modula.
 */
export function calcRiskZone(fav: number | null, momentum: number | null): RiskZone | null {
  if (fav === null) return null;
  let zone: RiskZone;
  if (fav >= RISK_ZONE_THRESHOLDS.VERDE_MIN_FAV) zone = 'verde';
  else if (fav >= RISK_ZONE_THRESHOLDS.AMARILLA_MIN_FAV) zone = 'amarilla';
  else if (fav >= RISK_ZONE_THRESHOLDS.NARANJA_MIN_FAV) zone = 'naranja';
  else zone = 'roja';

  if (momentum !== null && momentum <= MOMENTUM_CRISIS_PP) {
    const idx = ZONE_ORDER.indexOf(zone);
    zone = ZONE_ORDER[Math.min(idx + 1, ZONE_ORDER.length - 1)];
  }
  return zone;
}
