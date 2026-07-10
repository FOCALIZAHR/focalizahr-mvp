// src/lib/constants/climaSubproductos.ts
// ════════════════════════════════════════════════════════════════════════════
// Las 4 cards del Rail de Clima (v3 §3A). El Rail dejó de listar departamentos:
// es el MENÚ del producto. Cada card abre su propia vista completa; el filtrado
// jerárquico se resuelve DENTRO de cada vista (patrón scope), nunca acá.
//
// Los labels son los sellados por Victor en el semilla v3 §3A — no reescribir
// (son estructura de navegación, no narrativa). Los íconos son estructurales.
// ════════════════════════════════════════════════════════════════════════════

import { Film, Radar, Trophy, LayoutGrid, type LucideIcon } from 'lucide-react';
import type { ClimaSubproducto } from '@/types/clima';

export interface ClimaSubproductoDef {
  id: ClimaSubproducto;
  label: string;
  icon: LucideIcon;
  /** Cascada no es una vista aparte: re-arma la secuencia intro sobre el Lobby. */
  replaysIntro?: boolean;
}

export const CLIMA_SUBPRODUCTOS: ClimaSubproductoDef[] = [
  { id: 'cascada', label: 'Cascada', icon: Film, replaysIntro: true },
  { id: 'analisis', label: 'Análisis de Clima', icon: Radar },
  { id: 'ranking', label: 'Ranking', icon: Trophy },
  { id: 'dimensiones', label: 'Dimensiones', icon: LayoutGrid },
];

export function climaSubproductoLabel(id: ClimaSubproducto): string {
  return CLIMA_SUBPRODUCTOS.find((s) => s.id === id)?.label ?? id;
}
