// ════════════════════════════════════════════════════════════════════════════
// FEEDBACK INTELLIGENCE SERVICE
// src/lib/services/FeedbackIntelligenceService.ts
// ════════════════════════════════════════════════════════════════════════════
// Motor de feedback inteligente para análisis de brechas y coaching
// Diseñado por expertos en Desarrollo Organizacional
// Lenguaje: Simple, directo, accionable
// ════════════════════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════════════════════════════════
// TIPOS
// ════════════════════════════════════════════════════════════════════════════

export type GapType = 'BLIND_SPOT' | 'HIDDEN_STRENGTH' | 'PEER_DISCONNECT'
export type PerformanceLevel = 'EXCEPCIONAL' | 'SUPERA' | 'CUMPLE' | 'EN_DESARROLLO' | 'CRITICO'
export type FeedbackTone = 'recognition' | 'development' | 'urgent'

export interface FeedbackContext {
  employeeName: string
  firstName: string
  competencyName: string
  gapType: GapType
  selfScore: number
  managerScore: number
  delta: number
  overallScore?: number
  performanceLevel?: PerformanceLevel
  isLeader?: boolean
}

export interface GeneratedFeedback {
  insight: string
  question: string
  actionSuggestion?: string
  tone: FeedbackTone
}

export interface CompetencySummary {
  competencyCode: string
  competencyName: string
  gapType: GapType
  delta: number
  selfScore: number
  managerScore: number
}

export interface ExecutiveSummary {
  headline: string
  overview: string
  priorities: Array<{
    rank: number
    competency: string
    action: string
    gapType: GapType
  }>
  coachingTip: string
  openingStatement: string
}

interface FeedbackTemplate {
  id: string
  insight: string
  question: string
  action?: string
  tone: FeedbackTone
  minDelta?: number
  maxDelta?: number
}

// ════════════════════════════════════════════════════════════════════════════
// TEMPLATES: PUNTO CIEGO (Self > Manager)
// ════════════════════════════════════════════════════════════════════════════

