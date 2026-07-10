// src/lib/data/clima-competency-mapping.ts
// ════════════════════════════════════════════════════════════════════════════
// EX Clima Gate 5B-i — Mapeo dimensión de CLIMA → competencia 360° más cercana.
//
// Opción B (decisión Victor): una brecha de clima se traduce a la competencia
// del banco 360° más cercana, y el PDISuggestionEngine genera la sugerencia sobre
// esa competencia.
//
// ⚠️ CONTENIDO PROVISIONAL — mismo régimen que el diccionario 8×4 de 5A: el mapeo
//    ESPECÍFICO lo define Victor/Studio IA, NO se infiere. Code scaffoldea la
//    estructura + un mapeo de relleno para que el motor sea ejercitable; Victor lo
//    reemplaza por el real ANTES de mostrar a cliente. No asumir que está listo.
//
// Códigos de competencia REALES del banco (PDI_COMPETENCY_LIBRARY): CORE-COMM,
// CORE-TEAM, CORE-RESULTS, CORE-ADAPT, CORE-CLIENT, LEAD-DEV, LEAD-TEAM,
// LEAD-DELEG, LEAD-FEEDBACK, STRAT-VISION, STRAT-CHANGE, STRAT-INFLUENCE, GENERIC.
// ════════════════════════════════════════════════════════════════════════════

/** Guard explícito contra "el mapeo ya está listo". */
export const CLIMA_COMPETENCY_MAPPING_STATUS = 'PROVISIONAL' as const;

export interface ClimaCompetencyMappingEntry {
  competencyCode: string;
  competencyName: string;
}

/**
 * Mapeo PROVISIONAL de las 8 dimensiones reales de clima (taxonomía Gate 1A) a la
 * competencia 360° más cercana. Relleno estructural — Victor/Studio IA lo reemplaza.
 */
export const CLIMA_DIMENSION_TO_COMPETENCY: Record<
  string,
  ClimaCompetencyMappingEntry
> = {
  // PROVISIONAL — pares tentativos, a validar/reemplazar por Victor/Studio IA.
  liderazgo: { competencyCode: 'LEAD-TEAM', competencyName: 'Liderazgo de Equipos' },
  comunicacion: { competencyCode: 'CORE-COMM', competencyName: 'Comunicación' },
  autonomia: { competencyCode: 'LEAD-DELEG', competencyName: 'Delegación y Autonomía' },
  desarrollo: { competencyCode: 'LEAD-DEV', competencyName: 'Desarrollo de Personas' },
  crecimiento: { competencyCode: 'LEAD-DEV', competencyName: 'Desarrollo de Personas' },
  reconocimiento: { competencyCode: 'LEAD-FEEDBACK', competencyName: 'Feedback y Reconocimiento' },
  // Sin competencia 360° cercana en el banco actual → GENERIC (PROVISIONAL).
  satisfaccion: { competencyCode: 'GENERIC', competencyName: 'Satisfacción General' },
  compensaciones: { competencyCode: 'GENERIC', competencyName: 'Compensaciones' },
};

/**
 * Resuelve la competencia para una dimensión de clima. Fallback GENERIC (nunca
 * revienta) si la dimensión no está en el mapeo — el motor ya tiene su template
 * genérico para ese caso.
 */
export function mapClimaDimensionToCompetency(
  driver: string
): ClimaCompetencyMappingEntry {
  return (
    CLIMA_DIMENSION_TO_COMPETENCY[driver] ?? {
      competencyCode: 'GENERIC',
      competencyName: driver,
    }
  );
}
