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
  /** V2: Pearson RoleFit × Metas (null if insufficient data) */
  pearsonR?: number | null
  /** V2: Calibration cross counts */
  calibrationUpWithLowGoals?: number
  calibrationDownWithHighGoals?: number
}

// ────────────────────────────────────────────────────────────────────────────
// NARRATIVE CARDS — 5 hallazgos
// ────────────────────────────────────────────────────────────────────────────

export const GOALS_NARRATIVE_DICTIONARY: Record<string, GoalsNarrative> = {

  fugaProductiva: {
    headline: 'Talento que rinde y que se va.',
    description:
      'Dos señales independientes confirman el mismo riesgo. ' +
      'Ya están clasificados como riesgo de fuga — alto dominio del cargo, compromiso crítico. ' +
      'Y sus metas sobre 80% confirman que no estás perdiendo peso muerto: estás perdiendo a quienes ejecutan. ' +
      'El costo de reemplazo ya está calculado. Cada día sin intervención lo incrementa.',
    coachingTip: 'Presenta estos nombres al comité de retención esta semana. El costo de reemplazo ya está calculado — úsalo como argumento.',
    teslaColor: '#EF4444', // red
  },

  bonosSinRespaldo: {
    headline: 'Compensación desconectada de resultados.',
    description:
      'Dos fuentes independientes se contradicen. La organización los percibe como alto desempeño — su evaluación integral los clasifica en el nivel superior. ' +
      'Pero sus metas están bajo el 40% de cumplimiento. ' +
      'Si la compensación variable considera la evaluación, estos pagos no tienen respaldo en resultados medibles. ' +
      'No es una opinión — es la contradicción que el sistema detectó.',
    coachingTip: 'Revisa estos casos antes del comité de compensación. El badge verde de evaluación junto al rojo de metas es la contradicción.',
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

  // ── V2: Nuevos sub-hallazgos persona ─────────────────────────────────

  sostenibilidad: {
    headline: 'Entregan resultados a costa de quemarse.',
    description:
      'Cumplen metas sobre el 80% pero no dominan las competencias que su cargo exige. ' +
      'Dos explicaciones posibles — y ninguna es sostenible: O las metas no están calibradas al nivel del cargo. ' +
      'O estas personas compensan con esfuerzo lo que les falta en dominio. ' +
      'En ambos casos, el rendimiento actual no se puede mantener.',
    coachingTip: 'Valida la dificultad de las metas vs. el nivel del cargo. Si las metas son reales, protege a estas personas antes de que colapsen.',
    teslaColor: '#F97316', // orange
  },

  evaluadorProtege: {
    headline: 'El gerente no exige y los datos lo confirman.',
    description:
      'No entregaron metas. Y su evaluador directo está clasificado como indulgente — asignó evaluaciones altas a todo su equipo. ' +
      'La contradicción no es de la persona: es del liderazgo. ' +
      'Evaluación alta más metas bajas en el mismo equipo es una firma de gestión, no de talento.',
    coachingTip: 'La conversación es con el gerente, no con el colaborador. Presenta los datos de su equipo completo.',
    teslaColor: '#DC2626', // red-600
  },

  pearsonRoleFitMetas: {
    headline: 'Las competencias predicen resultados — o no.',
    description:
      'La correlación Pearson entre RoleFit y cumplimiento de metas mide si el framework de competencias sirve. ' +
      'Correlación alta (r > 0.7): las competencias que exiges predicen ejecución. ' +
      'Correlación baja (r < 0.3): las competencias definidas no se relacionan con los resultados reales.',
    coachingTip: 'Gerencias con r bajo necesitan revisión del framework de competencias. HR debe validar si los CompetencyTargets están alineados con la operación real.',
    teslaColor: '#8B5CF6', // violet
  },

  calibracionJusta: {
    headline: 'La calibración corrigió — pero ¿en la dirección correcta?',
    description:
      'Personas calibradas hacia arriba con metas bajo 40%: la calibración legitimó, no corrigió. ' +
      'Personas calibradas hacia abajo con metas sobre 80%: se penalizó a quien entregó resultados. ' +
      'Ambos patrones erosionan la meritocracia y la credibilidad del proceso.',
    coachingTip: 'Presenta estos cruces al comité de calibración como evidencia. La próxima sesión debe tener las metas sobre la mesa.',
    teslaColor: '#0EA5E9', // sky
  },

  // ── V2: Sub-hallazgos organizacionales (por gerencia) ──────────────

  sesgoSistematico: {
    headline: 'El problema no es individual — es de liderazgo.',
    description:
      'Gerencias con evaluador clasificado como indulgente y metas promedio bajo 40%. ' +
      'Doble señal: quien evalúa no exige, y los resultados lo confirman. ' +
      'Cuando toda una gerencia tiene evaluaciones altas y resultados bajos, la conversación es con el gerente.',
    coachingTip: 'Presenta al gerente los datos de su equipo completo. No es una persona — es un patrón bajo su liderazgo.',
    teslaColor: '#DC2626', // red-600
  },
}

// ────────────────────────────────────────────────────────────────────────────
// QUADRANT NARRATIVES — para tooltips del scatter
// ────────────────────────────────────────────────────────────────────────────

export const QUADRANT_NARRATIVE_DICTIONARY: Record<string, QuadrantNarrative> = {

  CONSISTENT: {
    explanation: 'RoleFit alto y metas cumplidas. Domina su cargo y entrega resultados — las dos fuentes se alinean.',
    implication: 'Base confiable para decisiones de compensación y desarrollo.',
  },

  PERCEPTION_BIAS: {
    explanation: 'Domina su cargo pero no entrega resultados. La capacidad existe — la ejecución no.',
    implication: 'Problema de dirección o compromiso. No de capacidad.',
  },

  HIDDEN_PERFORMER: {
    explanation: 'Entrega resultados pero no domina las competencias del cargo. Rinde por esfuerzo, no por dominio.',
    implication: 'Sostenibilidad en riesgo. Validar si las metas están calibradas al nivel del cargo.',
  },

  DOUBLE_RISK: {
    explanation: 'RoleFit bajo y metas bajas. Dos fuentes independientes confirman el mismo diagnóstico.',
    implication: 'Plan de mejora con timeline definido. El costo de inacción ya está calculado.',
  },

  NO_GOALS: {
    explanation: 'Sin metas asignadas. No se puede validar el RoleFit contra resultados reales.',
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

  // V2: Pearson RoleFit × Metas
  if (g.pearsonR !== undefined && g.pearsonR !== null) {
    if (g.pearsonR > 0.7) {
      parts.push(`Correlación RoleFit-Metas de ${g.pearsonR.toFixed(2)} — las competencias predicen resultados.`)
    } else if (g.pearsonR < 0.3) {
      parts.push(`Correlación RoleFit-Metas de solo ${g.pearsonR.toFixed(2)} — las competencias definidas no predicen ejecución. Revisar framework.`)
    }
  }

  // V2: Calibration justice
  if (g.calibrationUpWithLowGoals && g.calibrationUpWithLowGoals > 0) {
    parts.push(`${g.calibrationUpWithLowGoals} persona(s) calibrada(s) hacia arriba con metas bajo 40% — inflación política.`)
  }
  if (g.calibrationDownWithHighGoals && g.calibrationDownWithHighGoals > 0) {
    parts.push(`${g.calibrationDownWithHighGoals} persona(s) calibrada(s) hacia abajo con metas sobre 80% — sesgo contra resultados.`)
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