const BLIND_SPOT_TEMPLATES: FeedbackTemplate[] = [
  // Delta bajo (0.5 - 1.0)
  {
    id: 'bs_001',
    insight: '{firstName} se percibe ligeramente más fuerte en {competencia} de lo que observas. Puede estar confundiendo esfuerzo con resultado visible.',
    question: '¿Qué feedback has recibido de otros sobre tu {competencia}?',
    action: 'Pedir feedback específico a pares sobre esta competencia.',
    tone: 'development',
    minDelta: 0.5,
    maxDelta: 1.0
  },
  {
    id: 'bs_002',
    insight: 'Hay una pequeña diferencia entre cómo {firstName} ve su {competencia} y tu observación. Vale la pena alinear expectativas.',
    question: '¿Cómo sabes cuándo has aplicado bien {competencia}? ¿Qué indicadores usas?',
    action: 'Definir juntos indicadores objetivos de éxito.',
    tone: 'development',
    minDelta: 0.5,
    maxDelta: 1.0
  },
  {
    id: 'bs_003',
    insight: '{firstName} tiene buena intención en {competencia}, pero el impacto observable es menor al que percibe.',
    question: '¿Me puedes dar un ejemplo reciente donde sentiste que destacaste en {competencia}?',
    action: 'Contrastar percepción con ejemplos concretos.',
    tone: 'development',
    minDelta: 0.5,
    maxDelta: 1.0
  },
  {
    id: 'bs_004',
    insight: 'La autopercepción de {firstName} en {competencia} es optimista. No es preocupante, pero merece conversación.',
    question: '¿Qué crees que dirían tus compañeros sobre tu {competencia}?',
    action: 'Fomentar autorreflexión desde perspectiva de otros.',
    tone: 'development',
    minDelta: 0.5,
    maxDelta: 1.0
  },
  {
    id: 'bs_005',
    insight: '{firstName} muestra confianza en {competencia}. Tu rol es ayudarle a ver dónde puede seguir creciendo.',
    question: '¿En qué situaciones sientes que {competencia} te cuesta más?',
    action: 'Identificar contextos de mejora específicos.',
    tone: 'development',
    minDelta: 0.5,
    maxDelta: 1.0
  },
  // Delta medio (1.0 - 2.0)
  {
    id: 'bs_006',
    insight: 'Hay una brecha notable entre autopercepción y observación en {competencia}. {firstName} necesita ejemplos concretos de impacto.',
    question: 'Dame un ejemplo donde sentiste que aplicaste bien {competencia}. ¿Cuál fue el resultado medible?',
    action: 'Establecer métricas objetivas para el próximo trimestre.',
    tone: 'development',
    minDelta: 1.0,
    maxDelta: 2.0
  },
  {
    id: 'bs_007',
    insight: '{firstName} se sobrevalora en {competencia}. No es mala actitud, probablemente falta visibilidad del estándar esperado.',
    question: '¿Conoces a alguien en la empresa que sea excelente en {competencia}? ¿Qué hace diferente?',
    action: 'Usar referentes internos como modelo.',
    tone: 'development',
    minDelta: 1.0,
    maxDelta: 2.0
  },
  {
    id: 'bs_008',
    insight: 'La diferencia en {competencia} sugiere que {firstName} no está recibiendo suficiente feedback en el día a día.',
    question: '¿Con qué frecuencia recibes feedback sobre tu {competencia}?',
    action: 'Implementar feedback más frecuente y específico.',
    tone: 'development',
    minDelta: 1.0,
    maxDelta: 2.0
  },
  {
    id: 'bs_009',
    insight: '{firstName} puede estar midiendo {competencia} con criterios diferentes a los de la organización.',
    question: '¿Cómo defines tú el éxito en {competencia}? ¿Qué estándar usas?',
    action: 'Alinear definición de competencia con expectativas organizacionales.',
    tone: 'development',
    minDelta: 1.0,
    maxDelta: 2.0
  },
  {
    id: 'bs_010',
    insight: 'Es posible que {firstName} tenga la habilidad en {competencia} pero no la esté demostrando consistentemente.',
    question: '¿Hay algo que te impida mostrar tu {competencia} en el trabajo diario?',
    action: 'Identificar barreras para demostrar la competencia.',
    tone: 'development',
    minDelta: 1.0,
    maxDelta: 2.0
  },
  // Delta alto (2.0+)
  {
    id: 'bs_011',
    insight: 'Hay una brecha significativa en {competencia}. {firstName} necesita un plan de desarrollo estructurado con hitos claros.',
    question: '¿Qué apoyo necesitas para mejorar en {competencia}?',
    action: 'Crear plan de desarrollo con objetivos SMART.',
    tone: 'urgent',
    minDelta: 2.0,
    maxDelta: 5.0
  },
  {
    id: 'bs_012',
    insight: 'La autopercepción de {firstName} en {competencia} está muy alejada de la realidad. Esto requiere conversación directa y honesta.',
    question: 'Voy a ser directo: veo una brecha importante en {competencia}. ¿Cómo podemos trabajar juntos en esto?',
    action: 'Feedback directo + plan de acción inmediato.',
    tone: 'urgent',
    minDelta: 2.0,
    maxDelta: 5.0
  },
  {
    id: 'bs_013',
    insight: '{firstName} tiene un punto ciego importante en {competencia}. Sin intervención, esto puede limitar su crecimiento.',
    question: '¿Estarías abierto/a a recibir feedback más frecuente sobre {competencia}?',
    action: 'Establecer check-ins semanales sobre esta competencia.',
    tone: 'urgent',
    minDelta: 2.0,
    maxDelta: 5.0
  },
  {
    id: 'bs_014',
    insight: 'La desconexión en {competencia} es preocupante. {firstName} puede estar en un ciclo donde no recibe o no escucha feedback.',
    question: '¿Cuándo fue la última vez que recibiste feedback constructivo sobre {competencia}? ¿Qué hiciste con él?',
    action: 'Romper el ciclo con feedback específico y seguimiento.',
    tone: 'urgent',
    minDelta: 2.0,
    maxDelta: 5.0
  },
  {
    id: 'bs_015',
    insight: '{firstName} necesita recalibrar su autopercepción en {competencia}. Esto es desarrollo, no crítica.',
    question: 'Quiero ayudarte a crecer en {competencia}. ¿Qué tan abierto/a estás a trabajar en esto?',
    action: 'Establecer compromiso mutuo de desarrollo.',
    tone: 'urgent',
    minDelta: 2.0,
    maxDelta: 5.0
  },
  // Adicionales variados
  {
    id: 'bs_016',
    insight: '{firstName} tiene confianza en {competencia}, pero los resultados no lo reflejan aún. Hay potencial por desarrollar.',
    question: '¿Qué obstáculos ves para demostrar mejor tu {competencia}?',
    tone: 'development'
  },
  {
    id: 'bs_017',
    insight: 'La brecha en {competencia} puede deberse a diferentes contextos de observación. Vale explorar dónde sí demuestra la competencia.',
    question: '¿En qué situaciones sientes que tu {competencia} brilla más?',
    tone: 'development'
  },
  {
    id: 'bs_018',
    insight: '{firstName} podría beneficiarse de un mentor que modele excelencia en {competencia}.',
    question: '¿Te gustaría tener un mentor que te ayude a desarrollar {competencia}?',
    tone: 'development'
  },
  {
    id: 'bs_019',
    insight: 'Existe una oportunidad de desarrollo en {competencia}. {firstName} tiene la actitud, falta afinar la ejecución.',
    question: '¿Qué sería diferente si fueras excelente en {competencia}?',
    tone: 'development'
  },
  {
    id: 'bs_020',
    insight: '{firstName} se ve a sí mismo/a mejor en {competencia} de lo que demuestran los hechos. Es momento de recalibrar.',
    question: '¿Cómo te sentirías si te digo que veo oportunidad de mejora en {competencia}?',
    tone: 'development'
  }
]

