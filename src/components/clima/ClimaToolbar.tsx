'use client';

// src/components/clima/ClimaToolbar.tsx
// ════════════════════════════════════════════════════════════════════════════
// Barra flotante de las 8 dimensiones de clima (taxonomía Gate 1A). Clon adapter
// de WorkforceToolbar: arma 8 ToolDefinition y alimenta ModuleToolbar (icon-strip
// glass reutilizado). Solo visible en el Lobby, lateral.
//
// §3E — ATAJO, no una quinta vista:
//   hover sobre un ícono → popover Capa 1 (número + banda de zona) vía `band` de
//     ToolDefinition — un vistazo, no navega.
//   clic → abre la MISMA vista Dimensiones (§3D) en esa dimensión (onOpenDimension),
//     el mismo destino que la card del Rail. Ya NO abre un modal propio.
//
// Guard n≥5 (decisión Victor): una dimensión sin n≥5 en NINGÚN depto → ícono
// DESHABILITADO + tooltip explicativo (no oculto — la taxonomía de 8 es fija).
// ════════════════════════════════════════════════════════════════════════════

import { useMemo } from 'react';
import ModuleToolbar, { type ToolDefinition } from '@/components/ui/ModuleToolbar';
import { CLIMA_DIMENSIONS } from '@/lib/constants/climaDimensions';
import {
  zoneColor,
  ZONE_LABEL,
  CLIMA_TARGET_FAVORABILITY,
} from '@/components/clima/climaZonePalette';
import type { ClimaDimensionAgg } from '@/lib/utils/aggregateClimaDimension';

interface ClimaToolbarProps {
  /** Agregado por dimensión, indexado por driver (las 8). */
  dimensions: Record<string, ClimaDimensionAgg>;
  /** Clic en un ícono → abre la vista Dimensiones en esa dimensión (§3E). */
  onOpenDimension: (driver: string) => void;
}

export default function ClimaToolbar({ dimensions, onOpenDimension }: ClimaToolbarProps) {
  const tools = useMemo<ToolDefinition[]>(
    () =>
      CLIMA_DIMENSIONS.map((dim) => {
        const agg = dimensions[dim.key];
        const disabled = !agg || !agg.hasSufficientData;
        return {
          id: dim.key,
          label: dim.label,
          icon: dim.icon,
          metric: agg?.orgFav != null ? String(Math.round(agg.orgFav)) : '—',
          unit: '%',
          color: agg ? zoneColor(agg.zone) : '#64748B',
          // Capa 1 en el hover: banda de zona + objetivo (§3E).
          band: agg?.zone ? ZONE_LABEL[agg.zone] : undefined,
          sublabel: `vs. objetivo ${CLIMA_TARGET_FAVORABILITY}`,
          // breakdown no se usa en modo onSelect (navega, no abre panel inline).
          breakdown: [],
          disabled,
          disabledReason: disabled
            ? `${dim.label}: sin base suficiente para reportar — menos de 5 respuestas en toda la campaña.`
            : undefined,
        };
      }),
    [dimensions],
  );

  return <ModuleToolbar tools={tools} onSelect={onOpenDimension} />;
}
