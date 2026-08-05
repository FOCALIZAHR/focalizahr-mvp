// src/lib/constants/climaSubproductos.ts
// ════════════════════════════════════════════════════════════════════════════
// Las 4 cards del Rail de Clima (v3 §3A). El Rail dejó de listar departamentos:
// es el MENÚ del producto. Cada card abre su propia vista completa; el filtrado
// jerárquico se resuelve DENTRO de cada vista (patrón scope), nunca acá.
//
// Los labels son los sellados por Victor en el semilla v3 §3A — no reescribir
// (son estructura de navegación, no narrativa). Los íconos son estructurales.
// ════════════════════════════════════════════════════════════════════════════

import {
  Film,
  Radar,
  Trophy,
  LayoutGrid,
  ClipboardCheck,
  type LucideIcon,
} from 'lucide-react';
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
  // `planes` ya no abre la vista de planes: abre el HUB de Planes de Acción, con
  // sus tres cápsulas (Planes · Bitácora · Seguimiento de Efectividad).
  { id: 'planes', label: 'Planes de Acción', icon: ClipboardCheck },
];

// ⛔ LA BITÁCORA YA NO ES UNA CARD DEL RAIL (decisión de Victor, 2026-08-05).
//
// Fue la 6ª card hasta el hub. Ahora es la cápsula 2 y se entra por
// Planes de Acción → Bitácora. Se retiró para que haya UNA sola puerta a cada
// mundo: dos entradas a la misma pantalla obligan al jefe a preguntarse si son
// lo mismo. Costo aceptado y explícito: el jefe pasa de 1 a 2 clics para llegar
// a su única superficie de escritura.
//
// El gating por `pendingCount > 0` que estaba anotado acá muere con la card: el
// hub no se gatea por contenido (lo abren RRHH y gerencia, que no tienen focos
// propios). Si algún día la Bitácora vuelve al Rail, la nota vive en el
// as-built de F4 (`PLAN_BITACORA_ACCIONES_CLIMA.md:485`).

export function climaSubproductoLabel(id: ClimaSubproducto): string {
  return CLIMA_SUBPRODUCTOS.find((s) => s.id === id)?.label ?? id;
}
