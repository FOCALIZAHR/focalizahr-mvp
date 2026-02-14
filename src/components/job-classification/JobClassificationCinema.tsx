'use client'

// ============================================================================
// JobClassificationCinema - Draft-based Classification Orchestrator
// src/components/job-classification/JobClassificationCinema.tsx
//
// Replaces JobClassificationGate with draft state pattern:
// - All changes stay in localStorage until user confirms
// - Batch API call only on handleContinue
// - Cancel discards draft without touching DB
// ============================================================================

import { memo, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react'
import confetti from 'canvas-confetti'
import { useClassificationDraft } from '@/hooks/useClassificationDraft'
import ClassificationSummary from './ClassificationSummary'
import { ClassificationApprovalPreview } from './ClassificationApprovalPreview'
import { ClassificationReviewWizard } from './ClassificationReviewWizard'

// ============================================================================
// TYPES
// ============================================================================

export interface JobClassificationCinemaProps {
  mode: 'client' | 'admin'
  onComplete?: () => void
  onCancel?: () => void
  accountId?: string // Required for admin mode
}

type ViewState = 'hero' | 'approval' | 'review'

// ============================================================================
// COMPONENT
// ============================================================================

export const JobClassificationCinema = memo(function JobClassificationCinema({
  mode,
  onComplete,
  onCancel,
  accountId
}: JobClassificationCinemaProps) {
  const [viewState, setViewState] = useState<ViewState>('hero')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Suppress unused var — mode will be used for conditional rendering in future tasks
  void mode

  const {
    draft,
    summary,
    isLoading,
    error,
    approveAll,
    updateClassification,
    handleContinue,
    handleCancel,
    getPendingEmployees,
    getClassifiedEmployees
  } = useClassificationDraft({
    accountId,
    onComplete,
    onCancel
  })

  // ══════════════════════════════════════════════════════════════════════════
  // HANDLERS
  // ══════════════════════════════════════════════════════════════════════════

  const handleFinalConfirm = useCallback(async () => {
    setIsSubmitting(true)
    const success = await handleContinue()
    setIsSubmitting(false)

    if (success) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#22D3EE', '#A78BFA', '#10B981']
      })
    }
  }, [handleContinue])

  const handleCancelFlow = useCallback(() => {
    // Only confirm if user has made changes
    if (draft && draft.employees.some(e => e.isReviewed)) {
      if (!window.confirm('¿Seguro que deseas cancelar? Los cambios no guardados se perderán.')) {
        return
      }
    }
    handleCancel()
  }, [handleCancel, draft])

  const handleApproveAllSuggestions = useCallback(() => {
    approveAll()
  }, [approveAll])

  // ══════════════════════════════════════════════════════════════════════════
  // LOADING STATE
  // ══════════════════════════════════════════════════════════════════════════

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
        <p className="text-slate-400">Cargando clasificaciones...</p>
      </div>
    )
  }

  // ══════════════════════════════════════════════════════════════════════════
  // ERROR STATE
  // ══════════════════════════════════════════════════════════════════════════

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <AlertTriangle className="w-12 h-12 text-red-400" />
        <p className="text-red-400 text-center">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="fhr-btn fhr-btn-secondary"
        >
          Reintentar
        </button>
      </div>
    )
  }

  // ══════════════════════════════════════════════════════════════════════════
  // HERO VIEW
  // Shows ClassificationSummary with draft data + approve-all CTA
  // ══════════════════════════════════════════════════════════════════════════

  if (viewState === 'hero') {
    // Transform hook summary → ClassificationSummary component props
    const summaryData = summary.total > 0
      ? {
          totalEmployees: summary.total,
          classified: summary.classified,
          unclassified: summary.pending,
          withAnomalies: summary.anomalies,
          classificationRate: summary.classificationRate
        }
      : null

    const byTrackData = {
      ejecutivo: summary.byTrack.EJECUTIVO,
      manager: summary.byTrack.MANAGER,
      colaborador: summary.byTrack.COLABORADOR
    }

    // Count positions with auto-suggestions that haven't been reviewed
    const suggestableCount = (draft?.employees || []).filter(
      e => !e.isReviewed && e.suggestedJobLevel
    ).length

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        {/* Approve all suggestions CTA */}
        {suggestableCount > 0 && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            onClick={handleApproveAllSuggestions}
            className="w-full p-4 rounded-xl bg-slate-800/40 border border-emerald-500/20 hover:border-emerald-500/40 transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <span className="text-white font-medium text-sm">
                  Aceptar {suggestableCount} sugerencias automáticas
                </span>
                <p className="text-xs text-slate-500 mt-0.5">
                  Aprobar clasificaciones con alta confianza
                </p>
              </div>
            </div>
          </motion.button>
        )}

        {/* Submitting overlay */}
        {isSubmitting && (
          <div className="flex items-center justify-center gap-3 p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
            <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />
            <span className="text-cyan-400 text-sm font-medium">
              Guardando clasificaciones...
            </span>
          </div>
        )}

        {/* Classification Summary (gauge + tracks + CTAs) */}
        <ClassificationSummary
          summary={summaryData}
          byTrack={byTrackData}
          onResolveClick={() => setViewState('review')}
          onContinue={handleFinalConfirm}
          onCancel={handleCancelFlow}
        />
      </motion.div>
    )
  }

  // ══════════════════════════════════════════════════════════════════════════
  // APPROVAL VIEW (stub - TASK_03D will implement)
  // ══════════════════════════════════════════════════════════════════════════

  if (viewState === 'approval') {
    return (
      <ClassificationApprovalPreview
        employees={getClassifiedEmployees()}
        onApproveAll={handleFinalConfirm}
        onReviewIndividual={() => setViewState('review')}
        onBack={() => setViewState('hero')}
        isSubmitting={isSubmitting}
      />
    )
  }

  // ══════════════════════════════════════════════════════════════════════════
  // REVIEW VIEW (stub - TASK_03E will implement)
  // ══════════════════════════════════════════════════════════════════════════

  if (viewState === 'review') {
    return (
      <ClassificationReviewWizard
        employees={getPendingEmployees()}
        onClassify={updateClassification}
        onComplete={() => setViewState('hero')}
        onBack={() => setViewState('hero')}
      />
    )
  }

  return null
})

export default JobClassificationCinema
