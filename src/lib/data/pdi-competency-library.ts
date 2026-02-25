import { CompetencyTemplate } from '@/lib/types/pdi-suggestion'

// ════════════════════════════════════════════════════════════════════════════
// BIBLIOTECA DE COMPETENCIAS PARA PDI v2.0
// 12 Competencias del Template FocalizaHR Estándar
// Sugerencias adaptadas por performanceTrack
// Tono: Simple y directo para TODOS
// 
// CAMBIOS v2.0:
// - Descripciones expandidas (1 párrafo en lugar de 1 línea)
// - Campo scientificBasis agregado (opcional)
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
          description: "Tu autoevaluación es más alta que la de tu jefatura. Puede haber una brecha entre lo que crees comunicar y lo que realmente llega. A este nivel, cada palabra tiene peso y las interpretaciones se multiplican. Lo que para ti es claro, para otros puede ser ambiguo. Y cuando el mensaje no llega bien, las decisiones se retrasan, los equipos se desalinean y tú terminas repitiendo lo mismo en 5 reuniones diferentes.",
          action: "Después de tu próxima presentación, pregunta a 2 personas: '¿Qué entendiste que hay que hacer?'",
          targetOutcome: "Obtener feedback directo de al menos 3 stakeholders",
          category: 'BEHAVIORAL_CHANGE',
          priority: 'ALTA',
          suggestedResources: [
            { type: 'PRACTICE', title: "Técnica del 'Mirror Back': pide que te repitan el mensaje" }
          ],
          estimatedWeeks: 4,
          scientificBasis: {
            summary: "Ilusión de transparencia → Brecha de comunicación",
            source: "Keysar & Henly (2002) - Journal of Experimental Psychology",
            insight: "Los líderes sobreestiman en 40% cuánto entienden los demás su mensaje"
          }
        }],
        development: [{
          title: "Simplifica tu mensaje estratégico",
          description: "Los mejores líderes explican cosas complejas de forma simple. Si tu equipo no puede repetir tu estrategia en 30 segundos, es demasiado compleja. La complejidad no te hace ver más inteligente, te hace menos efectivo. Cada capa de complejidad que agregas es una oportunidad para que el mensaje se pierda. Tu trabajo no es impresionar con la profundidad de tu análisis, es lograr que la gente actúe.",
          action: "Reescribe tu próxima comunicación importante usando máximo 3 ideas principales",
          targetOutcome: "Tu equipo directo puede explicar la estrategia sin ayuda",
          category: 'SKILL_DEVELOPMENT',
          priority: 'ALTA',
          suggestedResources: [
            { type: 'BOOK', title: "Made to Stick", provider: "Chip & Dan Heath" }
          ],
          estimatedWeeks: 6,
          scientificBasis: {
            summary: "Simplicidad → Retención → Acción",
            source: "Heath & Heath (2007) - Made to Stick Research",
            insight: "Los mensajes simples tienen 6x más probabilidad de ser recordados y actuados"
          }
        }],
        strength: [{
          title: "Lidera comunicaciones críticas de la organización",
          description: "Tu fortaleza en comunicación puede tener más impacto si la usas en momentos clave. Cuando hay crisis, cambios difíciles o anuncios sensibles, la organización necesita a alguien que pueda transmitir el mensaje con claridad y credibilidad. Ese puedes ser tú. No esperes a que te lo pidan, ofrécete para los momentos donde la comunicación importa más.",
          action: "Ofrécete para liderar la próxima comunicación difícil o cambio organizacional importante",
          targetOutcome: "Ser el referente de comunicación ejecutiva en la organización",
          category: 'EXPERIENCE_BUILDING',
          priority: 'MEDIA',
          suggestedResources: [
            { type: 'PRACTICE', title: "Comunicación en crisis: preparar mensajes para escenarios difíciles" }
          ],
          estimatedWeeks: 8,
          scientificBasis: {
            summary: "Fortaleza → Impacto organizacional",
            source: "Gallup StrengthsFinder Research (2001-2020)",
            insight: "Usar fortalezas en momentos críticos multiplica 3x el impacto percibido"
          }
        }]
      },
      MANAGER: {
        blindSpot: [{
          title: "Revisa si tu equipo te entiende",
          description: "Hay una diferencia entre cómo te evalúas y cómo te ve tu jefatura. Puede que el mensaje no esté llegando como crees. Es común pensar que porque dijiste algo, el otro lo entendió. Pero tu equipo no vive en tu cabeza. Lo que para ti es obvio, para ellos puede ser confuso. Y cuando no entienden, no preguntan, solo hacen lo que creen que dijiste.",
          action: "Al dar una instrucción, pide que te la repitan con sus palabras. Si hay diferencias, ahí está la brecha.",
          targetOutcome: "Reducir malentendidos en instrucciones del día a día",
          category: 'BEHAVIORAL_CHANGE',
          priority: 'ALTA',
          suggestedResources: [
            { type: 'PRACTICE', title: "Técnica de parafraseo: '¿Me puedes explicar qué entendiste?'" }
          ],
          estimatedWeeks: 4,
          scientificBasis: {
            summary: "Verificación activa → Menos errores",
            source: "Grice's Maxims of Communication (1975)",
            insight: "La verificación reduce errores de ejecución en 35%"
          }
        }],
        development: [{
          title: "Estructura tus reuniones de equipo",
          description: "Una reunión sin estructura clara genera confusión. La gente sale sin saber qué se decidió, quién hace qué, ni para cuándo. Después todos tienen versiones diferentes de lo que pasó. El problema no es que tu equipo no preste atención, es que no hay un cierre claro. Los últimos 2 minutos de cada reunión son los más importantes y casi nadie los usa bien.",
          action: "Usa los últimos 2 minutos de cada reunión para que alguien resuma los acuerdos",
          targetOutcome: "Tu equipo sale de las reuniones sabiendo exactamente qué hacer",
          category: 'SKILL_DEVELOPMENT',
          priority: 'ALTA',
          suggestedResources: [
            { type: 'TEMPLATE', title: "Minuta: Decisiones + Responsables + Fechas" }
          ],
          estimatedWeeks: 4,
          scientificBasis: {
            summary: "Cierre estructurado → Claridad de acción",
            source: "Allen (2001) - Getting Things Done Methodology",
            insight: "Reuniones con cierre claro tienen 50% más seguimiento de acuerdos"
          }
        }],
        strength: [{
          title: "Entrena a otros managers en comunicación",
          description: "Si esto es tu fortaleza, compártela. Otros managers pueden estar luchando con lo que a ti te sale natural. No necesitas dar un curso formal, a veces basta con compartir cómo manejas situaciones específicas. Cuando elevas a otros, no solo ayudas a la organización, te posicionas como un líder que multiplica capacidades.",
          action: "Ofrece hacer una sesión corta sobre cómo comunicas con tu equipo",
          targetOutcome: "Aportar al desarrollo de otros líderes",
          category: 'MENTORING',
          priority: 'BAJA',
          suggestedResources: [],
          estimatedWeeks: 6,
          scientificBasis: {
            summary: "Enseñar → Consolidar maestría",
            source: "Protégé Effect (Chase et al., 2009)",
            insight: "Enseñar a otros consolida el dominio propio en 25%"
          }
        }]
      },
      COLABORADOR: {
        blindSpot: [{
          title: "Entiende cómo te perciben al comunicar",
          description: "Hay una diferencia entre tu autoevaluación y la de tu jefatura. Puede que creas que te expresas bien, pero otros perciben algo distinto. No es que estés mal, es que hay algo que no estás viendo. A veces hablamos mucho y decimos poco, o creemos ser claros cuando en realidad somos confusos. La única forma de saberlo es preguntando, y escuchando sin defenderte.",
          action: "Pregúntale a un compañero de confianza: '¿Soy claro cuando explico algo?' Escucha sin defenderte.",
          targetOutcome: "Identificar un área específica de mejora",
          category: 'BEHAVIORAL_CHANGE',
          priority: 'ALTA',
          suggestedResources: [
            { type: 'PRACTICE', title: "Pedir feedback específico, no general" }
          ],
          estimatedWeeks: 2,
          scientificBasis: {
            summary: "Autoconocimiento → Mejora dirigida",
            source: "Dunning-Kruger Effect Research (1999)",
            insight: "El feedback externo corrige sesgos de autoevaluación en 60%"
          }
        }],
        development: [{
          title: "Prepara tus ideas antes de hablar",
          description: "Cuando improvisamos, el mensaje puede perderse. Tomarte 1 minuto para ordenar ideas hace la diferencia. No se trata de memorizar un guión, sino de tener claro qué quieres decir antes de abrir la boca. Los que parecen comunicar naturalmente bien, en realidad preparan más de lo que crees. La claridad no es un don, es una disciplina.",
          action: "Antes de tu próxima reunión importante, escribe 3 puntos que quieres decir",
          targetOutcome: "Sentirte más seguro al expresar tus ideas",
          category: 'SKILL_DEVELOPMENT',
          priority: 'MEDIA',
          suggestedResources: [
            { type: 'TEMPLATE', title: "Formato: Situación → Propuesta → Beneficio" }
          ],
          estimatedWeeks: 4,
          scientificBasis: {
            summary: "Preparación → Confianza → Claridad",
            source: "Cognitive Load Theory (Sweller, 1988)",
            insight: "Preparar reduce carga cognitiva y mejora articulación en 40%"
          }
        }],
        strength: [{
          title: "Ayuda a comunicar en tu equipo",
          description: "Si comunicas bien, puedes ayudar cuando hay que explicar algo al grupo. No necesitas un cargo formal para aportar. Cuando alguien tiene que dar una mala noticia, explicar un proceso nuevo o presentar una idea, puedes ser el que ayuda a estructurar el mensaje. Eso te hace valioso más allá de tu rol.",
          action: "Ofrécete para explicar un proceso o novedad a tus compañeros",
          targetOutcome: "Ser referente de comunicación en tu equipo",
          category: 'EXPERIENCE_BUILDING',
          priority: 'BAJA',
          suggestedResources: [],
          estimatedWeeks: 4,
          scientificBasis: {
            summary: "Contribución visible → Reconocimiento",
            source: "Social Exchange Theory (Blau, 1964)",
            insight: "Aportar en áreas de fortaleza aumenta capital social en el equipo"
          }
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
          description: "A veces, sin querer, nuestro estilo de trabajo dificulta que otros colaboren con nosotros. Puede ser que tomes decisiones muy rápido sin consultar, que cambies prioridades sin avisar, o que tu agenda sea tan apretada que nadie puede acceder a ti. Tu equipo no te lo va a decir directamente, pero lo sienten. Y cuando sienten que no pueden colaborar contigo, dejan de intentarlo.",
          action: "Pregunta a un par: '¿Qué podría hacer para que sea más fácil trabajar conmigo?'",
          targetOutcome: "Identificar un comportamiento específico a ajustar",
          category: 'BEHAVIORAL_CHANGE',
          priority: 'ALTA',
          suggestedResources: [],
          estimatedWeeks: 4,
          scientificBasis: {
            summary: "Accesibilidad del líder → Colaboración del equipo",
            source: "Edmondson (1999) - Psychological Safety Research",
            insight: "Líderes accesibles tienen equipos con 40% más colaboración espontánea"
          }
        }],
        development: [{
          title: "Modela la colaboración que esperas",
          description: "Tu equipo copia lo que haces, no lo que dices. Si quieres que colaboren entre ellos, tienen que verte colaborar con otros. Si siempre trabajas solo, resuelves todo tú, o no pides ayuda nunca, estás enviando un mensaje claro: aquí cada uno por su lado. La colaboración empieza por el ejemplo que das.",
          action: "En tu próximo proyecto importante, involucra visiblemente a alguien de otra área",
          targetOutcome: "Que tu equipo te vea colaborar con otros",
          category: 'BEHAVIORAL_CHANGE',
          priority: 'ALTA',
          suggestedResources: [],
          estimatedWeeks: 6,
          scientificBasis: {
            summary: "Modelamiento → Norma de equipo",
            source: "Bandura (1977) - Social Learning Theory",
            insight: "Comportamientos modelados por líderes se replican 3x más rápido"
          }
        }],
        strength: [{
          title: "Institucionaliza la colaboración",
          description: "Si la colaboración te sale natural, ayuda a que sea parte de cómo funciona la organización. No dependa de tu presencia ni de buena voluntad. Crea estructuras, rituales o procesos que obliguen a la gente a colaborar incluso cuando no tienen ganas. Eso es lo que separa a los buenos ejecutivos de los excelentes.",
          action: "Diseña un proceso o ritual que fuerce colaboración entre áreas que hoy no se hablan",
          targetOutcome: "Colaboración que funcione aunque tú no estés",
          category: 'EXPERIENCE_BUILDING',
          priority: 'MEDIA',
          suggestedResources: [],
          estimatedWeeks: 8,
          scientificBasis: {
            summary: "Estructura → Sostenibilidad",
            source: "Hackman (2002) - Leading Teams Research",
            insight: "La colaboración estructurada persiste 5x más que la espontánea"
          }
        }]
      },
      MANAGER: {
        blindSpot: [{
          title: "¿Tu equipo colabora o solo coexiste?",
          description: "Hay equipos que trabajan juntos y equipos que solo comparten oficina. Puede que creas que tu equipo colabora bien, pero si cada uno hace lo suyo sin ayudar al otro, no es un equipo, es un grupo de individuos. El indicador más claro: cuando alguien tiene un problema, ¿los demás se ofrecen a ayudar o miran para otro lado?",
          action: "Observa esta semana: cuando alguien tiene un problema, ¿quién se ofrece a ayudar?",
          targetOutcome: "Diagnóstico real del nivel de colaboración",
          category: 'BEHAVIORAL_CHANGE',
          priority: 'ALTA',
          suggestedResources: [],
          estimatedWeeks: 4,
          scientificBasis: {
            summary: "Ayuda espontánea → Indicador de cohesión",
            source: "Podsakoff (2000) - Organizational Citizenship Behavior",
            insight: "Equipos con ayuda espontánea tienen 30% mejor desempeño"
          }
        }],
        development: [{
          title: "Crea dependencias positivas entre tu equipo",
          description: "La colaboración no pasa sola, hay que diseñarla. Si cada persona puede hacer su trabajo sin necesitar a nadie más, no van a colaborar. Tienes que crear situaciones donde necesiten del otro para tener éxito. No es manipulación, es diseño inteligente de equipo. Los mejores equipos tienen interdependencias claras.",
          action: "Asigna un proyecto donde dos personas que no trabajan juntas tengan que coordinarse",
          targetOutcome: "Crear nuevas conexiones dentro del equipo",
          category: 'SKILL_DEVELOPMENT',
          priority: 'ALTA',
          suggestedResources: [],
          estimatedWeeks: 6,
          scientificBasis: {
            summary: "Interdependencia → Colaboración necesaria",
            source: "Thompson (1967) - Organizational Interdependence",
            insight: "Equipos con interdependencia diseñada colaboran 45% más"
          }
        }],
        strength: [{
          title: "Exporta tu cultura de equipo",
          description: "Si tu equipo colabora bien, tienes algo que otros equipos necesitan. No te lo guardes. Comparte cómo lo lograste, qué rituales tienen, qué haces diferente. Otros managers pueden estar luchando con lo que a ti te funciona. Cuando compartes, no solo ayudas, te posicionas como referente.",
          action: "Comparte en la reunión de gerencia una práctica que funciona en tu equipo",
          targetOutcome: "Que otros equipos adopten buenas prácticas",
          category: 'MENTORING',
          priority: 'MEDIA',
          suggestedResources: [],
          estimatedWeeks: 4,
          scientificBasis: {
            summary: "Buenas prácticas compartidas → Mejora organizacional",
            source: "Knowledge Management Research (Nonaka, 1994)",
            insight: "Prácticas compartidas entre equipos mejoran resultados en 20%"
          }
        }]
      },
      COLABORADOR: {
        blindSpot: [{
          title: "¿Eres fácil de ayudar?",
          description: "A veces creemos que colaboramos bien, pero en realidad somos difíciles de ayudar. Rechazamos ofertas de apoyo, no compartimos información, o actuamos como si no necesitáramos a nadie. No es mala intención, a veces es orgullo o costumbre. Pero el trabajo en equipo es de ida y vuelta: si no dejas que te ayuden, tampoco estás colaborando.",
          action: "La próxima vez que alguien ofrezca ayuda, acepta aunque puedas solo",
          targetOutcome: "Abrir espacio para que otros colaboren contigo",
          category: 'BEHAVIORAL_CHANGE',
          priority: 'ALTA',
          suggestedResources: [],
          estimatedWeeks: 4,
          scientificBasis: {
            summary: "Recibir ayuda → Fortalecer vínculos",
            source: "Grant (2013) - Give and Take Research",
            insight: "Aceptar ayuda fortalece relaciones tanto como darla"
          }
        }],
        development: [{
          title: "Ofrece ayuda antes de que te la pidan",
          description: "La colaboración reactiva es esperar a que te pidan ayuda. La colaboración proactiva es ofrecerla antes. Cuando ves que alguien está trabado, apurado o frustrado, no esperes a que te diga algo. Acércate y pregunta. Ese gesto simple cambia completamente cómo te perciben en el equipo.",
          action: "Esta semana, ofrece ayuda a un compañero sin que te lo pida",
          targetOutcome: "Ser percibido como alguien que apoya al equipo",
          category: 'BEHAVIORAL_CHANGE',
          priority: 'MEDIA',
          suggestedResources: [],
          estimatedWeeks: 4,
          scientificBasis: {
            summary: "Ayuda proactiva → Confianza del equipo",
            source: "Organizational Citizenship Behavior (Organ, 1988)",
            insight: "La ayuda no solicitada genera 2x más reciprocidad"
          }
        }],
        strength: [{
          title: "Sé el conector del equipo",
          description: "Si la colaboración te sale natural, puedes ser quien une al equipo. Cuando alguien necesita algo que otro tiene, tú puedes ser el puente. Cuando hay tensión entre dos personas, puedes ser quien suaviza. No necesitas un rol formal para esto, solo estar atento y actuar.",
          action: "Identifica dos compañeros que no se hablan mucho y busca una excusa para conectarlos",
          targetOutcome: "Fortalecer la red de relaciones del equipo",
          category: 'EXPERIENCE_BUILDING',
          priority: 'BAJA',
          suggestedResources: [],
          estimatedWeeks: 4,
          scientificBasis: {
            summary: "Brokers sociales → Equipos más conectados",
            source: "Burt (2004) - Structural Holes Theory",
            insight: "Los conectores aumentan el flujo de información en 35%"
          }
        }]
      }
    },
    coachingTips: {
      blindSpot: [
        "Pregunta: '¿Cuándo fue la última vez que pediste ayuda a un compañero?'",
        "Observa si habla en 'yo' o en 'nosotros' cuando describe logros."
      ],
      development: [
        "Asigna tareas que requieran coordinación con otros.",
        "Reconoce públicamente cuando ayude a alguien."
      ],
      strength: [
        "Puede ser quien integra a nuevos miembros.",
        "Ideal para proyectos que requieren múltiples áreas."
      ]
    }
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 3. ORIENTACIÓN A RESULTADOS (CORE-RESULTS)
  // ──────────────────────────────────────────────────────────────────────────
  'CORE-RESULTS': {
    code: 'CORE-RESULTS',
    name: 'Orientación a Resultados',
    keywords: ['resultados', 'results', 'logros', 'metas', 'objetivos', 'cumplimiento', 'desempeño', 'eficiencia'],

    strategies: {
      EJECUTIVO: {
        blindSpot: [{
          title: "¿Confundes actividad con resultados?",
          description: "A este nivel es fácil estar ocupadísimo sin lograr lo importante. Reuniones, decisiones, viajes, presentaciones. Parece productivo pero puede ser solo ruido. Tu jefatura no mide tu esfuerzo, mide tu impacto. Y si estás tan ocupado que no tienes tiempo para pensar en lo estratégico, algo está mal. La pregunta incómoda: si desaparecieras un mes, ¿qué resultados realmente se detendrían?",
          action: "Lista tus 5 actividades que más tiempo consumen. ¿Cuántas generan resultados medibles?",
          targetOutcome: "Identificar actividades de bajo impacto que puedes eliminar o delegar",
          category: 'BEHAVIORAL_CHANGE',
          priority: 'ALTA',
          suggestedResources: [],
          estimatedWeeks: 4,
          scientificBasis: {
            summary: "Ocupación ≠ Productividad",
            source: "Newport (2016) - Deep Work Research",
            insight: "Ejecutivos dedican solo 15% del tiempo a trabajo de alto impacto"
          }
        }],
        development: [{
          title: "Define menos metas, pero que importen",
          description: "Cuando todo es prioridad, nada lo es. Si tienes 10 objetivos estratégicos, en realidad no tienes ninguno claro. Tu equipo no puede enfocarse en todo y termina no enfocándose en nada. Los mejores ejecutivos son brutales priorizando. Dicen no a lo bueno para poder decir sí a lo excelente.",
          action: "Reduce tus prioridades del trimestre a máximo 3. Comunícalas obsesivamente.",
          targetOutcome: "Foco claro en toda tu organización",
          category: 'SKILL_DEVELOPMENT',
          priority: 'ALTA',
          suggestedResources: [
            { type: 'BOOK', title: "Essentialism", provider: "Greg McKeown" }
          ],
          estimatedWeeks: 6,
          scientificBasis: {
            summary: "Foco → Ejecución → Resultados",
            source: "McChesney (2012) - 4 Disciplines of Execution",
            insight: "Equipos con 2-3 metas claras logran 4x más que equipos con 10+ metas"
          }
        }],
        strength: [{
          title: "Eleva el estándar de resultados de la organización",
          description: "Si lograr resultados te sale natural, tu trabajo es que sea el estándar, no la excepción. No basta con que tú entregues, necesitas que toda la organización entregue. Eso requiere que seas exigente sin ser tóxico, que celebres los logros y que confrontes cuando no se cumple. Tu fortaleza puede transformar la cultura si la usas bien.",
          action: "Implementa una revisión mensual de resultados con consecuencias claras (buenas y malas)",
          targetOutcome: "Cultura de accountability en toda la organización",
          category: 'EXPERIENCE_BUILDING',
          priority: 'ALTA',
          suggestedResources: [],
          estimatedWeeks: 8,
          scientificBasis: {
            summary: "Accountability visible → Cultura de resultados",
            source: "Collins (2001) - Good to Great Research",
            insight: "Organizaciones con accountability clara superan en 3x a sus competidores"
          }
        }]
      },
      MANAGER: {
        blindSpot: [{
          title: "Revisa si tu equipo tiene claridad de prioridades",
          description: "Si les preguntas a 3 personas de tu equipo cuál es la prioridad, ¿dirían lo mismo? Probablemente no. Y ese es el problema. Cuando cada uno tiene su propia versión de lo importante, el esfuerzo se dispersa. Todos trabajan duro pero en direcciones diferentes. El resultado: mucho movimiento, poco avance real.",
          action: "Haz la prueba: pregúntale a cada uno '¿Cuál es tu prioridad #1?' y compara respuestas.",
          targetOutcome: "Alineación del equipo en las 3 prioridades principales",
          category: 'BEHAVIORAL_CHANGE',
          priority: 'ALTA',
          suggestedResources: [
            { type: 'PRACTICE', title: "Reunión semanal de 15 min: solo prioridades" }
          ],
          estimatedWeeks: 4,
          scientificBasis: {
            summary: "Claridad → Alineación → Resultados",
            source: "Lencioni (2002) - The Five Dysfunctions of a Team",
            insight: "Equipos desalineados pierden 40% de su capacidad productiva"
          }
        }],
        development: [{
          title: "Haz seguimiento sistemático",
          description: "No basta con definir objetivos. Hay que revisarlos regularmente. Lo que no se mide no se mejora, y lo que no se revisa se olvida. Muchos managers definen metas en enero y las revisan en diciembre. Para entonces ya es tarde. El seguimiento semanal no es micromanagement, es gestión básica.",
          action: "Implementa un check-in semanal de 15 minutos solo para revisar avance de metas",
          targetOutcome: "Detectar atrasos antes de que sean crisis",
          category: 'SKILL_DEVELOPMENT',
          priority: 'ALTA',
          suggestedResources: [
            { type: 'TEMPLATE', title: "Check-in: Meta → Avance → Bloqueadores → Acción" }
          ],
          estimatedWeeks: 4,
          scientificBasis: {
            summary: "Frecuencia de revisión → Tasa de logro",
            source: "Locke & Latham (2002) - Goal Setting Theory",
            insight: "Metas revisadas semanalmente se logran 2x más que las revisadas mensualmente"
          }
        }],
        strength: [{
          title: "Exporta tu fórmula de éxito",
          description: "Tu equipo cumple consistentemente. Eso no es suerte, es tu método. El problema es que está en tu cabeza y si te vas, se va contigo. Peor aún: otros gerentes luchan con lo que tú ya resolviste, y la empresa pierde tiempo reinventando la rueda. Tu próximo nivel no es solo lograr resultados, es multiplicarlos. Cuando tu método funciona en otros equipos, dejas de ser un buen gerente y te conviertes en alguien que eleva a toda la organización.",
          action: "Documenta tu proceso de seguimiento semanal y compártelo en la reunión de gerencia.",
          targetOutcome: "Que otros equipos adopten tus buenas prácticas",
          category: 'SKILL_DEVELOPMENT',
          priority: 'MEDIA',
          suggestedResources: [],
          estimatedWeeks: 4,
          scientificBasis: {
            summary: "Conocimiento tácito → Explícito → Escalable",
            source: "Knowledge Spiral (Nonaka & Takeuchi, 1995)",
            insight: "Las organizaciones que documentan mejores prácticas crecen 2.5x más rápido"
          }
        }]
      },
      COLABORADOR: {
        blindSpot: [{
          title: "Pregunta si estás trabajando en lo correcto",
          description: "Estar ocupado no es lo mismo que ser productivo. Puedes trabajar 10 horas al día en cosas que tu jefe considera secundarias. Y cuando llegue la evaluación, no va a importar tu esfuerzo, va a importar si hiciste lo que necesitaban. La mejor forma de evitar eso es preguntar directamente: ¿estoy enfocado en lo que más importa?",
          action: "Pregúntale a tu jefe: '¿Estoy enfocado en lo que más te importa?'",
          targetOutcome: "Confirmar que tus esfuerzos están alineados",
          category: 'BEHAVIORAL_CHANGE',
          priority: 'ALTA',
          suggestedResources: [],
          estimatedWeeks: 2,
          scientificBasis: {
            summary: "Alineación → Valor percibido",
            source: "Expectation Management Research (Buckingham, 2005)",
            insight: "Empleados alineados con expectativas son evaluados 35% mejor"
          }
        }],
        development: [{
          title: "Termina lo que empiezas",
          description: "Es fácil empezar muchas cosas. Lo difícil es cerrarlas. Cada tarea que dejas a medias ocupa espacio mental y te hace sentir que nunca avanzas. Tu jefe no ve tu esfuerzo, ve tus resultados. Y cuando tienes 10 cosas al 80%, parece que no terminas nada. La diferencia entre los que avanzan y los que no, no es talento: es foco. Menos cosas, pero cerradas.",
          action: "Haz una lista de pendientes. Elige 3 para terminar esta semana y di no a lo demás.",
          targetOutcome: "Reducir tu lista de pendientes a la mitad",
          category: 'SKILL_DEVELOPMENT',
          priority: 'MEDIA',
          suggestedResources: [],
          estimatedWeeks: 4,
          scientificBasis: {
            summary: "Foco → Completación → Confianza",
            source: "Zeigarnik Effect (Bluma Zeigarnik, 1927)",
            insight: "Las tareas incompletas consumen 40% más energía mental que las cerradas"
          }
        }],
        strength: [{
          title: "Optimiza un proceso lento",
          description: "Eres muy eficiente. Seguramente ves pasos inútiles que otros ignoran. Procesos que podrían ser más rápidos, reuniones que podrían ser emails, aprobaciones que no agregan valor. Eso que ves y te frustra es una oportunidad. Si propones una mejora y funciona, te conviertes en alguien que no solo hace su trabajo, sino que mejora cómo trabajan todos.",
          action: "Elige una tarea repetitiva del equipo y propón una forma de hacerla en la mitad del tiempo.",
          targetOutcome: "Ahorrar tiempo operativo a todo el equipo",
          category: 'EXPERIENCE_BUILDING',
          priority: 'MEDIA',
          suggestedResources: [],
          estimatedWeeks: 4,
          scientificBasis: {
            summary: "Mejora visible → Reconocimiento",
            source: "Kaizen Methodology (Toyota Production System)",
            insight: "Mejoras pequeñas consistentes generan 30% más eficiencia anual"
          }
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
      strength: [
        "Dale los proyectos más críticos.",
        "Puede enseñar su método a otros."
      ]
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
          description: "A veces creemos ser flexibles, pero otros ven rigidez en nuestras decisiones. Frases como 'siempre lo hemos hecho así' o 'eso no va a funcionar' se escapan sin darnos cuenta. Tu equipo lee esas señales y aprende que proponer cambios es perder el tiempo. Lo irónico es que probablemente pides innovación mientras inconscientemente la bloqueas.",
          action: "Pregunta a alguien de confianza: '¿En qué situaciones me ves resistente al cambio?'",
          targetOutcome: "Identificar patrones de rigidez no conscientes",
          category: 'BEHAVIORAL_CHANGE',
          priority: 'ALTA',
          suggestedResources: [],
          estimatedWeeks: 4,
          scientificBasis: {
            summary: "Status quo bias → Resistencia inconsciente",
            source: "Kahneman (2011) - Thinking Fast and Slow",
            insight: "Los líderes subestiman su resistencia al cambio en 50%"
          }
        }],
        development: [{
          title: "Practica cambiar de opinión públicamente",
          description: "Los líderes que nunca cambian de opinión generan culturas rígidas. Si tu equipo nunca te ha visto decir 'tenías razón, cambié de parecer', les estás enseñando que cambiar de opinión es debilidad. Los mejores líderes modelan que estar equivocado y corregir es señal de inteligencia, no de debilidad.",
          action: "En la próxima reunión donde alguien tenga mejor idea que la tuya, di públicamente: 'Me convenciste, hagámoslo así'.",
          targetOutcome: "Normalizar el cambio de opinión en tu equipo",
          category: 'BEHAVIORAL_CHANGE',
          priority: 'ALTA',
          suggestedResources: [],
          estimatedWeeks: 6,
          scientificBasis: {
            summary: "Modelar flexibilidad → Cultura adaptable",
            source: "Schein (2010) - Organizational Culture and Leadership",
            insight: "Líderes que modelan cambio de opinión tienen equipos 40% más innovadores"
          }
        }],
        strength: [{
          title: "Lidera la próxima transformación",
          description: "Si el cambio no te asusta, eres exactamente quien debe liderarlo. Las transformaciones fallan no por falta de estrategia, sino por falta de líderes que las sostengan cuando se pone difícil. Tu capacidad de adaptarte puede ser el diferencial entre una transformación exitosa y otra que muere en el camino.",
          action: "Ofrécete para liderar o co-liderar la próxima iniciativa de cambio importante",
          targetOutcome: "Transformación exitosa con tu liderazgo",
          category: 'EXPERIENCE_BUILDING',
          priority: 'ALTA',
          suggestedResources: [],
          estimatedWeeks: 12,
          scientificBasis: {
            summary: "Líder adaptable → Cambio sostenido",
            source: "Kotter (1996) - Leading Change",
            insight: "70% de las transformaciones fallan por falta de liderazgo consistente"
          }
        }]
      },
      MANAGER: {
        blindSpot: [{
          title: "¿Tu equipo te trae problemas o solo soluciones?",
          description: "Si tu equipo solo te trae soluciones, puede que tengan miedo de traerte problemas. Eso suena bien pero es peligroso. Significa que los problemas existen pero no te enteras hasta que explotan. Un equipo sano trae problemas temprano, cuando aún se pueden resolver. Si no te traen nada malo, algo malo está pasando.",
          action: "En tu próxima reunión de equipo, pregunta: '¿Qué no está funcionando que no me han contado?'",
          targetOutcome: "Crear espacio seguro para hablar de problemas",
          category: 'BEHAVIORAL_CHANGE',
          priority: 'ALTA',
          suggestedResources: [],
          estimatedWeeks: 4,
          scientificBasis: {
            summary: "Seguridad psicológica → Detección temprana",
            source: "Edmondson (2018) - The Fearless Organization",
            insight: "Equipos con seguridad psicológica detectan problemas 60% antes"
          }
        }],
        development: [{
          title: "Practica decir 'no sé' más seguido",
          description: "Los managers que siempre tienen respuesta generan equipos que no piensan. Si siempre sabes qué hacer, ¿para qué van a pensar ellos? Decir 'no sé, ¿qué propones?' no es debilidad, es desarrollo. Le estás diciendo a tu equipo que confías en su criterio y que está bien no tener todas las respuestas.",
          action: "La próxima vez que te pregunten algo que no es urgente, responde: 'No sé, ¿qué propones tú?'",
          targetOutcome: "Equipo que propone soluciones en lugar de esperar respuestas",
          category: 'BEHAVIORAL_CHANGE',
          priority: 'MEDIA',
          suggestedResources: [],
          estimatedWeeks: 6,
          scientificBasis: {
            summary: "Preguntar → Desarrollar pensamiento crítico",
            source: "Marquardt (2005) - Leading with Questions",
            insight: "Managers que preguntan más desarrollan equipos 35% más autónomos"
          }
        }],
        strength: [{
          title: "Sé el traductor del cambio",
          description: "Si te adaptas fácil a los cambios, puedes ayudar a otros que no. Cada vez que la empresa cambia algo, hay gente que se pierde, se frustra o resiste. Tú puedes ser quien traduce el cambio a algo que haga sentido para ellos. No es solo explicar, es ayudar a procesar.",
          action: "En el próximo cambio organizacional, ofrécete para ayudar a comunicarlo a los equipos",
          targetOutcome: "Reducir resistencia al cambio en tu área",
          category: 'MENTORING',
          priority: 'MEDIA',
          suggestedResources: [],
          estimatedWeeks: 4,
          scientificBasis: {
            summary: "Agentes de cambio → Adopción más rápida",
            source: "Rogers (2003) - Diffusion of Innovations",
            insight: "Cambios con 'traductores' internos se adoptan 50% más rápido"
          }
        }]
      },
      COLABORADOR: {
        blindSpot: [{
          title: "¿Te quejas de los cambios?",
          description: "Todos nos quejamos a veces, pero si te has vuelto 'el que siempre se queja de los cambios', estás afectando tu reputación sin darte cuenta. La gente deja de contarte cosas, te excluyen de decisiones, asumen que vas a resistir. No importa si tus quejas son válidas, si te perciben como resistente, las oportunidades van a pasar de largo.",
          action: "Esta semana, cuando algo cambie, antes de opinar pregunta: '¿Qué problema están tratando de resolver?'",
          targetOutcome: "Ser percibido como alguien abierto al cambio",
          category: 'BEHAVIORAL_CHANGE',
          priority: 'ALTA',
          suggestedResources: [],
          estimatedWeeks: 4,
          scientificBasis: {
            summary: "Percepción → Oportunidades",
            source: "Impression Management Theory (Goffman, 1959)",
            insight: "La reputación de 'resistente' reduce oportunidades de desarrollo en 40%"
          }
        }],
        development: [{
          title: "Busca el lado bueno del cambio",
          description: "Todo cambio tiene cosas buenas y malas. Es fácil ver las malas, requiere esfuerzo ver las buenas. Pero si solo ves lo malo, te amargas y contagias a otros. Entrenar tu mente para buscar oportunidades en los cambios no es ser ingenuo, es ser estratégico. Los que avanzan son los que encuentran ventaja donde otros solo ven problema.",
          action: "Ante el próximo cambio, escribe 3 cosas buenas que puede traer antes de pensar en las malas",
          targetOutcome: "Desarrollar mentalidad de oportunidad",
          category: 'BEHAVIORAL_CHANGE',
          priority: 'MEDIA',
          suggestedResources: [],
          estimatedWeeks: 6,
          scientificBasis: {
            summary: "Reencuadre positivo → Resiliencia",
            source: "Seligman (2006) - Learned Optimism",
            insight: "El reencuadre positivo reduce estrés ante cambios en 45%"
          }
        }],
        strength: [{
          title: "Ayuda a compañeros que les cuesta el cambio",
          description: "Si te adaptas fácil, puedes ayudar a los que no. No todos procesan los cambios igual. Algunos necesitan más tiempo, más información, o simplemente alguien que los escuche. Tú puedes ser esa persona. No es hacerles el trabajo, es acompañarlos mientras se ajustan.",
          action: "Identifica a un compañero que esté luchando con un cambio reciente y ofrécele apoyo",
          targetOutcome: "Facilitar la adaptación de otros",
          category: 'MENTORING',
          priority: 'BAJA',
          suggestedResources: [],
          estimatedWeeks: 4,
          scientificBasis: {
            summary: "Apoyo de pares → Adaptación más rápida",
            source: "Social Support Theory (Cohen & Wills, 1985)",
            insight: "El apoyo de pares reduce tiempo de adaptación en 30%"
          }
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
      strength: [
        "Ideal para liderar iniciativas de cambio.",
        "Puede ayudar a otros a procesar transiciones."
      ]
    }
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 5. ORIENTACIÓN AL CLIENTE (CORE-CLIENT)
  // ──────────────────────────────────────────────────────────────────────────
  'CORE-CLIENT': {
    code: 'CORE-CLIENT',
    name: 'Orientación al Cliente',
    keywords: ['cliente', 'customer', 'servicio', 'service', 'satisfaccion', 'usuario', 'necesidades'],

    strategies: {
      EJECUTIVO: {
        blindSpot: [{
          title: "¿Cuándo fue la última vez que hablaste con un cliente?",
          description: "A medida que subes en la organización, te alejas del cliente real. Empiezas a tomar decisiones basadas en reportes, números y opiniones de terceros. Pero los reportes no capturan la frustración de un cliente, ni su entusiasmo, ni sus verdaderas necesidades. Si no hablas con clientes regularmente, estás tomando decisiones sobre gente que no conoces.",
          action: "Agenda 2 conversaciones directas con clientes este mes. Sin filtro, sin preparación del equipo.",
          targetOutcome: "Reconectar con la realidad del cliente",
          category: 'BEHAVIORAL_CHANGE',
          priority: 'ALTA',
          suggestedResources: [],
          estimatedWeeks: 4,
          scientificBasis: {
            summary: "Contacto directo → Decisiones informadas",
            source: "Christensen (2016) - Jobs to be Done Framework",
            insight: "Ejecutivos que hablan con clientes regularmente toman 35% mejores decisiones de producto"
          }
        }],
        development: [{
          title: "Vive la experiencia del cliente",
          description: "Usar tu propio producto o servicio como cliente te da una perspectiva que ningún reporte puede dar. Sientes la fricción, la frustración, los momentos de deleite. Si nunca has sido cliente de tu empresa, no entiendes realmente qué estás vendiendo. Los mejores ejecutivos son usuarios obsesivos de lo que ofrecen.",
          action: "Haz el journey completo como cliente: compra, usa, reclama, cancela. Documenta tu experiencia.",
          targetOutcome: "Empatía real con la experiencia del cliente",
          category: 'EXPERIENCE_BUILDING',
          priority: 'ALTA',
          suggestedResources: [],
          estimatedWeeks: 4,
          scientificBasis: {
            summary: "Experiencia propia → Empatía genuina",
            source: "Brown (2009) - Change by Design (IDEO)",
            insight: "Líderes que usan su producto identifican 50% más oportunidades de mejora"
          }
        }],
        strength: [{
          title: "Institucionaliza la voz del cliente",
          description: "Si la orientación al cliente te sale natural, haz que sea parte de cómo funciona la organización. Que no dependa de tu presencia ni de buena voluntad. Crea sistemas que traigan la voz del cliente a las decisiones importantes, automáticamente, aunque nadie lo pida.",
          action: "Implementa un ritual donde cada decisión estratégica incluya datos o testimonios de clientes",
          targetOutcome: "Cliente presente en todas las decisiones importantes",
          category: 'SKILL_DEVELOPMENT',
          priority: 'ALTA',
          suggestedResources: [],
          estimatedWeeks: 8,
          scientificBasis: {
            summary: "Sistemas → Sostenibilidad",
            source: "Customer Centricity Research (Fader, 2012)",
            insight: "Empresas con voz del cliente institucionalizada retienen 25% más clientes"
          }
        }]
      },
      MANAGER: {
        blindSpot: [{
          title: "¿Tu equipo conoce al cliente o solo al proceso?",
          description: "Es fácil que tu equipo se enfoque tanto en el proceso que olvide para quién trabaja. Cumplen los pasos, llenan los formularios, pero no saben qué pasa después con el cliente. No es mala intención, es que el sistema los desconecta. Si tu equipo no puede describir cómo su trabajo afecta al cliente final, hay un problema.",
          action: "Pregunta a cada persona de tu equipo: '¿Cómo afecta tu trabajo al cliente?' Si no saben, hay que conectar.",
          targetOutcome: "Equipo consciente del impacto en el cliente",
          category: 'BEHAVIORAL_CHANGE',
          priority: 'ALTA',
          suggestedResources: [],
          estimatedWeeks: 4,
          scientificBasis: {
            summary: "Conexión con propósito → Compromiso",
            source: "Grant (2013) - Give and Take",
            insight: "Empleados que ven impacto en cliente son 30% más comprometidos"
          }
        }],
        development: [{
          title: "Trae la voz del cliente a tu equipo",
          description: "Tu equipo toma mejores decisiones cuando escucha directamente al cliente. No filtrado por ti, no en un reporte, sino de primera mano. Puede ser un audio, un video, una visita. Cuando escuchas la voz real de alguien frustrado o agradecido, cambia cómo trabajas.",
          action: "Una vez al mes, comparte un testimonio real de cliente (bueno o malo) con tu equipo",
          targetOutcome: "Cliente presente en las conversaciones del equipo",
          category: 'SKILL_DEVELOPMENT',
          priority: 'ALTA',
          suggestedResources: [],
          estimatedWeeks: 4,
          scientificBasis: {
            summary: "Testimonios reales → Empatía activa",
            source: "Zaltman (2003) - How Customers Think",
            insight: "Equipos expuestos a feedback directo mejoran servicio en 25%"
          }
        }],
        strength: [{
          title: "Conviértete en la voz del cliente en la empresa",
          description: "Si entiendes al cliente mejor que otros, puedes ser quien lo represente en las decisiones importantes. Cuando se discute una política, un producto, un proceso, tú puedes ser quien pregunta: '¿Y esto cómo lo ve el cliente?' Ese rol es valioso y te posiciona diferente.",
          action: "En la próxima reunión donde se tome una decisión que afecte clientes, trae su perspectiva",
          targetOutcome: "Ser reconocido como defensor del cliente",
          category: 'EXPERIENCE_BUILDING',
          priority: 'MEDIA',
          suggestedResources: [],
          estimatedWeeks: 6,
          scientificBasis: {
            summary: "Advocacy interno → Influencia",
            source: "Gulati (2007) - Silo Busting",
            insight: "Defensores internos del cliente tienen 2x más influencia en decisiones"
          }
        }]
      },
      COLABORADOR: {
        blindSpot: [{
          title: "¿Conoces realmente a tu cliente?",
          description: "Puede que creas conocer al cliente pero solo conoces una versión simplificada. Sabes lo que te cuentan o lo que asumes, pero no has caminado en sus zapatos. Y cuando no conoces de verdad a alguien, es difícil servirle bien. Las decisiones que tomas basadas en suposiciones pueden estar completamente equivocadas.",
          action: "Si es posible, pide observar o acompañar a un cliente usando el producto/servicio",
          targetOutcome: "Empatía real con la experiencia del cliente",
          category: 'EXPERIENCE_BUILDING',
          priority: 'MEDIA',
          suggestedResources: [],
          estimatedWeeks: 4,
          scientificBasis: {
            summary: "Observación directa → Comprensión profunda",
            source: "IDEO Human-Centered Design",
            insight: "Observar clientes revela necesidades que las encuestas no capturan"
          }
        }],
        development: [{
          title: "Pregunta qué necesita, no qué quiere",
          description: "Los clientes a veces piden cosas que no necesitan o no saben pedir lo que realmente les ayudaría. Tu trabajo no es solo ejecutar lo que piden, es entender qué problema tienen detrás. Cuando entiendes el problema real, puedes ofrecer soluciones que ni sabían que existían.",
          action: "La próxima vez que un cliente pida algo, pregunta: '¿Qué problema estás tratando de resolver?'",
          targetOutcome: "Entender necesidades reales, no solo pedidos",
          category: 'SKILL_DEVELOPMENT',
          priority: 'MEDIA',
          suggestedResources: [],
          estimatedWeeks: 4,
          scientificBasis: {
            summary: "Necesidad vs Pedido → Solución correcta",
            source: "Christensen (2016) - Jobs to be Done",
            insight: "Entender el 'job to be done' mejora satisfacción en 40%"
          }
        }],
        strength: [{
          title: "Maneja las situaciones críticas",
          description: "Tienes un don para calmar aguas turbulentas. Eres el experto en casos difíciles. Cuando un cliente está furioso, frustrado o a punto de irse, tú puedes ser quien lo rescata. No todos pueden hacer eso. Usa esa fortaleza y enseña a otros cómo lo haces.",
          action: "Ofrécete para atender al próximo cliente difícil y después comparte cómo lo resolviste",
          targetOutcome: "Resolver conflictos que otros no pueden",
          category: 'EXPERIENCE_BUILDING',
          priority: 'MEDIA',
          suggestedResources: [],
          estimatedWeeks: 2,
          scientificBasis: {
            summary: "Manejo de crisis → Cliente rescatado → Lealtad",
            source: "Hart (1990) - Service Recovery Paradox",
            insight: "Clientes bien recuperados son 8% más leales que los que nunca tuvieron problemas"
          }
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
      strength: [
        "Puede ser embajador de la voz del cliente.",
        "Ideal para proyectos de mejora de experiencia."
      ]
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
          description: "Si nadie puede reemplazarte, no estás desarrollando a tu equipo. Y eso no es señal de que eres indispensable, es señal de que has fallado como líder. Los mejores ejecutivos se miden por la calidad de los líderes que dejan atrás, no por lo irreemplazables que son. Si mañana te ascendieran, ¿quién tomaría tu lugar? Si no tienes respuesta clara, ese es tu problema más urgente.",
          action: "Identifica a 2 personas que podrían asumir tu rol y pregúntales qué les falta",
          targetOutcome: "Tener un plan de sucesión claro",
          category: 'BEHAVIORAL_CHANGE',
          priority: 'ALTA',
          suggestedResources: [],
          estimatedWeeks: 8,
          scientificBasis: {
            summary: "Sucesión planificada → Continuidad organizacional",
            source: "Charan (2005) - The Leadership Pipeline",
            insight: "Empresas con planes de sucesión activos tienen 25% mejor continuidad de liderazgo"
          }
        }],
        development: [{
          title: "Dedica tiempo a conversaciones de desarrollo",
          description: "El desarrollo no pasa en evaluaciones anuales. Pasa en conversaciones frecuentes. 15 minutos semanales de conversación real sobre carrera, desafíos y crecimiento valen más que una evaluación formal de 2 horas. El problema es que siempre hay algo más urgente. Pero si no proteges ese tiempo, el desarrollo de tu equipo siempre va a perder contra lo operativo.",
          action: "Bloquea 30 minutos semanales para conversaciones de desarrollo con tu equipo directo",
          targetOutcome: "Desarrollo como hábito, no como evento anual",
          category: 'BEHAVIORAL_CHANGE',
          priority: 'ALTA',
          suggestedResources: [],
          estimatedWeeks: 8,
          scientificBasis: {
            summary: "Frecuencia → Impacto en desarrollo",
            source: "Zenger & Folkman (2014) - The Extraordinary Coach",
            insight: "Conversaciones semanales de coaching mejoran desempeño 3x más que las anuales"
          }
        }],
        strength: [{
          title: "Crea una fábrica de líderes",
          description: "Si desarrollar gente te sale natural, piensa en grande. No se trata solo de desarrollar a tu equipo directo, sino de crear un sistema que produzca líderes consistentemente. Programas de mentoría, rotaciones de desarrollo, proyectos desafiantes con apoyo. Tu legado no es lo que lograste, es cuántos líderes dejaste.",
          action: "Diseña un programa de desarrollo de líderes que funcione aunque tú no estés",
          targetOutcome: "Sistema de desarrollo que se auto-sostiene",
          category: 'SKILL_DEVELOPMENT',
          priority: 'ALTA',
          suggestedResources: [],
          estimatedWeeks: 12,
          scientificBasis: {
            summary: "Sistemas de desarrollo → Talento sostenible",
            source: "Bersin (2010) - High-Impact Talent Management",
            insight: "Empresas con programas estructurados de desarrollo tienen 2x mejor bench de líderes"
          }
        }]
      },
      MANAGER: {
        blindSpot: [{
          title: "¿Das feedback o solo instrucciones?",
          description: "Hay una diferencia entre decirle a alguien qué hacer y ayudarlo a crecer. Si solo das instrucciones ('haz esto así'), estás dirigiendo, no desarrollando. El desarrollo pasa cuando explicas el porqué, cuando preguntas qué aprendió, cuando dejas que falle y aprenda. Puede que creas que desarrollas a tu equipo, pero pregúntate: ¿cuándo fue la última vez que alguien aprendió algo nuevo gracias a ti?",
          action: "Esta semana, después de cada instrucción, agrega: 'Te digo esto porque...' y explica el porqué",
          targetOutcome: "Equipo que entiende el porqué, no solo el qué",
          category: 'BEHAVIORAL_CHANGE',
          priority: 'ALTA',
          suggestedResources: [],
          estimatedWeeks: 4,
          scientificBasis: {
            summary: "Porqué → Aprendizaje → Autonomía",
            source: "Sinek (2009) - Start With Why",
            insight: "Explicar el porqué aumenta retención de aprendizaje en 45%"
          }
        }],
        development: [{
          title: "Delega para desarrollar, no para descargar",
          description: "Hay dos formas de delegar: para sacarte trabajo de encima o para hacer crecer a alguien. Parecen iguales pero son completamente diferentes. Cuando delegas para desarrollar, eliges tareas que estiran a la persona, le das apoyo sin resolverle, y aceptas que va a ser más lento al principio. Es una inversión, no un atajo.",
          action: "Identifica una tarea que haces bien y delégala a alguien que la necesita para crecer",
          targetOutcome: "Alguien de tu equipo puede hacer algo que antes solo hacías tú",
          category: 'SKILL_DEVELOPMENT',
          priority: 'ALTA',
          suggestedResources: [],
          estimatedWeeks: 6,
          scientificBasis: {
            summary: "Stretch assignments → Crecimiento acelerado",
            source: "McCall (1998) - High Flyers",
            insight: "70% del desarrollo de líderes viene de experiencias desafiantes, no de cursos"
          }
        }],
        strength: [{
          title: "Sé mentor formal de alto potencial",
          description: "Si desarrollar gente es tu fortaleza, formalízalo. Hay talento en la organización que necesita un mentor y tú puedes ser esa persona. No es lo mismo que ser jefe. Un mentor ayuda a pensar en carrera, desafíos, política organizacional. Es una relación diferente y de alto impacto.",
          action: "Ofrécete a Recursos Humanos como mentor de alguien de alto potencial fuera de tu área",
          targetOutcome: "Impacto de desarrollo más allá de tu equipo",
          category: 'MENTORING',
          priority: 'MEDIA',
          suggestedResources: [],
          estimatedWeeks: 12,
          scientificBasis: {
            summary: "Mentoría formal → Retención de talento",
            source: "Kram (1985) - Mentoring at Work",
            insight: "Empleados con mentor tienen 5x más probabilidad de ser promovidos"
          }
        }]
      },
      COLABORADOR: {
        blindSpot: [{
          title: "¿Pides desarrollo o esperas que te lo den?",
          description: "Puede que creas que tu jefe debería desarrollarte más, y quizás tengas razón. Pero esperar a que te desarrollen es una estrategia perdedora. Los que crecen más rápido son los que piden, buscan y crean sus propias oportunidades de aprendizaje. Tu desarrollo es tu responsabilidad, no la de tu jefe.",
          action: "Pídele a tu jefe: 'Quiero aprender X. ¿Qué oportunidad me puedes dar para practicarlo?'",
          targetOutcome: "Ser agente activo de tu propio desarrollo",
          category: 'BEHAVIORAL_CHANGE',
          priority: 'ALTA',
          suggestedResources: [],
          estimatedWeeks: 4,
          scientificBasis: {
            summary: "Proactividad → Crecimiento acelerado",
            source: "Seibert (1999) - Proactive Personality and Career Success",
            insight: "Empleados proactivos en desarrollo crecen 40% más rápido en sus carreras"
          }
        }],
        development: [{
          title: "Busca un mentor informal",
          description: "No necesitas un programa formal para tener un mentor. Identifica a alguien que admiras, que tiene lo que quieres desarrollar, y pídele un café. No para pedirle trabajo ni favores, sino para aprender. La mayoría de la gente está feliz de compartir su experiencia si le preguntas bien.",
          action: "Identifica a alguien que admiras y pídele una conversación de 20 minutos para aprender de su experiencia",
          targetOutcome: "Tener un mentor informal que te guíe",
          category: 'KNOWLEDGE_ACQUISITION',
          priority: 'MEDIA',
          suggestedResources: [],
          estimatedWeeks: 6,
          scientificBasis: {
            summary: "Mentoría informal → Desarrollo orgánico",
            source: "Ragins & Cotton (1999) - Informal Mentoring",
            insight: "Mentorías informales son tan efectivas como las formales para el desarrollo"
          }
        }],
        strength: [{
          title: "Enseña a un compañero nuevo",
          description: "Si aprendes rápido y desarrollarte te sale fácil, puedes ayudar a otros. Cuando llega alguien nuevo, necesita más que un manual. Necesita alguien que le explique cómo funcionan las cosas de verdad. Ese puedes ser tú. Y al enseñar, consolidas tu propio aprendizaje.",
          action: "Ofrécete para ser el 'buddy' del próximo colaborador nuevo en tu área",
          targetOutcome: "Acelerar la integración de nuevos compañeros",
          category: 'MENTORING',
          priority: 'BAJA',
          suggestedResources: [],
          estimatedWeeks: 4,
          scientificBasis: {
            summary: "Enseñar → Consolidar conocimiento",
            source: "Protégé Effect (Chase et al., 2009)",
            insight: "Enseñar a otros mejora el dominio propio en 25%"
          }
        }]
      }
    },
    coachingTips: {
      blindSpot: [
        "¿Cuándo fue la última vez que dio feedback de desarrollo específico?",
        "Pregunta: '¿Qué has hecho para que tu equipo crezca este mes?'"
      ],
      development: [
        "Practica el modelo SBI: Situación-Comportamiento-Impacto.",
        "Que identifique una persona para desarrollar activamente."
      ],
      strength: [
        "Puede ser mentor de otros managers.",
        "Ideal para diseñar programas de desarrollo."
      ]
    }
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 7. LIDERAZGO DE EQUIPOS (LEAD-TEAM)
  // ──────────────────────────────────────────────────────────────────────────
  'LEAD-TEAM': {
    code: 'LEAD-TEAM',
    name: 'Liderazgo de Equipos',
    keywords: ['liderazgo', 'leadership', 'equipo', 'team', 'direccion', 'motivacion', 'confianza'],

    strategies: {
      EJECUTIVO: {
        blindSpot: [{
          title: "¿Tu equipo te dice la verdad?",
          description: "A medida que subes, la gente te dice menos verdades incómodas. No es que mientan, es que omiten, suavizan, o esperan a ver si te enteras solo. El problema es que tú necesitas esa información para tomar buenas decisiones. Si tu equipo no te dice la verdad, estás liderando con un mapa incompleto.",
          action: "Pregunta directamente: '¿Qué no me están contando que debería saber?'",
          targetOutcome: "Crear espacio para verdades incómodas",
          category: 'BEHAVIORAL_CHANGE',
          priority: 'ALTA',
          suggestedResources: [],
          estimatedWeeks: 4,
          scientificBasis: {
            summary: "Poder → Filtro de información",
            source: "Morrison & Milliken (2000) - Organizational Silence",
            insight: "Los líderes reciben 30% menos información crítica que sus subordinados conocen"
          }
        }],
        development: [{
          title: "Lidera con preguntas, no con respuestas",
          description: "Los ejecutivos que siempre tienen la respuesta crean equipos que no piensan. Si siempre resuelves, ¿para qué van a esforzarse en encontrar soluciones? Tu trabajo no es tener todas las respuestas, es hacer las preguntas que hacen pensar a tu equipo. Eso los desarrolla y te libera a ti para pensar en lo estratégico.",
          action: "En tu próxima reunión, responde al menos 3 preguntas con '¿Qué propones tú?'",
          targetOutcome: "Equipo que trae soluciones, no solo problemas",
          category: 'BEHAVIORAL_CHANGE',
          priority: 'ALTA',
          suggestedResources: [],
          estimatedWeeks: 6,
          scientificBasis: {
            summary: "Preguntas → Pensamiento crítico del equipo",
            source: "Marquardt (2005) - Leading with Questions",
            insight: "Líderes que preguntan más tienen equipos 35% más proactivos"
          }
        }],
        strength: [{
          title: "Desarrolla el siguiente nivel de líderes",
          description: "Si liderar equipos te sale natural, tu próximo nivel es desarrollar a otros líderes que puedan liderar como tú. No se trata de que te copien, sino de que encuentren su propio estilo con tu guía. El mejor legado de un líder no es lo que logró, sino los líderes que dejó.",
          action: "Elige a un gerente con potencial y trabaja con él/ella en su estilo de liderazgo",
          targetOutcome: "Un líder más en la organización gracias a tu guía",
          category: 'MENTORING',
          priority: 'ALTA',
          suggestedResources: [],
          estimatedWeeks: 12,
          scientificBasis: {
            summary: "Líderes que desarrollan líderes → Multiplicación",
            source: "Maxwell (2008) - Developing the Leaders Around You",
            insight: "Cada líder desarrollado multiplica la capacidad organizacional"
          }
        }]
      },
      MANAGER: {
        blindSpot: [{
          title: "¿Tu equipo sabe hacia dónde van?",
          description: "Es fácil asumir que tu equipo entiende la dirección porque tú la tienes clara. Pero entre lo que está en tu cabeza y lo que ellos entienden puede haber un abismo. Si cada persona de tu equipo tiene una versión diferente de hacia dónde van, no tienes un equipo, tienes gente haciendo cosas en paralelo.",
          action: "Pide a cada persona que escriba en una oración hacia dónde va el equipo. Compara las respuestas.",
          targetOutcome: "Alineación clara del equipo en la dirección",
          category: 'BEHAVIORAL_CHANGE',
          priority: 'ALTA',
          suggestedResources: [],
          estimatedWeeks: 4,
          scientificBasis: {
            summary: "Claridad de dirección → Alineación de esfuerzos",
            source: "Lencioni (2002) - The Five Dysfunctions of a Team",
            insight: "Equipos sin dirección clara desperdician 40% de su esfuerzo"
          }
        }],
        development: [{
          title: "Genera confianza con consistencia",
          description: "La confianza no se construye con grandes gestos, se construye con consistencia en las pequeñas cosas. Cumplir lo que dices, ser predecible en tus reacciones, no tener favoritos. Cuando tu equipo sabe qué esperar de ti, pueden enfocarse en trabajar en lugar de estar adivinando tu humor del día.",
          action: "Identifica una promesa pequeña que haces frecuentemente y asegúrate de cumplirla siempre",
          targetOutcome: "Equipo que confía en tu palabra",
          category: 'BEHAVIORAL_CHANGE',
          priority: 'ALTA',
          suggestedResources: [],
          estimatedWeeks: 8,
          scientificBasis: {
            summary: "Consistencia → Confianza → Rendimiento",
            source: "Covey (2006) - The Speed of Trust",
            insight: "Equipos de alta confianza son 50% más productivos"
          }
        }],
        strength: [{
          title: "Toma equipos difíciles",
          description: "Si liderar equipos te sale natural, los equipos fáciles son un desperdicio de tu talento. Los equipos difíciles, desmotivados, o en conflicto son donde realmente puedes hacer diferencia. Si puedes dar vuelta un equipo problemático, te conviertes en alguien que la organización necesita para los desafíos importantes.",
          action: "Ofrécete para liderar o apoyar a un equipo que esté pasando por un momento difícil",
          targetOutcome: "Dar vuelta a un equipo con problemas",
          category: 'EXPERIENCE_BUILDING',
          priority: 'ALTA',
          suggestedResources: [],
          estimatedWeeks: 12,
          scientificBasis: {
            summary: "Turnaround capability → Valor estratégico",
            source: "Heifetz (2009) - Leadership Without Easy Answers",
            insight: "Líderes capaces de turnaround son 3x más valiosos para organizaciones"
          }
        }]
      },
      COLABORADOR: {
        blindSpot: [{
          title: "¿Eres parte del problema o de la solución?",
          description: "A veces contribuimos a los problemas del equipo sin darnos cuenta. Quejarnos sin proponer soluciones, no compartir información, formar grupitos. No es mala intención, es que no vemos cómo nuestro comportamiento afecta al grupo. La pregunta honesta es: ¿mi presencia hace que el equipo funcione mejor o peor?",
          action: "Pregunta a un compañero de confianza: '¿Hago algo que complique al equipo?'",
          targetOutcome: "Identificar un comportamiento a cambiar",
          category: 'BEHAVIORAL_CHANGE',
          priority: 'ALTA',
          suggestedResources: [],
          estimatedWeeks: 4,
          scientificBasis: {
            summary: "Autoconciencia → Mejor contribución",
            source: "Goleman (2013) - Focus",
            insight: "La autoconciencia grupal mejora dinámicas de equipo en 30%"
          }
        }],
        development: [{
          title: "Lidera sin cargo",
          description: "No necesitas ser jefe para liderar. Liderar es hacer que las cosas pasen, coordinar esfuerzos, motivar a otros. Puedes hacerlo desde cualquier posición. Cuando ves un problema y lo resuelves sin esperar que te lo asignen, cuando ayudas a coordinar a tus compañeros, estás liderando. Y eso te prepara para cuando tengas el cargo.",
          action: "Identifica un problema del equipo que nadie está tomando y ofrécete para coordinarlo",
          targetOutcome: "Demostrar capacidad de liderazgo sin cargo formal",
          category: 'EXPERIENCE_BUILDING',
          priority: 'MEDIA',
          suggestedResources: [],
          estimatedWeeks: 6,
          scientificBasis: {
            summary: "Liderazgo informal → Preparación para roles formales",
            source: "DeRue & Ashford (2010) - Leadership Identity Construction",
            insight: "El liderazgo informal predice éxito en roles formales de liderazgo"
          }
        }],
        strength: [{
          title: "Sé el que une al equipo",
          description: "Si la dinámica de equipo te sale natural, puedes ser quien mantiene al grupo unido. Cuando hay tensión, tú puedes suavizar. Cuando alguien está fuera, tú puedes incluir. Cuando el ánimo está bajo, tú puedes levantar. No necesitas un rol formal para esto, solo estar atento y actuar.",
          action: "Organiza algo informal para el equipo (un café, un almuerzo) y asegúrate de incluir a todos",
          targetOutcome: "Fortalecer los vínculos del equipo",
          category: 'EXPERIENCE_BUILDING',
          priority: 'BAJA',
          suggestedResources: [],
          estimatedWeeks: 4,
          scientificBasis: {
            summary: "Cohesión social → Rendimiento grupal",
            source: "Beal et al. (2003) - Cohesion and Performance",
            insight: "Equipos cohesionados socialmente rinden 20% mejor"
          }
        }]
      }
    },
    coachingTips: {
      blindSpot: [
        "¿Su equipo le tiene confianza o le tiene miedo?",
        "Pregunta: '¿Cómo reaccionaría tu equipo si cometes un error?'"
      ],
      development: [
        "Trabaja en crear seguridad psicológica.",
        "Practica comunicar la visión de forma simple y repetida."
      ],
      strength: [
        "Puede tomar los equipos más desafiantes.",
        "Ideal para formar a otros managers."
      ]
    }
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 8. DELEGACIÓN EFECTIVA (LEAD-DELEG)
  // ──────────────────────────────────────────────────────────────────────────
  'LEAD-DELEG': {
    code: 'LEAD-DELEG',
    name: 'Delegación Efectiva',
    keywords: ['delegacion', 'delegation', 'empoderar', 'empowerment', 'autonomia', 'confianza'],

    strategies: {
      EJECUTIVO: {
        blindSpot: [{
          title: "¿Tu equipo puede actuar sin tu aprobación?",
          description: "Si todo requiere tu visto bueno, no estás empoderando. Tu equipo aprende que es mejor esperar tu aprobación que arriesgarse a decidir mal. Con el tiempo, dejan de pensar por sí mismos y tú terminas resolviendo todo. El resultado: tú agotado, ellos desmotivados, y las cosas se frenan cuando no estás. Lo peor es que probablemente crees que delegas, pero tu equipo siente otra cosa.",
          action: "Define 3 áreas donde tu equipo puede decidir sin consultarte y comunícalo explícitamente",
          targetOutcome: "Mayor autonomía de tu equipo directo",
          category: 'BEHAVIORAL_CHANGE',
          priority: 'ALTA',
          suggestedResources: [],
          estimatedWeeks: 6,
          scientificBasis: {
            summary: "Autonomía → Motivación → Retención",
            source: "Self-Determination Theory (Deci & Ryan, 1985)",
            insight: "Equipos con autonomía real tienen 40% menos rotación y 20% más productividad"
          }
        }],
        development: [{
          title: "Delega un proyecto completo, no solo tareas",
          description: "Empoderar es dar la responsabilidad completa, no micro-tareas. Cuando delegas solo partes, sigues siendo el cuello de botella que arma el rompecabezas. Cuando delegas un proyecto completo, la persona tiene que pensar de principio a fin. Es más riesgo para ti, pero es la única forma de desarrollar gente que pueda reemplazarte.",
          action: "Asigna un proyecto estratégico de principio a fin a alguien de tu equipo, con checkpoints pero sin interferencia",
          targetOutcome: "Desarrollar ownership en tu equipo",
          category: 'BEHAVIORAL_CHANGE',
          priority: 'ALTA',
          suggestedResources: [
            { type: 'BOOK', title: "Turn the Ship Around!", provider: "David Marquet" }
          ],
          estimatedWeeks: 8,
          scientificBasis: {
            summary: "Ownership completo → Desarrollo acelerado",
            source: "Hackman (2002) - Leading Teams",
            insight: "La responsabilidad completa desarrolla líderes 3x más rápido que tareas parciales"
          }
        }],
        strength: [{
          title: "Aplana la organización",
          description: "Confías en la gente. Ayuda a eliminar burocracia innecesaria. Cada nivel de aprobación que existe probablemente fue creado porque alguien una vez cometió un error. Pero esos controles tienen costo: demoran las cosas, desmotivan a la gente capaz, y crean la ilusión de que el control es mejor que la confianza. Usa tu influencia para eliminar pasos que no agregan valor.",
          action: "Identifica 3 niveles de aprobación en tu área que puedas eliminar y elimínalos",
          targetOutcome: "Organización más ágil y empoderada",
          category: 'SKILL_DEVELOPMENT',
          priority: 'ALTA',
          suggestedResources: [],
          estimatedWeeks: 8,
          scientificBasis: {
            summary: "Menos burocracia → Mayor velocidad",
            source: "Hamel (2007) - The Future of Management",
            insight: "Cada nivel de aprobación agrega 20% de tiempo de ciclo"
          }
        }]
      },
      MANAGER: {
        blindSpot: [{
          title: "¿Estás decidiendo cosas que tu equipo podría decidir?",
          description: "Si todo pasa por ti, eres cuello de botella y no desarrollas autonomía. El problema es que resolver cosas se siente productivo, pero en realidad estás creando dependencia. Tu equipo aprende que es más fácil preguntarte que pensar. Y tú terminas tan ocupado en lo táctico que no tienes tiempo para lo estratégico.",
          action: "Identifica 3 tipos de decisiones que puedes delegar esta semana y comunica que ya no pasarán por ti",
          targetOutcome: "Tu equipo decide más cosas sin consultarte",
          category: 'BEHAVIORAL_CHANGE',
          priority: 'ALTA',
          suggestedResources: [],
          estimatedWeeks: 4,
          scientificBasis: {
            summary: "Manager como cuello de botella → Límite de escala",
            source: "Oncken & Wass (1974) - Who's Got the Monkey?",
            insight: "Managers que no delegan limitan su equipo al ancho de banda de una persona"
          }
        }],
        development: [{
          title: "Comunica el 'qué', no el 'cómo'",
          description: "Si tu equipo no entiende tu lógica, no aprende a decidir como tú. Cuando delegas explicando solo el 'qué' sin el 'porqué' y el 'para qué', tu equipo ejecuta pero no crece. La próxima vez que delegues, explica qué quieres lograr y deja que ellos decidan cómo. Si tienen que pensar, aprenden.",
          action: "En tu próxima delegación, explica solo el resultado esperado y pregunta: '¿Cómo lo harías tú?'",
          targetOutcome: "Equipo que piensa, no solo ejecuta",
          category: 'SKILL_DEVELOPMENT',
          priority: 'ALTA',
          suggestedResources: [],
          estimatedWeeks: 6,
          scientificBasis: {
            summary: "Autonomía en el cómo → Creatividad y ownership",
            source: "Pink (2009) - Drive",
            insight: "Autonomía en el método aumenta creatividad en 40%"
          }
        }],
        strength: [{
          title: "Enseña a otros managers a delegar",
          description: "Si delegar te sale natural, puedes ayudar a otros que no. Muchos managers están ahogados porque no saben soltar. Tú puedes compartir cómo lo haces: qué delegas, qué no, cómo das contexto, cómo haces seguimiento sin micromanagement. Ese conocimiento es valioso.",
          action: "Comparte con otros managers tu framework personal de delegación",
          targetOutcome: "Más managers que delegan efectivamente",
          category: 'MENTORING',
          priority: 'MEDIA',
          suggestedResources: [],
          estimatedWeeks: 4,
          scientificBasis: {
            summary: "Prácticas compartidas → Mejora organizacional",
            source: "Knowledge Sharing Research (Argote, 2012)",
            insight: "Compartir prácticas de gestión mejora rendimiento de peers en 20%"
          }
        }]
      },
      COLABORADOR: {
        blindSpot: [{
          title: "¿Pides permiso o pides perdón?",
          description: "Si siempre esperas aprobación para actuar, limitas tu impacto. Hay decisiones que podrías tomar solo pero prefieres validar 'por si acaso'. Eso te hace seguro pero también lento e indistinguible. A veces es mejor actuar y después informar, que pedir permiso y esperar. Obviamente, dentro de lo razonable.",
          action: "Identifica una decisión pequeña que puedes tomar sin preguntar y tómala. Después informa qué hiciste.",
          targetOutcome: "Mayor autonomía en tu trabajo diario",
          category: 'BEHAVIORAL_CHANGE',
          priority: 'MEDIA',
          suggestedResources: [],
          estimatedWeeks: 4,
          scientificBasis: {
            summary: "Iniciativa → Visibilidad y crecimiento",
            source: "Frese & Fay (2001) - Personal Initiative",
            insight: "Empleados con iniciativa son promovidos 2x más rápido"
          }
        }],
        development: [{
          title: "Propón soluciones, no solo problemas",
          description: "Cuando llevas un problema a tu jefe, ¿llevas también una propuesta de solución? Si solo llevas problemas, estás delegando hacia arriba. Eso te hace ver como alguien que necesita supervisión, no como alguien listo para más responsabilidad. Aunque tu solución no sea perfecta, el hecho de proponer demuestra que piensas.",
          action: "La próxima vez que tengas un problema, antes de ir a tu jefe prepara una propuesta de solución",
          targetOutcome: "Ser percibido como alguien que resuelve, no que escala",
          category: 'SKILL_DEVELOPMENT',
          priority: 'ALTA',
          suggestedResources: [],
          estimatedWeeks: 4,
          scientificBasis: {
            summary: "Propuestas → Percepción de potencial",
            source: "Executive Presence Research (Hewlett, 2014)",
            insight: "Traer soluciones aumenta percepción de potencial de liderazgo en 45%"
          }
        }],
        strength: [{
          title: "Toma más de lo que te corresponde",
          description: "Si la autonomía te sale natural, pide más. No esperes a que te deleguen, busca oportunidades de tomar responsabilidades que nadie está tomando. Esos espacios vacíos son oportunidades para demostrar que puedes manejar más de lo que tu rol dice. Los que avanzan no esperan permiso para crecer.",
          action: "Identifica una tarea o área que está huérfana y ofrécete para hacerte cargo",
          targetOutcome: "Expandir tu ámbito de influencia",
          category: 'EXPERIENCE_BUILDING',
          priority: 'MEDIA',
          suggestedResources: [],
          estimatedWeeks: 6,
          scientificBasis: {
            summary: "Job crafting → Satisfacción y crecimiento",
            source: "Wrzesniewski & Dutton (2001) - Job Crafting",
            insight: "Empleados que expanden su rol tienen 30% más satisfacción y crecimiento"
          }
        }]
      }
    },
    coachingTips: {
      blindSpot: [
        "¿Cuántas decisiones tomaste hoy que alguien de tu equipo podría haber tomado?",
        "Pregunta: '¿Qué pasaría si no estuvieras disponible una semana?'"
      ],
      development: [
        "Practica delegar resultados, no tareas.",
        "Haz seguimiento con preguntas, no con control."
      ],
      strength: [
        "Puede enseñar a otros managers a soltar control.",
        "Ideal para diseñar estructuras de autonomía."
      ]
    }
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 9. FEEDBACK EFECTIVO (LEAD-FEEDBACK)
  // ──────────────────────────────────────────────────────────────────────────
  'LEAD-FEEDBACK': {
    code: 'LEAD-FEEDBACK',
    name: 'Feedback Efectivo',
    keywords: ['feedback', 'retroalimentacion', 'reconocimiento', 'critica', 'constructivo', 'desarrollo'],

    strategies: {
      EJECUTIVO: {
        blindSpot: [{
          title: "¿La gente te da feedback honesto?",
          description: "A tu nivel, la gente tiene incentivos para decirte lo que quieres escuchar. Eso se siente bien pero es peligroso. Si nadie te dice que tu idea es mala, vas a implementar ideas malas. Si nadie te dice que tu comportamiento molesta, vas a seguir molestando. El feedback hacia arriba es difícil, tienes que buscarlo activamente.",
          action: "Pide a 3 personas feedback específico sobre algo que podrías mejorar. Escucha sin defender.",
          targetOutcome: "Recibir feedback honesto de forma regular",
          category: 'BEHAVIORAL_CHANGE',
          priority: 'ALTA',
          suggestedResources: [],
          estimatedWeeks: 4,
          scientificBasis: {
            summary: "Poder → Déficit de feedback",
            source: "Ashford & Tsui (1991) - Self-Regulation for Managerial Effectiveness",
            insight: "Ejecutivos que buscan feedback activamente son 25% más efectivos"
          }
        }],
        development: [{
          title: "Institucionaliza el feedback en la cultura",
          description: "Si tú das y recibes feedback, otros lo imitarán. Pero si depende de tu presencia, desaparece cuando no estás. Tu trabajo es hacer que el feedback sea parte de cómo funciona la organización. Que sea normal, esperado, y que no darlo sea lo raro. Eso requiere diseño, no solo ejemplo.",
          action: "Implementa un ritual de feedback (por ejemplo, al final de cada proyecto) que funcione sin ti",
          targetOutcome: "Cultura de feedback que se auto-sostiene",
          category: 'SKILL_DEVELOPMENT',
          priority: 'ALTA',
          suggestedResources: [],
          estimatedWeeks: 8,
          scientificBasis: {
            summary: "Rituales → Cultura sostenible",
            source: "Schein (2010) - Organizational Culture",
            insight: "El feedback ritualizado se convierte en norma cultural en 6 meses"
          }
        }],
        strength: [{
          title: "Modela conversaciones difíciles públicamente",
          description: "Si el feedback te sale natural, incluyendo el difícil, muéstrale a la organización cómo se hace. Cuando tienes que dar un mensaje duro y lo haces con respeto y claridad, otros aprenden que se puede. Tu forma de manejar conversaciones difíciles enseña más que cualquier taller de feedback.",
          action: "La próxima vez que tengas que dar feedback difícil a un gerente, hazlo de forma que otros puedan aprender del ejemplo",
          targetOutcome: "Normalizar las conversaciones difíciles en la organización",
          category: 'EXPERIENCE_BUILDING',
          priority: 'ALTA',
          suggestedResources: [],
          estimatedWeeks: 4,
          scientificBasis: {
            summary: "Modelar → Normalizar",
            source: "Bandura (1977) - Social Learning Theory",
            insight: "Comportamientos modelados por líderes se replican 3x más rápido"
          }
        }]
      },
      MANAGER: {
        blindSpot: [{
          title: "¿Tu feedback es específico o genérico?",
          description: "Decir 'buen trabajo' no es feedback, es halago vacío. Decir 'eso estuvo mal' no es feedback, es crítica sin dirección. El feedback útil es específico: qué hiciste, qué impacto tuvo, y qué podrías hacer diferente. Si tu equipo no puede actuar basándose en tu feedback, no les estás dando feedback, les estás dando ruido.",
          action: "Esta semana, cada vez que des feedback usa el formato: 'Cuando hiciste X, el impacto fue Y. Sugiero Z.'",
          targetOutcome: "Feedback que la gente puede usar para mejorar",
          category: 'SKILL_DEVELOPMENT',
          priority: 'ALTA',
          suggestedResources: [
            { type: 'PRACTICE', title: "Formato SBI: Situación-Comportamiento-Impacto" }
          ],
          estimatedWeeks: 4,
          scientificBasis: {
            summary: "Especificidad → Cambio de comportamiento",
            source: "Ilgen & Davis (2000) - Bearing Bad News",
            insight: "El feedback específico genera 3x más cambio de comportamiento que el genérico"
          }
        }],
        development: [{
          title: "Da feedback en tiempo real",
          description: "El feedback pierde 90% de su valor cuando lo guardas para la evaluación anual. Si alguien hace algo bien el lunes y se lo dices en diciembre, ya no sirve. Lo mismo con lo que hace mal. El feedback efectivo es inmediato. Mientras más cerca del evento, más útil. Esperar es cómodo pero inútil.",
          action: "Cuando veas algo que merece feedback (bueno o malo), dalo dentro de las próximas 24 horas",
          targetOutcome: "Feedback como hábito diario, no evento anual",
          category: 'BEHAVIORAL_CHANGE',
          priority: 'ALTA',
          suggestedResources: [],
          estimatedWeeks: 4,
          scientificBasis: {
            summary: "Inmediatez → Relevancia y aprendizaje",
            source: "Kluger & DeNisi (1996) - Feedback Intervention Theory",
            insight: "El feedback inmediato tiene 5x más impacto que el diferido"
          }
        }],
        strength: [{
          title: "Entrena a otros en feedback",
          description: "Si el feedback te sale natural, puedes ayudar a otros que lo evitan. Muchos managers tienen aversión a las conversaciones difíciles, no saben cómo empezar, o tienen miedo de la reacción. Tú puedes enseñarles que no es tan terrible y que los resultados valen la incomodidad.",
          action: "Ofrece hacer role-play de conversaciones difíciles con otros managers que lo necesiten",
          targetOutcome: "Más managers capaces de dar feedback efectivo",
          category: 'MENTORING',
          priority: 'MEDIA',
          suggestedResources: [],
          estimatedWeeks: 6,
          scientificBasis: {
            summary: "Práctica guiada → Confianza para dar feedback",
            source: "Ericsson (2006) - Deliberate Practice",
            insight: "El role-play aumenta confianza para dar feedback en 60%"
          }
        }]
      },
      COLABORADOR: {
        blindSpot: [{
          title: "¿Recibes bien el feedback o te defiendes?",
          description: "Puede que creas que recibes bien el feedback, pero tu lenguaje corporal o tus respuestas dicen otra cosa. Si cuando te dan feedback explicas, justificas o contra-argumentas, la otra persona aprende que no vale la pena dártelo. Con el tiempo, dejan de decirte cosas y pierdes información valiosa para crecer.",
          action: "La próxima vez que te den feedback, tu única respuesta será: 'Gracias, lo voy a pensar.' Sin peros.",
          targetOutcome: "Que la gente siga dándote feedback honesto",
          category: 'BEHAVIORAL_CHANGE',
          priority: 'ALTA',
          suggestedResources: [],
          estimatedWeeks: 4,
          scientificBasis: {
            summary: "Reacción defensiva → Fin del feedback",
            source: "Stone & Heen (2014) - Thanks for the Feedback",
            insight: "Las reacciones defensivas reducen feedback futuro en 70%"
          }
        }],
        development: [{
          title: "Pide feedback, no esperes a que te lo den",
          description: "Si esperas a que te den feedback, probablemente no llegue. La gente está ocupada, evita la incomodidad, o asume que ya sabes. Pero cuando pides feedback específico, lo haces fácil para el otro. Y demuestras que te importa mejorar, lo cual te hace ver bien.",
          action: "Pídele a tu jefe: '¿Qué es una cosa específica que podría hacer mejor en mi trabajo?'",
          targetOutcome: "Tener claridad sobre qué mejorar",
          category: 'BEHAVIORAL_CHANGE',
          priority: 'ALTA',
          suggestedResources: [],
          estimatedWeeks: 2,
          scientificBasis: {
            summary: "Buscar feedback → Más desarrollo",
            source: "Ashford (1986) - Feedback-Seeking Behavior",
            insight: "Quienes buscan feedback activamente desarrollan 2x más rápido"
          }
        }],
        strength: [{
          title: "Sé el que reconoce a otros",
          description: "Si dar feedback te sale fácil, úsalo para reconocer a tus compañeros. No esperes a que tu jefe lo haga. Cuando alguien hace algo bien, díselo. Cuando alguien te ayuda, agradécelo específicamente. Ese reconocimiento entre pares vale mucho y te posiciona como alguien positivo en el equipo.",
          action: "Esta semana, reconoce específicamente a 2 compañeros por algo que hicieron bien",
          targetOutcome: "Crear ambiente de reconocimiento en el equipo",
          category: 'EXPERIENCE_BUILDING',
          priority: 'BAJA',
          suggestedResources: [],
          estimatedWeeks: 2,
          scientificBasis: {
            summary: "Reconocimiento entre pares → Motivación y cohesión",
            source: "Gallup (2016) - Recognition Research",
            insight: "El reconocimiento entre pares tiene más impacto en motivación que el del jefe"
          }
        }]
      }
    },
    coachingTips: {
      blindSpot: [
        "¿Cuándo fue la última vez que reconociste algo específico?",
        "Pregunta: '¿Cómo reacciona tu equipo cuando les das feedback crítico?'"
      ],
      development: [
        "Practica el formato SBI juntos.",
        "Roleplay: simula una conversación de feedback difícil."
      ],
      strength: [
        "Puede capacitar a otros en técnicas de feedback.",
        "Ideal para ser coach interno."
      ]
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
    keywords: ['vision', 'estrategia', 'futuro', 'largo plazo', 'direccion', 'north star'],

    strategies: {
      EJECUTIVO: {
        blindSpot: [{
          title: "¿Tu equipo conoce tu visión?",
          description: "Tener visión no sirve si nadie más la conoce. Puede que tengas clarísimo hacia dónde vas, pero si le preguntas a 5 personas de tu equipo, te darán 5 respuestas diferentes. La visión en tu cabeza no es visión, es un secreto. Para que guíe a la organización, tiene que estar afuera, comunicada, repetida hasta el cansancio.",
          action: "Pregunta a 3 personas: '¿Hacia dónde vamos como área?' Si las respuestas varían mucho, hay trabajo por hacer.",
          targetOutcome: "Alineación de tu equipo con la visión",
          category: 'BEHAVIORAL_CHANGE',
          priority: 'ALTA',
          suggestedResources: [],
          estimatedWeeks: 4,
          scientificBasis: {
            summary: "Visión comunicada → Visión compartida",
            source: "Kotter (1996) - Leading Change",
            insight: "Los líderes subestiman 10x cuánto necesitan comunicar la visión"
          }
        }],
        development: [{
          title: "Dedica tiempo a pensar en el futuro",
          description: "Si el día a día te consume, no hay espacio para la estrategia. Y si tú no piensas en el futuro, ¿quién lo va a hacer? Tu equipo está ocupado ejecutando. Tu trabajo es levantar la cabeza y ver hacia dónde va la industria, la competencia, la tecnología. Eso requiere tiempo protegido, no lo que sobra de las reuniones.",
          action: "Bloquea 2 horas semanales en tu agenda solo para pensar, sin reuniones ni emails",
          targetOutcome: "Espacio protegido para pensamiento estratégico",
          category: 'BEHAVIORAL_CHANGE',
          priority: 'ALTA',
          suggestedResources: [],
          estimatedWeeks: 6,
          scientificBasis: {
            summary: "Tiempo para pensar → Calidad de estrategia",
            source: "Kaplan & Norton (2008) - Strategy Execution",
            insight: "Ejecutivos dedican menos del 5% de su tiempo a estrategia"
          }
        }],
        strength: [{
          title: "Comparte la visión externamente",
          description: "Tienes una visión clara del futuro. Posiciónate como referente. Cuando escribes o hablas sobre hacia dónde va la industria, posicionas a tu empresa como líder de pensamiento. No es vanidad, es estrategia. Clientes, talento e inversionistas se acercan a quienes ven con claridad hacia dónde va el mundo.",
          action: "Escribe un artículo o da una charla sobre el futuro de la industria en un evento externo",
          targetOutcome: "Posicionar a la empresa como líder de pensamiento",
          category: 'EXPERIENCE_BUILDING',
          priority: 'MEDIA',
          suggestedResources: [],
          estimatedWeeks: 8,
          scientificBasis: {
            summary: "Thought leadership → Atracción de talento y clientes",
            source: "Edelman Trust Barometer (2020)",
            insight: "Empresas con líderes visibles atraen 3x más talento top"
          }
        }]
      },
      MANAGER: {
        blindSpot: [{
          title: "¿Conectas tu trabajo con la estrategia mayor?",
          description: "Si solo ves tu área, pierdes la perspectiva del negocio. Puede que tu equipo esté cumpliendo sus metas pero contribuyendo poco a lo que realmente importa. O puede que estés peleando batallas que ya no son relevantes. Entender cómo tu área encaja en el todo te permite priorizar mejor y tener conversaciones más estratégicas.",
          action: "Pregunta a tu jefe: '¿Cómo contribuye mi área a la estrategia de la empresa?' y ajusta prioridades según la respuesta.",
          targetOutcome: "Claridad de cómo tu trabajo se conecta con el todo",
          category: 'BEHAVIORAL_CHANGE',
          priority: 'ALTA',
          suggestedResources: [],
          estimatedWeeks: 4,
          scientificBasis: {
            summary: "Contexto estratégico → Mejores prioridades",
            source: "Hambrick (1984) - Upper Echelons Theory",
            insight: "Managers con perspectiva sistémica toman 40% mejores decisiones"
          }
        }],
        development: [{
          title: "Piensa un paso más adelante",
          description: "Tu trabajo operativo consume tu presente. Pero si no piensas en qué viene después, siempre vas a estar reaccionando en lugar de anticipando. No necesitas predecir el futuro perfectamente, pero sí hacerte preguntas: ¿Qué necesitará mi área en 2 años? ¿Qué capacidades nos faltan? ¿Qué puede cambiar?",
          action: "Dedica 30 minutos esta semana a pensar: '¿Cómo debería verse mi área en 2 años?'",
          targetOutcome: "Visión de mediano plazo para tu área",
          category: 'SKILL_DEVELOPMENT',
          priority: 'MEDIA',
          suggestedResources: [],
          estimatedWeeks: 6,
          scientificBasis: {
            summary: "Anticipación → Preparación → Ventaja",
            source: "Day & Schoemaker (2006) - Peripheral Vision",
            insight: "Managers que anticipan tienen equipos 30% mejor preparados para cambios"
          }
        }],
        strength: [{
          title: "Comparte tu visión de área con otros managers",
          description: "Si ves con claridad hacia dónde va tu área, compártelo. Otros managers pueden estar tan metidos en lo operativo que perdieron perspectiva. Tu visión puede inspirarlos a pensar diferente. Y cuando compartes, también clarificas tu propio pensamiento.",
          action: "En la próxima reunión de gerencia, comparte hacia dónde ves que va tu área y cómo se conecta con el resto",
          targetOutcome: "Influir en la visión colectiva de la gerencia",
          category: 'EXPERIENCE_BUILDING',
          priority: 'MEDIA',
          suggestedResources: [],
          estimatedWeeks: 4,
          scientificBasis: {
            summary: "Visión compartida → Alineación horizontal",
            source: "Senge (1990) - The Fifth Discipline",
            insight: "Visiones compartidas entre peers mejoran coordinación en 35%"
          }
        }]
      },
      COLABORADOR: {
        blindSpot: [{
          title: "¿Entiendes por qué haces lo que haces?",
          description: "Es fácil perderse en las tareas del día a día sin entender cómo conectan con algo más grande. Pero cuando no entiendes el propósito, priorizas mal, te desmotivas más fácil, y pierdes oportunidades de agregar más valor. Entender el 'para qué' de tu trabajo no es filosofía, es practicidad.",
          action: "Pregunta a tu jefe: '¿Por qué es importante mi rol para el área? ¿Qué pasaría si no existiera?'",
          targetOutcome: "Claridad del propósito de tu rol",
          category: 'BEHAVIORAL_CHANGE',
          priority: 'MEDIA',
          suggestedResources: [],
          estimatedWeeks: 2,
          scientificBasis: {
            summary: "Propósito claro → Motivación y enfoque",
            source: "Deci & Ryan (2000) - Self-Determination Theory",
            insight: "Empleados que entienden su propósito son 30% más comprometidos"
          }
        }],
        development: [{
          title: "Conecta tu trabajo con el cliente final",
          description: "Tu trabajo impacta a alguien al final de la cadena. Puede que no lo veas directamente, pero existe. Cuando entiendes quién se beneficia de lo que haces, tu trabajo tiene más sentido. Y cuando tiene más sentido, lo haces mejor.",
          action: "Traza la línea: tu tarea → siguientes pasos → cliente final. ¿Cómo impacta tu trabajo a esa persona?",
          targetOutcome: "Conexión clara entre tu trabajo y el valor final",
          category: 'KNOWLEDGE_ACQUISITION',
          priority: 'MEDIA',
          suggestedResources: [],
          estimatedWeeks: 4,
          scientificBasis: {
            summary: "Significado → Calidad de trabajo",
            source: "Grant (2007) - Relational Job Design",
            insight: "Ver impacto en cliente final mejora calidad de trabajo en 25%"
          }
        }],
        strength: [{
          title: "Propón ideas que miren al futuro",
          description: "Si te sale fácil ver más allá de lo inmediato, usa eso para proponer. Cuando ves algo que viene y otros no lo ven, tienes la oportunidad de posicionarte como alguien que piensa diferente. No necesitas tener razón siempre, pero proponer ideas de futuro te distingue de los que solo ejecutan.",
          action: "Prepara una idea o propuesta sobre algo que crees que viene y preséntala a tu jefe",
          targetOutcome: "Ser percibido como alguien que piensa estratégicamente",
          category: 'EXPERIENCE_BUILDING',
          priority: 'BAJA',
          suggestedResources: [],
          estimatedWeeks: 6,
          scientificBasis: {
            summary: "Propuestas forward-thinking → Percepción de potencial",
            source: "Executive Presence Research (Hewlett, 2014)",
            insight: "Ideas de futuro aumentan percepción de potencial de liderazgo en 40%"
          }
        }]
      }
    },
    coachingTips: {
      blindSpot: [
        "¿Puede articular su visión en 2 minutos?",
        "Pregunta: '¿Hacia dónde va tu área en 3 años?'"
      ],
      development: [
        "Asigna un proyecto de planificación estratégica.",
        "Expón a conversaciones de nivel superior."
      ],
      strength: [
        "Puede liderar ejercicios de visión con otros equipos.",
        "Ideal para roles de transformación."
      ]
    }
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 11. GESTIÓN DEL CAMBIO (STRAT-CHANGE)
  // ──────────────────────────────────────────────────────────────────────────
  'STRAT-CHANGE': {
    code: 'STRAT-CHANGE',
    name: 'Gestión del Cambio',
    keywords: ['cambio', 'change', 'transformacion', 'transicion', 'gestion cambio', 'change management'],

    strategies: {
      EJECUTIVO: {
        blindSpot: [{
          title: "¿Subestimas la resistencia al cambio?",
          description: "Los ejecutivos tienden a subestimar cuánto tiempo y esfuerzo requiere que la gente cambie. Ven el destino con claridad y asumen que otros lo verán igual. Pero para la gente que va a vivir el cambio, lo que tú ves como oportunidad ellos lo ven como amenaza. Si no inviertes en gestionar esa resistencia, tu cambio va a morir en la implementación.",
          action: "Antes de tu próximo cambio importante, pregunta: '¿Qué van a perder las personas afectadas? ¿Cómo puedo ayudarlas con eso?'",
          targetOutcome: "Anticipar y gestionar la resistencia proactivamente",
          category: 'BEHAVIORAL_CHANGE',
          priority: 'ALTA',
          suggestedResources: [],
          estimatedWeeks: 4,
          scientificBasis: {
            summary: "Subestimar resistencia → Cambio fallido",
            source: "Kotter (1996) - Leading Change",
            insight: "70% de las iniciativas de cambio fallan por subestimar la resistencia humana"
          }
        }],
        development: [{
          title: "Comunica el 'porqué' antes del 'qué'",
          description: "Cuando anuncias un cambio, tu instinto es explicar qué va a cambiar. Pero la gente necesita entender primero por qué es necesario. Sin el porqué, el qué suena arbitrario. Y cuando algo suena arbitrario, la gente resiste. El porqué crea contexto que hace que el qué haga sentido.",
          action: "En tu próxima comunicación de cambio, dedica el doble de tiempo al 'por qué es necesario' que al 'qué vamos a hacer'",
          targetOutcome: "Cambios que la gente entiende y acepta mejor",
          category: 'SKILL_DEVELOPMENT',
          priority: 'ALTA',
          suggestedResources: [
            { type: 'BOOK', title: "Switch", provider: "Chip & Dan Heath" }
          ],
          estimatedWeeks: 6,
          scientificBasis: {
            summary: "Contexto → Aceptación",
            source: "Heath & Heath (2010) - Switch",
            insight: "Cambios con contexto claro tienen 3x más adopción"
          }
        }],
        strength: [{
          title: "Lidera la transformación más difícil",
          description: "Si gestionar cambio te sale natural, ve por los cambios que otros evitan. Las transformaciones difíciles, las que tocan cultura, las que requieren cerrar cosas o despedir gente. Esos cambios necesitan alguien que pueda sostener la presión y mantener la dirección cuando todo el mundo quiere volver atrás.",
          action: "Ofrécete para liderar o sponsor la próxima transformación que nadie quiere tomar",
          targetOutcome: "Transformación exitosa en un área difícil",
          category: 'EXPERIENCE_BUILDING',
          priority: 'ALTA',
          suggestedResources: [],
          estimatedWeeks: 12,
          scientificBasis: {
            summary: "Líderes de cambio → Activo estratégico",
            source: "Heifetz (2009) - The Practice of Adaptive Leadership",
            insight: "Líderes capaces de cambio difícil son los más escasos y valiosos"
          }
        }]
      },
      MANAGER: {
        blindSpot: [{
          title: "¿Proteges a tu equipo del cambio o los ayudas a navegarlo?",
          description: "Algunos managers creen que proteger a su equipo significa aislarlos del cambio. Pero eso solo retrasa lo inevitable y los deja menos preparados. Otros hacen el error opuesto: transmiten su propia ansiedad sobre el cambio y la multiplican. Tu trabajo es traducir el cambio en algo que tu equipo pueda procesar y actuar.",
          action: "Pregúntate: '¿Estoy ayudando a mi equipo a entender y adaptarse, o estoy siendo un obstáculo o un amplificador de ansiedad?'",
          targetOutcome: "Ser facilitador del cambio, no obstáculo",
          category: 'BEHAVIORAL_CHANGE',
          priority: 'ALTA',
          suggestedResources: [],
          estimatedWeeks: 4,
          scientificBasis: {
            summary: "Manager como traductor → Adaptación efectiva",
            source: "Bridges (2009) - Managing Transitions",
            insight: "Equipos con managers-traductores adoptan cambios 50% más rápido"
          }
        }],
        development: [{
          title: "Involucra a tu equipo en el 'cómo'",
          description: "Cuando el cambio viene de arriba, el 'qué' ya está decidido. Pero el 'cómo' usualmente tiene margen. Involucrar a tu equipo en el cómo les da sensación de control y produce mejores soluciones porque ellos conocen la realidad operativa. No es democracia, es inteligencia colectiva.",
          action: "En el próximo cambio que debas implementar, pregunta a tu equipo: '¿Cómo creen que deberíamos hacerlo?'",
          targetOutcome: "Cambios mejor implementados con menos resistencia",
          category: 'SKILL_DEVELOPMENT',
          priority: 'ALTA',
          suggestedResources: [],
          estimatedWeeks: 6,
          scientificBasis: {
            summary: "Participación → Ownership → Adopción",
            source: "Lewin (1947) - Change Theory",
            insight: "Participación en el diseño aumenta adopción de cambio en 40%"
          }
        }],
        strength: [{
          title: "Conviértete en agente de cambio",
          description: "Si el cambio te sale natural, puedes ser quien ayuda a la organización a cambiar. No solo implementando lo que te dicen, sino identificando qué necesita cambiar y proponiendo. Los agentes de cambio internos son escasos y valiosos. Si tienes esa capacidad, ponla al servicio de la organización.",
          action: "Identifica algo en tu área que debería cambiar y propón un plan para hacerlo",
          targetOutcome: "Impulsar cambios positivos proactivamente",
          category: 'EXPERIENCE_BUILDING',
          priority: 'MEDIA',
          suggestedResources: [],
          estimatedWeeks: 8,
          scientificBasis: {
            summary: "Agentes de cambio internos → Innovación organizacional",
            source: "Rogers (2003) - Diffusion of Innovations",
            insight: "Organizaciones con agentes de cambio internos innovan 2x más rápido"
          }
        }]
      },
      COLABORADOR: {
        blindSpot: [{
          title: "¿Te resistes al cambio más de lo que crees?",
          description: "Todos nos resistimos al cambio de alguna forma. A veces es obvio (quejas, críticas), a veces es sutil (demora en adoptar, hacer lo mínimo). No es malo ser cauteloso, pero si tu resistencia es tu modo default, afectas tu reputación y pierdes oportunidades. La pregunta es: ¿tu resistencia es reflexiva o es automática?",
          action: "En el próximo cambio, antes de resistir pregúntate: '¿Qué tiene de bueno esto que no estoy viendo?'",
          targetOutcome: "Respuesta más reflexiva ante los cambios",
          category: 'BEHAVIORAL_CHANGE',
          priority: 'ALTA',
          suggestedResources: [],
          estimatedWeeks: 4,
          scientificBasis: {
            summary: "Resistencia automática → Sesgo de status quo",
            source: "Kahneman (2011) - Thinking Fast and Slow",
            insight: "El sesgo de status quo hace que veamos pérdidas 2x más que ganancias"
          }
        }],
        development: [{
          title: "Sé de los primeros en adoptar",
          description: "En todo cambio hay quienes adoptan temprano y quienes se rezagan. Los que adoptan temprano tienen ventajas: aprenden primero, ayudan a dar forma al cambio, y son vistos como colaborativos. Los que se rezagan son percibidos como obstáculos. ¿En qué grupo quieres estar?",
          action: "En el próximo cambio, ofrécete como piloto o early adopter",
          targetOutcome: "Ser percibido como alguien que abraza el cambio",
          category: 'BEHAVIORAL_CHANGE',
          priority: 'MEDIA',
          suggestedResources: [],
          estimatedWeeks: 4,
          scientificBasis: {
            summary: "Early adopters → Influencia y oportunidad",
            source: "Rogers (2003) - Diffusion of Innovations",
            insight: "Los early adopters tienen 3x más influencia en cómo evoluciona el cambio"
          }
        }],
        strength: [{
          title: "Ayuda a otros con el cambio",
          description: "Si te adaptas fácil, puedes ser quien ayuda a los que no. Cuando hay un cambio, siempre hay gente perdida, frustrada, o que necesita más tiempo. Tú puedes ser su guía informal. No imponiéndote, sino estando disponible para ayudar. Eso te posiciona bien y ayuda a la organización.",
          action: "Identifica a alguien que está luchando con un cambio reciente y ofrécele ayuda concreta",
          targetOutcome: "Facilitar la transición de otros",
          category: 'MENTORING',
          priority: 'BAJA',
          suggestedResources: [],
          estimatedWeeks: 4,
          scientificBasis: {
            summary: "Apoyo de pares → Adopción más rápida",
            source: "Social Support Theory (Cohen & Wills, 1985)",
            insight: "El apoyo de pares reduce tiempo de adaptación en 30%"
          }
        }]
      }
    },
    coachingTips: {
      blindSpot: [
        "¿Subestima cuánto tiempo toma que la gente cambie?",
        "Pregunta: '¿Cómo reaccionó tu equipo al último cambio importante?'"
      ],
      development: [
        "Practica comunicar el 'porqué' del cambio.",
        "Planifica tiempo para gestionar la transición humana."
      ],
      strength: [
        "Puede liderar transformaciones complejas.",
        "Ideal para roles de change management."
      ]
    }
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 12. INFLUENCIA ESTRATÉGICA (STRAT-INFLUENCE)
  // ──────────────────────────────────────────────────────────────────────────
  'STRAT-INFLUENCE': {
    code: 'STRAT-INFLUENCE',
    name: 'Influencia Estratégica',
    keywords: ['influencia', 'influence', 'persuasion', 'politica', 'alianzas', 'stakeholders', 'negociacion'],

    strategies: {
      EJECUTIVO: {
        blindSpot: [{
          title: "¿Conoces el mapa político de tu organización?",
          description: "Las decisiones importantes no se toman solo con buenos argumentos. Se toman en conversaciones informales, en alianzas, en intercambios de apoyo. Si no entiendes quién influye a quién, qué intereses tiene cada actor, y cómo se forman las coaliciones, tus ideas van a morir aunque sean brillantes. No es maquiavelismo, es realismo organizacional.",
          action: "Dibuja el mapa: ¿Quiénes son los decisores clave? ¿Qué les importa? ¿Con quién debes alinearte para lograr X?",
          targetOutcome: "Claridad del landscape político organizacional",
          category: 'BEHAVIORAL_CHANGE',
          priority: 'ALTA',
          suggestedResources: [],
          estimatedWeeks: 4,
          scientificBasis: {
            summary: "Inteligencia política → Efectividad ejecutiva",
            source: "Pfeffer (1992) - Managing with Power",
            insight: "Ejecutivos políticamente astutos logran 50% más de sus iniciativas"
          }
        }],
        development: [{
          title: "Construye alianzas antes de necesitarlas",
          description: "El momento de construir una alianza no es cuando necesitas el voto de alguien. Es mucho antes. Las relaciones se construyen en tiempos de calma para usarse en tiempos de necesidad. Si solo te acercas a alguien cuando necesitas algo, no tienes una alianza, tienes una transacción.",
          action: "Identifica 3 stakeholders clave con quienes tu relación es débil. Agenda un café sin agenda.",
          targetOutcome: "Red de alianzas que puedes activar cuando necesites",
          category: 'SKILL_DEVELOPMENT',
          priority: 'ALTA',
          suggestedResources: [],
          estimatedWeeks: 8,
          scientificBasis: {
            summary: "Relaciones previas → Influencia cuando importa",
            source: "Cialdini (2006) - Influence",
            insight: "Las relaciones previas aumentan éxito de persuasión en 70%"
          }
        }],
        strength: [{
          title: "Usa tu influencia para causas importantes",
          description: "Si la influencia te sale natural, tienes una responsabilidad. Puedes usarla para avanzar tu agenda personal o para causas que beneficien a más gente. Los mejores líderes usan su capital político para remover obstáculos, apoyar iniciativas importantes, y dar voz a quienes no la tienen. ¿Para qué estás usando tu influencia?",
          action: "Identifica una iniciativa valiosa que está trabada y usa tu influencia para desbloquearla",
          targetOutcome: "Impacto positivo más allá de tu área directa",
          category: 'EXPERIENCE_BUILDING',
          priority: 'ALTA',
          suggestedResources: [],
          estimatedWeeks: 8,
          scientificBasis: {
            summary: "Influencia para bien común → Legado de liderazgo",
            source: "Greenleaf (1977) - Servant Leadership",
            insight: "Líderes que usan influencia para otros generan 3x más lealtad"
          }
        }]
      },
      MANAGER: {
        blindSpot: [{
          title: "¿Dependes solo de tu jefe para conseguir cosas?",
          description: "Si tu único canal de influencia es hacia arriba, eres frágil. Cuando necesitas algo de otra área, tienes que pedirle a tu jefe que le pida al jefe del otro. Eso es lento, consume capital político de tu jefe, y te hace ver como alguien que no puede resolver solo. La influencia lateral, con tus pares, es igual de importante.",
          action: "Identifica algo que necesitas de otra área y consíguelo directamente, sin escalar.",
          targetOutcome: "Capacidad de conseguir cosas lateralmente",
          category: 'BEHAVIORAL_CHANGE',
          priority: 'ALTA',
          suggestedResources: [],
          estimatedWeeks: 6,
          scientificBasis: {
            summary: "Influencia lateral → Autonomía efectiva",
            source: "Kaplan (2011) - The 360 Degree Leader",
            insight: "Managers con influencia lateral son 40% más efectivos"
          }
        }],
        development: [{
          title: "Aprende a vender tus ideas",
          description: "Tener buenas ideas no es suficiente. Tienes que saber venderlas. Eso no significa manipular, significa presentar tus ideas de forma que conecten con los intereses de tu audiencia. ¿Qué les importa? ¿Cómo tu idea les ayuda? ¿Qué objeciones van a tener? Si no piensas en esto, tus ideas mueren en la presentación.",
          action: "Antes de tu próxima propuesta, prepara: '¿Qué gana mi audiencia con esto? ¿Qué les preocupa?'",
          targetOutcome: "Propuestas que se aprueban más fácilmente",
          category: 'SKILL_DEVELOPMENT',
          priority: 'ALTA',
          suggestedResources: [],
          estimatedWeeks: 6,
          scientificBasis: {
            summary: "Perspectiva del otro → Persuasión efectiva",
            source: "Fisher & Ury (1981) - Getting to Yes",
            insight: "Entender intereses del otro aumenta éxito de negociación en 65%"
          }
        }],
        strength: [{
          title: "Sé el conector entre áreas",
          description: "Si te sale natural influir y conectar, puedes ser el puente entre áreas que no se hablan. Las organizaciones tienen silos, y alguien tiene que romperlos. Ese puedes ser tú. Cuando conectas a la gente correcta, problemas que parecían imposibles se resuelven solos.",
          action: "Identifica dos áreas que tienen un problema común pero no lo saben. Conéctalos.",
          targetOutcome: "Resolver problemas conectando personas",
          category: 'EXPERIENCE_BUILDING',
          priority: 'MEDIA',
          suggestedResources: [],
          estimatedWeeks: 6,
          scientificBasis: {
            summary: "Brokers organizacionales → Alto valor",
            source: "Burt (2004) - Structural Holes",
            insight: "Quienes conectan silos capturan 20% más oportunidades"
          }
        }]
      },
      COLABORADOR: {
        blindSpot: [{
          title: "¿Conoces gente fuera de tu equipo inmediato?",
          description: "Tu red de contactos afecta tu capacidad de hacer cosas. Si solo conoces a tu equipo directo, dependes de tu jefe para todo lo que requiera otras áreas. Eso te limita y te hace menos visible. Conocer gente en otros equipos no es política, es ampliar tu capacidad de acción.",
          action: "Preséntate a alguien de otra área con quien tu trabajo se relaciona",
          targetOutcome: "Ampliar tu red dentro de la empresa",
          category: 'BEHAVIORAL_CHANGE',
          priority: 'BAJA',
          suggestedResources: [],
          estimatedWeeks: 6,
          scientificBasis: {
            summary: "Red amplia → Más recursos y oportunidades",
            source: "Granovetter (1973) - Strength of Weak Ties",
            insight: "Los contactos fuera del círculo inmediato son los más valiosos para oportunidades"
          }
        }],
        development: [{
          title: "Aprende a pedir ayuda efectivamente",
          description: "Pedir ayuda es una habilidad. Si pides mal, la gente te ayuda a regañadientes o no te ayuda. Si pides bien, les haces fácil decir que sí. ¿Cómo pides bien? Siendo específico: qué necesitas, para cuándo, y cómo impacta si te ayudan. Mientras más fácil sea ayudarte, más ayuda recibes.",
          action: "La próxima vez que necesites algo, sé específico: qué necesitas, para cuándo, y cómo impacta",
          targetOutcome: "Mayor efectividad al pedir colaboración",
          category: 'SKILL_DEVELOPMENT',
          priority: 'MEDIA',
          suggestedResources: [],
          estimatedWeeks: 4,
          scientificBasis: {
            summary: "Pedidos claros → Más ayuda recibida",
            source: "Grant (2013) - Give and Take",
            insight: "Pedidos específicos se cumplen 3x más que los vagos"
          }
        }],
        strength: [{
          title: "Conecta personas clave",
          description: "Conoces a todos. Haz que la gente correcta se hable. Cuando ves que alguien necesita algo que otro tiene, tú puedes ser el puente. No necesitas un rol formal para esto, solo estar atento y actuar. Cada conexión que facilitas construye tu reputación como alguien que hace que las cosas pasen.",
          action: "Presenta a dos personas de distintas áreas que podrían beneficiarse de conocerse",
          targetOutcome: "Fomentar la colaboración informal",
          category: 'EXPERIENCE_BUILDING',
          priority: 'BAJA',
          suggestedResources: [],
          estimatedWeeks: 2,
          scientificBasis: {
            summary: "Facilitador de conexiones → Alto valor social",
            source: "Burt (2004) - Structural Holes",
            insight: "Los conectores son percibidos como más influyentes aunque no tengan cargo"
          }
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
      strength: [
        "Es un conector natural.",
        "Ideal para proyectos cross-funcionales."
      ]
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
        description: "Hay una diferencia entre cómo te evalúas y cómo te ven. Esa información es valiosa. A tu nivel, la gente tiende a decirte lo que quieres escuchar, no lo que necesitas saber. Los puntos ciegos crecen en silencio, y cuando finalmente los ves, ya han causado daño. Buscar activamente perspectivas diferentes no es inseguridad, es inteligencia.",
        action: "Pide a 2 personas de confianza feedback específico sobre esta competencia",
        targetOutcome: "Entender la brecha de percepción",
        category: 'BEHAVIORAL_CHANGE',
        priority: 'ALTA',
        suggestedResources: [],
        estimatedWeeks: 4,
        scientificBasis: {
          summary: "Feedback externo → Autoconciencia precisa",
          source: "Atwater & Yammarino (1992) - Self-Other Agreement",
          insight: "La autoconciencia precisa es el mejor predictor de efectividad ejecutiva"
        }
      }],
      development: [{
        title: "Define una práctica semanal",
        description: "Las competencias se desarrollan con práctica deliberada, no con buenas intenciones. Saber qué mejorar es el 10% del trabajo. El 90% es practicar consistentemente hasta que el nuevo comportamiento sea automático. Sin una práctica definida, el desarrollo queda en promesa y nunca se materializa.",
        action: "Elige una acción pequeña relacionada con esta competencia y hazla cada semana",
        targetOutcome: "Crear un hábito de mejora",
        category: 'SKILL_DEVELOPMENT',
        priority: 'MEDIA',
        suggestedResources: [],
        estimatedWeeks: 8,
        scientificBasis: {
          summary: "Práctica deliberada → Desarrollo real",
          source: "Ericsson (2006) - The Cambridge Handbook of Expertise",
          insight: "Se necesitan ~66 días de práctica para formar un nuevo hábito"
        }
      }],
      strength: [{
        title: "Comparte tu maestría",
        description: "Eres un referente en esta competencia. Eleva el estándar de la organización. Cuando compartes lo que sabes, no pierdes nada y ganas mucho: clarificas tu propio pensamiento, posicionas tu expertise, y elevas a otros. El conocimiento guardado no crece; el conocimiento compartido se multiplica.",
        action: "Prepara una Masterclass o documento de visión sobre este tema para la empresa",
        targetOutcome: "Difundir conocimiento experto",
        category: 'MENTORING',
        priority: 'MEDIA',
        suggestedResources: [],
        estimatedWeeks: 6,
        scientificBasis: {
          summary: "Enseñar → Consolidar y multiplicar",
          source: "Protégé Effect Research (Chase et al., 2009)",
          insight: "Enseñar consolida el dominio propio mientras multiplica capacidad organizacional"
        }
      }]
    },
    MANAGER: {
      blindSpot: [{
        title: "Pide feedback a tu equipo",
        description: "Tu equipo ve cosas que tu jefe no ve. Esa perspectiva completa el cuadro. Ellos ven cómo tomas decisiones bajo presión, cómo manejas el estrés, cómo tratas a la gente cuando nadie importante está mirando. Si solo te evalúa tu jefe, tienes una visión incompleta de ti mismo.",
        action: "Pregunta a 2 personas de tu equipo cómo perciben esta competencia en ti",
        targetOutcome: "Obtener una visión más completa",
        category: 'BEHAVIORAL_CHANGE',
        priority: 'ALTA',
        suggestedResources: [],
        estimatedWeeks: 4,
        scientificBasis: {
          summary: "Feedback 360 → Visión completa",
          source: "London & Smither (1995) - Can Multi-Source Feedback Change Perceptions?",
          insight: "El feedback desde múltiples fuentes predice desempeño mejor que solo el del jefe"
        }
      }],
      development: [{
        title: "Observa a alguien que lo haga bien",
        description: "A veces la mejor forma de aprender es observar. Identifica a alguien que destaque en esto. No para copiar exactamente, sino para entender qué hace diferente. A veces una conversación o una observación te revela algo que ningún libro puede enseñar.",
        action: "Pide permiso para observar cómo maneja situaciones relacionadas con esta competencia",
        targetOutcome: "Aprender de un modelo a seguir",
        category: 'KNOWLEDGE_ACQUISITION',
        priority: 'MEDIA',
        suggestedResources: [],
        estimatedWeeks: 6,
        scientificBasis: {
          summary: "Modelamiento → Aprendizaje acelerado",
          source: "Bandura (1977) - Social Learning Theory",
          insight: "Aprender observando es 4x más rápido que prueba y error"
        }
      }],
      strength: [{
        title: "Documenta la mejor práctica",
        description: "Lo haces mejor que nadie. Asegúrate de que no se pierda si te vas. El conocimiento que está solo en tu cabeza es frágil. Cuando lo documentas, lo haces accesible para otros y creas algo que perdura más allá de tu presencia. Es tu legado en la organización.",
        action: "Crea un playbook o guía de 'Cómo hacerlo bien' para futuros líderes",
        targetOutcome: "Estandarizar la excelencia",
        category: 'SKILL_DEVELOPMENT',
        priority: 'MEDIA',
        suggestedResources: [],
        estimatedWeeks: 4,
        scientificBasis: {
          summary: "Documentación → Conocimiento duradero",
          source: "Nonaka & Takeuchi (1995) - The Knowledge-Creating Company",
          insight: "El conocimiento documentado sobrevive la rotación de personal"
        }
      }]
    },
    COLABORADOR: {
      blindSpot: [{
        title: "Entiende cómo te perciben",
        description: "Hay una diferencia entre tu autoevaluación y la de tu jefatura. Vale la pena explorarla. No para cambiar quién eres, sino para entender cómo te ven. A veces hacemos cosas sin darnos cuenta que afectan cómo nos perciben. Esa brecha es información valiosa para tu desarrollo.",
        action: "Pregunta a tu jefe o a un compañero: '¿Cómo me ves en esta área?'",
        targetOutcome: "Identificar la brecha de percepción",
        category: 'BEHAVIORAL_CHANGE',
        priority: 'MEDIA',
        suggestedResources: [],
        estimatedWeeks: 2,
        scientificBasis: {
          summary: "Autoconocimiento → Base del desarrollo",
          source: "Goleman (1998) - Working with Emotional Intelligence",
          insight: "La autoconciencia es la competencia fundacional de todas las demás"
        }
      }],
      development: [{
        title: "Practica en situaciones de bajo riesgo",
        description: "Las competencias se desarrollan practicando. Busca oportunidades pequeñas para ejercitar. No tienes que esperar el gran momento para practicar. Las situaciones cotidianas de bajo riesgo son el mejor gimnasio para desarrollar habilidades que después usarás en momentos importantes.",
        action: "Identifica una situación esta semana donde puedas practicar esta competencia",
        targetOutcome: "Ganar confianza gradualmente",
        category: 'EXPERIENCE_BUILDING',
        priority: 'MEDIA',
        suggestedResources: [],
        estimatedWeeks: 6,
        scientificBasis: {
          summary: "Práctica de bajo riesgo → Confianza para alto riesgo",
          source: "Bandura (1997) - Self-Efficacy",
          insight: "Éxitos pequeños construyen autoeficacia para desafíos mayores"
        }
      }],
      strength: [{
        title: "Ayuda a un compañero",
        description: "Tienes talento de sobra en esto. Úsalo para ayudar a alguien que le cuesta. No necesitas ser jefe para desarrollar a otros. Cuando ayudas a un compañero, refuerzas tu propio dominio y construyes relaciones. Es ganar-ganar.",
        action: "Identifica a un colega con dificultades en esta área y ofrécele apoyo puntual",
        targetOutcome: "Elevar el nivel del equipo",
        category: 'MENTORING',
        priority: 'BAJA',
        suggestedResources: [],
        estimatedWeeks: 4,
        scientificBasis: {
          summary: "Ayudar a otros → Consolidar fortaleza",
          source: "Grant (2013) - Give and Take",
          insight: "Ayudar a otros refuerza el dominio propio y construye capital social"
        }
      }]
    }
  },

  coachingTips: {
    blindSpot: [
      "Usa ejemplos concretos, no opiniones generales.",
      "Pregunta: '¿En qué situación específica viste esto?'"
    ],
    development: [
      "Enfócate en prácticas, no en teoría.",
      "Define indicadores claros de progreso."
    ],
    strength: [
      "Busca oportunidades para que enseñe a otros.",
      "Reconoce públicamente esta fortaleza."
    ]
  }
}
