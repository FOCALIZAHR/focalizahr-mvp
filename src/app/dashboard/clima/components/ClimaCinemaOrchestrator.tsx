'use client';

// src/app/dashboard/clima/components/ClimaCinemaOrchestrator.tsx
// Orquestador del Cinema Mode de Clima. Clon estructural de
// evaluaciones/CinemaModeOrchestrator (bg #0F172A, header, stage con
// AnimatePresence, Rail fixed-bottom + backdrop, guards).
//
// Máquina de estados (entity-centric, departamentos):
//   selectedDepartmentId → DepartmentSpotlightCard
//   activeChapter        → Capítulo de compañía (contenido = Fase 3)
//   ninguno              → Lobby (MissionControl)
// El Rail de departamentos va SIEMPRE fijo abajo (incluido el Lobby).

import { AnimatePresence, motion } from 'framer-motion';
import { RefreshCw, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useClimaCinemaMode } from '@/hooks/useClimaCinemaMode';
import { FHREmptyState } from '@/components/ui/FHREmptyState';
import ClimaHeader from './ClimaHeader';
import ClimaMissionControl from './ClimaMissionControl';
import ClimaToolbar from '@/components/clima/ClimaToolbar';
import ClimaRail from './ClimaRail';
import ClimaSubproductoScaffold from './ClimaSubproductoScaffold';
import ClimaDimensionesView from './ClimaDimensionesView';
import DepartmentSpotlightCard from './DepartmentSpotlightCard';
import ClimaChapterView from './ClimaChapterView';
import ClimaIntroSequence from './cascada/ClimaIntroSequence';

interface ClimaCinemaOrchestratorProps {
  initialCampaignId?: string;
}

function ClimaSkeleton() {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="w-[200px] h-[200px] rounded-full bg-slate-800/50 animate-pulse" />
      <div className="w-48 h-4 bg-slate-800/50 rounded animate-pulse" />
      <div className="w-64 h-12 bg-slate-800/50 rounded-xl animate-pulse" />
    </div>
  );
}

function ClimaError({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 max-w-sm text-center">
      <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto mb-4" />
      <h2 className="text-lg font-medium text-slate-200 mb-2">Error al cargar</h2>
      <p className="text-sm text-slate-400 mb-6">{error}</p>
      <button
        onClick={onRetry}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-700 text-slate-300 hover:text-white hover:border-slate-500 transition-all text-sm"
      >
        <RefreshCw className="w-4 h-4" />
        Reintentar
      </button>
    </div>
  );
}

