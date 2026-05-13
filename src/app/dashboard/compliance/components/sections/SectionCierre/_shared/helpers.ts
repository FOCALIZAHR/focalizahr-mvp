// ════════════════════════════════════════════════════════════════════════════
// SECTION CIERRE (C4 — Plan Global) — HELPERS PUROS
// _shared/helpers.ts
// ════════════════════════════════════════════════════════════════════════════
// Funciones determinísticas que el componente raíz y los bloques consumen.
// Reglas:
//   - Sin side-effects. Sin acceso a hook, fetch, ni DOM.
//   - Acciones con triggerType desconocido se filtran silenciosamente
//     (las 4 categorías del schema cubren el universo actual).
//   - Orden dentro de cada bloque: registeredAt desc (lo más reciente arriba).
// ════════════════════════════════════════════════════════════════════════════

import type { CompliancePlanAction } from '@/types/compliance';
import {
  ORIGIN_BY_TRIGGER_TYPE,
  ORIGIN_ORDER,
  type OriginKey,
} from './constants';

export interface PlanOriginBucket {
  origin: OriginKey;
  actions: CompliancePlanAction[];
}

/**
 * Agrupa CompliancePlanAction[] por origen ejecutivo.
 * Retorna un array en `ORIGIN_ORDER`, omitiendo buckets vacíos.
 * Acciones con triggerType no reconocido se descartan.
 */
export function groupPlanActionsByOrigin(
  actions: CompliancePlanAction[]
): PlanOriginBucket[] {
  const buckets: Record<OriginKey, CompliancePlanAction[]> = {
    dimensiones:  [],
    patrones:     [],
    convergencia: [],
    alertas:      [],
  };

  for (const action of actions) {
    const origin = ORIGIN_BY_TRIGGER_TYPE[action.triggerType];
    if (!origin) continue;
    buckets[origin].push(action);
  }

  // Orden interno de cada bucket: registeredAt desc.
  for (const key of Object.keys(buckets) as OriginKey[]) {
    buckets[key].sort((a, b) => {
      const ta = new Date(a.registeredAt).getTime();
      const tb = new Date(b.registeredAt).getTime();
      return tb - ta;
    });
  }

  return ORIGIN_ORDER
    .map((origin) => ({ origin, actions: buckets[origin] }))
    .filter((b) => b.actions.length > 0);
}

/**
 * Formatea una fecha (string ISO o Date) a "12 may" en es-CL.
 * Null-safe — retorna string vacío si el input es inválido.
 */
export function formatActionDate(date: string | Date): string {
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('es-CL', {
    day: '2-digit',
    month: 'short',
  });
}
