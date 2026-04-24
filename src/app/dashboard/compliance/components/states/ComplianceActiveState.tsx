'use client';

// src/app/dashboard/compliance/components/states/ComplianceActiveState.tsx
// Estado 1 — campaña en curso. Gauge participación + ranking depto.
// Contenido real (DepartmentParticipationRanking + SecondaryButton) entra en Sesión 5.

import type { ComplianceCampaignSummary } from '@/types/compliance';

interface ComplianceActiveStateProps {
  participationRate: number;
  campaign: ComplianceCampaignSummary;
}

export default function ComplianceActiveState({
  participationRate,
  campaign,
}: ComplianceActiveStateProps) {
  return (
    <div className="relative overflow-hidden bg-[#0F172A]/90 backdrop-blur-2xl border border-slate-800 rounded-[20px] p-10 w-full text-center">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-4">
        Campaña en curso
      </p>
      <h2 className="text-2xl font-light text-white mb-2">{campaign.name}</h2>
      <div className="flex items-end justify-center gap-2 mt-8">
        <span className="text-[96px] font-extralight text-white tabular-nums leading-none">
          {participationRate}
        </span>
        <span className="text-2xl font-light text-slate-500 pb-3">%</span>
      </div>
      <p className="text-sm text-slate-400 font-light mt-2">Participación</p>
      <p className="text-[11px] text-slate-600 font-light mt-8 italic">
        Ranking departamental — próxima entrega.
      </p>
    </div>
  );
}
