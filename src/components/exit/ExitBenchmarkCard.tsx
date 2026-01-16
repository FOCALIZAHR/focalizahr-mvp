// ====================================================================
// EXIT BENCHMARK CARD v4.0 - Optimizado Mobile-First
// src/components/exit/ExitBenchmarkCard.tsx
// ====================================================================
// OPTIMIZACIONES:
// - Padding reducido: p-6 → p-4 mobile, p-5 desktop
// - Espaciado compacto: mb-8 → mb-4
// - Proporciones balanceadas (menos altura)
// - Mobile-first responsive
// ====================================================================

'use client';

import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  MessageCircle
} from 'lucide-react';
import type { ExitMetricsSummary } from '@/types/exit';
import { useBenchmark } from '@/hooks/useBenchmark';

// ====================================================================
// TYPES
// ====================================================================

interface ExitBenchmarkCardProps {
  data: {
    summary: ExitMetricsSummary | null;
  };
  loading?: boolean;
}

// ====================================================================
// HELPERS
// ====================================================================

function getComparisonConfig(delta: number): {
  message: string;
  Icon: typeof TrendingUp;
  color: string;
} {
  if (delta > 5) {
    return { message: 'Sobre el mercado', Icon: TrendingUp, color: 'text-emerald-400' };
  }
  if (delta < -5) {
    return { message: 'Bajo el mercado', Icon: TrendingDown, color: 'text-red-400' };
  }
  return { message: 'En línea con Chile', Icon: Minus, color: 'text-slate-400' };
}

function getSeverityColor(avgSeverity: number): string {
  if (avgSeverity <= 2) return 'text-red-400';
  if (avgSeverity <= 3) return 'text-amber-400';
  return 'text-emerald-400';
}

function getSeverityLabel(avgSeverity: number): string {
  if (avgSeverity <= 2) return 'Crítico';
  if (avgSeverity <= 3) return 'Atención';
  return 'Normal';
}

// ====================================================================
// LOADING STATE
// ====================================================================

function LoadingSkeleton() {
  return (
    <div className="relative bg-slate-900/40 backdrop-blur-xl border border-slate-800/50 rounded-xl overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
      <div className="p-4 sm:p-5 animate-pulse space-y-3">
        <div className="h-2.5 w-28 bg-slate-700/50 rounded" />
        <div className="h-5 w-36 bg-slate-700/50 rounded" />
        <div className="h-3 w-24 bg-slate-700/50 rounded" />
        <div className="h-px bg-slate-700/30 my-3" />
        <div className="h-4 w-40 bg-slate-700/50 rounded" />
        <div className="h-3 w-32 bg-slate-700/50 rounded" />
      </div>
    </div>
  );
}

// ====================================================================
// MAIN COMPONENT
// ====================================================================

export default memo(function ExitBenchmarkCard({
  data,
  loading = false
}: ExitBenchmarkCardProps) {

  const { summary } = data;

  // Obtener benchmark real desde el API (misma fuente que el Gauge)
  const { data: benchmarkData } = useBenchmark('eis', 'ALL', undefined, 'CL');
  const actualBenchmark = benchmarkData?.benchmark?.avgScore ?? 55;

  const comparison = useMemo(() => {
    const score = summary?.globalAvgEIS ?? 0;
    const delta = score - actualBenchmark;
    return { score, delta, benchmarkValue: actualBenchmark, ...getComparisonConfig(delta) };
  }, [summary?.globalAvgEIS, actualBenchmark]);

  const topFactor = useMemo(() => {
    const factors = summary?.topFactorsGlobal;
    if (!factors || factors.length === 0) return null;
    const first = factors[0];
    return {
      factor: first.factor,
      mentions: first.mentions,
      mentionRate: Math.round(first.mentionRate * 100),
      severityColor: getSeverityColor(first.avgSeverity),
      severityLabel: getSeverityLabel(first.avgSeverity)
    };
  }, [summary?.topFactorsGlobal]);

  if (loading) return <LoadingSkeleton />;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="relative bg-slate-900/40 backdrop-blur-xl border border-slate-800/50 rounded-xl overflow-hidden"
    >
      {/* Línea Tesla */}
      <div 
        className="absolute top-0 left-0 right-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, #22D3EE, transparent)' }}
      />

      {/* ════════════════════════════════════════════════════
          CONTENIDO - Padding compacto mobile-first
         ════════════════════════════════════════════════════ */}
      <div className="p-4 sm:p-5">
        
        {/* SECCIÓN 1: Contexto Competitivo */}
        <div className="mb-4">
          <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">
            Contexto Competitivo
          </p>

          <div className="flex items-center gap-2 mb-1">
            <comparison.Icon className={`h-4 w-4 ${comparison.color}`} strokeWidth={1.5} />
            <span className="text-base sm:text-lg font-light text-white">
              {comparison.message}
            </span>
          </div>

          <p className="text-xs sm:text-sm text-slate-500 font-light pl-6">
            {comparison.score.toFixed(0)} vs {comparison.benchmarkValue} promedio mercado
          </p>
        </div>

        {/* Separador */}
        <div className="h-px bg-gradient-to-r from-transparent via-slate-700/50 to-transparent mb-4" />

        {/* SECCIÓN 2: Causa Principal */}
        {topFactor ? (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <MessageCircle className="h-3.5 w-3.5 text-cyan-400/70" strokeWidth={1.5} />
              <span className="text-[10px] text-slate-500 uppercase tracking-widest">
                Principal causa de salida
              </span>
            </div>

            <p className="text-sm sm:text-base text-white font-light mb-2">
              {topFactor.factor}
            </p>

            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] sm:text-xs text-slate-500">
              <span>{topFactor.mentions} menciones</span>
              <span className="text-slate-700">·</span>
              <span>{topFactor.mentionRate}% de exits</span>
              <span className="text-slate-700">·</span>
              <span className={topFactor.severityColor}>{topFactor.severityLabel}</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-slate-500">
            <MessageCircle className="h-3.5 w-3.5" strokeWidth={1.5} />
            <span className="text-xs font-light">Sin datos de factores</span>
          </div>
        )}
      </div>
    </motion.div>
  );
});