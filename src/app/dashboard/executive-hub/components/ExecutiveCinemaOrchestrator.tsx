'use client'

// ════════════════════════════════════════════════════════════════════════════
// EXECUTIVE CINEMA MODE - Orchestrator
// Patrón clonado de evaluator/cinema/CinemaModeOrchestrator.tsx
// LOBBY (gauge + narrative) ↔ SPOTLIGHT (insight detail) + RAIL (fixed bottom)
// src/app/dashboard/executive-hub/components/ExecutiveCinemaOrchestrator.tsx
// ════════════════════════════════════════════════════════════════════════════

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { RefreshCw, AlertTriangle, BarChart3, ArrowLeft, ShieldCheck } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useExecutiveHubData } from '@/hooks/useExecutiveHubData'
import ExecutiveMissionControl from './ExecutiveMissionControl'
import { InsightsRail } from './InsightsRail'
import { InsightSpotlightCard } from './InsightSpotlightCard'

// ═══════════════════════════════════════════════════════════════════════
// SKELETON
// ═══════════════════════════════════════════════════════════════════════

function Skeleton() {
  return (
    <div className="h-screen w-full bg-[#0A0F1A] flex flex-col items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-[220px] h-[220px] rounded-full bg-slate-800/50 animate-pulse" />
        <div className="w-56 h-5 bg-slate-800/50 rounded animate-pulse" />
        <div className="w-72 h-4 bg-slate-800/30 rounded animate-pulse" />
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════
// ERROR
// ═══════════════════════════════════════════════════════════════════════

function ErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="h-screen w-full bg-[#0A0F1A] flex items-center justify-center">
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
// EMPTY STATE
// ═══════════════════════════════════════════════════════════════════════

function EmptyState() {
  const router = useRouter()
  return (
    <div className="h-screen w-full bg-[#0A0F1A] flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md mx-auto p-8"
      >
        <div className="w-20 h-20 mx-auto mb-6 bg-slate-800 rounded-full flex items-center justify-center">
          <BarChart3 className="w-10 h-10 text-slate-600" />
        </div>
        <h2 className="text-xl font-bold text-white mb-3">
          Sin ciclos de evaluacion
        </h2>
        <p className="text-slate-400 mb-6">
          Crea un ciclo de evaluacion para acceder al Executive Hub.
        </p>
        <button
          onClick={() => router.push('/dashboard')}
          className="text-cyan-400 hover:text-cyan-300 flex items-center gap-2 mx-auto transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al Dashboard
        </button>
      </motion.div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════
// MAIN ORCHESTRATOR
// ═══════════════════════════════════════════════════════════════════════

export default function ExecutiveCinemaOrchestrator() {
  const {
    summary,
    spotlightData,
    activeInsight,
    cycleId,
    cycleName,
    cycles,
    userRole,
    drillGerencia,
    isLoading,
    isSpotlightLoading,
    error,
    selectInsight,
    closeSpotlight,
    selectGerencia,
    clearGerencia,
    reload
  } = useExecutiveHubData()

  const [isRailExpanded, setIsRailExpanded] = useState(false)

  const isSpotlight = activeInsight !== null

  if (isLoading) return <Skeleton />
  if (error) return <ErrorState error={error} onRetry={reload} />
  if (cycles.length === 0) return <EmptyState />
  if (!summary) return <Skeleton />

  const handleToggleRail = () => setIsRailExpanded(prev => !prev)

  const handleCTA = (destination: string) => {
    const destMap: Record<string, typeof activeInsight> = {
      alertas: 'alertas',
      talento: 'talento',
      calibracion: 'calibracion',
      capacidades: 'capacidades',
      sucesion: 'sucesion'
    }
    const target = destMap[destination]
    if (target) selectInsight(target)
  }

  const handleSelectInsight = (type: typeof activeInsight) => {
    if (type) {
      selectInsight(type)
      setIsRailExpanded(false)
    }
  }

  return (
    <div className="min-h-screen w-full bg-[#0A0F1A] text-white flex flex-col font-sans">

      {/* Stage — dynamic margin-bottom based on rail state */}
      <div className={cn(
        'flex-1 relative flex items-center justify-center p-4 md:p-8',
        'transition-all duration-500 ease-in-out',
        isRailExpanded ? 'mb-[240px]' : 'mb-[50px]'
      )}>
        {/* Data Confidence Indicator — top right */}
        <DataConfidenceIndicator confidence={summary.calibracion.confidence} />

        {/* Gerencia Drill-down Header */}
        {drillGerencia && (
          <div className="absolute top-4 left-4 z-20">
            <button
              onClick={clearGerencia}
              className="flex items-center gap-2 bg-cyan-500/10 backdrop-blur-sm px-4 py-2 rounded-lg border border-cyan-500/20 hover:border-cyan-500/40 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-xs text-cyan-400 font-bold uppercase tracking-wider">
                Gerencia: {drillGerencia}
              </span>
              <span className="text-[10px] text-slate-500 ml-1">← Volver a Vista Global</span>
            </button>
          </div>
        )}

        <AnimatePresence mode="wait">

          {!isSpotlight && (
            <ExecutiveMissionControl
              key="lobby"
              roleFitScore={summary.capacidades.roleFit}
              headline={summary.mission.headline}
              subheadline={summary.mission.subheadline}
              severity={summary.mission.severity}
              ctaLabel={summary.mission.cta.label}
              ctaDestination={summary.mission.cta.destination}
              cycleName={cycleName || 'Ciclo Activo'}
              onCTA={handleCTA}
            />
          )}

          {isSpotlight && activeInsight && (
            <InsightSpotlightCard
              key={`spotlight-${activeInsight}`}
              type={activeInsight}
              summary={summary}
              spotlightData={spotlightData}
              isLoading={isSpotlightLoading}
              cycleId={cycleId}
              userRole={userRole}
              onBack={closeSpotlight}
              onSelectGerencia={selectGerencia}
            />
          )}

        </AnimatePresence>
      </div>

      {/* Backdrop blur when rail expanded */}
      <AnimatePresence>
        {isRailExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-30"
            onClick={handleToggleRail}
          />
        )}
      </AnimatePresence>

      {/* Rail — fixed bottom, collapsible */}
      <InsightsRail
        summary={summary}
        activeInsight={activeInsight}
        isExpanded={isRailExpanded}
        onToggle={handleToggleRail}
        onSelect={handleSelectInsight}
      />
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════
// DATA CONFIDENCE INDICATOR
// ═══════════════════════════════════════════════════════════════════════

function DataConfidenceIndicator({ confidence }: { confidence: number }) {
  const color = confidence >= 80
    ? 'bg-emerald-500'
    : confidence >= 50
    ? 'bg-amber-500'
    : 'bg-red-500'

  const textColor = confidence >= 80
    ? 'text-emerald-400'
    : confidence >= 50
    ? 'text-amber-400'
    : 'text-red-400'

  return (
    <div className="absolute top-4 right-4 z-20 flex items-center gap-2 bg-black/30 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-white/5">
      <ShieldCheck className={cn('w-3.5 h-3.5', textColor)} />
      <div className={cn('w-2 h-2 rounded-full', color)} />
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
        Confianza: <span className={textColor}>{confidence}%</span>
      </span>
    </div>
  )
}
