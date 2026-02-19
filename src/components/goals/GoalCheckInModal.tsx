// ════════════════════════════════════════════════════════════════════════════
// GOAL CHECK-IN MODAL - Registrar avance de meta
// src/components/goals/GoalCheckInModal.tsx
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { memo, useState, useCallback, useMemo } from 'react'
import { X, Target, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PrimaryButton, GhostButton } from '@/components/ui/PremiumButton'
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
  const [newValue, setNewValue] = useState(goal.currentValue)
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Calcular preview del progreso
  const previewProgress = useMemo(() => {
    const range = goal.targetValue - goal.startValue
    if (range === 0) return newValue >= goal.targetValue ? 100 : 0
    return Math.min(150, Math.max(0, ((newValue - goal.startValue) / range) * 100))
  }, [newValue, goal.targetValue, goal.startValue])

  const delta = newValue - goal.currentValue

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
      <div className="relative w-full max-w-md fhr-card space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
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

        {/* Valor actual */}
        <div className="p-4 bg-slate-800/50 rounded-xl space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Valor actual</span>
            <span className="text-white tabular-nums">
              {goal.currentValue.toLocaleString()}
              {goal.unit ? ` ${goal.unit}` : ''}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Meta</span>
            <span className="text-cyan-400 tabular-nums">
              {goal.targetValue.toLocaleString()}
              {goal.unit ? ` ${goal.unit}` : ''}
            </span>
          </div>
          <GoalProgressBar progress={goal.progress} status="ON_TRACK" size="sm" />
        </div>

        {/* Input nuevo valor */}
        <div className="space-y-2">
          <label className="fhr-text-sm text-slate-300">Nuevo valor</label>
          <div className="relative">
            <input
              type="number"
              value={newValue}
              onChange={handleValueChange}
              className="fhr-input w-full text-lg"
              step={goal.metricType === 'PERCENTAGE' ? 1 : 0.01}
            />
            {goal.unit && (
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                {goal.unit}
              </span>
            )}
          </div>
        </div>

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
                {delta > 0 ? '+' : ''}
                {delta.toLocaleString()}
                {goal.unit ? ` ${goal.unit}` : ''}
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
            placeholder="¿Qué hiciste para avanzar?"
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

        {/* Actions */}
        <div className="flex gap-3 pt-2">
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
