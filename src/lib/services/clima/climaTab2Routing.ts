// src/lib/services/clima/climaTab2Routing.ts
// ════════════════════════════════════════════════════════════════════════════
// EX Clima — Gate 5D Tab 2 (POR PERSONA): ruteo Estado A / Estado B (§0 del
// SPEC_UI_META_REACTIVO_v1). Decide, POR CENTRO DE COSTO (Decisión 1.a, Victor
// 2026-07-24 = por-centro, NO across-centros), si un departamento va a:
//   - ESTADO_B_PDI   : PDI automático (>3 reactivos bajo tier, O dimensión sistémica)
//   - ESTADO_A_CHOICE: 1-3 reactivos → el jefe elige Meta / PDI
//   - NONE           : 0 reactivos bajo tier tras filtro → sin CTA
//
// PURO / client-safe (sin prisma). El CONTEO se recomputa desde reactiveAnalysis con
// un filtro MÁS ESTRICTO que el del builder — por eso NO se reusa el belowTier del
// builder (que filtra solo circular). `isSystemic` sí se REUSA del builder tal cual
// ("ya construido, no tocar", SPEC_UI §0:26) y entra como flag ya calculado.
// ════════════════════════════════════════════════════════════════════════════

import {
  reactiveMeanTarget,
  REACTIVE_CIRCULARITY_EXCLUDE,
} from '@/lib/services/clima/climaThresholds';

/** Espejo de round1 del builder (ClimaActionPlanBuilder.ts:47) — el redondeo importa en
 *  el borde: round1(-0.04)=−0.0 → NO dispara (gapMean<0 estricto). Debe coincidir. */
const round1 = (x: number) => Math.round(x * 10) / 10;

/**
 * Doble-barril: reactivos de redacción ambigua (AUDITORIA_BANCO_REACTIVOS_v1 / SPEC_UI §5).
 * No deben generar slider-card hasta que el banco corrija su redacción → se excluyen del
 * conteo. NO es exclusión circular (ese es otro motivo, vive en REACTIVE_CIRCULARITY_EXCLUDE,
 * intacto). Los 4 nombres verificados contra el catálogo (ClimaInterventionDictionary).
 */
export const REACTIVE_DOUBLE_BARREL_EXCLUDE = new Set<string>([
  'comunicacion_interna',
  'cohesion_equipo',
  'carga_trabajo',
  'seguridad',
]);

/**
 * `energia`: excluida PUNTUALMENTE solo del conteo de Tab 2 (decisión Victor 2026-07-24).
 * NO se agrega a REACTIVE_CIRCULARITY_EXCLUDE: el rediseño del banco podría partirla en 2
 * preguntas nuevas, y no queremos una exclusión formal sellada sobre algo que puede cambiar
 * de identidad.
 *
 * ⚠️ REGLA: si aparece un SEGUNDO reactivo que necesite este trato local, PARAR y preguntar
 * de nuevo (no ampliar este set por cuenta propia). Con uno solo no amerita frenar.
 */
export const REACTIVE_TAB2_COUNT_LOCAL_EXCLUDE = new Set<string>(['energia']);

/** Un reactivo cuenta para el ruteo de Tab 2 salvo que sea circular, doble-barril o energia. */
function countsForTab2(reactive: string): boolean {
  return (
    !REACTIVE_CIRCULARITY_EXCLUDE.has(reactive) &&
    !REACTIVE_DOUBLE_BARREL_EXCLUDE.has(reactive) &&
    !REACTIVE_TAB2_COUNT_LOCAL_EXCLUDE.has(reactive)
  );
}

/** Umbral del ruteo: >3 reactivos bajo tier → sistémico por conteo (SPEC_UI §0). */
export const TAB2_BELOW_TIER_PDI_THRESHOLD = 3;

/** Forma mínima que necesita el ruteo (subconjunto de ReactiveImpact). */
export interface Tab2ReactiveRow {
  reactive: string;
  mean: number | null;
}

export type Tab2Route = 'ESTADO_B_PDI' | 'ESTADO_A_CHOICE' | 'NONE';

export interface Tab2RoutingResult {
  /** Reactivos bajo su tier tras filtro estricto (los que alimentan las cards de Estado A). */
  belowTierReactives: string[];
  belowTierCount: number;
  /** Reusado del builder (isSystemic por dimensión), NO recomputado acá. */
  hasSystemicDimension: boolean;
  route: Tab2Route;
}

/**
 * Rutea UN departamento (por-centro). `reactives` = reactiveAnalysis del depto (todas las
 * dimensiones). `hasSystemicDimension` = ¿alguna dimensión de ESTE depto salió isSystemic?
 * (lo aporta el caller desde las decisiones del builder).
 *
 * Below-tier = misma definición que el builder (ClimaActionPlanBuilder.ts:106,118):
 * gapMean = round1(mean − reactiveMeanTarget(reactive)) < 0, sobre reactivos medidos
 * (mean !== null), PERO con el filtro estricto de Tab 2 (circular+doble-barril+energia).
 */
export function routeDepartmentTab2(
  reactives: Tab2ReactiveRow[],
  hasSystemicDimension: boolean
): Tab2RoutingResult {
  const belowTierReactives = reactives
    .filter((r) => r.mean !== null && countsForTab2(r.reactive))
    .filter((r) => round1((r.mean as number) - reactiveMeanTarget(r.reactive)) < 0)
    .map((r) => r.reactive);

  const belowTierCount = belowTierReactives.length;

  let route: Tab2Route;
  if (belowTierCount > TAB2_BELOW_TIER_PDI_THRESHOLD || hasSystemicDimension) {
    route = 'ESTADO_B_PDI';
  } else if (belowTierCount >= 1) {
    route = 'ESTADO_A_CHOICE';
  } else {
    route = 'NONE';
  }

  return { belowTierReactives, belowTierCount, hasSystemicDimension, route };
}
