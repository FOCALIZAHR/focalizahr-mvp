// ====================================================================
// BENCHMARK COMPARISON CARD - COMPONENTE PRINCIPAL WOW
// src/components/onboarding/BenchmarkComparisonCard.tsx
// 🎯 Muestra comparación departamento vs benchmark mercado
// ====================================================================

'use client';

import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useOnboardingBenchmark } from '@/hooks/useOnboardingBenchmark';
import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis, Legend } from 'recharts';
import { 
  Award, 
  Info, 
  TrendingUp, 
  TrendingDown, 
  Target,
  AlertCircle,
  CheckCircle2,
  Minus
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// ============================================
// TYPES
// ============================================
interface BenchmarkComparisonCardProps {
  departmentId: string;
  country?: string;
}

// ============================================
// CONSTANTS
// ============================================
const PERFORMANCE_COLORS = {
  excellent: '#10B981',  // Verde - P90-P100
  good: '#22D3EE',       // Cyan - P75-P89
  average: '#F59E0B',    // Amarillo - P25-P74
  below: '#EF4444'       // Rojo - P0-P24
};

const CATEGORY_LABELS: Record<string, string> = {
  'personas': 'Personas / RRHH',
  'comercial': 'Comercial / Ventas',
  'marketing': 'Marketing',
  'tecnologia': 'Tecnología / IT',
  'operaciones': 'Operaciones',
  'finanzas': 'Finanzas',
  'servicio': 'Servicio al Cliente',
  'legal': 'Legal / Compliance',
  'sin_asignar': 'Sin categoría'
};

const COUNTRY_LABELS: Record<string, string> = {
  'CL': 'Chile',
  'AR': 'Argentina',
  'MX': 'México',
  'BR': 'Brasil',
  'CO': 'Colombia',
  'PE': 'Perú',
  'ALL': 'Todos los países'
};

// ============================================
// ANIMATIONS
// ============================================
const fadeInSlide = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay: 0.2 }
};

