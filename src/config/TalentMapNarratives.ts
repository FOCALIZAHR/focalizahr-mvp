// ════════════════════════════════════════════════════════════════════════════
// TALENT MAP NARRATIVES — Nivel 1 (Badge) + Nivel 2 (Coaching Tip)
// Mapa de Talento — Texto visible junto a cada persona
//
// Versión: 1.1 — Variantes por tenure integradas
//
// PRINCIPIOS:
// — El badge describe la situación, no el sistema interno
// — El coaching tip abre una pregunta o señala dirección
// — NUNCA plazos: cada empresa tiene sus propias políticas
// — NUNCA diagnósticos que el dato no puede comprobar
// — Usar condicional cuando se trata de comportamiento probable
//
// CÓMO SE CALCULA CADA CUADRANTE:
// RoleFit ≥ 75% = HIGH | RoleFit < 75% = LOW
// Engagement 3 = HIGH | Engagement 1 = LOW | Engagement 2 = NEUTRAL (no clasifica)
//
// FUGA_CEREBROS    → RoleFit HIGH + Engagement LOW  → RED
// MOTOR_EQUIPO     → RoleFit HIGH + Engagement HIGH → GREEN
// BURNOUT_RISK     → RoleFit LOW  + Engagement HIGH → ORANGE
// BAJO_RENDIMIENTO → RoleFit LOW  + Engagement LOW  → RED
//
// SEGMENTOS DE TENURE (actualizado 2026-03-22):
// onboarding → < 12 meses (antes <6 — ampliado para alinear con curva real de integración)
// real       → 12 a 36 meses
// cronico    → > 36 meses
// ════════════════════════════════════════════════════════════════════════════

export type TenureSegment = 'onboarding' | 'real' | 'cronico'

export interface TalentMapNarrative {
  // NIVEL 1 — Badge (1-2 palabras, visible siempre junto al nombre)
  badge: string

  // NIVEL 2 — Coaching tip (1 línea, texto secundario bajo el nombre)
  // Abre una dirección o pregunta. Nunca un diagnóstico ni un plazo.
  coachingTip: string

  // Color del badge (mantiene sistema visual existente)
  alertLevel: 'RED' | 'ORANGE' | 'GREEN' | 'YELLOW'
}

// ════════════════════════════════════════════════════════════════════════════
// HELPER — Calcular segmento de tenure
// ════════════════════════════════════════════════════════════════════════════

// NOTE: Primer tramo actualizado de <6 a <12 meses (2026-03-22).
// Debe estar sincronizado con TalentActionService.classifyTenure().
export function getTenureSegment(tenureMonths: number): TenureSegment {
  if (tenureMonths < 12) return 'onboarding'
  if (tenureMonths <= 36) return 'real'
  return 'cronico'
}

// ════════════════════════════════════════════════════════════════════════════
// NARRATIVAS POR CUADRANTE × TENURE
// ════════════════════════════════════════════════════════════════════════════

const TALENT_MAP_NARRATIVES_BY_TENURE: Record<
  string,
  Record<TenureSegment, TalentMapNarrative>
