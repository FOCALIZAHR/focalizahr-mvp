// src/components/exit/BenchmarkCard.tsx
// 🎯 Comparación vs Mercado - Contexto competitivo

'use client';

import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, BarChart3, Loader2 } from 'lucide-react';
import { useBenchmark } from '@/hooks/useBenchmark';

interface BenchmarkCardProps {
  /** Score EIS actual */
  score: number;
  /** Categoría del departamento para benchmark */
  departmentCategory?: string;
  /** País (default: CL) */
  country?: string;
}

export default memo(function BenchmarkCard({
  score,
  departmentCategory,
  country = 'CL'
}: BenchmarkCardProps) {
  
  // Hook real de benchmark
  const { data: benchmarkData, loading, error } = useBenchmark(
    'eis',
    departmentCategory || 'ALL',
    undefined,
    country
  );

  // Calcular comparación
  const benchmark = useMemo(() => {
    if (loading || error || !benchmarkData?.benchmark) return null;
    
    const marketAvg = benchmarkData.benchmark.avgScore;
    const diff = score - marketAvg;
    const diffPercent = Math.round(Math.abs((diff / marketAvg) * 100));
    const isAbove = diff > 2;
    const isBelow = diff < -2;

    return {
      marketAvg: Math.round(marketAvg * 10) / 10,
      diffPercent,
      isAbove,
      isBelow,
      icon: isAbove ? TrendingUp : isBelow ? TrendingDown : Minus,
      color: isAbove ? 'text-emerald-400' : isBelow ? 'text-amber-400' : 'text-slate-400',
      bgColor: isAbove ? 'bg-emerald-500/10' : isBelow ? 'bg-amber-500/10' : 'bg-slate-800/40',
      borderColor: isAbove ? 'border-emerald-500/20' : isBelow ? 'border-amber-500/20' : 'border-slate-700/40',
      companyCount: benchmarkData.benchmark.companyCount
    };
  }, [score, benchmarkData, loading, error]);

  // Narrativa contextual
  const narrative = useMemo(() => {
    if (score >= 70) return { 
      line1: 'Salida en buenos términos.', 
      line2: 'No hay señales de alarma.',
      color: 'text-emerald-400' 
    };
    if (score >= 50) return { 
      line1: 'Salida con fricciones.', 
      line2: 'Vale la pena investigar.',
      color: 'text-cyan-400' 
    };
    if (score >= 25) return { 
      line1: 'Salida problemática.', 
      line2: 'Hay patrones que atender.',
      color: 'text-amber-400' 
    };
    return { 
      line1: 'Exit tóxico detectado.', 
      line2: 'Riesgo de contagio al equipo.',
      color: 'text-red-400' 
    };
  }, [score]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="
        relative overflow-hidden
        bg-slate-900/40 backdrop-blur-xl
        border border-slate-700/50 rounded-xl p-5
        transition-all duration-300
        hover:bg-slate-900/50 hover:border-slate-600/50
      "
    >
      {/* Efecto decorativo */}
      <div className="absolute -top-16 -right-16 w-28 h-28 bg-gradient-to-br from-cyan-500/5 to-purple-500/5 rounded-full blur-2xl pointer-events-none" />
      
      {/* Header */}
      <div className="relative flex items-center gap-2 mb-4">
        <div className="p-1.5 bg-gradient-to-br from-cyan-500/20 to-cyan-600/10 rounded-lg">
          <BarChart3 className="h-3.5 w-3.5 text-cyan-400" />
        </div>
        <p className="text-xs uppercase tracking-wider font-medium text-cyan-400">
          vs Mercado {country}
        </p>
      </div>

      {/* Benchmark Data */}
      {loading ? (
        <div className="flex items-center gap-2 p-4 bg-slate-800/40 rounded-lg">
          <Loader2 className="h-4 w-4 text-slate-500 animate-spin" />
          <span className="text-xs text-slate-500">Cargando benchmark...</span>
        </div>
      ) : benchmark ? (
        <div className={`${benchmark.bgColor} ${benchmark.borderColor} border rounded-lg p-4 mb-4`}>
          <div className="flex items-center gap-3">
            <benchmark.icon className={`h-6 w-6 ${benchmark.color}`} />
            <div>
              <span className={`text-2xl font-semibold ${benchmark.color}`}>
                {benchmark.isAbove ? '+' : benchmark.isBelow ? '-' : '≈'}{benchmark.diffPercent}%
              </span>
              <p className="text-xs text-slate-400">
                {benchmark.isAbove ? 'sobre' : benchmark.isBelow ? 'bajo' : 'alineado con'} promedio {country}
              </p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-700/30">
            <p className="text-xs text-slate-500">
              Benchmark: {benchmark.marketAvg} pts
              {benchmark.companyCount && (
                <span className="text-slate-600"> · {benchmark.companyCount} empresas</span>
              )}
            </p>
          </div>
        </div>
      ) : (
        <div className="p-4 bg-slate-800/40 rounded-lg mb-4">
          <p className="text-xs text-slate-500">📊 Benchmark no disponible</p>
          <p className="text-[10px] text-slate-600 mt-1">Se requieren más datos del mercado</p>
        </div>
      )}

      {/* Narrativa */}
      <div>
        <p className={`text-sm font-medium ${narrative.color}`}>{narrative.line1}</p>
        <p className="text-sm text-slate-400">{narrative.line2}</p>
      </div>
    </motion.div>
  );
});