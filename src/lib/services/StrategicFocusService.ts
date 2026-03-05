// ════════════════════════════════════════════════════════════════════════════
// STRATEGIC FOCUS SERVICE
// src/lib/services/StrategicFocusService.ts
// ════════════════════════════════════════════════════════════════════════════
// Clasifica brechas de competencia según su impacto en focos estratégicos.
// BLOQUEA → la brecha impide lograr la meta
// IMPULSA → la fortaleza acelera la meta
// NEUTRO  → no afecta este foco
// ════════════════════════════════════════════════════════════════════════════

export type StrategicFocus = 'CRECIMIENTO' | 'EFICIENCIA' | 'TRANSFORMACION' | 'RETENCION'
export type FocusImpact = 'BLOQUEA' | 'IMPULSA' | 'NEUTRO'

export interface FocusClassification {
  competencyCode: string
  competencyName: string
  impact: FocusImpact
  gap: number
  actual: number
  expected: number
  priority: number // 1 = highest
}

export interface StrategicFocusResult {
  focus: StrategicFocus
  focusLabel: string
  blockers: FocusClassification[]   // competencies that BLOCK the goal (sorted by worst gap)
  enablers: FocusClassification[]   // competencies that ENABLE the goal
  neutral: FocusClassification[]
}

interface CompetencyGapInput {
  competencyCode: string
  competencyName: string
  gap: number       // actual - expected (negative = brecha)
  actual: number
  expected: number
}

// ════════════════════════════════════════════════════════════════════════════
// FOCUS LABELS
// ════════════════════════════════════════════════════════════════════════════

const FOCUS_LABELS: Record<StrategicFocus, string> = {
  CRECIMIENTO: 'Crecimiento',
  EFICIENCIA: 'Eficiencia',
  TRANSFORMACION: 'Transformación',
  RETENCION: 'Retención'
}

const FOCUS_DESCRIPTIONS: Record<StrategicFocus, string> = {
  CRECIMIENTO: 'Escalar ventas y operaciones',
  EFICIENCIA: 'Optimizar costos y procesos',
  TRANSFORMACION: 'Digitalización y cambio cultural',
  RETENCION: 'Reducir rotación de talento'
}

// ════════════════════════════════════════════════════════════════════════════
// STRATEGIC IMPACT MATRIX
// Mapea: competencyCode → StrategicFocus → FocusImpact
// ════════════════════════════════════════════════════════════════════════════

