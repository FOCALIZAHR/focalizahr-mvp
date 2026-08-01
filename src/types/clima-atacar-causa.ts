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

/** Una entrada de bitácora. `createdAt` = ISO string. */
export interface ClimaAtacarCausaEntryDTO {
  id: string;
  text: string;
  createdAt: string;
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
