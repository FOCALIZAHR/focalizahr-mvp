'use client'

// ════════════════════════════════════════════════════════════════════════════
// EVALUATION REVIEW MODAL v2.1 - Premium pre-submit review
// "Entender 3s, Decidir 10s, Actuar 1 clic"
// src/components/performance/EvaluationReviewModal.tsx
// ════════════════════════════════════════════════════════════════════════════

import { memo, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  ChevronDown,
  ArrowLeft,
  Send,
  Star,
  CheckCircle,
  TrendingUp,
  AlertTriangle,
  MessageSquare,
  ListChecks
} from 'lucide-react'
import type { Question, SurveyResponse } from '@/hooks/useSurveyEngine'
import { isResponseAnswered } from '@/lib/validators/responseValidator'
import { PrimaryButton, GhostButton, ButtonGroup } from '@/components/ui/PremiumButton'
import {
  getPerformanceClassification,
  PerformanceLevel
} from '@/config/performanceClassification'

// ════════════════════════════════════════════════════════════════════════════
// ICON MAP - UI concern, maps centralized levels to Lucide icons
// ════════════════════════════════════════════════════════════════════════════

const LEVEL_ICONS: Record<string, typeof Star> = {
  [PerformanceLevel.EXCEPTIONAL]: Star,
  [PerformanceLevel.EXCEEDS]: CheckCircle,
  [PerformanceLevel.MEETS]: CheckCircle,
  [PerformanceLevel.DEVELOPING]: TrendingUp,
  [PerformanceLevel.NEEDS_IMPROVEMENT]: AlertTriangle
}

function getClassificationIcon(level: string) {
  return LEVEL_ICONS[level] || CheckCircle
}

// ════════════════════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════════════════════

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase()
}

// ════════════════════════════════════════════════════════════════════════════
// INTERFACES
// ════════════════════════════════════════════════════════════════════════════

interface EvaluationReviewModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  questions: Question[]
  responses: SurveyResponse[]
  evaluateeName?: string
  evaluateePosition?: string
  evaluateeDepartment?: string
  isSubmitting?: boolean
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ════════════════════════════════════════════════════════════════════════════

