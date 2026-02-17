'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import PDIWizardCard from './PDIWizardCard'
import PDIManualGoalCard from './PDIManualGoalCard'
import PDISummaryCard from './PDISummaryCard'
import PDINoGapsCard from './PDINoGapsCard'
import type { WizardGap, WizardSuggestion, EditedGoal } from './PDIWizardCard'

// ════════════════════════════════════════════════════════════════════════════
// TIPOS
// ════════════════════════════════════════════════════════════════════════════

interface RoleFitResult {
  roleFitScore: number
  gaps: Array<{
    competencyCode: string
    competencyName: string
    actualScore: number
    targetScore: number
    rawGap: number
    status: 'CRITICAL' | 'IMPROVE' | 'MATCH' | 'EXCEEDS'
  }>
  summary: {
    totalCompetencies: number
    matching: number
    exceeds: number
    needsImprovement: number
    critical: number
  }
}

interface EnrichedSuggestion {
  competencyCode: string
  coachingTip: string
  estimatedWeeks: number
  action: string
}

interface PDIWizardOrchestratorProps {
  employeeId: string
  cycleId: string
  employeeName: string
  onComplete?: (pdiId: string) => void
}

type WizardPhase = 'loading' | 'gaps' | 'manual' | 'summary' | 'no-gaps'

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE
// ════════════════════════════════════════════════════════════════════════════

