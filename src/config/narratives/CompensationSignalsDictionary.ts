// ════════════════════════════════════════════════════════════════════════════
// DICCIONARIO DE NARRATIVAS — SEÑALES DE COMPENSACIÓN
// src/config/narratives/CompensationSignalsDictionary.ts
// ════════════════════════════════════════════════════════════════════════════
// 4 combinatorias de bono × mérito: qué mensaje implícito recibe el empleado.
// Consumidores: CompensationSplit (Patrón G, perspectiva Señales)
// Auditado contra 6 Reglas de Oro (skill focalizahr-narrativas)
// ════════════════════════════════════════════════════════════════════════════

export type SignalType =
  | 'HIGH_BONUS_LOW_MERIT'
  | 'LOW_BONUS_HIGH_MERIT'
  | 'BOTH_LOW'
  | 'BOTH_HIGH'

export interface SignalNarrative {
  label: string
  observation: string
  decisionOfValue: string
  implicitMessage: string
}

export const COMPENSATION_SIGNALS_DICTIONARY: Record<SignalType, SignalNarrative> = {

  HIGH_BONUS_LOW_MERIT: {
    label: 'Alto bono, bajo mérito',
    observation:
      'Cumplió metas y recibe bono. Pero la evaluación no respalda un incremento salarial. ' +
      'El mensaje que recibe: te premio hoy pero no invierto en tu futuro. ' +
      'Si el talento que entrega resultados no ve crecimiento, la organización le está financiando la transición a quien sí se lo ofrezca.',
    decisionOfValue:
      '¿La evaluación baja refleja un sesgo del líder o una brecha real? ' +
      '¿Las competencias que se exigen son relevantes para el cargo? ' +
      '¿O el sistema mide algo distinto a lo que el negocio necesita?',
    implicitMessage: 'Útil hoy, prescindible mañana.',
  },

  LOW_BONUS_HIGH_MERIT: {
    label: 'Alto mérito, bajo bono',
    observation:
      'La organización lo valora — evaluación alta, priorizado para incremento. ' +
      'Pero las metas no se cumplieron y el bono lo refleja. ' +
      'El mensaje que recibe: te reconozco como persona pero no premio lo que entregas. ' +
      'La promesa implícita de mérito sin resultados erosiona la credibilidad del sistema.',
    decisionOfValue:
      '¿Las metas estaban bien definidas o eran inalcanzables? ' +
      '¿Hubo factores fuera de su control? ' +
      '¿O el líder priorizó la relación sobre la exigencia de resultados?',
    implicitMessage: 'Valorado pero no premiado.',
  },

  BOTH_LOW: {
    label: 'Doble negativa',
    observation:
      'Ni la evaluación respalda mérito ni las metas respaldan bono. La señal es inequívoca. ' +
      'Pero el riesgo no es qué pagar — es que siga en el cargo. ' +
      'Cada mes sin decisión es un subsidio diario que los que sí rinden están financiando.',
    decisionOfValue:
      '¿Es nuevo en el cargo y necesita tiempo? ¿Antes entregaba y algo cambió? ' +
      '¿O la gerencia posterga una decisión que debió tomar hace ciclos? ' +
      'La inacción tiene un costo que crece en silencio.',
    implicitMessage: 'No aporta valor y la organización lo tolera.',
  },

  BOTH_HIGH: {
    label: 'Señal coherente',
    observation:
      'Evaluación y resultados se alinean. Califica para bono máximo y mejor incremento. ' +
      'La señal es coherente — pero coherente no significa suficiente. ' +
      'Las políticas estándar están diseñadas para retener al promedio. ' +
      'El talento de alto impacto necesita algo más que la regla.',
    decisionOfValue:
      '¿Lo conocemos más allá del dato? ¿Está en plan de sucesión? ' +
      '¿Tiene visibilidad como talento de la organización — no solo del área? ' +
      '¿Sabe que es un activo estratégico? ' +
      'Tratar a la excelencia con las herramientas del promedio es la vía más rápida para perderla.',
    implicitMessage: 'Excelencia confirmada — pero ¿protegida?',
  },
}

export function getSignalNarrative(type: SignalType): SignalNarrative {
  return COMPENSATION_SIGNALS_DICTIONARY[type]
}

/** Classify a person into a signal type based on their scores */
export function classifySignal(score360: number, goalsPercent: number | null): SignalType {
  const highMerit = score360 >= 4.0
  const highBonus = (goalsPercent ?? 0) >= 80
  if (highBonus && !highMerit) return 'HIGH_BONUS_LOW_MERIT'
  if (!highBonus && highMerit) return 'LOW_BONUS_HIGH_MERIT'
  if (!highBonus && !highMerit) return 'BOTH_LOW'
  return 'BOTH_HIGH'
}
