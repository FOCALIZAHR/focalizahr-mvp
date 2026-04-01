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
      'Estos colaboradores superan sus metas y simultáneamente presentan indicadores de riesgo de fuga. ' +
      'La organización invirtió en su desarrollo y hoy genera retorno — perderlos implica costear reemplazo, curva de aprendizaje y oportunidades perdidas durante la vacante. ' +
      'Cada día sin intervención de retención erosiona la inversión acumulada.',
    coachingTip: 'Prioriza conversaciones de retención individuales. El costo de actuar es mínimo comparado con el costo de reemplazar.',
    teslaColor: '#EF4444', // red
  },

  bonosSinRespaldo: {
    headline: 'Compensación desconectada de resultados.',
    description:
      'La evaluación 360° posiciona a estas personas como high performers, pero su cumplimiento de metas no lo respalda. ' +
      'Aprobar bonos sobre esta base expone a la organización a premiar percepción en lugar de ejecución. ' +
      'El directorio necesita saber si la compensación variable refleja valor generado o sesgo del evaluador.',
    coachingTip: 'Cruza evaluación 360° con datos duros de metas antes de aprobar compensación variable.',
    teslaColor: '#F59E0B', // amber
  },

  talentoInvisible: {
    headline: 'Resultados sin reconocimiento.',
    description:
      'Colaboradores que cumplen metas sobre 80% pero reciben evaluaciones 360° bajas. ' +
      'El sistema de evaluación no detecta a quien genera valor real. ' +
      'Sin intervención, estos ejecutores silenciosos pierden motivación o se van a donde los vean.',
    coachingTip: 'Revisa si el evaluador 360° tiene visibilidad real del trabajo de estas personas. Posible sesgo de proximidad.',
    teslaColor: '#A78BFA', // purple
  },

  ejecutoresDesconectados: {
    headline: 'Ejecutan hoy, se van mañana.',
    description:
      'Metas altas con engagement crítico. Cumplen por inercia, disciplina o miedo — no por compromiso. ' +
      'La fuga de este perfil llega sin aviso porque los indicadores de rendimiento no lo anticipan. ' +
      'Son los que renuncian "de la nada" según el líder directo.',
    coachingTip: 'Agenda conversaciones de propósito, no de rendimiento. El problema no es capacidad — es conexión.',
    teslaColor: '#22D3EE', // cyan
  },

  noSabeVsNoQuiere: {
    headline: 'El diagnóstico determina la intervención.',
    description:
      'Metas bajo 40% con dos causas radicalmente distintas: brecha de competencias (no sabe) versus problema motivacional (no quiere). ' +
      'Capacitar a quien no quiere es tirar dinero. Presionar a quien no sabe es acelerar la fuga. ' +
      'Sin este diagnóstico diferencial, la intervención de HR es genérica e ineficaz.',
    coachingTip: 'Segmenta antes de intervenir. Capacitación para "no sabe", conversación de expectativas para "no quiere".',
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
