// ════════════════════════════════════════════════════════════════════════════
// ANTHROPIC DIMENSION LABELS — fuente única de verdad
// src/config/anthropicDimensions.ts
// ════════════════════════════════════════════════════════════════════════════
// Las 5 dimensiones crudas del Anthropic Economic Index miden CÓMO la IA
// participa en una tarea (no solo cuánto). Son el dato premium del
// producto — observación real de uso de Claude, no estimación.
//
// Usado por:
// - AnthropicEqualizer (5 micro-barras del TaskForensicCard)
// - TaskMicroscope (instrumento #2)
// - Tooltips en toda la UI donde se muestre exposición IA
// ════════════════════════════════════════════════════════════════════════════

export type AnthropicDimensionKey =
  | 'directive'
  | 'feedbackLoop'
  | 'taskIteration'
  | 'validation'
  | 'learning'

export interface AnthropicDimensionConfig {
  /** Key para indexar (camelCase) */
  key: AnthropicDimensionKey
  /** Nombre corto (1 palabra) para labels en UI compacta */
  label: string
  /** Descripción narrativa arbitradora para tooltips */
  narrative: string
  /** Sigla de 1 letra para las barras del Ecualizador */
  initial: 'D' | 'F' | 'I' | 'V' | 'L'
}

export const ANTHROPIC_DIMENSIONS: Record<AnthropicDimensionKey, AnthropicDimensionConfig> = {
  directive: {
    key: 'directive',
    label: 'Reemplazo',
    narrative: 'Reemplazo — La IA toma la decisión sin intervención humana.',
    initial: 'D',
  },
  feedbackLoop: {
    key: 'feedbackLoop',
    label: 'Adaptación',
    narrative: 'Adaptación — La IA mejora con las correcciones del usuario.',
    initial: 'F',
  },
  taskIteration: {
    key: 'taskIteration',
    label: 'Iteración',
    narrative: 'Iteración — La IA repite y perfecciona el trabajo sola.',
    initial: 'I',
  },
  validation: {
    key: 'validation',
    label: 'Verificación',
    narrative: 'Verificación — La IA detecta errores antes de entregar.',
    initial: 'V',
  },
  learning: {
    key: 'learning',
    label: 'Aprendizaje',
    narrative: 'Aprendizaje — La IA se vuelve más experta con el uso.',
    initial: 'L',
  },
}

/** Orden canónico para renderizar las 5 barras del Ecualizador */
export const ANTHROPIC_DIMENSION_ORDER: AnthropicDimensionKey[] = [
  'directive',
  'feedbackLoop',
  'taskIteration',
  'validation',
  'learning',
]

/** Shape de los 5 valores por tarea (0-1 cada uno) */
export interface AnthropicDimensionValues {
  directive: number
  feedbackLoop: number
  taskIteration: number
  validation: number
  learning: number
}

/** Helper: verifica si una tarea tiene datos Anthropic (al menos 1 dim no-null) */
export function hasAnthropicData(
  values: Partial<AnthropicDimensionValues> | null | undefined,
): values is AnthropicDimensionValues {
  if (!values) return false
  return ANTHROPIC_DIMENSION_ORDER.some(key => {
    const v = values[key]
    return v !== null && v !== undefined
  })
}

/** Mapeo DB (snake_case columna) → Key (camelCase) */
export const DB_COLUMN_TO_KEY: Record<string, AnthropicDimensionKey> = {
  anthropic_directive: 'directive',
  anthropic_feedback_loop: 'feedbackLoop',
  anthropic_task_iteration: 'taskIteration',
  anthropic_validation: 'validation',
  anthropic_learning: 'learning',
}

/** Mapeo CSV (snake_case original Anthropic) → Key (camelCase) */
export const CSV_COLUMN_TO_KEY: Record<string, AnthropicDimensionKey> = {
  directive: 'directive',
  feedback_loop: 'feedbackLoop',
  task_iteration: 'taskIteration',
  validation: 'validation',
  learning: 'learning',
}
