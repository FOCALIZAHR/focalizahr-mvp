// ====================================================================
// ACTO 5: CONTEXTO Y ROI
// src/components/exit/causes/ROIBenchmarkCard.tsx
// v2.0 - Refactorizado según FILOSOFIA_DISENO_FOCALIZAHR
// ====================================================================
//
// PRINCIPIO: "Entender en 3 segundos → Decidir en 10 → Actuar en 1 clic"
//
// ESTRUCTURA:
// 1. Grid 2 columnas (Impacto Financiero | Benchmark)
// 2. Monto GIGANTE como protagonista (text-5xl)
// 3. Barra comparativa simple
// 4. Insight al final
//
// ====================================================================

'use client';

import { DollarSign, TrendingUp, TrendingDown, Scale, Lightbulb, AlertTriangle } from 'lucide-react';
import type { ROIData } from '@/hooks/useExitCauses';

// ====================================================================
// PROPS
// ====================================================================
interface ROIBenchmarkCardProps {
  data: ROIData | null;
}

// ====================================================================
// HELPERS
// ====================================================================
function formatCLP(amount: number): string {
  if (amount >= 1000000000) {
    return `$${(amount / 1000000000).toFixed(1)}B`;
  }
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(0)}M`;
  }
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(0)}K`;
  }
  return `$${Math.round(amount).toLocaleString('es-CL')}`;
}

// ====================================================================
// COMPONENTE PRINCIPAL
// ====================================================================
export default function ROIBenchmarkCard({ data }: ROIBenchmarkCardProps) {
  // Si no hay datos
  if (!data) {
    return (
      <div className="fhr-card p-6">
        <h3 className="text-lg font-light text-white mb-4">Contexto y ROI</h3>
        <p className="text-slate-400 text-sm">No hay datos de ROI disponibles</p>
      </div>
    );
  }

  const {
    keyTalentLosses,
    estimatedCostCLP,
    benchmarkSeverity,
    companySeverity,
    benchmarkComparison,
    actionableInsight
  } = data;

  // Determinar comparación
  const isWorse = benchmarkComparison === 'worse';
  const isBetter = benchmarkComparison === 'better';
  const difference = benchmarkSeverity ? (companySeverity - benchmarkSeverity).toFixed(1) : '0';

  return (
    <div className="fhr-card relative overflow-hidden">
      {/* Línea Tesla */}
      <div className="fhr-top-line" />

      {/* Header */}
      <div className="p-6 pb-4">
        <h3 className="text-lg font-light text-white mb-1">
          Contexto y ROI
        </h3>
        <p className="text-sm text-slate-400">
          Impacto financiero y comparación de mercado
        </p>
      </div>

      {/* Content Grid - 2 columnas */}
      <div className="px-6 pb-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* ═══════════════════════════════════════════════════════════════
              COLUMNA IZQUIERDA: IMPACTO FINANCIERO
             ═══════════════════════════════════════════════════════════════ */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-red-400" />
              <h4 className="text-sm font-medium text-slate-300 uppercase tracking-wide">
                Costo de Inacción
              </h4>
            </div>

            {/* MONTO GIGANTE PROTAGONISTA */}
            <div className="p-6 bg-gradient-to-br from-red-500/15 to-orange-500/10 border border-red-500/30 rounded-xl text-center">
              <div className="text-5xl font-bold text-red-400 mb-2">
                {formatCLP(estimatedCostCLP)}
              </div>
              <div className="text-sm text-red-300/80 mb-1">
                CLP
              </div>
              <p className="text-xs text-slate-400 mt-3">
                {keyTalentLosses} salida{keyTalentLosses !== 1 ? 's' : ''} talento clave × 125% salario anual
              </p>
            </div>

            {/* Metodología */}
            <p className="text-xs text-slate-500 text-center">
              Metodología: SHRM Human Capital Benchmarking 2024
            </p>
          </div>

          {/* ═══════════════════════════════════════════════════════════════
              COLUMNA DERECHA: BENCHMARK DE INDUSTRIA
             ═══════════════════════════════════════════════════════════════ */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-cyan-400" />
              <h4 className="text-sm font-medium text-slate-300 uppercase tracking-wide">
                Tu Severidad vs Mercado
              </h4>
            </div>

            {/* Barras comparativas */}
            <div className={`
              p-5 rounded-xl border space-y-4
              ${isWorse
                ? 'bg-red-500/10 border-red-500/30'
                : isBetter
                ? 'bg-green-500/10 border-green-500/30'
                : 'bg-yellow-500/10 border-yellow-500/30'
              }
            `}>
              {/* Tu severidad */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-300">Tú</span>
                  <span className={`text-lg font-bold ${
                    companySeverity >= 4.0 ? 'text-red-400' :
                    companySeverity >= 3.0 ? 'text-yellow-400' : 'text-green-400'
                  }`}>
                    {companySeverity.toFixed(1)}
                  </span>
                </div>
                <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      companySeverity >= 4.0 ? 'bg-red-500' :
                      companySeverity >= 3.0 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${(companySeverity / 5) * 100}%` }}
                  />
                </div>
              </div>

              {/* Benchmark */}
              {benchmarkSeverity && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-300">Mercado</span>
                    <span className="text-lg font-bold text-cyan-400">
                      {benchmarkSeverity.toFixed(1)}
                    </span>
                  </div>
                  <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-cyan-500"
                      style={{ width: `${(benchmarkSeverity / 5) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Diferencia */}
              {benchmarkSeverity && (
                <div className="pt-3 border-t border-slate-700/50 flex items-center justify-between">
                  <span className="text-sm text-slate-400">Diferencia:</span>
                  <span className={`text-lg font-semibold ${
                    isWorse ? 'text-red-400' : isBetter ? 'text-green-400' : 'text-yellow-400'
                  }`}>
                    {parseFloat(difference) > 0 ? '+' : ''}{difference}
                  </span>
                </div>
              )}
            </div>

            {/* Indicador de estado */}
            <div className={`
              flex items-center justify-center gap-2 text-sm font-medium
              ${isWorse ? 'text-red-400' : isBetter ? 'text-green-400' : 'text-yellow-400'}
            `}>
              {isWorse ? (
                <>
                  <TrendingUp className="w-4 h-4" />
                  <span>Por encima del mercado</span>
                </>
              ) : isBetter ? (
                <>
                  <TrendingDown className="w-4 h-4" />
                  <span>Por debajo del mercado</span>
                </>
              ) : (
                <>
                  <Scale className="w-4 h-4" />
                  <span>En línea con el mercado</span>
                </>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* INSIGHT */}
      <div className="px-6 pb-6">
        <div className={`
          p-4 rounded-xl flex items-start gap-3
          ${isWorse
            ? 'bg-red-500/10 border border-red-500/20'
            : 'bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/20'
          }
        `}>
          {isWorse ? (
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          ) : (
            <Lightbulb className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
          )}
          <p className={`text-sm ${isWorse ? 'text-red-300' : 'text-slate-300'}`}>
            {actionableInsight}
          </p>
        </div>
      </div>
    </div>
  );
}