// ════════════════════════════════════════════════════════════════════════════
// TEMPLATES: TALENTO OCULTO (Self < Manager)
// ════════════════════════════════════════════════════════════════════════════

const HIDDEN_STRENGTH_TEMPLATES: FeedbackTemplate[] = [
  {
    id: 'hs_001',
    insight: '{firstName} se subestima en {competencia}. Tú ves más potencial del que reconoce. El reconocimiento explícito puede ayudar.',
    question: '¿Sabías que destacas en {competencia}? ¿Qué te hace dudar de esta fortaleza?',
    action: 'Dar reconocimiento específico y frecuente.',
    tone: 'recognition'
  },
  {
    id: 'hs_002',
    insight: 'Interesante: {firstName} no reconoce su fortaleza en {competencia}. Validar su capacidad puede aumentar su confianza.',
    question: '¿Por qué crees que no eres tan bueno/a en {competencia} como realmente eres?',
    action: 'Asignar proyectos que visibilicen esta fortaleza.',
    tone: 'recognition'
  },
  {
    id: 'hs_003',
    insight: '{firstName} tiene talento oculto en {competencia}. Probablemente necesita más oportunidades para brillar.',
    question: '¿Te gustaría tomar más responsabilidad en áreas que requieran {competencia}?',
    action: 'Delegar tareas que aprovechen esta fortaleza.',
    tone: 'recognition'
  },
  {
    id: 'hs_004',
    insight: 'Hay una modestia excesiva en cómo {firstName} ve su {competencia}. Es momento de que reconozca su valor.',
    question: '¿Qué necesitarías para sentirte más seguro/a en tu {competencia}?',
    action: 'Feedback positivo consistente + nuevos desafíos.',
    tone: 'recognition'
  },
  {
    id: 'hs_005',
    insight: '{firstName} podría ser referente en {competencia} pero no lo ve. Tu rol es ayudarle a verse con claridad.',
    question: '¿Cómo te sentirías siendo mentor de otros en {competencia}?',
    action: 'Posicionar como referente interno.',
    tone: 'recognition'
  },
  {
    id: 'hs_006',
    insight: 'La humildad de {firstName} en {competencia} es refrescante, pero puede estar limitando su crecimiento profesional.',
    question: '¿Crees que tu humildad en {competencia} te ha frenado en algún momento?',
    action: 'Trabajar en autopercepción y autoconfianza.',
    tone: 'recognition'
  },
  {
    id: 'hs_007',
    insight: '{firstName} tiene más capacidad en {competencia} de la que se atribuye. Es talento que debe aprovecharse.',
    question: '¿Qué pasaría si te dijera que eres mejor en {competencia} de lo que crees?',
    action: 'Dar visibilidad a sus logros en esta área.',
    tone: 'recognition'
  },
  {
    id: 'hs_008',
    insight: 'Detectamos una fortaleza subestimada en {competencia}. {firstName} puede estar comparándose con estándares irreales.',
    question: '¿Con quién te comparas cuando evalúas tu {competencia}?',
    action: 'Recalibrar estándares de autoexigencia.',
    tone: 'recognition'
  },
  {
    id: 'hs_009',
    insight: '{firstName} es más fuerte en {competencia} de lo que admite. Esto puede deberse a experiencias pasadas que minaron su confianza.',
    question: '¿Hubo alguna experiencia que te hizo dudar de tu {competencia}?',
    action: 'Reconstruir confianza con experiencias positivas.',
    tone: 'recognition'
  },
  {
    id: 'hs_010',
    insight: 'La organización se beneficiaría de que {firstName} asuma más protagonismo en {competencia}.',
    question: '¿Estarías dispuesto/a a liderar iniciativas relacionadas con {competencia}?',
    action: 'Ofrecer oportunidades de liderazgo en esta área.',
    tone: 'recognition'
  },
  {
    id: 'hs_011',
    insight: '{firstName} tiene una fortaleza sin explotar en {competencia}. Es momento de activarla.',
    question: '¿Qué te frena de usar más tu {competencia} en el día a día?',
    action: 'Eliminar barreras para que brille.',
    tone: 'recognition'
  },
  {
    id: 'hs_012',
    insight: 'Veo en {firstName} una capacidad natural para {competencia} que merece reconocimiento formal.',
    question: '¿Cómo te gustaría que reconociéramos tu aporte en {competencia}?',
    action: 'Reconocimiento público y desarrollo de carrera.',
    tone: 'recognition'
  }
]

