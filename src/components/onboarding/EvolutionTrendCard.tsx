// src/components/onboarding/EvolutionTrendCard.tsx
/**
 * 📈 EVOLUTION TREND CARD (v2.0 - CON GRÁFICO)
 * 
 * Muestra mini gráfico de evolución últimos 6 meses + tendencia visual.
 * Diseño: Gradient cyan-purple con puntos glow effect.
 * 
 * Props:
 * - currentScore: Score actual
 * - trend: Cambio vs período anterior (+/- puntos)
 * - periodCount: Número de meses con datos
 * - scoreHistory: Array de scores históricos (opcional)
 * 
 * Diseño: Glassmorphism con gradient FocalizaHR
 */

'use client';

import { memo, useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus, Activity } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts';

interface EvolutionTrendCardProps {
  currentScore: number;
  trend: number | null;
  periodCount?: number;
  scoreHistory?: Array<{ month: string; score: number }>;
}

export default memo(function EvolutionTrendCard({
  currentScore,
  trend,
  periodCount = 0,
  scoreHistory
}: EvolutionTrendCardProps) {
  
  // ========================================
  // HELPER: Generar data sintética si no hay history
  // ========================================
  const chartData = useMemo(() => {
    if (scoreHistory && scoreHistory.length > 0) {
      return scoreHistory;
    }

    // Generar últimos 6 meses sintéticos basados en trend
    const months = ['Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov'];
    const trendValue = trend || 0;
    const baseScore = currentScore - (trendValue * 5); // Retroceder 5 meses
    
    return months.map((month, index) => ({
      month,
      score: Math.max(0, Math.min(100, baseScore + (trendValue * index) + Math.random() * 3))
    }));
  }, [currentScore, trend, scoreHistory]);

  // ========================================
  // HELPER: Obtener estado de tendencia
  // ========================================
  const trendState = useMemo(() => {
    if (trend === null || trend === undefined) {
      return {
        icon: Minus,
        color: 'text-slate-400',
        bgColor: 'bg-slate-500/10',
        label: 'Sin cambios',
        value: '0'
      };
    }

    if (trend > 0) {
      return {
        icon: TrendingUp,
        color: 'text-green-400',
        bgColor: 'bg-green-500/10',
        label: 'Tendencia positiva',
        value: `+${trend.toFixed(1)}`
      };
    }

    if (trend < 0) {
      return {
        icon: TrendingDown,
        color: 'text-red-400',
        bgColor: 'bg-red-500/10',
        label: 'Requiere atención',
        value: trend.toFixed(1)
      };
    }

    return {
      icon: Minus,
      color: 'text-slate-400',
      bgColor: 'bg-slate-500/10',
      label: 'Estable',
      value: '0'
    };
  }, [trend]);

  const TrendIcon = trendState.icon;

  // ========================================
  // CUSTOM TOOLTIP
  // ========================================
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/95 border border-slate-700 rounded-lg px-3 py-2">
          <p className="text-xs text-slate-400">{payload[0].payload.month}</p>
          <p className="text-sm font-bold text-cyan-400">
            {payload[0].value.toFixed(1)} pts
          </p>
        </div>
      );
    }
    return null;
  };

  // ========================================
  // RENDER PRINCIPAL
  // ========================================
  return (
    <div className="bg-slate-900/30 border border-slate-800/50 rounded-lg p-4 space-y-3">
      
      {/* HEADER */}
      <div className="flex items-center gap-1.5 text-purple-400">
        <Activity className="h-3.5 w-3.5" />
        <p className="text-[10px] uppercase tracking-wider font-medium">
          Evolución
        </p>
      </div>

      {/* MINI GRÁFICO */}
      <div className="h-20 -mx-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <defs>
              <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#22D3EE" />
                <stop offset="100%" stopColor="#A78BFA" />
              </linearGradient>
            </defs>
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="score"
              stroke="url(#lineGradient)"
              strokeWidth={2}
              dot={{
                fill: '#22D3EE',
                strokeWidth: 2,
                r: 3,
                filter: 'drop-shadow(0 0 4px rgba(34, 211, 238, 0.6))'
              }}
              activeDot={{
                r: 5,
                fill: '#A78BFA',
                filter: 'drop-shadow(0 0 6px rgba(167, 139, 250, 0.8))'
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* TREND INDICATOR */}
      <div className={`flex items-center gap-2 ${trendState.bgColor} rounded-lg px-3 py-2`}>
        <TrendIcon className={`h-4 w-4 ${trendState.color}`} />
        
        <div className="flex-1 space-y-0.5">
          <div className="flex items-baseline gap-1.5">
            <span className={`text-sm font-bold tabular-nums ${trendState.color}`}>
              {trendState.value}
            </span>
            <span className="text-[10px] text-slate-500">
              pts vs anterior
            </span>
          </div>
          <p className={`text-[10px] ${trendState.color}`}>
            {trendState.label}
          </p>
        </div>
      </div>

      {/* METADATA (si hay datos suficientes) */}
      {periodCount > 0 && (
        <div className="pt-1 border-t border-slate-800/50">
          <p className="text-[10px] text-slate-500 text-center">
            Últimos {Math.min(periodCount, 6)} meses
          </p>
        </div>
      )}

    </div>
  );
});