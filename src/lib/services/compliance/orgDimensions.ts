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
