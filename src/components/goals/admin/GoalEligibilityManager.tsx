// src/components/goals/admin/GoalEligibilityManager.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Settings2,
  Users,
  Check,
  Loader2,
  AlertCircle,
  Save,
} from 'lucide-react'

// ════════════════════════════════════════════════════════════════════════════
// TIPOS
// ════════════════════════════════════════════════════════════════════════════

interface GoalGroup {
  id: string
  name: string
  code: string
}

interface EligibilityConfig {
  standardJobLevel: string
  label: string
  hasGoals: boolean
  goalGroupId: string | null
  goalGroup: GoalGroup | null
  employeeCount: number
  id: string | null
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════

export default function GoalEligibilityManager() {
  const [configs, setConfigs] = useState<EligibilityConfig[]>([])
  const [goalGroups, setGoalGroups] = useState<GoalGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasChanges, setHasChanges] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // ──────────────────────────────────────────────────────────────────────
  // CARGA INICIAL
  // ──────────────────────────────────────────────────────────────────────

  const loadConfigs = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch('/api/config/goal-eligibility')
      if (!res.ok) throw new Error('Error cargando configuración')
      const json = await res.json()
      setConfigs(json.data || [])
      setGoalGroups(json.goalGroups || [])
    } catch (err: any) {
      setError(err.message || 'Error de conexión')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadConfigs()
  }, [loadConfigs])

  // ──────────────────────────────────────────────────────────────────────
  // HANDLERS
  // ──────────────────────────────────────────────────────────────────────

  const toggleHasGoals = (level: string) => {
    setConfigs(prev =>
      prev.map(c =>
        c.standardJobLevel === level
          ? { ...c, hasGoals: !c.hasGoals, goalGroupId: !c.hasGoals ? c.goalGroupId : null }
          : c
      )
    )
    setHasChanges(true)
    setSaveSuccess(false)
  }

  const updateGoalGroup = (level: string, groupId: string | null) => {
    setConfigs(prev =>
      prev.map(c =>
        c.standardJobLevel === level ? { ...c, goalGroupId: groupId } : c
      )
    )
    setHasChanges(true)
    setSaveSuccess(false)
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setError(null)
      const res = await fetch('/api/config/goal-eligibility', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          configs: configs.map(c => ({
            standardJobLevel: c.standardJobLevel,
            hasGoals: c.hasGoals,
            goalGroupId: c.goalGroupId,
          })),
        }),
      })
      if (!res.ok) throw new Error('Error guardando configuración')
      setHasChanges(false)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err: any) {
      setError(err.message || 'Error guardando')
    } finally {
      setSaving(false)
    }
  }

  // ──────────────────────────────────────────────────────────────────────
  // RESUMEN
  // ──────────────────────────────────────────────────────────────────────

  const eligibleCount = configs.filter(c => c.hasGoals).length
  const totalEmployees = configs.reduce((sum, c) => sum + (c.hasGoals ? c.employeeCount : 0), 0)

  // ──────────────────────────────────────────────────────────────────────
  // RENDER
  // ──────────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
        <span className="ml-3 text-slate-400">Cargando configuración...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-cyan-400" />
            Elegibilidad de Metas por Cargo
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Define qué niveles de cargo participan en el sistema de metas
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={!hasChanges || saving}
          className={`fhr-btn ${hasChanges ? 'fhr-btn-primary' : 'opacity-50 cursor-not-allowed bg-slate-700 text-slate-400'} flex items-center gap-2 px-4 py-2`}
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : saveSuccess ? (
            <Check className="w-4 h-4" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {saving ? 'Guardando...' : saveSuccess ? 'Guardado' : 'Guardar cambios'}
        </button>
      </div>

      {/* ERROR */}
      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* RESUMEN */}
      <div className="grid grid-cols-2 gap-4">
        <div className="fhr-card p-4">
          <div className="text-sm text-slate-400">Niveles elegibles</div>
          <div className="text-2xl font-bold text-cyan-400">{eligibleCount} / {configs.length}</div>
        </div>
        <div className="fhr-card p-4">
          <div className="text-sm text-slate-400">Empleados con metas</div>
          <div className="text-2xl font-bold text-purple-400 flex items-center gap-2">
            <Users className="w-5 h-5" />
            {totalEmployees}
          </div>
        </div>
      </div>

      {/* TABLA DE CONFIGURACIÓN */}
      <div className="fhr-card overflow-hidden">
        <div className="fhr-top-line" />
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700/50">
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase">
                Nivel de Cargo
              </th>
              <th className="text-center px-4 py-3 text-xs font-medium text-slate-400 uppercase">
                Empleados
              </th>
              <th className="text-center px-4 py-3 text-xs font-medium text-slate-400 uppercase">
                Tiene Metas
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase">
                Grupo de Ponderación
              </th>
            </tr>
          </thead>
          <tbody>
            {configs.map((config, idx) => (
              <motion.tr
                key={config.standardJobLevel}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors"
              >
                {/* NIVEL */}
                <td className="px-4 py-3">
                  <span className="text-sm font-medium text-white">
                    {config.label}
                  </span>
                  <span className="ml-2 text-xs text-slate-500 font-mono">
                    {config.standardJobLevel}
                  </span>
                </td>

                {/* CONTEO EMPLEADOS */}
                <td className="text-center px-4 py-3">
                  <span className={`text-sm ${config.employeeCount > 0 ? 'text-slate-300' : 'text-slate-600'}`}>
                    {config.employeeCount}
                  </span>
                </td>

                {/* TOGGLE */}
                <td className="text-center px-4 py-3">
                  <button
                    onClick={() => toggleHasGoals(config.standardJobLevel)}
                    className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
                      config.hasGoals
                        ? 'bg-cyan-500/30 border border-cyan-500/50'
                        : 'bg-slate-700 border border-slate-600'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 w-5 h-5 rounded-full transition-all duration-200 ${
                        config.hasGoals
                          ? 'left-6 bg-cyan-400'
                          : 'left-0.5 bg-slate-400'
                      }`}
                    />
                  </button>
                </td>

                {/* GRUPO */}
                <td className="px-4 py-3">
                  {config.hasGoals ? (
                    <select
                      value={config.goalGroupId || ''}
                      onChange={(e) => updateGoalGroup(config.standardJobLevel, e.target.value || null)}
                      className="fhr-input text-sm py-1 px-2 w-full max-w-[200px]"
                    >
                      <option value="">Sin grupo</option>
                      {goalGroups.map(g => (
                        <option key={g.id} value={g.id}>{g.name}</option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-xs text-slate-600">—</span>
                  )}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
