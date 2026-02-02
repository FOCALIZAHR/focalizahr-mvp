'use client'

// ════════════════════════════════════════════════════════════════════════════
// CINEMA MODE v5 - Orchestrator
// LOBBY (anillo) ↔ SPOTLIGHT (card grande) + RAIL (colapsable 320px → 50px)
// src/app/dashboard/evaluaciones/components/CinemaModeOrchestrator.tsx
// ════════════════════════════════════════════════════════════════════════════

import { AnimatePresence, motion } from 'framer-motion'
import { RefreshCw, AlertTriangle, ClipboardList, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useEvaluatorCinemaMode } from '@/hooks/useEvaluatorCinemaMode'

import CinemaHeader from '@/components/evaluator/cinema/CinemaHeader'
import MissionControl from '@/components/evaluator/cinema/MissionControl'
import SpotlightCard from '@/components/evaluator/cinema/SpotlightCard'
import VictoryScreen from '@/components/evaluator/cinema/VictoryScreen'
import Rail from '@/components/evaluator/cinema/Rail'

// ═══════════════════════════════════════════════════════════════════════
// SKELETON
// ═══════════════════════════════════════════════════════════════════════

function CinemaModeSkeleton() {
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
// ERROR
// ═══════════════════════════════════════════════════════════════════════

function CinemaModeError({ error, onRetry }: { error: string; onRetry: () => void }) {
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
// NO CYCLE
// ═══════════════════════════════════════════════════════════════════════

function NoCycleState() {
  return (
    <div className="h-screen w-full bg-[#0F172A] flex items-center justify-center">
      <div className="flex flex-col items-center text-center max-w-sm">
        <div className="w-16 h-16 rounded-full bg-slate-800/50 border border-slate-700/50 flex items-center justify-center mb-4">
          <ClipboardList className="w-8 h-8 text-slate-500" />
        </div>
        <h2 className="text-xl font-light text-slate-300 mb-2">
          Sin ciclo activo
        </h2>
        <p className="text-sm text-slate-500">
          No hay un ciclo de evaluacion activo en este momento.
        </p>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════
// EMPTY STATE (no assignments)
// ═══════════════════════════════════════════════════════════════════════

function EmptyState() {
  const router = useRouter()
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
          No tienes evaluaciones asignadas
        </h2>
        <p className="text-slate-400 mb-6">
          Actualmente no hay ciclos de evaluacion activos donde debas evaluar colaboradores.
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

export default function CinemaModeOrchestrator() {
  const {
    employees,
    selectedEmployee,
    nextEmployee,
    stats,
    cycle,
    selectedId,
    isRailExpanded,
    activeTab,
    isLoading,
    error,
    handleSelect,
    handleBack,
    handleEvaluate,
    handleViewSummary,
    handleToggleRail,
    setActiveTab,
    reload
  } = useEvaluatorCinemaMode()

  // Determine view
  const isVictory = stats.pending === 0 && stats.total > 0
  const isSpotlight = selectedId !== null && selectedEmployee !== null

  if (isLoading) return <CinemaModeSkeleton />
  if (error) return <CinemaModeError error={error} onRetry={reload} />
  if (!cycle) return <NoCycleState />
  if (employees.length === 0) return <EmptyState />

  return (
    <div className="h-screen w-full bg-[#0F172A] text-white flex flex-col font-sans overflow-hidden">

      {/* Header */}
      <CinemaHeader cycle={cycle} />

      {/* Stage */}
      <div className={cn(
        'flex-1 relative flex items-center justify-center p-4 md:p-8',
        'transition-all duration-500 ease-in-out',
        isRailExpanded ? 'mb-[320px]' : 'mb-[50px]'
      )}>
        <AnimatePresence mode="wait">

          {isVictory && (
            <VictoryScreen
              key="victory"
              total={stats.total}
              onViewTeam={handleToggleRail}
            />
          )}

          {!isVictory && !isSpotlight && (
            <MissionControl
              key="lobby"
              stats={stats}
              cycle={cycle}
              nextEmployee={nextEmployee}
              onStart={handleSelect}
            />
          )}

          {!isVictory && isSpotlight && (
            <SpotlightCard
              key={`spotlight-${selectedId}`}
              employee={selectedEmployee}
              onBack={handleBack}
              onEvaluate={handleEvaluate}
              onViewSummary={handleViewSummary}
            />
          )}

        </AnimatePresence>
      </div>

      {/* Backdrop blur when rail expanded - Point 3 */}
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

      {/* Rail */}
      <Rail
        employees={employees}
        selectedId={selectedId}
        isExpanded={isRailExpanded}
        activeTab={activeTab}
        onToggle={handleToggleRail}
        onSelect={handleSelect}
        onTabChange={setActiveTab}
      />
    </div>
  )
}
