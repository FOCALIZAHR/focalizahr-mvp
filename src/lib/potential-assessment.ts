// ════════════════════════════════════════════════════════════════════════════
// POTENTIAL ASSESSMENT - Factores AAE (Aspiración, Ability, Engagement)
// src/lib/potential-assessment.ts
// ════════════════════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════════════════════════════════
// TIPOS
// ════════════════════════════════════════════════════════════════════════════

export type PotentialFactorLevel = 1 | 2 | 3

export interface PotentialFactorsInput {
  aspiration: PotentialFactorLevel
  ability: PotentialFactorLevel
  engagement: PotentialFactorLevel
}

// ════════════════════════════════════════════════════════════════════════════
// ALGORITMO DE CÁLCULO
// ════════════════════════════════════════════════════════════════════════════

/**
 * Calcula potentialScore (1-5) a partir de los 3 factores AAE (1-3)
 *
 * Formula: score = 1 + (promedio - 1) * 2
 * Mapeo: avg=1 → score=1, avg=2 → score=3, avg=3 → score=5
 *
 * @example
 * calculatePotentialScore({ aspiration: 3, ability: 3, engagement: 3 }) // → 5.0
 * calculatePotentialScore({ aspiration: 2, ability: 2, engagement: 2 }) // → 3.0
 * calculatePotentialScore({ aspiration: 1, ability: 1, engagement: 1 }) // → 1.0
 */
export function calculatePotentialScore(factors: PotentialFactorsInput): number {
  const { aspiration, ability, engagement } = factors
  const avg = (aspiration + ability + engagement) / 3
  const rawScore = 1 + (avg - 1) * 2
  return Math.round(rawScore * 10) / 10 // 1 decimal
}

/**
 * Valida que los factors sean válidos (cada uno 1, 2 o 3)
 */
export function validatePotentialFactors(
  aspiration: unknown,
  ability: unknown,
  engagement: unknown
): boolean {
  const validLevels = [1, 2, 3]
  return (
    validLevels.includes(aspiration as number) &&
    validLevels.includes(ability as number) &&
    validLevels.includes(engagement as number)
  )
}