export default function ClimaCinemaOrchestrator({
  initialCampaignId,
}: ClimaCinemaOrchestratorProps) {
  const hook = useClimaCinemaMode(initialCampaignId);
  const hasCampaigns = hook.campaigns.length > 0;
  const isReady = hook.pageState === 'ready' && !!hook.results;

  const selectedDepartment =
    hook.results?.departments.find((d) => d.departmentId === hook.selectedDepartmentId) ?? null;
  const isSpotlight = !!selectedDepartment;
  const isChapter = !isSpotlight && hook.activeChapter !== null;
  const selectedCampaign = hook.campaigns.find((c) => c.id === hook.selectedCampaignId) ?? null;

  // Cascada Ejecutiva (Gate 4.5a): precede al Lobby hasta que el CEO la
  // termina/salta. El Lobby y el Rail solo aparecen tras descartarla.
  const showIntro = isReady && !isSpotlight && !isChapter && !hook.introDismissed;
  // Tras descartar la intro: subproducto abierto (v3 §3A) o Lobby limpio.
  const activeSubproducto = hook.activeSubproducto;
  const baseAfterIntro = isReady && !isSpotlight && !isChapter && hook.introDismissed;
  const showSubproducto = baseAfterIntro && activeSubproducto !== null;
  const showLobby = baseAfterIntro && activeSubproducto === null;

  return (
    <div className="h-screen w-full bg-[#0F172A] text-white flex flex-col font-sans overflow-hidden">
      {hasCampaigns && <ClimaHeader productType={selectedCampaign?.productType ?? null} />}

      {/* Stage — spotlight/capítulo crecen al contenido (items-start) para no
          cortar secciones largas; el Lobby se centra. */}
      <div
        className={cn(
          'flex-1 relative flex justify-center p-4 md:p-8 overflow-y-auto',
          isSpotlight || isChapter || showIntro || showSubproducto ? 'items-start' : 'items-center',
          'transition-all duration-500 ease-in-out',
          showLobby || showSubproducto || isSpotlight || isChapter
            ? hook.isRailExpanded
              ? 'mb-[320px]'
              : 'mb-[50px]'
            : 'mb-0'
        )}
      >
        <AnimatePresence mode="wait">
          {hook.pageState === 'loading' && <ClimaSkeleton key="loading" />}

          {hook.pageState === 'error' && (
            <ClimaError key="error" error={hook.error ?? 'Error desconocido'} onRetry={hook.reload} />
          )}

          {hook.pageState === 'empty' && !hasCampaigns && (
            <FHREmptyState
              key="empty-none"
              type="pending"
              title="Sin mediciones de clima aún"
              description="Los resultados de clima aparecen al cerrar la primera campaña de Pulso Express o Experiencia Full."
              cta={{ label: 'Crear campaña', href: '/dashboard/campaigns/new' }}
            />
          )}

          {hook.pageState === 'empty' && hasCampaigns && (
            <FHREmptyState
              key="empty-analysis"
              type="pending"
              title="Análisis en preparación"
              description="Esta campaña todavía no tiene resultados de clima procesados. Elige otra campaña en el selector del Rail (abajo)."
            />
          )}

          {isReady && isSpotlight && (
            <DepartmentSpotlightCard
              key={`spotlight-${selectedDepartment!.departmentId}`}
              department={selectedDepartment!}
              onBack={hook.exitToLobby}
            />
          )}

          {isReady && isChapter && (
            <ClimaChapterView
              key={`chapter-${hook.activeChapter}`}
              chapter={hook.activeChapter!}
              departments={hook.results!.departments}
              businessCaseTotals={hook.results!.businessCaseTotals}
              onBack={hook.exitToLobby}
              onSelectDepartment={hook.selectDepartment}
            />
          )}

          {showIntro && (
            <ClimaIntroSequence
              key="intro"
              results={hook.results!}
              onDone={hook.dismissIntro}
            />
          )}

          {showLobby && (
            <ClimaMissionControl
              key="lobby"
              scope={hook.scope}
              orgFavorability={hook.orgFavorability}
              orgRiskZone={hook.orgRiskZone}
              orgMomentum={hook.orgMomentum}
              stats={hook.stats}
              nextDepartment={hook.nextDepartment}
              onSelectDepartment={hook.selectDepartment}
            />
          )}

          {/* Vista de subproducto abierta desde el Rail (v3 §3A). Dimensiones (C)
              ya tiene vista real; Análisis (D) y Ranking (E) usan el andamio. */}
          {showSubproducto && activeSubproducto === 'dimensiones' && hook.results && (
            <ClimaDimensionesView
              key="subproducto-dimensiones"
              dimensions={hook.dimensions}
              gerencias={hook.results.gerencias}
              initialDriver={hook.dimensionesInitialDriver}
              onBack={hook.exitSubproducto}
            />
          )}

          {showSubproducto && activeSubproducto && activeSubproducto !== 'dimensiones' && (
            <ClimaSubproductoScaffold
              key={`subproducto-${activeSubproducto}`}
              subproducto={activeSubproducto}
              onBack={hook.exitSubproducto}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Backdrop al expandir el Rail */}
      <AnimatePresence>
        {isReady && hook.isRailExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-30"
            onClick={hook.toggleRail}
          />
        )}
      </AnimatePresence>

      {/* Rail de subproductos (v3 §3A) — fijo abajo tras descartar la Cascada. */}
      {isReady && hook.results && hook.introDismissed && (
        <ClimaRail
          activeSubproducto={hook.activeSubproducto}
          isExpanded={hook.isRailExpanded}
          onToggle={hook.toggleRail}
          onSelectSubproducto={hook.selectSubproducto}
          campaigns={hook.campaigns}
          selectedCampaignId={hook.selectedCampaignId}
          onSelectCampaign={hook.selectCampaign}
        />
      )}

      {/* ClimaToolbar — barra flotante de las 8 dimensiones, SOLO en el Lobby.
          Anexo a demanda (§8.2); fijo right-center, se auto-oculta en mobile. */}
      {showLobby && hook.results && (
        <ClimaToolbar dimensions={hook.dimensions} onOpenDimension={hook.openDimensionesAt} />
      )}
    </div>
  );
}
