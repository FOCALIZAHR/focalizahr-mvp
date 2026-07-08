// src/components/goals/cycles/cycleWindows.ts
// ════════════════════════════════════════════════════════════════════════════
// Helpers puros de ventanas de ciclo — fuente ÚNICA de UX/validación en el
// cliente, compartida por CreateCycleModal (D.3) y EditCycleWindowsModal (D.8).
// Espeja la regla del server GoalCycleService.validateWindowOrder(year, …):
// cota de año (assignment dentro del año, closure ≤ fin del año siguiente) +
// orden (closure > assignment, tracking inclusive entre ambas).
// Este helper es feedback inmediato; el SERVER es la barrera real.
// Comparación lexicográfica sobre strings ISO yyyy-mm-dd (sin saltos de timezone).
// ════════════════════════════════════════════════════════════════════════════

export interface CycleWindowValues {
  assignmentWindow: string // 'yyyy-mm-dd' ('' si vacío)
  trackingWindow: string
  closureWindow: string
}

export interface CycleWindowBounds {
  assignMin: string
  assignMax: string
  closureMax: string
}

// Cotas de año (Doble cota, Gate D.3/D.8): el ciclo arranca dentro de su año;
// el cierre puede extenderse hasta el fin del año siguiente (preserva caso A.5).
export function windowBounds(year: number): CycleWindowBounds {
  return {
    assignMin: `${year}-01-01`,
    assignMax: `${year}-12-31`,
    closureMax: `${year + 1}-12-31`,
  }
}

export interface CycleWindowValidation {
  assignmentInYear: boolean
  closureWithinBound: boolean
  closureAfterAssignment: boolean
  trackingInRange: boolean
  datesPresent: boolean
  daysBetween: number | null
  isValid: boolean
}

export function validateCycleWindows(
  year: number,
  { assignmentWindow, trackingWindow, closureWindow }: CycleWindowValues
): CycleWindowValidation {
  const { assignMin, assignMax, closureMax } = windowBounds(year)

  const datesPresent = !!assignmentWindow && !!trackingWindow && !!closureWindow

  const daysBetween =
    assignmentWindow && closureWindow
      ? Math.ceil(
          (new Date(closureWindow).getTime() - new Date(assignmentWindow).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : null

  const closureAfterAssignment = daysBetween !== null && daysBetween > 0

  const assignmentInYear =
    !!assignmentWindow && assignmentWindow >= assignMin && assignmentWindow <= assignMax
  const closureWithinBound = !!closureWindow && closureWindow <= closureMax

  const trackingInRange =
    datesPresent && assignmentWindow <= trackingWindow && trackingWindow <= closureWindow

  const isValid =
    datesPresent &&
    assignmentInYear &&
    closureWithinBound &&
    closureAfterAssignment &&
    trackingInRange

  return {
    assignmentInYear,
    closureWithinBound,
    closureAfterAssignment,
    trackingInRange,
    datesPresent,
    daysBetween,
    isValid,
  }
}
