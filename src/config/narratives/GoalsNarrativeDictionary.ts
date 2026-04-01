// ════════════════════════════════════════════════════════════════════════════
// DICCIONARIO DE NARRATIVAS — METAS × PERFORMANCE
// src/config/narratives/GoalsNarrativeDictionary.ts
// ════════════════════════════════════════════════════════════════════════════
// Tono: McKinsey para directorio — una idea por oración. Sin jerga HR.
// Key: narrative card key from GoalsCorrelation.constants.ts
// Consumidores: NarrativasTab (description + coachingTip), GerenciasTab (gerencia narratives)
// ════════════════════════════════════════════════════════════════════════════

// ────────────────────────────────────────────────────────────────────────────
// TYPES
// ────────────────────────────────────────────────────────────────────────────

export interface GoalsNarrative {
  /** Headline tono CEO — frase directa */
  headline: string
  /** Cuerpo de 2-3 oraciones — consecuencia financiera/operativa */
  description: string
  /** Coaching tip — qué hacer */
  coachingTip: string
  /** Tesla line color hex */
  teslaColor: string
}

export interface QuadrantNarrative {
  /** Explicación corta del cuadrante */
  explanation: string
  /** Implicación para decisiones */
  implication: string
}

export interface GerenciaNarrativeInput {
  gerenciaName: string
  disconnectionRate: number
  coverage: number
  avgProgress: number
  avgScore360: number
  evaluatorClassification?: string | null
  confidenceLevel: 'green' | 'amber' | 'red'
  employeeCount: number
}

// ────────────────────────────────────────────────────────────────────────────
// NARRATIVE CARDS — 5 hallazgos
// ────────────────────────────────────────────────────────────────────────────

export const GOALS_NARRATIVE_DICTIONARY: Record<string, GoalsNarrative> = {

  fugaProductiva: {
    headline: 'Talento que rinde y que se va.',
    description:
      'El 9-box ya clasificó a estas personas como riesgo de fuga. Las metas confirman que perderlos duele: cumplen sobre 80%. ' +
      'Son dos fuentes independientes diciendo lo mismo — no es una opinión, es evidencia cruzada. ' +
      'Cada día sin intervención de retención erosiona la inversión acumulada.',
    coachingTip: 'Presenta estos nombres al comité de retención esta semana. El costo de reemplazo ya está calculado — úsalo como argumento.',
    teslaColor: '#EF4444', // red
  },

  bonosSinRespaldo: {
    headline: 'Compensación desconectada de resultados.',
    description:
      'Sus pares los evalúan sobre 4.0 en el 360°, pero sus metas están bajo 40%. ' +
      'Dos fuentes de datos cuentan historias opuestas. ' +
      'Si la compensación variable depende del 360°, estos pagos no tienen respaldo en resultados medibles.',
    coachingTip: 'Revisa estos casos antes del comité de compensación. Los badges muestran la contradicción: evaluación alta, ejecución baja.',
    teslaColor: '#F59E0B', // amber
  },

  talentoInvisible: {
    headline: 'Resultados sin reconocimiento.',
    description:
      'Cumplen metas sobre 80% pero el 360° los posiciona bajo 3.0. ' +
      'El sistema de evaluación no detecta a quien genera valor real — posible sesgo de proximidad o falta de visibilidad. ' +
      'Sin intervención, estos ejecutores silenciosos pierden motivación o se van a donde los vean.',
    coachingTip: 'Pregunta al evaluador si tiene visibilidad directa del trabajo de estas personas. Si no la tiene, el 360° es ruido.',
    teslaColor: '#A78BFA', // purple
  },

  ejecutoresDesconectados: {
    headline: 'Ejecutan hoy, se van mañana.',
    description:
      'Metas sobre 80% pero engagement en nivel crítico. Cumplen por inercia o disciplina, no por compromiso. ' +
      'Los indicadores de rendimiento no anticipan esta fuga — son los que renuncian "de la nada" según el líder directo. ' +
      'El badge rojo de engagement junto al verde de metas es la alerta.',
    coachingTip: 'Agenda conversaciones de propósito con su líder directo, no de rendimiento. El problema no es capacidad — es conexión.',
    teslaColor: '#22D3EE', // cyan
  },

  noSabeVsNoQuiere: {
    headline: 'El diagnóstico determina la intervención.',
    description:
      'Metas bajo 40% con dos causas que el sistema separó por RoleFit: ' +
      'RoleFit bajo 60% = no domina las competencias del cargo (capacitar). ' +
      'RoleFit sobre 75% = tiene la capacidad pero no la aplica (conversar expectativas). ' +
      'Capacitar a quien no quiere es tirar dinero. Presionar a quien no sabe es acelerar la fuga.',
    coachingTip: 'Mira el badge de RoleFit en cada persona. Ese dato define si es formación o conversación de expectativas.',
    teslaColor: '#64748B', // slate
  },
}

