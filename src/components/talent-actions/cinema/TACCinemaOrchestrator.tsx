'use client'

// ════════════════════════════════════════════════════════════════════════════
// TAC CINEMA MODE - Orchestrator
// Clonado de src/app/dashboard/evaluaciones/components/CinemaModeOrchestrator.tsx
// LOBBY (gauge ICC) ↔ SPOTLIGHT (gerencia) + RAIL (colapsable 320px → 50px)
// ════════════════════════════════════════════════════════════════════════════

import { AnimatePresence, motion } from 'framer-motion'
import { RefreshCw, AlertTriangle, ClipboardList, ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTACCinemaMode } from '@/hooks/useTACCinemaMode'

import TACCinemaHeader from './TACCinemaHeader'
import TACMissionControl from './TACMissionControl'
import TACGerenciaCover from './TACGerenciaCover'
import TACSpotlightCard from './TACSpotlightCard'
import TACRail from './TACRail'

// ═══════════════════════════════════════════════════════════════════════
// SKELETON — copia exacta del evaluator
// ═══════════════════════════════════════════════════════════════════════

function TACCinemaSkeleton() {
  return (
    <div className="h-screen w-full bg-[#0F172A] flex flex-col items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-[200px] h-[200px] rounded-full bg-slate-800/50 animate-pulse" />
        <div className="w-48 h-4 bg-slate-800/50 rounded animate-pulse" />
        <div className="w-64 h-12 bg-slate-800/50 rounded-xl animate-pulse" />
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════
// ERROR — copia exacta del evaluator
// ═══════════════════════════════════════════════════════════════════════

function TACCinemaError({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="h-screen w-full bg-[#0F172A] flex items-center justify-center">
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
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════
// EMPTY STATE — adaptado a TAC
// ═══════════════════════════════════════════════════════════════════════

function TACEmptyState() {
  return (
    <div className="h-screen w-full bg-[#0F172A] flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md mx-auto p-8"
      >
        <div className="w-20 h-20 mx-auto mb-6 bg-slate-800 rounded-full flex items-center justify-center">
          <ClipboardList className="w-10 h-10 text-slate-600" />
        </div>
        <h2 className="text-xl font-bold text-white mb-3">
          Sin datos de talento
        </h2>
        <p className="text-slate-400 mb-6">
          No hay gerencias con matrices de talento calculadas. Completa un ciclo de evaluacion con calibracion para activar esta vista.
        </p>
      </motion.div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════
// MAIN ORCHESTRATOR — misma estructura que evaluator
// ═══════════════════════════════════════════════════════════════════════

export default function TACCinemaOrchestrator() {
  const {
    gerencias,
    selectedGerencia,
    nextGerencia,
    stats,
    selectedId,
    viewPhase,
    isRailExpanded,
    activePill,
    isLoading,
    error,
    handleSelect,
    handleEnterSpotlight,
    handleBack,
    handleToggleRail,
    setActivePill,
    handleOpenDetail,
    handleCloseDetail,
    reload
  } = useTACCinemaMode()

  const isLobby = selectedId === null
  const isCover = selectedId !== null && viewPhase === 'cover' && selectedGerencia !== null
  const isSpotlight = selectedId !== null && viewPhase === 'spotlight' && selectedGerencia !== null

  if (isLoading) return <TACCinemaSkeleton />
  if (error) return <TACCinemaError error={error} onRetry={reload} />
  if (gerencias.length === 0) return <TACEmptyState />

  return (
    <div className="fixed inset-0 z-50 bg-[#0F172A] text-white flex flex-col font-sans overflow-hidden">

      {/* Header — misma posicion que evaluator */}
      <TACCinemaHeader stats={stats} />

      {/* Stage */}
      <div className={cn(
        'flex-1 relative flex flex-col items-center justify-center p-4 md:p-8',
        'transition-all duration-500 ease-in-out',
        isRailExpanded ? 'mb-[320px]' : 'mb-[50px]'
      )}>
        <AnimatePresence mode="wait">

          {/* LOBBY → MissionControl */}
          {isLobby && (
            <TACMissionControl
              key="lobby"
              stats={stats}
              nextGerencia={nextGerencia}
              onStart={handleSelect}
            />
          )}

          {/* COVER → Narrativa 2 pasos (antes del spotlight) */}
          {isCover && selectedGerencia && (
            <motion.div
              key={`cover-${selectedId}`}
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              transition={{ type: 'spring', stiffness: 220, damping: 30 }}
              className="w-full max-w-3xl h-full"
            >
              <div className="bg-[#0F172A]/90 backdrop-blur-2xl border border-slate-800 rounded-[24px] shadow-2xl relative overflow-hidden h-full">
                {/* Tesla line */}
                <div
                  className="absolute top-0 left-0 right-0 h-[1px] z-20"
                  style={{
                    background: 'linear-gradient(90deg, transparent, #22D3EE, transparent)',
                    boxShadow: '0 0 15px #22D3EE'
                  }}
                />
                <TACGerenciaCover
                  gerencia={selectedGerencia.full}
                  onEnter={handleEnterSpotlight}
                />
              </div>
            </motion.div>
          )}

          {/* SPOTLIGHT → Detalle gerencia */}
          {isSpotlight && selectedGerencia && (
            <TACSpotlightCard
              key={`spotlight-${selectedId}`}
              gerencia={selectedGerencia}
              onBack={handleBack}
              onOpenDetail={handleOpenDetail}
            />
          )}

        </AnimatePresence>
      </div>

      {/* Backdrop blur when rail expanded — copia exacta z-30 */}
      <AnimatePresence>
        {isRailExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[55]"
            onClick={handleToggleRail}
          />
        )}
      </AnimatePresence>

      {/* Rail — z-40 */}
      <TACRail
        gerencias={gerencias}
        stats={stats}
        selectedId={selectedId}
        isExpanded={isRailExpanded}
        activePill={activePill}
        onToggle={handleToggleRail}
        onSelect={handleSelect}
        onPillChange={setActivePill}
        onOpenQuadrantDetail={handleOpenDetail}
      />
    </div>
  )
}
