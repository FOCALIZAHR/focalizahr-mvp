'use client'

// ============================================================================
// ClassificationApprovalPreview - Full approval view with track grouping
// Groups classified employees by track, shows confidence stats,
// and provides approve-all / review-individual actions.
// ============================================================================

import { memo, useMemo } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, CheckCircle2, Eye, Loader2, Sparkles } from 'lucide-react'
import { TrackGroupCard } from './TrackGroupCard'
import { GhostButton } from '@/components/ui/PremiumButton'
import type { ClassificationEmployee, PerformanceTrack } from '@/types/job-classification'

// ══════════════════════════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════════════════════════

export interface ClassificationApprovalPreviewProps {
  employees: ClassificationEmployee[]
  onApproveAll: () => void
  onReviewIndividual?: () => void
  onBack: () => void
  isSubmitting?: boolean
}

// ══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ══════════════════════════════════════════════════════════════════════════

export const ClassificationApprovalPreview = memo(function ClassificationApprovalPreview({
  employees,
  onApproveAll,
  onReviewIndividual,
  onBack,
  isSubmitting = false
}: ClassificationApprovalPreviewProps) {

  // Group by track
  const groupedByTrack = useMemo(() => {
    const groups: Record<PerformanceTrack, ClassificationEmployee[]> = {
      EJECUTIVO: [],
      MANAGER: [],
      COLABORADOR: []
    }

    employees.forEach(emp => {
      const track = emp.draftTrack || emp.suggestedTrack || 'COLABORADOR'
      groups[track].push(emp)
    })

    return groups
  }, [employees])

  // Confidence stats
  const stats = useMemo(() => {
    const total = employees.length
    if (total === 0) return { highConfidence: 0, percentage: 0 }
    const highConfidence = employees.filter(e => e.confidence >= 0.95).length
    const percentage = Math.round((highConfidence / total) * 100)
    return { highConfidence, percentage }
  }, [employees])

  const trackOrder: PerformanceTrack[] = ['EJECUTIVO', 'MANAGER', 'COLABORADOR']

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="fhr-card p-6 relative">
        <div className="fhr-top-line" />
        <div className="flex items-start gap-4">
          <div className="p-3 bg-cyan-500/10 rounded-xl">
            <Eye className="w-6 h-6 text-cyan-400" />
          </div>

          <div className="flex-1">
            <h2 className="text-xl font-light text-white mb-1">
              Vista Previa: Clasificación <span className="fhr-title-gradient">Automática</span>
            </h2>
            <p className="text-slate-400">
              {employees.length} empleados clasificados &bull; {stats.percentage}% con alta confianza
            </p>
          </div>
        </div>

        {/* Confidence indicator */}
        {stats.highConfidence > 0 && (
          <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="text-emerald-400 text-sm">
              <strong>{stats.highConfidence}</strong> clasificaciones con 95%+ confianza
            </span>
          </div>
        )}
      </div>

      {/* Track Groups */}
      <div className="space-y-3">
        {trackOrder.map(track => {
          const trackEmployees = groupedByTrack[track]
          if (trackEmployees.length === 0) return null

          return (
            <TrackGroupCard
              key={track}
              track={track}
              employees={trackEmployees}
              defaultExpanded={trackEmployees.length <= 5}
            />
          )
        })}
      </div>

      {/* Info */}
      <div className="fhr-card-static p-4">
        <p className="text-sm text-slate-400 flex items-start gap-2">
          <span className="text-cyan-400 shrink-0">&#x1F4A1;</span>
          <span>
            Estas clasificaciones fueron realizadas por nuestro motor de inteligencia artificial
            con base en el cargo y estructura organizacional. Puedes aprobarlas todas o revisar
            individualmente si deseas ajustar alguna.
          </span>
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-700/50">
        <GhostButton
          onClick={onBack}
          disabled={isSubmitting}
          icon={ArrowLeft}
          size="sm"
        >
          Volver
        </GhostButton>

        <div className="flex items-center gap-3">
          {onReviewIndividual && (
            <button
              onClick={onReviewIndividual}
              disabled={isSubmitting}
              className="fhr-btn fhr-btn-secondary"
            >
              Revisar una por una
            </button>
          )}

          <button
            onClick={onApproveAll}
            disabled={isSubmitting}
            className="fhr-btn fhr-btn-primary flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Aprobar todas y continuar
              </>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  )
})

export default ClassificationApprovalPreview
