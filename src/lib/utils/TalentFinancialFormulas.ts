// ════════════════════════════════════════════════════════════════════════════
// TALENT FINANCIAL FORMULAS — Single Source of Truth
// src/lib/utils/TalentFinancialFormulas.ts
// ════════════════════════════════════════════════════════════════════════════
// Funciones puras de cálculo financiero para talento.
// Consumidores: PLTalentService, TalentRiskOrchestrator
// Sin dependencias de BD ni side effects.
// ════════════════════════════════════════════════════════════════════════════

/** Umbral mínimo de Role Fit — por debajo hay brecha productiva */
export const ROLEFIT_THRESHOLD = 75

/** Tope legal de años para cálculo de finiquito (legislación laboral chilena) */
export const FINIQUITO_YEARS_CAP = 11

// ════════════════════════════════════════════════════════════════════════════
// 1. TENURE — Meses enteros desde fecha de contratación
// ════════════════════════════════════════════════════════════════════════════

export function calculateTenureMonths(hireDate: Date): number {
  const now = new Date()
  const months = (now.getFullYear() - hireDate.getFullYear()) * 12
    + (now.getMonth() - hireDate.getMonth())
  return Math.max(0, months)
}

// ════════════════════════════════════════════════════════════════════════════
// 2. GAP MENSUAL — Productividad que se paga pero no se recibe
// Fórmula: salary × ((75 - roleFitScore) / 100)
// Solo aplica si roleFitScore < 75
// ════════════════════════════════════════════════════════════════════════════

export function calculateMonthlyGap(salary: number, roleFitScore: number): number {
  if (roleFitScore >= ROLEFIT_THRESHOLD) return 0
  return Math.round(salary * ((ROLEFIT_THRESHOLD - roleFitScore) / 100))
}

// ════════════════════════════════════════════════════════════════════════════
// 3. FINIQUITO — Costo de desvinculación hoy
// Fórmula: salary × (min(tenureMonths / 12, 11) + 1 mes preaviso)
// Tope: 11 años (legislación laboral chilena)
// ════════════════════════════════════════════════════════════════════════════

export function calculateFiniquito(salary: number, tenureMonths: number): number {
  const yearsCapped = Math.min(tenureMonths / 12, FINIQUITO_YEARS_CAP)
  return Math.round(salary * (yearsCapped + 1))
}

// ════════════════════════════════════════════════════════════════════════════
// 4. BREAKEVEN — Meses hasta que mantener cuesta más que desvincular
// Fórmula: finiquito / monthlyGap
// Solo aplica si hay gap > 0 y finiquito calculado
// ════════════════════════════════════════════════════════════════════════════

export function calculateBreakevenMonths(
  finiquito: number | null,
  monthlyGap: number
): number | null {
  if (finiquito === null || finiquito <= 0 || monthlyGap <= 0) return null
  return Math.round(finiquito / monthlyGap)
}
