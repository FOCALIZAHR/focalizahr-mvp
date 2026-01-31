// ════════════════════════════════════════════════════════════════════════════
// COMPETENCY TEMPLATES - Plantillas de Competencias FocalizaHR
// src/lib/constants/competencyTemplates.ts
// ════════════════════════════════════════════════════════════════════════════
// Patrón: SAP SuccessFactors, Lattice, Culture Amp
// Basado en: Lominger, Great Place to Work, Google Project Oxygen
// ════════════════════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════════════════════════════════
// TIPOS
// ════════════════════════════════════════════════════════════════════════════

export interface CompetencyTemplateItem {
  code: string
  name: string
  description: string
  category: 'CORE' | 'LEADERSHIP' | 'STRATEGIC' | 'TECHNICAL'
  behaviors: string[]
  audienceRule: { minTrack: string } | null
  dimensionCode?: string | null     // Vínculo semántico Clima
  subdimensionCode?: string | null  // Vínculo semántico Clima
}

export interface CompetencyTemplate {
  id: string
  name: string
  description: string
  methodology: string
  methodologyIcon: string
  idealFor: string[]
  highlight: string
  competencies: CompetencyTemplateItem[]
}

// ════════════════════════════════════════════════════════════════════════════
// TEMPLATE: FOCALIZAHR ESTÁNDAR
// 12 competencias organizadas por nivel (CORE → LEADERSHIP → STRATEGIC)
// ════════════════════════════════════════════════════════════════════════════

