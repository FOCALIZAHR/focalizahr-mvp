// ════════════════════════════════════════════════════════════════════════════
// CALIBRATION BONUS FACTORS
// src/config/calibrationBonusFactors.ts
// ════════════════════════════════════════════════════════════════════════════
// Factores multiplicadores de bono por posición 9-Box
// Futuro: parametrizable por cliente en CalibrationSession.bonusConfig
// ════════════════════════════════════════════════════════════════════════════

export const DEFAULT_BONUS_FACTORS: Record<string, number> = {
  // Top Performers
  STARS: 1.25,    // 125% del bono base
  HIGH: 1.15,     // 115%

  // Core Team
  CORE: 0.90,     // 90%

  // Development Zone
  NEUTRAL: 0.70,  // 70%

  // Risk Zone
  RISK: 0.00      // 0% (sin bono)
}

/**
 * Obtiene factor de bono por status de cuadrante
 */
export function getBonusFactor(status: string): number {
  return DEFAULT_BONUS_FACTORS[status] ?? 0.70
}

/**
 * Calcula factor de bono promedio para un equipo
 */
export function calculateAverageBonusFactor(
  employees: Array<{ status: string }>
): number {
  if (employees.length === 0) return 0

  const total = employees.reduce((sum, emp) => {
    return sum + getBonusFactor(emp.status)
  }, 0)

  return total / employees.length
}

/**
 * Formatea factor de bono para display
 */
export function formatBonusFactor(factor: number): string {
  return `${Math.round(factor * 100)}%`
}
