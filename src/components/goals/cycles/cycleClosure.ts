// src/components/goals/cycles/cycleClosure.ts
// ════════════════════════════════════════════════════════════════════════════
// Helpers del cierre de ciclo (Gate D.5-UI). Espeja la semántica del backend
// (GoalsService.applyCycleClosureDecisions): el set ACCIONABLE es
// status notIn COMPLETED/CANCELLED/PENDING_CLOSURE; las PENDING_CLOSURE son
// "ya en revisión" (read-only, no se deciden acá).
// SP1: tipos + isActionable + separación. SP2 agrega labels + buildDecisionsPayload.
// ════════════════════════════════════════════════════════════════════════════

// Estados que el modal de cierre NO puede decidir (fuente de verdad = server).
export const NON_ACTIONABLE_STATUSES: readonly string[] = [
  'COMPLETED',
  'CANCELLED',
  'PENDING_CLOSURE',
]

export const IN_REVIEW_STATUS = 'PENDING_CLOSURE'

// Una meta es accionable (decidible en el cierre) si no está completada,
// cancelada, ni ya en revisión.
export function isActionable(status: string): boolean {
  return !NON_ACTIONABLE_STATUSES.includes(status)
}

// Meta tal como la devuelve GET /api/goals (subconjunto que usa el modal).
export interface ClosureGoal {
  id: string
  title: string
  status: string
  level: string
  progress: number | null
  owner: { id: string; fullName: string; position: string | null } | null
  department: { id: string; displayName: string } | null
}

// Separa la lista cruda del ciclo en accionables (a decidir) e inReview
// (PENDING_CLOSURE, ya en la bandeja de aprobación — solo contexto).
export function splitClosureGoals(goals: ClosureGoal[]): {
  actionable: ClosureGoal[]
  inReview: ClosureGoal[]
} {
  return {
    actionable: goals.filter((g) => isActionable(g.status)),
    inReview: goals.filter((g) => g.status === IN_REVIEW_STATUS),
  }
}
