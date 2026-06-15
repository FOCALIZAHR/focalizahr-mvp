// src/lib/services/compliance/ISAService.ts
// ISA — Índice de Seguridad del Ambiente (0-100).
//
// Combina 3 componentes con pesos dinámicos según disponibilidad de instrumentos:
//   1. Voz estructurada (Likert P2-P8 agregado → 0-100, penalizado si Teatro).
//   2. Voz libre (análisis LLM de P1 → 0-100; inverso a intensidad promedio).
//   3. Convergencia (señales cruzadas → 0-100; solo si >=2 instrumentos activos).
//
// Pesos:
//   - 3 componentes disponibles: 60% / 25% / 15%
//   - 2 componentes (sin convergencia): 70% / 30%
//   - 1 componente (solo Likert): 100%
//
// Uso: se invoca después de SafetyScore + Patrones + Convergencia. El resultado
// se persiste como columna `isaScore` en ComplianceAnalysis + entra a las
// narrativas como hero del reporte.

import type { PatronDetectado, ConfianzaAnalisis } from './complianceTypes';
// Léxico ISA canónico: clasificador y nivel únicos viven en classifyIsa /
// IsaLevel (constants del módulo). Import type-only → sin ciclo en runtime.
import type { IsaLevel } from '@/app/dashboard/compliance/components/sections/SectionDimensiones/_shared/constants';

export interface ISAInput {
  /** Safety Score Likert 0-5 (agregado P2-P8 ponderado). */
  safetyScore: number;
  /** Patrones detectados por LLM en P1. */
  patrones: PatronDetectado[];
  /** Confianza del análisis LLM. Si es insuficiente_data, se ignora la voz libre. */
  confianzaLLM: ConfianzaAnalisis;
  /** Número de señales convergentes cruzadas (0-4: Ambiente, Exit, EXO, Pulso). */
  convergenciaSignals: number;
  /** Cuántos instrumentos tiene activos el cliente (1-4). */
  activeSources: number;
  /** Flag: puntajes altos pero patrones LLM de alta intensidad = contradicción. */
  teatroCumplimiento: boolean;
}

/**
 * Resultado del ISA con desglose de componentes y pesos aplicados.
 * `score` es el ISA final (0-100); `components` expone de qué está hecho
 * — consumido por la Cascada Ejecutiva (Acto Ancla).
 */
export interface ISAResult {
  /** ISA final 0-100, redondeado. Mismo valor que retorna calculateISA(). */
  score: number;
  components: {
    /** Voz estructurada 0-100 (siempre existe). Redondeada. */
    vozEstructurada: number;
    /** Voz libre 0-100, o null si confianzaLLM = 'insuficiente_data'. Redondeada. */
    vozLibre: number | null;
    /** Convergencia 0-100, o null si activeSources < 2. */
    convergencia: number | null;
    /** Pesos aplicados según disponibilidad (60/25/15 · 70/30/0 · 100/0/0). */
    pesos: { estructurada: number; libre: number; convergencia: number };
    /** true si se aplicó la penalización 0.7 por Teatro de Cumplimiento. */
    teatroPenalty: boolean;
  };
}

/**
 * Calcula el ISA con desglose de componentes y pesos.
 * Fuente única de verdad de la fórmula — calculateISA() delega aquí.
 */
export function calculateISAWithComponents(input: ISAInput): ISAResult {
  // Componente 1 — Voz estructurada (Likert 0-5 → 0-100).
  let vozEstructurada = (input.safetyScore / 5) * 100;
  if (input.teatroCumplimiento) {
    // Los números dicen una cosa, las respuestas otra. Penalización 30%.
    vozEstructurada *= 0.7;
  }

  // Componente 2 — Voz libre (LLM P1 → 0-100; inverso a intensidad promedio).
  let vozLibre: number | null = null;
  if (input.confianzaLLM !== 'insuficiente_data') {
    if (input.patrones.length > 0) {
      const promIntensidad =
        input.patrones.reduce((s, p) => s + p.intensidad, 0) / input.patrones.length;
      vozLibre = (1 - promIntensidad) * 100;
    } else {
      // Ambiente sano: LLM corrió con confianza pero no detectó patrones.
      vozLibre = 100;
    }
  }

  // Componente 3 — Convergencia (0-100) solo si el cliente tiene >=2 instrumentos.
  let convergencia: number | null = null;
  if (input.activeSources >= 2) {
    const MAP: Record<number, number> = { 0: 100, 1: 75, 2: 50, 3: 25, 4: 0 };
    convergencia = MAP[Math.min(input.convergenciaSignals, 4)];
  }

  // Pesos dinámicos según disponibilidad.
  let isa: number;
  let pesos: { estructurada: number; libre: number; convergencia: number };
  if (convergencia !== null && vozLibre !== null) {
    isa = vozEstructurada * 0.6 + vozLibre * 0.25 + convergencia * 0.15;
    pesos = { estructurada: 60, libre: 25, convergencia: 15 };
  } else if (vozLibre !== null) {
    isa = vozEstructurada * 0.7 + vozLibre * 0.3;
    pesos = { estructurada: 70, libre: 30, convergencia: 0 };
  } else {
    isa = vozEstructurada;
    pesos = { estructurada: 100, libre: 0, convergencia: 0 };
  }

  return {
    score: Math.round(isa),
    components: {
      vozEstructurada: Math.round(vozEstructurada),
      vozLibre: vozLibre !== null ? Math.round(vozLibre) : null,
      convergencia,
      pesos,
      teatroPenalty: input.teatroCumplimiento,
    },
  };
}

