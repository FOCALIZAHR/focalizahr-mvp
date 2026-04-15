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

// ═════════════════════════════════════════════════════════════════════════════
//
// ▼▼▼ PATRÓN G — utilidades del rediseño "War Room" ▼▼▼
//
// Tipos y helpers para el nuevo layout (scroll cinematográfico) del
// DescriptorSimulator. Coexisten con los tipos/helpers previos durante la
// transición. Se pueden deprecar cuando el layout viejo se borre.
//
// ═════════════════════════════════════════════════════════════════════════════

import type { AnthropicDimensionData } from '@/app/api/descriptors/[id]/simulator/route'

// ─────────────────────────────────────────────────────────────────────────────
// FORENSIC TASK — tarea mutable del rediseño
// ─────────────────────────────────────────────────────────────────────────────

export interface ForensicTask {
  taskId: string
  description: string               // ES si existe, sino EN
  descriptionEn: string              // texto O*NET original para hover
  importance: number                 // 1-5 (peso O*NET)
  /** focalizaScore de OnetTask — Eloundou puro (0 / 0.5 / 1.0 / null) */
  focalizaScore: number | null
  isAutomatedHint: boolean
  /** 5 dimensiones Anthropic (null si la tarea no está en el Economic Index) */
  anthropicData: AnthropicDimensionData | null
  /** Frase narrativa larga del cruce β × dim dominante (null si señal débil) */
  classificationPhrase: string | null
  // Mutables (solo β=0.5: slider de delegación)
  /** Horas/mes humanas restantes. Para β=0.5 se puede reducir hasta 50%. */
  hoursPerMonth: number
  /** Snapshot inicial — para calcular delta vs original */
  originalHours: number
}

// ─────────────────────────────────────────────────────────────────────────────
// CATEGORIZACIÓN POR betaEloundou
// ─────────────────────────────────────────────────────────────────────────────

export type BetaCategory = 'soberania' | 'aumentado' | 'rescate'

/** Clasifica una tarea según su focalizaScore (= betaEloundou) */
export function categorizeTask(task: ForensicTask): BetaCategory {
  const beta = task.focalizaScore
  if (beta === null || beta === 0) return 'soberania'
  if (beta < 0.75) return 'aumentado'  // 0.5
  return 'rescate'                      // 1.0
}

/** Agrupa tareas en las 3 cubetas de Ancla (Soberanía / Aumentado / Rescate) */
export function classifyTasks(tasks: ForensicTask[]): {
  soberania: ForensicTask[]
  aumentado: ForensicTask[]
  rescate: ForensicTask[]
} {
  const soberania: ForensicTask[] = []
  const aumentado: ForensicTask[] = []
  const rescate: ForensicTask[] = []
  for (const t of tasks) {
    const cat = categorizeTask(t)
    if (cat === 'soberania') soberania.push(t)
    else if (cat === 'aumentado') aumentado.push(t)
    else rescate.push(t)
  }
  return { soberania, aumentado, rescate }
}

// ─────────────────────────────────────────────────────────────────────────────
// CÁLCULO DE BLOQUES (Ancla)
// ─────────────────────────────────────────────────────────────────────────────

export interface BlockStats {
  taskCount: number
  totalHours: number
  totalCost: number
  topDescriptions: string[]  // 2-3 tareas más pesadas (por importance) para micro-narrativa
}

