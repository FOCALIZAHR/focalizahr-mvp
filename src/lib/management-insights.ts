// ════════════════════════════════════════════════════════════════════════════
// MANAGEMENT INSIGHTS - El Cerebro de Inteligencia de Gestión
// src/lib/management-insights.ts
// ════════════════════════════════════════════════════════════════════════════
// PROPÓSITO: Transforma scores fríos en insights accionables para el jefe
// FILOSOFÍA: Detecta → Diagnostica → Sugiere Acción (patrón FocalizaHR)
// ESTILO UX: Apple - Simple, Humano, Accionable, Breve, Empoderador
// ════════════════════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════════════════════════════════
// TIPOS
// ════════════════════════════════════════════════════════════════════════════

export type InsightType = 'CRITICAL' | 'STRENGTH' | 'MONITOR' | 'HEALTHY'

export type InsightIconName = 'AlertOctagon' | 'Zap' | 'Activity' | 'CheckCircle'

export interface ManagementInsight {
  /** Tipo de alerta para styling */
  type: InsightType
  /** Nombre de la competencia */
  competencyName: string
  /** Score numérico */
  score: number
  /** Título corto de la alerta */
  title: string
  /** Insight explicativo para el jefe */
  insight: string
  /** Pregunta/acción sugerida para el 1:1 */
  action: string
  /** Nombre del ícono Lucide */
  iconName: InsightIconName
}

export interface CompetencyInput {
  name: string
  score: number
  /** Código opcional para mensajes específicos */
  code?: string
}

// ════════════════════════════════════════════════════════════════════════════
// CONFIGURACIÓN DE THRESHOLDS
// Alineado con src/config/performanceClassification.ts
// ════════════════════════════════════════════════════════════════════════════

const THRESHOLDS = {
  CRITICAL: 2.5,    // Score < 2.5 = Requiere Atención (alineado con performanceClassification)
  MONITOR: 3.5,     // Score < 3.5 = En Desarrollo / Monitorear
  STRENGTH: 4.5     // Score >= 4.5 = Excepcional / Fortaleza destacada
} as const

// Score mínimo válido (excluye preguntas de texto abierto sin nota)
const MIN_VALID_SCORE = 1.0

// ════════════════════════════════════════════════════════════════════════════
// TIPO PARA GENERADORES DE MENSAJES
// ════════════════════════════════════════════════════════════════════════════

type MessageContext = {
  name: string        // Nombre del colaborador
  score: number       // Score numérico
  competency: string  // Nombre de la competencia
}

type MessageGenerator = (ctx: MessageContext) => { 
  insight: string
  action: string 
}

// ════════════════════════════════════════════════════════════════════════════
// BANCO DE MENSAJES POR COMPETENCIA (PERSONALIZADO + UX APPLE)
// ════════════════════════════════════════════════════════════════════════════

