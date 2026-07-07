'use client';

// src/app/dashboard/clima/components/ClimaHeader.tsx
// Header del Cinema Mode de Clima. Clon de evaluator/cinema/CinemaHeader +
// selector de campaña (clima tiene múltiples campañas cerradas históricas;
// evaluaciones asume 1 ciclo activo, clima no).

import { ChevronDown } from 'lucide-react';
import type { ClimaCampaignSummary, ClimaProductType } from '@/types/clima';

interface ClimaHeaderProps {
  campaigns: ClimaCampaignSummary[];
  selectedCampaignId: string | null;
  onSelectCampaign: (id: string) => void;
}

const PRODUCT_LABEL: Record<ClimaProductType, string> = {
  'pulso-express': 'Pulso Express',
  'experiencia-full': 'Experiencia Full',
};

export default function ClimaHeader({
  campaigns,
  selectedCampaignId,
  onSelectCampaign,
}: ClimaHeaderProps) {
  const selected = campaigns.find((c) => c.id === selectedCampaignId) ?? null;

  return (
    <div className="h-14 flex items-center justify-between px-4 md:px-8 border-b border-white/5 flex-shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em]">
          FocalizaHR
        </span>
        <span className="text-slate-700">|</span>
        <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider">
          Clima
        </span>
        {selected?.productType && (
          <span className="hidden sm:inline text-[10px] text-slate-500 font-mono uppercase tracking-wider truncate">
            {PRODUCT_LABEL[selected.productType]}
          </span>
        )}
      </div>

      {/* Selector de campaña */}
      {campaigns.length > 0 && (
        <div className="relative flex items-center">
          <select
            value={selectedCampaignId ?? ''}
            onChange={(e) => onSelectCampaign(e.target.value)}
            className="appearance-none bg-slate-900/60 border border-slate-700/50 rounded-lg pl-3 pr-8 py-1.5 text-xs text-slate-200 font-medium hover:border-slate-500 focus:outline-none focus:border-cyan-500/50 transition-colors max-w-[200px] md:max-w-[280px] truncate cursor-pointer"
          >
            {campaigns.map((c) => (
              <option key={c.id} value={c.id} className="bg-slate-900 text-slate-200">
                {c.name}
                {c.hasCompletedAnalysis ? '' : ' (sin análisis)'}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 pointer-events-none" />
        </div>
      )}
    </div>
  );
}
