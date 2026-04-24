'use client';

// src/app/dashboard/compliance/components/ComplianceErrorState.tsx
// Error state del dashboard — mismo token + retry.

import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ComplianceErrorStateProps {
  error: string;
  onRetry?: () => void;
}

export default function ComplianceErrorState({
  error,
  onRetry,
}: ComplianceErrorStateProps) {
  return (
    <div className="relative overflow-hidden bg-[#0F172A]/90 backdrop-blur-2xl border border-slate-800 rounded-[20px] p-10 w-full text-center">
      <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto mb-4" />
      <h2 className="text-lg font-light text-slate-200 mb-2">Error al cargar</h2>
      <p className="text-sm text-slate-500 font-light mb-6">{error}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-700 text-slate-300 hover:text-white hover:border-slate-500 transition-all text-sm"
        >
          <RefreshCw className="w-4 h-4" />
          Reintentar
        </button>
      )}
    </div>
  );
}
