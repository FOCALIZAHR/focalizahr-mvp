// ════════════════════════════════════════════════════════════════════════════
// GERENCIA PATTERN NARRATIVES — Tooltips por patrón de equipo
// Módulo: Talent Action Center (TAC) — Vista de diagnóstico de gerencias
//
// Versión: 1.0 — Panel de Expertos OD + UX
//
// CONTEXTO:
// Estos patrones describen el estado del EQUIPO, no del gerente.
// Se calculan en TalentActionService.detectPattern() en orden de prioridad
// (el primero que matchea gana).
//
// PRINCIPIOS:
// — Cada tooltip nombra quiénes deben participar en la acción
// — Sin plazos: cada empresa tiene sus propias políticas
// — Sin diagnósticos que el dato no puede comprobar
// — El tooltip de Comité es el más específico — diferencia el patrón
//
// CÓMO SE CALCULA CADA PATRÓN:
//
// FRAGIL       → RoleFit promedio ≥75% AND %FUGA_CEREBROS >30% AND sucesores <2
//                Equipo que ejecuta bien pero pierde gente clave sin reemplazo
//
// QUEMADA      → %BURNOUT_RISK >35% AND mediana antigüedad >6 meses
//                Sobrecarga estructural persistente (no es rotación de onboarding)
//
// ESTANCADA    → %EN_DESARROLLO >50% AND mediana antigüedad >18 meses
//                Gestión que no desarrolla ni rota — gente atrapada
//
// RIESGO_OCULTO → ICC >25% (otros patrones no aplican)
//                 Equipo aparentemente sano pero conocimiento concentrado
//                 en personas con señal de alerta
// ════════════════════════════════════════════════════════════════════════════

export type GerenciaPattern =
  | 'FRAGIL'
  | 'QUEMADA'
  | 'ESTANCADA'
  | 'RIESGO_OCULTO'

export type GerenciaAction =
  | 'agendar_comite'
  | 'notificar'
  | 'marcar'

export interface PatternActionTooltip {
  // Texto del tooltip del botón (i)
  tooltip: string
}

export interface GerenciaPatternNarrative {
  // Label human-readable del patrón (para emails, reportes, UI)
  label: string

  // Coaching tip contextual — aparece en el card de diagnóstico
  coachingTip: string

  // Tooltips por acción disponible
  actions: Record<GerenciaAction, PatternActionTooltip>
}

// ════════════════════════════════════════════════════════════════════════════
// NARRATIVAS POR PATRÓN
// ════════════════════════════════════════════════════════════════════════════

export const GERENCIA_PATTERN_NARRATIVES: Record<
  GerenciaPattern,
  GerenciaPatternNarrative
