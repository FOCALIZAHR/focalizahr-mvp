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
 * Las 4 familias están CONFIRMADAS por Victor (2026-07-16) — listo para producción.
 * `'Otros'` queda en todas (fallback). `'Clima'` es contrato con el módulo de Clima
 * (ver FAMILY_CLIMA/SUBFAMILY_CLIMA abajo): no renombrar.
 */
export const GOAL_SUBFAMILIES: Record<GoalFamily, readonly string[]> = {
  NEGOCIO_E_INGRESOS: ['Rentabilidad', 'Ventas y Crecimiento', 'Eficiencia de Costos', 'Riesgos y Cumplimiento', 'Otros'],
  CLIENTES_Y_USUARIOS: ['Fidelización y NPS', 'Adquisición de Clientes', 'Calidad de Servicio', 'Posicionamiento de Marca', 'Otros'],
  OPERACION_Y_EFICIENCIA: ['Productividad y SLAs', 'Calidad y Precisión', 'Digitalización y Procesos', 'Mejora Continua', 'Otros'],
  CULTURA_Y_PERSONAS: ['Clima', 'Rotación', 'Desarrollo', 'Adquisición de Talento', 'Otros'],
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
// UNA sola fuente, UN solo texto (sin versión corta): el ejemplo COMPLETO se usa como
//   - PLACEHOLDER del input "¿Cómo se mide?" (gris, se borra al escribir), y
//   - TEXTO DE AYUDA (💡) mientras el jefe escribe (para no duplicar con el placeholder).
// Selección: Familia elegida × metricType elegido. Sin alguno de los dos ejes,
// el componente cae a un placeholder neutro.
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

/**
 * El ejemplo COMPLETO por Familia × metricType. Fuente única — se usa como placeholder
 * del input Y como texto de ayuda. (El truncado a 40 chars se descontinuó por decisión
 * de Victor: un solo texto, sin versión corta y larga.)
 */
export function getMeasurementExample(family: GoalFamily, metric: GoalMetricType): string {
  return GOAL_MEASUREMENT_EXAMPLES[family][metric]
}

// ⚠️ DOS narrativas de familia — NO confundir, tienen usos distintos:
//
/**
 * "Dolor" típico por familia — narrativa corta que se muestra al elegir la familia
 * (Gate C, 4.6). Contenido final de Victor, VERBATIM. Ayuda al jefe a entender qué
 * problemas cubre cada familia antes de elegir subfamilia.
 * USO: `FamilySubfamilyPicker` (Camino D individual + 'crear nueva' masivo), al elegir FAMILIA.
 */
export const GOAL_FAMILY_PAIN_POINTS: Record<GoalFamily, string> = {
  NEGOCIO_E_INGRESOS: 'Cuidar el margen de ganancia frente al aumento de costos, evitar gastos innecesarios en software duplicado y priorizar ingresos seguros.',
  CLIENTES_Y_USUARIOS: 'Clientes que se van (churn), alto costo para conseguir clientes nuevos y fricción en los canales de atención digital.',
  OPERACION_Y_EFICIENCIA: 'Proyectos que se retrasan, horas perdidas en tareas manuales que se pueden automatizar y burocracia interna.',
  CULTURA_Y_PERSONAS: 'Fuga de personas clave en puestos críticos, jefaturas que no dan feedback y resguardar un ambiente laboral de respeto.',
}

/**
 * Contexto de negocio por familia — narrativa del CATÁLOGO DEL BANCO (Gate CAT·B),
 * mostrada al elegir SUBFAMILIA. Una vez por familia (no hay narrativa por subfamilia).
 * USO: nuevo catálogo de `GoalBankScreen`. DISTINTO de GOAL_FAMILY_PAIN_POINTS (arriba):
 * aquel es el "dolor" en el picker de creación; éste es el contexto al asignar del banco.
 */
export const GOAL_FAMILY_CONTEXT: Record<GoalFamily, string> = {
  NEGOCIO_E_INGRESOS: 'Asegurar el crecimiento sostenible, proteger la rentabilidad de las líneas de negocio y mitigar los riesgos financieros o de cumplimiento.',
  CLIENTES_Y_USUARIOS: 'Mejorar la experiencia de nuestros usuarios, elevar los índices de satisfacción y fidelizar a la cartera de clientes para evitar fugas al competidor.',
  OPERACION_Y_EFICIENCIA: 'Optimizar los tiempos de entrega de procesos críticos, reducir el porcentaje de errores o reprocesos y avanzar en la automatización del área.',
  CULTURA_Y_PERSONAS: GOAL_FAMILY_PAIN_POINTS.CULTURA_Y_PERSONAS, // mismo texto, NO duplicar
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
