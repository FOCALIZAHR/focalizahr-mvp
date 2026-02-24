// ════════════════════════════════════════════════════════════════════════════
// GOAL CHECK-IN MODAL - Registrar avance de meta
// src/components/goals/GoalCheckInModal.tsx
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { memo, useState, useCallback, useMemo } from 'react'
import { X, Target, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PrimaryButton, GhostButton } from '@/components/ui/PremiumButton'
import PercentageSlider from '@/components/ui/PercentageSlider'
import GoalProgressBar from './GoalProgressBar'

// ════════════════════════════════════════════════════════════════════════════
// TIPOS
// ════════════════════════════════════════════════════════════════════════════

interface GoalCheckInModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (value: number, comment?: string) => Promise<void>
  goal: {
    title: string
    currentValue: number
    targetValue: number
    startValue: number
    progress: number
    unit?: string | null
    metricType: string
    status?: string
  }
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE
// ════════════════════════════════════════════════════════════════════════════

export default memo(function GoalCheckInModal({
  isOpen,
  onClose,
  onSubmit,
  goal,
}: GoalCheckInModalProps) {
  const isBinary = goal.metricType === 'BINARY'
  const isPercentage = goal.metricType === 'PERCENTAGE'

  const [newValue, setNewValue] = useState(() => {
    if (isBinary) return goal.currentValue >= 1 ? 1 : 0
    return goal.currentValue
  })
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Calcular preview del progreso
  const previewProgress = useMemo(() => {
    if (isBinary) return newValue === 1 ? 100 : 0
    const range = goal.targetValue - goal.startValue
    if (range === 0) return newValue >= goal.targetValue ? 100 : 0
    return Math.min(150, Math.max(0, ((newValue - goal.startValue) / range) * 100))
  }, [newValue, goal.targetValue, goal.startValue, isBinary])

  const delta = isBinary
    ? (newValue === 1 ? 1 : 0) - (goal.currentValue >= 1 ? 1 : 0)
    : newValue - goal.currentValue

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true)
    setError(null)

    try {
      await onSubmit(newValue, comment || undefined)
      setComment('')
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setIsSubmitting(false)
    }
  }, [newValue, comment, onSubmit, onClose])

  const handleValueChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setNewValue(parseFloat(e.target.value) || 0)
  }, [])

  const handleCommentChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setComment(e.target.value)
  }, [])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg fhr-card">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
              <Target className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="fhr-title-card">Registrar Avance</h2>
              <p className="fhr-text-sm text-slate-400 mt-0.5 line-clamp-1">
                {goal.title}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {/* Valor actual */}
          <div className="p-4 bg-slate-800/50 rounded-xl space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">
                {isBinary ? 'Estado actual' : 'Valor actual'}
              </span>
              <span className="text-white tabular-nums">
                {isBinary
                  ? (goal.currentValue >= 1 ? 'Completado' : 'Pendiente')
                  : `${goal.currentValue.toLocaleString()}${goal.unit ? ` ${goal.unit}` : ''}`
                }
              </span>
            </div>
            {!isBinary && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Meta</span>
                <span className="text-cyan-400 tabular-nums">
                  {goal.targetValue.toLocaleString()}
                  {goal.unit ? ` ${goal.unit}` : ''}
                </span>
              </div>
            )}
            <GoalProgressBar progress={goal.progress} status="ON_TRACK" size="sm" />
          </div>

          {/* Input condicional según tipo */}
          {isBinary ? (
            /* TOGGLE SWITCH para BINARY */
            <div className="space-y-3">
              <label className="text-sm text-slate-300">Completado?</label>
              <div className="flex items-center gap-4">
                <span className={cn(
                  'text-sm font-medium transition-colors',
                  newValue === 0 ? 'text-white' : 'text-slate-500'
                )}>
                  No
                </span>
                <button
                  type="button"
                  onClick={() => setNewValue(prev => prev === 1 ? 0 : 1)}
                  className={cn(
                    'relative w-14 h-8 rounded-full transition-colors duration-200',
                    newValue === 1 ? 'bg-emerald-500' : 'bg-slate-600'
                  )}
                >
                  <div className={cn(
                    'absolute top-1 w-6 h-6 rounded-full bg-white shadow-lg transition-transform duration-200',
                    newValue === 1 ? 'translate-x-7' : 'translate-x-1'
                  )} />
                </button>
                <span className={cn(
                  'text-sm font-medium transition-colors',
                  newValue === 1 ? 'text-emerald-400' : 'text-slate-500'
                )}>
                  Si
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {newValue === 1 ? 'Meta marcada como completada' : 'Meta pendiente'}
              </p>
            </div>
          ) : isPercentage ? (
            /* SLIDER para PERCENTAGE */
            <PercentageSlider
              value={newValue}
              onChange={setNewValue}
              min={0}
              max={goal.targetValue}
              step={1}
              label="Porcentaje de avance"
            />
          ) : (
            /* INPUT NUMÉRICO para CURRENCY, NUMBER */
            <div className="space-y-2">
              <label className="fhr-text-sm text-slate-300">Nuevo valor</label>
              <div className="relative">
                <input
                  type="number"
                  value={newValue}
                  onChange={handleValueChange}
                  className="fhr-input w-full text-lg"
                  step={0.01}
                />
                {goal.unit && (
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                    {goal.unit}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Preview del cambio */}
          {delta !== 0 && (
            <div className="p-4 bg-slate-800/50 rounded-xl space-y-3">
              <div className="flex items-center gap-2">
                <TrendingUp
                  className={cn('w-4 h-4', delta > 0 ? 'text-emerald-400' : 'text-red-400')}
                />
                <span
                  className={cn(
                    'text-sm font-medium',
                    delta > 0 ? 'text-emerald-400' : 'text-red-400'
                  )}
                >
                  {isBinary
                    ? (newValue === 1 ? 'Completado' : 'Revertido a pendiente')
                    : `${delta > 0 ? '+' : ''}${delta.toLocaleString()}${goal.unit ? ` ${goal.unit}` : ''}`
                  }
                </span>
                <span className="fhr-text-sm text-slate-500">
                  → {previewProgress.toFixed(0)}% completado
                </span>
              </div>
              <GoalProgressBar progress={previewProgress} status="ON_TRACK" size="sm" />
            </div>
          )}

          {/* Comentario */}
          <div className="space-y-2">
            <label className="fhr-text-sm text-slate-300">
              Comentario <span className="text-slate-500">(opcional)</span>
            </label>
            <textarea
              value={comment}
              onChange={handleCommentChange}
              placeholder="Que hiciste para avanzar?"
              rows={2}
              className="fhr-input w-full text-sm resize-none"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-6 flex gap-3">
          <GhostButton
            onClick={onClose}
            disabled={isSubmitting}
            fullWidth
          >
            Cancelar
          </GhostButton>
          <PrimaryButton
            onClick={handleSubmit}
            disabled={isSubmitting || delta === 0}
            isLoading={isSubmitting}
            fullWidth
          >
            {isSubmitting ? 'Guardando...' : 'Guardar Avance'}
          </PrimaryButton>
        </div>
      </div>
    </div>
  )
})
