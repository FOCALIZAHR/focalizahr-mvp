// ====================================================================
// COMPETITIVE CONTEXT CARD - Tab Resumen Card #1
// src/components/onboarding/CompetitiveContextCard.tsx
// 🎯 Muestra posición vs mercado con benchmark dinámico
// ====================================================================

'use client';

import { useMemo } from 'react';
import { TrendingUp, TrendingDown, Target } from 'lucide-react';
import { useBenchmark } from '@/hooks/useBenchmark';

interface CompetitiveContextCardProps {
  globalEXO: number;
  country: string;
  journeyCount: number;
}

export default function CompetitiveContextCard({ 
  globalEXO, 
  country,
  journeyCount 
}: CompetitiveContextCardProps) {
  
  // Fetch benchmark empresa completa vs mercado
  const { data: benchmark, loading } = useBenchmark(
    'onboarding_exo',
    'ALL',        // Empresa completa
    undefined,    // Sin departmentId específico
    country
  );

  // Mensaje de clasificación dinámico
  const getStatusMessage = useMemo(() => {
    if (!benchmark?.comparison) return null;
    
    const { status, percentageGap } = benchmark.comparison;
    const absGap = Math.abs(percentageGap);
    
    if (status === 'above') {
      if (absGap > 15) return '🚀 Significativamente sobre el promedio';
      if (absGap > 5) return '📈 Sobre el promedio del mercado';
      return '↗️ Ligeramente sobre el promedio';
    }
    
    if (status === 'below') {
      if (absGap > 15) return '🔴 Significativamente bajo el promedio';
      if (absGap > 5) return '⚠️ Bajo el promedio del mercado';
      return '↘️ Ligeramente bajo el promedio';
    }
    
    return '➡️ En línea con el promedio del mercado';
  }, [benchmark]);

  // Loading state
  if (loading) {
    return (
      <div className="fhr-card border-l-4 border-l-cyan-400 animate-pulse">
        <div className="h-24 bg-slate-800/50 rounded" />
      </div>
    );
  }

  // No benchmark disponible
  if (!benchmark?.comparison || !benchmark?.benchmark) {
    return (
      <div className="fhr-card border-l-4 border-l-slate-600">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-2 bg-slate-800/50 rounded-lg">
            <Target className="h-4 w-4 text-slate-500" />
          </div>
          <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
            Posición Competitiva
          </p>
        </div>
        <p className="text-sm text-slate-400">
          Benchmark no disponible aún. Se requiere más data del mercado.
        </p>
      </div>
    );
  }

  const { comparison, benchmark: marketData } = benchmark;

  return (
    <div className="fhr-card border-l-4 border-l-cyan-400">
      
      {/* HEADER */}
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-lg">
          <Target className="h-4 w-4 text-cyan-400" />
        </div>
        <p className="text-xs uppercase tracking-wider text-cyan-400/70 font-semibold">
          Posición Competitiva
        </p>
      </div>

      {/* COMPARACIÓN PRINCIPAL */}
      <div className="space-y-3">
        
        {/* Scores lado a lado */}
        <div className="flex items-baseline gap-3">
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-extralight text-white tabular-nums">
              {globalEXO}
            </span>
            <span className="text-sm text-slate-400">pts</span>
          </div>
          
          <span className="text-sm text-slate-500">vs</span>
          
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-light text-cyan-400 tabular-nums">
              {marketData.avgScore.toFixed(1)}
            </span>
            <span className="text-xs text-slate-500">mercado {country}</span>
          </div>
        </div>
        
        {/* Mensaje de estado */}
        <p className="text-sm text-slate-300">
          {getStatusMessage}
        </p>

      </div>

      {/* PERCENTILE VISUAL */}
      <div className="mt-4 pt-4 border-t border-slate-800/50">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="text-slate-400">Tu posición</span>
          <span className="text-cyan-400 font-medium">
            Percentil {comparison.percentileRank || 50}
          </span>
        </div>
        
        {/* Barra de percentil */}
        <div className="relative h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div 
            className="absolute h-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-500"
            style={{ width: `${comparison.percentileRank || 50}%` }}
          />
        </div>
        
        {/* Labels percentil */}
        <div className="flex items-center justify-between text-[10px] text-slate-600 mt-1">
          <span>P0</span>
          <span>P25</span>
          <span>P50</span>
          <span>P75</span>
          <span>P100</span>
        </div>
      </div>

      {/* GAP PORCENTUAL */}
      <div className="mt-3 flex items-center justify-between text-xs">
        <span className="text-slate-400">Diferencia</span>
        <div className="flex items-center gap-1">
          {comparison.status === 'above' && (
            <TrendingUp className="h-3 w-3 text-green-400" />
          )}
          {comparison.status === 'below' && (
            <TrendingDown className="h-3 w-3 text-red-400" />
          )}
          <span className={`font-semibold ${
            comparison.status === 'above' ? 'text-green-400' : 
            comparison.status === 'below' ? 'text-red-400' : 'text-slate-400'
          }`}>
            {comparison.percentageGap > 0 ? '+' : ''}
            {comparison.percentageGap.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* FOOTER - Muestra de mercado */}
      <div className="mt-3 pt-3 border-t border-slate-800/50">
        <p className="text-[10px] text-slate-500 text-center">
          Basado en {marketData.companyCount} empresa{marketData.companyCount !== 1 ? 's' : ''} · 
          {journeyCount} journeys activos
        </p>
      </div>

    </div>
  );
}