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

// ── Decisiones del cierre (SP2) — espejo de GoalsService.CycleClosureDecisionType ──
export type CycleClosureDecisionType =
  | 'CLOSE_WITH_SCORE'
  | 'MARK_REVIEW'
  | 'LEAVE_AS_IS'

export interface CycleClosureDecision {
  goalId: string
  decision: CycleClosureDecisionType
}

// Balde por defecto: soberanía de la meta — nada cambia salvo decisión explícita.
export const DEFAULT_DECISION: CycleClosureDecisionType = 'LEAVE_AS_IS'

// Labels de negocio (NO los nombres técnicos del enum).
export const DECISION_OPTIONS: { value: CycleClosureDecisionType; label: string }[] = [
  { value: 'CLOSE_WITH_SCORE', label: 'Cerrar con score actual' },
  { value: 'MARK_REVIEW', label: 'Enviar a revisión' },
  { value: 'LEAVE_AS_IS', label: 'Dejar como está' },
]

// Map<goalId, decision> → payload. Cubre EXACTAMENTE las N del map (= accionables),
// sin duplicados (Map garantiza claves únicas). inReview nunca está en el map → nunca
// en el payload. Incluye las LEAVE_AS_IS (el backend las cuenta en summary.leftAsIs y
// el set enviado = set accionable completo → pasa la validación todo-o-nada).
export function buildDecisionsPayload(
  map: Map<string, CycleClosureDecisionType>
): CycleClosureDecision[] {
  return Array.from(map, ([goalId, decision]) => ({ goalId, decision }))
}
