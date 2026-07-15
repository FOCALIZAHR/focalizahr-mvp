// src/components/goals/bank/bankPayload.ts
// ════════════════════════════════════════════════════════════════════════════
// Banco de metas definidas (Gate C, punto 2) — lógica PURA, testeable sin DOM.
//
// Camino B/C: el jefe ASIGNA una meta ya definida (COMPANY/AREA) del banco a una o
// varias personas. El KPI viene congelado del origen; lo único que el jefe decide es
// el peso. La CATEGORÍA se HEREDA del padre acá (en el componente de ORIGEN), NUNCA
// dentro de cascadeGoal — por eso buildBankPayload la copia al payload.
// ════════════════════════════════════════════════════════════════════════════

import type { GoalFamily, GoalMetricType, GoalType } from '@prisma/client'

/** Forma mínima de la meta del banco (subconjunto de lo que devuelve GET /api/goals). */
export interface BankParentGoal {
  id: string
  title: string
  type: GoalType
  metricType: GoalMetricType
  startValue: number
  targetValue: number
  unit?: string | null
  description?: string | null
  startDate: string
  dueDate: string
  periodYear: number
  weight: number // el "Sugerido: X%" que ve el jefe
  family?: GoalFamily | null
  subfamily?: string | null
}

/** assignmentStatus por persona, tal como lo devuelve GET /api/goals/team (post-Gate A). */
export interface AssignmentStatus {
  totalWeight: number
  goalCount: number
  maxGoals: number
  status: string
  isComplete: boolean
}

/**
 * Peso disponible de una persona en el ciclo activo.
 *
 * FIX Gate C (mismo principio que Gate A: fallar cerrado, no fail-open):
 * si NO llega assignmentStatus, devuelve `null` — el consumidor muestra error/carga,
 * NUNCA asume 100%. Antes StepWeightsConfirm hacía `return 100` y dejaba asignar peso
 * que el servidor iba a rechazar.
 */
// Recibe la forma MÍNIMA necesaria ({ totalWeight }) para servir a los dos consumidores
// sin acoplarse a la forma completa: GoalBankScreen (AssignmentStatus con isComplete) y
// StepWeightsConfirm (su assignmentStatus SIN isComplete). Una sola fuente de verdad.
export function getAvailableWeight(status: { totalWeight: number } | null | undefined): number | null {
  if (!status) return null
  return 100 - status.totalWeight
}

/**
 * Payload de asignación desde el banco. Copia el KPI del padre (gobernanza: el KPI se
 * congela en el origen), hereda la categoría, manda parentId + el peso elegido, y NO
 * manda `description`: el KPI vive en el padre y se lee de ahí (el mockup 4.2 hace JOIN
 * al padre, no copia al hijo). Por eso la obligatoriedad de "¿Cómo se mide?" NO aplica
 * a este camino.
 */
export function buildBankPayload(
  parent: BankParentGoal,
  employeeId: string,
  weight: number
): Record<string, unknown> {
  return {
    level: 'INDIVIDUAL',
    employeeId,
    parentId: parent.id,
    // KPI copiado del padre — NO se le pide al jefe
    title: parent.title,
    type: parent.type,
    metricType: parent.metricType,
    startValue: parent.startValue,
    targetValue: parent.targetValue,
    unit: parent.unit ?? undefined,
    startDate: parent.startDate,
    dueDate: parent.dueDate,
    periodYear: parent.periodYear,
    // Categoría HEREDADA del banco (componente de origen; cascadeGoal no la copia)
    family: parent.family ?? undefined,
    subfamily: parent.subfamily ?? undefined,
    // el ÚNICO campo que el jefe decide
    weight,
    // description NO se manda a propósito (ver doc arriba)
  }
}
