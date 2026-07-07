'use client';

// src/components/clima/BusinessCaseCard.tsx
// Caso de negocio en CLP (costo de rotación proyectado + inversión recomendada
// + ROI + payback). Genérico cross-producto. Fuente: PulseBusinessCase de
// PulseEngine (SalaryConfigService único writer de las cifras).

import { AlertTriangle } from 'lucide-react';
import type { PulseBusinessCase } from '@/lib/services/clima/PulseEngine';

interface BusinessCaseCardProps {
  businessCase: PulseBusinessCase;
}

const TYPE_LABEL: Record<PulseBusinessCase['type'], string> = {
  clima_critico: 'Clima crítico',
  retencion_riesgo: 'Riesgo de retención',
  liderazgo_gap: 'Brecha de liderazgo',
};

const clp = new Intl.NumberFormat('es-CL', {
  style: 'currency',
  currency: 'CLP',
  maximumFractionDigits: 0,
});

export default function BusinessCaseCard({ businessCase: bc }: BusinessCaseCardProps) {
  // Anti-semáforo (nunca rojo): crítica → ámbar · alta → slate.
  const severityColor = bc.severity === 'critica' ? '#F59E0B' : '#94A3B8';

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-800/40 bg-slate-900/60 backdrop-blur-sm p-5">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" style={{ color: severityColor }} />
          <span className="text-sm font-light text-white">{TYPE_LABEL[bc.type]}</span>
        </div>
        <span className="text-[9px] uppercase tracking-widest text-slate-500 border border-slate-700/40 rounded-full px-2 py-0.5">
          confianza {bc.confidence}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-slate-500">Costo anual en riesgo</p>
          <p className="text-xl md:text-2xl font-extralight tabular-nums text-white leading-tight mt-1">
            {clp.format(bc.potentialAnnualLossCLP)}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">{bc.peopleAtRisk} personas en riesgo</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-slate-500">Inversión recomendada</p>
          <p className="text-xl md:text-2xl font-extralight tabular-nums text-white leading-tight mt-1">
            {clp.format(bc.recommendedInvestmentCLP)}
          </p>
          {bc.estimatedROIPct !== null && (
            <p className="text-[11px] text-slate-500 mt-0.5">
              ROI {Math.round(bc.estimatedROIPct)}%
              {bc.paybackMonths !== null ? ` · payback ${Math.round(bc.paybackMonths)} meses` : ''}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