// ════════════════════════════════════════════════════════════════════════════
// TEMPLATES: PERCEPCIÓN DIFERENCIADA (Peer vs Manager)
// ════════════════════════════════════════════════════════════════════════════

const PEER_DISCONNECT_TEMPLATES: FeedbackTemplate[] = [
  {
    id: 'pd_001',
    insight: 'Los pares perciben a {firstName} diferente a ti en {competencia}. Puede haber contextos donde se comporta distinto.',
    question: '¿Sientes que actúas diferente con tus pares que conmigo en cuanto a {competencia}?',
    action: 'Explorar dinámicas diferentes según audiencia.',
    tone: 'development'
  },
  {
    id: 'pd_002',
    insight: 'Hay diferencias en cómo los pares vs tú ven a {firstName} en {competencia}. Explorar estos contextos puede ser revelador.',
    question: '¿Cómo describirían tus compañeros tu {competencia}?',
    action: 'Solicitar feedback 360 específico.',
    tone: 'development'
  },
  {
    id: 'pd_003',
    insight: '{firstName} puede estar mostrando diferentes facetas de {competencia} según con quién interactúa.',
    question: '¿Con quién sientes que puedes mostrar mejor tu {competencia}?',
    action: 'Identificar qué facilita o inhibe la competencia.',
    tone: 'development'
  },
  {
    id: 'pd_004',
    insight: 'La percepción dividida sobre {firstName} en {competencia} sugiere inconsistencia. Esto puede confundir al equipo.',
    question: '¿Eres consciente de que diferentes personas te ven diferente en {competencia}?',
    action: 'Trabajar en consistencia de comportamiento.',
    tone: 'development'
  },
  {
    id: 'pd_005',
    insight: 'Los pares tienen una visión distinta de {firstName} en {competencia}. Vale la pena entender qué ven ellos.',
    question: '¿Qué crees que ven tus pares que yo no veo sobre tu {competencia}?',
    action: 'Cruzar perspectivas para visión completa.',
    tone: 'development'
  },
  {
    id: 'pd_006',
    insight: '{firstName} genera percepciones distintas en {competencia} según la audiencia. Esto merece exploración.',
    question: '¿Hay algo diferente en cómo aplicas {competencia} con pares vs conmigo?',
    action: 'Entender dinámicas relacionales.',
    tone: 'development'
  },
  {
    id: 'pd_007',
    insight: 'La diferencia entre percepción de pares y jefatura sobre {firstName} en {competencia} es notable.',
    question: '¿Qué feedback has recibido de tus compañeros sobre {competencia}?',
    action: 'Integrar múltiples fuentes de feedback.',
    tone: 'development'
  },
  {
    id: 'pd_008',
    insight: '{firstName} puede estar adaptando su {competencia} al contexto, lo cual puede ser fortaleza o área de desarrollo.',
    question: '¿Conscientemente adaptas tu {competencia} según con quién trabajas?',
    action: 'Evaluar si la adaptación es estratégica o inconsistencia.',
    tone: 'development'
  }
]