export const FOCALIZAHR_STANDARD_TEMPLATE: CompetencyTemplate = {
  id: 'focalizahr-standard-v1',
  name: 'Modelo FocalizaHR Estándar',
  description: 'Basado en Lominger, Great Place to Work y mejores prácticas LATAM. 12 competencias organizadas por nivel.',
  methodology: 'Lominger + GPTW',
  methodologyIcon: 'Award',
  idealFor: [
    'Empresas tradicionales LATAM',
    'Cultura colaborativa enfocada',
    'Primera implementación de competencias'
  ],
  highlight: 'Equilibrio ideal entre rigor y simplicidad',
  competencies: [

    // ══════════════════════════════════════════════════════════════════
    // CORE - Todos los empleados (5 competencias)
    // ══════════════════════════════════════════════════════════════════

    {
      code: 'CORE-COMM',
      name: 'Comunicación Efectiva',
      description: 'Capacidad de transmitir ideas con claridad y escuchar activamente',
      category: 'CORE',
      behaviors: [
        'Escucha activamente antes de responder',
        'Adapta el mensaje según la audiencia',
        'Comunica información compleja de forma simple',
        'Verifica que el mensaje fue comprendido',
        'Mantiene comunicación abierta y transparente'
      ],
      audienceRule: null,
      dimensionCode: 'comunicacion',
      subdimensionCode: 'claridad'
    },
    {
      code: 'CORE-TEAM',
      name: 'Trabajo en Equipo',
      description: 'Colabora efectivamente para lograr objetivos comunes',
      category: 'CORE',
      behaviors: [
        'Comparte información relevante con el equipo',
        'Apoya a compañeros cuando lo necesitan',
        'Contribuye positivamente al ambiente laboral',
        'Maneja conflictos de manera constructiva',
        'Celebra los logros del equipo'
      ],
      audienceRule: null,
      dimensionCode: 'ambiente',
      subdimensionCode: 'colaboracion'
    },
    {
      code: 'CORE-RESULTS',
      name: 'Orientación a Resultados',
      description: 'Enfoque en cumplir objetivos con calidad y eficiencia',
      category: 'CORE',
      behaviors: [
        'Define metas claras y medibles',
        'Prioriza tareas según impacto',
        'Cumple compromisos en tiempo y forma',
        'Busca mejorar continuamente sus resultados',
        'Asume responsabilidad por sus entregables'
      ],
      audienceRule: null,
      dimensionCode: null,
      subdimensionCode: null
    },
    {
      code: 'CORE-ADAPT',
      name: 'Adaptabilidad',
      description: 'Flexibilidad ante cambios y nuevos desafíos',
      category: 'CORE',
      behaviors: [
        'Acepta cambios con actitud positiva',
        'Aprende rápidamente nuevas habilidades',
        'Propone alternativas ante obstáculos',
        'Mantiene efectividad bajo presión',
        'Se recupera rápidamente de los reveses'
      ],
      audienceRule: null,
      dimensionCode: null,
      subdimensionCode: null
    },
    {
      code: 'CORE-CLIENT',
      name: 'Orientación al Cliente',
      description: 'Foco en satisfacer necesidades del cliente interno/externo',
      category: 'CORE',
      behaviors: [
        'Entiende las necesidades del cliente',
        'Responde oportunamente a solicitudes',
        'Busca superar expectativas',
        'Mantiene relaciones positivas',
        'Anticipa necesidades futuras'
      ],
      audienceRule: null,
      dimensionCode: null,
      subdimensionCode: null
    },

    // ══════════════════════════════════════════════════════════════════
    // LEADERSHIP - Managers + Ejecutivos (4 competencias)
    // ══════════════════════════════════════════════════════════════════

    {
      code: 'LEAD-DEV',
      name: 'Desarrollo de Personas',
      description: 'Capacidad de hacer crecer a los miembros del equipo',
      category: 'LEADERSHIP',
      behaviors: [
        'Identifica fortalezas y áreas de mejora de cada persona',
        'Proporciona feedback constructivo regularmente',
        'Crea oportunidades de aprendizaje y crecimiento',
        'Delega para desarrollar, no solo para descargar',
        'Celebra el progreso y los logros individuales'
      ],
      audienceRule: { minTrack: 'MANAGER' },
      dimensionCode: 'liderazgo',
      subdimensionCode: 'desarrollo'
    },
    {
      code: 'LEAD-TEAM',
      name: 'Liderazgo de Equipos',
      description: 'Guía y motiva al equipo hacia objetivos comunes',
      category: 'LEADERSHIP',
      behaviors: [
        'Establece dirección clara para el equipo',
        'Motiva y reconoce logros',
        'Toma decisiones oportunas',
        'Genera confianza y credibilidad',
        'Protege al equipo de distracciones innecesarias'
      ],
      audienceRule: { minTrack: 'MANAGER' },
      dimensionCode: 'liderazgo',
      subdimensionCode: 'direccion'
    },
    {
      code: 'LEAD-DELEG',
      name: 'Delegación Efectiva',
      description: 'Asigna responsabilidades apropiadamente',
      category: 'LEADERSHIP',
      behaviors: [
        'Asigna tareas según capacidades y desarrollo',
        'Proporciona recursos y autoridad necesarios',
        'Da seguimiento sin microgestionar',
        'Asume responsabilidad por resultados del equipo',
        'Ajusta nivel de supervisión según madurez'
      ],
      audienceRule: { minTrack: 'MANAGER' },
      dimensionCode: 'liderazgo',
      subdimensionCode: 'autonomia'
    },
    {
      code: 'LEAD-FEEDBACK',
      name: 'Feedback y Coaching',
      description: 'Retroalimentación que impulsa el crecimiento',
      category: 'LEADERSHIP',
      behaviors: [
        'Da feedback específico y oportuno',
        'Balancea reconocimiento con áreas de mejora',
        'Hace preguntas que generan reflexión',
        'Crea ambiente seguro para el error',
        'Adapta estilo de coaching según la persona'
      ],
      audienceRule: { minTrack: 'MANAGER' },
      dimensionCode: 'liderazgo',
      subdimensionCode: 'feedback'
    },

    // ══════════════════════════════════════════════════════════════════
    // STRATEGIC - Solo Ejecutivos (3 competencias)
    // ══════════════════════════════════════════════════════════════════

    {
      code: 'STRAT-VISION',
      name: 'Visión Estratégica',
      description: 'Capacidad de ver el panorama completo y definir rumbo',
      category: 'STRATEGIC',
      behaviors: [
        'Analiza tendencias del entorno',
        'Identifica oportunidades de largo plazo',
        'Define estrategias alineadas con la visión',
        'Comunica el rumbo de forma inspiradora',
        'Toma decisiones considerando múltiples escenarios'
      ],
      audienceRule: { minTrack: 'EJECUTIVO' },
      dimensionCode: null,
      subdimensionCode: null
    },
    {
      code: 'STRAT-CHANGE',
      name: 'Gestión del Cambio',
      description: 'Lidera transformaciones organizacionales',
      category: 'STRATEGIC',
      behaviors: [
        'Comunica la necesidad del cambio',
        'Diseña planes de transición',
        'Maneja resistencias constructivamente',
        'Sostiene el cambio en el tiempo',
        'Aprende de iniciativas anteriores'
      ],
      audienceRule: { minTrack: 'EJECUTIVO' },
      dimensionCode: null,
      subdimensionCode: null
    },
    {
      code: 'STRAT-INFLUENCE',
      name: 'Influencia Organizacional',
      description: 'Impacta decisiones más allá de su área',
      category: 'STRATEGIC',
      behaviors: [
        'Construye alianzas estratégicas',
        'Persuade con datos y argumentos',
        'Genera consenso en temas complejos',
        'Representa efectivamente a la organización',
        'Navega la política organizacional con integridad'
      ],
      audienceRule: { minTrack: 'EJECUTIVO' },
      dimensionCode: null,
      subdimensionCode: null
    }
  ]
}

