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
    headline: 'Cumplen metas y están en riesgo de irse.',
    description:
      'Dos señales independientes confirman el mismo riesgo. ' +
      'Domina su cargo y entrega resultados — pero su compromiso emocional es crítico. ' +
      'El líder directo probablemente no lo sabe: ve las metas cumplidas y asume que todo está bien. ' +
      'El compromiso bajo es exactamente la señal que los resultados ocultan. ' +
      'El costo de reemplazo ya está calculado. Cuando el rendimiento finalmente caiga, ya será tarde.',
    coachingTip: 'La señal que el líder no ve es la más importante. ¿Perdió conexión con el propósito del rol? ¿Con el equipo? ¿Con su líder directo? Esa conversación no puede esperar a que los resultados bajen — porque cuando bajan, la decisión ya está tomada.',
    teslaColor: '#EF4444', // red
  },

  bonosSinRespaldo: {
    headline: 'Percepción alta, resultados bajos.',
    description:
      'Dos fuentes independientes se contradicen. Su evaluación integral los clasifica en el nivel superior — pero sus metas están bajo el 40%. ' +
      'O el sistema de evaluación no está midiendo lo que el cargo realmente exige. O las metas están calibradas a la baja y no representan un desafío real. ' +
      'En ambos casos, la organización está tomando decisiones — de desarrollo, de promoción, de compensación — basadas en una señal que no coincide con los resultados. ' +
      'Cada decisión basada en esa señal refuerza el patrón.',
    coachingTip: 'Si la compensación variable considera la evaluación, estos casos la ponen a prueba. La contradicción está documentada.',
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
    headline: 'No cumplen metas: unos no pueden, otros no quieren.',
    description:
      'No cumplieron metas. Pero la causa importa más que el resultado. ' +
      'El sistema separó dos grupos: quienes no dominan las competencias que su cargo exige — y quienes las dominan pero no las aplican. ' +
      'Tratarlos igual es el error más caro. Capacitar a quien no quiere es tirar dinero. Presionar a quien no sabe es acelerar la fuga.',
    coachingTip: 'La pregunta frente a cada nombre: ¿no puede o no quiere? La respuesta cambia completamente la intervención.',
    teslaColor: '#64748B', // slate
  },

  // ── V2: Nuevos sub-hallazgos persona ─────────────────────────────────

  sostenibilidad: {
    headline: 'Cumplen metas sin dominar su cargo.',
    description:
      'Cumplen metas sobre el 80% pero no dominan las competencias que su cargo exige. ' +
      'Dos explicaciones posibles — y ninguna es sostenible: O las metas no están calibradas al nivel del cargo. ' +
      'O estas personas compensan con esfuerzo lo que les falta en dominio. ' +
      'En ambos casos, el rendimiento actual no se puede mantener.',
    coachingTip: '¿Las metas están calibradas al nivel del cargo? Si lo están, el esfuerzo que sostiene estos resultados tiene fecha de vencimiento.',
    teslaColor: '#F97316', // orange
  },

  evaluadorProtege: {
    headline: 'El gerente no exige y los datos lo confirman.',
    description:
      'No cumplieron metas. Pero su evaluación de desempeño es alta. ' +
      'Dos fuentes se contradicen — y apuntan al mismo evaluador. ' +
      'O el líder no diferencia entre quienes cumplen y quienes no. O el sistema de evaluación no le exige hacerlo. ' +
      'Cuando la evaluación no refleja los resultados, las decisiones que se toman sobre esa persona tampoco.',
    coachingTip: 'No es una persona. Es un patrón completo bajo el mismo liderazgo. ¿Los datos del equipo respaldan la evaluación que su líder les dio?',
    teslaColor: '#DC2626', // red-600
  },

  pearsonRoleFitMetas: {
    headline: 'Las competencias evaluadas no predicen resultados.',
    description:
      'En esta gerencia, quienes más dominan su cargo no son quienes más cumplen metas — y viceversa. ' +
      'O las competencias que se evalúan no corresponden al trabajo real. ' +
      'O las metas no están definidas en función de lo que el cargo exige. ' +
      'Si la medición no predice el resultado, las decisiones basadas en esa medición tampoco.',
    coachingTip: 'La pregunta no es de personas — es de diseño. ¿Las competencias que se evalúan corresponden a lo que el negocio realmente necesita de ese rol?',
    teslaColor: '#8B5CF6', // violet
  },

  calibracionJusta: {
    headline: 'La calibración contradice los resultados.',
    description:
      'La calibración ajustó evaluaciones — pero en dirección opuesta a los resultados. ' +
      'Quienes no cumplieron metas fueron calibrados hacia arriba. Quienes sí cumplieron fueron calibrados hacia abajo. ' +
      'O la calibración se usó para corregir percepción, no rendimiento. O hubo factores interpersonales que pesaron más que los datos. ' +
      'Cuando el proceso de calibración contradice los resultados, pierde credibilidad ante quienes sí entregan.',
    coachingTip: 'Si la calibración no consideró las metas, ¿qué consideró? La próxima sesión lo dirá.',
    teslaColor: '#0EA5E9', // sky
  },

  sucesionRota: {
    headline: 'El plan de sucesión no tiene respaldo en resultados.',
    description:
      'Dos señales se contradicen. La organización los posicionó como los próximos líderes — pero sus metas están bajo el 40%. ' +
      'O el plan de sucesión se construyó sobre percepción, no sobre ejecución. O las metas no estaban calibradas para su nivel. ' +
      'Un plan de sucesión sin respaldo en resultados es una apuesta que el negocio paga si falla.',
    coachingTip: '¿El plan de sucesión consideró los resultados, o solo la percepción del comité? La respuesta define si es un plan o una esperanza.',
    teslaColor: '#8B5CF6', // violet
  },

  blastRadius: {
    headline: 'Un líder, un equipo entero desconectado.',
    description:
      'Más del 40% de este equipo muestra compromiso en nivel crítico. No es una coincidencia — es un patrón bajo el mismo líder. ' +
      'O el liderazgo no genera conexión. O hay un problema estructural que el equipo absorbe en silencio. ' +
      'Cuando un equipo entero se desconecta, la señal no viene de abajo.',
    coachingTip: 'No es el equipo. Es lo que el equipo tiene en común. ¿Qué pasó bajo ese liderazgo para que el compromiso cayera en bloque?',
    teslaColor: '#F43F5E', // rose
  },

  // ── V2: Sub-hallazgos organizacionales (por gerencia) ──────────────

  sesgoSistematico: {
    headline: 'Evaluación alta y metas bajas en la misma gerencia.',
    description:
      'Dos señales apuntan al mismo lugar. La evaluación de desempeño es alta en toda la gerencia — pero las metas están bajo el 40%. ' +
      'O el líder no diferencia entre quienes rinden y quienes no. O las metas no se están usando como medida de exigencia. ' +
      'En ambos casos, el problema no es de las personas — es de quién las evalúa. Un patrón así no cambia solo.',
    coachingTip: 'No es una persona. Es un patrón completo bajo el mismo liderazgo. ¿Los datos del equipo respaldan la evaluación que su líder les dio?',
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

  // Confidence — el motor ya cruza evaluador × avgProgress × disconnection × Pearson.
  // Aquí solo leemos el flag limpio.
  if (g.confidenceLevel === 'red') {
    if (g.avgProgress < 40 && g.evaluatorClassification === 'INDULGENTE') {
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

  // Evaluator classification (contexto extra cuando no está verde)
  if (g.evaluatorClassification && g.confidenceLevel !== 'green') {
    parts.push(`Evaluador clasificado como "${g.evaluatorClassification}".`)
  }

  // Pearson positivo fuerte (detalle informativo cuando > 0.7)
  if (g.pearsonR !== undefined && g.pearsonR !== null && g.pearsonR > 0.7) {
    parts.push(`Correlación RoleFit-Metas de ${g.pearsonR.toFixed(2)} — las competencias predicen resultados.`)
  }

  // Calibration justice
  if (g.calibrationUpWithLowGoals && g.calibrationUpWithLowGoals > 0) {
    parts.push(`${g.calibrationUpWithLowGoals} persona(s) calibrada(s) hacia arriba con metas bajo 40% — inflación política.`)
  }
  if (g.calibrationDownWithHighGoals && g.calibrationDownWithHighGoals > 0) {
    parts.push(`${g.calibrationDownWithHighGoals} persona(s) calibrada(s) hacia abajo con metas sobre 80% — sesgo contra resultados.`)
  }

  return parts.join(' ')
}

// ────────────────────────────────────────────────────────────────────────────
// INTEGRITY VERDICT — Sentencia de Integridad para modal gerencia
// ────────────────────────────────────────────────────────────────────────────

export type IntegrityStatus = 'AUDITABLE' | 'CON_RESERVAS' | 'NO_AUDITABLE'

export interface IntegrityVerdict {
  status: IntegrityStatus
  title: string
  narrative: string
}

/**
 * Emite un veredicto sobre la integridad de medición de una gerencia.
 * Narrativas auditadas contra 6 Reglas de Oro (skill focalizahr-narrativas):
 * contradicción protagonista, "O" McKinsey, consecuencia no instrucción,
 * sin jerga, una idea por oración, cierre ancla urgencia.
 */
export function buildIntegrityVerdict(g: GerenciaNarrativeInput): IntegrityVerdict {
  // NO AUDITABLE — el motor ya integra evaluador × avgProgress × disconnection × Pearson.
  // Aquí solo sub-routeamos la narrativa según la causa dominante.
  if (g.confidenceLevel === 'red') {
    const pearsonLow = g.pearsonR !== undefined && g.pearsonR !== null && g.pearsonR < 0.3
    const disconnectionHigh = g.disconnectionRate > 40

    // Caso 1: Pearson bajo sin disconnection alta — el juicio es azar
    if (pearsonLow && !disconnectionHigh) {
      return {
        status: 'NO_AUDITABLE',
        title: 'Integridad de medición: no auditable',
        narrative:
          `Lo que se evalúa en ${g.gerenciaName} no predice lo que se entrega. ` +
          `El juicio del líder sobre su equipo y los resultados reales son dos historias distintas. ` +
          `Aprobar compensaciones basadas en estos datos es financiar decisiones sin base.`,
      }
    }

    // Caso 2: Evaluador indulgente con metas incumplidas
    if (g.avgProgress < 40 && g.evaluatorClassification === 'INDULGENTE') {
      return {
        status: 'NO_AUDITABLE',
        title: 'Integridad de medición: no auditable',
        narrative:
          `${g.gerenciaName} recibe evaluaciones altas mientras entrega metas bajas. ` +
          `O el líder no distingue entre quien rinde y quien no. ` +
          `O el sistema no le exige hacerlo. ` +
          `Cualquier compensación basada en estos datos premia la subjetividad y castiga al resto de la organización.`,
      }
    }

    // Caso 3: Desconexión severa — narrativa por defecto
    return {
      status: 'NO_AUDITABLE',
      title: 'Integridad de medición: no auditable',
      narrative:
        `La evaluación y los resultados de ${g.gerenciaName} cuentan historias distintas. ` +
        `El líder dice una cosa sobre su equipo, el negocio dice otra. ` +
        `Aprobar compensaciones basadas en estos datos es financiar la ineficiencia operativa.`,
    }
  }

  // CON RESERVAS — tendencia central, difícil distinguir
  if (g.confidenceLevel === 'amber') {
    return {
      status: 'CON_RESERVAS',
      title: 'Integridad de medición: auditable con reservas',
      narrative:
        `${g.gerenciaName} opera con tendencia central en sus evaluaciones. ` +
        `Es difícil distinguir a quien rinde de quien no cuando todos reciben notas parecidas. ` +
        `Los datos sirven como punto de partida — pero cada decisión de compensación exige confirmación caso por caso.`,
    }
  }

  // AUDITABLE — coherencia confirmada
  return {
    status: 'AUDITABLE',
    title: 'Integridad de medición: auditable',
    narrative:
      `Las evaluaciones de ${g.gerenciaName} predicen los resultados. ` +
      `Lo que el líder dice sobre su equipo se confirma con lo que entregan. ` +
      `Base confiable para decisiones de compensación en esta unidad.`,
  }
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
