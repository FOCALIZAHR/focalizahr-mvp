// ====================================================================
// BENCHMARK PERCENTILE CHART - DISTRIBUCIÓN MERCADO
// src/components/onboarding/BenchmarkPercentileChart.tsx
// 📊 Visualización distribución percentiles con posición departamento
// ====================================================================

'use client';

import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useOnboardingBenchmark } from '@/hooks/useOnboardingBenchmark';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  ResponsiveContainer, 
  Tooltip,
  ReferenceLine,
  Cell
} from 'recharts';
import { TrendingUp, AlertCircle, Award, Info } from 'lucide-react';

// ============================================
// TYPES
// ============================================
interface BenchmarkPercentileChartProps {
  departmentId: string;
  country?: string;
}

interface ChartDataPoint {
  label: string;
  value: number;
  percentile: number;
  fill: string;
  description: string;
}

// ============================================
// CONSTANTS
// ============================================
const PERCENTILE_COLORS = {
  p90: '#10B981',  // Verde - Top 10%
  p75: '#22D3EE',  // Cyan - Top 25%
  p50: '#F59E0B',  // Amarillo - Mediana
  p25: '#EF4444'   // Rojo - Bajo promedio
};

const PERCENTILE_DESCRIPTIONS = {
  p90: 'Top 10% del mercado',
  p75: 'Top 25% del mercado',
  p50: 'Rendimiento mediano',
  p25: 'Cuartil inferior'
};

// ============================================
// CUSTOM TOOLTIP
// ============================================
const CustomTooltip = memo(function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.[0]) return null;
  
  const data = payload[0].payload as ChartDataPoint;
  
  return (
    <motion.div 
      className="fhr-card p-4 shadow-xl"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-center gap-3 mb-2">
        <div 
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: data.fill }}
        />
        <p className="text-sm font-semibold text-white">
          {data.label}
        </p>
      </div>
      
      <div className="space-y-1">
        <p className="text-2xl font-bold" style={{ color: data.fill }}>
          {data.value}
        </p>
        <p className="text-xs text-slate-400">
          {data.description}
        </p>
      </div>
    </motion.div>
  );
});

// ============================================
// LOADING STATE
// ============================================
const LoadingState = memo(function LoadingState() {
  return (
    <div className="fhr-card p-6 animate-pulse">
      <div className="h-6 w-48 bg-slate-700 rounded mb-4"></div>
      <div className="h-64 bg-slate-700 rounded"></div>
    </div>
  );
});

// ============================================
// ERROR STATE
// ============================================
const ErrorState = memo(function ErrorState({ message }: { message: string }) {
  return (
    <div className="fhr-card p-6 border-l-4 border-l-red-500">
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-red-400 mt-1" />
        <div>
          <p className="text-red-400 font-semibold mb-1">Error al cargar distribución</p>
          <p className="text-sm text-slate-400">{message}</p>
        </div>
      </div>
    </div>
  );
});

