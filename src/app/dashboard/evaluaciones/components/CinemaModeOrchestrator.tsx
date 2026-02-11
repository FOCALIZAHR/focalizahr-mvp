'use client'

// ════════════════════════════════════════════════════════════════════════════
// CINEMA MODE v5 - Orchestrator
// LOBBY (anillo) ↔ SPOTLIGHT (card grande) + RAIL (colapsable 320px → 50px)
// src/app/dashboard/evaluaciones/components/CinemaModeOrchestrator.tsx
// ════════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { RefreshCw, AlertTriangle, ClipboardList, ArrowLeft, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useEvaluatorCinemaMode } from '@/hooks/useEvaluatorCinemaMode'
import { AAEPotentialRenderer } from '@/components/potential'
import type { PotentialFactors } from '@/types/potential'
import type { SelectedEmployee } from '@/types/evaluator-cinema'

import CinemaHeader from '@/components/evaluator/cinema/CinemaHeader'
import MissionControl from '@/components/evaluator/cinema/MissionControl'
import SpotlightCard from '@/components/evaluator/cinema/SpotlightCard'
import VictoryOverlay from '@/components/evaluator/cinema/VictoryOverlay'
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
    evaluatorName,
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

  // AAE Potential Modal state
  const [potentialTarget, setPotentialTarget] = useState<SelectedEmployee | null>(null)

  // Victory Overlay state
  const [showVictoryOverlay, setShowVictoryOverlay] = useState(false)

  // Detect victory: all desempeño + all potential complete
  useEffect(() => {
    if (!employees.length || !cycle?.id) return

    const allDesempenoComplete = employees.every(e => e.status === 'completed')
    const allPotentialComplete = employees.every(e => e.potentialScore !== null)

    if (allDesempenoComplete && allPotentialComplete) {
      const victoryKey = `victory-shown-${cycle.id}`
      if (!sessionStorage.getItem(victoryKey)) {
        setShowVictoryOverlay(true)
        sessionStorage.setItem(victoryKey, 'true')
      }
    }
  }, [employees, cycle?.id])

  const handleCloseVictory = useCallback(() => {
    setShowVictoryOverlay(false)
  }, [])

  const handleEvaluatePotential = useCallback(() => {
    if (selectedEmployee) {
      setPotentialTarget(selectedEmployee)
    }
  }, [selectedEmployee])

  const handlePotentialSave = useCallback(async (factors: PotentialFactors, notes: string) => {
    if (!potentialTarget) {
      throw new Error('No se encontró el colaborador seleccionado.')
    }

    const token = localStorage.getItem('focalizahr_token')
    const res = await fetch('/api/evaluator/potential', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({
        cycleId: potentialTarget.cycleId,
        employeeId: potentialTarget.id,
        aspiration: factors.aspiration,
        ability: factors.ability,
        engagement: factors.engagement,
        notes: notes || undefined
      })
    })

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}))
      throw new Error(errorData.error || `Error ${res.status} guardando potencial`)
    }

    setPotentialTarget(null)
    await reload()
  }, [potentialTarget, reload])

  const isSpotlight = selectedId !== null && selectedEmployee !== null

  if (isLoading) return <CinemaModeSkeleton />
  if (error) return <CinemaModeError error={error} onRetry={reload} />
  if (!cycle) return <NoCycleState />
  if (employees.length === 0) return <EmptyState />

  return (
    <div className="h-screen w-full bg-[#0F172A] text-white flex flex-col font-sans overflow-hidden">

      {/* Victory Overlay - z-[100] sobre todo */}
      {showVictoryOverlay && (
        <VictoryOverlay
          onClose={handleCloseVictory}
          evaluatorName={evaluatorName || undefined}
        />
      )}

      {/* Header */}
      <CinemaHeader cycle={cycle} cycleId={cycle?.id} />

      {/* Stage */}
      <div className={cn(
        'flex-1 relative flex items-center justify-center p-4 md:p-8',
        'transition-all duration-500 ease-in-out',
        isRailExpanded ? 'mb-[320px]' : 'mb-[50px]'
      )}>
        <AnimatePresence mode="wait">

          {!isSpotlight && (
            <MissionControl
              key="lobby"
              stats={stats}
              cycle={cycle}
              nextEmployee={nextEmployee}
              onStart={handleSelect}
            />
          )}

          {isSpotlight && (
            <SpotlightCard
              key={`spotlight-${selectedId}`}
              employee={selectedEmployee}
              onBack={handleBack}
              onEvaluate={handleEvaluate}
              onViewSummary={handleViewSummary}
              onEvaluatePotential={handleEvaluatePotential}
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

      {/* AAE POTENTIAL MODAL */}
      <AnimatePresence>
        {potentialTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setPotentialTarget(null)}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className={cn(
                "relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto",
                "bg-slate-900/95 backdrop-blur-xl border border-slate-700/50",
                "rounded-2xl p-6 shadow-2xl"
              )}
            >
              {/* Tesla line */}
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-purple-400 to-transparent rounded-t-2xl" />

              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-white">
                    {potentialTarget.displayNameFull}
                  </h2>
                  <p className="text-sm text-slate-400">
                    {potentialTarget.position}
                    {' · Score: '}
                    {(potentialTarget.avgScore ?? 0).toFixed(1)}
                  </p>
                </div>
                <button
                  onClick={() => setPotentialTarget(null)}
                  className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* AAE Renderer */}
              {/* avgScore es 0-100, performanceScore necesita 1-5 para 9-box */}
              <AAEPotentialRenderer
                ratingId={potentialTarget.ratingId || ''}
                employeeName={potentialTarget.displayNameFull}
                performanceScore={potentialTarget.avgScore ? (potentialTarget.avgScore / 100) * 5 : 0}
                existingNotes={''}
                onSave={handlePotentialSave}
                onCancel={() => setPotentialTarget(null)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
