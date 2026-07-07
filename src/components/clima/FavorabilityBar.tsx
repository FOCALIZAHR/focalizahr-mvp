'use client';

// src/components/clima/FavorabilityBar.tsx
// Barra de favorabilidad de un driver (% top-2). Genérico cross-producto.
// El color de la barra canta la zona; drivers carried (dato arrastrado de una
// medición anterior) van en gris con su fecha de origen.

import { zoneColor, zoneFromFavorability } from './climaZonePalette';

interface FavorabilityBarProps {
  label: string;
  value: number | null; // % favorable (0-100)
  carried?: boolean;
  sourceDate?: string;
}

export default function FavorabilityBar({ label, value, carried, sourceDate }: FavorabilityBarProps) {
  const hasValue = value !== null;
  const pct = hasValue ? Math.max(0, Math.min(100, value)) : 0;
  // Color anti-semáforo por zona (carried en gris).
  const barColor = carried ? '#64748B' : hasValue ? zoneColor(zoneFromFavorability(value!)) : '#475569';

  return (
    <div className="flex items-center gap-2 md:gap-3">
      <span className="w-24 md:w-32 shrink-0 text-xs font-light text-slate-300 capitalize truncate">
        {label}
      </span>
      <div className="flex-1 h-2 rounded-full bg-slate-800/70 overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: barColor, opacity: carried ? 0.5 : 1 }}
        />
      </div>
      <span className="w-16 md:w-24 shrink-0 text-right text-xs tabular-nums text-slate-400 font-light">
        {hasValue ? `${Math.round(value!)}%` : '—'}
        {carried && sourceDate && (
          <span className="block text-[9px] text-slate-500">dato de {sourceDate}</span>
        )}
      </span>
    </div>
  );
}
