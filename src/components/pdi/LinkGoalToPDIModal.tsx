'use client'

// ════════════════════════════════════════════════════════════════════════════
// LINK GOAL TO PDI MODAL
// Crear o vincular una meta de negocio desde un objetivo de desarrollo
// ════════════════════════════════════════════════════════════════════════════

import { memo, useState, useCallback, useEffect } from 'react'
import { X, Target, Link2, Plus, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { PrimaryButton, GhostButton } from '@/components/ui/PremiumButton'

interface LinkGoalToPDIModalProps {
  devGoal: {
    id: string
    title: string
    competencyName: string
    targetOutcome?: string
  }
  employeeId: string
  onClose: () => void
  onSuccess: () => void
}

type TabType = 'create' | 'link'

interface AvailableGoal {
  id: string
  title: string
  progress: number
  targetValue: number
  unit: string | null
}

export const LinkGoalToPDIModal = memo(function LinkGoalToPDIModal({
  devGoal,
  employeeId,
  onClose,
  onSuccess
}: LinkGoalToPDIModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('create')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Estado para "Crear nueva"
  const [formData, setFormData] = useState({
    title: devGoal.targetOutcome || `Meta: ${devGoal.title}`,
    description: `Derivada del objetivo: ${devGoal.title}`,
    targetValue: 100,
    unit: '%',
    dueDate: '',
    weight: 0
  })

  // Estado para "Vincular existente"
  const [availableGoals, setAvailableGoals] = useState<AvailableGoal[]>([])
  const [selectedGoalId, setSelectedGoalId] = useState('')
  const [loadingGoals, setLoadingGoals] = useState(false)

  // Cargar metas disponibles
  useEffect(() => {
    if (activeTab === 'link') {
      loadAvailableGoals()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])

  const loadAvailableGoals = async () => {
    setLoadingGoals(true)
    try {
      const res = await fetch(
        `/api/goals?employeeId=${employeeId}&level=INDIVIDUAL&unlinked=true`
      )
      const data = await res.json()
      setAvailableGoals(data.data || [])
    } catch (err) {
      console.error('Error cargando metas:', err)
    } finally {
      setLoadingGoals(false)
    }
  }

  const handleCreate = useCallback(async () => {
    if (!formData.dueDate) {
      setError('Selecciona una fecha límite')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      const res = await fetch('/api/goals/from-pdi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          devGoalId: devGoal.id,
          employeeId,
          ...formData
        })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error creando meta')
      }

      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setIsSubmitting(false)
    }
  }, [formData, devGoal.id, employeeId, onSuccess])

  const handleLink = useCallback(async () => {
    if (!selectedGoalId) {
      setError('Selecciona una meta')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      const res = await fetch('/api/goals/link-pdi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goalId: selectedGoalId,
          devGoalId: devGoal.id
        })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error vinculando meta')
      }

      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setIsSubmitting(false)
    }
  }, [selectedGoalId, devGoal.id, onSuccess])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-lg fhr-card p-5 sm:p-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/10">
              <Target className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-white font-medium">Vincular Meta de Negocio</h2>
              <p className="text-xs text-slate-400">{devGoal.competencyName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-5">
          <button
            onClick={() => { setActiveTab('create'); setError('') }}
            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'create'
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                : 'bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-600'
            }`}
          >
            <Plus className="w-4 h-4" />
            Crear Nueva
          </button>
          <button
            onClick={() => { setActiveTab('link'); setError('') }}
            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'link'
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                : 'bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-600'
            }`}
          >
            <Link2 className="w-4 h-4" />
            Vincular Existente
          </button>
        </div>

        {/* Origen PDI */}
        <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg mb-4">
          <p className="text-xs text-purple-400 mb-1">Objetivo de desarrollo:</p>
          <p className="text-sm text-white">{devGoal.title}</p>
        </div>

        {/* Tab: Crear Nueva */}
        {activeTab === 'create' && (
          <div className="space-y-4">
            <div>
              <label className="fhr-label mb-1 block">Título</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="fhr-input w-full"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="fhr-label mb-1 block">Target</label>
                <input
                  type="number"
                  value={formData.targetValue}
                  onChange={(e) => setFormData(prev => ({ ...prev, targetValue: Number(e.target.value) }))}
                  className="fhr-input w-full"
                />
              </div>
              <div>
                <label className="fhr-label mb-1 block">Unidad</label>
                <input
                  type="text"
                  value={formData.unit}
                  onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                  className="fhr-input w-full"
                />
              </div>
            </div>
            <div>
              <label className="fhr-label mb-1 block">Fecha límite</label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                className="fhr-input w-full"
              />
            </div>
          </div>
        )}

        {/* Tab: Vincular Existente */}
        {activeTab === 'link' && (
          <div className="space-y-4">
            {loadingGoals ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
              </div>
            ) : availableGoals.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-400 mb-2">No hay metas disponibles</p>
                <p className="text-xs text-slate-500">
                  Todas las metas ya están vinculadas o no hay metas individuales activas.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {availableGoals.map(goal => (
                  <button
                    key={goal.id}
                    onClick={() => setSelectedGoalId(goal.id)}
                    className={`w-full p-3 rounded-lg border text-left transition-all ${
                      selectedGoalId === goal.id
                        ? 'border-cyan-500 bg-cyan-500/10'
                        : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                    }`}
                  >
                    <p className="text-sm text-white font-medium">{goal.title}</p>
                    <p className="text-xs text-slate-400">
                      Progreso: {goal.progress?.toFixed(0) || 0}% · Target: {goal.targetValue} {goal.unit || ''}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-6">
          <GhostButton onClick={onClose} size="sm">Cancelar</GhostButton>
          <PrimaryButton
            icon={activeTab === 'create' ? Plus : Link2}
            onClick={activeTab === 'create' ? handleCreate : handleLink}
            disabled={isSubmitting || (activeTab === 'link' && !selectedGoalId)}
            isLoading={isSubmitting}
            size="sm"
          >
            {isSubmitting
              ? 'Procesando...'
              : activeTab === 'create' ? 'Crear Meta' : 'Vincular Meta'}
          </PrimaryButton>
        </div>
      </motion.div>
    </div>
  )
})
