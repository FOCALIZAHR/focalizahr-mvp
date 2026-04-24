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
 * Calcula el ISA (0-100). Redondea al entero más cercano.
 * NO prescribe — retorna puntaje. La interpretación de nivel es separada
 * (ver getISARiskLevel).
 */
export function calculateISA(input: ISAInput): number {
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
  if (convergencia !== null && vozLibre !== null) {
    isa = vozEstructurada * 0.6 + vozLibre * 0.25 + convergencia * 0.15;
  } else if (vozLibre !== null) {
    isa = vozEstructurada * 0.7 + vozLibre * 0.3;
  } else {
    isa = vozEstructurada;
  }

  return Math.round(isa);
}

// ═══════════════════════════════════════════════════════════════════
// Niveles de riesgo y etiquetas ejecutivas.
// ═══════════════════════════════════════════════════════════════════

export type ISARiskLevel = 'saludable' | 'observacion' | 'riesgo' | 'critico';

export function getISARiskLevel(isa: number): ISARiskLevel {
  if (isa >= 80) return 'saludable';
  if (isa >= 60) return 'observacion';
  if (isa >= 40) return 'riesgo';
  return 'critico';
}

export const ISA_LABELS: Record<
  ISARiskLevel,
  { label: string; descripcion: string }
> = {
  saludable: {
    label: 'Saludable',
    descripcion: 'El ambiente funciona. Monitorear.',
  },
  observacion: {
    label: 'En observación',
    descripcion: 'Hay señales. No ignorar.',
  },
  riesgo: {
    label: 'En riesgo',
    descripcion: 'Problemas confirmados. Actuar.',
  },
  critico: {
    label: 'Crítico',
    descripcion: 'Convergencia de señales. Urgente.',
  },
};
