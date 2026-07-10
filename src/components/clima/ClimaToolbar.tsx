'use client';

// src/components/clima/ClimaToolbar.tsx
// ════════════════════════════════════════════════════════════════════════════
// Barra flotante de las 8 dimensiones de clima (taxonomía Gate 1A). Clon adapter
// de WorkforceToolbar: arma 8 ToolDefinition y alimenta ModuleToolbar (icon-strip
// glass reutilizado). Solo visible en el Lobby, entre MissionControl y Rail.
//
// A diferencia de Workforce, el clic NO abre el panel inline sino un MODAL
// (ClimaDimensionModal) con el componente rico de 3 capas (semilla §8.2) → vía
// `onSelect` de ModuleToolbar. Es el "anexo": apoyo, nunca reemplazo del Rail ni
// de las Cards.
//
// Guard n≥5 (decisión Victor): una dimensión sin n≥5 en NINGÚN depto → ícono
// DESHABILITADO + tooltip explicativo (no oculto — la taxonomía de 8 es fija).
// ════════════════════════════════════════════════════════════════════════════

import { useState, useMemo } from 'react';
import ModuleToolbar, { type ToolDefinition } from '@/components/ui/ModuleToolbar';
import ClimaDimensionModal from '@/components/clima/ClimaDimensionModal';
import { CLIMA_DIMENSIONS } from '@/lib/constants/climaDimensions';
import { zoneColor } from '@/components/clima/climaZonePalette';
import type { ClimaDimensionAgg } from '@/lib/utils/aggregateClimaDimension';
import type { ClimaDepartmentInsight } from '@/types/clima';

interface ClimaToolbarProps {
  /** Agregado por dimensión, indexado por driver (las 8). */
  dimensions: Record<string, ClimaDimensionAgg>;
  departments: ClimaDepartmentInsight[];
}

export default function ClimaToolbar({ dimensions, departments }: ClimaToolbarProps) {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

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
          // breakdown no se usa en modo onSelect (abre modal, no panel); se llena
          // para completitud del contrato de ToolDefinition.
          breakdown:
            agg?.worstDepts.map((d) => ({
              label: d.departmentName,
              value: d.fav ?? 0,
              formatted: d.fav != null ? `${Math.round(d.fav)}%` : '—',
            })) ?? [],
          disabled,
          disabledReason: disabled
            ? `${dim.label}: sin base suficiente para reportar — menos de 5 respuestas en toda la campaña.`
            : undefined,
        };
      }),
    [dimensions],
  );

  const selected = selectedKey ? (dimensions[selectedKey] ?? null) : null;

  return (
    <>
      <ModuleToolbar tools={tools} onSelect={(id) => setSelectedKey(id)} />
      <ClimaDimensionModal
        dimension={selected}
        departments={departments}
        onClose={() => setSelectedKey(null)}
      />
    </>
  );
}
