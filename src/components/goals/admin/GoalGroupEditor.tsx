// src/components/goals/admin/GoalGroupEditor.tsx
'use client'

import { useState, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import { X, Loader2, AlertTriangle } from 'lucide-react'

// ════════════════════════════════════════════════════════════════════════════
// TIPOS
// ════════════════════════════════════════════════════════════════════════════

interface GoalGroupEditorProps {
  group: {
    id: string
    name: string
    code: string
    weightBusiness: number
    weightLeader: number
    weightNPS: number
    weightSpecific: number
  } | null
  onClose: () => void
  onSave: () => void
}

// ════════════════════════════════════════════════════════════════════════════
// WEIGHT SLIDER
// ════════════════════════════════════════════════════════════════════════════

function WeightSlider({
  label,
  description,
  value,
  onChange,
  color,
}: {
  label: string
  description: string
  value: number
  onChange: (v: number) => void
  color: string
}) {
  const colorClasses: Record<string, string> = {
    amber: 'accent-amber-500',
    purple: 'accent-purple-500',
    cyan: 'accent-cyan-500',
    emerald: 'accent-emerald-500',
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-sm text-white">{label}</span>
          <p className="text-xs text-slate-500">{description}</p>
        </div>
        <span className="text-lg font-medium text-white w-12 text-right">{value}%</span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        step={5}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={`w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer ${colorClasses[color]}`}
      />
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════

export default function GoalGroupEditor({ group, onClose, onSave }: GoalGroupEditorProps) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    name: group?.name || '',
    code: group?.code || '',
    weightBusiness: group?.weightBusiness ?? 25,
    weightLeader: group?.weightLeader ?? 25,
    weightNPS: group?.weightNPS ?? 25,
    weightSpecific: group?.weightSpecific ?? 25,
  })

  const total = useMemo(
    () => formData.weightBusiness + formData.weightLeader + formData.weightNPS + formData.weightSpecific,
    [formData.weightBusiness, formData.weightLeader, formData.weightNPS, formData.weightSpecific]
  )

  const isValid = useMemo(
    () => formData.name.length >= 2 && formData.code.length >= 2 && Math.abs(total - 100) < 0.01,
    [formData.name, formData.code, total]
  )

  const handleSubmit = useCallback(async () => {
    if (!isValid) return
    setSaving(true)
    setError('')

    try {
      const url = group ? `/api/config/goal-groups/${group.id}` : '/api/config/goal-groups'
      const res = await fetch(url, {
        method: group ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error guardando')
      }

      onSave()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setSaving(false)
    }
  }, [formData, group, isValid, onSave])

  const updateWeight = useCallback((key: string, value: number) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg fhr-card p-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl text-white font-medium">
            {group ? 'Editar Grupo' : 'Nuevo Grupo de Ponderación'}
          </h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario */}
        <div className="space-y-6">
          {/* Nombre y Código */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-slate-300 mb-1 block">Nombre</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Ej: Gerente/Director"
                className="fhr-input w-full"
              />
            </div>
            <div>
              <label className="text-sm text-slate-300 mb-1 block">Código</label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))
                }
                placeholder="Ej: GERENTE"
                disabled={!!group}
                className="fhr-input w-full disabled:opacity-50"
              />
            </div>
          </div>

          {/* Sliders de pesos */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-300">Distribución de Pesos</span>
              <span
                className={`text-sm font-medium ${
                  Math.abs(total - 100) < 0.01 ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                Total: {total}%
              </span>
            </div>

            <WeightSlider
              label="Meta Negocio"
              description="Metas corporativas y de empresa"
              value={formData.weightBusiness}
              onChange={(v) => updateWeight('weightBusiness', v)}
              color="amber"
            />
            <WeightSlider
              label="Meta Líder"
              description="Solo para quienes tienen equipos"
              value={formData.weightLeader}
              onChange={(v) => updateWeight('weightLeader', v)}
              color="purple"
            />
            <WeightSlider
              label="Meta NPS/Cliente"
              description="Experiencia de cliente"
              value={formData.weightNPS}
              onChange={(v) => updateWeight('weightNPS', v)}
              color="cyan"
            />
            <WeightSlider
              label="Meta Específica"
              description="Individual del cargo"
              value={formData.weightSpecific}
              onChange={(v) => updateWeight('weightSpecific', v)}
              color="emerald"
            />
          </div>

          {/* Warning si no suma 100 */}
          {Math.abs(total - 100) >= 0.01 && (
            <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span className="text-sm text-amber-400">Los pesos deben sumar exactamente 100%</span>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="fhr-btn fhr-btn-ghost px-4 py-2">
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || !isValid}
            className="fhr-btn fhr-btn-primary flex items-center gap-2 px-4 py-2 disabled:opacity-50"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saving ? 'Guardando...' : group ? 'Guardar Cambios' : 'Crear Grupo'}
          </button>
        </div>
      </motion.div>
    </div>
  )
}
