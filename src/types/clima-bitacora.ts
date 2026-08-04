// src/types/clima-bitacora.ts
// Bitácora de Acciones de Clima — contrato del modo `scope=mine` de
// GET /api/clima/action-log.
//
// AUTOCONTENIDO A PROPÓSITO: no importa nada de clima-atacar-causa.ts ni de
// clima-planes.ts. La Bitácora es la superficie del JEFE (escribe); Tab 1 y Tab 2 son
// las de RRHH (consultan). Compartir un DTO entre las dos ata dos pantallas que
// evolucionan por motivos distintos, y obliga a tocar el contrato de una para cambiar
// la otra. `id/text/createdAt` se repiten acá y allá: esa duplicación es el precio
// deliberado de que ninguna pantalla pueda romper a la otra.
//
// Persona-céntrico, no plan-céntrico: los modos existentes del endpoint piden
// planId+departmentId porque RRHH ya eligió responsable y departamento antes de entrar.
// Acá el usuario ES el responsable y puede cubrir N departamentos, incluso fuera de su
// subárbol del JWT (por walk-up). El servidor resuelve qué le toca; el cliente no elige.

/**
 * Relación del AUTOR de una entrada con el departamento del hallazgo.
 *
 * Se DERIVA EN LECTURA comparando `createdBy` contra el responsable resuelto de HOY
 * (D5): es un dato orientativo, no evidencia. Consecuencia asumida: si cambia el
 * responsable del departamento, entradas viejas cambian de valor. Persistirlo sería
 * una columna nueva en ClimaActionLogEntry.
 *
 * ⚠️ NO SE MUESTRA EN PANTALLA (decisión Victor 2026-08-03). El cargo del autor ya
 * dice de dónde viene la entrada; una etiqueta de jerarquía no agrega información y
 * puede leerse como vigilancia. Viaja en el DTO por si más adelante hace falta.
 */
export type ClimaBitacoraAuthorRelation = 'responsable' | 'superior';

/** Quién escribió una entrada. `position` es Employee.position (jobTitle está vacío). */
export interface ClimaBitacoraAuthorDTO {
  /** Ya pasado por formatDisplayName() en el servidor: la nómina trae ALL CAPS. */
  name: string;
  position: string | null;
  relation: ClimaBitacoraAuthorRelation;
}

/** Una entrada de bitácora. `createdAt` = ISO string. */
export interface ClimaBitacoraEntryDTO {
  id: string;
  text: string;
  createdAt: string;
  /** `null` si la entrada no tiene autor registrado o el Employee ya no existe. */
  author: ClimaBitacoraAuthorDTO | null;
}

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
  entries: ClimaBitacoraEntryDTO[];
}

/** Response del modo `scope=mine`. */
export interface ClimaBitacoraMineResponse {
  items: ClimaBitacoraItemDTO[];
  /** Hallazgos del viewer sin registrar (ClimaActionLog.actionText === null). */
  pendingCount: number;
}
