// src/types/clima-bitacora.ts
// Bitácora de Acciones de Clima — contrato del modo `scope=mine` de
// GET /api/clima/action-log.
//
// Archivo NUEVO a propósito, mismo criterio que clima-atacar-causa.ts: la Bitácora es
// la superficie del JEFE (escribe), Tab 2 es la de RRHH (consulta). Mezclarlas en un
// archivo invita a que alguien reuse el DTO equivocado.
//
// Persona-céntrico, no plan-céntrico: los modos existentes del endpoint piden
// planId+departmentId porque RRHH ya eligió responsable y departamento antes de entrar.
// Acá el usuario ES el responsable y puede cubrir N departamentos, incluso fuera de su
// subárbol del JWT (por walk-up). El servidor resuelve qué le toca; el cliente no elige.

import type { ClimaAtacarCausaEntryDTO } from './clima-atacar-causa';

/** Un hallazgo asignado al viewer: el plan aprobado para ese foco + su bitácora. */
export interface ClimaBitacoraItemDTO {
  logId: string;
  triggerRef: string;
  /**
   * Dimensión de la taxonomía real (`liderazgo`, `autonomia`, …). Viaja el KEY, no el
   * label: el label sale de `dimensionLabel()` en el cliente. Sale de
   * ClimaDecisionItem.category, que ya está en memoria en el handler — NO se parsea del
   * triggerRef (el parser vive en ActionEffectivenessService y no se duplica).
   */
  category: string;
  departmentId: string;
  departmentName: string;
  /** Narrativa del hallazgo. Hoy arranca con `PROVISIONAL: ` (diccionario sin sellar). */
  narrative: string;
  steps: string[];
  ceoNotes: string | null;
  /** Resuelto en el server. Siempre true en este modo (por construcción del filtro). */
  canWrite: boolean;
  entriesCount: number;
  /** Últimas 3, más reciente primero. Con `author` resuelto. */
  entries: ClimaAtacarCausaEntryDTO[];
}

/** Response del modo `scope=mine`. */
export interface ClimaBitacoraMineResponse {
  items: ClimaBitacoraItemDTO[];
  /** Hallazgos del viewer sin registrar (ClimaActionLog.actionText === null). */
  pendingCount: number;
}
