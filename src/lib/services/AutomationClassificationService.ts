// ════════════════════════════════════════════════════════════════════════════
// AUTOMATION CLASSIFICATION SERVICE
// src/lib/services/AutomationClassificationService.ts
// ════════════════════════════════════════════════════════════════════════════
// Cruza los 2 motores crudos (Eloundou betaEloundou + 5 dims Anthropic) y
// devuelve UNA FRASE NARRATIVA por tarea — humana, ejecutiva, sin jerga.
//
// Las 5 dims Anthropic miden CÓMO la IA participa (no solo cuánto).
// betaEloundou señala DÓNDE vive la tarea (Soberanía/Aumentado/Rescate).
// El cruce dim × zona produce una explicación específica del tipo de
// interacción IA-humano que esa tarea implica.
//
// Cobertura: ~18% de las tareas O*NET tienen dims Anthropic. El resto
// cae a null → fallback genérico por categoría en la UI.
// ════════════════════════════════════════════════════════════════════════════

import type { AnthropicDimensionValues } from '@/config/anthropicDimensions'

// ═════════════════════════════════════════════════════════════════════════════
// 1. ETIQUETAS CORTAS (legacy — todavía exportadas para consumidores externos)
// ═════════════════════════════════════════════════════════════════════════════
// Mantenida por compatibilidad con otros consumidores del service que sólo
// necesitan una palabra clave. La UI del Simulador usa getAnthropicPhrase().

export type AutomationClassification =
  | 'Reemplazo directo'
  | 'Reemplazo verificado'
  | 'Asistencia con feedback'
  | 'Iteración supervisada'
  | 'Validación humana'
  | 'Aprendizaje continuo'
  | 'Asistencia híbrida'

interface ClassifyOptions {
  dominanceThreshold?: number
}

