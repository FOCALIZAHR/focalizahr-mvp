// src/lib/services/clima/climaPlanRouting.ts
// ════════════════════════════════════════════════════════════════════════════
// EX Clima — Gate 5D-i: ruteo de una ClimaDecisionItem a su bloque de Tab 1.
// PURO / client-safe (sin prisma) — unit-testable. Reglas: semilla §5/§5bis +
// RESOLUCION_GATE_5D_TAB1_TAB3 §1.
//
//   Block 1 — sistémico:          isSystemic → siempre individual, arriba de todo.
//   Block 2 — crítico:            zona roja/naranja → cards individuales.
//   Block 3 — gestión corriente:  zona amarilla + variante Capa 2 con esfuerzo BAJO
//                                 y efectividad ALTA/MEDIA_ALTA → lote.
//   Block 4 — genérico:           zona amarilla sin variante (esfuerzo/efectividad
//                                 ausentes en celda base) o esfuerzo alto → individual.
//
// (Block 5 "sin datos" no sale de una decisión: son los departamentos sin
//  reactiveAnalysis que el endpoint reporta aparte — no se clasifican acá.)
// ════════════════════════════════════════════════════════════════════════════

import type { ClimaDecisionItem } from '@/types/clima-planes';

export type ClimaPlanBlock = 'sistemico' | 'critico' | 'gestion_corriente' | 'generico';

/** Bloques individuales (una decisión por card, sin lote). */
export const INDIVIDUAL_BLOCKS: readonly ClimaPlanBlock[] = [
  'sistemico',
  'critico',
  'generico',
] as const;

export function classifyDecisionBlock(item: ClimaDecisionItem): ClimaPlanBlock {
  if (item.isSystemic) return 'sistemico';

  const zone = item.intervention.level;
  if (zone === 'roja' || zone === 'naranja') return 'critico';

  // zona amarilla — lote solo si la variante Capa 2 aporta esfuerzo/efectividad aptos.
  const { esfuerzo, efectividad } = item.intervention;
  if (esfuerzo === 'BAJO' && (efectividad === 'ALTA' || efectividad === 'MEDIA_ALTA')) {
    return 'gestion_corriente';
  }
  return 'generico';
}

/** Agrupa un set de decisiones por bloque, preservando el orden de entrada. */
export function groupDecisionsByBlock(
  items: ClimaDecisionItem[]
): Record<ClimaPlanBlock, ClimaDecisionItem[]> {
  const groups: Record<ClimaPlanBlock, ClimaDecisionItem[]> = {
    sistemico: [],
    critico: [],
    gestion_corriente: [],
    generico: [],
  };
  for (const item of items) groups[classifyDecisionBlock(item)].push(item);
  return groups;
}

// ════════════════════════════════════════════════════════════════════════════
// Sub-batches del lote (Gestión Corriente) POR REACTIVO — decisión Victor:
// cada reactivo tiene su propio botón/confirmación, NO un batch combinado, para
// preservar trazabilidad en la matriz de efectividad (¿"feedback en lote" funcionó
// distinto a "herramientas en lote"?). Clave = category::reactivo::zona.
// ════════════════════════════════════════════════════════════════════════════

export interface ClimaLoteSubBatch {
  key: string;
  category: string;
  reactive: string | null;
  zone: ClimaDecisionItem['intervention']['level'];
  items: ClimaDecisionItem[];
}

export function groupLoteByReactive(items: ClimaDecisionItem[]): ClimaLoteSubBatch[] {
  const map = new Map<string, ClimaLoteSubBatch>();
  const order: string[] = [];
  for (const item of items) {
    const reactive = item.selectedReactive ?? null;
    const zone = item.intervention.level;
    const key = `${item.category}::${reactive ?? '∅'}::${zone}`;
    if (!map.has(key)) {
      map.set(key, { key, category: item.category, reactive, zone, items: [] });
      order.push(key);
    }
    map.get(key)!.items.push(item);
  }
  return order.map((k) => map.get(k)!);
}
