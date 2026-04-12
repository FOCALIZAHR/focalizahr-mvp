// ════════════════════════════════════════════════════════════════════════════
// DESCRIPTOR SIMULATOR — funciones puras + types
// src/app/dashboard/workforce/components/instruments/descriptor-simulator/descriptor-simulator-utils.ts
// ════════════════════════════════════════════════════════════════════════════
// Cero deps. Solo cálculos client-side de la simulación.
// ════════════════════════════════════════════════════════════════════════════

import type {
  SimulatorPayload,
  SimulatorTask,
} from '@/app/api/descriptors/[id]/simulator/route'

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTES
// ─────────────────────────────────────────────────────────────────────────────

/** Mes laboral según el contexto financiero del producto. */
export const HORAS_MES = 160

/** Cap superior del slider por tarea (1 semana laboral). */
export const HORAS_MAX_TAREA = 40

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type TaskState = 'human' | 'augmented' | 'automated'

export interface EditableTask {
  taskId: string
  description: string
  betaScore: number | null
  isAutomatedHint: boolean
  importance: number
  hours: number              // 0–HORAS_MAX_TAREA, mutable
  state: TaskState           // mutable
}

export interface SimulationResult {
  capacidadLiberada: number  // horas/mes (160 − humanas)
  rescateMensual: number     // CLP/mes total ahorrado
  nuevaExposicionPct: number // 0–100 (recalculada client-side)
  totalAutomated: number
  totalAugmented: number
  totalHuman: number
  valorHora: number
}

// ─────────────────────────────────────────────────────────────────────────────
// INICIALIZACIÓN
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Construye el estado editable inicial a partir del payload del backend.
 * Distribución de horas proporcional a `importance`, capada en HORAS_MAX_TAREA.
 * Si el cap reduce el total bajo 160, NO se rebalancea — el CEO empieza con
 * menos horas, lo cual ES un dato (el modelo O*NET sub-asigna).
 */
