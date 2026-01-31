'use client'

// ════════════════════════════════════════════════════════════════════════════
// EVALUATION REVIEW MODAL - Pre-submit review with validation
// src/components/performance/EvaluationReviewModal.tsx
// ════════════════════════════════════════════════════════════════════════════

import { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Star,
  MessageSquare,
  CheckCircle,
  AlertTriangle,
  Send,
  ArrowLeft
} from 'lucide-react'
import type { Question, SurveyResponse } from '@/hooks/useSurveyEngine'

interface EvaluationReviewModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  questions: Question[]
  responses: SurveyResponse[]
  evaluateeName?: string
  isSubmitting?: boolean
}

export default function EvaluationReviewModal({
  isOpen,
  onClose,
  onConfirm,
  questions,
  responses,
  evaluateeName = 'el colaborador',
  isSubmitting = false
}: EvaluationReviewModalProps) {
  // Validar completitud
  const validation = useMemo(() => {
    let answered = 0
    let unanswered = 0
    const unansweredQuestions: string[] = []

    questions.forEach((q, idx) => {
      const r = responses[idx]
      let isAnswered = false

      if (!r) {
        unanswered++
        unansweredQuestions.push(q.text)
        return
      }

      switch (q.responseType) {
        case 'rating_scale':
          isAnswered = r.rating != null && r.rating >= 1
          break
        case 'nps_scale':
          isAnswered = r.rating != null && r.rating >= 0
          break
        case 'text_open':
          isAnswered = !!r.textResponse && r.textResponse.trim().length >= 10
          break
        case 'single_choice':
        case 'multiple_choice':
          isAnswered = !!r.choiceResponse && r.choiceResponse.length > 0
          break
        case 'rating_matrix_conditional':
          isAnswered = !!r.matrixResponses && Object.keys(r.matrixResponses).length > 0
          break
        default:
          isAnswered = false
      }

      if (isAnswered) answered++
      else {
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

  // Agrupar respuestas por categoría para preview
  const groupedResponses = useMemo(() => {
    const groups: Record<string, { question: Question; response: SurveyResponse }[]> = {}

    questions.forEach((q, idx) => {
      const category = q.category || 'General'
      if (!groups[category]) groups[category] = []
      groups[category].push({ question: q, response: responses[idx] })
    })

    return groups
  }, [questions, responses])

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl max-h-[85vh] overflow-hidden bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl"
        >
          {/* Header */}
          <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur-sm border-b border-slate-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-medium text-slate-200">
                  Revisar Evaluacion
                </h2>
                <p className="text-sm text-slate-400">
                  Revisa tus respuestas antes de enviar
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Completitud */}
            <div className="mt-3 flex items-center gap-3">
              <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    validation.isComplete
                      ? 'bg-gradient-to-r from-green-500 to-emerald-400'
                      : 'bg-gradient-to-r from-cyan-500 to-purple-500'
                  }`}
                  style={{ width: `${validation.percentage}%` }}
                />
              </div>
              <span className={`text-sm font-medium ${
                validation.isComplete ? 'text-green-400' : 'text-cyan-400'
              }`}>
                {validation.answered}/{validation.total}
              </span>
            </div>
          </div>

          {/* Content - Scrollable */}
          <div className="overflow-y-auto max-h-[55vh] px-6 py-4 space-y-6">
            {/* Warning si hay incompletas */}
            {!validation.isComplete && (
              <div className="flex items-start gap-3 px-4 py-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
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

            {/* Preview por categoría */}
            {Object.entries(groupedResponses).map(([category, items]) => (
              <div key={category}>
                <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  {category}
                </h3>

                <div className="space-y-2">
                  {items.map(({ question, response }) => {
                    const hasResponse = response && (
                      response.rating != null ||
                      (response.textResponse && response.textResponse.trim()) ||
                      (response.choiceResponse && response.choiceResponse.length > 0) ||
                      (response.matrixResponses && Object.keys(response.matrixResponses).length > 0)
                    )

                    return (
                      <div
                        key={question.id}
                        className={`px-3 py-2 rounded-lg border ${
                          hasResponse
                            ? 'bg-slate-800/30 border-slate-700/50'
                            : 'bg-amber-500/5 border-amber-500/20'
                        }`}
                      >
                        <p className="text-xs text-slate-400 mb-1 truncate">
                          {question.text}
                        </p>

                        {hasResponse ? (
                          <div className="flex items-center gap-2">
                            {/* Rating */}
                            {(question.responseType === 'rating_scale' || question.responseType === 'nps_scale') && response.rating != null && (
                              <div className="flex items-center gap-1">
                                <Star className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400" />
                                <span className="text-sm font-medium text-cyan-400">
                                  {response.rating}{question.responseType === 'nps_scale' ? '/10' : '/5'}
                                </span>
                              </div>
                            )}

                            {/* Text */}
                            {question.responseType === 'text_open' && response.textResponse && (
                              <div className="flex items-center gap-1 text-xs text-slate-400 truncate">
                                <MessageSquare className="w-3 h-3 flex-shrink-0" />
                                <span className="truncate">{response.textResponse}</span>
                              </div>
                            )}

                            {/* Choice */}
                            {(question.responseType === 'single_choice' || question.responseType === 'multiple_choice') && response.choiceResponse && (
                              <span className="text-xs text-purple-300">
                                {response.choiceResponse.join(', ')}
                              </span>
                            )}

                            {/* Matrix */}
                            {question.responseType === 'rating_matrix_conditional' && response.matrixResponses && (
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

          {/* Footer Actions */}
          <div className="sticky bottom-0 bg-slate-900/95 backdrop-blur-sm border-t border-slate-700 px-6 py-4">
            <div className="flex items-center justify-between gap-4">
              <button
                onClick={onClose}
                className="fhr-btn fhr-btn-ghost flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Volver a Editar
              </button>

              <button
                onClick={onConfirm}
                disabled={!validation.isComplete || isSubmitting}
                className="fhr-btn fhr-btn-primary flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Confirmar y Enviar
                  </>
                )}
              </button>
            </div>

            {!validation.isComplete && (
              <p className="text-xs text-amber-400 mt-2 text-center">
                Completa todas las preguntas para poder enviar la evaluacion
              </p>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
