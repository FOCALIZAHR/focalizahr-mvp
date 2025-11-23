// ====================================================================
// MOMENTUM TREND CARD - Tab Resumen Card #3
// src/components/onboarding/MomentumTrendCard.tsx
// 🎯 Muestra tendencia y momentum organizacional
// ====================================================================

'use client';

import { useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus, Zap } from 'lucide-react';

interface MomentumTrendCardProps {
  trend: number | null;
  totalJourneys: number;
  period?: string;
}

export default function MomentumTrendCard({ 
  trend, 
  totalJourneys,
  period 
}: MomentumTrendCardProps) {
  
  // Mensaje inteligente según trend
  const getTrendMessage = useMemo(() => {
    if (trend === null || trend === undefined) {
      return {
        text: 'Calculando tendencia con data histórica...',
        color: 'slate',
        icon: Minus
      };
    }
    
    if (trend > 5) {
      return {
        text: `Momentum acelerado con ${totalJourneys} journeys activos`,
        color: 'green',
        icon: TrendingUp
      };
    }
    
    if (trend > 0) {
      return {
        text: 'Mejora sostenida en últimos 3 meses',
        color: 'green',
        icon: TrendingUp
      };
    }
    
    if (trend === 0) {
      return {
        text: 'Estabilidad operacional mantenida',
        color: 'yellow',
        icon: Minus
      };
    }
    
    if (trend > -5) {
      return {
        text: 'Leve deterioro que requiere atención',
        color: 'yellow',
        icon: TrendingDown
      };
    }
    
    return {
      text: 'Trend negativo crítico - intervención requerida',
      color: 'red',
      icon: TrendingDown
    };
  }, [trend, totalJourneys]);

  const { text, color, icon: TrendIcon } = getTrendMessage;

  // Color classes helper
  const getColorClasses = (baseColor: string) => {
    const colors = {
      green: {
        text: 'text-green-400',
        bg: 'bg-green-500/20',
        border: 'border-green-400'
      },
      yellow: {
        text: 'text-yellow-400',
        bg: 'bg-yellow-500/20',
        border: 'border-yellow-400'
      },
      red: {
        text: 'text-red-400',
        bg: 'bg-red-500/20',
        border: 'border-red-400'
      },
      slate: {
        text: 'text-slate-400',
        bg: 'bg-slate-500/20',
        border: 'border-slate-400'
      }
    };
    return colors[baseColor as keyof typeof colors] || colors.slate;
  };

  const colorClasses = getColorClasses(color);

  return (
    <div className={`fhr-card border-l-4 ${colorClasses.border}`}>
      
      {/* HEADER */}
      <div className="flex items-center gap-2 mb-4">
        <div className={`p-2 ${colorClasses.bg} rounded-lg`}>
          <Zap className={`h-4 w-4 ${colorClasses.text}`} />
        </div>
        <h4 className={`text-xs uppercase tracking-wider ${colorClasses.text}/70 font-semibold`}>
          Momentum & Tendencia
        </h4>
      </div>

      {/* TREND PRINCIPAL */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-xs text-slate-400 mb-1">Trend 3 meses</p>
          <div className="flex items-baseline gap-2">
            {trend !== null && trend !== undefined ? (
              <>
                <TrendIcon className={`h-4 w-4 ${colorClasses.text}`} />
                <span className={`text-2xl font-light ${colorClasses.text} tabular-nums`}>
                  {trend > 0 ? '+' : ''}{trend.toFixed(1)}
                </span>
                <span className="text-xs text-slate-500">pts</span>
              </>
            ) : (
              <span className="text-xl font-light text-slate-400">
                Calculando...
              </span>
            )}
          </div>
        </div>

        {/* MINI VISUAL INDICATOR */}
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-1">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className={`w-1 rounded-full transition-all ${
                  trend === null || trend === undefined
                    ? 'h-3 bg-slate-700'
                    : trend > 0
                      ? `h-${4 + i * 2} bg-green-400/50`
                      : trend < 0
                        ? `h-${10 - i * 2} bg-red-400/50`
                        : 'h-4 bg-yellow-400/50'
                }`}
                style={{
                  height: trend === null || trend === undefined
                    ? '12px'
                    : trend > 0
                      ? `${16 + i * 8}px`
                      : trend < 0
                        ? `${40 - i * 8}px`
                        : '16px'
                }}
              />
            ))}
          </div>
          <p className="text-[10px] text-slate-500">
            {period || 'Últimos 3m'}
          </p>
        </div>
      </div>

      {/* MENSAJE INTELIGENTE */}
      <div className={`pt-3 border-t border-slate-800/50`}>
        <p className="text-xs text-slate-300">
          {text}
        </p>
      </div>

    </div>
  );
}