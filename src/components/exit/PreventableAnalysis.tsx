// ====================================================================
// PREVENTABLE ANALYSIS - Exit Intelligence
// src/components/exit/PreventableAnalysis.tsx
// v2.0 - MOBILE FIRST - Análisis Prevenible vs Estructural
//
// FILOSOFÍA:
// - Mobile First: Stack vertical base, grid en desktop
// - Typography legible (mínimo 14px)
// - Touch-friendly spacing
// ====================================================================

'use client';

import { memo } from 'react';
import { ShieldCheck, AlertTriangle } from 'lucide-react';

// ====================================================================
// TYPES
// ====================================================================

interface PreventableAnalysisProps {
  totalExits: number;
  exitsWithIgnoredAlerts: number;
  totalCost: number;
}

// ====================================================================
// HELPERS
// ====================================================================

const formatCurrency = (amount: number): string => {
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(0)}M`;
  if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
  return `$${amount.toFixed(0)}`;
};

// ====================================================================
// COMPONENTE PRINCIPAL
// ====================================================================

export default memo(function PreventableAnalysis({
  totalExits,
  exitsWithIgnoredAlerts,
  totalCost
}: PreventableAnalysisProps) {

  // Cálculos
  const preventableRate = totalExits > 0
    ? (exitsWithIgnoredAlerts / totalExits) * 100
    : 0;
  const structuralRate = 100 - preventableRate;
  const preventableCost = totalCost * (preventableRate / 100);
  const structuralCost = totalCost * (structuralRate / 100);
  const structuralExits = totalExits - exitsWithIgnoredAlerts;

  return (
    <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">

      {/* Prevenible */}
      <div className="p-4 lg:p-5 bg-amber-500/5 border border-amber-500/20 rounded-xl">
        <div className="flex items-center gap-2 mb-3 lg:mb-4">
          <div className="p-2 bg-amber-500/10 rounded-lg flex-shrink-0">
            <AlertTriangle className="w-4 h-4 text-amber-400" strokeWidth={1.5} />
          </div>
          <span className="text-sm font-medium text-amber-400">Prevenible</span>
        </div>

        <p className="text-3xl lg:text-4xl font-bold text-white mb-2 tabular-nums">
          {Math.round(preventableRate)}%
        </p>

        <p className="text-sm text-slate-400 mb-3">
          {exitsWithIgnoredAlerts} salida{exitsWithIgnoredAlerts !== 1 ? 's' : ''} con alertas ignoradas
        </p>

        <div className="pt-3 border-t border-amber-500/10">
          <p className="text-sm">
            <span className="text-amber-400 font-medium tabular-nums">{formatCurrency(preventableCost)}</span>
            <span className="text-slate-500 ml-1">evitables</span>
          </p>
        </div>
      </div>

      {/* Estructural */}
      <div className="p-4 lg:p-5 bg-slate-500/5 border border-slate-500/20 rounded-xl">
        <div className="flex items-center gap-2 mb-3 lg:mb-4">
          <div className="p-2 bg-slate-500/10 rounded-lg flex-shrink-0">
            <ShieldCheck className="w-4 h-4 text-slate-400" strokeWidth={1.5} />
          </div>
          <span className="text-sm font-medium text-slate-400">Estructural</span>
        </div>

        <p className="text-3xl lg:text-4xl font-bold text-white mb-2 tabular-nums">
          {Math.round(structuralRate)}%
        </p>

        <p className="text-sm text-slate-400 mb-3">
          {structuralExits} salida{structuralExits !== 1 ? 's' : ''} sin alertas previas
        </p>

        <div className="pt-3 border-t border-slate-500/10">
          <p className="text-sm">
            <span className="text-slate-300 font-medium tabular-nums">{formatCurrency(structuralCost)}</span>
            <span className="text-slate-500 ml-1">requieren cambios de fondo</span>
          </p>
        </div>
      </div>

    </div>
  );
});