> = {

  // ──────────────────────────────────────────────────────────────────────────
  // FUGA_CEREBROS — RoleFit HIGH + Engagement LOW
  // Lo que sabemos: domina el cargo, compromiso en nivel crítico.
  // Lo que NO sabemos: la causa del desenganche.
  // La antigüedad cambia el costo y la lectura de la señal.
  // ──────────────────────────────────────────────────────────────────────────
  FUGA_CEREBROS: {
    onboarding: {
      badge: 'En riesgo',
      coachingTip:
        'Compromiso bajo en etapa temprana — explorar si la expectativa del cargo coincide con la realidad.',
      alertLevel: 'RED',
    },
    real: {
      badge: 'En riesgo',
      coachingTip:
        'Compromiso crítico con dominio consolidado — incluir en próxima revisión de personas.',
      alertLevel: 'RED',
    },
    cronico: {
      badge: 'En riesgo',
      coachingTip:
        'Perfil experto con compromiso crítico — el costo de perderlo es alto. Priorizar en agenda de personas.',
      alertLevel: 'RED',
    },
  },

  // ──────────────────────────────────────────────────────────────────────────
  // MOTOR_EQUIPO — RoleFit HIGH + Engagement HIGH
  // Lo que sabemos: domina el cargo y está comprometido.
  // El riesgo no es hoy — es el estancamiento futuro sin nuevos desafíos.
  // ──────────────────────────────────────────────────────────────────────────
  MOTOR_EQUIPO: {
    onboarding: {
      badge: 'Pilar del equipo',
      coachingTip:
        'Energía y dominio temprano — cuidar que el ritmo de exigencia sea sostenible.',
      alertLevel: 'GREEN',
    },
    real: {
      badge: 'Pilar del equipo',
      coachingTip:
        'El perfil más valioso para desarrollar activamente ahora.',
      alertLevel: 'GREEN',
    },
    cronico: {
      badge: 'Pilar del equipo',
      coachingTip:
        'Columna vertebral del equipo — ¿cuándo fue su último desafío nuevo?',
      alertLevel: 'GREEN',
    },
  },

  // ──────────────────────────────────────────────────────────────────────────
  // BURNOUT_RISK — RoleFit LOW + Engagement HIGH
  // Lo que sabemos: compromiso alto, dominio bajo el umbral.
  // Lo que NO sabemos: si es nuevo, recién promovido, o en sobrecarga real.
  // La antigüedad es el dato más importante para leer este cuadrante.
  // ──────────────────────────────────────────────────────────────────────────
  BURNOUT_RISK: {
    onboarding: {
      badge: 'Alta energía',
      coachingTip:
        'Compromiso alto, dominio en construcción — es el momento normal de la curva de aprendizaje.',
      alertLevel: 'ORANGE',
    },
    real: {
      badge: 'Alta energía',
      coachingTip:
        'Pasó la etapa inicial y el dominio sigue bajo — revisar si el rol es el correcto.',
      alertLevel: 'ORANGE',
    },
    cronico: {
      badge: 'Adecuacion al rol',
      coachingTip:
        'Alta energia sostenida sin consolidar dominio — revisar carga y adecuacion al rol.',
      alertLevel: 'ORANGE',
    },
  },

  // ──────────────────────────────────────────────────────────────────────────
  // BAJO_RENDIMIENTO — RoleFit LOW + Engagement LOW
  // Lo que sabemos: bajo dominio y bajo compromiso.
  // Lo que NO sabemos: si hay un contexto externo o personal desconocido.
  // La antigüedad define qué tan urgente es la conversación.
  // ──────────────────────────────────────────────────────────────────────────
  BAJO_RENDIMIENTO: {
    onboarding: {
      badge: 'Requiere atención',
      coachingTip:
        'Señal temprana — puede ser pronto para leer esto como un patrón. Observar evolución.',
      alertLevel: 'RED',
    },
    real: {
      badge: 'Requiere atención',
      coachingTip:
        'Bajo dominio y compromiso con tiempo en el cargo — la conversación no puede esperar más.',
      alertLevel: 'RED',
    },
    cronico: {
      badge: 'Requiere atención',
      coachingTip:
        'Años en la empresa con esta combinación — definir continuidad o reubicación.',
      alertLevel: 'RED',
    },
  },
}

// ════════════════════════════════════════════════════════════════════════════
// FALLBACK — Sin clasificación activa
// Engagement = 2 (test ácido) o datos incompletos.
// No es un error — el sistema no tiene señal clara en ninguna dirección.
// ════════════════════════════════════════════════════════════════════════════

const SIN_CLASIFICACION: TalentMapNarrative = {
  badge: 'Sin señal',
  coachingTip:
    'No cruza en las matrices de talento — revisar en Centro de Acción de Talento.',
  alertLevel: 'YELLOW',
}

// ════════════════════════════════════════════════════════════════════════════
// PUBLIC API
// ════════════════════════════════════════════════════════════════════════════

/**
 * Retorna badge + coaching tip para una persona en el mapa de talento.
 *
 * @param riskQuadrant  — Campo riskQuadrant de PerformanceRating
 * @param tenureSegment — Segmento calculado desde tenureMonths
 *
 * Uso:
 *   const tenure = getTenureSegment(employee.tenureMonths)
 *   const narrative = getTalentMapNarrative(employee.riskQuadrant, tenure)
 */
export function getTalentMapNarrative(
  riskQuadrant: string | null,
  tenureSegment: TenureSegment = 'real'
): TalentMapNarrative {
  if (!riskQuadrant) return SIN_CLASIFICACION

  const byTenure = TALENT_MAP_NARRATIVES_BY_TENURE[riskQuadrant]
  if (!byTenure) return SIN_CLASIFICACION

  return byTenure[tenureSegment]
}