// ════════════════════════════════════════════════════════════════════════════
// TEMPLATES: RESUMEN EJECUTIVO
// ════════════════════════════════════════════════════════════════════════════

interface SummaryPattern {
  id: string
  condition: (gaps: CompetencySummary[], overallScore?: number) => boolean
  headline: string
  overview: string
  coachingTip: string
  openingStatement: string
}

const SUMMARY_PATTERNS: SummaryPattern[] = [
  {
    id: 'pattern_overconfidence',
    condition: (gaps) => {
      const blindSpots = gaps.filter(g => g.gapType === 'BLIND_SPOT')
      return blindSpots.length >= 3
    },
    headline: 'Patrón de Sobreconfianza Detectado',
    overview: '{firstName} se percibe más fuerte de lo que observas en {count} competencias. Puede estar confundiendo intención con impacto real. Tu feedback directo con ejemplos concretos será clave.',
    coachingTip: 'Empieza reconociendo una fortaleza real antes de abordar las brechas. Usa ejemplos específicos, no generalidades.',
    openingStatement: '{firstName}, quiero tener una conversación honesta sobre cómo te ves vs cómo te veo. Mi objetivo es ayudarte a crecer.'
  },
  {
    id: 'pattern_impostor',
    condition: (gaps) => {
      const hiddenStrengths = gaps.filter(g => g.gapType === 'HIDDEN_STRENGTH')
      return hiddenStrengths.length >= 2
    },
    headline: 'Talento Subestimado',
    overview: '{firstName} tiene más capacidad de la que reconoce en {count} áreas. Tu rol es ayudarle a ver su verdadero valor y darle oportunidades de brillar.',
    coachingTip: 'Esta conversación debe ser principalmente de reconocimiento. Sé específico en qué hace bien y por qué importa.',
    openingStatement: '{firstName}, quiero hablarte de algo positivo que he observado. Creo que no te das suficiente crédito.'
  },
  {
    id: 'pattern_critical_gap',
    condition: (gaps) => {
      return gaps.some(g => g.gapType === 'BLIND_SPOT' && g.delta >= 2.0)
    },
    headline: 'Brecha Crítica Requiere Atención',
    overview: 'Hay al menos una competencia donde la brecha es significativa. Esto requiere conversación directa y plan de acción estructurado.',
    coachingTip: 'Sé directo pero empático. Ofrece apoyo concreto y establece seguimiento frecuente.',
    openingStatement: '{firstName}, necesito hablar contigo sobre algo importante. Quiero ser directo porque me importa tu desarrollo.'
  },
  {
    id: 'pattern_mixed',
    condition: (gaps) => {
      const blindSpots = gaps.filter(g => g.gapType === 'BLIND_SPOT').length
      const hiddenStrengths = gaps.filter(g => g.gapType === 'HIDDEN_STRENGTH').length
      return blindSpots >= 1 && hiddenStrengths >= 1
    },
    headline: 'Perfil Mixto: Fortalezas y Oportunidades',
    overview: '{firstName} tiene tanto fortalezas subestimadas como áreas donde se sobrevalora. Una conversación balanceada será efectiva.',
    coachingTip: 'Alterna entre reconocimiento y desarrollo. No todo es crítica ni todo es elogio.',
    openingStatement: '{firstName}, tengo feedback variado para ti. Hay cosas que haces mejor de lo que crees y otras donde podemos trabajar juntos.'
  },
  {
    id: 'pattern_peer_issues',
    condition: (gaps) => {
      const peerDisconnects = gaps.filter(g => g.gapType === 'PEER_DISCONNECT')
      return peerDisconnects.length >= 2
    },
    headline: 'Percepción Inconsistente con Pares',
    overview: 'Hay diferencias notables entre cómo tú y los pares ven a {firstName}. Esto merece exploración para entender dinámicas de equipo.',
    coachingTip: 'Enfócate en entender, no en juzgar. Las diferencias de percepción pueden revelar contextos importantes.',
    openingStatement: '{firstName}, he notado algunas diferencias en cómo diferentes personas te perciben. Me gustaría entender mejor esto contigo.'
  },
  {
    id: 'pattern_default',
    condition: () => true,
    headline: 'Oportunidades de Desarrollo Identificadas',
    overview: 'Hay brechas de percepción que merecen conversación. Tu feedback específico ayudará a {firstName} a calibrar su autopercepción.',
    coachingTip: 'Mantén la conversación enfocada en desarrollo, no en evaluación. El objetivo es crecer.',
    openingStatement: '{firstName}, quiero compartir algunas observaciones contigo. Mi intención es que tengamos una conversación constructiva.'
  }
]

