// src/lib/services/clima/assembleClimaDecisionInputs.ts
// ════════════════════════════════════════════════════════════════════════════
// EX Clima — Gate 5D Paso 0: el "ensamblado" (assembler).
//
// El CONECTOR faltante entre el diagnóstico persistido y el builder puro.
// Gate 2/3 persistieron driverAnalysis (DriverImpact[]) + reactiveAnalysis
// (ReactiveImpact[]) + correlationFlags en DepartmentClimaInsight. El builder
// (ClimaActionPlanBuilder.buildClimaPlanDecisions) espera ClimaDeptDecisionInput[].
// Hasta ahora ese input solo lo armaba un smoke a mano — este archivo lo arma
// desde las filas persistidas.
//
// PURO / client-safe: sin prisma. Recibe filas ya leídas (shape mínimo AssemblerRow)
// y reshapea 1:1 — NO deriva gapMean/priorityMean/isSystemic (los deriva el builder)
// ni filtra por taxonomía (el builder llama isClimaDriverCategory).
// ════════════════════════════════════════════════════════════════════════════

import type {
  ClimaDeptDecisionInput,
  ClimaDriverForDecision,
} from '@/types/clima-planes';
import type {
  DriverImpact,
  ReactiveImpact,
  ClimaCorrelationFlags,
} from '@/lib/services/clima/PulseEngine';

/**
 * Shape mínimo leído de un DepartmentClimaInsight persistido. Se declara local
 * (no importa Prisma) para que el assembler siga siendo puro y testeable sin BD.
 * El caller (endpoint) castea las columnas Json a estos tipos (precedente:
 * results/route.ts:245 `as unknown as DriverImpact[]`).
 */
export interface AssemblerRow {
  departmentId: string;
  departmentName?: string;
  driverAnalysis: DriverImpact[] | null;
  reactiveAnalysis: ReactiveImpact[] | null;
  correlationFlags: ClimaCorrelationFlags | null;
}

/**
 * Reshapea una fila persistida → ClimaDeptDecisionInput:
 *   drivers       ← driverAnalysis (por driver), con sus reactives de reactiveAnalysis
 *                   (filtrados a la dimensión padre vía ReactiveImpact.category)
 *   businessCases ← correlationFlags.businessCases
 *
 * reactiveAnalysis vacío/null → reactives:[] → el builder emite 0 ítems para ese
 * depto (measured.length===0 → continue). Es el comportamiento correcto "sin datos"
 * (Tipo 3), no un error.
 */
export function assembleDeptDecisionInput(row: AssemblerRow): ClimaDeptDecisionInput {
  const reactives = row.reactiveAnalysis ?? [];

  const drivers: ClimaDriverForDecision[] = (row.driverAnalysis ?? []).map((d) => ({
    category: d.driver,
    fav: d.fav,
    gap: d.gap,
    impact: d.impact,
    momentumDelta: d.momentumDelta,
    classification: d.classification,
    reactives: reactives
      .filter((r) => r.category === d.driver)
      .map((r) => ({
        reactive: r.reactive,
        impact: r.impact,
        gap: r.gap,
        mean: r.mean,
      })),
  }));

  return {
    departmentId: row.departmentId,
    departmentName: row.departmentName,
    drivers,
    businessCases: row.correlationFlags?.businessCases ?? [],
  };
}

/** Ensambla varias filas (una por depto visible). */
export function assembleClimaDecisionInputs(
  rows: AssemblerRow[]
): ClimaDeptDecisionInput[] {
  return rows.map(assembleDeptDecisionInput);
}