export function classifyAutomation(
  data: AnthropicDimensionValues | null | undefined,
  options: ClassifyOptions = {},
): AutomationClassification | null {
  if (!data) return null
  const threshold = options.dominanceThreshold ?? 0.15

  const entries: Array<[keyof AnthropicDimensionValues, number]> = [
    ['directive', data.directive],
    ['feedbackLoop', data.feedbackLoop],
    ['taskIteration', data.taskIteration],
    ['validation', data.validation],
    ['learning', data.learning],
  ]
  entries.sort((a, b) => b[1] - a[1])
  const [topDim, topValue] = entries[0]
  if (topValue < threshold) return 'Asistencia híbrida'

  switch (topDim) {
    case 'directive':
      return data.validation >= 0.5 ? 'Reemplazo verificado' : 'Reemplazo directo'
    case 'feedbackLoop':
      return 'Asistencia con feedback'
    case 'taskIteration':
      return 'Iteración supervisada'
    case 'validation':
      return 'Validación humana'
    case 'learning':
      return 'Aprendizaje continuo'
    default:
      return 'Asistencia híbrida'
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// 2. FRASES NARRATIVAS — cruce betaEloundou × dim dominante
// ═════════════════════════════════════════════════════════════════════════════
// Estructura: PHRASES[betaKey][dimKey_snake] → frase larga (2-3 oraciones).
// betaKey = 'beta_1' | 'beta_05' | 'beta_0' según focalizaScore.
// dimKey  = 'directive' | 'feedback_loop' | 'task_iteration' | 'validation' | 'learning'
//
// β=0 solo tiene 4 frases (NO feedback_loop): si feedback_loop domina en
// tarea β=0, el lookup devuelve undefined → null.

const ANTHROPIC_PHRASES: Record<string, Record<string, string>> = {
  beta_1: {
    directive:
      'La IA ejecuta esta tarea de principio a fin sin intervención. Es el reemplazo más limpio — no hay fricción, no hay loop humano.',
    feedback_loop:
      'La IA la ejecuta, pero necesita que alguien le diga si el resultado fue correcto. No es reemplazo total — es automatización supervisada.',
    task_iteration:
      'La IA la hace, pero la hace varias veces hasta afinarla. El humano no ejecuta, pero sí define cuándo es suficiente.',
    validation:
      'La IA produce el output Y lo verifica. El humano solo recibe el resultado final. Cadena completa automatizada.',
    learning:
      'La IA ejecuta y además mejora con cada repetición. Esta tarea se vuelve más barata con el tiempo, no igual de barata.',
  },
  beta_05: {
    directive:
      'Con el software correcto, esta tarea se delega por completo. La barrera no es la IA — es la integración técnica.',
    feedback_loop:
      'La IA co-ejecuta si el humano le pasa los resultados intermedios. Requiere un workflow nuevo, no solo una herramienta.',
    task_iteration:
      'Humano e IA la hacen juntos, de a ciclos. El rol cambia: de ejecutar a dirigir la iteración.',
    validation:
      'La IA revisa el trabajo humano. El humano sigue produciendo, pero la IA eleva el estándar de calidad mínimo aceptable.',
    learning:
      'La IA actúa como consultor especializado en tiempo real. El humano decide, la IA informa con más profundidad que cualquier colega.',
  },
  beta_0: {
    directive:
      'Señal de alerta: alguien está intentando delegar esto a la IA aunque la evidencia dice que no funciona. Revisar quién y por qué.',
    task_iteration:
      'La IA se usa como borrador o asistente, pero el juicio final es humano e irremplazable en este caso.',
    learning:
      'La IA se usa para preparar o informar al humano antes de que ejecute. Acelerador de contexto, no sustituto.',
    validation:
      'La IA revisa borradores, pero la decisión final requiere criterio que los modelos actuales no tienen. Segunda opinión, no árbitro.',
    // NOTA: intencionalmente sin feedback_loop para β=0. Si domina, return null.
  },
}

/** Mapeo interno: key camelCase de AnthropicDimensionValues → key snake del dict */
const DIM_TO_SNAKE: Record<keyof AnthropicDimensionValues, string> = {
  directive: 'directive',
  feedbackLoop: 'feedback_loop',
  taskIteration: 'task_iteration',
  validation: 'validation',
  learning: 'learning',
}

/**
 * Resuelve la frase narrativa para una tarea según su betaEloundou + dims.
 *
 * @param betaEloundou - focalizaScore de la tarea (0 | 0.5 | 1.0 | null).
 * @param dims         - 5 dims Anthropic crudas; null si la tarea no tiene.
 * @returns frase larga (2-3 oraciones) o null si:
 *          - no hay dims (caller usa fallback genérico por categoría)
 *          - señal débil: todas las dims < 0.15
 *          - combinación sin frase (β=0 × feedback_loop)
 */
export function getAnthropicPhrase(
  betaEloundou: number | null,
  dims: AnthropicDimensionValues | null | undefined,
): string | null {
  if (!dims || betaEloundou === null) return null

  // Valores por dim (en orden camelCase del interface)
  const values: Array<[keyof AnthropicDimensionValues, number]> = [
    ['directive', dims.directive ?? 0],
    ['feedbackLoop', dims.feedbackLoop ?? 0],
    ['taskIteration', dims.taskIteration ?? 0],
    ['validation', dims.validation ?? 0],
    ['learning', dims.learning ?? 0],
  ]
  values.sort((a, b) => b[1] - a[1])
  const [dominantKey, dominantValue] = values[0]

  // Señal débil → no mostrar
  if (dominantValue < 0.15) return null

  // Resolver bucket por betaEloundou. Uso umbrales permisivos por si viene
  // valor intermedio (ej: 0.49 en el futuro) — actualmente Eloundou es
  // discreto 0/0.5/1 pero el producto podría agregar otra fuente.
  const betaKey =
    betaEloundou >= 0.75 ? 'beta_1' :
    betaEloundou >= 0.25 ? 'beta_05' :
    'beta_0'

  const dimSnake = DIM_TO_SNAKE[dominantKey]
  return ANTHROPIC_PHRASES[betaKey]?.[dimSnake] ?? null
}

// ═════════════════════════════════════════════════════════════════════════════
// NAMESPACE EXPORT
// ═════════════════════════════════════════════════════════════════════════════

export const AutomationClassificationService = {
  classify: classifyAutomation,
  getPhrase: getAnthropicPhrase,
}
