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

/** Valor UF en CLP — actualizar periódicamente (fuente: sii.cl) */
export const UF_VALUE_CLP = 38_800

/** Tope base imponible para indemnización (Art. 172 Código del Trabajo) */
export const FINIQUITO_UF_CAP = 90

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
// 3. FINIQUITO — Costo de desvinculación hoy (legislación laboral chilena)
// Art. 163: Indemnización = 1 mes por año de servicio (tope 11 años)
//   - Requiere mínimo 1 año para devengar indemnización
//   - Fracción ≥ 6 meses del año siguiente cuenta como año completo
// Art. 161: Preaviso = 1 mes adicional si no se dio aviso con 30 días
// ════════════════════════════════════════════════════════════════════════════

export function calculateFiniquito(salary: number, tenureMonths: number): number {
  const preaviso = salary

  // Sin 1 año cumplido: solo preaviso, sin indemnización
  if (tenureMonths < 12) return Math.round(preaviso)

  // Años completos + fracción ≥ 6 meses cuenta como año adicional
  const fullYears = Math.floor(tenureMonths / 12)
  const remainingMonths = tenureMonths % 12
  const yearsOfService = remainingMonths >= 6 ? fullYears + 1 : fullYears
  const yearsCapped = Math.min(yearsOfService, FINIQUITO_YEARS_CAP)

  return Math.round(salary * yearsCapped + preaviso)
}

// ════════════════════════════════════════════════════════════════════════════
// 3b. FINIQUITO CON TOPE 90 UF — Base imponible topada (Art. 172)
// Misma lógica que calculateFiniquito pero con salary capped a 90 UF
// ════════════════════════════════════════════════════════════════════════════

export function calculateFiniquitoConTope(salary: number, tenureMonths: number): number {
  const salaryCapped = Math.min(salary, FINIQUITO_UF_CAP * UF_VALUE_CLP)
  return calculateFiniquito(salaryCapped, tenureMonths)
}

// ════════════════════════════════════════════════════════════════════════════
// 4. BREAKEVEN — Meses hasta que mantener cuesta más que desvincular
// Fórmula: finiquito / monthlyGap
// Solo aplica si hay gap > 0 y finiquito calculado
// ════════════════════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════════════════════════════════
// 4. PRÓXIMA ANUALIDAD — Meses hasta que suba el finiquito
// Regla: primer salto a los 12 meses, luego cada vez que la fracción
// alcanza 6 meses del siguiente año (18, 30, 42, 54...)
// Retorna null si ya alcanzó el tope de 11 años
// ════════════════════════════════════════════════════════════════════════════

export function calculateMonthsUntilNextYear(tenureMonths: number): number | null {
  // Calcular años de servicio actuales
  const fullYears = Math.floor(tenureMonths / 12)
  const remaining = tenureMonths % 12
  const currentYears = tenureMonths < 12 ? 0 : (remaining >= 6 ? fullYears + 1 : fullYears)

  // Ya en tope: no hay más saltos
  if (currentYears >= FINIQUITO_YEARS_CAP) return null

  // Antes del primer año: salto al mes 12
  if (tenureMonths < 12) return 12 - tenureMonths

  // Si fracción < 6: próximo salto cuando remaining = 6
  if (remaining < 6) return 6 - remaining

  // Si fracción >= 6: próximo salto al mes (fullYears+1)*12 + 6
  const nextJump = (fullYears + 1) * 12 + 6
  return nextJump - tenureMonths
}

// ════════════════════════════════════════════════════════════════════════════
// 4b. ANUALIDAD RECIENTE — ¿Sumó un año de servicio en los últimos 2 meses?
// Detecta si la inacción acaba de costar un sueldo más de finiquito.
// Retorna true si el cruce fue hace 0-2 meses.
// ════════════════════════════════════════════════════════════════════════════

export function didRecentlyAddYear(tenureMonths: number): boolean {
  if (tenureMonths < 12) return false

  const remaining = tenureMonths % 12

  // Cruce por fracción ≥ 6: remaining 6 o 7 significa que cruzó hace 0-1 meses
  if (remaining >= 6 && remaining <= 7) return true

  // Cruce por año completo: remaining 0 o 1 significa que cruzó hace 0-1 meses
  // Pero solo si ya tiene más de 1 año (el primer cruce a 12 no aplica acá,
  // ya se maneja en monthsUntilNextYear)
  if (tenureMonths >= 18 && remaining <= 1) return true

  return false
}

// ════════════════════════════════════════════════════════════════════════════
// 5. BREAKEVEN — Meses hasta que mantener cuesta más que desvincular
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
