'use client';

// src/app/dashboard/compliance/components/ComplianceOrchestrator.tsx
// Orquestador principal del dashboard /dashboard/compliance (Cinema Mode).
// Clon del patrón src/app/dashboard/evaluaciones/components/CinemaModeOrchestrator:
//   - h-screen flex-col overflow-hidden (la página no scrollea)
//   - Stage flex-1 con scroll interno
//   - AnimatePresence mode="wait" entre secciones
//   - Rail bottom drawer 50↔320px — sólo en estado 'closed'

import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useComplianceData } from '@/hooks/useComplianceData';
import ComplianceHeader from './ComplianceHeader';
import ComplianceStage from './ComplianceStage';
import ComplianceRail from './ComplianceRail';
import ComplianceSkeleton from './ComplianceSkeleton';
import ComplianceErrorState from './ComplianceErrorState';
import ComplianceEmptyState from './states/ComplianceEmptyState';
import ComplianceActiveState from './states/ComplianceActiveState';

interface ComplianceOrchestratorProps {
  initialCampaignId?: string;
}

const stageVariants = {
  initial: { opacity: 0, scale: 0.97, y: 12 },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 220, damping: 30 },
  },
  exit: {
    opacity: 0,
    scale: 0.97,
    y: -12,
    transition: { duration: 0.15 },
  },
};

export default function ComplianceOrchestrator({
  initialCampaignId,
}: ComplianceOrchestratorProps) {
  const hook = useComplianceData(initialCampaignId);
  const showRail = hook.pageState === 'closed';
  const pendingAlerts =
    hook.report?.data.alerts.filter(
      (a) => a.status !== 'resolved' && a.status !== 'dismissed'
    ).length ?? 0;

  return (
    <div className="h-screen w-full bg-[#0F172A] text-white flex flex-col font-sans overflow-hidden">
      {/* Glow sutil cyan arriba */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/10 via-transparent to-transparent pointer-events-none" />

      <ComplianceHeader
        campaigns={hook.campaigns}
        selectedId={hook.selectedCampaignId}
        onSelect={hook.selectCampaign}
        pageState={hook.pageState}
      />

      {/* Stage — scroll interno, la página nunca scrollea */}
      <div
        className={cn(
          'flex-1 relative overflow-y-auto overflow-x-hidden',
          'transition-all duration-500 ease-in-out',
          showRail ? (hook.isRailExpanded ? 'pb-[320px]' : 'pb-[70px]') : 'pb-4'
        )}
      >
        <div className="min-h-full flex items-start md:items-center justify-center p-4 md:p-8">
          <AnimatePresence mode="wait">
            {hook.pageState === 'loading' && (
              <motion.div
                key="loading"
                {...stageVariants}
                className="w-full max-w-2xl"
              >
                <ComplianceSkeleton />
              </motion.div>
            )}

            {hook.pageState === 'error' && (
              <motion.div
                key="error"
                {...stageVariants}
                className="w-full max-w-xl"
              >
                <ComplianceErrorState error={hook.error ?? 'Error desconocido'} />
              </motion.div>
            )}

            {hook.pageState === 'empty' && (
              <motion.div
                key="empty"
                {...stageVariants}
                className="w-full max-w-2xl"
              >
                <ComplianceEmptyState />
              </motion.div>
            )}

            {hook.pageState === 'active' && hook.activeCampaign && (
              <motion.div
                key="active"
                {...stageVariants}
                className="w-full max-w-2xl"
              >
                <ComplianceActiveState
                  participationRate={hook.activeParticipationRate ?? 0}
                  campaign={hook.activeCampaign}
                />
              </motion.div>
            )}

            {hook.pageState === 'closed' && (
              <motion.div
                key={`section-${hook.activeSection}`}
                {...stageVariants}
                className="w-full max-w-5xl"
              >
                <ComplianceStage hook={hook} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Backdrop blur cuando el Rail está expandido */}
      <AnimatePresence>
        {showRail && hook.isRailExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-30"
            onClick={hook.toggleRail}
          />
        )}
      </AnimatePresence>

      {/* Rail — sólo en estado closed */}
      {showRail && (
        <ComplianceRail
          activeSection={hook.activeSection}
          isExpanded={hook.isRailExpanded}
          onToggle={hook.toggleRail}
          onSelect={(id) => {
            hook.selectSection(id);
            if (hook.isRailExpanded) hook.toggleRail();
          }}
          alertasCount={pendingAlerts}
          planActionsCount={hook.planActions.length}
          orgISA={hook.report?.data.orgISA ?? null}
        />
      )}
    </div>
  );
}
