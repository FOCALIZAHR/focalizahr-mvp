'use client';

// src/components/clima/MomentumBadge.tsx
// Badge de tendencia (↗ ↘ →) del Engagement Index vs el período anterior.
// Genérico cross-producto. momentum = delta en pp (solo drivers medidos en
// ambos períodos; null = sin período anterior comparable).

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MomentumBadgeProps {
  momentum: number | null;
  /** Umbral pp para considerar cambio significativo (default 5). */
  threshold?: number;
  size?: 'sm' | 'md';
}

export default function MomentumBadge({ momentum, threshold = 5, size = 'md' }: MomentumBadgeProps) {
  if (momentum === null) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 font-light">
        <Minus className="w-3 h-3" />
        sin histórico
      </span>
    );
  }

  const up = momentum >= threshold;
  const down = momentum <= -threshold;
  // Anti-semáforo (nunca rojo): sube → cyan · baja → ámbar · estable → slate.
  const color = up ? '#22D3EE' : down ? '#F59E0B' : '#94A3B8';
  const Icon = up ? TrendingUp : down ? TrendingDown : Minus;
  const sign = momentum > 0 ? '+' : '';
  const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5';
  const textSize = size === 'sm' ? 'text-[10px]' : 'text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1 ${textSize} font-medium tabular-nums`}
      style={{ color }}
    >
      <Icon className={iconSize} />
      {sign}
      {Math.round(momentum)}pp
    </span>
  );
}
