import { CompetencyTemplate } from '@/lib/types/pdi-suggestion'

// ════════════════════════════════════════════════════════════════════════════
// BIBLIOTECA DE COMPETENCIAS PARA PDI
// 12 Competencias del Template FocalizaHR Estándar
// Sugerencias adaptadas por performanceTrack
// Tono: Simple y directo para TODOS
// ════════════════════════════════════════════════════════════════════════════

export const PDI_COMPETENCY_LIBRARY: Record<string, CompetencyTemplate> = {

  // ══════════════════════════════════════════════════════════════════════════
  // CORE - 5 COMPETENCIAS (Todos los empleados)
  // ══════════════════════════════════════════════════════════════════════════

  // ──────────────────────────────────────────────────────────────────────────
  // 1. COMUNICACIÓN EFECTIVA (CORE-COMM)
  // ──────────────────────────────────────────────────────────────────────────
  'CORE-COMM': {
    code: 'CORE-COMM',
    name: 'Comunicación Efectiva',
    keywords: ['comunicacion', 'communication', 'expresion', 'mensaje', 'claridad', 'escucha', 'presentaciones'],

    strategies: {
      EJECUTIVO: {
        blindSpot: [{
          title: "Valida cómo llega tu mensaje al Directorio",
          description: "Tu autoevaluación es más alta que la de tu jefatura. Puede haber una brecha entre lo que crees comunicar y lo que realmente llega.",
          action: "Después de tu próxima presentación, pregunta a 2 personas: '¿Qué entendiste que hay que hacer?'",
          targetOutcome: "Obtener feedback directo de al menos 3 stakeholders",
          category: 'BEHAVIORAL_CHANGE',
          priority: 'ALTA',
          suggestedResources: [
            { type: 'PRACTICE', title: "Técnica del 'Mirror Back': pide que te repitan el mensaje" }
          ],
          estimatedWeeks: 4
        }],
        development: [{
          title: "Simplifica tu mensaje estratégico",
          description: "Los mejores líderes explican cosas complejas de forma simple. Si tu equipo no puede repetir tu estrategia en 30 segundos, es demasiado compleja.",
          action: "Reescribe tu próxima comunicación importante usando máximo 3 ideas principales",
          targetOutcome: "Tu equipo directo puede explicar la estrategia sin ayuda",
          category: 'SKILL_DEVELOPMENT',
          priority: 'ALTA',
          suggestedResources: [
            { type: 'BOOK', title: "Made to Stick", provider: "Chip & Dan Heath" }
          ],
          estimatedWeeks: 6
        }],
        strength: [{
          title: "Lidera comunicaciones críticas de la organización",
          description: "Tu fortaleza en comunicación puede tener más impacto si la usas en momentos clave.",
          action: "Ofrécete para comunicar el próximo cambio importante o resultado estratégico",
          targetOutcome: "Ser referente de comunicación ejecutiva",
          category: 'EXPERIENCE_BUILDING',
          priority: 'MEDIA',
          suggestedResources: [],
          estimatedWeeks: 8
        }]
      },
      MANAGER: {
        blindSpot: [{
          title: "Revisa si tu equipo te entiende",
          description: "Hay una diferencia entre cómo te evalúas y cómo te ve tu jefatura. Puede que el mensaje no esté llegando como crees.",
          action: "Al dar una instrucción, pide que te la repitan con sus palabras. Si hay diferencias, ahí está la brecha.",
          targetOutcome: "Reducir malentendidos en instrucciones del día a día",
          category: 'BEHAVIORAL_CHANGE',
          priority: 'ALTA',
          suggestedResources: [
            { type: 'PRACTICE', title: "Técnica de parafraseo: '¿Me puedes explicar qué entendiste?'" }
          ],
          estimatedWeeks: 4
        }],
        development: [{
          title: "Estructura tus reuniones de equipo",
          description: "Una reunión sin estructura clara genera confusión. Define siempre: qué vamos a decidir, quién hace qué, para cuándo.",
          action: "Usa los últimos 2 minutos de cada reunión para que alguien resuma los acuerdos",
          targetOutcome: "Tu equipo sale de las reuniones sabiendo exactamente qué hacer",
          category: 'SKILL_DEVELOPMENT',
          priority: 'ALTA',
          suggestedResources: [
            { type: 'TEMPLATE', title: "Minuta: Decisiones + Responsables + Fechas" }
          ],
          estimatedWeeks: 4
        }],
        strength: [{
          title: "Entrena a otros managers en comunicación",
          description: "Si esto es tu fortaleza, compártela. Otros managers pueden aprender de ti.",
          action: "Ofrece hacer una sesión corta sobre cómo comunicas con tu equipo",
          targetOutcome: "Aportar al desarrollo de otros líderes",
          category: 'MENTORING',
          priority: 'BAJA',
          suggestedResources: [],
          estimatedWeeks: 6
        }]
      },
      COLABORADOR: {
        blindSpot: [{
          title: "Pide feedback sobre cómo te expresas",
          description: "Tu jefatura ve algo diferente a lo que tú percibes. Vale la pena explorar dónde está la diferencia.",
          action: "Pregúntale a un compañero de confianza: '¿Soy claro cuando explico algo?' Escucha sin defenderte.",
          targetOutcome: "Identificar un área específica de mejora",
          category: 'BEHAVIORAL_CHANGE',
          priority: 'ALTA',
          suggestedResources: [
            { type: 'PRACTICE', title: "Pedir feedback específico, no general" }
          ],
          estimatedWeeks: 2
        }],
        development: [{
          title: "Prepara tus ideas antes de hablar",
          description: "Cuando improvisamos, el mensaje puede perderse. Tomarte 1 minuto para ordenar ideas hace la diferencia.",
          action: "Antes de tu próxima reunión importante, escribe 3 puntos que quieres decir",
          targetOutcome: "Sentirte más seguro al expresar tus ideas",
          category: 'SKILL_DEVELOPMENT',
          priority: 'MEDIA',
          suggestedResources: [
            { type: 'TEMPLATE', title: "Formato: Situación → Propuesta → Beneficio" }
          ],
          estimatedWeeks: 4
        }],
        strength: [{
          title: "Ayuda a comunicar en tu equipo",
          description: "Si comunicas bien, puedes ayudar cuando hay que explicar algo al grupo.",
          action: "Ofrécete para explicar un proceso o novedad a tus compañeros",
          targetOutcome: "Ser referente de comunicación en tu equipo",
          category: 'EXPERIENCE_BUILDING',
          priority: 'BAJA',
          suggestedResources: [],
          estimatedWeeks: 4
        }]
      }
    },
    coachingTips: {
      blindSpot: [
        "El colaborador cree comunicarse mejor de lo que perciben otros. Usa ejemplos concretos.",
        "Pregunta: '¿En qué situación específica sentiste que tu mensaje no llegó bien?'"
      ],
      development: [
        "Enfócate en situaciones del día a día, no en grandes presentaciones.",
        "Sugiere grabar una reunión y revisarla juntos (si hay confianza)."
      ],
      strength: [
        "Busca oportunidades para que lidere comunicaciones del equipo.",
        "Puede ser mentor de otros en esta competencia."
      ]
    }
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 2. TRABAJO EN EQUIPO (CORE-TEAM)
  // ──────────────────────────────────────────────────────────────────────────
  'CORE-TEAM': {
    code: 'CORE-TEAM',
    name: 'Trabajo en Equipo',
    keywords: ['equipo', 'team', 'colaboracion', 'cooperacion', 'sinergia', 'compañeros', 'juntos'],

    strategies: {
      EJECUTIVO: {
        blindSpot: [{
          title: "Revisa si tu estilo facilita o complica la colaboración",
          description: "A veces, sin querer, nuestro estilo de trabajo dificulta que otros colaboren con nosotros.",
          action: "Pregunta a un par: '¿Qué podría hacer para que sea más fácil trabajar conmigo?'",
          targetOutcome: "Identificar un comportamiento específico a ajustar",
          category: 'BEHAVIORAL_CHANGE',
          priority: 'ALTA',
          suggestedResources: [],
          estimatedWeeks: 4
        }],
        development: [{
          title: "Crea espacios de colaboración cross-área",
          description: "Los silos se rompen cuando la gente se conoce. Facilita que eso pase.",
          action: "Organiza una sesión de trabajo con otra área que necesites y que no suelas involucrar",
          targetOutcome: "Mejorar un proceso que requiere dos áreas",
          category: 'EXPERIENCE_BUILDING',
          priority: 'MEDIA',
          suggestedResources: [],
          estimatedWeeks: 8
        }],
        strength: [{
          title: "Conecta lo que está desconectado",
          description: "Tu capacidad de colaborar es excepcional. Úsala para unir áreas que hoy no se hablan.",
          action: "Identifica dos gerencias aisladas y lidera una iniciativa conjunta entre ellas.",
          targetOutcome: "Crear un flujo de trabajo cross-funcional exitoso",
          category: 'EXPERIENCE_BUILDING',
          priority: 'ALTA',
          suggestedResources: [],
          estimatedWeeks: 12
        }]
      },
      MANAGER: {
        blindSpot: [{
          title: "¿Tu equipo colabora entre ellos o solo contigo?",
          description: "Si todo pasa por ti, no hay equipo, hay individuos que te reportan.",
          action: "En tu próxima reunión, no resuelvas tú. Pregunta: '¿Quién puede ayudar con esto?'",
          targetOutcome: "Tu equipo se apoya sin necesitar tu mediación",
          category: 'BEHAVIORAL_CHANGE',
          priority: 'ALTA',
          suggestedResources: [],
          estimatedWeeks: 4
        }],
        development: [{
          title: "Define roles claros en el equipo",
          description: "Cuando no está claro quién hace qué, la gente duplica esfuerzos o deja huecos.",
          action: "Haz un ejercicio con tu equipo: cada uno explica qué hace y los demás confirman si coincide",
          targetOutcome: "Todos saben quién hace qué sin confusión",
          category: 'SKILL_DEVELOPMENT',
          priority: 'MEDIA',
          suggestedResources: [
            { type: 'TEMPLATE', title: "Matriz RACI simplificada" }
          ],
          estimatedWeeks: 4
        }],
        strength: [{
          title: "Enseña a construir confianza",
          description: "Has creado un entorno seguro. Otros líderes necesitan aprender eso de ti.",
          action: "Invita a otro manager a observar una de tus reuniones para que vea cómo fomentas la participación.",
          targetOutcome: "Mentorear a un par en dinámicas de equipo",
          category: 'MENTORING',
          priority: 'MEDIA',
          suggestedResources: [],
          estimatedWeeks: 4
        }]
      },
      COLABORADOR: {
        blindSpot: [{
          title: "Revisa si otros quieren trabajar contigo",
          description: "Todos creemos ser buen compañero. Pero la percepción de los demás es la que cuenta.",
          action: "Pregúntale a alguien con quien trabajaste recientemente: '¿Qué podría haber hecho mejor?'",
          targetOutcome: "Identificar un área de mejora en tu colaboración",
          category: 'BEHAVIORAL_CHANGE',
          priority: 'MEDIA',
          suggestedResources: [],
          estimatedWeeks: 2
        }],
        development: [{
          title: "Ofrece ayuda sin que te lo pidan",
          description: "El mejor compañero ve que alguien está complicado y ofrece una mano.",
          action: "Esta semana, identifica a alguien con mucha carga y ofrécele ayuda en algo específico",
          targetOutcome: "Ser reconocido como alguien que aporta al equipo",
          category: 'BEHAVIORAL_CHANGE',
          priority: 'MEDIA',
          suggestedResources: [],
          estimatedWeeks: 4
        }],
        strength: [{
          title: "Sé el mentor de los nuevos",
          description: "Eres el modelo de cómo trabajar en equipo aquí. Eres la mejor persona para recibir a los nuevos.",
          action: "Ofrécete voluntariamente para acompañar al próximo ingreso de tu área durante su primera semana.",
          targetOutcome: "Acelerar la integración de nuevos compañeros",
          category: 'MENTORING',
          priority: 'BAJA',
          suggestedResources: [],
          estimatedWeeks: 2
        }]
      }
    },
    coachingTips: {
      blindSpot: [
        "¿Hay feedback de que es difícil trabajar con esta persona?",
        "Observa en reuniones: ¿escucha o solo espera su turno para hablar?"
      ],
      development: [
        "Asigna proyectos que requieran colaborar con otros.",
        "Reconoce públicamente cuando ayude a un compañero."
      ],
      strength: [
        "Es un conector natural. Úsalo para integrar equipos.",
        "Puede facilitar sesiones de trabajo cross-área."
      ]
    }
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 3. ORIENTACIÓN A RESULTADOS (CORE-RESULTS)
  // ──────────────────────────────────────────────────────────────────────────
  'CORE-RESULTS': {
    code: 'CORE-RESULTS',
    name: 'Orientación a Resultados',
    keywords: ['resultados', 'results', 'logros', 'metas', 'objetivos', 'cumplimiento', 'ejecucion', 'accountability'],

    strategies: {
      EJECUTIVO: {
        blindSpot: [{
          title: "Revisa si tus prioridades son las del negocio",
          description: "A veces estamos ocupados en lo que nos gusta, no en lo que más impacta.",
          action: "Lista tus 5 actividades principales de la semana. ¿Cuántas impactan el resultado del trimestre?",
          targetOutcome: "Alinear tiempo invertido con impacto real",
          category: 'BEHAVIORAL_CHANGE',
          priority: 'ALTA',
          suggestedResources: [
            { type: 'PRACTICE', title: "Auditoría semanal: ¿Dónde invertí mi tiempo?" }
          ],
          estimatedWeeks: 4
        }],
        development: [{
          title: "Define métricas de éxito antes de empezar",
          description: "Si no sabes cómo vas a medir el éxito, no puedes gestionarlo.",
          action: "Para tu próxima iniciativa, escribe primero: '¿Cómo voy a saber si funcionó?'",
          targetOutcome: "Todas tus iniciativas tienen KPIs definidos desde el inicio",
          category: 'SKILL_DEVELOPMENT',
          priority: 'ALTA',
          suggestedResources: [
            { type: 'BOOK', title: "Measure What Matters", provider: "John Doerr" }
          ],
          estimatedWeeks: 6
        }],
        strength: [{
          title: "Eleva la ambición de la organización",
          description: "Logras lo que te propones. Ayuda a definir metas más agresivas para la compañía.",
          action: "Lidera la definición de los OKRs del próximo año para toda tu división.",
          targetOutcome: "Alinear estrategia con ejecución de excelencia",
          category: 'EXPERIENCE_BUILDING',
          priority: 'ALTA',
          suggestedResources: [],
          estimatedWeeks: 8
        }]
      },
      MANAGER: {
        blindSpot: [{
          title: "Revisa si tu equipo tiene claridad de prioridades",
          description: "Si les preguntas a 3 personas de tu equipo cuál es la prioridad, ¿dirían lo mismo?",
          action: "Haz la prueba: pregúntale a cada uno '¿Cuál es tu prioridad #1?' y compara respuestas.",
          targetOutcome: "Alineación del equipo en las 3 prioridades principales",
          category: 'BEHAVIORAL_CHANGE',
          priority: 'ALTA',
          suggestedResources: [
            { type: 'PRACTICE', title: "Reunión semanal de 15 min: solo prioridades" }
          ],
          estimatedWeeks: 4
        }],
        development: [{
          title: "Haz seguimiento sistemático",
          description: "No basta con definir objetivos. Hay que revisarlos regularmente.",
          action: "Implementa un check-in semanal de 15 minutos solo para revisar avance de metas",
          targetOutcome: "Detectar atrasos antes de que sean crisis",
          category: 'SKILL_DEVELOPMENT',
          priority: 'ALTA',
          suggestedResources: [
            { type: 'TEMPLATE', title: "Check-in: Meta → Avance → Bloqueadores → Acción" }
          ],
          estimatedWeeks: 4
        }],
        strength: [{
          title: "Exporta tu fórmula de éxito",
          description: "Tu equipo cumple consistentemente. Tienes un método que el resto debería copiar.",
          action: "Documenta tu proceso de seguimiento semanal y compártelo en la reunión de gerencia.",
          targetOutcome: "Que otros equipos adopten tus buenas prácticas",
          category: 'SKILL_DEVELOPMENT',
          priority: 'MEDIA',
          suggestedResources: [],
          estimatedWeeks: 4
        }]
      },
      COLABORADOR: {
        blindSpot: [{
          title: "Pregunta si estás trabajando en lo correcto",
          description: "Estar ocupado no es lo mismo que ser productivo.",
          action: "Pregúntale a tu jefe: '¿Estoy enfocado en lo que más te importa?'",
          targetOutcome: "Confirmar que tus esfuerzos están alineados",
          category: 'BEHAVIORAL_CHANGE',
          priority: 'ALTA',
          suggestedResources: [],
          estimatedWeeks: 2
        }],
        development: [{
          title: "Termina lo que empiezas",
          description: "Es fácil empezar muchas cosas. Lo difícil es cerrarlas.",
          action: "Haz una lista de pendientes. Elige 3 para terminar esta semana y di no a lo demás.",
          targetOutcome: "Reducir tu lista de pendientes a la mitad",
          category: 'SKILL_DEVELOPMENT',
          priority: 'MEDIA',
          suggestedResources: [],
          estimatedWeeks: 4
        }],
        strength: [{
          title: "Optimiza un proceso lento",
          description: "Eres muy eficiente. Seguramente ves pasos inútiles que otros ignoran.",
          action: "Elige una tarea repetitiva del equipo y propón una forma de hacerla en la mitad del tiempo.",
          targetOutcome: "Ahorrar tiempo operativo a todo el equipo",
          category: 'EXPERIENCE_BUILDING',
          priority: 'MEDIA',
          suggestedResources: [],
          estimatedWeeks: 4
        }]
      }
    },
    coachingTips: {
      blindSpot: [
        "¿Está confundiendo actividad con resultados?",
        "Pregunta: '¿Cuál fue tu logro más importante del mes?'"
      ],
      development: [
        "Ayúdale a priorizar. A veces el problema no es capacidad, es foco.",
        "Revisen juntos cómo invierte su tiempo."
      ],
      strength: ["Dale los proyectos más críticos.", "Puede enseñar su método a otros."]
    }
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 4. ADAPTABILIDAD (CORE-ADAPT)
  // ──────────────────────────────────────────────────────────────────────────
  'CORE-ADAPT': {
    code: 'CORE-ADAPT',
    name: 'Adaptabilidad',
    keywords: ['adaptabilidad', 'flexibilidad', 'cambio', 'resiliencia', 'ajuste', 'agil'],

    strategies: {
      EJECUTIVO: {
        blindSpot: [{
          title: "Revisa si tu resistencia al cambio es visible",
          description: "A veces creemos ser flexibles, pero otros ven rigidez en nuestras decisiones.",
          action: "Pregunta a alguien de confianza: '¿En qué situaciones me ves resistente al cambio?'",
          targetOutcome: "Identificar patrones de rigidez no conscientes",
          category: 'BEHAVIORAL_CHANGE',
          priority: 'ALTA',
          suggestedResources: [],
          estimatedWeeks: 4
        }],
        development: [{
          title: "Practica cambiar de opinión públicamente",
          description: "Los líderes que nunca cambian de opinión generan culturas rígidas.",
          action: "La próxima vez que alguien te convenza con un buen argumento, reconócelo frente al equipo",
          targetOutcome: "Modelar que cambiar de opinión es válido",
          category: 'BEHAVIORAL_CHANGE',
          priority: 'MEDIA',
          suggestedResources: [],
          estimatedWeeks: 6
        }],
        strength: [{
          title: "Patrocina la transformación",
          description: "Navegas la incertidumbre mejor que nadie. Sé la cara visible del próximo gran cambio.",
          action: "Ofrécete para comunicar las noticias difíciles o cambios complejos en la próxima reunión general.",
          targetOutcome: "Transmitir calma y dirección en momentos inciertos",
          category: 'EXPERIENCE_BUILDING',
          priority: 'ALTA',
          suggestedResources: [],
          estimatedWeeks: 6
        }]
      },
      MANAGER: {
        blindSpot: [{
          title: "¿Tu equipo siente que puede proponer cambios?",
          description: "Si siempre defiendes 'cómo se ha hecho siempre', tu equipo dejará de proponer.",
          action: "Pregunta a tu equipo: '¿Qué proceso cambiarían si pudieran?'",
          targetOutcome: "Abrir espacio para ideas nuevas",
          category: 'BEHAVIORAL_CHANGE',
          priority: 'ALTA',
          suggestedResources: [],
          estimatedWeeks: 4
        }],
        development: [{
          title: "Implementa un cambio pequeño propuesto por tu equipo",
          description: "La mejor forma de demostrar apertura es actuar, no solo escuchar.",
          action: "Elige una sugerencia de tu equipo e impleméntala este mes",
          targetOutcome: "Tu equipo ve que sus ideas se concretan",
          category: 'BEHAVIORAL_CHANGE',
          priority: 'MEDIA',
          suggestedResources: [],
          estimatedWeeks: 4
        }],
        strength: [{
          title: "Lidera los pilotos de innovación",
          description: "Tu equipo se adapta rápido gracias a ti. Son el laboratorio ideal.",
          action: "Ofrécete para que tu equipo sea el primero en probar la nueva herramienta o proceso corporativo.",
          targetOutcome: "Ser el equipo pionero en adopción tecnológica",
          category: 'EXPERIENCE_BUILDING',
          priority: 'MEDIA',
          suggestedResources: [],
          estimatedWeeks: 8
        }]
      },
      COLABORADOR: {
        blindSpot: [{
          title: "Revisa cómo reaccionas ante cambios",
          description: "Puede que no notes que tu primera reacción es resistir.",
          action: "La próxima vez que anuncien un cambio, espera 24 horas antes de opinar.",
          targetOutcome: "Responder en vez de reaccionar",
          category: 'BEHAVIORAL_CHANGE',
          priority: 'MEDIA',
          suggestedResources: [],
          estimatedWeeks: 4
        }],
        development: [{
          title: "Ofrécete para algo nuevo",
          description: "La adaptabilidad se ejercita saliendo de la zona cómoda.",
          action: "Pide participar en un proyecto o tarea diferente a lo que haces normalmente",
          targetOutcome: "Demostrar flexibilidad ante lo nuevo",
          category: 'EXPERIENCE_BUILDING',
          priority: 'MEDIA',
          suggestedResources: [],
          estimatedWeeks: 6
        }],
        strength: [{
          title: "Ayuda a los que se resisten",
          description: "No le temes a lo nuevo. Ayuda a tus compañeros que sí le temen.",
          action: "Cuando se anuncie un cambio, identifica a un compañero resistente y ayúdalo a entender los beneficios.",
          targetOutcome: "Facilitar la adopción de cambios en tu entorno",
          category: 'MENTORING',
          priority: 'BAJA',
          suggestedResources: [],
          estimatedWeeks: 4
        }]
      }
    },
    coachingTips: {
      blindSpot: [
        "¿Cómo reacciona cuando le cambian las reglas del juego?",
        "Observa si su primera respuesta ante cambios es buscar problemas o soluciones."
      ],
      development: [
        "Exponlo gradualmente a situaciones de cambio controlado.",
        "Celebra cuando maneje bien una situación inesperada."
      ],
      strength: ["Es ideal para liderar pilotos o proyectos nuevos.", "Puede ayudar a otros a adaptarse."]
    }
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 5. ORIENTACIÓN AL CLIENTE (CORE-CLIENT)
  // ──────────────────────────────────────────────────────────────────────────
  'CORE-CLIENT': {
    code: 'CORE-CLIENT',
    name: 'Orientación al Cliente',
    keywords: ['cliente', 'customer', 'servicio', 'usuario', 'necesidades', 'satisfaccion'],

    strategies: {
      EJECUTIVO: {
        blindSpot: [{
          title: "¿Cuándo fue la última vez que hablaste con un cliente?",
          description: "Es fácil alejarse del cliente cuando subes de nivel. Eso distorsiona las decisiones.",
          action: "Agenda una conversación directa con un cliente este mes, sin intermediarios",
          targetOutcome: "Reconectar con la realidad del cliente",
          category: 'BEHAVIORAL_CHANGE',
          priority: 'ALTA',
          suggestedResources: [],
          estimatedWeeks: 4
        }],
        development: [{
          title: "Incluye la voz del cliente en tus decisiones",
          description: "Antes de decidir algo importante, pregunta: ¿qué diría el cliente?",
          action: "En tu próxima decisión estratégica, pide datos de satisfacción o feedback de clientes",
          targetOutcome: "Decisiones basadas en necesidades reales",
          category: 'BEHAVIORAL_CHANGE',
          priority: 'ALTA',
          suggestedResources: [],
          estimatedWeeks: 6
        }],
        strength: [{
          title: "Trae al cliente a la mesa directiva",
          description: "Tu conexión con el mercado es única. Asegura que la estrategia no pierda eso.",
          action: "Invita a un cliente clave a una sesión de estrategia con el directorio o gerencia.",
          targetOutcome: "Decisiones directivas centradas en el cliente real",
          category: 'EXPERIENCE_BUILDING',
          priority: 'ALTA',
          suggestedResources: [],
          estimatedWeeks: 4
        }]
      },
      MANAGER: {
        blindSpot: [{
          title: "¿Tu equipo conoce el impacto de su trabajo en el cliente?",
          description: "Si no saben cómo afectan al cliente, no pueden priorizarlo.",
          action: "Comparte con tu equipo un caso real de cómo su trabajo afectó a un cliente",
          targetOutcome: "Conectar el trabajo diario con el cliente final",
          category: 'BEHAVIORAL_CHANGE',
          priority: 'ALTA',
          suggestedResources: [],
          estimatedWeeks: 4
        }],
        development: [{
          title: "Crea un canal de feedback del cliente",
          description: "Si el feedback del cliente no llega, no puede mejorar nada.",
          action: "Implementa una forma simple de que el feedback del cliente llegue a tu equipo",
          targetOutcome: "Tu equipo escucha al cliente regularmente",
          category: 'SKILL_DEVELOPMENT',
          priority: 'MEDIA',
          suggestedResources: [],
          estimatedWeeks: 6
        }],
        strength: [{
          title: "Crea la 'Universidad del Cliente'",
          description: "Tu equipo da un servicio estelar. Enseña a otras áreas cómo lo hacen.",
          action: "Graba una cápsula de 5 minutos con un 'caso de éxito' de tu equipo y compártela.",
          targetOutcome: "Difundir historias de éxito de servicio",
          category: 'MENTORING',
          priority: 'BAJA',
          suggestedResources: [],
          estimatedWeeks: 4
        }]
      },
      COLABORADOR: {
        blindSpot: [{
          title: "Pregunta cómo impactas al cliente",
          description: "Si no sabes cómo tu trabajo afecta al cliente, es difícil priorizarlo.",
          action: "Pregunta a tu jefe: '¿Cómo afecta mi trabajo al cliente final?'",
          targetOutcome: "Entender tu rol en la cadena de valor",
          category: 'KNOWLEDGE_ACQUISITION',
          priority: 'MEDIA',
          suggestedResources: [],
          estimatedWeeks: 2
        }],
        development: [{
          title: "Ponte en los zapatos del cliente",
          description: "La mejor forma de entender al cliente es experimentar lo que él experimenta.",
          action: "Si es posible, usa tu producto/servicio como lo haría un cliente",
          targetOutcome: "Empatía real con la experiencia del cliente",
          category: 'EXPERIENCE_BUILDING',
          priority: 'MEDIA',
          suggestedResources: [],
          estimatedWeeks: 4
        }],
        strength: [{
          title: "Maneja las situaciones críticas",
          description: "Tienes un don para calmar aguas turbulentas. Eres el experto en casos difíciles.",
          action: "Ofrécete para atender al próximo cliente difícil o enojado y enseña a otros cómo lo resolviste.",
          targetOutcome: "Resolver conflictos que otros no pueden",
          category: 'EXPERIENCE_BUILDING',
          priority: 'MEDIA',
          suggestedResources: [],
          estimatedWeeks: 2
        }]
      }
    },
    coachingTips: {
      blindSpot: [
        "¿Habla del cliente o solo de procesos internos?",
        "Pregunta: '¿Quién es tu cliente y qué necesita?'"
      ],
      development: [
        "Exponlo a feedback directo de clientes.",
        "Asigna tareas donde vea el impacto en el cliente."
      ],
      strength: ["Puede ser embajador de la voz del cliente.", "Ideal para proyectos de mejora de experiencia."]
    }
  },

  // ══════════════════════════════════════════════════════════════════════════
  // LEADERSHIP - 4 COMPETENCIAS (Managers + Ejecutivos)
  // ══════════════════════════════════════════════════════════════════════════

  // ──────────────────────────────────────────────────────────────────────────
  // 6. DESARROLLO DE PERSONAS (LEAD-DEV)
  // ──────────────────────────────────────────────────────────────────────────
  'LEAD-DEV': {
    code: 'LEAD-DEV',
    name: 'Desarrollo de Personas',
    keywords: ['desarrollo', 'personas', 'coaching', 'mentoring', 'crecimiento', 'feedback', 'talento'],

    strategies: {
      EJECUTIVO: {
        blindSpot: [{
          title: "¿Estás desarrollando sucesores?",
          description: "Si nadie puede reemplazarte, no estás desarrollando a tu equipo.",
          action: "Identifica a 2 personas que podrían asumir tu rol y pregúntales qué les falta",
          targetOutcome: "Tener un plan de sucesión claro",
          category: 'BEHAVIORAL_CHANGE',
          priority: 'ALTA',
          suggestedResources: [],
          estimatedWeeks: 8
        }],
        development: [{
          title: "Dedica tiempo a conversaciones de desarrollo",
          description: "El desarrollo no pasa en evaluaciones anuales. Pasa en conversaciones frecuentes.",
          action: "Agenda 30 minutos mensuales con cada reporte directo solo para hablar de su desarrollo",
          targetOutcome: "Cada persona tiene un plan de desarrollo activo",
          category: 'BEHAVIORAL_CHANGE',
          priority: 'ALTA',
          suggestedResources: [],
          estimatedWeeks: 6
        }],
        strength: [{
          title: "Diseña la sucesión organizacional",
          description: "Desarrollas gente increíblemente bien. Asegura el futuro de la empresa.",
          action: "Identifica a los Top 5 talentos jóvenes de la empresa y diseña un plan de rotación para ellos.",
          targetOutcome: "Tener un pipeline de talento listo para ascender",
          category: 'EXPERIENCE_BUILDING',
          priority: 'ALTA',
          suggestedResources: [],
          estimatedWeeks: 12
        }]
      },
      MANAGER: {
        blindSpot: [{
          title: "¿Cuándo fue tu última conversación de desarrollo?",
          description: "Si solo hablas de tareas, no estás desarrollando a nadie.",
          action: "Esta semana, pregúntale a alguien de tu equipo: '¿En qué te gustaría crecer?'",
          targetOutcome: "Conocer las aspiraciones de tu equipo",
          category: 'BEHAVIORAL_CHANGE',
          priority: 'ALTA',
          suggestedResources: [],
          estimatedWeeks: 2
        }],
        development: [{
          title: "Da feedback en el momento",
          description: "El feedback pierde valor con el tiempo. Dalo cuando pasa, no meses después.",
          action: "La próxima vez que veas algo que mejorar, dilo en las siguientes 24 horas",
          targetOutcome: "Feedback oportuno se vuelve hábito",
          category: 'SKILL_DEVELOPMENT',
          priority: 'ALTA',
          suggestedResources: [
            { type: 'PRACTICE', title: "Formato SBI: Situación-Comportamiento-Impacto" }
          ],
          estimatedWeeks: 4
        }],
        strength: [{
          title: "Convierte tu equipo en semillero",
          description: "La mejor señal de un gran líder es que sus empleados son promovidos.",
          action: "Ayuda a uno de tus mejores empleados a conseguir un ascenso o movimiento lateral este semestre.",
          targetOutcome: "Promover a un miembro del equipo fuera de tu área",
          category: 'MENTORING',
          priority: 'ALTA',
          suggestedResources: [],
          estimatedWeeks: 12
        }]
      },
      COLABORADOR: {
        blindSpot: [{
          title: "El desarrollo no es solo responsabilidad de tu jefe",
          description: "Puedes ayudar a crecer a otros aunque no tengas gente a cargo.",
          action: "Ofrécete para enseñar algo que sabes a un compañero que lo necesite",
          targetOutcome: "Practicar habilidades de mentoría",
          category: 'EXPERIENCE_BUILDING',
          priority: 'MEDIA',
          suggestedResources: [],
          estimatedWeeks: 6
        }],
        development: [{
          title: "Aprende a dar feedback constructivo",
          description: "Dar feedback es una habilidad que te servirá siempre, seas jefe o no.",
          action: "Practica dando feedback positivo a un compañero esta semana",
          targetOutcome: "Comodidad al dar feedback",
          category: 'SKILL_DEVELOPMENT',
          priority: 'MEDIA',
          suggestedResources: [],
          estimatedWeeks: 4
        }],
        strength: [{
          title: "Sé el referente técnico",
          description: "Sabes tanto que deberías estar enseñando. No te guardes el conocimiento.",
          action: "Organiza una sesión de 'Almuerzo y Aprendizaje' para enseñar una habilidad técnica a tus pares.",
          targetOutcome: "Compartir conocimiento experto",
          category: 'MENTORING',
          priority: 'MEDIA',
          suggestedResources: [],
          estimatedWeeks: 4
        }]
      }
    },
    coachingTips: {
      blindSpot: [
        "¿Habla de su equipo como 'recursos' o como personas con potencial?",
        "Pregunta: '¿Quién ha crecido gracias a ti?'"
      ],
      development: [
        "Modela cómo dar feedback efectivo.",
        "Asigna un 'pupilo' para que practique."
      ],
      strength: ["Puede liderar programas de mentoría.", "Ideal para onboarding de nuevos."]
    }
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 7. TOMA DE DECISIONES (LEAD-DECISION)
  // ──────────────────────────────────────────────────────────────────────────
  'LEAD-DECISION': {
    code: 'LEAD-DECISION',
    name: 'Toma de Decisiones',
    keywords: ['decision', 'decisiones', 'criterio', 'juicio', 'analisis', 'riesgo'],

    strategies: {
      EJECUTIVO: {
        blindSpot: [{
          title: "¿Tus decisiones consideran perspectivas diversas?",
          description: "Rodearte de gente que piensa igual genera puntos ciegos.",
          action: "Antes de tu próxima decisión importante, pide opinión a alguien que suele pensar diferente",
          targetOutcome: "Decisiones más robustas",
          category: 'BEHAVIORAL_CHANGE',
          priority: 'ALTA',
          suggestedResources: [],
          estimatedWeeks: 4
        }],
        development: [{
          title: "Acelera tus decisiones reversibles",
          description: "No todas las decisiones merecen el mismo análisis. Las reversibles pueden ser rápidas.",
          action: "Clasifica tus próximas decisiones: ¿reversibles o irreversibles? Acelera las primeras.",
          targetOutcome: "Mayor velocidad sin perder calidad",
          category: 'SKILL_DEVELOPMENT',
          priority: 'ALTA',
          suggestedResources: [
            { type: 'PRACTICE', title: "Framework: Decisiones Tipo 1 vs Tipo 2 (Bezos)" }
          ],
          estimatedWeeks: 6
        }],
        strength: [{
          title: "Decide en la incertidumbre",
          description: "Tienes un instinto afilado. Úsalo para desbloquear temas que nadie se atreve a tocar.",
          action: "Pide que te asignen la decisión más compleja o ambigua del trimestre.",
          targetOutcome: "Desbloquear una situación estancada por indecisión",
          category: 'EXPERIENCE_BUILDING',
          priority: 'ALTA',
          suggestedResources: [],
          estimatedWeeks: 4
        }]
      },
      MANAGER: {
        blindSpot: [{
          title: "¿Estás decidiendo cosas que tu equipo podría decidir?",
          description: "Si todo pasa por ti, eres cuello de botella y no desarrollas autonomía.",
          action: "Identifica 3 tipos de decisiones que puedes delegar esta semana",
          targetOutcome: "Tu equipo decide más cosas sin consultarte",
          category: 'BEHAVIORAL_CHANGE',
          priority: 'ALTA',
          suggestedResources: [],
          estimatedWeeks: 4
        }],
        development: [{
          title: "Comunica el 'por qué' de tus decisiones",
          description: "Si tu equipo no entiende tu lógica, no aprende a decidir como tú.",
          action: "La próxima vez que tomes una decisión, explica brevemente tu razonamiento",
          targetOutcome: "Tu equipo entiende cómo piensas",
          category: 'SKILL_DEVELOPMENT',
          priority: 'MEDIA',
          suggestedResources: [],
          estimatedWeeks: 4
        }],
        strength: [{
          title: "Enseña a pensar, no qué hacer",
          description: "Tomas buenas decisiones. Ahora enseña a tu equipo tu proceso mental.",
          action: "Crea una guía simple de 'Criterios para Decidir' para que tu equipo la use cuando no estás.",
          targetOutcome: "Delegar la toma de decisiones operativa",
          category: 'MENTORING',
          priority: 'MEDIA',
          suggestedResources: [],
          estimatedWeeks: 6
        }]
      },
      COLABORADOR: {
        blindSpot: [{
          title: "¿Llevas opciones o solo problemas?",
          description: "Llevar siempre el problema sin propuesta te hace ver dependiente.",
          action: "La próxima vez que tengas un problema, lleva al menos 2 opciones de solución",
          targetOutcome: "Ser visto como alguien que propone, no solo reporta",
          category: 'BEHAVIORAL_CHANGE',
          priority: 'ALTA',
          suggestedResources: [],
          estimatedWeeks: 4
        }],
        development: [{
          title: "Practica decidir en lo pequeño",
          description: "La toma de decisiones se ejercita. Empieza con lo que sí puedes decidir.",
          action: "Identifica algo en tu trabajo que puedes decidir sin consultar, y hazlo",
          targetOutcome: "Mayor autonomía en tu rol",
          category: 'EXPERIENCE_BUILDING',
          priority: 'MEDIA',
          suggestedResources: [],
          estimatedWeeks: 4
        }],
        strength: [{
          title: "Actúa con autonomía",
          description: "Tu criterio es sólido. No necesitas pedir permiso para todo.",
          action: "Identifica un área donde sueles consultar a tu jefe y empieza a decidir solo, informando después.",
          targetOutcome: "Operar con autonomía total en tu rol",
          category: 'EXPERIENCE_BUILDING',
          priority: 'BAJA',
          suggestedResources: [],
          estimatedWeeks: 4
        }]
      }
    },
    coachingTips: {
      blindSpot: [
        "¿Paraliza por análisis o decide impulsivamente?",
        "Pregunta: '¿Cuál fue tu última decisión difícil y cómo la tomaste?'"
      ],
      development: [
        "Dale decisiones pequeñas para practicar.",
        "Revisen juntos decisiones pasadas: qué funcionó, qué no."
      ],
      strength: ["Puede facilitar sesiones de toma de decisiones.", "Buen candidato para proyectos complejos."]
    }
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 8. INNOVACIÓN Y MEJORA CONTINUA (LEAD-INNOV)
  // ──────────────────────────────────────────────────────────────────────────
  'LEAD-INNOV': {
    code: 'LEAD-INNOV',
    name: 'Innovación y Mejora Continua',
    keywords: ['innovacion', 'mejora', 'creatividad', 'ideas', 'procesos', 'optimizar'],

    strategies: {
      EJECUTIVO: {
        blindSpot: [{
          title: "¿Estás matando ideas sin darte cuenta?",
          description: "A veces rechazamos ideas nuevas tan rápido que dejamos de recibirlas.",
          action: "La próxima vez que alguien proponga algo, di 'cuéntame más' antes de evaluar",
          targetOutcome: "Crear espacio para ideas nuevas",
          category: 'BEHAVIORAL_CHANGE',
          priority: 'ALTA',
          suggestedResources: [],
          estimatedWeeks: 4
        }],
        development: [{
          title: "Asigna tiempo para experimentar",
          description: "Sin tiempo protegido, la innovación siempre pierde ante lo urgente.",
          action: "Define un porcentaje de tiempo de tu equipo para explorar mejoras",
          targetOutcome: "Innovación como práctica, no accidente",
          category: 'BEHAVIORAL_CHANGE',
          priority: 'MEDIA',
          suggestedResources: [],
          estimatedWeeks: 8
        }],
        strength: [{
          title: "Patrocina un 'Moonshot'",
          description: "Tienes visión de futuro. Apadrina un proyecto arriesgado pero de alto potencial.",
          action: "Asigna presupuesto y protección política a un proyecto experimental de alto riesgo.",
          targetOutcome: "Lanzar un piloto disruptivo",
          category: 'EXPERIENCE_BUILDING',
          priority: 'MEDIA',
          suggestedResources: [],
          estimatedWeeks: 12
        }]
      },
      MANAGER: {
        blindSpot: [{
          title: "¿Tu equipo propone mejoras o solo ejecuta?",
          description: "Si nadie propone nada, puede que no sientan que es seguro hacerlo.",
          action: "En tu próxima reunión, pregunta: '¿Qué deberíamos dejar de hacer?'",
          targetOutcome: "Abrir espacio para cuestionar lo establecido",
          category: 'BEHAVIORAL_CHANGE',
          priority: 'ALTA',
          suggestedResources: [],
          estimatedWeeks: 4
        }],
        development: [{
          title: "Implementa una mejora sugerida por tu equipo",
          description: "Si las ideas nunca se concretan, la gente deja de proponerlas.",
          action: "Elige una sugerencia de mejora de tu equipo y ejecútala este mes",
          targetOutcome: "Tu equipo ve que sus ideas importan",
          category: 'BEHAVIORAL_CHANGE',
          priority: 'MEDIA',
          suggestedResources: [],
          estimatedWeeks: 4
        }],
        strength: [{
          title: "Facilita la innovación en otros",
          description: "Eres creativo. Usa eso para desbloquear la creatividad de tu equipo.",
          action: "Dirige una sesión de brainstorming o hackathon para resolver un problema crónico del área.",
          targetOutcome: "Generar 3 soluciones implementables",
          category: 'EXPERIENCE_BUILDING',
          priority: 'MEDIA',
          suggestedResources: [],
          estimatedWeeks: 4
        }]
      },
      COLABORADOR: {
        blindSpot: [{
          title: "¿Propones mejoras o solo te quejas?",
          description: "Hay una diferencia entre identificar problemas y proponer soluciones.",
          action: "La próxima vez que veas algo que no funciona, lleva una propuesta de mejora",
          targetOutcome: "Ser visto como alguien que aporta soluciones",
          category: 'BEHAVIORAL_CHANGE',
          priority: 'MEDIA',
          suggestedResources: [],
          estimatedWeeks: 4
        }],
        development: [{
          title: "Mejora algo pequeño de tu proceso",
          description: "No necesitas permiso para optimizar cómo haces tu trabajo.",
          action: "Identifica una tarea repetitiva y busca una forma de hacerla más rápido",
          targetOutcome: "Demostrar mentalidad de mejora continua",
          category: 'SKILL_DEVELOPMENT',
          priority: 'MEDIA',
          suggestedResources: [],
          estimatedWeeks: 4
        }],
        strength: [{
          title: "Lidera una iniciativa de mejora",
          description: "Tienes ideas que valen oro. Haz que sucedan.",
          action: "Escribe una propuesta de una página para un nuevo producto o mejora y preséntala a la gerencia.",
          targetOutcome: "Validar una idea de negocio o mejora",
          category: 'EXPERIENCE_BUILDING',
          priority: 'ALTA',
          suggestedResources: [],
          estimatedWeeks: 6
        }]
      }
    },
    coachingTips: {
      blindSpot: [
        "¿Rechaza ideas nuevas con 'ya lo intentamos' o 'aquí no funciona'?",
        "Observa si defiende el status quo por comodidad."
      ],
      development: [
        "Asigna un proceso para que lo mejore.",
        "Celebra las mejoras, aunque sean pequeñas."
      ],
      strength: ["Ideal para liderar iniciativas de innovación.", "Puede inspirar a otros a proponer."]
    }
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 9. EMPODERAMIENTO (LEAD-EMPOW)
  // ──────────────────────────────────────────────────────────────────────────
  'LEAD-EMPOW': {
    code: 'LEAD-EMPOW',
    name: 'Empoderamiento',
    keywords: ['empoderamiento', 'delegacion', 'autonomia', 'confianza', 'empoderar'],

    strategies: {
      EJECUTIVO: {
        blindSpot: [{
          title: "¿Tu equipo puede actuar sin tu aprobación?",
          description: "Si todo requiere tu visto bueno, no estás empoderando.",
          action: "Define 3 áreas donde tu equipo puede decidir sin consultarte y comunícalo",
          targetOutcome: "Mayor autonomía de tu equipo directo",
          category: 'BEHAVIORAL_CHANGE',
          priority: 'ALTA',
          suggestedResources: [],
          estimatedWeeks: 6
        }],
        development: [{
          title: "Delega un proyecto completo, no solo tareas",
          description: "Empoderar es dar la responsabilidad completa, no micro-tareas.",
          action: "Asigna un proyecto de principio a fin a alguien de tu equipo",
          targetOutcome: "Desarrollar ownership en tu equipo",
          category: 'BEHAVIORAL_CHANGE',
          priority: 'ALTA',
          suggestedResources: [
            { type: 'BOOK', title: "Turn the Ship Around!", provider: "David Marquet" }
          ],
          estimatedWeeks: 8
        }],
        strength: [{
          title: "Aplana la organización",
          description: "Confías en la gente. Ayuda a eliminar burocracia innecesaria.",
          action: "Identifica 3 niveles de aprobación en tu área que puedas eliminar hoy mismo.",
          targetOutcome: "Acelerar la velocidad de ejecución",
          category: 'EXPERIENCE_BUILDING',
          priority: 'ALTA',
          suggestedResources: [],
          estimatedWeeks: 4
        }]
      },
      MANAGER: {
        blindSpot: [{
          title: "¿Confías en tu equipo o verificas todo?",
          description: "Si revisas cada detalle, estás comunicando desconfianza.",
          action: "Elige algo que normalmente revisas y déjalo pasar sin verificar esta semana",
          targetOutcome: "Demostrar confianza con acciones",
          category: 'BEHAVIORAL_CHANGE',
          priority: 'ALTA',
          suggestedResources: [],
          estimatedWeeks: 4
        }],
        development: [{
          title: "Pregunta antes de instruir",
          description: "Empoderar es dejar que piensen, no darles la respuesta.",
          action: "Cuando te pregunten algo, responde: '¿Tú qué harías?' antes de dar tu opinión",
          targetOutcome: "Tu equipo resuelve más solo",
          category: 'SKILL_DEVELOPMENT',
          priority: 'ALTA',
          suggestedResources: [],
          estimatedWeeks: 4
        }],
        strength: [{
          title: "Hazte innecesario",
          description: "Tu equipo vuela solo. El siguiente nivel es que funcionen perfecto sin ti.",
          action: "Delega tu rol completamente a un miembro del equipo durante tus próximas vacaciones.",
          targetOutcome: "Probar la autonomía total del equipo",
          category: 'EXPERIENCE_BUILDING',
          priority: 'MEDIA',
          suggestedResources: [],
          estimatedWeeks: 8
        }]
      },
      COLABORADOR: {
        blindSpot: [{
          title: "¿Esperas instrucciones o tomas iniciativa?",
          description: "El empoderamiento es recíproco. Si esperas que te digan todo, no lo estás aprovechando.",
          action: "Identifica algo que podrías decidir por tu cuenta y hazlo",
          targetOutcome: "Demostrar que puedes manejar más autonomía",
          category: 'BEHAVIORAL_CHANGE',
          priority: 'MEDIA',
          suggestedResources: [],
          estimatedWeeks: 4
        }],
        development: [{
          title: "Pide más responsabilidad",
          description: "Si quieres más empoderamiento, pídelo con una propuesta concreta.",
          action: "Dile a tu jefe: 'Me gustaría hacerme cargo de X. ¿Qué necesitarías ver para confiarme eso?'",
          targetOutcome: "Abrir conversación sobre mayor autonomía",
          category: 'BEHAVIORAL_CHANGE',
          priority: 'MEDIA',
          suggestedResources: [],
          estimatedWeeks: 4
        }],
        strength: [{
          title: "Adueñate del resultado final",
          description: "Actúas como dueño. Pide la responsabilidad completa.",
          action: "Pide ser el 'Owner' oficial de un proceso clave, de principio a fin.",
          targetOutcome: "Liderar sin cargo formal",
          category: 'EXPERIENCE_BUILDING',
          priority: 'MEDIA',
          suggestedResources: [],
          estimatedWeeks: 6
        }]
      }
    },
    coachingTips: {
      blindSpot: [
        "¿Dice que delega pero revisa cada detalle?",
        "Pregunta: '¿Qué pasaría si no estuvieras una semana?'"
      ],
      development: [
        "Ayúdale a soltar control gradualmente.",
        "Muestra ejemplos de delegación efectiva."
      ],
      strength: ["Su equipo probablemente es autónomo.", "Puede enseñar a otros managers."]
    }
  },

  // ──────────────────────────────────────────────────────────────────────────
  // LIDERAZGO DE EQUIPO (LEAD-TEAM)
  // ──────────────────────────────────────────────────────────────────────────
  'LEAD-TEAM': {
    code: 'LEAD-TEAM',
    name: 'Liderazgo de Equipo',
    keywords: ['liderazgo equipo', 'liderar', 'dirigir', 'conducir equipo', 'gestion equipo'],

    strategies: {
      EJECUTIVO: {
        blindSpot: [{
          title: "Revisa si tu estilo de liderazgo inspira o controla",
          description: "Liderar un equipo de alto nivel requiere inspirar, no controlar. Si tu equipo solo ejecuta lo que dices, falta liderazgo real.",
          action: "Pregunta a tu equipo: '¿Qué harían diferente si yo no estuviera una semana?'",
          targetOutcome: "Equipo capaz de funcionar con autonomía",
          category: 'BEHAVIORAL_CHANGE',
          priority: 'ALTA',
          suggestedResources: [],
          estimatedWeeks: 6
        }],
        development: [{
          title: "Crea una visión compartida con tu equipo",
          description: "Un equipo sin visión compartida es un grupo de individuos. Construye el 'para qué' juntos.",
          action: "Facilita una sesión donde el equipo defina sus 3 prioridades y cómo medirán el éxito",
          targetOutcome: "Equipo alineado en propósito y métricas",
          category: 'SKILL_DEVELOPMENT',
          priority: 'ALTA',
          suggestedResources: [],
          estimatedWeeks: 6
        }],
        strength: [{
          title: "Define el ADN de la empresa",
          description: "Lideras con el ejemplo. Ayuda a definir qué significa ser líder aquí.",
          action: "Participa en la inducción de nuevos gerentes para transmitir la cultura de liderazgo.",
          targetOutcome: "Alinear a los nuevos líderes con la cultura",
          category: 'MENTORING',
          priority: 'MEDIA',
          suggestedResources: [],
          estimatedWeeks: 8
        }]
      },
      MANAGER: {
        blindSpot: [{
          title: "¿Tu equipo sabe hacia dónde van?",
          description: "Gestionar tareas no es liderar. Liderar es dar dirección y sentido.",
          action: "En tu próxima reunión, dedica 5 minutos a recordar el objetivo del mes y por qué importa",
          targetOutcome: "Tu equipo conecta sus tareas con un propósito",
          category: 'BEHAVIORAL_CHANGE',
          priority: 'ALTA',
          suggestedResources: [],
          estimatedWeeks: 4
        }],
        development: [{
          title: "Desarrolla rituales de equipo",
          description: "Los equipos fuertes tienen rituales: kick-offs, retros, celebraciones. No son pérdida de tiempo.",
          action: "Implementa una reunión semanal de 15 minutos: logros + aprendizajes + prioridades",
          targetOutcome: "Mayor cohesión y alineación del equipo",
          category: 'SKILL_DEVELOPMENT',
          priority: 'ALTA',
          suggestedResources: [
            { type: 'TEMPLATE', title: "Agenda: Logros → Aprendizajes → Prioridades (15 min)" }
          ],
          estimatedWeeks: 4
        }],
        strength: [{
          title: "Ayuda a un equipo en problemas",
          description: "Tu equipo funciona como reloj. Hay otros equipos que sufren.",
          action: "Ofrécete para diagnosticar y ayudar a un par cuyo equipo tenga baja moral o desempeño.",
          targetOutcome: "Mejorar el clima de un equipo vecino",
          category: 'MENTORING',
          priority: 'ALTA',
          suggestedResources: [],
          estimatedWeeks: 12
        }]
      },
      COLABORADOR: {
        blindSpot: [{
          title: "Lidera desde donde estás",
          description: "No necesitas un título para liderar. Tomar iniciativa y ayudar a otros es liderazgo.",
          action: "Identifica algo que tu equipo necesita y ofrécete para coordinarlo",
          targetOutcome: "Ser reconocido como referente en tu equipo",
          category: 'EXPERIENCE_BUILDING',
          priority: 'MEDIA',
          suggestedResources: [],
          estimatedWeeks: 6
        }],
        development: [{
          title: "Aprende a influir sin autoridad",
          description: "La influencia viene de la credibilidad y el ejemplo, no del cargo.",
          action: "Cuando haya un problema, propone una solución y coordina con tus compañeros para implementarla",
          targetOutcome: "Demostrar capacidad de liderazgo informal",
          category: 'EXPERIENCE_BUILDING',
          priority: 'MEDIA',
          suggestedResources: [],
          estimatedWeeks: 6
        }],
        strength: [{
          title: "Sé el líder informal",
          description: "Tus compañeros te siguen. Usa esa influencia para bien.",
          action: "Organiza una actividad de integración o técnica para el equipo sin que te lo pida el jefe.",
          targetOutcome: "Mejorar la cohesión del grupo",
          category: 'EXPERIENCE_BUILDING',
          priority: 'BAJA',
          suggestedResources: [],
          estimatedWeeks: 4
        }]
      }
    },
    coachingTips: {
      blindSpot: [
        "¿Su equipo lo sigue por convicción o por obligación?",
        "Pregunta: '¿Qué hace que tu equipo confíe en ti?'"
      ],
      development: [
        "Asigna un proyecto donde deba coordinar a otros.",
        "Observa cómo maneja conflictos dentro del equipo."
      ],
      strength: ["Puede mentorear a otros líderes.", "Ideal para liderar equipos cross-funcionales."]
    }
  },

  // ──────────────────────────────────────────────────────────────────────────
  // DELEGACIÓN (LEAD-DELEG)
  // ──────────────────────────────────────────────────────────────────────────
  'LEAD-DELEG': {
    code: 'LEAD-DELEG',
    name: 'Delegación',
    keywords: ['delegacion', 'delegar', 'asignar', 'soltar', 'distribuir'],

    strategies: {
      EJECUTIVO: {
        blindSpot: [{
          title: "¿Tu agenda refleja tu nivel o el de tu equipo?",
          description: "Si estás en reuniones operativas todo el día, estás haciendo el trabajo de otros.",
          action: "Revisa tu agenda de la semana: ¿cuántas reuniones podrían ser lideradas por alguien de tu equipo?",
          targetOutcome: "Liberar al menos 3 horas semanales delegando reuniones",
          category: 'BEHAVIORAL_CHANGE',
          priority: 'ALTA',
          suggestedResources: [
            { type: 'PRACTICE', title: "Auditoría de agenda: ¿Esto lo puedo delegar?" }
          ],
          estimatedWeeks: 4
        }],
        development: [{
          title: "Delega resultados, no tareas",
          description: "Delegar tareas es micromanagement con otro nombre. Delega el resultado esperado y deja que elijan el camino.",
          action: "En tu próxima asignación, di solo qué necesitas lograr y para cuándo, no cómo hacerlo",
          targetOutcome: "Tu equipo desarrolla criterio propio",
          category: 'BEHAVIORAL_CHANGE',
          priority: 'ALTA',
          suggestedResources: [],
          estimatedWeeks: 6
        }],
        strength: [{
          title: "Delega todo lo táctico",
          description: "Eres un maestro delegando. Llévalo al extremo para enfocarte solo en el futuro.",
          action: "Revisa tu agenda y delega el 100% de las reuniones de seguimiento operativo este mes.",
          targetOutcome: "Liberar 20% de tu tiempo para estrategia pura",
          category: 'EXPERIENCE_BUILDING',
          priority: 'MEDIA',
          suggestedResources: [],
          estimatedWeeks: 4
        }]
      },
      MANAGER: {
        blindSpot: [{
          title: "¿Delegas o solo distribuyes tareas?",
          description: "Delegar incluye dar autoridad para decidir, no solo la tarea.",
          action: "Elige una responsabilidad que hoy es tuya y entrégala completa (decisión incluida) a alguien",
          targetOutcome: "Alguien de tu equipo es dueño de algo sin tu supervisión constante",
          category: 'BEHAVIORAL_CHANGE',
          priority: 'ALTA',
          suggestedResources: [],
          estimatedWeeks: 4
        }],
        development: [{
          title: "Establece checkpoints, no supervisión constante",
          description: "Delegar bien = acordar puntos de revisión, no estar encima.",
          action: "Define con tu equipo: 'Te reviso en X fecha, entre medio decides tú'",
          targetOutcome: "Balance entre autonomía y control",
          category: 'SKILL_DEVELOPMENT',
          priority: 'ALTA',
          suggestedResources: [
            { type: 'TEMPLATE', title: "Delegación: Resultado + Deadline + Checkpoint" }
          ],
          estimatedWeeks: 4
        }],
        strength: [{
          title: "Usa la delegación como entrenamiento",
          description: "Delegas bien. Ahora usa la delegación para preparar a tu sucesor.",
          action: "Delega tus tareas más visibles y complejas a tu potencial sucesor.",
          targetOutcome: "Preparar a alguien para tu puesto",
          category: 'MENTORING',
          priority: 'ALTA',
          suggestedResources: [],
          estimatedWeeks: 8
        }]
      },
      COLABORADOR: {
        blindSpot: [{
          title: "¿Pides ayuda o tratas de hacer todo solo?",
          description: "Delegar no es solo para jefes. Coordinar con compañeros también es delegación.",
          action: "Si tienes mucha carga, pide ayuda a un compañero para una tarea específica",
          targetOutcome: "Aprender a distribuir trabajo efectivamente",
          category: 'BEHAVIORAL_CHANGE',
          priority: 'MEDIA',
          suggestedResources: [],
          estimatedWeeks: 4
        }],
        development: [{
          title: "Aprende a priorizar y decir no",
          description: "Si aceptas todo, no puedes delegar nada. Primero aprende qué es tuyo y qué no.",
          action: "Haz una lista de tus tareas. Marca cuáles son solo tuyas y cuáles podría hacer otro",
          targetOutcome: "Claridad sobre qué delegar o redistribuir",
          category: 'SKILL_DEVELOPMENT',
          priority: 'MEDIA',
          suggestedResources: [],
          estimatedWeeks: 4
        }],
        strength: [{
          title: "Coordina el trabajo de otros",
          description: "Sabes organizarte. Ayuda a organizar el trabajo del grupo.",
          action: "Ofrécete para llevar el seguimiento de un proyecto grupal.",
          targetOutcome: "Desarrollar habilidades de gestión",
          category: 'EXPERIENCE_BUILDING',
          priority: 'MEDIA',
          suggestedResources: [],
          estimatedWeeks: 6
        }]
      }
    },
    coachingTips: {
      blindSpot: [
        "¿Revisa todo antes de que salga o confía en su equipo?",
        "Pregunta: '¿Qué pasaría si delegaras esto completamente?'"
      ],
      development: [
        "Empieza delegando algo de bajo riesgo para ganar confianza.",
        "Celebra cuando alguien resuelve algo sin su intervención."
      ],
      strength: ["Su equipo probablemente es muy autónomo.", "Puede enseñar a otros cómo soltar control."]
    }
  },

  // ──────────────────────────────────────────────────────────────────────────
  // FEEDBACK (LEAD-FEEDBACK)
  // ──────────────────────────────────────────────────────────────────────────
  'LEAD-FEEDBACK': {
    code: 'LEAD-FEEDBACK',
    name: 'Feedback Efectivo',
    keywords: ['feedback', 'retroalimentacion', 'reconocimiento', 'correccion', 'conversaciones dificiles'],

    strategies: {
      EJECUTIVO: {
        blindSpot: [{
          title: "¿Tu equipo recibe feedback tuyo o solo por evaluaciones?",
          description: "Si el feedback solo llega en la evaluación anual, ya es tarde para corregir.",
          action: "Esta semana, da feedback específico (positivo o constructivo) a al menos 2 reportes directos",
          targetOutcome: "Feedback como hábito, no como evento",
          category: 'BEHAVIORAL_CHANGE',
          priority: 'ALTA',
          suggestedResources: [],
          estimatedWeeks: 4
        }],
        development: [{
          title: "Crea una cultura de feedback bidireccional",
          description: "Si solo tú das feedback, no estás creando una cultura. También necesitas recibirlo.",
          action: "Al final de tu próxima reunión 1:1, pregunta: '¿Qué podría hacer mejor como tu líder?'",
          targetOutcome: "Feedback fluye en ambas direcciones",
          category: 'BEHAVIORAL_CHANGE',
          priority: 'ALTA',
          suggestedResources: [
            { type: 'BOOK', title: "Radical Candor", provider: "Kim Scott" }
          ],
          estimatedWeeks: 8
        }],
        strength: [{
          title: "Instaura una cultura de franqueza",
          description: "Das feedback duro pero útil. Necesitamos que toda la empresa sea así.",
          action: "En tus reuniones públicas, pide feedback crítico sobre tu gestión frente a todos.",
          targetOutcome: "Modelar que el feedback es seguro y necesario",
          category: 'EXPERIENCE_BUILDING',
          priority: 'ALTA',
          suggestedResources: [],
          estimatedWeeks: 6
        }]
      },
      MANAGER: {
        blindSpot: [{
          title: "¿Das feedback o solo corriges errores?",
          description: "Si solo hablas cuando algo sale mal, tu equipo asocia feedback con castigo.",
          action: "Por cada feedback correctivo, da 2 positivos esta semana. Sé específico en ambos.",
          targetOutcome: "Balance entre reconocimiento y corrección",
          category: 'BEHAVIORAL_CHANGE',
          priority: 'ALTA',
          suggestedResources: [
            { type: 'PRACTICE', title: "Formato SBI: Situación → Comportamiento → Impacto" }
          ],
          estimatedWeeks: 4
        }],
        development: [{
          title: "Practica conversaciones difíciles",
          description: "El feedback más valioso suele ser el más incómodo de dar.",
          action: "Identifica una conversación pendiente que has evitado y agenda un espacio para tenerla",
          targetOutcome: "Comodidad con feedback difícil",
          category: 'SKILL_DEVELOPMENT',
          priority: 'ALTA',
          suggestedResources: [],
          estimatedWeeks: 6
        }],
        strength: [{
          title: "Enseña a tener conversaciones difíciles",
          description: "Manejas bien el conflicto. Muchos managers le huyen.",
          action: "Haz un role-play con un manager junior para prepararlo para una conversación de corrección.",
          targetOutcome: "Aumentar la valentía gerencial de otros",
          category: 'MENTORING',
          priority: 'MEDIA',
          suggestedResources: [],
          estimatedWeeks: 4
        }]
      },
      COLABORADOR: {
        blindSpot: [{
          title: "¿Pides feedback o esperas que llegue?",
          description: "No esperes la evaluación para saber cómo vas. Pide feedback proactivamente.",
          action: "Pregúntale a tu jefe: '¿Qué debería seguir haciendo y qué debería cambiar?'",
          targetOutcome: "Tener claridad sobre tu desempeño en tiempo real",
          category: 'BEHAVIORAL_CHANGE',
          priority: 'MEDIA',
          suggestedResources: [],
          estimatedWeeks: 2
        }],
        development: [{
          title: "Aprende a recibir feedback sin defenderte",
          description: "La reacción natural es justificarse. La reacción productiva es escuchar y agradecer.",
          action: "La próxima vez que recibas feedback, solo di 'gracias' y anota qué hacer diferente",
          targetOutcome: "Recibir feedback como herramienta de crecimiento",
          category: 'BEHAVIORAL_CHANGE',
          priority: 'MEDIA',
          suggestedResources: [],
          estimatedWeeks: 4
        }],
        strength: [{
          title: "Eleva el estándar de tus pares",
          description: "Ves lo que otros no ven. Ayuda a tus compañeros a mejorar.",
          action: "Pide permiso a un compañero para darle feedback constructivo sobre su último trabajo.",
          targetOutcome: "Mejorar la calidad del trabajo del equipo",
          category: 'MENTORING',
          priority: 'BAJA',
          suggestedResources: [],
          estimatedWeeks: 2
        }]
      }
    },
    coachingTips: {
      blindSpot: [
        "¿Da feedback específico o genérico ('buen trabajo')?",
        "Pregunta: '¿Cuándo fue la última vez que reconociste algo específico?'"
      ],
      development: [
        "Practica el formato SBI juntos.",
        "Roleplay: simula una conversación de feedback difícil."
      ],
      strength: ["Puede capacitar a otros en técnicas de feedback.", "Ideal para ser coach interno."]
    }
  },

  // ══════════════════════════════════════════════════════════════════════════
  // STRATEGIC - 3 COMPETENCIAS (Solo Ejecutivos)
  // ══════════════════════════════════════════════════════════════════════════

  // ──────────────────────────────────────────────────────────────────────────
  // 10. VISIÓN ESTRATÉGICA (STRAT-VISION)
  // ──────────────────────────────────────────────────────────────────────────
  'STRAT-VISION': {
    code: 'STRAT-VISION',
    name: 'Visión Estratégica',
    keywords: ['vision', 'estrategia', 'futuro', 'largo plazo', 'direccion'],

    strategies: {
      EJECUTIVO: {
        blindSpot: [{
          title: "¿Tu equipo conoce tu visión?",
          description: "Tener visión no sirve si nadie más la conoce.",
          action: "Pregunta a 3 personas: '¿Hacia dónde vamos como área?' Si las respuestas varían mucho, hay trabajo por hacer.",
          targetOutcome: "Alineación de tu equipo con la visión",
          category: 'BEHAVIORAL_CHANGE',
          priority: 'ALTA',
          suggestedResources: [],
          estimatedWeeks: 4
        }],
        development: [{
          title: "Dedica tiempo a pensar en el futuro",
          description: "Si el día a día te consume, no hay espacio para la estrategia.",
          action: "Bloquea 2 horas semanales en tu agenda solo para pensar, sin reuniones ni emails",
          targetOutcome: "Espacio protegido para pensamiento estratégico",
          category: 'BEHAVIORAL_CHANGE',
          priority: 'ALTA',
          suggestedResources: [],
          estimatedWeeks: 6
        }],
        strength: [{
          title: "Comparte la visión externamente",
          description: "Tienes una visión clara del futuro. Posiciónate como referente.",
          action: "Escribe un artículo o da una charla sobre el futuro de la industria en un evento externo.",
          targetOutcome: "Posicionar a la empresa como líder de pensamiento",
          category: 'EXPERIENCE_BUILDING',
          priority: 'MEDIA',
          suggestedResources: [],
          estimatedWeeks: 8
        }]
      },
      MANAGER: {
        blindSpot: [{
          title: "¿Conectas tu trabajo con la estrategia mayor?",
          description: "Si solo ves tu área, pierdes la perspectiva del negocio.",
          action: "Pregunta a tu jefe: '¿Cómo contribuye mi área a la estrategia de la empresa?'",
          targetOutcome: "Claridad de cómo encaja tu trabajo en el todo",
          category: 'KNOWLEDGE_ACQUISITION',
          priority: 'MEDIA',
          suggestedResources: [],
          estimatedWeeks: 4
        }],
        development: [{
          title: "Mira más allá de tu área",
          description: "La visión estratégica requiere entender el contexto completo.",
          action: "Agenda un café con alguien de otra área para entender qué hacen y cómo se conecta contigo",
          targetOutcome: "Visión más amplia del negocio",
          category: 'EXPERIENCE_BUILDING',
          priority: 'MEDIA',
          suggestedResources: [],
          estimatedWeeks: 6
        }],
        strength: [{
          title: "Conecta la tarea con la misión",
          description: "Entiendes el negocio. Ayuda a que los operativos entiendan el 'por qué'.",
          action: "Crea una presentación simple que explique la estrategia anual y preséntala a niveles operativos.",
          targetOutcome: "Alineación total desde la base hasta la cima",
          category: 'EXPERIENCE_BUILDING',
          priority: 'MEDIA',
          suggestedResources: [],
          estimatedWeeks: 4
        }]
      },
      COLABORADOR: {
        blindSpot: [{
          title: "¿Sabes cómo tu trabajo impacta el objetivo mayor?",
          description: "Es difícil priorizar si no ves el panorama completo.",
          action: "Pregunta a tu jefe cómo tu trabajo contribuye a los objetivos del área",
          targetOutcome: "Entender tu impacto en la estrategia",
          category: 'KNOWLEDGE_ACQUISITION',
          priority: 'MEDIA',
          suggestedResources: [],
          estimatedWeeks: 2
        }],
        development: [{
          title: "Interésate por el negocio, no solo tu tarea",
          description: "Entender el contexto te hace más valioso.",
          action: "Lee las comunicaciones de la empresa sobre estrategia y resultados",
          targetOutcome: "Mayor conocimiento del negocio",
          category: 'KNOWLEDGE_ACQUISITION',
          priority: 'BAJA',
          suggestedResources: [],
          estimatedWeeks: 4
        }],
        strength: [{
          title: "Ayuda a conectar los puntos",
          description: "Ves más allá de tu tarea. Ayuda a otros a ver el impacto global.",
          action: "Cuando haya un problema complejo, dibuja el flujo completo y explícalo al equipo.",
          targetOutcome: "Evitar soluciones parche que rompen otras cosas",
          category: 'SKILL_DEVELOPMENT',
          priority: 'BAJA',
          suggestedResources: [],
          estimatedWeeks: 4
        }]
      }
    },
    coachingTips: {
      blindSpot: [
        "¿Habla solo de tareas o también de hacia dónde va?",
        "Pregunta: '¿Cómo se ve el éxito en 3 años?'"
      ],
      development: [
        "Exponlo a discusiones estratégicas.",
        "Asigna proyectos que requieran pensar en el futuro."
      ],
      strength: ["Puede facilitar sesiones de estrategia.", "Ideal para comunicar el rumbo."]
    }
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 11. GESTIÓN DEL CAMBIO (STRAT-CHANGE)
  // ──────────────────────────────────────────────────────────────────────────
  'STRAT-CHANGE': {
    code: 'STRAT-CHANGE',
    name: 'Gestión del Cambio',
    keywords: ['cambio', 'transformacion', 'transicion', 'resistencia', 'adopcion'],

    strategies: {
      EJECUTIVO: {
        blindSpot: [{
          title: "¿Comunicas el 'por qué' del cambio?",
          description: "Sin el 'por qué', la gente resiste. Con el 'por qué', la gente colabora.",
          action: "En tu próximo cambio, dedica el doble de tiempo a explicar el por qué que al qué",
          targetOutcome: "Menor resistencia a tus iniciativas",
          category: 'BEHAVIORAL_CHANGE',
          priority: 'ALTA',
          suggestedResources: [
            { type: 'BOOK', title: "Start with Why", provider: "Simon Sinek" }
          ],
          estimatedWeeks: 6
        }],
        development: [{
          title: "Involucra a los afectados antes de decidir",
          description: "La gente apoya lo que ayuda a crear.",
          action: "Antes de tu próximo cambio importante, consulta a quienes se verán afectados",
          targetOutcome: "Cambios con mayor adopción",
          category: 'BEHAVIORAL_CHANGE',
          priority: 'ALTA',
          suggestedResources: [],
          estimatedWeeks: 8
        }],
        strength: [{
          title: "Lidera la transformación crítica",
          description: "Manejas el cambio con maestría. Toma el proyecto más difícil.",
          action: "Lidera el comité de gestión de cambio para la transformación más crítica del año.",
          targetOutcome: "Ejecutar un cambio complejo sin perder talento",
          category: 'EXPERIENCE_BUILDING',
          priority: 'ALTA',
          suggestedResources: [],
          estimatedWeeks: 12
        }]
      },
      MANAGER: {
        blindSpot: [{
          title: "¿Proteges a tu equipo del cambio o los ayudas a navegarlo?",
          description: "Proteger del cambio no es sostenible. Equiparlos para manejarlo sí lo es.",
          action: "Cuando venga un cambio, en vez de absorberlo solo, prepara a tu equipo para entenderlo",
          targetOutcome: "Equipo más resiliente ante cambios",
          category: 'BEHAVIORAL_CHANGE',
          priority: 'ALTA',
          suggestedResources: [],
          estimatedWeeks: 6
        }],
        development: [{
          title: "Identifica a los resistentes y entiéndelos",
          description: "La resistencia tiene razones. Entenderlas es el primer paso para manejarlas.",
          action: "Habla 1:1 con quien más resista el cambio y pregunta qué le preocupa",
          targetOutcome: "Convertir resistentes en aliados",
          category: 'SKILL_DEVELOPMENT',
          priority: 'MEDIA',
          suggestedResources: [],
          estimatedWeeks: 4
        }],
        strength: [{
          title: "Mantén la moral alta en la tormenta",
          description: "Tu equipo no entra en pánico. Ayuda a otros equipos a mantener la calma.",
          action: "Comparte tus técnicas de gestión de crisis con otros líderes que estén sufriendo.",
          targetOutcome: "Estabilizar el clima laboral en momentos duros",
          category: 'MENTORING',
          priority: 'MEDIA',
          suggestedResources: [],
          estimatedWeeks: 6
        }]
      },
      COLABORADOR: {
        blindSpot: [{
          title: "¿Cómo reaccionas cuando cambian las cosas?",
          description: "Tu primera reacción al cambio dice mucho de ti.",
          action: "La próxima vez que anuncien un cambio, espera antes de quejarte y pregunta: '¿Qué oportunidad hay aquí?'",
          targetOutcome: "Reacción más constructiva ante cambios",
          category: 'BEHAVIORAL_CHANGE',
          priority: 'MEDIA',
          suggestedResources: [],
          estimatedWeeks: 4
        }],
        development: [{
          title: "Sé de los primeros en adoptar",
          description: "Los early adopters son más visibles y valiosos en procesos de cambio.",
          action: "En el próximo cambio, ofrécete como piloto o usuario temprano",
          targetOutcome: "Ser visto como alguien que facilita el cambio",
          category: 'EXPERIENCE_BUILDING',
          priority: 'MEDIA',
          suggestedResources: [],
          estimatedWeeks: 6
        }],
        strength: [{
          title: "Sé el primero en la fila",
          description: "Te adaptas rápido. Muestra a los demás que el cambio no muerde.",
          action: "Sé el usuario experto del nuevo sistema y ofrece soporte a tus compañeros.",
          targetOutcome: "Reducir la curva de aprendizaje del equipo",
          category: 'MENTORING',
          priority: 'BAJA',
          suggestedResources: [],
          estimatedWeeks: 4
        }]
      }
    },
    coachingTips: {
      blindSpot: [
        "¿Impone cambios o los facilita?",
        "Pregunta: '¿Cómo manejaste la resistencia en tu último cambio?'"
      ],
      development: [
        "Asigna un cambio pequeño para que practique.",
        "Revisen juntos qué funcionó y qué no."
      ],
      strength: ["Ideal para liderar transformaciones.", "Puede enseñar a otros managers."]
    }
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 12. INFLUENCIA ORGANIZACIONAL (STRAT-INFLUENCE)
  // ──────────────────────────────────────────────────────────────────────────
  'STRAT-INFLUENCE': {
    code: 'STRAT-INFLUENCE',
    name: 'Influencia Organizacional',
    keywords: ['influencia', 'politica', 'stakeholders', 'persuasion', 'alianzas'],

    strategies: {
      EJECUTIVO: {
        blindSpot: [{
          title: "¿Tienes aliados fuera de tu área?",
          description: "Si solo tienes poder en tu área, tu influencia es limitada.",
          action: "Identifica 2 pares de otras áreas con quienes deberías tener mejor relación y agenda un café",
          targetOutcome: "Ampliar tu red de influencia",
          category: 'BEHAVIORAL_CHANGE',
          priority: 'ALTA',
          suggestedResources: [],
          estimatedWeeks: 6
        }],
        development: [{
          title: "Entiende las prioridades de otros",
          description: "Para influir, primero hay que entender qué le importa al otro.",
          action: "Antes de pedir apoyo para algo, pregunta: '¿Qué necesitas tú?' y busca cómo ayudar primero",
          targetOutcome: "Relaciones de reciprocidad",
          category: 'SKILL_DEVELOPMENT',
          priority: 'ALTA',
          suggestedResources: [
            { type: 'BOOK', title: "Influence Without Authority", provider: "Cohen & Bradford" }
          ],
          estimatedWeeks: 8
        }],
        strength: [{
          title: "Construye alianzas estratégicas",
          description: "Tienes capital político. Úsalo para abrir puertas externas.",
          action: "Establece una alianza con una empresa partner o gobierno que beneficie al negocio.",
          targetOutcome: "Generar una ventaja competitiva externa",
          category: 'EXPERIENCE_BUILDING',
          priority: 'ALTA',
          suggestedResources: [],
          estimatedWeeks: 12
        }]
      },
      MANAGER: {
        blindSpot: [{
          title: "¿Dependes solo de tu jefe para conseguir cosas?",
          description: "Si tu única vía es escalar, tu capacidad de acción es limitada.",
          action: "Identifica algo que necesitas de otra área y consíguelo directamente, sin escalar",
          targetOutcome: "Resolver cosas lateralmente",
          category: 'BEHAVIORAL_CHANGE',
          priority: 'MEDIA',
          suggestedResources: [],
          estimatedWeeks: 6
        }],
        development: [{
          title: "Construye relaciones antes de necesitarlas",
          description: "La influencia se construye con el tiempo, no en el momento que la necesitas.",
          action: "Agenda un café con alguien de otra área con quien podrías colaborar en el futuro",
          targetOutcome: "Red de contactos más amplia",
          category: 'EXPERIENCE_BUILDING',
          priority: 'MEDIA',
          suggestedResources: [],
          estimatedWeeks: 8
        }],
        strength: [{
          title: "Desbloquea recursos escasos",
          description: "Sabes negociar. Consigue lo que tu equipo necesita.",
          action: "Negocia con otra área para compartir recursos o presupuesto en un proyecto común.",
          targetOutcome: "Optimizar recursos de la compañía",
          category: 'EXPERIENCE_BUILDING',
          priority: 'MEDIA',
          suggestedResources: [],
          estimatedWeeks: 6
        }]
      },
      COLABORADOR: {
        blindSpot: [{
          title: "¿Conoces gente fuera de tu equipo inmediato?",
          description: "Tu red de contactos afecta tu capacidad de hacer cosas.",
          action: "Preséntate a alguien de otra área con quien tu trabajo se relaciona",
          targetOutcome: "Ampliar tu red dentro de la empresa",
          category: 'BEHAVIORAL_CHANGE',
          priority: 'BAJA',
          suggestedResources: [],
          estimatedWeeks: 6
        }],
        development: [{
          title: "Aprende a pedir ayuda efectivamente",
          description: "Pedir ayuda es una habilidad. Hazlo fácil para el otro.",
          action: "La próxima vez que necesites algo, sé específico: qué necesitas, para cuándo, y cómo impacta",
          targetOutcome: "Mayor efectividad al pedir colaboración",
          category: 'SKILL_DEVELOPMENT',
          priority: 'MEDIA',
          suggestedResources: [],
          estimatedWeeks: 4
        }],
        strength: [{
          title: "Conecta personas clave",
          description: "Conoces a todos. Haz que la gente correcta se hable.",
          action: "Presenta a dos personas de distintas áreas que podrían beneficiarse de conocerse.",
          targetOutcome: "Fomentar la colaboración informal",
          category: 'EXPERIENCE_BUILDING',
          priority: 'BAJA',
          suggestedResources: [],
          estimatedWeeks: 2
        }]
      }
    },
    coachingTips: {
      blindSpot: [
        "¿Tiene buenas relaciones fuera de su área?",
        "Pregunta: '¿Quién te apoyaría si necesitaras algo de otra área?'"
      ],
      development: [
        "Asigna proyectos que requieran coordinación lateral.",
        "Modela cómo construir alianzas."
      ],
      strength: ["Es un conector natural.", "Ideal para proyectos cross-funcionales."]
    }
  }
}

// ──────────────────────────────────────────────────────────────────────────
// TEMPLATE GENÉRICO (Fallback cuando no hay match)
// ──────────────────────────────────────────────────────────────────────────
export const GENERIC_COMPETENCY_TEMPLATE: CompetencyTemplate = {
  code: 'GENERIC',
  name: 'Competencia General',
  keywords: [],

  strategies: {
    EJECUTIVO: {
      blindSpot: [{
        title: "Busca perspectivas diferentes a la tuya",
        description: "Hay una diferencia entre cómo te evalúas y cómo te ven. Esa información es valiosa.",
        action: "Pide a 2 personas de confianza feedback específico sobre esta competencia",
        targetOutcome: "Entender la brecha de percepción",
        category: 'BEHAVIORAL_CHANGE',
        priority: 'ALTA',
        suggestedResources: [],
        estimatedWeeks: 4
      }],
      development: [{
        title: "Define una práctica semanal",
        description: "Las competencias se desarrollan con práctica deliberada, no con buenas intenciones.",
        action: "Elige una acción pequeña relacionada con esta competencia y hazla cada semana",
        targetOutcome: "Crear un hábito de mejora",
        category: 'SKILL_DEVELOPMENT',
        priority: 'MEDIA',
        suggestedResources: [],
        estimatedWeeks: 8
      }],
      strength: [{
        title: "Comparte tu maestría",
        description: "Eres un referente en esta competencia. Eleva el estándar de la organización.",
        action: "Prepara una Masterclass o documento de visión sobre este tema para la empresa.",
        targetOutcome: "Difundir conocimiento experto",
        category: 'MENTORING',
        priority: 'MEDIA',
        suggestedResources: [],
        estimatedWeeks: 6
      }]
    },
    MANAGER: {
      blindSpot: [{
        title: "Pide feedback a tu equipo",
        description: "Tu equipo ve cosas que tu jefe no ve. Esa perspectiva completa el cuadro.",
        action: "Pregunta a 2 personas de tu equipo cómo perciben esta competencia en ti",
        targetOutcome: "Obtener una visión más completa",
        category: 'BEHAVIORAL_CHANGE',
        priority: 'ALTA',
        suggestedResources: [],
        estimatedWeeks: 4
      }],
      development: [{
        title: "Observa a alguien que lo haga bien",
        description: "A veces la mejor forma de aprender es observar. Identifica a alguien que destaque en esto.",
        action: "Pide permiso para observar cómo maneja situaciones relacionadas con esta competencia",
        targetOutcome: "Aprender de un modelo a seguir",
        category: 'KNOWLEDGE_ACQUISITION',
        priority: 'MEDIA',
        suggestedResources: [],
        estimatedWeeks: 6
      }],
      strength: [{
        title: "Documenta la mejor práctica",
        description: "Lo haces mejor que nadie. Asegúrate de que no se pierda si te vas.",
        action: "Crea un playbook o guía de 'Cómo hacerlo bien' para futuros líderes.",
        targetOutcome: "Estandarizar la excelencia",
        category: 'SKILL_DEVELOPMENT',
        priority: 'MEDIA',
        suggestedResources: [],
        estimatedWeeks: 4
      }]
    },
    COLABORADOR: {
      blindSpot: [{
        title: "Entiende cómo te perciben",
        description: "Hay una diferencia entre tu autoevaluación y la de tu jefatura. Vale la pena explorarla.",
        action: "Pregunta a tu jefe o a un compañero: '¿Cómo me ves en esta área?'",
        targetOutcome: "Identificar la brecha de percepción",
        category: 'BEHAVIORAL_CHANGE',
        priority: 'MEDIA',
        suggestedResources: [],
        estimatedWeeks: 2
      }],
      development: [{
        title: "Practica en situaciones de bajo riesgo",
        description: "Las competencias se desarrollan practicando. Busca oportunidades pequeñas para ejercitar.",
        action: "Identifica una situación esta semana donde puedas practicar esta competencia",
        targetOutcome: "Ganar confianza gradualmente",
        category: 'EXPERIENCE_BUILDING',
        priority: 'MEDIA',
        suggestedResources: [],
        estimatedWeeks: 6
      }],
      strength: [{
        title: "Ayuda a un compañero",
        description: "Tienes talento de sobra en esto. Úsalo para ayudar a alguien que le cuesta.",
        action: "Identifica a un colega con dificultades en esta área y ofrécele apoyo puntual.",
        targetOutcome: "Elevar el nivel del equipo",
        category: 'MENTORING',
        priority: 'BAJA',
        suggestedResources: [],
        estimatedWeeks: 4
      }]
    }
  },

  coachingTips: {
    blindSpot: ["Usa ejemplos concretos, no opiniones generales."],
    development: ["Enfócate en prácticas, no en teoría."],
    strength: ["Busca oportunidades para que enseñe a otros."]
  }
}
