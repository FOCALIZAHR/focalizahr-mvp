// ====================================================================
// TAB 5: ROI - CONTEXTO Y ROI
// src/app/dashboard/exit/causes/components/ROITab.tsx
// ====================================================================
//
// PREGUNTA: "¿Cuánto cuesta no actuar?"
// DISEÑO: Monto cyan grande, barras cyan/slate, insight conclusivo
//
// ====================================================================

'use client';

import { DollarSign, Scale, Lightbulb } from 'lucide-react';
import type { ROIData } from '@/hooks/useExitCauses';

// ====================================================================
// PROPS
// ====================================================================
interface ROITabProps {
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
export default function ROITab({ data }: ROITabProps) {
  // Si no hay datos
  if (!data) {
    return (
      <div className="fhr-card p-6">
        <p className="text-slate-400 text-sm text-center">
          No hay datos de ROI disponibles
        </p>
      </div>
    );
  }

  const {
    keyTalentLosses,
    estimatedCostCLP,
    benchmarkSeverity,
    companySeverity,
    actionableInsight
  } = data;

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

      {/* Content Grid */}
      <div className="px-6 pb-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* COLUMNA IZQUIERDA: COSTO */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-cyan-400" />
              <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Costo de Inacción
              </h4>
            </div>

            <div className="p-6 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-center">
              <div className="text-5xl font-light text-cyan-400 mb-2">
                {formatCLP(estimatedCostCLP)}
              </div>
              <div className="text-sm text-cyan-300/80 mb-3">
                CLP
              </div>
              <p className="text-xs text-slate-400">
                {keyTalentLosses} salida{keyTalentLosses !== 1 ? 's' : ''} talento clave × 125% salario anual
              </p>
            </div>

            <p className="text-xs text-slate-500 text-center">
              Metodología: SHRM Human Capital Benchmarking 2024
            </p>
          </div>

          {/* COLUMNA DERECHA: BENCHMARK */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-cyan-400" />
              <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Tu Severidad vs Mercado
              </h4>
            </div>

            <div className="p-5 bg-slate-800/30 border border-slate-700/30 rounded-xl space-y-4">
              {/* Tu severidad */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-300">Tú</span>
                  <span className="text-lg font-light text-cyan-400">
                    {companySeverity.toFixed(1)}
                  </span>
                </div>
                <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-cyan-500 rounded-full transition-all"
                    style={{ width: `${(companySeverity / 5) * 100}%` }}
                  />
                </div>
              </div>

              {/* Benchmark */}
              {benchmarkSeverity && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-300">Mercado</span>
                    <span className="text-lg font-light text-slate-400">
                      {benchmarkSeverity.toFixed(1)}
                    </span>
                  </div>
                  <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-slate-500 rounded-full"
                      style={{ width: `${(benchmarkSeverity / 5) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Diferencia */}
              {benchmarkSeverity && (
                <div className="pt-3 border-t border-slate-700/50 flex items-center justify-between">
                  <span className="text-sm text-slate-400">Diferencia:</span>
                  <span className="text-lg font-light text-cyan-400">
                    {parseFloat(difference) > 0 ? '+' : ''}{difference}
                  </span>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Insight */}
      <div className="px-6 pb-6">
        <div className="p-4 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/20 rounded-xl">
          <div className="flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-slate-300">
              {actionableInsight}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
