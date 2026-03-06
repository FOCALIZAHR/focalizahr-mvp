// ════════════════════════════════════════════════════════════════════════════
// SUCCESSION CONSTANTS
// src/config/successionConstants.ts
// ════════════════════════════════════════════════════════════════════════════
// Fuente unica de verdad para umbrales, categorias y helpers de sucesion
// ════════════════════════════════════════════════════════════════════════════

import { NineBoxPosition } from '@/config/performanceClassification'

// ════════════════════════════════════════════════════════════════════════════
// UMBRALES
// ════════════════════════════════════════════════════════════════════════════

/** Minimo roleFitScore para ser elegible como candidato a sucesion */
export const ROLEFIT_THRESHOLD = 75

/** Posiciones 9-box elegibles para sucesion (lowercase - match NineBoxPosition enum) */
export const SUCCESSION_ELIGIBLE_NINEBOX: string[] = [
  NineBoxPosition.STAR,              // 'star'
  NineBoxPosition.HIGH_PERFORMER,    // 'high_performer'
  NineBoxPosition.GROWTH_POTENTIAL,  // 'growth_potential'
]

/** Umbrales de readiness basados en gap porcentual */
export const READINESS_THRESHOLDS = {
  READY_NOW_MAX_GAP: 10,      // gapPercent < 10 => READY_NOW
  READY_1_2_MAX_GAP: 25,      // gapPercent < 25 => READY_1_2_YEARS
} as const

// ════════════════════════════════════════════════════════════════════════════
// COMPETENCY CATEGORIES
// ════════════════════════════════════════════════════════════════════════════

export const COMPETENCY_CATEGORIES: Record<string, string> = {
  STRAT: 'STRATEGIC',
  LEAD: 'LEADERSHIP',
  CORE: 'CORE',
}

/** Extrae la categoria de competencia a partir de su codigo (ej: "STRAT-001" -> "STRATEGIC") */
export function categorizeCompetency(code: string): string {
  const prefix = code.split('-')[0]?.toUpperCase()
  return COMPETENCY_CATEGORIES[prefix] || 'CORE'
}

// ════════════════════════════════════════════════════════════════════════════
// READINESS LABELS & ORDER
// ════════════════════════════════════════════════════════════════════════════

export const READINESS_LABELS: Record<string, string> = {
  READY_NOW: 'Listo ahora',
  READY_1_2_YEARS: '1-2 años',
  READY_3_PLUS: '3+ años',
  NOT_VIABLE: 'No viable',
}

export const READINESS_ORDER: Record<string, number> = {
  READY_NOW: 1,
  READY_1_2_YEARS: 2,
  READY_3_PLUS: 3,
  NOT_VIABLE: 4,
}

// ════════════════════════════════════════════════════════════════════════════
// BENCH STRENGTH RULES
// ════════════════════════════════════════════════════════════════════════════

export const BENCH_STRENGTH_RULES = {
  STRONG: { minReadyNow: 2 },                          // 2+ ready now
  MODERATE: { minReadyNow: 1, minReady12: 2 },         // 1 ready now + 2 ready 1-2
  WEAK: { minReady12: 1 },                              // 1+ ready 1-2 (sin ready now)
  // NONE: else
} as const

// ════════════════════════════════════════════════════════════════════════════
// READINESS SYNC MAP (ReadinessLevel enum -> legacy successionReadiness strings)
// ════════════════════════════════════════════════════════════════════════════

export const READINESS_SYNC_MAP: Record<string, string> = {
  READY_NOW: 'ready_now',
  READY_1_2_YEARS: 'ready_1_year',
  READY_3_PLUS: 'ready_2_years',
  NOT_VIABLE: 'not_ready',
}

// ════════════════════════════════════════════════════════════════════════════
// SORT HELPER
// ════════════════════════════════════════════════════════════════════════════

/**
 * Ordena candidatos por readiness (mejor primero), luego por matchPercent desc.
 * Generico: T debe tener readinessLevel y matchPercent.
 */
export function sortCandidates<T extends { readinessLevel: string; matchPercent: number }>(
  candidates: T[]
): T[] {
  return [...candidates].sort((a, b) => {
    const orderA = READINESS_ORDER[a.readinessLevel] ?? 99
    const orderB = READINESS_ORDER[b.readinessLevel] ?? 99
    if (orderA !== orderB) return orderA - orderB
    return b.matchPercent - a.matchPercent
  })
}
