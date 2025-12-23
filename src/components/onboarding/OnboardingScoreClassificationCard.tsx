// src/components/onboarding/OnboardingScoreClassificationCard.tsx
/**
 * CARD 1 - SOPORTE DEL GAUGE v4.0 (ARQUITECTURA CORRECTA)
 * 
 * CAMBIO CRÍTICO:
 * - ANTES: benchmarkScore ?? 52.5 (HARDCODEADO INCORRECTO)
 * - AHORA: useBenchmark() consultando API real
 * 
 * DATOS REALES EN BD (2025-10):
 * - CL × ALL × ALL × ALL = 32.22 (benchmark nacional)
 * - CL × personas = 31.29
 * - Mediana = 28.5
 * 
 * ARQUITECTURA OFICIAL:
 * - Hook: useBenchmark('onboarding_exo', 'ALL', undefined, 'CL')
 * - API: GET /api/benchmarks?metricType=onboarding_exo&standardCategory=ALL&country=CL
 * - Tabla: market_benchmarks
 * - Docs: 07_DOCUMENTACION_COMPLETA_BENCHMARK_SYSTEM.md
 */

'use client';

import { memo, useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus, BarChart3, Loader2 } from 'lucide-react';
import { useBenchmark } from '@/hooks/useBenchmark';

interface OnboardingScoreClassificationCardProps {
  score: number;
  periodCount: number;
  totalJourneys: number;
  companyName?: string;
  country?: string;  // País para benchmark (default: CL)
}

