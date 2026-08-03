// src/types/clima-atacar-causa.ts
// EX Clima Gate 5C — "Atacar la causa" (Tab 2). Contrato de datos de GET
// /api/clima/action-log (modo lista y modo entradas).
//
// Archivo NUEVO a propósito: NO se toca `clima-planes.ts` (lo importa Tab 1 y este
// gate no toca Tab 1 ni sus dependencias, aunque el cambio fuera aditivo). Estos
// DTOs los consume el endpoint (V1) y la vista ClimaAtacarCausaScreen (V2).

/** Una decisión aprobada del plan, acotada al departamento (aceptar|modificar). */
export interface ClimaAtacarCausaDecisionDTO {
  triggerRef: string;
  narrative: string;
  steps: string[];
  ceoNotes: string | null;
  ceoDecision: 'aceptar' | 'modificar';
}

/**
 * Relación del AUTOR de una entrada con el departamento del hallazgo.
 *
 * Se DERIVA EN LECTURA comparando `createdBy` contra el responsable resuelto de HOY
 * (decisión Victor 2026-08-03, D5): es orientativo — que el jefe sepa quién escribió
 * antes que él — no evidencia. Consecuencia asumida: si mañana cambia el responsable
 * del departamento, entradas viejas cambian de etiqueta. Persistirlo sería una columna
 * nueva en ClimaActionLogEntry, schema-first para un adorno.
 */
export type ClimaBitacoraAuthorRelation = 'responsable' | 'superior';

/** Quién escribió una entrada. `position` es Employee.position (jobTitle está vacío). */
export interface ClimaAtacarCausaEntryAuthorDTO {
  /** Ya pasado por formatDisplayName() en el servidor: la nómina trae ALL CAPS. */
  name: string;
  position: string | null;
  relation: ClimaBitacoraAuthorRelation;
}

/** Una entrada de bitácora. `createdAt` = ISO string. */
export interface ClimaAtacarCausaEntryDTO {
  id: string;
  text: string;
  createdAt: string;
  /**
   * Opcional a propósito: SOLO el modo `scope=mine` (la Bitácora) lo resuelve. Los modos
   * lista y entradas, que alimentan Tab 2, lo dejan `undefined` y no pagan el join —
   * Tab 2 es read-only de RRHH y no muestra autoría.
   */
  author?: ClimaAtacarCausaEntryAuthorDTO | null;
}

/** Un ClimaActionLog del departamento, unido a su decisión por `triggerRef`. */
export interface ClimaAtacarCausaLogDTO {
  id: string;
  triggerRef: string;
  /** Resuelto en el server (responsable === viewer). Nunca decidido en el cliente. */
  canWrite: boolean;
  entriesCount: number;
  /** Últimas 3 (más reciente primero) en modo lista; página pedida en modo entradas. */
  entries: ClimaAtacarCausaEntryDTO[];
}

/** Response del modo lista: plan (acotado al depto) + bitácora, unidos por triggerRef. */
export interface ClimaAtacarCausaResponse {
  decisiones: ClimaAtacarCausaDecisionDTO[];
  logs: ClimaAtacarCausaLogDTO[];
}