export default function PDIWizardOrchestrator({
  employeeId,
  cycleId,
  employeeName,
  onComplete
}: PDIWizardOrchestratorProps) {
  // State
  const [phase, setPhase] = useState<WizardPhase>('loading')
  const [currentGapIndex, setCurrentGapIndex] = useState(0)
  const [direction, setDirection] = useState(1)
  const [gaps, setGaps] = useState<WizardGap[]>([])
  const [suggestions, setSuggestions] = useState<WizardSuggestion[]>([])
  const [editedGoals, setEditedGoals] = useState<EditedGoal[]>([])
  const [manualGoals, setManualGoals] = useState<Array<{ title: string; targetOutcome: string }>>([])
  const [roleFit, setRoleFit] = useState<RoleFitResult | null>(null)
  const [overallScore, setOverallScore] = useState<number | null>(null)
  const [pdiId, setPdiId] = useState<string | null>(null)
  const [pdiGoals, setPdiGoals] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const [isSaving, setIsSaving] = useState(false)

  // Guard against double-fire
  const generatingRef = useRef(false)

  // Elapsed timer during loading
  useEffect(() => {
    if (phase !== 'loading') return
    const interval = setInterval(() => setElapsed(prev => prev + 1), 1000)
    return () => clearInterval(interval)
  }, [phase])

  // ═══════════════════════════════════════════════════════════════════════════
  // Cargar datos al montar
  // ═══════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (generatingRef.current) return
    generatingRef.current = true

    async function loadPDIData() {
      try {
        setError(null)
        const res = await fetch('/api/pdi/generate-suggestion', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ employeeId, cycleId })
        })
        const data = await res.json()

        if (!data.success) {
          if (res.status === 409 && data.existingId) {
            onComplete?.(data.existingId)
            return
          }
          setError(data.error || 'Error generando sugerencias')
          return
        }

        // Guardar PDI id y goals crudos para PATCH posterior
        setPdiId(data.data.id)
        setPdiGoals(data.data.goals || [])

        // Extraer meta
        const meta = data.meta || {}
        const roleFitData = meta.roleFit as RoleFitResult | null
        const enriched = (meta.enrichedSuggestions || []) as EnrichedSuggestion[]

        setRoleFit(roleFitData)

        // Calcular overallScore del PDI (promedio de los goals si existe)
        if (data.data.employee?.overallScore) {
          setOverallScore(data.data.employee.overallScore)
        }

        // Construir gaps y suggestions desde roleFit
        if (roleFitData && roleFitData.gaps.length > 0) {
          // Filtrar solo gaps que necesitan desarrollo (CRITICAL o IMPROVE)
          const devGaps = roleFitData.gaps.filter(
            g => g.status === 'CRITICAL' || g.status === 'IMPROVE'
          )

          if (devGaps.length === 0) {
            setPhase('no-gaps')
            return
          }

          const wizardGaps: WizardGap[] = devGaps.map(g => ({
            competencyCode: g.competencyCode,
            competencyName: g.competencyName,
            actualScore: g.actualScore,
            targetScore: g.targetScore,
            rawGap: g.rawGap,
            status: g.status
          }))

          // Mapear suggestions desde los goals del PDI + enriched data
          const wizardSuggestions: WizardSuggestion[] = devGaps.map(g => {
            const pdiGoal = (data.data.goals || []).find(
              (goal: any) => goal.competencyCode === g.competencyCode
            )
            const enrichedData = enriched.find(
              e => e.competencyCode === g.competencyCode
            )

            return {
              title: pdiGoal?.title || `Desarrollar ${g.competencyName}`,
              description: pdiGoal?.description || '',
              targetOutcome: pdiGoal?.targetOutcome || '',
              suggestedResources: pdiGoal?.suggestedResources || [],
              coachingTip: enrichedData?.coachingTip || '',
              action: enrichedData?.action || '',
              estimatedWeeks: enrichedData?.estimatedWeeks || 8
            }
          })

          setGaps(wizardGaps)
          setSuggestions(wizardSuggestions)
          setPhase('gaps')
        } else {
          // Sin roleFit o sin gaps — mostrar NoGaps
          setPhase('no-gaps')
        }
      } catch (err) {
        console.error('[PDI Orchestrator] Error:', err)
        setError('Error de conexión al generar sugerencias')
      }
    }

    loadPDIData()
  }, [employeeId, cycleId, onComplete])

  // ═══════════════════════════════════════════════════════════════════════════
  // Handlers
  // ═══════════════════════════════════════════════════════════════════════════

  const handleAddGoal = useCallback((edited: EditedGoal) => {
    setEditedGoals(prev => [...prev.filter(g => g.goalId !== edited.goalId), edited])
    setDirection(1)

    if (currentGapIndex < gaps.length - 1) {
      setCurrentGapIndex(prev => prev + 1)
    } else {
      setPhase('manual')
    }
  }, [currentGapIndex, gaps.length])

  const handlePreviousGap = useCallback(() => {
    if (currentGapIndex > 0) {
      setDirection(-1)
      setCurrentGapIndex(prev => prev - 1)
    }
  }, [currentGapIndex])

  const handleAddManualGoal = useCallback((goal: { title: string; targetOutcome: string }) => {
    setManualGoals(prev => [...prev, goal])
    setPhase('summary')
  }, [])

  const handleSkipManual = useCallback(() => {
    setPhase('summary')
  }, [])

  const handleManualPrevious = useCallback(() => {
    if (gaps.length > 0) {
      setDirection(-1)
      setCurrentGapIndex(gaps.length - 1)
      setPhase('gaps')
    }
  }, [gaps.length])

  // NoGaps handlers
  const handleNoGapsAddManual = useCallback(() => {
    setPhase('manual')
  }, [])

  const handleNoGapsFinish = useCallback(() => {
    setPhase('summary')
  }, [])

  // Save and navigate to plan
  const handleViewPlan = useCallback(async () => {
    if (!pdiId) return
    setIsSaving(true)

    try {
      // Build goals payload: keep included, mark excluded for deletion
      const includedGoalIds = new Set(
        editedGoals.filter(g => g.included).map(g => g.goalId)
      )

      // If user edited goals, update them via PATCH
      const goalsPayload = pdiGoals.map((g: any) => {
        const edited = editedGoals.find(e => e.goalId === g.id)
        if (edited && edited.included) {
          return {
            id: g.id,
            title: edited.title,
            targetOutcome: edited.targetOutcome
          }
        }
        if (edited && !edited.included) {
          return { id: g.id, _delete: true }
        }
        // Goal not touched in wizard (not in editedGoals) — keep if no explicit skip
        if (includedGoalIds.size > 0 && !includedGoalIds.has(g.id)) {
          // Check if this goal's competency was skipped
          const wasSkipped = gaps.some(
            gap => gap.competencyCode === g.competencyCode &&
            !editedGoals.some(e => e.competencyCode === gap.competencyCode)
          )
          if (wasSkipped) {
            return { id: g.id, _delete: true }
          }
        }
        return { id: g.id }
      })

      // Add manual goals
      const manualGoalsPayload = manualGoals.map(mg => ({
        title: mg.title,
        targetOutcome: mg.targetOutcome,
        aiGenerated: false,
        priority: 99
      }))

      await fetch(`/api/pdi/${pdiId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goals: [...goalsPayload, ...manualGoalsPayload]
        })
      })

      // Cambiar estado: DRAFT → PENDING_REVIEW
      await fetch(`/api/pdi/${pdiId}/change-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'SUBMIT_FOR_REVIEW' })
      })

      onComplete?.(pdiId)
    } catch (err) {
      console.error('[PDI Orchestrator] Error saving:', err)
    } finally {
      setIsSaving(false)
    }
  }, [pdiId, pdiGoals, editedGoals, manualGoals, gaps, onComplete])

  // ═══════════════════════════════════════════════════════════════════════════
  // Build summary goals list
  // ═══════════════════════════════════════════════════════════════════════════
  const summaryGoals = [
    ...editedGoals
      .filter(g => g.included)
      .map(g => ({
        competencyCode: g.competencyCode,
        title: g.title,
        isManual: false
      })),
    ...manualGoals.map(g => ({
      competencyCode: 'MANUAL',
      title: g.title,
      isManual: true
    }))
  ]

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════

  // Loading
  if (phase === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full mb-4"
        />
        <p className="text-slate-400 mb-2">
          Analizando brechas de <span className="text-cyan-400 font-medium">{employeeName.split(' ')[0]}</span>...
        </p>
        <p className="text-slate-600 text-xs">
          {elapsed < 5
            ? 'Obteniendo resultados 360°...'
            : elapsed < 15
            ? 'Calculando Role Fit y brechas...'
            : elapsed < 30
            ? 'Generando objetivos de desarrollo...'
            : 'Esto puede tomar unos segundos más...'}
        </p>
        {elapsed > 3 && (
          <p className="text-slate-700 text-[10px] mt-2">{elapsed}s</p>
        )}
      </div>
    )
  }

  // Error
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="bg-slate-800/50 backdrop-blur border border-red-500/20 rounded-2xl p-8 text-center max-w-md">
          <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto mb-4">
            <span className="text-red-400 text-xl">!</span>
          </div>
          <p className="text-red-400 mb-2 font-medium">Error</p>
          <p className="text-slate-400 text-sm mb-4">{error}</p>
          <button
            onClick={() => {
              generatingRef.current = false
              setError(null)
              setPhase('loading')
              setElapsed(0)
              // Re-trigger
              const run = async () => {
                try {
                  const res = await fetch('/api/pdi/generate-suggestion', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ employeeId, cycleId })
                  })
                  const data = await res.json()
                  if (data.success) {
                    setPdiId(data.data.id)
                    setPdiGoals(data.data.goals || [])
                    // Re-process would require duplicating logic, so reload
                    window.location.reload()
                  } else {
                    setError(data.error || 'Error generando sugerencias')
                  }
                } catch {
                  setError('Error de conexión al generar sugerencias')
                }
              }
              run()
            }}
            className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-medium transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  // NoGaps
  if (phase === 'no-gaps') {
    return (
      <PDINoGapsCard
        employeeName={employeeName}
        roleFit={roleFit ? {
          roleFitScore: roleFit.roleFitScore,
          summary: {
            totalCompetencies: roleFit.summary.totalCompetencies,
            matching: roleFit.summary.matching,
            exceeds: roleFit.summary.exceeds
          }
        } : null}
        onAddManual={handleNoGapsAddManual}
        onFinish={handleNoGapsFinish}
      />
    )
  }

  // Gap cards
  if (phase === 'gaps' && currentGapIndex < gaps.length) {
    const currentGap = gaps[currentGapIndex]
    const currentSuggestion = suggestions[currentGapIndex]
    const goalId = pdiGoals.find(
      (g: any) => g.competencyCode === currentGap.competencyCode
    )?.id || `gap-${currentGapIndex}`

    return (
      <AnimatePresence mode="wait" custom={direction}>
        <PDIWizardCard
          key={`gap-${currentGapIndex}`}
          gap={currentGap}
          suggestion={currentSuggestion}
          goalId={goalId}
          currentIndex={currentGapIndex}
          totalCount={gaps.length}
          direction={direction}
          onNext={handleAddGoal}
          onPrevious={handlePreviousGap}
        />
      </AnimatePresence>
    )
  }

  // Manual goal
  if (phase === 'manual') {
    return (
      <PDIManualGoalCard
        onAdd={handleAddManualGoal}
        onSkip={handleSkipManual}
        onPrevious={handleManualPrevious}
      />
    )
  }

  // Summary
  return (
    <PDISummaryCard
      employeeName={employeeName}
      roleFitScore={roleFit?.roleFitScore ?? null}
      overallScore={overallScore}
      goals={summaryGoals}
      manualGoalsCount={manualGoals.length}
      onViewPlan={handleViewPlan}
    />
  )
}
