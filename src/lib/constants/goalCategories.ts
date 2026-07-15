// src/lib/constants/goalCategories.ts
// ════════════════════════════════════════════════════════════════════════════
// CATÁLOGO DE CATEGORÍAS DE METAS (Gate B) — fuente única.
//
// La FAMILIA es un enum en la base (GoalFamily): taxonomía cerrada, de la que
// dependen queries de otros módulos (Clima busca su meta corporativa por acá).
//
// La SUBFAMILIA es un String en la base, A PROPÓSITO: hoy solo la lista de
// "Cultura y Personas" está confirmada; las otras 3 familias siguen provisionales.
// Un enum obligaría a un `db push` contra PRODUCCIÓN cada vez que se confirme una
// lista de copy. El precio de esa flexibilidad es que la base no impone integridad
// → GoalsService.validateCategory es la ÚNICA puerta de escritura, y por eso
// ningún creador debe escribir `subfamily` sin pasar por ahí.
//
// LOS LABELS SON COPY PROVISIONAL — los confirma Victor / Studio IA antes de que
// los vea un cliente. Cambiarlos acá NO toca schema ni lógica.
// ════════════════════════════════════════════════════════════════════════════

import type { GoalFamily, GoalMetricType } from '@prisma/client'

/** Label de cara al usuario por familia. COPY PROVISIONAL. */
export const GOAL_FAMILY_LABELS: Record<GoalFamily, string> = {
  NEGOCIO_E_INGRESOS: 'Negocio e Ingresos',
  CLIENTES_Y_USUARIOS: 'Clientes y Usuarios',
  OPERACION_Y_EFICIENCIA: 'Operación y Eficiencia',
  CULTURA_Y_PERSONAS: 'Cultura y Personas',
}

/** Orden de presentación de las familias (Gate C lo consume para las píldoras). */
export const GOAL_FAMILY_ORDER: readonly GoalFamily[] = [
  'NEGOCIO_E_INGRESOS',
  'CLIENTES_Y_USUARIOS',
  'OPERACION_Y_EFICIENCIA',
  'CULTURA_Y_PERSONAS',
] as const

/**
 * Subfamilias válidas por familia. "Otros" SIEMPRE al final del grupo.
 *
 * CULTURA_Y_PERSONAS está CONFIRMADA por Victor.
 * Las otras 3 son PROVISIONALES: arrancan solo con "Otros" — NO se inventan
 * subfamilias que nadie confirmó. Completarlas es editar este archivo, nada más.
 */
export const GOAL_SUBFAMILIES: Record<GoalFamily, readonly string[]> = {
  NEGOCIO_E_INGRESOS: ['Otros'], // PROVISIONAL
  CLIENTES_Y_USUARIOS: ['Otros'], // PROVISIONAL
  OPERACION_Y_EFICIENCIA: ['Otros'], // PROVISIONAL
  CULTURA_Y_PERSONAS: ['Clima', 'Rotación', 'Desarrollo', 'Otros'], // CONFIRMADA
} as const

// ── Contrato con el módulo de Clima ─────────────────────────────────────────
// Estos dos valores son la ETIQUETA que Clima busca para encontrar su meta
// corporativa (GoalsService.findActiveStrategicGoal). Renombrarlos rompe esa
// búsqueda y exige migrar los datos ya escritos: son contrato, no copy libre.
export const FAMILY_CLIMA: GoalFamily = 'CULTURA_Y_PERSONAS'
export const SUBFAMILY_CLIMA = 'Clima'

/** ¿La subfamilia pertenece a esa familia? Base de validateCategory. */
export function isValidSubfamily(family: GoalFamily, subfamily: string): boolean {
  return GOAL_SUBFAMILIES[family].includes(subfamily)
}

