// src/components/goals/admin/CascadeRuleBuilder.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { X, Loader2 } from 'lucide-react'

// ════════════════════════════════════════════════════════════════════════════
// TIPOS
// ════════════════════════════════════════════════════════════════════════════

interface SourceGoal {
  id: string
  title: string
  level: string
}

interface GoalGroup {
  id: string
  name: string
  code: string
}

interface CascadeRuleBuilderProps {
  onClose: () => void
  onSave: () => void
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE
// ════════════════════════════════════════════════════════════════════════════

export default function CascadeRuleBuilder({ onClose, onSave }: CascadeRuleBuilderProps) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [sourceGoals, setSourceGoals] = useState<SourceGoal[]>([])
  const [goalGroups, setGoalGroups] = useState<GoalGroup[]>([])
  const [loadingOptions, setLoadingOptions] = useState(true)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sourceGoalId: '',
    targetGroupId: '',
    assignedWeight: 0,
    isLeaderOnly: false,
  })

  // Cargar opciones
  useEffect(() => {
    const load = async () => {
      try {
        const [goalsRes, groupsRes] = await Promise.all([
          fetch('/api/goals?level=COMPANY&includeCompleted=true'),
          fetch('/api/config/goal-groups'),
        ])
        const goalsJson = await goalsRes.json()
        const groupsJson = await groupsRes.json()

        // También cargar metas de area
        const areaRes = await fetch('/api/goals?level=AREA&includeCompleted=true')
        const areaJson = await areaRes.json()

        setSourceGoals([...(goalsJson.data || []), ...(areaJson.data || [])])
        setGoalGroups(groupsJson.data || [])
      } catch {
        setError('Error cargando datos')
      } finally {
        setLoadingOptions(false)
      }
    }
    load()
  }, [])

  const handleSubmit = useCallback(async () => {
    if (!formData.name || !formData.sourceGoalId) return
    setSaving(true)
    setError('')

    try {
      const res = await fetch('/api/config/goal-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          targetGroupId: formData.targetGroupId || null,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error creando regla')
      }

      onSave()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setSaving(false)
    }
  }, [formData, onSave])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg fhr-card p-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl text-white font-medium">Nueva Regla de Cascada</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {loadingOptions ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
          </div>
        ) : (
          <div className="space-y-5">
            {/* Nombre */}
            <div>
              <label className="text-sm text-slate-300 mb-1 block">Nombre de la regla</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                placeholder="Ej: Meta EBITDA para Gerentes"
                className="fhr-input w-full"
              />
            </div>

            {/* Meta origen */}
            <div>
              <label className="text-sm text-slate-300 mb-1 block">Meta origen (corporativa/área)</label>
              <select
                value={formData.sourceGoalId}
                onChange={(e) => setFormData((p) => ({ ...p, sourceGoalId: e.target.value }))}
                className="fhr-input w-full"
              >
                <option value="">Seleccionar meta...</option>
                {sourceGoals.map((g) => (
                  <option key={g.id} value={g.id}>
                    [{g.level}] {g.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Grupo destino */}
            <div>
              <label className="text-sm text-slate-300 mb-1 block">
                Grupo destino (opcional)
              </label>
              <select
                value={formData.targetGroupId}
                onChange={(e) => setFormData((p) => ({ ...p, targetGroupId: e.target.value }))}
                className="fhr-input w-full"
              >
                <option value="">Todos los elegibles</option>
                {goalGroups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} ({g.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Peso */}
            <div>
              <label className="text-sm text-slate-300 mb-1 block">
                Peso asignado: {formData.assignedWeight}%
              </label>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={formData.assignedWeight}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, assignedWeight: Number(e.target.value) }))
                }
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
            </div>

            {/* Solo líderes */}
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isLeaderOnly}
                onChange={(e) => setFormData((p) => ({ ...p, isLeaderOnly: e.target.checked }))}
                className="w-4 h-4 rounded border-slate-600 text-purple-500 focus:ring-purple-500"
              />
              <div>
                <span className="text-sm text-white">Solo para líderes</span>
                <p className="text-xs text-slate-500">Solo empleados con equipo a cargo</p>
              </div>
            </label>

            {/* Descripción */}
            <div>
              <label className="text-sm text-slate-300 mb-1 block">Descripción (opcional)</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                placeholder="Descripción de la regla..."
                rows={2}
                className="fhr-input w-full resize-none"
              />
            </div>

            {/* Error */}
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="fhr-btn fhr-btn-ghost px-4 py-2">
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || !formData.name || !formData.sourceGoalId}
            className="fhr-btn fhr-btn-primary flex items-center gap-2 px-4 py-2 disabled:opacity-50"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saving ? 'Creando...' : 'Crear Regla'}
          </button>
        </div>
      </motion.div>
    </div>
  )
}
