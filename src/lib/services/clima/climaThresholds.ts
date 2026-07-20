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

// ════════════════════════════════════════════════════════════════════════════
// SEVERIDAD/TRIGGER A NIVEL REACTIVO + MEAN SCORE (Gate 2026-07-12)
// A-additive: NO toca riskZone / CLIMA_TARGET_FAVORABILITY / calcRiskZone.
// Baja la CAPA DE ACCIÓN (disparo + severidad del plan) de dimensión+fav a
// reactivo+mean. Todo PROVISIONAL — Victor calibra con datos reales apenas existan
// (mismo régimen que el diccionario 5A). Ver AS_BUILT_SEVERIDAD_REACTIVO_MEAN.md.
// ════════════════════════════════════════════════════════════════════════════

/**
 * Vara de mean (escala 1-5) bajo la cual un reactivo entra en atención.
 *
 * ⚠️ BENCHMARK FIJO — NO el promedio interno de la propia encuesta. DECISIÓN
 * DELIBERADA, la MISMA que Gate 3 (MAESTRO v3.7) tomó a nivel driver: si toda la
 * empresa está mal, el promedio interno también cae y ESCONDE la crisis justo
 * cuando es más grave. El camino alternativo (comparar contra el promedio interno)
 * se descartó a propósito, no por descuido.
 * PROVISIONAL — los valores los calibra Victor con datos reales.
 */
export const REACTIVE_MEAN_TARGET_TIERS = {
  TIER_RECURSOS: 3.3, // higiénicos: beneficios, carga_trabajo, estres, herramientas, ambiente_fisico
  TIER_ESTANDAR: 3.6, // default para todo el resto
} as const;
export type ReactiveMeanTier = keyof typeof REACTIVE_MEAN_TARGET_TIERS;

/** subcategory (reactivo) → tier. No listada → TIER_ESTANDAR (fallback EXPLÍCITO, no silencioso). */
export const REACTIVE_TIER_BY_SUBCATEGORY: Record<string, ReactiveMeanTier> = {
  beneficios: 'TIER_RECURSOS',    // reactivo REAL de la dimensión compensaciones (NO "compensaciones")
  carga_trabajo: 'TIER_RECURSOS',
  estres: 'TIER_RECURSOS',
  herramientas: 'TIER_RECURSOS',
  ambiente_fisico: 'TIER_RECURSOS',
};

/** Vara de mean del reactivo (fallback explícito a TIER_ESTANDAR). */
export function reactiveMeanTarget(subcategory: string): number {
  const tier = REACTIVE_TIER_BY_SUBCATEGORY[subcategory] ?? 'TIER_ESTANDAR';
  return REACTIVE_MEAN_TARGET_TIERS[tier];
}

/**
 * Reactivos que miden el MISMO constructo que el Engagement Index (permanencia,
 * recomendación, orgullo, experiencia global) → se EXCLUYEN del análisis de acción:
 * su impacto Pearson×EI está inflado por solapamiento de constructo (circularidad).
 * Confirmado con el texto real del banco 2026-07-12. PROVISIONAL.
 */
export const REACTIVE_CIRCULARITY_EXCLUDE = new Set<string>([
  'retencion',           // "Planeo continuar trabajando aquí…" ≈ EI "me veo en 2 años" / "rara vez busco"
  'recomendacion',       // "Recomendaría esta empresa…" ≈ EI NPS
  'orgullo',             // "Me siento orgulloso de trabajar…" ≈ EI "me siento orgulloso/a"
  'experiencia_general', // "Mi experiencia… ha sido positiva" — ítem global/summary, halo con EI
]);

/** Δmean mínimo para que un movimiento reactivo sea señal (Gallup Q12). PROVISIONAL. */
export const REACTIVE_MOMENTUM_MIN_DELTA = 0.2;

/** Δmean mínimo (escala 1-5) para narrar divergencia fav↔mean en el gauge org.
 *  Régimen 0.2 (mismo orden que REACTIVE_MOMENTUM_MIN_DELTA) pero desacoplado:
 *  mide divergencia del gauge, no momentum del reactivo. PROVISIONAL. */
export const CLIMA_DIVERGENCE_MEAN_MIN_DELTA = 0.2;

/** Fracción de reactivos medidos de una dimensión bajo su tier para marcarla sistémica. PROVISIONAL. */
export const REACTIVE_SYSTEMIC_RATIO = 0.5;