const COMPETENCY_MESSAGES: Record<string, {
  critical: MessageGenerator
  strength: MessageGenerator
}> = {
  // ══════════════════════════════════════════════════════════════════════════
  // FEEDBACK Y COACHING
  // ══════════════════════════════════════════════════════════════════════════
  'feedback': {
    critical: ({ name, score }) => ({
      insight: `Agenda una conversación con ${name} para entender por qué esta competencia está en ${score.toFixed(1)}. Puede ser que no tuvo oportunidad de demostrarla o hay una brecha real de desarrollo.`,
      action: `¿Cómo te sientes dando feedback a tu equipo? ¿Qué te facilita o dificulta hacerlo?`
    }),
    strength: ({ name }) => ({
      insight: `${name} tiene habilidad excepcional para desarrollar personas. Es candidata natural para ser mentor de nuevos líderes.`,
      action: `¿Te gustaría ser mentor de personas que están empezando a liderar? Tu fortaleza aquí puede multiplicarse.`
    })
  },

  // ══════════════════════════════════════════════════════════════════════════
  // GESTIÓN DEL CAMBIO
  // ══════════════════════════════════════════════════════════════════════════
  'cambio': {
    critical: ({ name, score }) => ({
      insight: `${name} muestra dificultad para liderar cambios (${score.toFixed(1)}/5). Puede estar resistiendo o no comunicando bien las transformaciones al equipo.`,
      action: `¿Cómo te sientes con los cambios recientes? Cuéntame qué apoyo necesitas.`
    }),
    strength: ({ name }) => ({
      insight: `${name} tiene habilidad excepcional para liderar transformaciones. Considera asignarle proyectos de cambio organizacional o que sea agente de cambio en iniciativas del área.`,
      action: `¿Te interesaría liderar el próximo cambio importante del área?`
    })
  },

  // ══════════════════════════════════════════════════════════════════════════
  // LIDERAZGO DE EQUIPOS
  // ══════════════════════════════════════════════════════════════════════════
  'liderazgo': {
    critical: ({ name, score }) => ({
      insight: `El equipo de ${name} puede estar sin dirección clara. Con ${score.toFixed(1)}/5 en liderazgo, vale la pena entender qué está pasando.`,
      action: `¿Cómo sientes que está tu equipo hoy? ¿Qué te está costando como líder?`
    }),
    strength: ({ name }) => ({
      insight: `${name} genera confianza y dirección clara en su equipo. Su estilo de liderazgo es un modelo a replicar.`,
      action: `¿Qué prácticas de liderazgo te han funcionado mejor? Podríamos documentarlas para otros líderes.`
    })
  },

  // ══════════════════════════════════════════════════════════════════════════
  // DELEGACIÓN
  // ══════════════════════════════════════════════════════════════════════════
  'delegacion': {
    critical: ({ name, score }) => ({
      insight: `${name} puede estar haciendo micromanagement o tiene dificultad para soltar tareas (${score.toFixed(1)}/5). Puede estar sobrecargada o no confiar en el equipo.`,
      action: `¿Hay tareas que sientes que solo tú puedes hacer? ¿Qué te impide delegarlas?`
    }),
    strength: ({ name }) => ({
      insight: `${name} delega efectivamente y empodera a su equipo. Multiplica su impacto a través de otros.`,
      action: `Tu delegación es un modelo. ¿Cómo logras confiar y soltar tareas?`
    })
  },

  // ══════════════════════════════════════════════════════════════════════════
  // VISIÓN ESTRATÉGICA
  // ══════════════════════════════════════════════════════════════════════════
  'estrategica': {
    critical: ({ name, score }) => ({
      insight: `${name} está muy enfocada en lo operativo (${score.toFixed(1)}/5). Le cuesta ver el panorama completo y conectar con objetivos mayores.`,
      action: `¿Sientes que ves el panorama completo del área? ¿Qué información te falta?`
    }),
    strength: ({ name }) => ({
      insight: `${name} ve más allá del día a día. Conecta su trabajo con el panorama estratégico del área.`,
      action: `¿Te gustaría participar en las sesiones de planificación del área?`
    })
  },

  // ══════════════════════════════════════════════════════════════════════════
  // ORIENTACIÓN AL CLIENTE
  // ══════════════════════════════════════════════════════════════════════════
  'cliente': {
    critical: ({ name, score }) => ({
      insight: `${name} puede estar desconectada de las necesidades del cliente (${score.toFixed(1)}/5). Vale la pena entender si tiene visibilidad del feedback.`,
      action: `¿Cuándo fue la última vez que recibiste feedback directo de tus clientes? ¿Qué te dicen?`
    }),
    strength: ({ name }) => ({
      insight: `${name} tiene fuerte orientación al servicio. Entiende y prioriza las necesidades del cliente.`,
      action: `¿Qué prácticas usas para mantenerte conectada con las necesidades del cliente?`
    })
  },

  // ══════════════════════════════════════════════════════════════════════════
  // TRABAJO EN EQUIPO
  // ══════════════════════════════════════════════════════════════════════════
  'equipo': {
    critical: ({ name, score }) => ({
      insight: `${name} puede estar trabajando muy aislada (${score.toFixed(1)}/5). Vale la pena entender qué está pasando con sus pares.`,
      action: `¿Cómo es tu relación con los otros equipos? ¿Hay algo que debamos conversar?`
    }),
    strength: ({ name }) => ({
      insight: `${name} es excelente colaboradora. Une a las personas y mejora el ambiente del equipo.`,
      action: `Tu capacidad de conectar con otros es notable. ¿Cómo lo logras?`
    })
  },

  // ══════════════════════════════════════════════════════════════════════════
  // COMUNICACIÓN
  // ══════════════════════════════════════════════════════════════════════════
  'comunicacion': {
    critical: ({ name, score }) => ({
      insight: `${name} tiene dificultad para comunicarse efectivamente (${score.toFixed(1)}/5). Puede estar afectando la coordinación con su equipo o pares.`,
      action: `¿Cómo sientes que fluye la comunicación con tu equipo? ¿Qué te cuesta más?`
    }),
    strength: ({ name }) => ({
      insight: `${name} comunica con claridad y efectividad. Su equipo sabe qué esperar y hacia dónde van.`,
      action: `¿Qué haces para mantener a tu equipo informado y alineado?`
    })
  },

  // ══════════════════════════════════════════════════════════════════════════
  // TOMA DE DECISIONES
  // ══════════════════════════════════════════════════════════════════════════
  'decisiones': {
    critical: ({ name, score }) => ({
      insight: `${name} puede estar teniendo dificultad para tomar decisiones oportunas (${score.toFixed(1)}/5). Puede ser exceso de análisis o miedo a equivocarse.`,
      action: `¿Qué te dificulta tomar decisiones? ¿Sientes que tienes la información que necesitas?`
    }),
    strength: ({ name }) => ({
      insight: `${name} toma decisiones con agilidad y buen criterio. Genera confianza en su equipo.`,
      action: `¿Cómo equilibras velocidad y calidad en tus decisiones?`
    })
  },

  // ══════════════════════════════════════════════════════════════════════════
  // RESULTADOS / ORIENTACIÓN AL LOGRO
  // ══════════════════════════════════════════════════════════════════════════
  'resultados': {
    critical: ({ name, score }) => ({
      insight: `${name} no está logrando los resultados esperados (${score.toFixed(1)}/5). Vale la pena entender si es capacidad, contexto o priorización.`,
      action: `¿Qué te está impidiendo lograr tus objetivos? ¿Hay algo que te esté bloqueando?`
    }),
    strength: ({ name }) => ({
      insight: `${name} entrega resultados consistentemente. Es confiable y cumple lo que promete.`,
      action: `¿Cómo priorizas para asegurar que entregas lo importante?`
    })
  },

  // ══════════════════════════════════════════════════════════════════════════
  // INNOVACIÓN / CREATIVIDAD
  // ══════════════════════════════════════════════════════════════════════════
  'innovacion': {
    critical: ({ name, score }) => ({
      insight: `${name} puede estar muy enfocada en lo conocido (${score.toFixed(1)}/5). No está proponiendo nuevas formas de hacer las cosas.`,
      action: `¿Cuándo fue la última vez que propusiste una idea nueva? ¿Qué te frena?`
    }),
    strength: ({ name }) => ({
      insight: `${name} propone ideas nuevas constantemente. Cuestiona el status quo de manera constructiva.`,
      action: `¿Qué ideas tienes para mejorar cómo trabajamos? Me interesa escucharlas.`
    })
  },

  // ══════════════════════════════════════════════════════════════════════════
  // DESARROLLO DE PERSONAS
  // ══════════════════════════════════════════════════════════════════════════
  'desarrollo': {
    critical: ({ name, score }) => ({
      insight: `${name} no está invirtiendo en desarrollar a su equipo (${score.toFixed(1)}/5). Puede estar muy enfocada en lo operativo.`,
      action: `¿Cuánto tiempo dedicas a desarrollar a tu equipo? ¿Qué te lo impide?`
    }),
    strength: ({ name }) => ({
      insight: `${name} invierte activamente en hacer crecer a su equipo. Las personas a su cargo progresan.`,
      action: `¿Qué haces para desarrollar a tu equipo? Podríamos replicarlo en otras áreas.`
    })
  },

  // ══════════════════════════════════════════════════════════════════════════
  // ADAPTABILIDAD
  // ══════════════════════════════════════════════════════════════════════════
  'adaptabilidad': {
    critical: ({ name, score }) => ({
      insight: `${name} tiene dificultad para adaptarse a nuevas situaciones (${score.toFixed(1)}/5). Puede estar aferrándose a formas conocidas de trabajar.`,
      action: `¿Cómo te sientes cuando cambian las prioridades o el contexto? ¿Qué te cuesta más?`
    }),
    strength: ({ name }) => ({
      insight: `${name} se adapta rápidamente a nuevos contextos. Mantiene efectividad incluso en incertidumbre.`,
      action: `¿Cómo logras mantenerte efectiva cuando todo cambia?`
    })
  },

  // ══════════════════════════════════════════════════════════════════════════
  // RESOLUCIÓN DE CONFLICTOS
  // ══════════════════════════════════════════════════════════════════════════
  'conflictos': {
    critical: ({ name, score }) => ({
      insight: `${name} puede estar evitando o manejando mal los conflictos (${score.toFixed(1)}/5). Esto puede estar afectando la dinámica del equipo.`,
      action: `¿Hay tensiones en el equipo que no se han resuelto? ¿Cómo te sientes manejando desacuerdos?`
    }),
    strength: ({ name }) => ({
      insight: `${name} maneja conflictos de manera constructiva. Convierte tensiones en oportunidades de mejora.`,
      action: `¿Cómo logras que los conflictos se resuelvan bien? Tu enfoque puede ayudar a otros.`
    })
  }
}