export default memo(function OnboardingScoreClassificationCard({
  score,
  periodCount,
  totalJourneys,
  companyName = 'Tu empresa',
  country = 'CL'
}: OnboardingScoreClassificationCardProps) {
  
  // ══════════════════════════════════════════════════════════════
  // HOOK OFICIAL: Consulta benchmark REAL desde API
  // Según documentación: 07_DOCUMENTACION_COMPLETA_BENCHMARK_SYSTEM.md
  // ══════════════════════════════════════════════════════════════
  const { 
    data: benchmarkData, 
    loading: benchmarkLoading,
    error: benchmarkError 
  } = useBenchmark(
    'onboarding_exo',   // metricType
    'ALL',              // standardCategory (empresa completa, no categoría específica)
    undefined,          // Sin departmentId (benchmark general)
    country             // País (CL por defecto)
  );

  // ══════════════════════════════════════════════════════════════
  // CÁLCULO COMPARACIÓN CON DATOS REALES
  // ══════════════════════════════════════════════════════════════
  const benchmark = useMemo(() => {
    // Si está cargando o hay error, no mostrar benchmark
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
      color: isAbove ? 'text-emerald-400' : isBelow ? 'text-amber-400' : 'text-slate-400',
      bgColor: isAbove ? 'bg-emerald-500/10' : isBelow ? 'bg-amber-500/10' : 'bg-slate-800/40',
      borderColor: isAbove ? 'border-emerald-500/20' : isBelow ? 'border-amber-500/20' : 'border-slate-700/40',
      companyCount: benchmarkData.benchmark.companyCount,
      sampleSize: benchmarkData.benchmark.sampleSize
    };
  }, [score, benchmarkData, benchmarkLoading, benchmarkError]);

  // ══════════════════════════════════════════════════════════════
  // NARRATIVA CON SIGNIFICADO REAL
  // ══════════════════════════════════════════════════════════════
  const narrative = useMemo(() => {
    if (score >= 80) {
      return {
        line1: 'Tu onboarding es referente.',
        line2: 'Los talentos llegan y se quedan.',
        color: 'text-emerald-400'
      };
    }
    if (score >= 60) {
      return {
        line1: 'Tu onboarding está funcionando.',
        line2: 'Hay espacio para ser excelente.',
        color: 'text-cyan-400'
      };
    }
    if (score >= 40) {
      return {
        line1: 'Tu onboarding tiene fricciones.',
        line2: 'Los nuevos talentos lo sienten.',
        color: 'text-amber-400'
      };
    }
    return {
      line1: 'Tu onboarding necesita atención.',
      line2: 'El riesgo de fuga temprana es alto.',
      color: 'text-red-400'
    };
  }, [score]);

  // ══════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════
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
      {/* Efecto decorativo sutil */}
      <div className="absolute -top-16 -right-16 w-28 h-28 bg-gradient-to-br from-cyan-500/5 to-purple-500/5 rounded-full blur-2xl pointer-events-none" />
      
      {/* ══════════════════════════════════════════════════════════ */}
      {/* HEADER COMPACTO */}
      {/* ══════════════════════════════════════════════════════════ */}
      <div className="relative flex items-center gap-2 mb-3">
        <div className="p-1.5 bg-gradient-to-br from-cyan-500/20 to-cyan-600/10 rounded-lg">
          <BarChart3 className="h-3 w-3 text-cyan-400" />
        </div>
        <p className="text-[10px] uppercase tracking-wider font-medium text-cyan-400">
          vs Mercado {country}
        </p>
      </div>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* BENCHMARK - DATOS REALES DE API */}
      {/* ══════════════════════════════════════════════════════════ */}
      {benchmarkLoading ? (
        // Estado de carga
        <div className="bg-slate-800/40 border border-slate-700/40 rounded-lg px-3 py-3 mb-3">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 text-slate-500 animate-spin" />
            <span className="text-[11px] text-slate-500">Cargando benchmark...</span>
          </div>
        </div>
      ) : benchmark ? (
        // Benchmark disponible
        <div className={`${benchmark.bgColor} ${benchmark.borderColor} border rounded-lg px-3 py-3 mb-3`}>
          <div className="flex items-center gap-2">
            <benchmark.icon className={`h-5 w-5 ${benchmark.color} flex-shrink-0`} />
            <div className="flex-1">
              <div className="flex items-baseline gap-1">
                <span className={`text-xl font-semibold ${benchmark.color}`}>
                  {benchmark.isAbove ? '+' : benchmark.isBelow ? '-' : '≈'}{benchmark.diffPercent}%
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {benchmark.isAbove 
                  ? `sobre promedio ${country}` 
                  : benchmark.isBelow 
                    ? `bajo promedio ${country}` 
                    : `alineado con ${country}`}
              </p>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-700/30">
            <p className="text-[10px] text-slate-500">
              Benchmark nacional: {benchmark.marketAvg} pts
              {benchmark.companyCount && (
                <span className="text-slate-600"> · {benchmark.companyCount} empresas</span>
              )}
            </p>
          </div>
        </div>
      ) : (
        // Sin benchmark disponible
        <div className="bg-slate-800/40 border border-slate-700/40 rounded-lg px-3 py-3 mb-3">
          <p className="text-[11px] text-slate-500">
            Benchmark no disponible aún
          </p>
          <p className="text-[9px] text-slate-600 mt-1">
            Se requieren más datos del mercado
          </p>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════ */}
      {/* NARRATIVA - SIGNIFICADO REAL */}
      {/* ══════════════════════════════════════════════════════════ */}
      <div className="mb-3">
        <p className={`text-[11px] leading-relaxed ${narrative.color}`}>
          {narrative.line1}
        </p>
        <p className="text-[11px] leading-relaxed text-slate-400">
          {narrative.line2}
        </p>
      </div>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* FOOTER - Metadata */}
      {/* ══════════════════════════════════════════════════════════ */}
      <div className="pt-2 border-t border-slate-700/30">
        <div className="flex items-center justify-center gap-3 text-[9px] text-slate-500">
          <span className="flex items-center gap-1">
            <span className="w-1 h-1 bg-cyan-500/50 rounded-full" />
            {periodCount} {periodCount === 1 ? 'mes' : 'meses'}
          </span>
          <span className="text-slate-700">·</span>
          <span className="flex items-center gap-1">
            <span className="w-1 h-1 bg-purple-500/50 rounded-full" />
            {totalJourneys} journeys
          </span>
        </div>
      </div>
    </div>
  );
});