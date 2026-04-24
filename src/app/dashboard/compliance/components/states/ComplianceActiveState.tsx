'use client';

// src/app/dashboard/compliance/components/states/ComplianceActiveState.tsx
// Estado 1 — campaña en curso (Ambiente Sano abierta). Sin Rail.
// Hero gauge de participación + ranking por depto + CTA a Torre de Control.

import { useRouter } from 'next/navigation';
import { ExternalLink } from 'lucide-react';
import { SecondaryButton } from '@/components/ui/PremiumButton';
import DepartmentParticipationRanking from '../DepartmentParticipationRanking';
import type { ComplianceCampaignSummary } from '@/types/compliance';

interface ComplianceActiveStateProps {
  participationRate: number;
  campaign: ComplianceCampaignSummary;
}

export default function ComplianceActiveState({
  participationRate,
  campaign,
}: ComplianceActiveStateProps) {
  const router = useRouter();
  const totalInvited = campaign.totalInvited ?? 0;
  const totalResponded = campaign.totalResponded ?? 0;

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Hero — participación */}
      <div className="relative overflow-hidden p-8 text-center bg-[#0F172A]/90 backdrop-blur-2xl border border-slate-800 rounded-[20px]">
        <div
          className="absolute top-0 left-0 right-0 h-[2px] pointer-events-none"
          style={{
            background:
              'linear-gradient(90deg, transparent, #22D3EE, #A78BFA, transparent)',
            opacity: 0.7,
          }}
        />
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-4">
          Campaña en curso · {campaign.name}
        </p>
        <div className="flex items-end justify-center gap-2 leading-none mt-2">
          <span className="text-[72px] md:text-[96px] font-extralight text-white tabular-nums leading-[0.9]">
            {participationRate}
          </span>
          <span className="text-3xl md:text-4xl font-light text-slate-500 pb-2">
            %
          </span>
        </div>
        <p className="text-slate-500 text-sm uppercase tracking-widest mt-2">
          Participación
        </p>
        <p className="text-slate-400 text-sm font-light mt-2">
          {totalResponded} de {totalInvited} personas respondieron
        </p>
      </div>

      {/* Ranking por depto */}
      <DepartmentParticipationRanking campaignId={campaign.id} />

      {/* CTA Torre de Control */}
      <div className="flex justify-center">
        <SecondaryButton
          icon={ExternalLink}
          onClick={() => router.push(`/dashboard/campaigns/${campaign.id}/monitor`)}
        >
          Ver ranking completo en Torre de Control
        </SecondaryButton>
      </div>
    </div>
  );
}
