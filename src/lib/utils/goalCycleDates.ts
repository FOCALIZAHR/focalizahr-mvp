// src/lib/utils/goalCycleDates.ts
// ════════════════════════════════════════════════════════════════════════════
// Regla de negocio (Gate D.7b): las fechas de una meta deben CABER dentro del
// rango del ciclo heredado — no llenarlo, solo caber (bordes inclusivos):
//   startDate ≥ assignmentWindow  ·  dueDate ≤ closureWindow
// Fuente ÚNICA de la regla, PURA (sin prisma) → importable en el server (POST
// /api/goals, /api/goals/from-pdi) y en el cliente (wizard StepSetDates).
// ════════════════════════════════════════════════════════════════════════════

export function goalDatesWithinCycleError(
  cycle: { assignmentWindow: string | Date; closureWindow: string | Date },
  // startDate = null → NO se chequea el inicio (PDI: startDate es server-fijo
  // = new Date(), no una elección del usuario).
  startDate: string | Date | null,
  dueDate: string | Date
): string | null {
  if (startDate != null && new Date(startDate) < new Date(cycle.assignmentWindow)) {
    return 'La fecha de inicio no puede ser anterior al inicio del ciclo.'
  }
  if (new Date(dueDate) > new Date(cycle.closureWindow)) {
    return 'La fecha límite no puede ser posterior al cierre del ciclo.'
  }
  return null
}