/**
 * Guardas DURAS de "sistémico" (además del ratio) — evitan que el ratio ≥0.5 marque sistémica
 * a una dimensión con denominador chico: con 1 reactivo medido 1/1=100% y con 2 reactivos 1/2=50%
 * dispararían sistémico por construcción (aritmética del denominador, no severidad real —
 * verificado en GATE4_LOBBY_DEMO, pulso-express). Ambas deben cumplirse:
 *   - REACTIVE_SYSTEMIC_MIN_MEASURED: piso de reactivos medidos (denominador) para que "sistémico"
 *     sea siquiera evaluable; con menos → tratamiento INDIVIDUAL.
 *   - REACTIVE_SYSTEMIC_MIN_BELOW: piso de reactivos bajo tier (numerador) — un solo reactivo bajo
 *     nunca es un patrón sistémico.
 * NO recalibra el 0.5 (que sigue rigiendo la fracción). PROVISIONAL.
 */
export const REACTIVE_SYSTEMIC_MIN_MEASURED = 3;
export const REACTIVE_SYSTEMIC_MIN_BELOW = 2;

/**
 * Piso mínimo de impacto (|coeficiente reactivo×EI|, hoy Kendall's Tau-c) para que un reactivo
 * pueda COMPETIR como palanca. Bajo este umbral el reactivo es ruido estadístico de impacto
 * insignificante y se retira de las recomendaciones de prioridad, sin importar qué tan bajo sea
 * su mean (Peakon/Culture Amp/Glint documentado). Se trata igual que `impact===null`: no gana por
 * priorityMean. PROVISIONAL — validado empíricamente: 0.20 vale igual en escala Tau-c que en
 * Pearson (ratio Tau-c/Pearson ≈ 1.01 sobre los 36 insights de prueba). NO recalibrar al migrar a Tau-c.
 */
export const REACTIVE_MIN_IMPACT = 0.20;

/**
 * Bandas de fuerza del impacto reactivo (escala Tau-c). PROVISIONAL — SOLO referencia de
 * interpretación/narrativa (futura UI); NO se cablea a lógica activa (el disparo/palanca lo
 * decide `REACTIVE_MIN_IMPACT` + priorityMean). `0.20` = frontera Medio/Bajo = el piso de palanca
 * (los reactivos "Bajo"/"Ruido" no compiten). Calibrar con datos reales.
 */
export const REACTIVE_STRENGTH_BANDS = {
  MUY_ALTO: 0.50, // ≥0.50
  ALTO: 0.30,     // 0.30–0.50
  MEDIO: 0.20,    // 0.20–0.30  (= REACTIVE_MIN_IMPACT, piso de palanca)
  BAJO: 0.10,     // 0.10–0.20
  // <0.10 → Ruido
} as const;

/**
 * Estado de momentum de un reactivo por su Δmean raw (current.mean − prev.mean).
 * null = sin período anterior medido. Umbral simétrico REACTIVE_MOMENTUM_MIN_DELTA.
 */
export type ReactiveMomentumState = 'declining' | 'stable' | 'improving';
export function reactiveMomentumState(delta: number | null): ReactiveMomentumState | null {
  if (delta === null) return null;
  if (delta <= -REACTIVE_MOMENTUM_MIN_DELTA) return 'declining';
  if (delta >= REACTIVE_MOMENTUM_MIN_DELTA) return 'improving';
  return 'stable';
}

/**
 * Severidad de un reactivo por la PROFUNDIDAD de su gapMean (mean − tier; negativo = bajo).
 * Cortes INDEPENDIENTES del valor del tier: gapMean ya normaliza cada reactivo contra su
 * propia vara → miden qué tan hondo es el fallo, no el nivel absoluto (dos ejes distintos).
 * Interno a la capa de acción — NO es calcRiskZone, NO se expone a otros consumidores.
 * PROVISIONAL — 1er candidato a recalibrar (gapMean −0.7 sobre TIER_ESTANDAR = mean 2.9).
 */
export const REACTIVE_SEVERITY_GAPMEAN_NARANJA = -0.3;
export const REACTIVE_SEVERITY_GAPMEAN_ROJA = -0.7;

export function reactiveSeverityZone(gapMean: number): RiskZone | null {
  if (gapMean >= 0) return null; // en/sobre la vara → no dispara
  if (gapMean < REACTIVE_SEVERITY_GAPMEAN_ROJA) return 'roja';
  if (gapMean < REACTIVE_SEVERITY_GAPMEAN_NARANJA) return 'naranja';
  return 'amarilla';
}