// ════════════════════════════════════════════════════════════════════════════
// EJEMPLOS DE MEDICIÓN (Gate C, punto 7) — contenido final (Gemini, aprobado Victor).
//
// Uso doble, del MISMO texto (una sola fuente de verdad):
//   - TEXTO DE AYUDA (💡 debajo del input "¿Cómo se mide?"): el ejemplo COMPLETO.
//   - PLACEHOLDER del input: derivado por truncado (getMeasurementPlaceholder), NO
//     un segundo texto a mano.
// Selección: Familia elegida × metricType elegido. Sin alguno de los dos ejes,
// no se muestra ejemplo (el componente cae a un placeholder neutro).
// ════════════════════════════════════════════════════════════════════════════
export const GOAL_MEASUREMENT_EXAMPLES: Record<GoalFamily, Record<GoalMetricType, string>> = {
  NEGOCIO_E_INGRESOS: {
    PERCENTAGE: '% de margen de ganancia anual neto que debemos proteger frente al aumento de costos',
    NUMBER: 'Cantidad de grandes contratos anuales que logramos renovar con éxito',
    CURRENCY: 'Total de dinero ahorrado en el año al unificar herramientas de software duplicadas',
    BINARY: 'Lanzar el nuevo modelo de cobro y servicios antes de diciembre',
  },
  CLIENTES_Y_USUARIOS: {
    PERCENTAGE: '% de clientes activos que deciden quedarse con nosotros al terminar su contrato anual',
    NUMBER: 'Número máximo de quejas o reclamos graves ingresados por clientes en el año',
    CURRENCY: 'Costo promedio anual para lograr que un cliente nuevo nos compre por primera vez',
    BINARY: 'Unificar los canales de atención para que el cliente tenga una sola vía de soporte',
  },
  OPERACION_Y_EFICIENCIA: {
    PERCENTAGE: '% de proyectos clave del año entregados a tiempo y sin retrasos',
    NUMBER: 'Horas de trabajo manual que logramos automatizar con nuevas herramientas en el año',
    CURRENCY: 'Gasto total acumulado en el año por fallas o retrasos en la entrega de servicios',
    BINARY: 'Simplificar el proceso de compras internas reduciendo los pasos de aprobación',
  },
  CULTURA_Y_PERSONAS: {
    PERCENTAGE: '% de aprobación del equipo en la pregunta sobre apoyo y feedback de su jefatura',
    NUMBER: 'Cantidad máxima de personas en roles críticos que dejan la empresa en el año',
    CURRENCY: 'Dinero invertido en nivelar habilidades del equipo para no tener que buscar afuera',
    BINARY: 'Completar el programa anual de prevención de riesgos y ambiente de trabajo sano',
  },
}

/** Placeholder neutro cuando aún no hay Familia o metricType elegido. */
export const NEUTRAL_MEASUREMENT_PLACEHOLDER = 'Ej: % de avance sobre la meta trimestral'

const PLACEHOLDER_MAX = 40

/**
 * Placeholder del input (~40 chars), DERIVADO por truncado del ejemplo completo:
 * el texto vive en UN solo lugar (GOAL_MEASUREMENT_EXAMPLES). Corta en el último
 * espacio antes del límite para no partir palabras; sin puntos suspensivos.
 */
export function getMeasurementPlaceholder(family: GoalFamily, metric: GoalMetricType): string {
  const full = GOAL_MEASUREMENT_EXAMPLES[family][metric]
  if (full.length <= PLACEHOLDER_MAX) return full
  const cut = full.slice(0, PLACEHOLDER_MAX)
  const lastSpace = cut.lastIndexOf(' ')
  return lastSpace > 0 ? cut.slice(0, lastSpace) : cut
}

/** El ejemplo completo, para el texto de ayuda (💡). */
export function getMeasurementExample(family: GoalFamily, metric: GoalMetricType): string {
  return GOAL_MEASUREMENT_EXAMPLES[family][metric]
}

/**
 * Detección de KPI ambiguo (Gate C, punto 4) — AVISO, no bloqueo. El bloqueo real
 * es el mínimo de 10 caracteres; esto solo sugiere reescribir si el texto es vago.
 * Frases que no describen un indicador medible.
 */
const AMBIGUOUS_PHRASES = [
  'con esfuerzo',
  'lo mejor posible',
  'mejorar',
  'ser mejor',
  'hacer más',
  'más y mejor',
  'dar el máximo',
  'poner ganas',
  'trabajar mejor',
  'esforzarse',
]
export function isAmbiguous(text: string): boolean {
  const t = text.trim().toLowerCase()
  if (t.length === 0) return false
  return AMBIGUOUS_PHRASES.some((p) => t.includes(p))
}
