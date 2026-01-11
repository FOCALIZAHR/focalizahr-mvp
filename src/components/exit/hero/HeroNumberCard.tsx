// ====================================================================
// HERO NUMBER CARD - Exit Intelligence
// src/components/exit/hero/HeroNumberCard.tsx
// Filosofia: Metrica hero con severity styling
// ====================================================================

'use client';

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface HeroNumberCardProps {
  value: number | string;
  label: string;
  trend?: {
    direction: 'up' | 'down' | 'stable';
    value: string;
  };
  severity?: 'critical' | 'warning' | 'normal';
}

const SEVERITY_COLORS = {
  critical: '#EF4444',
  warning: '#F59E0B',
  normal: '#22D3EE'
};

const TREND_ICONS = {
  up: TrendingUp,
  down: TrendingDown,
  stable: Minus
};

export default function HeroNumberCard({
  value,
  label,
  trend,
  severity = 'normal'
}: HeroNumberCardProps) {
  const borderColor = SEVERITY_COLORS[severity];
  const TrendIcon = trend ? TREND_ICONS[trend.direction] : null;

  const getTrendColor = () => {
    if (!trend) return 'text-slate-400';
    switch (trend.direction) {
      case 'up': return 'text-emerald-400';
      case 'down': return 'text-red-400';
      default: return 'text-slate-400';
    }
  };

  return (
    <div
      className="fhr-card-metric group relative overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
      style={{ borderLeftWidth: '4px', borderLeftColor: borderColor }}
    >
      {/* Glow sutil */}
      <div
        className="absolute -top-10 -right-10 w-24 h-24 rounded-full blur-3xl opacity-10 pointer-events-none"
        style={{ backgroundColor: borderColor }}
      />

      <div className="relative z-10 p-4 md:p-5">
        {/* Valor principal */}
        <div className="text-4xl md:text-5xl font-light text-white mb-2 tabular-nums">
          {value}
        </div>

        {/* Label */}
        <div className="text-sm text-slate-400 mb-2">
          {label}
        </div>

        {/* Trend */}
        {trend && TrendIcon && (
          <div className={`flex items-center gap-1.5 text-xs ${getTrendColor()}`}>
            <TrendIcon className="h-3.5 w-3.5" strokeWidth={2} />
            <span>{trend.value}</span>
          </div>
        )}
      </div>
    </div>
  );
}
