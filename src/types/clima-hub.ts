// src/types/clima-hub.ts
// Contratos del Hub de Planes de Acción (H1). Archivo propio y no un anexo de
// `clima-planes.ts` / `clima-bitacora.ts`: el hub es la capa de NAVEGACIÓN por
// encima de las tres cápsulas, y no comparte forma con ninguna de ellas.

/** Las tres cápsulas del hub. Ids estables: son contrato interno, no labels. */
export type ClimaPlanesCapsula = 'planes' | 'bitacora' | 'efectividad';

/**
 * Progreso global del hub: hallazgos aprobados con al menos una acción
 * registrada, sobre el total de hallazgos aprobados que el viewer alcanza.
 *
 * `pct` es null SOLO cuando `total === 0` — no hay fracción que mostrar. Un 0%
 * con denominador cero se leería como "nadie registró nada", que es una
 * afirmación distinta de "todavía no hay nada que registrar".
 */
export interface ClimaPlanesProgressDTO {
  withAction: number;
  total: number;
  pct: number | null;
  /**
   * Focos que YA recibieron veredicto de efectividad (`impactMeasured` no null).
   * Es 0 hasta que cierra un Seguimiento Focalizado — el único evento que dispara
   * `ActionEffectivenessService`. La Cápsula 3 lo usa para decir "pendiente de
   * medición" sin hardcodear ese estado.
   */
  measured: number;
}

export interface ClimaPlanesProgressResponse {
  success: boolean;
  data?: ClimaPlanesProgressDTO;
  error?: string;
}
