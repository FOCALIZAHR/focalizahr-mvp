'use client';

// src/app/dashboard/compliance/components/ComplianceMissionControl.tsx
// Lobby del Cinema Mode Compliance. Clon literal del patrón de
// src/components/evaluator/cinema/MissionControl.tsx: phase indicator opcional +
// título + meta + contenedor responsive (gauge centrado, CTA a la derecha desktop,
// debajo en mobile).

import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import SegmentedRing from '@/components/evaluator/cinema/SegmentedRing';
import { COMPLIANCE_SECTIONS } from '@/app/dashboard/compliance/lib/labels';
import type {
  ComplianceCampaignSummary,
  ComplianceSectionId,
  InterventionPlan,
  CompliancePlanAction,
} from '@/types/compliance';

interface ComplianceMissionControlProps {
  campaign: ComplianceCampaignSummary;
  planActions: CompliancePlanAction[];
  interventionPlan: InterventionPlan;
  pendingAlerts: number;
  onStart: (id: ComplianceSectionId) => void;
}

export default function ComplianceMissionControl({
  campaign,
  planActions,
  interventionPlan,
  pendingAlerts,
  onStart,
}: ComplianceMissionControlProps) {
  // Phase 2: hay alertas activas (sección legal requiere atención)
  const isPhase2 = pendingAlerts > 0;

  // Ring: acciones registradas vs intervenciones recomendadas
  const ringTotal = Math.max(1, interventionPlan.totalTriggers);
  const ringCompleted = Math.min(planActions.length, ringTotal);

  const nextSection = COMPLIANCE_SECTIONS[0]; // 'sintesis'

  const daysRemaining = (() => {
    if (!campaign.completedAt) return null;
    const closed = new Date(campaign.completedAt);
    if (isNaN(closed.getTime())) return null;
    const diffMs = Date.now() - closed.getTime();
    return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  })();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 220, damping: 30 }}
      className="flex flex-col items-center gap-6 w-full max-w-4xl px-4"
    >
      {/* Campaign name + Phase indicator */}
      <div className="text-center">
        {isPhase2 && (
          <p className="text-[10px] text-amber-400 font-bold uppercase tracking-[0.2em] mb-2">
            Atencion · {pendingAlerts} alerta{pendingAlerts !== 1 ? 's' : ''} activa{pendingAlerts !== 1 ? 's' : ''}
          </p>
        )}
        <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight mb-1">
          {campaign.name}
        </h1>
        <p className="text-xs text-slate-500 font-mono uppercase tracking-wider">
          {daysRemaining !== null
            ? `Cerrado hace ${daysRemaining} dia${daysRemaining !== 1 ? 's' : ''}`
            : 'Ciclo cerrado'}
        </p>
      </div>

      {/* CONTENEDOR PRINCIPAL - Responsive */}
      <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-10 w-full">

        {/* GAUGE - Siempre centrado */}
        <SegmentedRing total={ringTotal} completed={ringCompleted} />

        {/* CTA - Solo visible en DESKTOP (derecha) */}
        <div className="hidden md:block">
          <CTAButton
            nextSection={nextSection}
            isPhase2={isPhase2}
            onStart={onStart}
          />
        </div>
      </div>

      {/* Phase 2 info */}
      {isPhase2 && (
        <p className="text-sm text-slate-400 text-center max-w-xs">
          Hay {pendingAlerts} alerta{pendingAlerts !== 1 ? 's' : ''} por gestionar antes del cierre del ciclo.
        </p>
      )}

      {/* CTA - Solo visible en MOBILE (abajo) */}
      <div className="md:hidden">
        <CTAButton
          nextSection={nextSection}
          isPhase2={isPhase2}
          onStart={onStart}
        />
      </div>
    </motion.div>
  );
}

// Extraer CTA como componente interno para no duplicar codigo
function CTAButton({
  nextSection,
  isPhase2,
  onStart,
}: {
  nextSection: (typeof COMPLIANCE_SECTIONS)[number];
  isPhase2: boolean;
  onStart: (id: ComplianceSectionId) => void;
}) {
  return (
    <motion.button
      onClick={() => onStart(nextSection.id)}
      className={cn(
        'group relative flex items-center rounded-xl transition-all transform hover:-translate-y-0.5',
        'gap-4 pl-5 pr-2 py-2',
        isPhase2
          ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-[0_8px_24px_-6px_rgba(245,158,11,0.35)]'
          : 'bg-gradient-to-r from-cyan-400 to-cyan-500 hover:from-cyan-300 hover:to-cyan-400 text-slate-950 shadow-[0_8px_24px_-6px_rgba(34,211,238,0.35)]'
      )}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="text-left">
        <span
          className={cn(
            'block text-[9px] uppercase tracking-wider font-semibold opacity-70',
            'text-slate-700'
          )}
        >
          {isPhase2 ? 'Ir a alertas' : 'Empezar'}
        </span>
        <span className="block text-sm font-bold leading-tight">
          {nextSection.railLabel}
        </span>
      </div>
      <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-slate-950/10">
        <ArrowRight className="w-4 h-4" />
      </div>
    </motion.button>
  );
}
