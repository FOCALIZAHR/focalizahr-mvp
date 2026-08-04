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
  NotebookPen,
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
  { id: 'planes', label: 'Planes de Acción', icon: ClipboardCheck },
  // 6ª card. Las otras cinco son de CONSULTA; ésta es la única donde se ESCRIBE:
  // el responsable de un departamento registra qué hizo con sus focos de clima.
  //
  // PENDIENTE (una línea, cuando exista el vínculo Employee↔User): gatear esta card
  // por `pendingCount > 0` de GET /api/clima/action-log?scope=mine&count=1, para que
  // no se le muestre a quien no tiene focos asignados. HOY se muestra SIEMPRE: sin el
  // vínculo poblado el conteo da 0 para todos y la card no aparecería nunca, o sea que
  // el gate escondería la pantalla en vez de filtrarla.
  { id: 'bitacora', label: 'Bitácora de Acciones', icon: NotebookPen },
];

export function climaSubproductoLabel(id: ClimaSubproducto): string {
  return CLIMA_SUBPRODUCTOS.find((s) => s.id === id)?.label ?? id;
}
