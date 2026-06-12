// src/lib/services/compliance/orgDimensions.ts
// ════════════════════════════════════════════════════════════════════════════
// Promedio org-level ponderado por respondentCount de las 6 dimensiones del
// instrumento Ambiente Sano (P2/P3/P4/P5/P7/P8). Helper compartido — fuente
// única del cómputo que hoy está duplicado en:
//   - ActoAnatomia.tsx:66-95 (Beat 3)  → PENDIENTE migrar a este helper
//   - AmbienteRiskOrchestrator.buildOrgDimensionAverages (privado) → idem
// Extraído al cablear la Apertura (Beat 1) para no agregar un 3er duplicado.
// La migración de los dos consumidores existentes es deuda aparte (toca su
// cuerpo, no solo un import).
// ════════════════════════════════════════════════════════════════════════════

import {
  classifyDimensionLevel,
  type ComplianceDimensionKey,
  type ComplianceDimensionLevel,
} from '@/config/narratives/ComplianceNarrativeDictionary';
import type { ComplianceReportDepartment } from '@/types/compliance';

/** Las 6 dimensiones del ISA, en orden. P6 (router condicional) y P1 (texto
 *  abierto) NO son dimensiones. */
export const ORG_DIMENSION_KEYS: ComplianceDimensionKey[] = [
  'P2_seguridad',
  'P3_disenso',
  'P4_microagresiones',
  'P5_equidad',
  'P7_liderazgo',
  'P8_agotamiento',
];

export interface OrgDimension {
  key: ComplianceDimensionKey;
  /** Promedio 1-5 ponderado por respondentCount (P4/P8 ya invertidas upstream). */
  valor: number;
  /** Nivel canónico de 4 (`classifyDimensionLevel`, crítico <2.0). */
  level: ComplianceDimensionLevel;
}

/**
 * Promedia las 6 dimensiones org-level ponderando por respondentCount. Solo
 * emite las que tienen masa (Σw>0) — una dim sin respondentes se OMITE (no se
 * afirma "sin dato" ni se asume 0). Pure.
 *
 * Mismo cómputo que `ActoAnatomia:66-95` y `buildOrgDimensionAverages`.
 */
export function computeOrgDimensions(
  departments: ComplianceReportDepartment[],
): OrgDimension[] {
  const out: OrgDimension[] = [];
  for (const key of ORG_DIMENSION_KEYS) {
    let weighted = 0;
    let total = 0;
    for (const dept of departments) {
      const v = dept.dimensionScores?.[key];
      const w = dept.respondentCount ?? 0;
      if (typeof v === 'number' && w > 0) {
        weighted += v * w;
        total += w;
      }
    }
    if (total === 0) continue; // sin masa → se omite
    const valor = weighted / total;
    out.push({ key, valor, level: classifyDimensionLevel(valor) });
  }
  return out;
}

// ════════════════════════════════════════════════════════════════════════════
// dimFoco — Gate 3 §1 (NUEVO, determinista, sin LLM)
// ════════════════════════════════════════════════════════════════════════════
// Regla "doble filtro": entre las dimensiones del NIVEL MÁS GRAVE presente
// (crítico → riesgo → atención, vía `classifyDimensionLevel`), gana la de mayor
// PRECEDENCIA CAUSAL. Si todas en sano → sin foco (null, forma TODO SANO).
//
// Racional: la gravedad manda primero (una dim crítica gana a una en riesgo
// aunque la otra tenga mayor precedencia); a igual gravedad, la precedencia
// causal decide cuál condiciona a las demás.

/** Precedencia causal de las 6 dimensiones (Gate 3 §1). Menor índice = gana. */
export const DIM_FOCO_PRECEDENCE: ComplianceDimensionKey[] = [
  'P2_seguridad', // 1. Seguridad psicológica
  'P7_liderazgo', // 2. Calidad de liderazgo
  'P3_disenso', // 3. Manejo del disenso
  'P5_equidad', // 4. Equidad de reglas
  'P4_microagresiones', // 5. Respeto cotidiano
  'P8_agotamiento', // 6. Sostenibilidad relacional
];

/** Severidad de cada nivel (menor = más grave). sano nunca es foco. */
const LEVEL_SEVERITY: Record<ComplianceDimensionLevel, number> = {
  critico: 0,
  riesgo: 1,
  atencion: 2,
  sano: 3,
};

/**
 * Elige la dimensión foco por doble filtro: nivel más grave presente, luego
 * precedencia causal. null si todas en sano. Pure.
 */
export function dimFoco(dims: OrgDimension[]): OrgDimension | null {
  const noSano = dims.filter((d) => d.level !== 'sano');
  if (noSano.length === 0) return null;
  // Filtro 1 — nivel más grave presente.
  const worst = Math.min(...noSano.map((d) => LEVEL_SEVERITY[d.level]));
  const atWorst = noSano.filter((d) => LEVEL_SEVERITY[d.level] === worst);
  // Filtro 2 — precedencia causal (menor índice gana).
  atWorst.sort(
    (a, b) =>
      DIM_FOCO_PRECEDENCE.indexOf(a.key) - DIM_FOCO_PRECEDENCE.indexOf(b.key),
  );
  return atWorst[0];
}

// ════════════════════════════════════════════════════════════════════════════
// Display 0–100 — Gate 3 §2 (NUEVO, solo presentación)
// ════════════════════════════════════════════════════════════════════════════
// Fuente ÚNICA de conversión: el motor sigue en 1–5; la cascada habla "de 100".
// Umbrales de display (75/50/25) son espejo EXACTO de `classifyDimensionLevel`
// (4.0/3.0/2.0 → 75/50/25): sano ≥75 · atención ≥50 · riesgo ≥25 · crítico <25.

/** Convierte un score Likert 1–5 a display 0–100, redondeado. */
export function toDisplay100(score1to5: number): number {
  return Math.round(((score1to5 - 1) / 4) * 100);
}

/** Umbrales de display (espejo de classifyDimensionLevel). Para narrativa de
 *  escala y oráculos — el nivel canónico sigue saliendo de classifyDimensionLevel. */
export const DISPLAY_THRESHOLDS = {
  sano: 75,
  atencion: 50,
  riesgo: 25,
} as const;
