// src/lib/utils/buildClimaAnclaComponents.ts
// ════════════════════════════════════════════════════════════════════════════
// Mapea los 4 nodos del Acto Ancla de clima (ClimaAnclaNode) al shape que
// consume AnclaInteligente (AnclaComponent). Clon del rol de
// buildPLTalentAnclaComponents (PLTalent.utils.ts) — Tipo 2, Masa y Gravedad.
// El nodo con tooltip (Confiabilidad — Ancla Científica) se marca isStatic.
// ════════════════════════════════════════════════════════════════════════════

import type { AnclaComponent } from '@/components/executive/AnclaInteligente'
import type { ClimaAnclaNode } from '@/types/clima-cascada'

export function buildClimaAnclaComponents(nodes: ClimaAnclaNode[]): AnclaComponent[] {
  return nodes.map((n) => ({
    value: n.value,
    label: n.label,
    narrative: n.narrative,
    tooltip: n.tooltip,
    suffix: n.suffix,
    // El nodo científico (Confiabilidad) lleva tooltip → estático (número blanco,
    // sin micro-barra proporcional), igual que el "Umbral de referencia" de P&L.
    isStatic: !!n.tooltip,
  }))
}