const IMPACT_MATRIX: Record<StrategicFocus, Record<string, FocusImpact>> = {
  CRECIMIENTO: {
    'CORE-RESULTS':     'BLOQUEA',    // Sin orientación a resultados no se escala
    'CORE-CLIENT':      'BLOQUEA',    // Foco cliente impulsa crecimiento
    'LEAD-TEAM':        'BLOQUEA',    // Liderazgo para escalar equipos
    'STRAT-VISION':     'IMPULSA',    // Visión estratégica dirige crecimiento
    'LEAD-DELEG':       'IMPULSA',    // Delegación permite escalar
    'CORE-ADAPT':       'IMPULSA',    // Adaptabilidad para nuevos mercados
    'STRAT-CHANGE':     'NEUTRO',
    'STRAT-INFLUENCE':  'NEUTRO',
    'LEAD-DEV':         'NEUTRO',
    'LEAD-FEEDBACK':    'NEUTRO',
    'CORE-COMM':        'NEUTRO',
    'CORE-TEAM':        'NEUTRO',
  },

  EFICIENCIA: {
    'CORE-RESULTS':     'BLOQUEA',    // Ejecución es clave para eficiencia
    'LEAD-DELEG':       'BLOQUEA',    // Delegación efectiva = eficiencia
    'CORE-TEAM':        'BLOQUEA',    // Trabajo en equipo para optimizar
    'STRAT-VISION':     'IMPULSA',    // Visión de procesos optimizados
    'CORE-ADAPT':       'IMPULSA',    // Flexibilidad para nuevos procesos
    'LEAD-FEEDBACK':    'IMPULSA',    // Feedback mejora procesos
    'STRAT-CHANGE':     'NEUTRO',
    'STRAT-INFLUENCE':  'NEUTRO',
    'LEAD-DEV':         'NEUTRO',
    'LEAD-TEAM':        'NEUTRO',
    'CORE-CLIENT':      'NEUTRO',
    'CORE-COMM':        'NEUTRO',
  },

  TRANSFORMACION: {
    'STRAT-CHANGE':     'BLOQUEA',    // Gestión del cambio es crítica
    'CORE-ADAPT':       'BLOQUEA',    // Adaptabilidad imprescindible
    'LEAD-FEEDBACK':    'BLOQUEA',    // Cultura de feedback para cambio
    'STRAT-VISION':     'IMPULSA',    // Visión de la transformación
    'STRAT-INFLUENCE':  'IMPULSA',    // Influencia ejecutiva para buy-in
    'LEAD-DEV':         'IMPULSA',    // Desarrollar nuevas capacidades
    'CORE-RESULTS':     'NEUTRO',
    'CORE-CLIENT':      'NEUTRO',
    'LEAD-TEAM':        'NEUTRO',
    'LEAD-DELEG':       'NEUTRO',
    'CORE-COMM':        'NEUTRO',
    'CORE-TEAM':        'NEUTRO',
  },

  RETENCION: {
    'LEAD-DEV':         'BLOQUEA',    // Sin desarrollo se van
    'LEAD-FEEDBACK':    'BLOQUEA',    // Feedback = engagement
    'LEAD-TEAM':        'BLOQUEA',    // Liderazgo impacta rotación directa
    'CORE-COMM':        'IMPULSA',    // Comunicación genera pertenencia
    'CORE-TEAM':        'IMPULSA',    // Trabajo en equipo = vínculo
    'LEAD-DELEG':       'IMPULSA',    // Autonomía retiene talento
    'STRAT-VISION':     'NEUTRO',
    'STRAT-CHANGE':     'NEUTRO',
    'STRAT-INFLUENCE':  'NEUTRO',
    'CORE-RESULTS':     'NEUTRO',
    'CORE-CLIENT':      'NEUTRO',
    'CORE-ADAPT':       'NEUTRO',
  }
}

// ════════════════════════════════════════════════════════════════════════════
// PUBLIC API
// ════════════════════════════════════════════════════════════════════════════

export class StrategicFocusService {

  /**
   * Clasifica brechas de competencia según un foco estratégico.
   * Los blockers con gap negativo más severo tienen mayor prioridad.
   */
  static classify(
    focus: StrategicFocus,
    competencyGaps: CompetencyGapInput[]
  ): StrategicFocusResult {
    const impactMap = IMPACT_MATRIX[focus] || {}

    const classified: FocusClassification[] = competencyGaps.map(g => ({
      competencyCode: g.competencyCode,
      competencyName: g.competencyName,
      impact: impactMap[g.competencyCode] || 'NEUTRO',
      gap: g.gap,
      actual: g.actual,
      expected: g.expected,
      priority: 0
    }))

    // Separate by impact
    const blockers = classified.filter(c => c.impact === 'BLOQUEA')
    const enablers = classified.filter(c => c.impact === 'IMPULSA')
    const neutral = classified.filter(c => c.impact === 'NEUTRO')

    // Sort blockers by severity (worst negative gap first)
    blockers.sort((a, b) => a.gap - b.gap)
    blockers.forEach((b, i) => { b.priority = i + 1 })

    // Sort enablers by strength (biggest positive gap first)
    enablers.sort((a, b) => b.gap - a.gap)
    enablers.forEach((e, i) => { e.priority = i + 1 })

    return {
      focus,
      focusLabel: FOCUS_LABELS[focus],
      blockers,
      enablers,
      neutral
    }
  }

  /**
   * Retorna los focos disponibles con labels y descripción.
   */
  static getAvailableFoci(): Array<{
    key: StrategicFocus
    label: string
    description: string
  }> {
    return (Object.keys(FOCUS_LABELS) as StrategicFocus[]).map(key => ({
      key,
      label: FOCUS_LABELS[key],
      description: FOCUS_DESCRIPTIONS[key]
    }))
  }

  /**
   * Para un conjunto de brechas, retorna clasificación para TODOS los focos.
   * Útil para vista comparativa.
   */
  static classifyAllFoci(
    competencyGaps: CompetencyGapInput[]
  ): StrategicFocusResult[] {
    return (Object.keys(FOCUS_LABELS) as StrategicFocus[]).map(focus =>
      this.classify(focus, competencyGaps)
    )
  }
}
