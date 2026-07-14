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

import type { GoalFamily } from '@prisma/client'

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