// ────────────────────────────────────────────────────────────────────────────
// QUADRANT NARRATIVES — para tooltips del scatter
// ────────────────────────────────────────────────────────────────────────────

export const QUADRANT_NARRATIVE_DICTIONARY: Record<string, QuadrantNarrative> = {

  CONSISTENT: {
    explanation: 'Evaluación 360° alta y cumplimiento de metas alto. La percepción de pares coincide con resultados medibles.',
    implication: 'Base confiable para decisiones de compensación y promoción.',
  },

  PERCEPTION_BIAS: {
    explanation: 'Metas altas pero evaluación 360° baja. El equipo no percibe el valor que esta persona genera.',
    implication: 'Posible sesgo de proximidad o falta de visibilidad. Revisar criterios del evaluador.',
  },

  HIDDEN_PERFORMER: {
    explanation: 'Evaluación 360° alta pero metas bajas. La percepción supera la ejecución demostrable.',
    implication: 'Riesgo de premiar percepción sobre resultados. Validar antes de aprobar bonos.',
  },

  DOUBLE_RISK: {
    explanation: 'Evaluación 360° baja y metas bajas. Doble señal de alerta — ni pares ni resultados respaldan el rendimiento.',
    implication: 'Candidato a plan de mejora con timeline definido. Evaluar costo de inacción.',
  },

  NO_GOALS: {
    explanation: 'Sin metas asignadas. No se puede validar la evaluación 360° contra resultados reales.',
    implication: 'Punto ciego en la medición. Asignar metas antes del próximo ciclo.',
  },
}

// ────────────────────────────────────────────────────────────────────────────
// GERENCIA NARRATIVE BUILDER
// ────────────────────────────────────────────────────────────────────────────

export function buildGerenciaNarrative(g: GerenciaNarrativeInput): string {
  const parts: string[] = []

  // Confidence
  if (g.confidenceLevel === 'red') {
    if (g.avgProgress < 40) {
      parts.push(
        `${g.gerenciaName} presenta un patrón de evaluador indulgente con metas incumplidas. ` +
        `La evaluación 360° promedio de ${g.avgScore360.toFixed(1)} no se respalda con el progreso real de ${g.avgProgress}%.`
      )
    } else {
      parts.push(
        `${g.gerenciaName} muestra una desconexión severa entre evaluación y ejecución. ` +
        `Con ${g.disconnectionRate}% de desconexión, las decisiones de compensación basadas en estos datos son riesgosas.`
      )
    }
  } else if (g.confidenceLevel === 'amber') {
    parts.push(
      `${g.gerenciaName} opera con tendencia central en evaluaciones — difícil distinguir top performers de underperformers. ` +
      `Progreso promedio: ${g.avgProgress}%.`
    )
  } else {
    parts.push(
      `${g.gerenciaName} muestra alineación entre evaluación 360° y cumplimiento de metas. ` +
      `Datos confiables para decisiones de compensación.`
    )
  }

  // Coverage warning
  if (g.coverage < 50) {
    parts.push(`Solo ${g.coverage}% tiene metas asignadas — la muestra es insuficiente para conclusiones.`)
  } else if (g.coverage < 70) {
    parts.push(`Cobertura de metas en ${g.coverage}% — ampliar antes de tomar decisiones.`)
  }

  // Evaluator classification
  if (g.evaluatorClassification && g.confidenceLevel !== 'green') {
    parts.push(`Evaluador clasificado como "${g.evaluatorClassification}".`)
  }

  return parts.join(' ')
}

// ────────────────────────────────────────────────────────────────────────────
// HELPERS
// ────────────────────────────────────────────────────────────────────────────

export function getNarrative(key: string): GoalsNarrative | null {
  return GOALS_NARRATIVE_DICTIONARY[key] ?? null
}

export function getQuadrantNarrative(quadrant: string): QuadrantNarrative | null {
  return QUADRANT_NARRATIVE_DICTIONARY[quadrant] ?? null
}
