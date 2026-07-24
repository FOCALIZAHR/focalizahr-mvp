// ════════════════════════════════════════════════════════════════════════════
// PRESUPUESTO DE PESO DE METAS — fuente ÚNICA de verdad (Gate A)
// src/lib/goals/weightBudget.ts
// ════════════════════════════════════════════════════════════════════════════
//
// Módulo PURO (cero imports: hoja del grafo de dependencias, igual que
// climaThresholds.ts). Client-safe: NO importa Prisma, así puede consumirlo tanto
// el server (GoalsService, /api/goals/team) como el cliente (bankPayload).
//
// Antes esta aritmética vivía DUPLICADA en tres lugares:
//   • GoalsService.validateTotalWeight  → query + suma + comparación contra 100 (throw)
//   • /api/goals/team/route.ts          → filtra + suma por empleado (read-only, payload)
//   • bankPayload.getAvailableWeight    → `100 - totalWeight` (cliente)
// Con la constante 100, el filtro de estados "vivos" y el filtro de nivel copiados en
// cada uno. Una sola definición acá: si cambia la regla de qué mete cuenta o el techo,
// cambia en un lugar.
// ════════════════════════════════════════════════════════════════════════════

/** Techo de peso por persona y por ciclo. El presupuesto NO es acumulado histórico. */
export const GOAL_WEIGHT_BUDGET = 100

/**
 * Estados que GASTAN presupuesto: metas vivas, ni cerradas ni canceladas.
 * (PENDING_CLOSURE / COMPLETED / CANCELLED no cuentan.)
 */
export const ALIVE_GOAL_STATUSES = [
  'NOT_STARTED',
  'ON_TRACK',
  'AT_RISK',
  'BEHIND',
] as const

/**
 * El presupuesto de 100% es PERSONAL: solo lo gastan metas INDIVIDUAL. Una Corporativa
 * o de Área es un MOLDE, nunca tiene dueño (GoalsService.ts:1658-1659 impide employeeId
 * en AREA/COMPANY), así que jamás debe contar contra el 100% de una persona.
 */
const PERSONAL_GOAL_LEVEL = 'INDIVIDUAL'

/** Forma MÍNIMA que necesita el cálculo. `level` es OBLIGATORIO a propósito: obliga a
 *  todo llamador (vía el genérico de filterBudgetGoals) a seleccionarlo, para que el
 *  filtro personal-only no dependa de que alguien se acuerde de pre-filtrar en la query. */
export interface BudgetGoal {
  id: string
  level: string
  weight: number | null
  status: string
  goalCycleId: string | null
}

/**
 * Metas que gastan presupuesto PERSONAL: INDIVIDUAL, vivas Y ancladas al ciclo activo.
 * Sin ciclo activo → [] (las de ciclos cerrados son histórico congelado; no gastan el
 * presupuesto vigente).
 *
 * El nivel se filtra ACÁ (no solo en la query): así la garantía "solo INDIVIDUAL cuenta"
 * vive en un único lugar — la misma que aplicaban por separado validateTotalWeight
 * (GoalsService.ts:765) y el include de /team (team/route.ts:83).
 *
 * El resto del CONJUNTO lo decide cada llamador: /team pasa `visibleGoals` (excluye
 * leader-goals de quien no tiene reportes); el server pasa el resultado de su query.
 *
 * @param excludeGoalId  Al editar (PATCH), la propia meta no cuenta contra sí misma.
 */
export function filterBudgetGoals<T extends BudgetGoal>(
  goals: T[],
  activeCycleId: string | null | undefined,
  excludeGoalId?: string
): T[] {
  if (!activeCycleId) return []
  const alive = ALIVE_GOAL_STATUSES as readonly string[]
  return goals.filter(
    (g) =>
      g.level === PERSONAL_GOAL_LEVEL &&
      g.id !== excludeGoalId &&
      alive.includes(g.status) &&
      g.goalCycleId === activeCycleId
  )
}

/** Peso ya usado en el ciclo activo. Espejo exacto del `reduce` que usaban los 3 sitios. */
export function sumBudgetWeight(
  goals: BudgetGoal[],
  activeCycleId: string | null | undefined,
  excludeGoalId?: string
): number {
  return filterBudgetGoals(goals, activeCycleId, excludeGoalId).reduce(
    (sum, g) => sum + (g.weight || 0),
    0
  )
}

/**
 * Presupuesto restante a partir del peso usado. Devuelve el crudo (puede ser negativo si
 * hay exceso): NO clampa, para no ocultar un sobregiro al consumidor.
 */
export function availableWeightFrom(used: number): number {
  return GOAL_WEIGHT_BUDGET - used
}
