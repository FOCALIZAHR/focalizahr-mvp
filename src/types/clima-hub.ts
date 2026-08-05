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

// ─────────────────────────────────────────────────────────────────────────────
// Cobertura de registro por gerencia (H2a) — Cápsula 3, Estado A.
//
// Responde "quién escribió y quién no", agregado por unidad organizacional. Es el
// MISMO numerador que la portada (`actionText !== null`), abierto por rama del
// árbol en vez de sumado en un solo número.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Una unidad del árbol con su cobertura AGREGADA (la propia más la de todos sus
 * descendientes). Recursiva: `children` permite bajar gerencia → departamento sin
 * pedir nada más al servidor.
 *
 * Misma forma que `ClimaDepartmentInsight.children` (`types/clima.ts:138`), para
 * que la UI pueda clonar `UnitRow` sin adaptar el shape.
 */
export interface ClimaCoberturaUnidadDTO {
  departmentId: string;
  departmentName: string;
  /** Focos aprobados en esta unidad y todo su subárbol. */
  total: number;
  /** De esos, cuántos tienen al menos una acción registrada. */
  withAction: number;
  /** 0-100. Nunca null acá: una unidad sin focos no se incluye en el árbol. */
  pct: number;
  /** Unidades hijas con focos. `undefined` en hojas. */
  children?: ClimaCoberturaUnidadDTO[];
}

export interface ClimaCoberturaDTO {
  /** Unidades de primer nivel del scope visible, peor cobertura primero. */
  units: ClimaCoberturaUnidadDTO[];
  /** Totales del scope — coinciden con los de `/summary` para el mismo viewer. */
  total: number;
  withAction: number;
  pct: number | null;
  /**
   * Cuándo se aprobó el plan (`ActionPlan.approvedAt`), en ISO. Es el t0 del
   * seguimiento: desde acá se cuentan los días que lleva abierto el periodo de
   * registro.
   *
   * Va en el DTO y no se deriva en el cliente porque es un hecho del servidor: la
   * fecha en que un humano aprobó, no algo que el navegador pueda inferir.
   * `null` si el plan quedó aprobado sin sellar la fecha (planes viejos).
   */
  approvedAt: string | null;
}