// ============================================
// MAIN COMPONENT
// ============================================
const BenchmarkPercentileChart = memo(function BenchmarkPercentileChart({
  departmentId,
  country = 'CL'
}: BenchmarkPercentileChartProps) {
  
  // ========================================
  // FETCH DATA
  // ========================================
  const { data, loading, error } = useOnboardingBenchmark(departmentId, country);
  
  // ========================================
  // TRANSFORM DATA FOR CHART
  // ========================================
  const chartData = useMemo((): ChartDataPoint[] => {
    if (!data) return [];
    
    const { exoPercentiles } = data.benchmark;
    
    return [
      {
        label: 'P90',
        value: exoPercentiles.p90,
        percentile: 90,
        fill: PERCENTILE_COLORS.p90,
        description: PERCENTILE_DESCRIPTIONS.p90
      },
      {
        label: 'P75',
        value: exoPercentiles.p75,
        percentile: 75,
        fill: PERCENTILE_COLORS.p75,
        description: PERCENTILE_DESCRIPTIONS.p75
      },
      {
        label: 'P50',
        value: exoPercentiles.p50,
        percentile: 50,
        fill: PERCENTILE_COLORS.p50,
        description: PERCENTILE_DESCRIPTIONS.p50
      },
      {
        label: 'P25',
        value: exoPercentiles.p25,
        percentile: 25,
        fill: PERCENTILE_COLORS.p25,
        description: PERCENTILE_DESCRIPTIONS.p25
      }
    ];
  }, [data]);
  
  // ========================================
  // POSITION ANALYSIS
  // ========================================
  const positionAnalysis = useMemo(() => {
    if (!data) return null;
    
    const { exoScore } = data.department;
    const { exoPercentiles } = data.benchmark;
    const { exoPercentileRank } = data.comparison;
    
    let position = '';
    let color = '';
    let icon = TrendingUp;
    
    if (exoScore >= exoPercentiles.p90) {
      position = 'Top 10% del mercado';
      color = PERCENTILE_COLORS.p90;
      icon = Award;
    } else if (exoScore >= exoPercentiles.p75) {
      position = 'Top 25% del mercado';
      color = PERCENTILE_COLORS.p75;
      icon = TrendingUp;
    } else if (exoScore >= exoPercentiles.p50) {
      position = 'Sobre la mediana';
      color = PERCENTILE_COLORS.p50;
      icon = TrendingUp;
    } else if (exoScore >= exoPercentiles.p25) {
      position = 'Bajo la mediana';
      color = PERCENTILE_COLORS.p50;
      icon = Info;
    } else {
      position = 'Cuartil inferior';
      color = PERCENTILE_COLORS.p25;
      icon = AlertCircle;
    }
    
    return {
      position,
      color,
      icon,
      percentile: exoPercentileRank,
      score: exoScore
    };
  }, [data]);
  
  // ========================================
  // RENDER STATES
  // ========================================
  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;
  if (!data || chartData.length === 0) return null;
  
  // ========================================
  // MAIN RENDER
  // ========================================
  return (
    <motion.div 
      className="fhr-card p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      {/* HEADER */}
      <div className="mb-6">
        <h3 className="text-xl font-light text-white mb-2">
          Distribución Competitiva
        </h3>
        <p className="text-sm text-slate-400 font-light">
          Tu posición en el mercado {data.benchmark.country} - {data.department.category}
        </p>
      </div>
      
      {/* CHART */}
      <div className="mb-6">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart 
            data={chartData} 
            layout="vertical"
            margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
          >
            <XAxis 
              type="number" 
              domain={[0, 100]}
              stroke="#64748b"
              style={{ fontSize: '12px', fill: '#94a3b8' }}
              tickLine={false}
            />
            <YAxis 
              type="category" 
              dataKey="label"
              stroke="#64748b"
              style={{ fontSize: '14px', fill: '#cbd5e1', fontWeight: 300 }}
              tickLine={false}
              width={70}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(100, 116, 139, 0.1)' }} />
            
            {/* Reference line - Tu posición */}
            <ReferenceLine 
              x={data.department.exoScore} 
              stroke="#A78BFA" 
              strokeWidth={3}
              strokeDasharray="0"
              label={{ 
                value: `TÚ (${data.department.exoScore})`, 
                position: 'top',
                fill: '#A78BFA',
                fontSize: 12,
                fontWeight: 600
              }}
            />
            
            {/* Bars con colores individuales */}
            <Bar 
              dataKey="value" 
              radius={[0, 8, 8, 0]}
              maxBarSize={40}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      {/* POSITION SUMMARY */}
      {positionAnalysis && (
        <motion.div 
          className="p-4 rounded-lg border"
          style={{
            backgroundColor: `${positionAnalysis.color}10`,
            borderColor: `${positionAnalysis.color}30`
          }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-start gap-3">
            <div 
              className="p-2 rounded-lg"
              style={{ backgroundColor: `${positionAnalysis.color}20` }}
            >
              <positionAnalysis.icon 
                className="h-5 w-5"
                style={{ color: positionAnalysis.color }}
              />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-white mb-1">
                {positionAnalysis.position}
              </p>
              <p className="text-xs text-slate-300 font-light">
                Con un EXO Score de <span className="font-semibold">{positionAnalysis.score}</span>, 
                estás en el percentil <span className="font-semibold">P{positionAnalysis.percentile}</span>, 
                superando al <span className="font-semibold">{positionAnalysis.percentile}%</span> de 
                departamentos similares en {data.benchmark.country}.
              </p>
            </div>
          </div>
        </motion.div>
      )}
      
      {/* LEGEND */}
      <div className="mt-6 pt-5 border-t border-slate-700/50">
        <p className="text-xs text-slate-500 font-light mb-3">Interpretación percentiles:</p>
        <div className="grid grid-cols-2 gap-3">
          {chartData.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: item.fill }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-white truncate">
                  {item.label}: {item.value}
                </p>
                <p className="text-xs text-slate-500 truncate font-light">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* SAMPLE SIZE INFO */}
      <div className="mt-4 text-center">
        <p className="text-xs text-slate-600 font-light">
          Basado en {data.benchmark.sampleSize} departamentos · 
          Actualizado {new Date(data.benchmark.lastUpdated).toLocaleDateString('es-CL')}
        </p>
      </div>
    </motion.div>
  );
});

export default BenchmarkPercentileChart;