// ════════════════════════════════════════════════════════════════════════════
// TEMPLATE: LIDERAZGO 360°
// Enfocado en competencias de people managers
// ════════════════════════════════════════════════════════════════════════════

export const FOCALIZAHR_LEADERSHIP_360_TEMPLATE: CompetencyTemplate = {
  id: 'focalizahr-leadership-360-v1',
  name: 'Modelo Liderazgo 360°',
  description: 'Enfocado en competencias de people managers. Ideal para evaluaciones de líderes.',
  methodology: 'Assessment 360° + Coaching',
  methodologyIcon: 'Users',
  idealFor: [
    'Desarrollo de managers y ejecutivos',
    'Planes de sucesión',
    'Evaluación multifuente (360°)'
  ],
  highlight: 'Enfoque específico en habilidades de liderazgo',
  competencies: [
    {
      code: 'L360-VISION',
      name: 'Visión y Dirección',
      description: 'Define y comunica una visión clara del futuro',
      category: 'LEADERSHIP',
      behaviors: [
        'Articula una visión inspiradora',
        'Establece metas claras y alcanzables',
        'Comunica prioridades efectivamente',
        'Mantiene al equipo enfocado en lo importante',
        'Ajusta la dirección cuando es necesario'
      ],
      audienceRule: { minTrack: 'MANAGER' },
      dimensionCode: 'liderazgo',
      subdimensionCode: 'vision'
    },
    {
      code: 'L360-PEOPLE',
      name: 'Desarrollo de Talento',
      description: 'Desarrolla el potencial de cada persona',
      category: 'LEADERSHIP',
      behaviors: [
        'Identifica potencial y fortalezas',
        'Crea planes de desarrollo individuales',
        'Proporciona oportunidades de crecimiento',
        'Da feedback continuo y constructivo',
        'Celebra el progreso de cada persona'
      ],
      audienceRule: { minTrack: 'MANAGER' },
      dimensionCode: 'liderazgo',
      subdimensionCode: 'desarrollo'
    },
    {
      code: 'L360-EMPOW',
      name: 'Empoderamiento',
      description: 'Da autonomía y responsabilidad apropiadas',
      category: 'LEADERSHIP',
      behaviors: [
        'Delega con claridad de expectativas',
        'Da autoridad junto con la responsabilidad',
        'Permite el error como aprendizaje',
        'Apoya sin microgestionar',
        'Reconoce la iniciativa'
      ],
      audienceRule: { minTrack: 'MANAGER' },
      dimensionCode: 'liderazgo',
      subdimensionCode: 'autonomia'
    },
    {
      code: 'L360-COMM',
      name: 'Comunicación de Liderazgo',
      description: 'Comunica de forma efectiva como líder',
      category: 'LEADERSHIP',
      behaviors: [
        'Escucha activamente a su equipo',
        'Comunica decisiones con contexto',
        'Es accesible y disponible',
        'Maneja conversaciones difíciles',
        'Transmite confianza en momentos de incertidumbre'
      ],
      audienceRule: { minTrack: 'MANAGER' },
      dimensionCode: 'liderazgo',
      subdimensionCode: 'comunicacion'
    },
    {
      code: 'L360-TRUST',
      name: 'Generación de Confianza',
      description: 'Construye relaciones de confianza',
      category: 'LEADERSHIP',
      behaviors: [
        'Cumple sus compromisos',
        'Es consistente entre lo que dice y hace',
        'Admite errores y los corrige',
        'Protege los intereses del equipo',
        'Actúa con integridad'
      ],
      audienceRule: { minTrack: 'MANAGER' },
      dimensionCode: 'liderazgo',
      subdimensionCode: 'confianza'
    },
    {
      code: 'L360-RESULT',
      name: 'Entrega de Resultados',
      description: 'Logra resultados a través del equipo',
      category: 'LEADERSHIP',
      behaviors: [
        'Define métricas claras de éxito',
        'Remueve obstáculos para el equipo',
        'Mantiene foco en las prioridades',
        'Celebra logros colectivos',
        'Aprende de los fracasos'
      ],
      audienceRule: { minTrack: 'MANAGER' },
      dimensionCode: null,
      subdimensionCode: null
    },
    {
      code: 'L360-CHANGE',
      name: 'Liderazgo del Cambio',
      description: 'Guía al equipo a través del cambio',
      category: 'LEADERSHIP',
      behaviors: [
        'Explica el por qué del cambio',
        'Maneja las resistencias con empatía',
        'Mantiene la moral durante transiciones',
        'Adapta el ritmo según el equipo',
        'Celebra los hitos del cambio'
      ],
      audienceRule: { minTrack: 'MANAGER' },
      dimensionCode: null,
      subdimensionCode: null
    },
    {
      code: 'L360-WELLB',
      name: 'Bienestar del Equipo',
      description: 'Cuida el bienestar integral del equipo',
      category: 'LEADERSHIP',
      behaviors: [
        'Detecta señales de burnout',
        'Promueve balance vida-trabajo',
        'Crea ambiente psicológicamente seguro',
        'Aborda conflictos tempranamente',
        'Se preocupa genuinamente por las personas'
      ],
      audienceRule: { minTrack: 'MANAGER' },
      dimensionCode: 'bienestar',
      subdimensionCode: 'equilibrio'
    }
  ]
}

