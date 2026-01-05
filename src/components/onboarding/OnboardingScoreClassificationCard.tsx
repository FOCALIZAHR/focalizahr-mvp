// src/components/onboarding/OnboardingScoreClassificationCard.tsx
/**
 * CARD 1 - VS MERCADO v5.1
 * FIX: Barra proporcional real (escala ±50%)
 */

'use client';

import { memo, useMemo, useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Minus, BarChart3, Loader2 } from 'lucide-react';
import { useBenchmark } from '@/hooks/useBenchmark';

interface OnboardingScoreClassificationCardProps {
  score: number;
  periodCount: number;
  totalJourneys: number;
  companyName?: string;
  country?: string;
}

export default memo(function OnboardingScoreClassificationCard({
  score,
  periodCount,
  totalJourneys,
  companyName = 'Tu empresa',
  country = 'CL'
}: OnboardingScoreClassificationCardProps) {
  
  const [animatedPercent, setAnimatedPercent] = useState(0);
  
  const { 
    data: benchmarkData, 
    loading: benchmarkLoading,
    error: benchmarkError 
  } = useBenchmark(
    'onboarding_exo',
    'ALL',
    undefined,
    country
  );

  const benchmark = useMemo(() => {
    if (benchmarkLoading || benchmarkError || !benchmarkData?.benchmark) {
      return null;
    }

    const marketAvg = benchmarkData.benchmark.avgScore;
    const diff = score - marketAvg;
    const diffPercent = Math.round(Math.abs((diff / marketAvg) * 100));
    
    const isAbove = diff > 2;
    const isBelow = diff < -2;

    return {
      marketAvg: Math.round(marketAvg * 10) / 10,
      diff,
      diffPercent,
      isAbove,
      isBelow,
      isNeutral: !isAbove && !isBelow,
      icon: isAbove ? TrendingUp : isBelow ? TrendingDown : Minus,
      color: isAbove ? 'text-cyan-400' : isBelow ? 'text-amber-400' : 'text-slate-400',
      companyCount: benchmarkData.benchmark.companyCount,
      sampleSize: benchmarkData.benchmark.sampleSize
    };
  }, [score, benchmarkData, benchmarkLoading, benchmarkError]);

  useEffect(() => {
    if (benchmark) {
      const duration = 1000;
      const steps = 30;
      const increment = benchmark.diffPercent / steps;
      let current = 0;
      
      const timer = setInterval(() => {
        current += increment;
        if (current >= benchmark.diffPercent) {
          setAnimatedPercent(benchmark.diffPercent);
          clearInterval(timer);
        } else {
          setAnimatedPercent(Math.round(current));
        }
      }, duration / steps);
      
      return () => clearInterval(timer);
    }
  }, [benchmark]);

  const narrative = useMemo(() => {
    if (score >= 80) {
      return {
        line1: 'Tu onboarding es referente.',
        line2: 'Replica este modelo en toda la empresa.',
        color: 'text-cyan-400'
      };
    }
    if (score >= 60) {
      return {
        line1: 'Tu onboarding funciona bien.',
        line2: 'Identifica fricciones para llegar a excelente.',
        color: 'text-cyan-400'
      };
    }
    if (score >= 40) {
      return {
        line1: 'Tu onboarding tiene fricciones.',
        line2: 'Prioriza: 7 primeros días son críticos.',
        color: 'text-amber-400'
      };
    }
    return {
      line1: 'Tu onboarding necesita atención urgente.',
      line2: 'Alto riesgo de fuga: actúa ahora.',
      color: 'text-red-400'
    };
  }, [score]);

  return (
    <div 
      className="
        relative overflow-hidden
        bg-slate-900/40 
        backdrop-blur-xl
        border border-slate-700/50 
        rounded-xl 
        p-4
        w-full
        max-w-xs
        transition-all duration-300 ease-out
        hover:bg-slate-900/50
        hover:border-slate-600/50
      "
    >
      {/* Línea Tesla */}
      <div className="absolute -top-3 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />
      
      {/* Glow - solo desktop */}
      <div className="hidden md:block absolute -top-16 -right-16 w-32 h-32 bg-gradient-to-br from-cyan-500/5 to-purple-500/5 rounded-full blur-2xl pointer-events-none" />
      
      {/* HEADER */}
      <div className="relative flex items-center gap-2 mb-4">
        <div className="p-1.5 bg-gradient-to-br from-cyan-500/20 to-cyan-600/10 rounded-lg">
          <BarChart3 className="h-3 w-3 text-cyan-400" />
        </div>
        <p className="text-[10px] uppercase tracking-wider font-medium text-cyan-400">
          vs Mercado {country}
        </p>
      </div>

      {/* BENCHMARK */}
      {benchmarkLoading ? (
        <div className="bg-slate-800/30 border border-slate-700/40 rounded-lg px-3 py-3 mb-4">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 text-slate-500 animate-spin" />
            <span className="text-[11px] text-slate-400">Cargando...</span>
          </div>
        </div>
      ) : benchmark ? (
        <div className="bg-slate-800/30 border border-slate-700/40 rounded-lg px-3 py-4 mb-4 relative overflow-hidden">
          
          <div className="relative flex items-start gap-3">
            <benchmark.icon className={`h-6 w-6 ${benchmark.color} flex-shrink-0 mt-0.5`} />
            
            <div className="flex-1 min-w-0">
              {/* NÚMERO */}
              <div className={`text-3xl font-light ${benchmark.color} tracking-tight leading-none mb-2`}>
                {benchmark.isAbove ? '+' : benchmark.isBelow ? '-' : '≈'}{animatedPercent}%
              </div>
              
              {/* BARRA - ESCALA REAL ±50% */}
              <div className="relative h-1 bg-slate-700/30 rounded-full overflow-hidden mb-2">
                <div 
                  className={`h-full ${benchmark.isAbove ? 'bg-cyan-400' : benchmark.isBelow ? 'bg-amber-400' : 'bg-slate-400'} transition-all duration-1000 ease-out`}
                  style={{ width: `${Math.min((Math.abs(benchmark.diffPercent) / 50) * 100, 100)}%` }}
                />
              </div>
              
              <p className="text-[11px] text-slate-400 mb-3">
                {benchmark.isAbove ? 'sobre' : benchmark.isBelow ? 'bajo' : 'alineado con'} promedio nacional
              </p>

              {/* Dot plot - desktop */}
              <div className="hidden md:block pt-3 border-t border-slate-700/20">
                <div className="flex items-center justify-between text-[9px] text-slate-500 mb-2">
                  <span>Mercado CL</span>
                  <span className={benchmark.color}>Tu empresa</span>
                </div>
                <div className="relative h-6 flex items-center">
                  <div className="absolute inset-x-0 top-1/2 h-[1px] bg-slate-700/30" />
                  
                  <div 
                    className="absolute flex flex-col items-center"
                    style={{ left: '45%' }}
                  >
                    <div className="w-2 h-2 rounded-full bg-slate-500 mb-1" />
                    <span className="text-[8px] text-slate-500 whitespace-nowrap">{benchmark.marketAvg}</span>
                  </div>
                  
                  <div 
                    className="absolute flex flex-col items-center transition-all duration-1000 ease-out"
                    style={{ left: `${Math.max(10, Math.min(80, 45 + (benchmark.diff / benchmark.marketAvg * 40)))}%` }}
                  >
                    <div 
                      className={`w-3 h-3 rounded-full ${benchmark.isAbove ? 'bg-cyan-400' : 'bg-amber-400'} mb-1`}
                      style={{ boxShadow: `0 0 12px ${benchmark.isAbove ? 'rgba(34, 211, 238, 0.5)' : 'rgba(251, 191, 36, 0.5)'}` }}
                    />
                    <span className={`text-[8px] ${benchmark.color} font-semibold whitespace-nowrap`}>{score}</span>
                  </div>
                </div>
              </div>

              {/* Mobile */}
              <div className="md:hidden pt-2 border-t border-slate-700/20">
                <p className="text-[9px] text-slate-500">
                  Benchmark: <span className="text-slate-400">{benchmark.marketAvg} pts</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-slate-800/30 border border-slate-700/40 rounded-lg px-3 py-3 mb-4">
          <p className="text-[11px] text-slate-400 mb-1">Benchmark no disponible</p>
          <p className="text-[9px] text-slate-500">Se requieren más datos</p>
        </div>
      )}

      {/* NARRATIVA */}
      <div className="relative space-y-1.5">
        <p className={`text-xs font-medium ${narrative.color} leading-snug`}>
          {narrative.line1}
        </p>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          {narrative.line2}
        </p>
      </div>
    </div>
  );
});