// ════════════════════════════════════════════════════════════════════════════
// CLASE PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════

class FeedbackIntelligenceServiceClass {
  private usedTemplateIds: Set<string> = new Set()

  /**
   * Genera feedback para UNA competencia/brecha específica
   */
  generateCompetencyFeedback(context: FeedbackContext): GeneratedFeedback {
    const templates = this.getTemplatesForGapType(context.gapType)
    const template = this.selectTemplate(templates, context)
    
    return {
      insight: this.interpolate(template.insight, context),
      question: this.interpolate(template.question, context),
      actionSuggestion: template.action ? this.interpolate(template.action, context) : undefined,
      tone: template.tone
    }
  }

  /**
   * Genera RESUMEN EJECUTIVO considerando todas las brechas
   */
  generateExecutiveSummary(
    employeeName: string,
    gaps: CompetencySummary[],
    overallScore?: number
  ): ExecutiveSummary {
    const firstName = this.getFirstName(employeeName)
    
    // Encontrar patrón que aplica
    const pattern = SUMMARY_PATTERNS.find(p => p.condition(gaps, overallScore)) 
      || SUMMARY_PATTERNS[SUMMARY_PATTERNS.length - 1]
    
    // Generar prioridades (top 3 brechas por delta)
    const sortedGaps = [...gaps].sort((a, b) => b.delta - a.delta)
    const priorities = sortedGaps.slice(0, 3).map((gap, idx) => ({
      rank: idx + 1,
      competency: gap.competencyName,
      action: this.getPriorityAction(gap),
      gapType: gap.gapType
    }))

    const context = {
      firstName,
      count: gaps.length.toString(),
      competencia: ''
    }

    return {
      headline: pattern.headline,
      overview: this.interpolateSimple(pattern.overview, context),
      priorities,
      coachingTip: pattern.coachingTip,
      openingStatement: this.interpolateSimple(pattern.openingStatement, context)
    }
  }

