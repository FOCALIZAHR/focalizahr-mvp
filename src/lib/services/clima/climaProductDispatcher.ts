// src/lib/services/clima/climaProductDispatcher.ts
// ════════════════════════════════════════════════════════════════════════════
// EX Clima — Dispatcher de productos de intervención (Capa 2).
//
// UN SOLO LUGAR que mapea cada `InterventionTarget` a su acción real. Las 93
// variantes de Capa 2 (y las 32 base, si migran) activan a través de ESTE mapa,
// sin tocarse una por una — ese es el requisito de diseño del gate.
//
// ALCANCE DE ESTE GATE (decisión Victor): solo el MAPA DECLARATIVO. El handler
// runtime `activateProduct(target, ctx)` (fetch al endpoint con el contexto del
// clic) se construye en 5D, cuando exista el contrato de contexto de la UI (Tab 1
// cards / Tab 2 persona). Hoy `target` es inerte igual que el string libre previo;
// este mapa documenta y prueba el ÚNICO punto de wiring futuro, sin código muerto.
//
// PURO / client-safe: sin prisma, sin fetch, solo datos.
// ════════════════════════════════════════════════════════════════════════════

import type { InterventionTarget } from '@/types/clima-planes';

/** Naturaleza de la acción detrás de un target. */
export type DispatchKind = 'none' | 'pdi' | 'meta';

/**
 * Descriptor declarativo de un target. `endpoint` null = sin acción. `requires` =
 * campos de contexto que la UI 5D debe reunir antes de invocar. `pending` = motivo
 * por el que el wiring runtime aún no está vivo (bloqueo de orden entre gates).
 */
export interface DispatchDescriptor {
  kind: DispatchKind;
  /** Endpoint REST que la acción golpea, o null si no hay acción. */
  endpoint: string | null;
  /** Campos de contexto que el caller (UI 5D) debe aportar. */
  requires: readonly string[];
  /** Presente si el wiring runtime aún NO está disponible (y por qué). */
  pending?: string;
}

/**
 * ÚNICO punto de mapeo target → acción real.
 *
 * - PDI_CLIMA → `POST /api/clima/pdi-suggestion` (VIVO, sellado Gate 5B-ii).
 * - META_AREA / META_DURA → `POST /api/goals` existe, pero el wiring desde clima
 *   vive en 5D Tab 2 (POR PERSONA), aún no construido → `pending`.
 * - SIN_CTA → sin acción (celda base/sistémica sin CTA de variante).
 */
export const CLIMA_PRODUCT_DISPATCH: Record<InterventionTarget, DispatchDescriptor> = {
  SIN_CTA: {
    kind: 'none',
    endpoint: null,
    requires: [],
  },
  PDI_CLIMA: {
    kind: 'pdi',
    endpoint: '/api/clima/pdi-suggestion',
    requires: ['employeeId', 'cycleId', 'driver', 'teamFavorability'],
  },
  META_AREA: {
    kind: 'meta',
    endpoint: '/api/goals',
    requires: ['departmentId', 'title', 'target'],
    pending: '5D Tab 2 (POR PERSONA) — wiring clima→/api/goals aún no construido',
  },
  META_DURA: {
    kind: 'meta',
    endpoint: '/api/goals',
    requires: ['employeeId', 'cycleId', 'title', 'target'],
    pending: '5D Tab 2 (POR PERSONA) — wiring clima→/api/goals aún no construido',
  },
};

/** Descriptor de un target (helper de lectura; la UI 5D lo consume en el clic). */
export function resolveDispatch(target: InterventionTarget): DispatchDescriptor {
  return CLIMA_PRODUCT_DISPATCH[target];
}