export function buildEditableTasks(payload: SimulatorPayload): EditableTask[] {
  const activeTasks = payload.tasks.filter(t => t.isActive)
  if (activeTasks.length === 0) return []

  const sumImportance = activeTasks.reduce((s, t) => s + t.importance, 0)
  if (sumImportance <= 0) {
    // fallback: distribución uniforme
    const evenHours = Math.min(HORAS_MAX_TAREA, Math.floor(HORAS_MES / activeTasks.length))
    return activeTasks.map(t => ({
      taskId: t.taskId,
      description: t.description,
      betaScore: t.betaScore,
      isAutomatedHint: t.isAutomatedHint,
      importance: t.importance,
      hours: evenHours,
      state: 'human' as const,
    }))
  }

  return activeTasks.map(t => {
    const proportional = (HORAS_MES * t.importance) / sumImportance
    const hours = Math.min(HORAS_MAX_TAREA, Math.round(proportional))
    return {
      taskId: t.taskId,
      description: t.description,
      betaScore: t.betaScore,
      isAutomatedHint: t.isAutomatedHint,
      importance: t.importance,
      hours,
      state: 'human' as const,
    }
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// CÁLCULO DE LA SIMULACIÓN
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calcula los 3 indicadores del P&L Live + nueva exposición.
 *
 * Reglas:
 *   - Automated: tarea sale del trabajo humano. Rescate = costoTarea (100%).
 *   - Augmented: tarea sigue ejecutándose por humano (cuenta horas). Rescate
 *     = costoTarea × betaScore (factor real Anthropic, no 30% fijo).
 *   - Human: cuenta horas, sin rescate.
 *
 * Nueva exposición se calcula sobre las tareas que SIGUEN siendo trabajo humano
 * (Human + Augmented) — Automated se quita del cálculo porque ya no es del CEO.
 */
export function computeSimulation(
  tasks: EditableTask[],
  monthlySalary: number,
): SimulationResult {
  const valorHora = monthlySalary > 0 ? monthlySalary / HORAS_MES : 0

  let rescateMensual = 0
  let horasHumanas = 0
  let totalAutomated = 0
  let totalAugmented = 0
  let totalHuman = 0

  for (const task of tasks) {
    const costoTarea = valorHora * task.hours

    if (task.state === 'automated') {
      rescateMensual += costoTarea
      totalAutomated += 1
    } else if (task.state === 'augmented') {
      const factor = task.betaScore ?? 0
      rescateMensual += costoTarea * factor
      horasHumanas += task.hours
      totalAugmented += 1
    } else {
      // human
      horasHumanas += task.hours
      totalHuman += 1
    }
  }

  const capacidadLiberada = Math.max(0, HORAS_MES - horasHumanas)

  // Nueva exposición: solo sobre tareas que aún son trabajo humano y tienen betaScore
  const remaining = tasks.filter(
    t => t.state !== 'automated' && t.betaScore !== null && t.hours > 0,
  )
  const sumWeight = remaining.reduce((s, t) => s + t.hours, 0)
  const sumExposure = remaining.reduce(
    (s, t) => s + t.hours * (t.betaScore as number),
    0,
  )
  const nuevaExposicionPct =
    sumWeight > 0 ? (sumExposure / sumWeight) * 100 : 0

  return {
    capacidadLiberada,
    rescateMensual,
    nuevaExposicionPct,
    totalAutomated,
    totalAugmented,
    totalHuman,
    valorHora,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/** Costo mensual de una tarea individual (para badge "Rescate" en card). */
export function taskSavings(task: EditableTask, valorHora: number): number {
  const costoTarea = valorHora * task.hours
  if (task.state === 'automated') return costoTarea
  if (task.state === 'augmented') return costoTarea * (task.betaScore ?? 0)
  return 0
}

// ─────────────────────────────────────────────────────────────────────────────
// FINANCIAL LINE — texto contextual financiero según estado de la tarea.
//   Humano       → "Costo completo: $X/mes"      (slate)
//   Aumentado    → "Ahorro parcial: $Y/mes"      (amber) + dominio IA detalle
//   Automatizado → "Rescate total: $X/mes"       (cyan)
//
// El CEO siempre ve UNA línea financiera por tarea, no condicional.
// ─────────────────────────────────────────────────────────────────────────────

export interface TaskFinancialLine {
  label: string
  amount: number
  accent: 'slate' | 'amber' | 'cyan'
  detail?: string
}

export function taskFinancialLine(
  task: EditableTask,
  valorHora: number,
): TaskFinancialLine {
  const costoTarea = valorHora * task.hours
  if (task.state === 'human') {
    return {
      label: 'Costo completo',
      amount: costoTarea,
      accent: 'slate',
    }
  }
  if (task.state === 'augmented') {
    const beta = task.betaScore ?? 0
    return {
      label: 'Ahorro parcial',
      amount: costoTarea * beta,
      accent: 'amber',
      detail: `dominio IA: ${Math.round(beta * 100)}%`,
    }
  }
  // automated
  return {
    label: 'Rescate total',
    amount: costoTarea,
    accent: 'cyan',
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// LABELS DE ESTADO (centralizados)
// ─────────────────────────────────────────────────────────────────────────────

export const STATE_LABEL: Record<TaskState, string> = {
  human: 'Humano',
  augmented: 'Aumentado',
  automated: 'Automatizado',
}

/** Tailwind class para el botón ACTIVO de cada estado (toggle group). */
export const STATE_ACTIVE_CLASS: Record<TaskState, string> = {
  human: 'bg-slate-700/60 text-slate-200 border border-slate-500/40',
  augmented: 'bg-amber-500/15 text-amber-300 border border-amber-500/40',
  automated: 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/40',
}

// ─────────────────────────────────────────────────────────────────────────────
// HEATMAP DE TAREAS — semáforo de riesgo por betaScore
//   < 0.40 → cyan (Core Humano · baja exposición)
//   0.40 – 0.70 → amber (Potencial de Aumento · exposición media)
//   > 0.70 → red con glow (Inercia Salarial · exposición crítica)
// ─────────────────────────────────────────────────────────────────────────────

export interface BetaHeatmap {
  bgColor: string
  glow: string | undefined
  level: 'core' | 'medium' | 'critical'
}

export function betaHeatmap(beta: number | null): BetaHeatmap {
  if (beta === null) {
    return { bgColor: '#475569', glow: undefined, level: 'core' } // slate fallback
  }
  if (beta < 0.4) {
    return { bgColor: '#22D3EE', glow: undefined, level: 'core' }
  }
  if (beta < 0.7) {
    return { bgColor: '#F59E0B', glow: undefined, level: 'medium' }
  }
  return {
    bgColor: '#EF4444',
    glow: '0 0 8px rgba(239, 68, 68, 0.55)',
    level: 'critical',
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// AUDIT BASELINE — narrativa del gancho
//   N = total de tareas iniciales del cargo
//   M = tareas con betaScore > 0.7 (zona crítica IA)
//   X = horas iniciales asignadas a esas M tareas
//
// Se calcula UNA vez sobre el snapshot inicial (sin mutaciones del usuario).
// ─────────────────────────────────────────────────────────────────────────────

export interface AuditBaseline {
  N: number
  M: number
  X: number
}

export function computeAuditBaseline(initialTasks: EditableTask[]): AuditBaseline {
  const N = initialTasks.length
  const highBeta = initialTasks.filter(
    t => t.betaScore !== null && t.betaScore > 0.7,
  )
  const M = highBeta.length
  const X = highBeta.reduce((s, t) => s + t.hours, 0)
  return { N, M, X }
}