const scaleIn = {
  initial: { scale: 0.9, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  transition: { duration: 0.4, delay: 0.3 }
};

// ============================================
// HELPERS
// ============================================
const getPerformanceColor = (percentile: number): string => {
  if (percentile >= 90) return PERFORMANCE_COLORS.excellent;
  if (percentile >= 75) return PERFORMANCE_COLORS.good;
  if (percentile >= 25) return PERFORMANCE_COLORS.average;
  return PERFORMANCE_COLORS.below;
};

const getPerformanceLabel = (percentile: number): string => {
  if (percentile >= 90) return 'Excelente';
  if (percentile >= 75) return 'Bueno';
  if (percentile >= 25) return 'Promedio';
  return 'Bajo Promedio';
};

const getPerformanceIcon = (percentile: number) => {
  if (percentile >= 75) return CheckCircle2;
  if (percentile >= 25) return Minus;
  return AlertCircle;
};

// ============================================
// LOADING STATE
// ============================================
const LoadingState = memo(function LoadingState() {
  return (
    <div className="fhr-card p-6 animate-pulse">
      <div className="flex items-center justify-between mb-6">
        <div className="h-6 w-48 bg-slate-700 rounded"></div>
        <div className="h-4 w-24 bg-slate-700 rounded"></div>
      </div>
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="space-y-2">
          <div className="h-4 w-20 bg-slate-700 rounded mx-auto"></div>
          <div className="h-12 w-20 bg-slate-700 rounded mx-auto"></div>
        </div>
        <div className="space-y-2">
          <div className="h-4 w-20 bg-slate-700 rounded mx-auto"></div>
          <div className="h-12 w-20 bg-slate-700 rounded mx-auto"></div>
        </div>
      </div>
      <div className="h-32 bg-slate-700 rounded"></div>
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
        <AlertCircle className="h-5 w-5 text-red-400 mt-1 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-red-400 font-semibold mb-1">
            Error al cargar benchmark
          </p>
          <p className="text-sm text-slate-400">{message}</p>
        </div>
      </div>
    </div>
  );
});

// ============================================
// EMPTY STATE
// ============================================
const EmptyState = memo(function EmptyState() {
  return (
    <div className="fhr-card p-8 text-center">
      <Target className="h-12 w-12 text-slate-600 mx-auto mb-4" />
      <p className="text-slate-400 mb-2">No hay datos de benchmark disponibles</p>
      <p className="text-xs text-slate-500">
        Se requieren al menos 30 días de actividad en onboarding
      </p>
    </div>
  );
});

// ============================================
// MAIN COMPONENT
// ============================================
const BenchmarkComparisonCard = memo(function BenchmarkComparisonCard({
  departmentId,
  country = 'CL'
}: BenchmarkComparisonCardProps) {
  
  // ========================================
  // FETCH DATA
  // ========================================
  const { data, loading, error } = useOnboardingBenchmark(departmentId, country);
  
  // ========================================
  // MEMOIZED VALUES
  // ========================================
  const performanceColor = useMemo(() => {
    if (!data) return PERFORMANCE_COLORS.average;
    return getPerformanceColor(data.comparison.exoPercentileRank);
  }, [data]);
  
  const performanceLabel = useMemo(() => {
    if (!data) return 'Calculando...';
    return getPerformanceLabel(data.comparison.exoPercentileRank);
  }, [data]);
  
  const PerformanceIcon = useMemo(() => {
    if (!data) return Minus;
    return getPerformanceIcon(data.comparison.exoPercentileRank);
  }, [data]);
  
  const categoryLabel = useMemo(() => {
    if (!data) return '';
    return CATEGORY_LABELS[data.department.category] || data.department.category;
  }, [data]);
  
  const countryLabel = useMemo(() => {
    if (!data) return '';
    return COUNTRY_LABELS[data.benchmark.country] || data.benchmark.country;
  }, [data]);
  
  // ========================================
  // GAUGE DATA FOR RECHARTS
  // ========================================
  const gaugeData = useMemo(() => {
    if (!data) return [];
    
    return [
      {
        name: 'Tu Score',
        value: data.department.exoScore,
        fill: performanceColor
      },
      {
        name: 'Mercado',
        value: data.benchmark.avgEXOScore,
        fill: '#64748b' // slate-500
      }
    ];
  }, [data, performanceColor]);
  
  // ========================================
  // STATUS BADGE
  // ========================================
  const statusBadge = useMemo(() => {
    if (!data) return null;
    
    const { overallStatus } = data.comparison;
    
    if (overallStatus === 'above') {
      return (
        <Badge className="fhr-badge-excellent px-3 py-1">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          SUPERANDO MERCADO
        </Badge>
      );
    }
    
    if (overallStatus === 'at') {
      return (
        <Badge className="fhr-badge-average px-3 py-1">
          <Minus className="h-3 w-3 mr-1" />
          EN LÍNEA CON MERCADO
        </Badge>
      );
    }
    
    return (
      <Badge className="fhr-badge-below px-3 py-1">
        <TrendingUp className="h-3 w-3 mr-1" />
        OPORTUNIDAD MEJORA
      </Badge>
    );
  }, [data]);
  
  // ========================================
  // RENDER STATES
  // ========================================
  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;
  if (!data) return <EmptyState />;
  
  // ========================================
  // MAIN RENDER
  // ========================================
  return (
    <motion.div 
      className="fhr-card p-6"
      {...fadeInSlide}
    >
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-lg">
            <Award className="h-5 w-5 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-xl font-light text-white">
              Benchmark Competitivo
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {categoryLabel} · {countryLabel}
            </p>
          </div>
        </div>
        
        {/* Sample size indicator */}
        <div className="text-right">
          <p className="text-xs text-slate-500">Muestra</p>
          <p className="text-sm font-semibold text-slate-400">
            {data.benchmark.sampleSize} depts
          </p>
        </div>
      </div>
      
      {/* COMPARISON SCORES - DUAL DISPLAY */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Tu Score */}
        <motion.div 
          className="text-center"
          {...scaleIn}
        >
          <p className="text-sm text-slate-400 mb-2 font-light">Tu EXO Score</p>
          <div 
            className="text-5xl font-extralight tabular-nums mb-1"
            style={{ color: performanceColor }}
          >
            {data.department.exoScore}
          </div>
          <p className="text-xs text-slate-500">
            {data.department.journeyCount} journeys
          </p>
          <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-light"
            style={{ 
              backgroundColor: `${performanceColor}15`,
              color: performanceColor,
              border: `1px solid ${performanceColor}40`
            }}
          >
            <PerformanceIcon className="h-3 w-3" />
            {performanceLabel}
          </div>
        </motion.div>
        
        {/* Mercado Score */}
        <motion.div 
          className="text-center"
          {...scaleIn}
          transition={{ delay: 0.4 }}
        >
          <p className="text-sm text-slate-400 mb-2 font-light">Promedio Mercado</p>
          <div className="text-5xl font-extralight text-slate-400 tabular-nums mb-1">
            {data.benchmark.avgEXOScore}
          </div>
          <p className="text-xs text-slate-500">
            {data.benchmark.sampleSize} departamentos
          </p>
          <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-slate-800/50 text-slate-400 text-xs font-light border border-slate-700">
            <Target className="h-3 w-3" />
            Referencia
          </div>
        </motion.div>
      </div>
      
      {/* COMPARISON METRICS */}
      <div className="space-y-3 border-t border-slate-700/50 pt-5 mb-5">
        {/* Diferencia Absoluta */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-400 font-light">Diferencia:</span>
          <div className="flex items-center gap-2">
            {data.comparison.exoDifference > 0 ? (
              <TrendingUp className="h-4 w-4 text-green-400" />
            ) : data.comparison.exoDifference < 0 ? (
              <TrendingDown className="h-4 w-4 text-red-400" />
            ) : (
              <Minus className="h-4 w-4 text-slate-400" />
            )}
            <span className={`text-lg font-semibold tabular-nums ${
              data.comparison.exoDifference > 0 ? 'text-green-400' : 
              data.comparison.exoDifference < 0 ? 'text-red-400' : 'text-slate-400'
            }`}>
              {data.comparison.exoDifference > 0 ? '+' : ''}
              {data.comparison.exoDifference} pts
            </span>
            <span className={`text-sm font-light ${
              data.comparison.exoDifference > 0 ? 'text-green-400/70' : 
              data.comparison.exoDifference < 0 ? 'text-red-400/70' : 'text-slate-400/70'
            }`}>
              ({data.comparison.exoPercentageGap > 0 ? '+' : ''}{data.comparison.exoPercentageGap}%)
            </span>
          </div>
        </div>
        
        {/* Percentil Ranking */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-400 font-light">Tu Posición:</span>
          <div className="flex items-center gap-2">
            <Award className="h-4 w-4 text-purple-400" />
            <span className="text-lg font-semibold text-purple-400 tabular-nums">
              P{data.comparison.exoPercentileRank}
            </span>
            <span className="text-xs text-purple-300/70 font-light">
              (Top {100 - data.comparison.exoPercentileRank}%)
            </span>
          </div>
        </div>
        
        {/* Tasa Completitud */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-400 font-light">Completitud:</span>
          <span className="text-sm font-medium text-slate-300">
            {data.comparison.completionRateDifference > 0 ? '+' : ''}
            {data.comparison.completionRateDifference.toFixed(1)}% vs mercado
          </span>
        </div>
      </div>
      
      {/* STATUS BADGE CENTRAL */}
      <div className="flex items-center justify-center mb-5">
        {statusBadge}
      </div>
      
      {/* PRIMARY INSIGHT */}
      {data.insights.length > 0 && (
        <motion.div 
          className="p-4 rounded-lg border"
          style={{
            backgroundColor: data.insights[0].type === 'positive' ? 'rgba(16, 185, 129, 0.05)' :
                           data.insights[0].type === 'improvement' ? 'rgba(245, 158, 11, 0.05)' :
                           'rgba(100, 116, 139, 0.05)',
            borderColor: data.insights[0].type === 'positive' ? 'rgba(16, 185, 129, 0.2)' :
                        data.insights[0].type === 'improvement' ? 'rgba(245, 158, 11, 0.2)' :
                        'rgba(100, 116, 139, 0.2)'
          }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className="flex items-start gap-3">
            <Info className={`h-5 w-5 mt-0.5 flex-shrink-0 ${
              data.insights[0].type === 'positive' ? 'text-green-400' :
              data.insights[0].type === 'improvement' ? 'text-yellow-400' :
              'text-cyan-400'
            }`} />
            <div className="flex-1">
              <p className="text-sm font-medium text-white mb-1">
                {data.insights[0].title}
              </p>
              <p className="text-xs text-slate-300 leading-relaxed font-light">
                {data.insights[0].description}
              </p>
            </div>
          </div>
        </motion.div>
      )}
      
      {/* SAMPLE SIZE WARNING */}
      {data.benchmark.sampleSize < 10 && (
        <motion.div 
          className="mt-4 p-3 rounded-lg bg-yellow-400/5 border border-yellow-400/20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-yellow-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-yellow-300 font-medium">
                Muestra en crecimiento
              </p>
              <p className="text-xs text-yellow-200/70 mt-1 font-light">
                Benchmark basado en {data.benchmark.sampleSize} departamento(s). 
                La precisión mejorará con más empresas en FocalizaHR.
              </p>
            </div>
          </div>
        </motion.div>
      )}
      
      {/* FOOTER */}
      <div className="mt-5 pt-4 border-t border-slate-700/30 text-center">
        <p className="text-xs text-slate-600 font-light">
          Última actualización: {new Date(data.benchmark.lastUpdated).toLocaleDateString('es-CL', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
          })}
        </p>
      </div>
    </motion.div>
  );
});

export default BenchmarkComparisonCard;