/**
 * Calcula el ISA (0-100). Redondea al entero más cercano.
 * NO prescribe — retorna puntaje. La interpretación de nivel es separada
 * (ver classifyIsa, fuente única). Delega en calculateISAWithComponents().
 */
export function calculateISA(input: ISAInput): number {
  return calculateISAWithComponents(input).score;
}

/**
 * Opción A (fallback-only) — resuelve el orgISA org-level.
 * - bottomUp existe (promedio ponderado de ISAs por depto) → se usa tal cual.
 *   NUNCA se sobrescribe: candado de la cascada sellada (el 49 no se mueve).
 * - bottomUp null (ningún depto alcanzó n>=5) pero hay safety org (agregado
 *   directo pooled, total >=5) → ISA safety-only (1-componente), `isaParcial`.
 *   Sin voz libre ni convergencia (el análisis por-depto no corrió).
 * - sin safety org → null.
 * Pure.
 */
export function resolveOrgIsa(input: {
  bottomUpIsa: number | null;
  orgSafetyScore: number | null;
}): { isa: number | null; isaParcial: boolean } {
  if (input.bottomUpIsa !== null) {
    return { isa: input.bottomUpIsa, isaParcial: false };
  }
  if (input.orgSafetyScore !== null) {
    return {
      isa: calculateISA({
        safetyScore: input.orgSafetyScore,
        patrones: [],
        confianzaLLM: 'insuficiente_data',
        convergenciaSignals: 0,
        activeSources: 1,
        teatroCumplimiento: false,
      }),
      isaParcial: true,
    };
  }
  return { isa: null, isaParcial: false };
}

/**
 * Agrega isaComponents por-departamento en un isaComponents org-level.
 * Cada componente = promedio ponderado por respondentCount sobre los deptos
 * donde el componente no es null. Los pesos org se derivan de la
 * disponibilidad org-level (mismo árbol que calculateISAWithComponents);
 * teatroPenalty es true si algún depto lo tuvo.
 * Retorna null si ningún depto tiene componentes (campañas legacy).
 */
export function aggregateOrgIsaComponents(
  completedDepts: Array<{ resultPayload: unknown; respondentCount: number | null }>,
  activeSourcesGlobal: readonly unknown[],
): ISAResult['components'] | null {
  let estrW = 0, estrS = 0, libreW = 0, libreS = 0, convW = 0, convS = 0;
  let teatroPenalty = false;
  let anyComponents = false;

  for (const d of completedDepts) {
    const payload = d.resultPayload as Record<string, unknown> | null;
    const comp = payload?.isaComponents as ISAResult['components'] | undefined;
    if (!comp) continue;
    anyComponents = true;
    const w = d.respondentCount ?? 0;
    if (w <= 0) continue;
    estrS += comp.vozEstructurada * w;
    estrW += w;
    if (comp.vozLibre !== null) {
      libreS += comp.vozLibre * w;
      libreW += w;
    }
    if (comp.convergencia !== null) {
      convS += comp.convergencia * w;
      convW += w;
    }
    if (comp.teatroPenalty) teatroPenalty = true;
  }
  if (!anyComponents) return null;

  const vozEstructurada = estrW > 0 ? Math.round(estrS / estrW) : 0;
  const vozLibre = libreW > 0 ? Math.round(libreS / libreW) : null;
  const convergencia = convW > 0 ? Math.round(convS / convW) : null;

  let pesos: { estructurada: number; libre: number; convergencia: number };
  if (activeSourcesGlobal.length >= 2 && convergencia !== null && vozLibre !== null) {
    pesos = { estructurada: 60, libre: 25, convergencia: 15 };
  } else if (vozLibre !== null) {
    pesos = { estructurada: 70, libre: 30, convergencia: 0 };
  } else {
    pesos = { estructurada: 100, libre: 0, convergencia: 0 };
  }
  return { vozEstructurada, vozLibre, convergencia, pesos, teatroPenalty };
}

// ═══════════════════════════════════════════════════════════════════
// Etiquetas ejecutivas por nivel ISA.
// ═══════════════════════════════════════════════════════════════════
//
// Clasificador y cortes: fuente única = classifyIsa / SCORE_THRESHOLDS
// (constants del módulo). Cortes display 0-100: 80 (raw 4.0) / 60 (raw 3.0) /
// 40 (raw 2.0). PENDIENTE — revisión metodológica: convención Likert, NO
// validada para instrumento psicosocial Ley Karin. Si cambia, se cambia en
// SCORE_THRESHOLDS y todo el módulo lo hereda.
//
// Gate de limpieza (2026-06-14): getISARiskLevel + ISARiskLevel descongelados;
// el módulo entero usa classifyIsa / IsaLevel (sano/atencion/riesgo/critico).

export const ISA_LABELS: Record<
  IsaLevel,
  { label: string; descripcion: string }
> = {
  sano: {
    label: 'Sano',
    descripcion: 'El ambiente funciona. Monitorear.',
  },
  atencion: {
    label: 'Atención',
    descripcion: 'Hay señales. No ignorar.',
  },
  riesgo: {
    label: 'Riesgo',
    descripcion: 'Señales que ameritan revisión.',
  },
  critico: {
    label: 'Crítico',
    descripcion: 'Señales que convergen. Prioridad alta.',
  },
};