> = {

  // ──────────────────────────────────────────────────────────────────────────
  // FRÁGIL
  // RoleFit promedio ≥75% + %FUGA_CEREBROS >30% + sucesores formales <2
  // El equipo ejecuta bien — el riesgo es quedarse sin quién lo sostenga.
  // ──────────────────────────────────────────────────────────────────────────
  FRAGIL: {
    label: 'Equipo Frágil',
    coachingTip:
      'El equipo ejecuta bien, pero más de un tercio tiene compromiso crítico y hay menos de 2 sucesores formalizados. ' +
      'El riesgo no es el desempeño de hoy — es la continuidad.',

    actions: {
      agendar_comite: {
        tooltip:
          'Reúne al gerente del área y RRHH para activar el plan de sucesión ' +
          'antes de que las salidas superen la capacidad de reemplazo. ' +
          'El equipo ejecuta bien — el riesgo es quedarse sin quién lo sostenga.',
      },
      notificar: {
        tooltip:
          'Alerta a RRHH sobre concentración de riesgo de fuga sin cobertura de sucesión. ' +
          'Requiere priorización en agenda de personas.',
      },
      marcar: {
        tooltip:
          'Marca este equipo para seguimiento de sucesión activa. ' +
          'FocalizaHR monitorea la evolución del % FUGA_CEREBROS ' +
          'y los candidatos formalizados en el plan.',
      },
    },
  },

  // ──────────────────────────────────────────────────────────────────────────
  // QUEMADA
  // %BURNOUT_RISK >35% + mediana antigüedad >6 meses
  // No es rotación de onboarding — es sobrecarga en personas con tiempo en el cargo.
  // ──────────────────────────────────────────────────────────────────────────
  QUEMADA: {
    label: 'Sobrecarga Estructural',
    coachingTip:
      'Más de un tercio del equipo tiene compromiso alto pero dominio bajo el umbral, ' +
      'y la mayoría lleva más de 6 meses en el cargo. ' +
      'La señal apunta a sobrecarga estructural, no a curva de aprendizaje.',

    actions: {
      agendar_comite: {
        tooltip:
          'Reúne al gerente del área, RRHH y quien gestiona carga operativa ' +
          'para revisar distribución de trabajo. ' +
          'La señal no es de nuevos ingresando — es sobrecarga estructural ' +
          'en personas con tiempo en el cargo.',
      },
      notificar: {
        tooltip:
          'Alerta a RRHH sobre patrón de sobrecarga persistente. ' +
          'No es rotación de onboarding — requiere revisión de carga, ' +
          'no de proceso de incorporación.',
      },
      marcar: {
        tooltip:
          'Marca este equipo para seguimiento de carga. ' +
          'FocalizaHR monitorea si el % BURNOUT_RISK se reduce ' +
          'o escala al próximo ciclo.',
      },
    },
  },

  // ──────────────────────────────────────────────────────────────────────────
  // ESTANCADA
  // %EN_DESARROLLO >50% + mediana antigüedad >18 meses
  // No es problema de capacidad — es problema de gestión del desarrollo.
  // ──────────────────────────────────────────────────────────────────────────
  ESTANCADA: {
    label: 'Equipo Estancado',
    coachingTip:
      'Más de la mitad del equipo lleva sobre 18 meses en el cargo ' +
      'sin consolidar dominio. ' +
      'El tiempo descarta que sea una brecha de aprendizaje natural.',

    actions: {
      agendar_comite: {
        tooltip:
          'Reúne al gerente del área, RRHH y el equipo de desarrollo ' +
          'para revisar PDIs activos y opciones de movilidad. ' +
          'Más de la mitad del equipo lleva tiempo sin avanzar — ' +
          'no es un problema de capacidad, es un problema de gestión del desarrollo.',
      },
      notificar: {
        tooltip:
          'Alerta a RRHH sobre estancamiento estructural. ' +
          'La combinación de antigüedad alta y dominio bajo sostenido ' +
          'requiere intervención de desarrollo o redefinición de roles.',
      },
      marcar: {
        tooltip:
          'Marca este equipo para seguimiento de desarrollo activo. ' +
          'FocalizaHR monitorea el movimiento desde EN_DESARROLLO ' +
          'hacia otros cuadrantes en el próximo ciclo.',
      },
    },
  },

  // ──────────────────────────────────────────────────────────────────────────
  // RIESGO_OCULTO
  // ICC >25% — se activa cuando los otros patrones no aplican
  // El equipo parece sano — el riesgo no aparece en los indicadores habituales.
  // ──────────────────────────────────────────────────────────────────────────
  RIESGO_OCULTO: {
    label: 'Riesgo Oculto',
    coachingTip:
      'La distribución general del equipo parece estable, ' +
      'pero más del 25% del conocimiento crítico está concentrado ' +
      'en personas con señal de alerta. ' +
      'El riesgo no es visible hasta que una persona clave sale.',

    actions: {
      agendar_comite: {
        tooltip:
          'Reúne al gerente del área y RRHH para mapear quiénes concentran ' +
          'el conocimiento crítico y activar planes de transferencia. ' +
          'El equipo parece estable en distribución general — ' +
          'el riesgo no es visible hasta que una persona clave sale.',
      },
      notificar: {
        tooltip:
          'Alerta a RRHH sobre concentración de conocimiento institucional ' +
          'en personas con señal de alerta. ' +
          'El riesgo no aparece en los indicadores habituales.',
      },
      marcar: {
        tooltip:
          'Marca este equipo para seguimiento de transferencia de conocimiento. ' +
          'FocalizaHR monitorea la evolución del ICC ' +
          'y los planes de knowledge transfer activados.',
      },
    },
  },
}

// ════════════════════════════════════════════════════════════════════════════
// PUBLIC API
// ════════════════════════════════════════════════════════════════════════════

/**
 * Retorna narrativa completa para un patrón de gerencia.
 *
 * @param pattern — Patrón detectado por TalentActionService.detectPattern()
 *
 * Uso:
 *   const narrative = getGerenciaPatternNarrative(pattern)
 *   // coachingTip → card de diagnóstico
 *   // actions.agendar_comite.tooltip → botón Agendar Comité (i)
 *   // actions.notificar.tooltip      → botón Notificar (i)
 *   // actions.marcar.tooltip         → botón Marcar (i)
 */
export function getGerenciaPatternNarrative(
  pattern: GerenciaPattern
): GerenciaPatternNarrative {
  return GERENCIA_PATTERN_NARRATIVES[pattern]
}

/**
 * Retorna solo el tooltip de una acción específica.
 *
 * @param pattern — Patrón detectado
 * @param action  — Acción cuyo tooltip se necesita
 *
 * Uso:
 *   const tooltip = getActionTooltip('FRAGIL', 'agendar_comite')
 */
export function getActionTooltip(
  pattern: GerenciaPattern,
  action: GerenciaAction
): string {
  return GERENCIA_PATTERN_NARRATIVES[pattern].actions[action].tooltip
}
