// ════════════════════════════════════════════════════════════════════════════
// FAMILIA VOLUMEN DICTIONARY
// src/config/narratives/FamiliaVolumenDictionary.ts
//
// Versión: 1.0
//
// CONTEXTO:
// Narrativas diagnósticas para P2 de La Cascada de la Verdad.
// Traduce el dato de familiaVolumen (acotadoGroup) en un diagnóstico
// de riesgo real para el negocio — no jerga de RRHH.
//
// DOS NARRATIVAS:
// 1. getFamiliaVolumenNarrative — dónde está la masa del problema
// 2. getWorstCellNarrative — la celda más crítica de la organización
//
// TONO:
// Directo, sin jerga de RRHH
// Habla de consecuencias reales para el negocio
// Usa "tu/tus" — no "la empresa"
// No diagnostica lo que el dato no puede probar
// Una idea por oración
// ════════════════════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════════════════════════════════
// NARRATIVAS POR FAMILIA DE CARGO
// ════════════════════════════════════════════════════════════════════════════

const FAMILIA_DIAGNOSTICS: Record<string, string> = {

  /**
   * Alta Gerencia / Directores
   * El riesgo es de dirección, no de ejecución.
   * Las consecuencias son invisibles hasta que ya es tarde.
   */
  alta_gerencia:
    'Cuando la Alta Gerencia opera bajo el estándar, ' +
    'el problema no se ve de inmediato — se siente en los resultados. ' +
    'Las decisiones estratégicas se toman sin el dominio necesario ' +
    'para ejecutarlas. El costo no es operacional — es de dirección.',

  /**
   * Mandos Medios / Jefaturas
   * El riesgo es que la estrategia no llega a la operación.
   * Son el puente entre lo que se decide y lo que pasa.
   */
  mandos_medios:
    'Los Mandos Medios son el puente entre lo que se decide arriba ' +
    'y lo que pasa abajo. ' +
    'Cuando ese puente opera bajo el estándar, ' +
    'la estrategia no llega a la operación. ' +
    'Lo que el directorio decide, el equipo nunca termina de ejecutar.',

  /**
   * Profesionales / Especialistas / Técnicos
   * El riesgo es de velocidad y calidad de resolución.
   * Donde la competencia puede ganar terreno.
   */
  profesionales:
    'La capacidad técnica de resolver problemas complejos ' +
    'está comprometida. ' +
    'Cuando los profesionales no dominan su cargo, ' +
    'la organización pierde velocidad de respuesta ' +
    'y calidad de ejecución — ' +
    'exactamente donde la competencia puede ganar terreno.',

  /**
   * Base Operativa / Primera Línea
   * El riesgo es directo al cliente final.
   * El cliente lo siente antes que cualquier reporte.
   */
  base_operativa:
    'La base operativa es el contacto directo con el resultado final. ' +
    'Cuando opera bajo el estándar, ' +
    'el cliente lo siente primero — ' +
    'antes que cualquier reporte o indicador.',
}

// ════════════════════════════════════════════════════════════════════════════
// LABELS LEGIBLES POR FAMILIA
// ════════════════════════════════════════════════════════════════════════════

const FAMILIA_LABELS: Record<string, string> = {
  alta_gerencia: 'Alta Gerencia',
  mandos_medios: 'Mandos Medios',
  profesionales: 'Profesionales',
  base_operativa: 'Base Operativa',
}

// ════════════════════════════════════════════════════════════════════════════
// API PÚBLICA
// ════════════════════════════════════════════════════════════════════════════

/**
 * Narrativa diagnóstica para la familia de cargo con más personas
 * bajo el estándar en la organización.
 *
 * @param acotadoGroup — valor del acotadoGroup de familiaVolumen
 *
 * Retorna null si el grupo no tiene narrativa definida.
 *
 * Uso:
 *   const narrative = getFamiliaVolumenNarrative('mandos_medios')
 *   // "Los Mandos Medios son el puente..."
 */
export function getFamiliaVolumenNarrative(
  acotadoGroup: string
): string | null {
  return FAMILIA_DIAGNOSTICS[acotadoGroup] ?? null
}

/**
 * Narrativa del francotirador — la celda más crítica.
 * Usa los 3 datos de worstCell: layer, gerencia y score.
 *
 * @param worstLayer    — familia de cargo de la celda más baja
 * @param worstGerencia — gerencia de la celda más baja
 * @param worstScore    — RoleFit promedio de esa celda (0-100)
 *
 * Uso:
 *   const narrative = getWorstCellNarrative(
 *     'mandos_medios',
 *     'Gerencia de Operaciones',
 *     38
 *   )
 */
export function getWorstCellNarrative(
  worstLayer: string,
  worstGerencia: string,
  worstScore: number
): string {
  const layerLabel = FAMILIA_LABELS[worstLayer] ?? worstLayer

  return (
    `La familia de cargo con menor dominio de sus competencias ` +
    `es ${layerLabel} en ${worstGerencia}, ` +
    `operando al ${worstScore}% del estándar mínimo esperado. ` +
    `Esta es la capa que absorbe recursos sin entregar ` +
    `el rendimiento que el negocio necesita. ` +
    `Si hay una intervención prioritaria, es aquí.`
  )
}

/**
 * Label legible para un acotadoGroup
 * Útil para mostrar el nombre en la UI sin lógica adicional
 *
 * @param acotadoGroup — valor del acotadoGroup
 */
export function getFamiliaLabel(acotadoGroup: string): string {
  return FAMILIA_LABELS[acotadoGroup] ?? acotadoGroup
}