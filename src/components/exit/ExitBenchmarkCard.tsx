// ====================================================================
// EXIT BENCHMARK CARD - Comparación vs Mercado + Causa #1
// src/components/exit/ExitBenchmarkCard.tsx
// v1.0 - Layout simple: VS Mercado CL + Top Factor
// ====================================================================

'use client';

import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  AlertTriangle
} from 'lucide-react';
import type { ExitMetricsSummary } from '@/types/exit';

// ====================================================================
// TYPES
// ====================================================================

interface ExitBenchmarkCardProps {
  data: {
    summary: ExitMetricsSummary | null;
  };
  loading?: boolean;
  benchmarkValue?: number;
}

// ====================================================================
// HELPERS
// ====================================================================

function getSeverityLabel(avgSeverity: number): { label: string; color: string } {
  if (avgSeverity <= 2) {
    return { label: 'Crítico', color: 'text-red-400' };
  }
  if (avgSeverity <= 3.5) {
    return { label: 'Atención', color: 'text-amber-400' };
  }
  return { label: 'Normal', color: 'text-emerald-400' };
}

// ====================================================================
// LOADING STATE
// ====================================================================

function LoadingSkeleton() {
  return (
    <div className="fhr-card p-6 animate-pulse space-y-6">
      <div className="space-y-3">
        <div className="h-4 w-24 bg-slate-700/50 rounded" />
        <div className="h-8 w-32 bg-slate-700/50 rounded" />
        <div className="h-2 w-full bg-slate-700/50 rounded-full" />
      </div>
      <div className="border-t border-slate-700/50 pt-4 space-y-2">
        <div className="h-4 w-32 bg-slate-700/50 rounded" />
        <div className="h-3 w-24 bg-slate-700/50 rounded" />
      </div>
    </div>
  );
}

// ====================================================================
// MAIN COMPONENT
// ====================================================================

export default memo(function ExitBenchmarkCard({
  data,
  loading = false,
  benchmarkValue = 55
}: ExitBenchmarkCardProps) {

  const { summary } = data;

  // ════════════════════════════════════════════════════════
  // CÁLCULOS BENCHMARK
  // ════════════════════════════════════════════════════════
  const benchmarkComparison = useMemo(() => {
    const score = summary?.globalAvgEIS ?? 0;
    const delta = score - benchmarkValue;
    const deltaPercent = benchmarkValue > 0
      ? Math.round(Math.abs((delta / benchmarkValue) * 100))
      : 0;

    const isAbove = delta > 2;
    const isBelow = delta < -2;

    // Barra visual: posición relativa (0-100 donde 50 = benchmark)
    const barPosition = Math.min(100, Math.max(0, (score / 100) * 100));
    const benchmarkPosition = (benchmarkValue / 100) * 100;

    return {
      score,
      delta,
      deltaPercent,
      isAbove,
      isBelow,
      barPosition,
      benchmarkPosition,
      icon: isAbove ? TrendingUp : isBelow ? TrendingDown : Minus,
      color: isAbove ? 'text-emerald-400' : isBelow ? 'text-red-400' : 'text-slate-400',
      bgColor: isAbove ? 'bg-emerald-500' : isBelow ? 'bg-red-500' : 'bg-slate-500'
    };
  }, [summary?.globalAvgEIS, benchmarkValue]);

  // ════════════════════════════════════════════════════════
  // TOP FACTOR (#1)
  // ════════════════════════════════════════════════════════
  const topFactor = useMemo(() => {
    const factors = summary?.topFactorsGlobal;
    if (!factors || factors.length === 0) return null;

    const first = factors[0];
    const severity = getSeverityLabel(first.avgSeverity);

    return {
      factor: first.factor,
      mentions: first.mentions,
      mentionRate: Math.round(first.mentionRate * 100),
      avgSeverity: first.avgSeverity,
      severityLabel: severity.label,
      severityColor: severity.color
    };
  }, [summary?.topFactorsGlobal]);

  // ════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════

  if (loading) {
    return <LoadingSkeleton />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="fhr-card p-6"
    >
      {/* ════════════════════════════════════════════════════
          SECCIÓN 1: VS MERCADO CL
         ════════════════════════════════════════════════════ */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Target className="h-4 w-4 text-slate-500" />
          <span className="text-xs font-light text-slate-500 uppercase tracking-wider">
            VS Mercado CL
          </span>
        </div>

        {/* Delta Display */}
        <div className="flex items-baseline gap-3 mb-4">
          <benchmarkComparison.icon className={`h-5 w-5 ${benchmarkComparison.color}`} />
          <span className={`text-3xl font-extralight tabular-nums ${benchmarkComparison.color}`}>
            {benchmarkComparison.isAbove ? '+' : benchmarkComparison.isBelow ? '' : '≈'}
            {benchmarkComparison.delta.toFixed(1)}
          </span>
          <span className="text-sm text-slate-500 font-light">
            pts vs benchmark ({benchmarkValue})
          </span>
        </div>

        {/* Barra Visual */}
        <div className="relative">
          {/* Track */}
          <div className="h-2 bg-slate-800/50 rounded-full overflow-hidden">
            {/* Filled */}
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${benchmarkComparison.barPosition}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className={`h-full rounded-full ${benchmarkComparison.bgColor}`}
            />
          </div>

          {/* Benchmark Marker */}
          <div
            className="absolute top-1/2 -translate-y-1/2 w-0.5 h-4 bg-white/60"
            style={{ left: `${benchmarkComparison.benchmarkPosition}%` }}
          />

          {/* Labels */}
          <div className="flex justify-between mt-2 text-[10px] text-slate-600">
            <span>0</span>
            <span className="text-slate-400">
              Tu EIS: {benchmarkComparison.score.toFixed(1)}
            </span>
            <span>100</span>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════
          SECCIÓN 2: CAUSA #1
         ════════════════════════════════════════════════════ */}
      <div className="pt-5 border-t border-slate-700/50">
        {topFactor ? (
          <>
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className={`h-4 w-4 ${topFactor.severityColor}`} />
              <span className="text-sm font-light text-slate-300">
                Causa #1: <span className="text-white">{topFactor.factor}</span>
              </span>
            </div>

            <div className="flex items-center gap-4 text-xs text-slate-500">
              <span>
                {topFactor.mentions} menciones ({topFactor.mentionRate}%)
              </span>
              <span className="text-slate-600">·</span>
              <span className={topFactor.severityColor}>
                Severidad: {topFactor.avgSeverity.toFixed(1)}/5 ({topFactor.severityLabel})
              </span>
            </div>
          </>
        ) : (
          <div className="text-sm text-slate-500 font-light">
            Sin datos de factores disponibles
          </div>
        )}
      </div>
    </motion.div>
  );
});
