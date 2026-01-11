// ====================================================================
// ORGANIZATIONAL HEALTH CARD - Exit Intelligence
// src/components/exit/hero/OrganizationalHealthCard.tsx
// Filosofia: Score de salud organizacional con clasificacion
// ====================================================================

'use client';

import { TrendingUp, TrendingDown, Minus, Heart } from 'lucide-react';

interface OrganizationalHealthCardProps {
  healthScore: number;
  trend?: {
    direction: 'improving' | 'stable' | 'deteriorating';
    delta: number;
  };
}

function getHealthClassification(score: number): {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
} {
  if (score >= 80) {
    return {
      label: 'Excelente',
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500'
    };
  }
  if (score >= 60) {
    return {
      label: 'Saludable',
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10',
      borderColor: 'border-cyan-500'
    };
  }
  if (score >= 40) {
    return {
      label: 'Problematico',
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500'
    };
  }
  return {
    label: 'Critico',
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500'
  };
}

const TREND_CONFIG = {
  improving: { icon: TrendingUp, color: 'text-emerald-400', label: 'mejorando' },
  stable: { icon: Minus, color: 'text-slate-400', label: 'estable' },
  deteriorating: { icon: TrendingDown, color: 'text-red-400', label: 'deteriorando' }
};

export default function OrganizationalHealthCard({
  healthScore,
  trend
}: OrganizationalHealthCardProps) {
  const classification = getHealthClassification(healthScore);
  const trendInfo = trend ? TREND_CONFIG[trend.direction] : null;
  const TrendIcon = trendInfo?.icon;

  return (
    <div
      className={`
        fhr-card-metric group relative overflow-hidden
        transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg
        border-l-4 ${classification.borderColor}
      `}
    >
      {/* Glow sutil */}
      <div
        className={`
          absolute -top-10 -right-10 w-24 h-24 rounded-full blur-3xl
          opacity-10 pointer-events-none ${classification.bgColor}
        `}
      />

      <div className="relative z-10 p-4 md:p-5">
        {/* Header con icono */}
        <div className="flex items-center gap-2 mb-3">
          <Heart className={`h-4 w-4 ${classification.color}`} strokeWidth={1.5} />
          <span className="text-xs text-slate-500 uppercase tracking-wide">
            Salud Organizacional
          </span>
        </div>

        {/* Score principal */}
        <div className="flex items-baseline gap-2 mb-2">
          <span className={`text-5xl font-light tabular-nums ${classification.color}`}>
            {healthScore.toFixed(0)}
          </span>
          <span className="text-lg text-slate-500">/100</span>
        </div>

        {/* Clasificacion */}
        <div className={`text-sm font-medium ${classification.color} mb-2`}>
          {classification.label}
        </div>

        {/* Trend */}
        {trend && TrendIcon && trendInfo && (
          <div className={`flex items-center gap-1.5 text-xs ${trendInfo.color}`}>
            <TrendIcon className="h-3.5 w-3.5" strokeWidth={2} />
            <span>
              {trend.delta > 0 ? '+' : ''}{trend.delta.toFixed(1)} pts · {trendInfo.label}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