// ════════════════════════════════════════════════════════════════════════════
// FUNCIÓN PRINCIPAL (ACTUALIZADA CON NOMBRE)
// ════════════════════════════════════════════════════════════════════════════

/**
 * Genera insights de gestión a partir de competencias evaluadas
 * @param competencies Array de competencias con nombre y score
 * @param employeeName Nombre del colaborador para personalización
 * @returns Array de insights ordenados por prioridad (críticos primero)
 * 
 * NOTA: Competencias con score < 1.0 se excluyen automáticamente
 * (típicamente son preguntas de texto abierto sin calificación)
 */
export function getManagementInsights(
  competencies: CompetencyInput[],
  employeeName: string
): ManagementInsight[] {
  const insights: ManagementInsight[] = []

  for (const comp of competencies) {
    // Filtrar scores inválidos (preguntas de texto abierto, etc.)
    if (comp.score < MIN_VALID_SCORE) {
      continue
    }
    
    const insight = classifyCompetency(comp, employeeName)
    if (insight) {
      insights.push(insight)
    }
  }

  // Ordenar: CRITICAL primero, luego STRENGTH, luego MONITOR
  const priority: Record<InsightType, number> = {
    CRITICAL: 0,
    STRENGTH: 1,
    MONITOR: 2,
    HEALTHY: 3
  }

  return insights.sort((a, b) => priority[a.type] - priority[b.type])
}