  /**
   * Resetea templates usados (para nueva sesión de jefe)
   */
  resetUsedTemplates(): void {
    this.usedTemplateIds.clear()
  }

  // ══════════════════════════════════════════════════════════════════════════
  // MÉTODOS PRIVADOS
  // ══════════════════════════════════════════════════════════════════════════

  private getTemplatesForGapType(gapType: GapType): FeedbackTemplate[] {
    switch (gapType) {
      case 'BLIND_SPOT':
        return BLIND_SPOT_TEMPLATES
      case 'HIDDEN_STRENGTH':
        return HIDDEN_STRENGTH_TEMPLATES
      case 'PEER_DISCONNECT':
        return PEER_DISCONNECT_TEMPLATES
      default:
        return BLIND_SPOT_TEMPLATES
    }
  }

  private selectTemplate(
    templates: FeedbackTemplate[], 
    context: FeedbackContext
  ): FeedbackTemplate {
    // Filtrar por delta si aplica
    let candidates = templates.filter(t => {
      if (t.minDelta !== undefined && context.delta < t.minDelta) return false
      if (t.maxDelta !== undefined && context.delta > t.maxDelta) return false
      return true
    })

    // Si no hay candidatos por delta, usar todos
    if (candidates.length === 0) {
      candidates = templates
    }

    // Preferir no usados
    const unused = candidates.filter(t => !this.usedTemplateIds.has(t.id))
    const pool = unused.length > 0 ? unused : candidates

    // Seleccionar aleatorio
    const selected = pool[Math.floor(Math.random() * pool.length)]
    this.usedTemplateIds.add(selected.id)

    return selected
  }

  private interpolate(template: string, context: FeedbackContext): string {
    return template
      .replace(/{firstName}/g, context.firstName)
      .replace(/{competencia}/g, context.competencyName.toLowerCase())
      .replace(/{delta}/g, context.delta.toFixed(1))
      .replace(/{selfScore}/g, context.selfScore.toFixed(1))
      .replace(/{managerScore}/g, context.managerScore.toFixed(1))
  }

  private interpolateSimple(template: string, context: { firstName: string; count: string; competencia: string }): string {
    return template
      .replace(/{firstName}/g, context.firstName)
      .replace(/{count}/g, context.count)
      .replace(/{competencia}/g, context.competencia)
  }

  private getFirstName(fullName: string): string {
    // Manejar formato "APELLIDO APELLIDO NOMBRE NOMBRE"
    const parts = fullName.trim().split(/\s+/)
    if (parts.length >= 3) {
      // Asumir que los últimos 1-2 son nombres
      return parts[parts.length - 2] || parts[0]
    }
    return parts[0]
  }

  private getPriorityAction(gap: CompetencySummary): string {
    switch (gap.gapType) {
      case 'BLIND_SPOT':
        if (gap.delta >= 2.0) return 'Feedback directo con plan de acción'
        return 'Explorar con ejemplos concretos'
      case 'HIDDEN_STRENGTH':
        return 'Reconocer y dar más visibilidad'
      case 'PEER_DISCONNECT':
        return 'Entender diferentes contextos'
      default:
        return 'Conversar para alinear'
    }
  }
}

// ════════════════════════════════════════════════════════════════════════════
// SINGLETON EXPORT
// ════════════════════════════════════════════════════════════════════════════

export const FeedbackIntelligenceService = new FeedbackIntelligenceServiceClass()

// Export tipos para uso externo
export type { FeedbackTemplate, SummaryPattern }