function EvaluationReviewModal({
  isOpen,
  onClose,
  onConfirm,
  questions,
  responses,
  evaluateeName = 'el colaborador',
  evaluateePosition,
  evaluateeDepartment,
  isSubmitting = false
}: EvaluationReviewModalProps) {
  const [showDetails, setShowDetails] = useState(false)

  // ── Validation using shared validator ──
  const validation = useMemo(() => {
    let answered = 0
    let unanswered = 0
    const unansweredQuestions: string[] = []

    questions.forEach((q, idx) => {
      const r = responses[idx]
      if (isResponseAnswered(q, r)) {
        answered++
      } else {
        unanswered++
        unansweredQuestions.push(q.text)
      }
    })

    return {
      answered,
      unanswered,
      total: questions.length,
      percentage: questions.length > 0 ? Math.round((answered / questions.length) * 100) : 0,
      isComplete: unanswered === 0,
      unansweredQuestions
    }
  }, [questions, responses])

  // ── Summary: score + classification + competency breakdown ──
  const summary = useMemo(() => {
    const ratingQuestions: { q: Question; idx: number }[] = []
    questions.forEach((q, idx) => {
      if (q.responseType === 'rating_scale' || q.responseType === 'competency_behavior') {
        ratingQuestions.push({ q, idx })
      }
    })

    const ratings = ratingQuestions
      .map(({ idx }) => responses[idx]?.rating)
      .filter((r): r is number => r != null && r >= 1)

    const average = ratings.length > 0
      ? ratings.reduce((a, b) => a + b, 0) / ratings.length
      : 0

    const classification = getPerformanceClassification(average)

    // Group by competencyCode (real competency name) if available, fallback to category
    const byGroup: Record<string, { sum: number; count: number }> = {}
    ratingQuestions.forEach(({ q, idx }) => {
      const rating = responses[idx]?.rating
      if (rating != null && rating >= 1) {
        const groupKey = q.competencyName || q.competencyCode || q.category || 'General'
        if (!byGroup[groupKey]) byGroup[groupKey] = { sum: 0, count: 0 }
        byGroup[groupKey].sum += rating
        byGroup[groupKey].count++
      }
    })

    const categoryAverages = Object.entries(byGroup)
      .map(([name, data]) => ({
        name,
        average: data.count > 0 ? data.sum / data.count : 0,
        count: data.count
      }))
      .sort((a, b) => b.average - a.average)

    return { average, classification, categoryAverages, totalRatings: ratings.length }
  }, [questions, responses])

  // ── Grouped responses for detail view ──
  const groupedResponses = useMemo(() => {
    const groups: Record<string, { question: Question; response: SurveyResponse }[]> = {}

    questions.forEach((q, idx) => {
      const groupKey = q.competencyName || q.competencyCode || q.category || 'General'
      if (!groups[groupKey]) groups[groupKey] = []
      groups[groupKey].push({ question: q, response: responses[idx] })
    })

    return groups
  }, [questions, responses])

  if (!isOpen) return null

  const hasRatings = summary.totalRatings > 0

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-xl max-h-[85vh] flex flex-col overflow-hidden bg-slate-900 rounded-2xl border border-slate-700/50 shadow-2xl"
        >
          {/* ── Tesla Line ── */}
          <div className="fhr-top-line" />

          {/* ── Header with Avatar ── */}
          <div className="px-6 py-5 border-b border-slate-700/50">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                {/* Avatar with initials */}
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                  <span className="text-lg font-semibold text-white">
                    {getInitials(evaluateeName)}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                    Tu evaluacion de
                  </p>
                  <h2 className="text-xl font-light text-slate-100">
                    {evaluateeName}
                  </h2>
                  {(evaluateePosition || evaluateeDepartment) && (
                    <p className="text-sm text-slate-400 mt-0.5">
                      {evaluateePosition}{evaluateePosition && evaluateeDepartment && ' \u00b7 '}{evaluateeDepartment}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-200 transition-colors rounded-lg hover:bg-slate-700/50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* ── Mensaje guia ── */}
          <div className="px-6 pt-4">
            <p className="text-sm text-slate-400 text-center">
              Estas a punto de enviar formalmente tu evaluacion.
              <br />
              <span className="text-slate-500">Puedes revisar cada respuesta antes de confirmar.</span>
            </p>
          </div>

          {/* ── Content - Scrollable ── */}
          <div className="flex-1 overflow-y-auto">
            {/* Progress bar - counter only, no label */}
            <div className="px-6 pt-4">
              <div className="flex items-center justify-end mb-2">
                <span className="text-sm font-medium text-cyan-400">
                  {validation.answered}/{validation.total}
                </span>
              </div>
              <div className="h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-cyan-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${validation.percentage}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              </div>
            </div>

            {/* Card Resumen - PROTAGONISTA */}
            {hasRatings && (
              <div className="mx-6 mt-4 p-5 rounded-xl bg-slate-800/50 border border-slate-700/50">
                {/* Score y Clasificacion */}
                <div className="flex items-center justify-center gap-8 mb-4">
                  {/* Promedio */}
                  <div className="text-center">
                    <div className="text-3xl font-light text-cyan-400">
                      {summary.average.toFixed(1)}
                    </div>
                    <div className="text-xs text-slate-500 uppercase tracking-wider mt-1">
                      Promedio
                    </div>
                  </div>

                  {/* Separador */}
                  <div className="w-px h-12 bg-slate-700" />

                  {/* Clasificacion con icono Lucide */}
                  <div className="text-center">
                    {(() => { const Icon = getClassificationIcon(summary.classification.level); return (
                    <div className={`flex items-center justify-center gap-2 ${summary.classification.textClass}`}>
                      <Icon className="w-5 h-5" />
                      <span className="text-lg font-medium">
                        {summary.classification.label}
                      </span>
                    </div>
                    ) })()}
                    <div className="text-xs text-slate-500 uppercase tracking-wider mt-1">
                      Clasificacion
                    </div>
                  </div>
                </div>

                {/* Barras por competencia - now grouped by competencyCode */}
                {summary.categoryAverages.length > 0 && (
                  <div className="space-y-2 pt-4 border-t border-slate-700/50">
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">
                      Por Competencia
                    </p>
                    {summary.categoryAverages.map(cat => (
                      <div key={cat.name} className="flex items-center gap-3">
                        <span className="text-xs text-slate-400 w-28 truncate capitalize">
                          {cat.name.replace(/_/g, ' ')}
                        </span>
                        <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-cyan-500 rounded-full transition-all"
                            style={{ width: `${(cat.average / 5) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-slate-300 w-8 text-right">
                          {cat.average.toFixed(1)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Warning si hay incompletas */}
            {!validation.isComplete && (
              <div className="mx-6 mt-4 flex items-start gap-3 px-4 py-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-300">
                    {validation.unanswered} pregunta{validation.unanswered !== 1 ? 's' : ''} sin responder
                  </p>
                  <ul className="mt-1 text-xs text-amber-400/70 space-y-0.5">
                    {validation.unansweredQuestions.slice(0, 3).map((q, i) => (
                      <li key={i} className="truncate">- {q}</li>
                    ))}
                    {validation.unansweredQuestions.length > 3 && (
                      <li>...y {validation.unansweredQuestions.length - 3} mas</li>
                    )}
                  </ul>
                </div>
              </div>
            )}

            {/* ── Progressive Disclosure: Card-style toggle ── */}
            <div className="mx-6 mt-4 mb-4">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="w-full px-4 py-3 flex items-center justify-between rounded-lg bg-slate-800/30 border border-slate-700/50 hover:border-cyan-500/30 hover:bg-slate-800/50 transition-all"
              >
                <div className="flex items-center gap-3">
                  <ListChecks className="w-4 h-4 text-cyan-400" />
                  <span className="text-sm text-slate-300">Ver detalle por pregunta</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">
                    {validation.answered} respuesta{validation.answered !== 1 ? 's' : ''}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-cyan-400 transition-transform duration-200 ${showDetails ? 'rotate-180' : ''}`} />
                </div>
              </button>
            </div>

            {/* Detalle colapsable */}
            <AnimatePresence>
              {showDetails && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden border-t border-slate-700/50"
                >
                  <div className="px-6 py-4 max-h-60 overflow-y-auto space-y-6">
                    {Object.entries(groupedResponses).map(([category, items]) => (
                      <div key={category}>
                        <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                          {category}
                        </h3>

                        <div className="space-y-2">
                          {items.map(({ question, response }) => {
                            const answered = isResponseAnswered(question, response)

                            return (
                              <div
                                key={question.id}
                                className={`px-3 py-2 rounded-lg border ${
                                  answered
                                    ? 'bg-slate-800/30 border-slate-700/50'
                                    : 'bg-amber-500/5 border-amber-500/20'
                                }`}
                              >
                                <p className="text-xs text-slate-400 mb-1 truncate">
                                  {question.text}
                                </p>

                                {answered ? (
                                  <div className="flex items-center gap-2">
                                    {(question.responseType === 'rating_scale' || question.responseType === 'competency_behavior' || question.responseType === 'nps_scale') && response?.rating != null && (
                                      <div className="flex items-center gap-1">
                                        <Star className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400" />
                                        <span className="text-sm font-medium text-cyan-400">
                                          {response.rating}{question.responseType === 'nps_scale' ? '/10' : '/5'}
                                        </span>
                                      </div>
                                    )}

                                    {question.responseType === 'text_open' && response?.textResponse && (
                                      <div className="flex items-center gap-1 text-xs text-slate-400 truncate">
                                        <MessageSquare className="w-3 h-3 flex-shrink-0" />
                                        <span className="truncate">{response.textResponse}</span>
                                      </div>
                                    )}

                                    {(question.responseType === 'single_choice' || question.responseType === 'multiple_choice') && response?.choiceResponse && (
                                      <span className="text-xs text-purple-300">
                                        {response.choiceResponse.join(', ')}
                                      </span>
                                    )}

                                    {question.responseType === 'rating_matrix_conditional' && response?.matrixResponses && (
                                      <span className="text-xs text-cyan-300">
                                        {Object.keys(response.matrixResponses).length} aspectos evaluados
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-xs text-amber-400">Sin responder</span>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── Footer con Botones Premium ── */}
          <div className="px-6 py-4 border-t border-slate-700/50">
            <ButtonGroup spacing={12}>
              <GhostButton
                icon={ArrowLeft}
                onClick={onClose}
              >
                Volver a editar
              </GhostButton>

              <PrimaryButton
                icon={Send}
                iconPosition="right"
                onClick={onConfirm}
                disabled={!validation.isComplete}
                isLoading={isSubmitting}
                glow
              >
                {isSubmitting ? 'Enviando...' : 'Confirmar y Enviar'}
              </PrimaryButton>
            </ButtonGroup>

            {!validation.isComplete && (
              <p className="text-xs text-amber-400 text-center mt-3">
                Completa las {validation.unanswered} pregunta{validation.unanswered !== 1 ? 's' : ''} restante{validation.unanswered !== 1 ? 's' : ''} para enviar
              </p>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

export default memo(EvaluationReviewModal)