/**
 * Filtra solo alertas críticas y fortalezas (para el HUD compacto)
 */
export function getHighlightInsights(
  competencies: CompetencyInput[],
  employeeName: string
): ManagementInsight[] {
  return getManagementInsights(competencies, employeeName)
    .filter(i => i.type === 'CRITICAL' || i.type === 'STRENGTH')
}

// ════════════════════════════════════════════════════════════════════════════
// FUNCIONES AUXILIARES
// ════════════════════════════════════════════════════════════════════════════

function classifyCompetency(
  comp: CompetencyInput,
  employeeName: string
): ManagementInsight | null {
  const { name, score } = comp
  const normalizedName = normalizeCompetencyName(name)
  const messageGenerator = COMPETENCY_MESSAGES[normalizedName]

  // Contexto para los generadores de mensajes
  const ctx: MessageContext = {
    name: employeeName,
    score,
    competency: name
  }

  // CRITICAL: Score < 2.5 (Requiere Atención - alineado con performanceClassification)
  if (score < THRESHOLDS.CRITICAL) {
    const messages = messageGenerator?.critical(ctx) || getGenericMessages('critical', ctx)
    return {
      type: 'CRITICAL',
      competencyName: name,
      score,
      title: 'Requiere Tu Atención',
      insight: messages.insight,
      action: messages.action,
      iconName: 'AlertOctagon'
    }
  }

  // STRENGTH: Score >= 4.5 (Excepcional - alineado con performanceClassification)
  if (score >= THRESHOLDS.STRENGTH) {
    const messages = messageGenerator?.strength(ctx) || getGenericMessages('strength', ctx)
    return {
      type: 'STRENGTH',
      competencyName: name,
      score,
      title: 'Fortaleza para Aprovechar',
      insight: messages.insight,
      action: messages.action,
      iconName: 'Zap'
    }
  }

  // MONITOR: Score < 3.5 (En Desarrollo - alineado con performanceClassification)
  if (score < THRESHOLDS.MONITOR) {
    return {
      type: 'MONITOR',
      competencyName: name,
      score,
      title: 'Monitorear',
      insight: `${employeeName} tiene resultado moderado en ${name} (${score.toFixed(1)}/5). Observa si mejora en próximo ciclo.`,
      action: `¿Hay algo que te esté costando en ${name.toLowerCase()}?`,
      iconName: 'Activity'
    }
  }

  // HEALTHY: Score entre 3.5 y 4.49 (Cumple/Supera Expectativas) - No genera alerta visible
  return null
}

