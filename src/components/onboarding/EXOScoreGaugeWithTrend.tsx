'use client';

import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { 
  RadialBarChart, 
  RadialBar, 
  ResponsiveContainer,
  PolarAngleAxis 
} from 'recharts';

// ============================================
// TYPES
// ============================================
interface EXOScoreGaugeWithTrendProps {
  currentScore: number;
  trend: number | null;
  period: string;
}

// ============================================
// CONSTANTS
// ============================================
const COLORS = {
  excellent: '#10B981',  // green - 80-100
  good: '#22D3EE',       // cyan - 60-79
  warning: '#F59E0B',    // amber - 40-59
  critical: '#EF4444'    // red - 0-39
};

// ============================================
// COMPONENT
// ============================================
export const EXOScoreGaugeWithTrend = memo(function EXOScoreGaugeWithTrend({ 
  currentScore,
  trend,
  period
}: EXOScoreGaugeWithTrendProps) {
  
  // ========================================
  // CÁLCULOS DERIVADOS
  // ========================================
  const { color, label, icon: TrendIcon } = useMemo(() => {
    // Color según score
    let scoreColor: string;
    let scoreLabel: string;

    if (currentScore >= 80) {
      scoreColor = COLORS.excellent;
      scoreLabel = 'Excelente';
    } else if (currentScore >= 60) {
      scoreColor = COLORS.good;
      scoreLabel = 'Bueno';
    } else if (currentScore >= 40) {
      scoreColor = COLORS.warning;
      scoreLabel = 'Regular';
    } else {
      scoreColor = COLORS.critical;
      scoreLabel = 'Crítico';
    }

    // Icono según tendencia
    let trendIcon;
    if (trend === null || trend === undefined) {
      trendIcon = Minus;
    } else if (trend > 0) {
      trendIcon = TrendingUp;
    } else if (trend < 0) {
      trendIcon = TrendingDown;
    } else {
      trendIcon = Minus;
    }

    return { 
      color: scoreColor, 
      label: scoreLabel,
      icon: trendIcon
    };
  }, [currentScore, trend]);

  // Data para Recharts
  const chartData = useMemo(() => {
    return [{
      name: 'EXO Score',
      value: currentScore,
      fill: color
    }];
  }, [currentScore, color]);

  // Trend color
  const trendColor = useMemo(() => {
    if (trend === null || trend === undefined) return '#94a3b8'; // slate-400
    if (trend > 0) return '#10B981'; // green
    if (trend < 0) return '#EF4444'; // red
    return '#94a3b8';
  }, [trend]);

  // ========================================
  // RENDER
  // ========================================
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="fhr-card"
    >
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-light text-white">
          EXO Score Global
        </h3>
        {period && (
          <span className="text-xs text-slate-500 font-light">
            {period}
          </span>
        )}
      </div>

      {/* GAUGE CONTAINER */}
      <div className="flex flex-col items-center justify-center">
        {/* RECHARTS GAUGE */}
        <div className="relative w-full h-64">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart
              cx="50%"
              cy="50%"
              innerRadius="70%"
              outerRadius="100%"
              barSize={24}
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
                background={{ fill: 'rgba(255,255,255,0.05)' }}
                dataKey="value"
                cornerRadius={12}
                fill={color}
                animationDuration={1500}
                animationBegin={200}
              />
            </RadialBarChart>
          </ResponsiveContainer>

          {/* CENTER VALUE */}
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ 
              delay: 0.5,
              type: "spring",
              stiffness: 200 
            }}
            className="absolute inset-0 flex flex-col items-center justify-center"
          >
            <div className="text-6xl font-bold text-white mb-1">
              {Math.round(currentScore)}
            </div>
            <div 
              className="text-sm font-medium uppercase tracking-wide"
              style={{ color }}
            >
              {label}
            </div>
          </motion.div>
        </div>

        {/* TREND INDICATOR */}
        {trend !== null && trend !== undefined && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="mt-6 flex items-center gap-2 px-4 py-2 rounded-full"
            style={{
              backgroundColor: `${trendColor}10`,
              border: `1px solid ${trendColor}30`
            }}
          >
            <TrendIcon 
              className="h-4 w-4" 
              style={{ color: trendColor }}
            />
            <span 
              className="text-sm font-medium"
              style={{ color: trendColor }}
            >
              {trend > 0 ? '+' : ''}{trend.toFixed(1)} pts vs período anterior
            </span>
          </motion.div>
        )}

        {/* SCALE LEGEND */}
        <div className="w-full mt-8 grid grid-cols-4 gap-2 text-center">
          <div className="space-y-1">
            <div 
              className="h-1.5 rounded-full"
              style={{ backgroundColor: COLORS.critical }}
            />
            <p className="text-xs text-slate-500 font-light">0-39</p>
            <p className="text-xs text-slate-600 font-light">Crítico</p>
          </div>
          <div className="space-y-1">
            <div 
              className="h-1.5 rounded-full"
              style={{ backgroundColor: COLORS.warning }}
            />
            <p className="text-xs text-slate-500 font-light">40-59</p>
            <p className="text-xs text-slate-600 font-light">Regular</p>
          </div>
          <div className="space-y-1">
            <div 
              className="h-1.5 rounded-full"
              style={{ backgroundColor: COLORS.good }}
            />
            <p className="text-xs text-slate-500 font-light">60-79</p>
            <p className="text-xs text-slate-600 font-light">Bueno</p>
          </div>
          <div className="space-y-1">
            <div 
              className="h-1.5 rounded-full"
              style={{ backgroundColor: COLORS.excellent }}
            />
            <p className="text-xs text-slate-500 font-light">80-100</p>
            <p className="text-xs text-slate-600 font-light">Excelente</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
});

EXOScoreGaugeWithTrend.displayName = 'EXOScoreGaugeWithTrend';