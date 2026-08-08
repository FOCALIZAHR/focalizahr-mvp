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

// ─────────────────────────────────────────────────────────────────────────────
// Cascada de hallazgos (H3b) — Cápsula 3, Estado B.
// Diseño: `.claude/tasks/DISENO_CASCADA_HALLAZGOS_CAPSULA3.md`.
//
// ⛔ EL UMBRAL SE APLICA EN EL SERVIDOR, NO EN EL CLIENTE. Bajo umbral el endpoint
// devuelve CONTEOS Y NADA MÁS: ni una cita, ni un nombre, ni un score. Si mandara
// los hallazgos y la UI los escondiera, bastaría abrir la pestaña de red para leer
// texto de jefes que todavía no debería verse. El diseño §1 lo pide explícito
// ("NO mostrar nombres, NO mostrar densidad, NO mostrar verbos"); acá se cumple
// no enviándolos.
// ─────────────────────────────────────────────────────────────────────────────

/** Avance de UNA gerencia. Se conserva para el header y el Radar. */
export interface ClimaFindingsUnitProgress {
  departmentId: string;
  departmentName: string;
  /** Entradas de bitácora analizadas en esa unidad y su subárbol. */
  entriesAnalyzed: number;
}

/**
 * UNA tarjeta del Modo Táctico (diseño v2 §3.2): un registro de bitácora con su
 * clasificación ya TRADUCIDA a lenguaje de directorio.
 *
 * ⛔ Acá NO hay `verbMode`, ni `entityDensity`, ni `score`. El servidor traduce y
 * manda el resultado; el vocabulario del motor no viaja. Si viajara, bastaría la
 * pestaña de red para leerlo, y §2 dice que el CEO nunca lo ve.
 */
export interface ClimaTacticalCardDTO {
  entryId: string;
  /** "Ejecución Comprobable" · "Promesa de Acción" · "Observación sin Ejecución". */
  label: string;
  /** Índice de Confiabilidad Operativa, en palabras: "Evidencia verificable", etc. */
  confidenceLabel: string;
  /** Grupo de orden del feed (§3.4). Menor primero. No es semántica de color. */
  groupOrder: number;
  /** VERBATIM. Sin normalizar mayúsculas ni corregir ortografía: es evidencia. */
  text: string;
  authorName: string | null;
  authorPosition: string | null;
  createdAt: string;
  departmentName: string;
  /** Dimensión de clima del foco ("Liderazgo"), del plan aprobado. */
  dimension: string | null;
}

export interface ClimaFindingsDTO {
  /** `tactico` = auditoría caso por caso · `macro` = patrones agregados. */
  mode: 'tactico' | 'macro';
  /** Entradas analizadas en todo el scope visible. */
  entriesAnalyzed: number;
  /** `CLIMA_MODO_MACRO_MIN_ENTRIES`. Viaja para que la UI no lo duplique. */
  threshold: number;
  /** Cuántas presentan ejecución comprobable — el header de §3.5. */
  executionCount: number;
  /** Avance por gerencia. Contexto del header y del Radar. */
  units: ClimaFindingsUnitProgress[];
  /** Modo Táctico: una por registro, ya ordenadas. Vacío en Modo Macro. */
  cards: ClimaTacticalCardDTO[];
  /**
   * Modo Macro: patrones agregados. VACÍO hoy — el Modo Macro se diseña con datos
   * reales cuando se crucen las 15 entradas (v2 §4 y §11). No es deuda: es una
   * decisión explícita de no diseñar sobre wireframes teóricos.
   */
  findings: ClimaFindingDTO[];
}

/**
 * Narrativa ejecutiva generada por Sonnet sobre el conjunto de registros.
 *
 * Viaja por SU PROPIO endpoint (`/narrative`) y no dentro de `/findings`: tarda
 * ~15 s y no puede bloquear el pintado de la pantalla. `null` = todavía cargando,
 * o no hubo patrón, o la validación la descartó — en los tres casos la UI muestra
 * el headline de template, que siempre es correcto.
 */
export interface ClimaNarrativeDTO {
  headline: string;
  soporte: string;
  /** Nombre interno del patrón. Auditoría, no se muestra. */
  patron: string;
  /** Registros citados como respaldo (R1, R2…). Auditoría, no se muestra. */
  evidencia: string[];
  model: string;
  generatedAt: string;
}

/** Hallazgo agregado del Modo Macro. Se define cuando ese gate se abra. */
export interface ClimaFindingDTO {
  id: string;
  /** Rótulo del bloque. Habla del patrón, nunca de una persona. */
  kind: string;
  headline: string;
  observation: string;
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
  /**
   * Cuándo se escribió la ÚLTIMA entrada de bitácora del scope visible, en ISO.
   * `null` si no hay ninguna.
   *
   * Reemplazó a los días desde la aprobación como dato protagonista: "aprobado
   * hace 17 días" mide la antigüedad del plan y no se mueve nunca; "último
   * registro hace 2 días" mide si el equipo sigue vivo, y es lo que cambia.
   */
  lastEntryAt: string | null;
}
