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
    // FALLBACK — Tiene cuadrantes pero no coincide con ningún caso específico
    // ════════════════════════════════════════════════════════════════════════
    return null;
  }
}