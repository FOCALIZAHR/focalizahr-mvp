'use client';

// src/app/dashboard/compliance/components/ComplianceOrchestrator.tsx
// Clon literal del patrón src/app/dashboard/evaluaciones/components/CinemaModeOrchestrator.tsx
// (líneas 211-285). Cambia solo los datos, no la lógica.
//
// Routing dentro del estado 'closed':
//   activeSection === null → ComplianceMissionControl (lobby)
//   activeSection !== null → ComplianceStage + ComplianceRail

import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useComplianceData } from '@/hooks/useComplianceData';
import ComplianceStage from './ComplianceStage';
import ComplianceRail from './ComplianceRail';
import ComplianceMissionControl from './ComplianceMissionControl';
import ComplianceSkeleton from './ComplianceSkeleton';
import ComplianceErrorState from './ComplianceErrorState';
import ComplianceEmptyState from './states/ComplianceEmptyState';
import ComplianceActiveState from './states/ComplianceActiveState';

interface ComplianceOrchestratorProps {
  initialCampaignId?: string;
}

export default function ComplianceOrchestrator({
  initialCampaignId,
}: ComplianceOrchestratorProps) {
  const hook = useComplianceData(initialCampaignId);

  if (hook.pageState === 'loading') return <ComplianceSkeleton />;
  if (hook.pageState === 'error') {
    return <ComplianceErrorState error={hook.error ?? 'Error desconocido'} />;
  }
  if (hook.pageState === 'empty') return <ComplianceEmptyState />;
  if (hook.pageState === 'active' && hook.activeCampaign) {
    return (
      <ComplianceActiveState
        participationRate={hook.activeParticipationRate ?? 0}
        campaign={hook.activeCampaign}
      />
    );
  }

  const pendingAlerts =
    hook.report?.data.alerts.filter(
      (a) => a.status !== 'resolved' && a.status !== 'dismissed'
    ).length ?? 0;

  const isSpotlight = hook.activeSection !== null;

  // Lobby y SectionDimensiones se diseñaron single-viewport (Patrón G h fija) → centrar.
  // Resto de secciones crecen al contenido — sin scroll interno, sin altura
  // capeada. La página scrollea naturalmente (1 sola scrollbar nativa).
  const alignItems =
    !hook.activeSection || hook.activeSection === 'dimensiones'
      ? 'items-center'
      : 'items-start';

  return (
    <div className="min-h-screen w-full bg-[#0F172A] text-white flex flex-col font-sans">

      {/* Stage — el header global se eliminó; selector + PDFs viven en el Rail */}
      <div className={cn(
        'flex-1 relative flex justify-center p-4 md:p-8',
        alignItems,
        'transition-all duration-500 ease-in-out',
        isSpotlight
          ? (hook.isRailExpanded ? 'mb-[320px]' : 'mb-[50px]')
          : 'mb-0'
      )}>
        <AnimatePresence mode="wait">
          {!isSpotlight && hook.selectedCampaign && (
            <ComplianceMissionControl
              key="lobby"
              campaign={hook.selectedCampaign}
              planActions={hook.planActions}
              interventionPlan={hook.interventionPlan}
              pendingAlerts={pendingAlerts}
              onStart={hook.selectSection}
            />
          )}

          {isSpotlight && (
            <ComplianceStage
              key={`section-${hook.activeSection}`}
              hook={hook}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Backdrop blur when rail expanded */}
      <AnimatePresence>
        {isSpotlight && hook.isRailExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-30"
            onClick={hook.toggleRail}
          />
        )}
      </AnimatePresence>

      {/* Rail — solo visible cuando hay sección activa */}
      {isSpotlight && (
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
          campaigns={hook.campaigns}
          selectedCampaignId={hook.selectedCampaignId}
          onSelectCampaign={hook.selectCampaign}
          pageState={hook.pageState}
        />
      )}
    </div>
  );
}
