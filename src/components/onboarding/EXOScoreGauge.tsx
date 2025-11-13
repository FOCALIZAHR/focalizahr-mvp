'use client';

import { memo, useMemo } from 'react';
import { 
  RadialBarChart, 
  RadialBar, 
  ResponsiveContainer,
  PolarAngleAxis 
} from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface EXOScoreGaugeProps {
  score: number | null;
  label: string;
  trend?: number | null;
  size?: 'sm' | 'md' | 'lg';
}

const COLORS = {
  excellent: '#10B981',
  good: '#22D3EE',
  warning: '#F59E0B',
  critical: '#EF4444'
};

const EXOScoreGauge = memo(function EXOScoreGauge({ 
  score,
  label,
  trend,
  size = 'lg'
}: EXOScoreGaugeProps) {
  
  const currentScore = score ?? 0;

  const { color, statusLabel } = useMemo(() => {
    let scoreColor: string;
    let status: string;

    if (currentScore >= 80) {
      scoreColor = COLORS.excellent;
      status = 'Excelente';
    } else if (currentScore >= 60) {
      scoreColor = COLORS.good;
      status = 'Bueno';
    } else if (currentScore >= 40) {
      scoreColor = COLORS.warning;
      status = 'Regular';
    } else {
      scoreColor = COLORS.critical;
      status = 'Crítico';
    }

    return { color: scoreColor, statusLabel: status };
  }, [currentScore]);

  const chartData = useMemo(() => {
    return [{
      name: 'EXO Score',
      value: currentScore,
      fill: color
    }];
  }, [currentScore, color]);

  const TrendIcon = useMemo(() => {
    if (trend === null || trend === undefined) return Minus;
    if (trend > 0) return TrendingUp;
    if (trend < 0) return TrendingDown;
    return Minus;
  }, [trend]);

  const trendColor = useMemo(() => {
    if (trend === null || trend === undefined) return '#94a3b8';
    if (trend > 0) return '#10B981';
    if (trend < 0) return '#EF4444';
    return '#94a3b8';
  }, [trend]);

  return (
    <div className="bg-slate-900/30 border border-slate-800/50 rounded-lg p-6">
      
      <div className="mb-6">
        <h3 className="text-base font-medium text-slate-200">{label}</h3>
      </div>

      <div className="flex flex-col items-center">
        <div className="relative w-full h-48">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart
              cx="50%"
              cy="50%"
              innerRadius="70%"
              outerRadius="100%"
              barSize={12}
              data={chartData}
              startAngle={180}
              endAngle={0}
            >
              <PolarAngleAxis
                type="number"
                domain={[0, 100]}
                angleAxisId={0}
                tick={false}
              />
              <RadialBar
                background={{ fill: 'rgba(255,255,255,0.03)' }}
                dataKey="value"
                cornerRadius={10}
                fill={color}
                animationDuration={1200}
              />
            </RadialBarChart>
          </ResponsiveContainer>

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-5xl font-extralight text-white tabular-nums">
              {Math.round(currentScore)}
            </div>
            <div 
              className="text-xs font-light uppercase tracking-wide mt-1"
              style={{ color }}
            >
              {statusLabel}
            </div>
          </div>
        </div>

        {/* ✅ CAMBIO 5: TREND CON FLECHITA */}
        {trend !== null && trend !== undefined && (
          <div className="mt-6 flex items-center gap-2">
            {trend !== 0 && (
              <div 
                className={`w-0 h-0 ${
                  trend > 0 
                    ? 'border-l-[4px] border-r-[4px] border-b-[6px] border-l-transparent border-r-transparent'
                    : 'border-l-[4px] border-r-[4px] border-t-[6px] border-l-transparent border-r-transparent'
                }`} 
                style={{ 
                  borderBottomColor: trend > 0 ? trendColor : 'transparent',
                  borderTopColor: trend < 0 ? trendColor : 'transparent'
                }}
              />
            )}
            
            <TrendIcon 
              className="h-3 w-3" 
              style={{ color: trendColor }}
            />
            <span 
              className="text-xs font-light"
              style={{ color: trendColor }}
            >
              {trend > 0 ? '+' : ''}{trend.toFixed(1)} pts vs período anterior
            </span>
          </div>
        )}

        <div className="w-full mt-6 pt-6 border-t border-slate-800/50">
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="space-y-1">
              <div className="h-1 rounded-full bg-red-400/30"></div>
              <p className="text-xs text-slate-600">0-39</p>
            </div>
            <div className="space-y-1">
              <div className="h-1 rounded-full bg-amber-400/30"></div>
              <p className="text-xs text-slate-600">40-59</p>
            </div>
            <div className="space-y-1">
              <div className="h-1 rounded-full bg-cyan-400/30"></div>
              <p className="text-xs text-slate-600">60-79</p>
            </div>
            <div className="space-y-1">
              <div className="h-1 rounded-full bg-green-400/30"></div>
              <p className="text-xs text-slate-600">80-100</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

EXOScoreGauge.displayName = 'EXOScoreGauge';

export default EXOScoreGauge;