export function calcBlockStats(
  tasks: ForensicTask[],
  costPerHour: number,
): BlockStats {
  const totalHours = tasks.reduce((s, t) => s + t.hoursPerMonth, 0)
  const totalCost = totalHours * costPerHour
  const topDescriptions = [...tasks]
    .sort((a, b) => b.importance - a.importance)
    .slice(0, 3)
    .map(t => t.description)
  return {
    taskCount: tasks.length,
    totalHours,
    totalCost,
    topDescriptions,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PORTADA — 3 métricas + narrativa variable
// ─────────────────────────────────────────────────────────────────────────────

export type PortadaVariant = 'positive' | 'negative' | 'neutral'

export interface PortadaMetrics {
  /** Benchmark mercado = focalizaScore del cargo × 100 (0 si null) */
  benchmarkPct: number
  /** Tu empresa = rollupClientExposure × 100 */
  clientPct: number
  /** gap = benchmark - client (positivo = cliente bajo mercado, negativo = cliente sobreexpuesto) */
  gapPp: number
  /** Costo CLP mensual de la brecha si cliente > benchmark */
  gapCostMonthly: number
  variant: PortadaVariant
  narrative: string
  /** true si el cargo no está cubierto por Eloundou (benchmark = null) */
  isBenchmarkMissing: boolean
}

/**
 * Umbral en puntos porcentuales para considerar "alineado con mercado".
 * Bajo este delta el variant = 'neutral'.
 */
const NEUTRAL_THRESHOLD_PP = 3

export function getPortadaMetrics(
  occupationFocalizaScore: number | null,
  rollupClientExposure: number,
  totalHoursPerMonth: number,
  costPerHour: number,
): PortadaMetrics {
  const isBenchmarkMissing = occupationFocalizaScore === null
  const benchmarkPct = (occupationFocalizaScore ?? 0) * 100
  const clientPct = rollupClientExposure * 100

  // gap: positivo si el cliente está DEBAJO del mercado (bueno — protegido)
  //      negativo si el cliente está ARRIBA del mercado (malo — sobreexpuesto)
  const gapPp = Math.round((benchmarkPct - clientPct) * 10) / 10

  // costo solo si cliente sobreexpone (gap negativo)
  const gapCostMonthly = gapPp < 0
    ? Math.abs(gapPp / 100) * totalHoursPerMonth * costPerHour
    : 0

  let variant: PortadaVariant = 'neutral'
  if (Math.abs(gapPp) < NEUTRAL_THRESHOLD_PP) variant = 'neutral'
  else if (gapPp > 0) variant = 'positive'
  else variant = 'negative'

  let narrative = ''
  if (isBenchmarkMissing) {
    narrative =
      'Este cargo no tiene benchmark Eloundou disponible. La oportunidad está en analizar las tareas específicas de Zona de Rescate.'
  } else if (variant === 'positive') {
    narrative = `Este cargo tiene ${Math.abs(Math.round(gapPp))} puntos menos de exposición que el mercado. Tu estructura protege tareas que otros ya automatizaron.`
  } else if (variant === 'negative') {
    narrative = `Este cargo supera el benchmark de mercado en ${Math.abs(Math.round(gapPp))} puntos de exposición. Eso representa ${formatCostCompact(gapCostMonthly)} CLP mensuales en tareas que la IA ya domina.`
  } else {
    narrative =
      'Este cargo está alineado con el mercado. La oportunidad está en las tareas específicas de Zona de Rescate.'
  }

  return {
    benchmarkPct,
    clientPct,
    gapPp,
    gapCostMonthly,
    variant,
    narrative,
    isBenchmarkMissing,
  }
}

function formatCostCompact(amount: number): string {
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`
  if (amount >= 1_000) return `$${Math.round(amount / 1_000)}K`
  return `$${Math.round(amount)}`
}

// ─────────────────────────────────────────────────────────────────────────────
// SIMULACIÓN LIVE (alimenta sticky bar)
// ─────────────────────────────────────────────────────────────────────────────

export interface LiveSimulation {
  /** Horas/mes totales ORIGINALES (snapshot inicial) */
  originalHours: number
  /** Horas/mes totales ACTUALES (post-edición de sliders) */
  currentHours: number
  /** Horas liberadas = originales - actuales */
  hoursLiberated: number
  /** Rescate CLP mensual = hoursLiberated × costPerHour (por 1 ocupante) */
  rescateCLP: number
  /** Rescate × headcount (si headcount > 1, total de la organización) */
  rescateCLPTotal: number
  /** RECUPERABLE — solo tareas β=1.0 con cambios × headcount */
  recuperableCLPTotal: number
  /** ASISTIDO — solo tareas β=0.5 con cambios × headcount */
  asistidoCLPTotal: number
  /** Nueva exposición ponderada (%, usando horas actuales como peso) */
  newExposurePct: number
  /** Hay al menos un cambio vs snapshot original */
  hasChanges: boolean
}

export function computeLiveSimulation(
  tasks: ForensicTask[],
  costPerHour: number,
  headcount: number,
): LiveSimulation {
  let originalHours = 0
  let currentHours = 0
  let recuperableHoursPerPerson = 0   // β=1.0 — FIJO: siempre originalHours (delegación 100% asumida)
  let asistidoHoursPerPerson = 0      // β=0.5 — VARIABLE: depende del slider
  let sumExposureWeighted = 0
  let sumWeight = 0
  let hasChanges = false

  for (const t of tasks) {
    originalHours += t.originalHours
    currentHours += t.hoursPerMonth
    const diff = t.originalHours - t.hoursPerMonth
    const cat = categorizeTask(t)
    // El CEO controla el slider en β=0.5 y β=1.0. El footer suma SOLO lo
    // que ha movido (cero asunciones automáticas).
    if (cat === 'rescate' && diff > 0) {
      recuperableHoursPerPerson += diff
      hasChanges = true
    } else if (cat === 'aumentado' && diff > 0) {
      asistidoHoursPerPerson += diff
      hasChanges = true
    }
    if (t.focalizaScore !== null && t.hoursPerMonth > 0) {
      sumExposureWeighted += t.hoursPerMonth * t.focalizaScore
      sumWeight += t.hoursPerMonth
    }
  }

  const hcMul = Math.max(1, headcount)
  const hoursLiberated = Math.max(0, originalHours - currentHours)
  const rescateCLP = hoursLiberated * costPerHour
  const rescateCLPTotal = rescateCLP * hcMul
  const recuperableCLPTotal = recuperableHoursPerPerson * costPerHour * hcMul
  const asistidoCLPTotal = asistidoHoursPerPerson * costPerHour * hcMul
  const newExposurePct = sumWeight > 0
    ? (sumExposureWeighted / sumWeight) * 100
    : 0

  return {
    originalHours,
    currentHours,
    hoursLiberated,
    rescateCLP,
    rescateCLPTotal,
    recuperableCLPTotal,
    asistidoCLPTotal,
    newExposurePct,
    hasChanges,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// INICIALIZACIÓN de ForensicTasks desde el payload
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// CARGO MISSION — narrativa dinámica calculada desde tasks
// ─────────────────────────────────────────────────────────────────────────────
// Genera "Tu Potencial" del cargo basándose en la composición real de tareas
// (NO hardcoded). Reutilizable en P5 Dashboard cascada y P6 Costado.
//
// Prioridad cascada:
//   1. β=1.0 con costo > 0 → potencial recuperable (cyan)
//   2. β=0.5 con costo > 0 → potencial asistido (purple)
//   3. Sin oportunidad → mensaje de blindaje (slate)
// ─────────────────────────────────────────────────────────────────────────────

export interface CargoMission {
  /** Título corto del bloque (uppercase tracking) */
  title: string
  /** 1-2 líneas explicando el potencial */
  body: string
  /** Color semántico (cyan=recuperable, purple=asistido, slate=blindado) */
  accent: 'cyan' | 'purple' | 'slate'
  /** Categoría priorizada (para destacar en UI) */
  priority: BetaCategory
  /** Monto agregado en CLP (cargo × headcount, 0 si no hay potencial) */
  amount: number
}

export function getCargoMission(
  tasks: ForensicTask[],
  costPerHour: number,
  headcount: number,
): CargoMission {
  const grouped = classifyTasks(tasks)
  const rescate = calcBlockStats(grouped.rescate, costPerHour)
  const aumentado = calcBlockStats(grouped.aumentado, costPerHour)
  const hcMul = Math.max(1, headcount)

  if (rescate.totalCost > 0) {
    const total = rescate.totalCost * hcMul
    return {
      title: 'Tu Potencial',
      body: `Recuperar ${formatCostCompact(total)}/mes delegando ${rescate.taskCount} ${rescate.taskCount === 1 ? 'tarea' : 'tareas'} a IA.`,
      accent: 'cyan',
      priority: 'rescate',
      amount: total,
    }
  }
  if (aumentado.totalCost > 0) {
    const total = aumentado.totalCost * hcMul
    return {
      title: 'Tu Potencial',
      body: `Optimizar ${formatCostCompact(total)}/mes asistiendo ${aumentado.taskCount} ${aumentado.taskCount === 1 ? 'tarea' : 'tareas'} con IA.`,
      accent: 'purple',
      priority: 'aumentado',
      amount: total,
    }
  }
  return {
    title: 'Cargo Blindado',
    body: '100% de las tareas requieren criterio humano. No hay oportunidad de delegación.',
    accent: 'slate',
    priority: 'soberania',
    amount: 0,
  }
}

export function buildForensicTasks(payload: SimulatorPayload): ForensicTask[] {
  return payload.tasks
    .filter(t => t.isActive)
    .map(t => ({
      taskId: t.taskId,
      description: t.description,
      descriptionEn: t.descriptionEn,
      importance: t.importance,
      focalizaScore: t.betaScore, // betaScore del contrato = focalizaScore OnetTask
      isAutomatedHint: t.isAutomatedHint,
      anthropicData: t.anthropicData,
      classificationPhrase: t.classificationPhrase ?? null,
      hoursPerMonth: t.hoursPerMonth,
      originalHours: t.hoursPerMonth,
    }))
}

// ─────────────────────────────────────────────────────────────────────────────
// METADATA DE BLOQUES (presentación)
// ─────────────────────────────────────────────────────────────────────────────

export interface BlockMeta {
  key: BetaCategory
  title: string
  narrative: string
  accent: 'slate' | 'purple' | 'cyan'
  dotColor: string         // CSS color (para el indicador circular)
  teslaColor?: string      // Si tiene línea Tesla superior
  kpiLabel: string         // Label del KPI principal ("Capital protegido" / "Eficiencia posible" / "EBITDA en riesgo")
}

export const BLOCK_META: Record<BetaCategory, BlockMeta> = {
  soberania: {
    key: 'soberania',
    title: 'SOBERANÍA HUMANA',
    narrative: 'Juicio crítico, empatía, presencia física. Núcleo intocable del cargo.',
    accent: 'slate',
    dotColor: '#64748B',
    kpiLabel: 'Capital protegido',
  },
  aumentado: {
    key: 'aumentado',
    title: 'POTENCIAL AUMENTADO',
    narrative: 'IA como copiloto. Tu equipo hace el 20% estratégico, la IA el 80% operativo.',
    accent: 'purple',
    dotColor: '#A78BFA',
    teslaColor: '#A78BFA',
    kpiLabel: 'Eficiencia posible',
  },
  rescate: {
    key: 'rescate',
    title: 'ZONA DE RESCATE',
    narrative: 'IA ejecuta sola. Mantener esto manual es quemar EBITDA innecesariamente.',
    accent: 'cyan',
    dotColor: '#22D3EE',
    teslaColor: '#22D3EE',
    kpiLabel: 'EBITDA en riesgo',
  },
}
