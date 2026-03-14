// ════════════════════════════════════════════════════════════════════════════
// TalentNarrativeService — Narrativas de talento a nivel INDIVIDUAL
// Genera contexto narrativo cuando un manager revisa candidatos a sucesor.
// NO es feedback al empleado — es inteligencia para el decisor.
// NO toca ExecutiveNarrativeService (narrativas organizacionales).
//
// Versión: 2.0 — Revisión Panel de Expertos OD + UX
// Principio: Las narrativas interpretan la implicación organizacional
// del dato. No afirman hechos que el sistema no puede comprobar.
// Usan condicional cuando se trata de comportamiento probable.
// ════════════════════════════════════════════════════════════════════════════

export interface IndividualTalentNarrative {
  headline: string;
  context: string;
  urgencySignal: string | null;
  recommendedAction: string;
  urgencyLevel: 'CRITICA' | 'ALTA' | 'MEDIA' | 'BAJA';
  conflictAlert?: string;
}

export class TalentNarrativeService {
  /**
   * Genera narrativa individual basada en la combinación de cuadrantes.
   * Los valores de riskQuadrant y mobilityQuadrant son strings internos
   * del enum (ej: 'FUGA_CEREBROS', 'SUCESOR_NATURAL').
   */
  static getIndividualNarrative(
    riskQuadrant: string | null,
    mobilityQuadrant: string | null,
    roleFitScore: number | null,
    employeeName?: string
  ): IndividualTalentNarrative | null {

    const name = employeeName || 'Esta persona';

    // ════════════════════════════════════════════════════════════════════════
    // CASO 6 — Sin clasificación activa
    // Fue evaluado pero no cruza en los cuadrantes (test ácido: valor = 2)
    // ════════════════════════════════════════════════════════════════════════
    if (!riskQuadrant && !mobilityQuadrant) {
      return {
        headline: 'Sin clasificación de talento activa',
        context:
          `${name} fue evaluado pero no cruza en las matrices de talento. ` +
          'Puede estar en zona neutral de Aspiración o Engagement — ' +
          'el sistema no clasifica hasta tener una señal clara en alguna dirección.',
        urgencySignal: null,
        recommendedAction:
          `Revisar el Centro de Acción de Talento para ${name} — ` +
          'ahí puedes ver qué factores están en zona neutral y decidir ' +
          'si corresponde una nueva evaluación.',
        urgencyLevel: 'BAJA',
      };
    }

    // ════════════════════════════════════════════════════════════════════════
    // CASO 1 — SUCESOR_NATURAL + FUGA_CEREBROS
    // El perfil más costoso del sistema: doble señal simultánea.
    // ════════════════════════════════════════════════════════════════════════
    if (mobilityQuadrant === 'SUCESOR_NATURAL' && riskQuadrant === 'FUGA_CEREBROS') {
      return {
        headline: 'Doble señal — el perfil más costoso de perder',
        context:
          `${name} domina el cargo y tiene aspiración real de crecer — ` +
          'el perfil ideal de sucesor. Simultáneamente, su compromiso está en nivel crítico. ' +
          'Estas dos condiciones juntas representan el mayor riesgo estratégico del sistema: ' +
          'si sale, pierdes el talento y la cobertura de sucesión al mismo tiempo.',
        urgencySignal:
          'Con compromiso en nivel crítico y alto dominio, ' +
          'probablemente esté evaluando opciones fuera.',
        recommendedAction:
          'Priorizar conversación de escucha esta semana — no de evaluación, no de sucesión todavía. ' +
          'El objetivo es entender qué está pasando con su compromiso. ' +
          'Solo si esa conversación confirma su vínculo con la organización, ' +
          'el paso siguiente es mostrarle el plan de carrera.',
        urgencyLevel: 'CRITICA',
        conflictAlert:
          `No abrir la conversación revelando que ${name} es tu sucesor. ` +
          'Un perfil con compromiso crítico puede usar esa información ' +
          'para negociar una oferta externa.',
      };
    }

    // ════════════════════════════════════════════════════════════════════════
    // CASO 3 — EXPERTO_ANCLA + FUGA_CEREBROS
    // Conocimiento institucional crítico con compromiso en nivel crítico.
    // ════════════════════════════════════════════════════════════════════════
    if (mobilityQuadrant === 'EXPERTO_ANCLA' && riskQuadrant === 'FUGA_CEREBROS') {
      return {
        headline: 'El conocimiento que más cuesta reemplazar, con compromiso crítico',
        context:
          `${name} domina su área a nivel experto y su preferencia es profundizar, ` +
          'no gestionar personas — una elección legítima de carrera técnica. ' +
          'No es candidato a sucesor de liderazgo, pero es probablemente ' +
          'el activo de conocimiento más valioso del equipo. ' +
          'Su compromiso está en nivel crítico.',
        urgencySignal:
          'Si sale, el conocimiento operativo se va con él. ' +
          'No hay un sucesor natural porque nunca fue el plan — ' +
          'el reemplazo tarda más de lo que parece.',
        recommendedAction:
          'La conversación no es de carrera ascendente — es de reconocimiento y de rol técnico. ' +
          `¿${name} sigue encontrando desafío en lo que hace? ` +
          '¿Siente que su expertise es valorado al nivel de su impacto? ' +
          'Paralelamente, priorizar knowledge transfer — ' +
          'ese conocimiento no puede vivir en una sola persona.',
        urgencyLevel: 'CRITICA',
      };
    }

    // ════════════════════════════════════════════════════════════════════════
    // CASO 5 — AMBICIOSO_PREMATURO + FUGA_CEREBROS
    // Alta aspiración + compromiso crítico + dominio en desarrollo.
    // ════════════════════════════════════════════════════════════════════════
    if (mobilityQuadrant === 'AMBICIOSO_PREMATURO' && riskQuadrant === 'FUGA_CEREBROS') {
      return {
        headline: 'Alta aspiración, compromiso crítico, dominio todavía en desarrollo',
        context:
          `${name} quiere crecer — eso es un activo. ` +
          'Pero su dominio del cargo actual está por debajo del umbral requerido para sucesión. ' +
          'Simultáneamente, su compromiso está en nivel crítico. ' +
          'La combinación sugiere que probablemente no vea un camino claro de crecimiento aquí.',
        urgencySignal:
          'Mejor tener esta conversación ahora que cuando llegue con una oferta externa. ' +
          'En ese escenario, las opciones se reducen.',
        recommendedAction:
          'Conversación de roadmap explícito: qué necesita demostrar para ser candidato real, ' +
          'en qué plazo y con qué apoyo. ' +
          'Sin ese mapa, la aspiración se convierte en frustración — ' +
          'y la frustración busca salida.',
        urgencyLevel: 'ALTA',
      };
    }

    // ════════════════════════════════════════════════════════════════════════
    // CASO 2 — FUGA_CEREBROS con cualquier mobilityQuadrant
    // Alto dominio, compromiso en nivel crítico.
    // ════════════════════════════════════════════════════════════════════════
    if (riskQuadrant === 'FUGA_CEREBROS') {
      return {
        headline: 'Alto dominio, compromiso en nivel crítico',
        context:
          `${name} domina el cargo — la organización ya invirtió en este perfil ` +
          'y superó la curva de aprendizaje. Su compromiso está en nivel crítico. ' +
          'En perfiles con alto dominio, el desenganche rara vez es temporal.',
        urgencySignal:
          'Probablemente esté evaluando opciones fuera. ' +
          'Cuando perfiles con esta combinación deciden moverse, ' +
          'el proceso ya está avanzado.',
        recommendedAction:
          'Incluir en la próxima revisión de personas. ' +
          'Antes de esa conversación, identificar el driver probable del desenganche: ' +
          '¿compensación, liderazgo directo, proyecto actual, visibilidad?',
        urgencyLevel: 'CRITICA',
      };
    }

    // ════════════════════════════════════════════════════════════════════════
    // CASO 4 — SUCESOR_NATURAL + MOTOR_EQUIPO
    // El perfil correcto para sucesión — actívalo antes de perderlo.
    // ════════════════════════════════════════════════════════════════════════
    if (mobilityQuadrant === 'SUCESOR_NATURAL' && riskQuadrant === 'MOTOR_EQUIPO') {
      return {
        headline: 'El perfil correcto para sucesión — actívalo antes de que lo pierda el silencio',
        context:
          `${name} domina el cargo actual y tiene aspiración real de crecer. ` +
          'Comprometido. Es la combinación que más cuesta desarrollar ' +
          'y que más fácil se pierde cuando la organización no la gestiona.',
        urgencySignal:
          'Los perfiles con alto dominio, alta aspiración y alto compromiso ' +
          'no esperan indefinidamente. Si no ve señales concretas de progresión, ' +
          'probablemente busque afuera la visibilidad que aquí no encuentra.',
        recommendedAction:
          'Una conversación de visibilidad: mostrarle dónde está en el mapa de sucesión ' +
          'y qué necesita para llegar al siguiente nivel. ' +
          'No tiene que ser formal — tiene que ser honesta.',
        urgencyLevel: 'MEDIA',
      };
    }

    // ════════════════════════════════════════════════════════════════════════
    // CASO 7 — BURNOUT_RISK + SUCESOR_NATURAL
    // ════════════════════════════════════════════════════════════════════════
    if (riskQuadrant === 'BURNOUT_RISK' && mobilityQuadrant === 'SUCESOR_NATURAL') {
      return {
        headline: 'Potencial de sucesor, pero sobrecargado',
        context:
          `${name} tiene la aspiración y el perfil para crecer, ` +
          'pero su dominio del cargo actual está por debajo del umbral mientras su compromiso es alto. ' +
          'Esta combinación indica esfuerzo sin resultados proporcionales — ' +
          'el sistema detecta riesgo de desgaste antes de que el perfil madure.',
        urgencySignal:
          'Si el desgaste continúa, puedes perder un potencial sucesor antes de que esté listo. ' +
          'El compromiso alto no es infinito.',
        recommendedAction:
          'Reducir carga operativa o acelerar desarrollo de competencias. ' +
          `${name} necesita espacio para cerrar brechas, no más responsabilidades. ` +
          'Revisar si el gap es de capacitación o de asignación de tareas.',
        urgencyLevel: 'ALTA',
      };
    }

    // ════════════════════════════════════════════════════════════════════════
    // CASO 8 — BURNOUT_RISK + EXPERTO_ANCLA
    // ════════════════════════════════════════════════════════════════════════
    if (riskQuadrant === 'BURNOUT_RISK' && mobilityQuadrant === 'EXPERTO_ANCLA') {
      return {
        headline: 'Experto técnico en zona de desgaste',
        context:
          `${name} prefiere profundizar en su especialidad, no gestionar personas. ` +
          'Pero su dominio actual está por debajo de lo esperado para un experto, ' +
          'mientras su compromiso sigue alto. ' +
          'Puede estar en una curva de aprendizaje técnico intenso o sobrecargado.',
        urgencySignal:
          'Un experto que se quema pierde la ventaja que lo hace valioso. ' +
          'El conocimiento técnico requiere foco, no multitasking.',
        recommendedAction:
          'Conversación de enfoque: ¿está disperso en demasiados frentes? ' +
          '¿Necesita formación específica o tiempo protegido para profundizar? ' +
          'El objetivo es que vuelva a su zona de expertise.',
        urgencyLevel: 'MEDIA',
      };
    }

    // ════════════════════════════════════════════════════════════════════════
    // CASO 9 — BURNOUT_RISK + AMBICIOSO_PREMATURO
    // ════════════════════════════════════════════════════════════════════════
    if (riskQuadrant === 'BURNOUT_RISK' && mobilityQuadrant === 'AMBICIOSO_PREMATURO') {
      return {
        headline: 'Ambición alta, capacidad en desarrollo, riesgo de frustración',
        context:
          `${name} quiere crecer y está poniendo energía, pero los resultados no llegan. ` +
          'El sistema detecta alto compromiso con bajo dominio del cargo. ' +
          'Esta combinación puede generar frustración progresiva si no se gestiona.',
        urgencySignal:
          'La ambición sin un roadmap claro se convierte en ansiedad. ' +
          'El compromiso alto puede sostenerse un tiempo, pero no indefinidamente.',
        recommendedAction:
          'Conversación de expectativas: mostrar un camino realista con hitos medibles. ' +
          `${name} necesita saber qué le falta específicamente y en qué plazo puede cerrarlo. ` +
          'Considerar si la carga actual permite espacio para desarrollo.',
        urgencyLevel: 'MEDIA',
      };
    }

    // ════════════════════════════════════════════════════════════════════════
    // CASO 10 — BURNOUT_RISK + EN_DESARROLLO
    // ════════════════════════════════════════════════════════════════════════
    if (riskQuadrant === 'BURNOUT_RISK' && mobilityQuadrant === 'EN_DESARROLLO') {
      return {
        headline: 'En desarrollo pero sobrecargado',
        context:
          `${name} está en proceso de desarrollo con compromiso alto pero dominio bajo. ` +
          'El esfuerzo no se está traduciendo en resultados visibles. ' +
          'Puede ser una curva de aprendizaje normal o una señal de que ' +
          'la carga operativa no deja espacio para crecer.',
        urgencySignal:
          'El riesgo es que el compromiso caiga antes de que el dominio suba. ' +
          'Eso convierte un perfil en desarrollo en un perfil de bajo rendimiento.',
        recommendedAction:
          'Revisar balance carga/desarrollo: ¿tiene tiempo real para aprender? ' +
          '¿Los objetivos son alcanzables en su nivel actual? ' +
          'Ajustar expectativas o recursos antes de que el desgaste se instale.',
        urgencyLevel: 'MEDIA',
      };
    }

    // ════════════════════════════════════════════════════════════════════════
    // CASO 11 — BURNOUT_RISK fallback (sin mobilityQuadrant específico)
    // ════════════════════════════════════════════════════════════════════════
    if (riskQuadrant === 'BURNOUT_RISK') {
      return {
        headline: 'Compromiso alto, dominio por debajo del umbral',
        context:
          `${name} está poniendo energía pero el sistema detecta un gap entre ` +
          'el esfuerzo y los resultados. El Role Fit está por debajo del umbral ' +
          'mientras el engagement es alto — la definición clásica de burnout potencial.',
        urgencySignal:
          'El compromiso alto puede enmascarar el problema: ' +
          'desde afuera parece que todo está bien, pero el desgaste se acumula.',
        recommendedAction:
          'Conversación 1:1 para entender: ¿es un gap de competencias, de recursos, ' +
          'o de asignación incorrecta de rol? ' +
          'No asumir que "está bien porque se esfuerza".',
        urgencyLevel: 'MEDIA',
      };
    }

    // ════════════════════════════════════════════════════════════════════════
    // CASO 12 — MOTOR_EQUIPO + EXPERTO_ANCLA
    // ════════════════════════════════════════════════════════════════════════
    if (riskQuadrant === 'MOTOR_EQUIPO' && mobilityQuadrant === 'EXPERTO_ANCLA') {
      return {
        headline: 'Experto feliz — el ancla técnica del equipo',
        context:
          `${name} domina su área, está comprometido y no busca gestionar personas. ` +
          'Es el perfil más estable del sistema: sabe lo que quiere y lo tiene. ' +
          'No es candidato de sucesión de liderazgo, pero es invaluable donde está.',
        urgencySignal: null,
        recommendedAction:
          'Proteger este perfil: asegurar que tenga desafíos técnicos, ' +
          'reconocimiento visible y una carrera técnica clara. ' +
          'No intentar "promoverlo" a gestión — respeta su elección de carrera.',
        urgencyLevel: 'BAJA',
      };
    }

    // ════════════════════════════════════════════════════════════════════════
    // CASO 13 — MOTOR_EQUIPO + AMBICIOSO_PREMATURO
    // ════════════════════════════════════════════════════════════════════════
    if (riskQuadrant === 'MOTOR_EQUIPO' && mobilityQuadrant === 'AMBICIOSO_PREMATURO') {
      return {
        headline: 'Energía y ambición, pero aún en desarrollo',
        context:
          `${name} tiene alto compromiso y quiere crecer. ` +
          'Su dominio del cargo actual todavía está por debajo del umbral de sucesión, ' +
          'pero la actitud es la correcta. Es un perfil a desarrollar, no a promover hoy.',
        urgencySignal:
          'La ambición bien canalizada es un activo. ' +
          'Sin un roadmap claro, puede convertirse en impaciencia.',
        recommendedAction:
          'Mostrar el camino: qué competencias necesita desarrollar, en qué plazo, ' +
          'y con qué apoyo. Incluir en programas de desarrollo acelerado ' +
          'si el potencial lo justifica.',
        urgencyLevel: 'BAJA',
      };
    }

    // ════════════════════════════════════════════════════════════════════════
    // CASO 14 — MOTOR_EQUIPO + EN_DESARROLLO
    // ════════════════════════════════════════════════════════════════════════
    if (riskQuadrant === 'MOTOR_EQUIPO' && mobilityQuadrant === 'EN_DESARROLLO') {
      return {
        headline: 'Comprometido y creciendo — perfil en curva ascendente',
        context:
          `${name} tiene alto compromiso aunque su dominio del cargo aún está en desarrollo. ` +
          'La combinación sugiere una curva de aprendizaje saludable: ' +
          'la actitud está, los resultados vendrán.',
        urgencySignal: null,
        recommendedAction:
          'Mantener el momentum: feedback frecuente, metas incrementales, ' +
          'visibilidad de progreso. Este perfil responde bien a la inversión.',
        urgencyLevel: 'BAJA',
      };
    }

    // ════════════════════════════════════════════════════════════════════════
    // CASO 15 — MOTOR_EQUIPO fallback (sin mobilityQuadrant específico)
    // ════════════════════════════════════════════════════════════════════════
    if (riskQuadrant === 'MOTOR_EQUIPO') {
      return {
        headline: 'Alto dominio, alto compromiso — el ancla del equipo',
        context:
          `${name} domina su cargo y está comprometido. ` +
          'Es el perfil que da estabilidad al equipo. ' +
          'Sin datos de aspiración, no es posible proyectar su carrera.',
        urgencySignal:
          'Atención: en perfiles con alto dominio, el aburrimiento es el riesgo #1. ' +
          '¿Cuándo fue su último desafío nuevo?',
        recommendedAction:
          'Completar evaluación de aspiración para entender su proyección. ' +
          'Mientras tanto, asegurar que tenga retos que lo mantengan engaged.',
        urgencyLevel: 'BAJA',
      };
    }

    // ════════════════════════════════════════════════════════════════════════
    // CASO 16 — BAJO_RENDIMIENTO + SUCESOR_NATURAL
    // ════════════════════════════════════════════════════════════════════════
    if (riskQuadrant === 'BAJO_RENDIMIENTO' && mobilityQuadrant === 'SUCESOR_NATURAL') {
      return {
        headline: 'Contradicción: aspira a más pero no domina lo actual',
        context:
          `${name} quiere crecer y tiene el perfil de aspiración correcto, ` +
          'pero su dominio del cargo actual Y su compromiso están bajos. ' +
          'Esta combinación es una señal de alerta: la ambición no está respaldada por resultados.',
        urgencySignal:
          'Un "sucesor" que no domina su cargo actual no es un sucesor real. ' +
          'Promoverlo sería transferir el problema a un nivel superior.',
        recommendedAction:
          'Conversación directa: ¿qué está pasando? ¿Es un problema temporal, ' +
          'de contexto, o de fit con el rol? ' +
          'La aspiración es un activo solo si viene acompañada de entrega.',
        urgencyLevel: 'ALTA',
      };
    }

    // ════════════════════════════════════════════════════════════════════════
    // CASO 17 — BAJO_RENDIMIENTO + EXPERTO_ANCLA
    // ════════════════════════════════════════════════════════════════════════
    if (riskQuadrant === 'BAJO_RENDIMIENTO' && mobilityQuadrant === 'EXPERTO_ANCLA') {
      return {
        headline: 'Prefiere profundizar, pero no está entregando',
        context:
          `${name} eligió una carrera técnica, no de gestión. ` +
          'Pero su dominio actual y compromiso están bajos. ' +
          'Un experto que no domina su área no puede llamarse experto.',
        urgencySignal:
          'Si el perfil se consolida, tienes un especialista que no especializa. ' +
          'El impacto en el equipo es real.',
        recommendedAction:
          'Primera conversación: ¿es el área correcta? ¿Hay un factor externo? ' +
          '¿El expertise declarado es real o es un refugio? ' +
          'Definir un plazo para ver mejora.',
        urgencyLevel: 'ALTA',
      };
    }

    // ════════════════════════════════════════════════════════════════════════
    // CASO 18 — BAJO_RENDIMIENTO + AMBICIOSO_PREMATURO
    // ════════════════════════════════════════════════════════════════════════
    if (riskQuadrant === 'BAJO_RENDIMIENTO' && mobilityQuadrant === 'AMBICIOSO_PREMATURO') {
      return {
        headline: 'Quiere crecer pero no está entregando lo básico',
        context:
          `${name} tiene aspiración de carrera pero bajo dominio Y bajo compromiso. ` +
          'La ambición sin entrega es un problema, no un activo. ' +
          'Esta combinación puede generar tensión en el equipo.',
        urgencySignal:
          'El riesgo es que pida oportunidades que no ha ganado. ' +
          'O que se frustre porque "no lo ven" — cuando el problema es la entrega.',
        recommendedAction:
          'Conversación de reset: antes de hablar de carrera, hay que hablar de hoy. ' +
          '¿Qué necesita para entregar en su rol actual? ' +
          'La ambición se desbloquea cuando los básicos están cubiertos.',
        urgencyLevel: 'ALTA',
      };
    }

    // ════════════════════════════════════════════════════════════════════════
    // CASO 19 — BAJO_RENDIMIENTO + EN_DESARROLLO
    // ════════════════════════════════════════════════════════════════════════
    if (riskQuadrant === 'BAJO_RENDIMIENTO' && mobilityQuadrant === 'EN_DESARROLLO') {
      return {
        headline: 'Bajo rendimiento sin señales de mejora',
        context:
          `${name} tiene bajo dominio del cargo y bajo compromiso. ` +
          'Sin aspiración clara ni energía visible, el sistema no detecta ' +
          'una trayectoria de mejora en curso.',
        urgencySignal:
          'Sin intervención, este perfil se consolida. ' +
          'La inacción tiene costo: afecta a los pares y normaliza el bajo estándar.',
        recommendedAction:
          'Conversación de definición: ¿hay un factor externo desconocido? ' +
          '¿Es el cargo correcto? ¿Es el momento correcto? ' +
          'Establecer un plan con hitos y consecuencias claras.',
        urgencyLevel: 'ALTA',
      };
    }

    // ════════════════════════════════════════════════════════════════════════
    // CASO 20 — BAJO_RENDIMIENTO fallback
    // ════════════════════════════════════════════════════════════════════════
    if (riskQuadrant === 'BAJO_RENDIMIENTO') {
      return {
        headline: 'Bajo dominio, bajo compromiso — situación que requiere definición',
        context:
          `${name} tiene bajo Role Fit y bajo Engagement. ` +
          'El sistema detecta un perfil que no está entregando ni está comprometido. ' +
          'Esta combinación rara vez se resuelve sola.',
        urgencySignal:
          'Cada semana sin intervención normaliza el estándar bajo. ' +
          'El impacto en los pares es real aunque invisible.',
        recommendedAction:
          'Primera conversación esta semana: ¿hay un problema personal/externo desconocido? ' +
          '¿Es la posición adecuada? ¿Es el momento adecuado? ' +
          'Sin un plan con plazos, el patrón continúa.',
        urgencyLevel: 'ALTA',
      };
    }

    // ════════════════════════════════════════════════════════════════════════
    // FALLBACK FINAL — Cuadrante no contemplado (no debería llegar aquí)
    // ════════════════════════════════════════════════════════════════════════
    console.warn(`[TalentNarrativeService] Combinación sin narrativa: riskQuadrant=${riskQuadrant}, mobilityQuadrant=${mobilityQuadrant}`)
    return null;
  }
}