// ════════════════════════════════════════════════════════════════════════════
// TEMPLATE: HIGH PERFORMANCE
// Basado en Google Project Oxygen y Netflix Culture
// ════════════════════════════════════════════════════════════════════════════

export const FOCALIZAHR_HIGH_PERFORMANCE_TEMPLATE: CompetencyTemplate = {
  id: 'focalizahr-high-perf-v1',
  name: 'Modelo High Performance',
  description: 'Basado en Google Project Oxygen y Netflix Culture. Para organizaciones de alto rendimiento.',
  methodology: 'Google Project Oxygen + Netflix',
  methodologyIcon: 'TrendingUp',
  idealFor: [
    'Startups tech y scale-ups',
    'Cultura de alto rendimiento',
    'Equipos ágiles y autónomos'
  ],
  highlight: 'Estándares de excelencia Silicon Valley',
  competencies: [
    {
      code: 'HP-IMPACT',
      name: 'Impacto',
      description: 'Genera resultados significativos',
      category: 'CORE',
      behaviors: [
        'Prioriza lo que más valor genera',
        'Trabaja en lo importante, no solo en lo urgente',
        'Mide y comunica su impacto',
        'Busca multiplicar su efectividad',
        'Elimina trabajo de bajo valor'
      ],
      audienceRule: null,
      dimensionCode: null,
      subdimensionCode: null
    },
    {
      code: 'HP-OWNER',
      name: 'Ownership',
      description: 'Actúa como dueño de los resultados',
      category: 'CORE',
      behaviors: [
        'Toma responsabilidad completa',
        'No espera instrucciones para actuar',
        'Piensa a largo plazo',
        'Cuida los recursos como propios',
        'No dice "no es mi trabajo"'
      ],
      audienceRule: null,
      dimensionCode: null,
      subdimensionCode: null
    },
    {
      code: 'HP-LEARN',
      name: 'Aprendizaje Continuo',
      description: 'Mejora constantemente',
      category: 'CORE',
      behaviors: [
        'Busca feedback proactivamente',
        'Aprende de los errores',
        'Comparte conocimiento con otros',
        'Se mantiene actualizado',
        'Experimenta con nuevas formas de trabajar'
      ],
      audienceRule: null,
      dimensionCode: 'desarrollo',
      subdimensionCode: 'aprendizaje'
    },
    {
      code: 'HP-COLLAB',
      name: 'Colaboración de Alto Rendimiento',
      description: 'Trabaja efectivamente con otros',
      category: 'CORE',
      behaviors: [
        'Ayuda a otros a tener éxito',
        'Comunica de forma directa y respetuosa',
        'Da y recibe feedback abiertamente',
        'Resuelve conflictos rápidamente',
        'Valora la diversidad de perspectivas'
      ],
      audienceRule: null,
      dimensionCode: 'ambiente',
      subdimensionCode: 'colaboracion'
    },
    {
      code: 'HP-INNOV',
      name: 'Innovación',
      description: 'Cuestiona el status quo',
      category: 'CORE',
      behaviors: [
        'Propone nuevas ideas',
        'Cuestiona procesos ineficientes',
        'Experimenta con soluciones',
        'Acepta que innovar implica fallar',
        'Busca inspiración fuera de su área'
      ],
      audienceRule: null,
      dimensionCode: null,
      subdimensionCode: null
    },
    {
      code: 'HP-COACH',
      name: 'Coaching de Alto Rendimiento',
      description: 'Desarrolla talento excepcional',
      category: 'LEADERSHIP',
      behaviors: [
        'Contrata mejor que él/ella mismo',
        'Da feedback directo y constructivo',
        'Crea un ambiente de alto rendimiento',
        'Desarrolla líderes, no solo ejecutores',
        'Toma decisiones difíciles sobre talento'
      ],
      audienceRule: { minTrack: 'MANAGER' },
      dimensionCode: 'liderazgo',
      subdimensionCode: 'desarrollo'
    },
    {
      code: 'HP-STRAT',
      name: 'Pensamiento Estratégico',
      description: 'Ve el panorama completo',
      category: 'LEADERSHIP',
      behaviors: [
        'Conecta su trabajo con la estrategia',
        'Anticipa consecuencias de segundo orden',
        'Balancea corto y largo plazo',
        'Identifica tendencias relevantes',
        'Simplifica la complejidad'
      ],
      audienceRule: { minTrack: 'MANAGER' },
      dimensionCode: null,
      subdimensionCode: null
    },
    {
      code: 'HP-EXEC',
      name: 'Ejecución Excelente',
      description: 'Ejecuta con velocidad y calidad',
      category: 'LEADERSHIP',
      behaviors: [
        'Convierte estrategia en acción',
        'Mantiene ritmo alto sin sacrificar calidad',
        'Remueve obstáculos del equipo',
        'Toma decisiones con información incompleta',
        'Ajusta el rumbo rápidamente'
      ],
      audienceRule: { minTrack: 'MANAGER' },
      dimensionCode: null,
      subdimensionCode: null
    },
    {
      code: 'HP-CULTURE',
      name: 'Guardián de la Cultura',
      description: 'Protege y evoluciona la cultura',
      category: 'STRATEGIC',
      behaviors: [
        'Modela los valores de la empresa',
        'Confronta comportamientos tóxicos',
        'Celebra ejemplos de la cultura',
        'Evoluciona la cultura intencionalmente',
        'Contrata y promueve por cultura'
      ],
      audienceRule: { minTrack: 'EJECUTIVO' },
      dimensionCode: 'cultura',
      subdimensionCode: 'valores'
    },
    {
      code: 'HP-SCALE',
      name: 'Escalabilidad',
      description: 'Construye sistemas que escalan',
      category: 'STRATEGIC',
      behaviors: [
        'Diseña procesos escalables',
        'Automatiza lo repetitivo',
        'Desarrolla líderes que desarrollan líderes',
        'Piensa en impacto organizacional',
        'Balancea velocidad con sostenibilidad'
      ],
      audienceRule: { minTrack: 'EJECUTIVO' },
      dimensionCode: null,
      subdimensionCode: null
    }
  ]
}