function normalizeCompetencyName(name: string): string {
  const lower = name.toLowerCase()

  // Feedback y Coaching
  if (lower.includes('feedback') || lower.includes('coaching') || lower.includes('retroalimentación')) {
    return 'feedback'
  }
  
  // Gestión del Cambio
  if (lower.includes('cambio') || lower.includes('change') || lower.includes('transformación')) {
    return 'cambio'
  }
  
  // Liderazgo
  if (lower.includes('liderazgo') || lower.includes('leadership') || lower.includes('líder')) {
    return 'liderazgo'
  }
  
  // Delegación
  if (lower.includes('delegación') || lower.includes('delegacion') || lower.includes('delegar')) {
    return 'delegacion'
  }
  
  // Visión Estratégica
  if (lower.includes('estratég') || lower.includes('visión') || lower.includes('strategic')) {
    return 'estrategica'
  }
  
  // Orientación al Cliente
  if (lower.includes('cliente') || lower.includes('servicio') || lower.includes('customer')) {
    return 'cliente'
  }
  
  // Trabajo en Equipo
  if (lower.includes('equipo') || lower.includes('colabor') || lower.includes('team')) {
    return 'equipo'
  }
  
  // Comunicación
  if (lower.includes('comunica') || lower.includes('communication')) {
    return 'comunicacion'
  }
  
  // Toma de Decisiones
  if (lower.includes('decisión') || lower.includes('decision') || lower.includes('decidir')) {
    return 'decisiones'
  }
  
  // Resultados / Orientación al Logro
  if (lower.includes('resultado') || lower.includes('logro') || lower.includes('result') || lower.includes('achievement')) {
    return 'resultados'
  }
  
  // Innovación / Creatividad
  if (lower.includes('innovación') || lower.includes('innovacion') || lower.includes('creativ') || lower.includes('innovation')) {
    return 'innovacion'
  }
  
  // Desarrollo de Personas
  if (lower.includes('desarrollo') || lower.includes('development') || lower.includes('talent')) {
    return 'desarrollo'
  }
  
  // Adaptabilidad
  if (lower.includes('adaptab') || lower.includes('flexib') || lower.includes('agil')) {
    return 'adaptabilidad'
  }
  
  // Resolución de Conflictos
  if (lower.includes('conflict') || lower.includes('resolución') || lower.includes('mediac')) {
    return 'conflictos'
  }

  return 'generic'
}

function getGenericMessages(
  type: 'critical' | 'strength',
  ctx: MessageContext
): { insight: string; action: string } {
  if (type === 'critical') {
    return {
      insight: `Agenda una conversación con ${ctx.name} para entender por qué ${ctx.competency} está en ${ctx.score.toFixed(1)}. Vale la pena diagnosticar si es contexto o una brecha real.`,
      action: `¿Qué te ha costado en esta área? ¿Cómo te puedo ayudar?`
    }
  }
  return {
    insight: `${ctx.name} destaca en ${ctx.competency} (${ctx.score.toFixed(1)}/5). Es una fortaleza que puede compartir con el equipo.`,
    action: `¿Cómo lo lograste? Tu enfoque puede ayudar a otros.`
  }
}

// ════════════════════════════════════════════════════════════════════════════
// UTILIDADES ADICIONALES
// ════════════════════════════════════════════════════════════════════════════

/**
 * Filtra competencias con scores válidos (excluye texto abierto sin nota)
 * Útil para pre-procesar antes de pasar a getManagementInsights
 */
export function filterValidCompetencies(
  competencies: CompetencyInput[]
): CompetencyInput[] {
  return competencies.filter(c => c.score >= MIN_VALID_SCORE)
}

/**
 * Calcula el resumen de alertas para badges
 */
export function getInsightsSummary(
  competencies: CompetencyInput[],
  employeeName: string
): {
  criticalCount: number
  strengthCount: number
  monitorCount: number
} {
  const insights = getManagementInsights(competencies, employeeName)

  return {
    criticalCount: insights.filter(i => i.type === 'CRITICAL').length,
    strengthCount: insights.filter(i => i.type === 'STRENGTH').length,
    monitorCount: insights.filter(i => i.type === 'MONITOR').length
  }
}

/**
 * Obtiene el primer nombre del colaborador (para mensajes más naturales)
 * Ejemplo: "María José González" → "María José"
 */
export function getFirstName(fullName: string): string {
  const parts = fullName.trim().split(' ')
  
  // Si tiene 4+ partes, probablemente tiene dos nombres y dos apellidos
  // Ej: "María José González Pérez" → "María José"
  if (parts.length >= 4) {
    return `${parts[0]} ${parts[1]}`
  }
  
  // Si tiene 3 partes, un nombre y dos apellidos
  // Ej: "María González Pérez" → "María"
  if (parts.length === 3) {
    return parts[0]
  }
  
  // Si tiene 2 partes, nombre y apellido
  // Ej: "María González" → "María"
  if (parts.length === 2) {
    return parts[0]
  }
  
  // Si solo tiene una parte, usar completo
  return fullName.trim()
}

/**
 * Versión alternativa que usa solo el primer nombre
 * Útil para mensajes más informales
 */
export function getManagementInsightsInformal(
  competencies: CompetencyInput[],
  fullName: string
): ManagementInsight[] {
  return getManagementInsights(competencies, getFirstName(fullName))
}