// ════════════════════════════════════════════════════════════════════════════
// MAPA DE TEMPLATES
// ════════════════════════════════════════════════════════════════════════════

export const COMPETENCY_TEMPLATES: Record<string, CompetencyTemplate> = {
  'focalizahr-standard-v1': FOCALIZAHR_STANDARD_TEMPLATE,
  'focalizahr-leadership-360-v1': FOCALIZAHR_LEADERSHIP_360_TEMPLATE,
  'focalizahr-high-perf-v1': FOCALIZAHR_HIGH_PERFORMANCE_TEMPLATE
}

// ════════════════════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════════════════════

/**
 * Obtiene un template por ID
 */
export function getCompetencyTemplate(templateId: string): CompetencyTemplate | null {
  return COMPETENCY_TEMPLATES[templateId] || null
}

/**
 * Lista templates disponibles (para selector en UI)
 */
export function listAvailableTemplates(): Array<{
  id: string
  name: string
  description: string
  competencyCount: number
  categories: string[]
  methodology: string
  methodologyIcon: string
  idealFor: string[]
  highlight: string
}> {
  return Object.entries(COMPETENCY_TEMPLATES).map(([id, template]) => ({
    id,
    name: template.name,
    description: template.description,
    competencyCount: template.competencies.length,
    categories: [...new Set(template.competencies.map(c => c.category))],
    methodology: template.methodology,
    methodologyIcon: template.methodologyIcon,
    idealFor: template.idealFor,
    highlight: template.highlight
  }))
}

/**
 * Cuenta competencias por categoría en un template
 */
export function countByCategory(templateId: string): Record<string, number> {
  const template = COMPETENCY_TEMPLATES[templateId]
  if (!template) return {}

  return template.competencies.reduce((acc, comp) => {
    acc[comp.category] = (acc[comp.category] || 0) + 1
    return acc
  }, {} as Record<string, number>)
}
