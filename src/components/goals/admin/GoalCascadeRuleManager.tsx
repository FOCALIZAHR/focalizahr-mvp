// src/components/goals/admin/GoalCascadeRuleManager.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Workflow,
  Plus,
  Play,
  Eye,
  Trash2,
  Users,
  Target,
  Loader2,
  AlertCircle,
  X,
} from 'lucide-react'
import CascadeRuleBuilder from './CascadeRuleBuilder'

// ════════════════════════════════════════════════════════════════════════════
// TIPOS
// ════════════════════════════════════════════════════════════════════════════

interface CascadeRule {
  id: string
  name: string
  description: string | null
  sourceGoal: { id: string; title: string; level: string } | null
  targetGroup: { id: string; name: string } | null
  assignedWeight: number
  isLeaderOnly: boolean
  executionCount: number
  lastExecutedAt: string | null
}

interface PreviewData {
  rule: { id: string; name: string; sourceGoal: { title: string } }
  affectedEmployees: Array<{
    id: string
    fullName: string
    standardJobLevel: string | null
    alreadyHasGoal: boolean
  }>
  toCreate: number
  toSkip: number
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════

export default function GoalCascadeRuleManager() {
  const [rules, setRules] = useState<CascadeRule[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [previewData, setPreviewData] = useState<PreviewData | null>(null)
  const [executing, setExecuting] = useState<string | null>(null)

  // ──────────────────────────────────────────────────────────────────────
  // CARGA
  // ──────────────────────────────────────────────────────────────────────

  const loadRules = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch('/api/config/goal-rules')
      if (!res.ok) throw new Error('Error cargando reglas')
      const json = await res.json()
      setRules(json.data || [])
    } catch (err: any) {
      setError(err.message || 'Error de conexión')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadRules()
  }, [loadRules])

  // ──────────────────────────────────────────────────────────────────────
  // HANDLERS
  // ──────────────────────────────────────────────────────────────────────

  const handlePreview = async (ruleId: string) => {
    try {
      const res = await fetch(`/api/config/goal-rules/${ruleId}/preview`)
      if (!res.ok) throw new Error('Error obteniendo preview')
      const json = await res.json()
      setPreviewData(json.data)
    } catch (err: any) {
      alert(err.message || 'Error obteniendo preview')
    }
  }

  const handleExecute = async (ruleId: string) => {
    if (!confirm('¿Ejecutar esta regla? Se crearán metas para los empleados elegibles.')) return

    setExecuting(ruleId)
    try {
      const res = await fetch(`/api/config/goal-rules/${ruleId}/execute`, { method: 'POST' })
      const result = await res.json()

      if (result.success) {
        alert(`${result.data.created} metas creadas, ${result.data.skipped} omitidas`)
        loadRules()
      } else {
        alert(result.error || 'Error ejecutando regla')
      }
    } catch {
      alert('Error de conexión')
    } finally {
      setExecuting(null)
    }
  }

  const handleDelete = async (ruleId: string) => {
    if (!confirm('¿Eliminar esta regla de cascada?')) return
    try {
      const res = await fetch(`/api/config/goal-rules/${ruleId}`, { method: 'DELETE' })
      if (res.ok) loadRules()
    } catch {
      alert('Error eliminando regla')
    }
  }

  // ──────────────────────────────────────────────────────────────────────
  // RENDER
  // ──────────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
        <span className="ml-3 text-slate-400">Cargando reglas...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20">
            <Workflow className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-xl text-white font-medium">Reglas de Cascada</h2>
            <p className="text-slate-400 text-sm">
              Automatiza la asignación de metas corporativas a empleados
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="fhr-btn fhr-btn-primary flex items-center gap-2 px-4 py-2"
        >
          <Plus className="w-4 h-4" />
          Nueva Regla
        </button>
      </div>

      {/* ERROR */}
      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* LISTA */}
      {rules.length === 0 ? (
        <div className="fhr-card p-12 text-center">
          <Workflow className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-white text-lg mb-2">Sin reglas configuradas</h3>
          <p className="text-slate-400 mb-6">
            Crea tu primera regla para automatizar la asignación de metas
          </p>
          <button
            onClick={() => setIsCreating(true)}
            className="fhr-btn fhr-btn-primary px-6 py-2"
          >
            Crear Primera Regla
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {rules.map((rule, idx) => (
            <motion.div
              key={rule.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="fhr-card p-5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-amber-500/10">
                    <Target className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-medium">{rule.name}</h3>
                    <p className="text-sm text-slate-400">
                      {rule.sourceGoal?.title || 'Meta origen'} →{' '}
                      {rule.targetGroup?.name || 'Todos elegibles'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {rule.lastExecutedAt && (
                    <span className="text-xs text-slate-500">
                      Última: {new Date(rule.lastExecutedAt).toLocaleDateString()}
                    </span>
                  )}
                  <button
                    onClick={() => handlePreview(rule.id)}
                    className="fhr-btn fhr-btn-ghost px-3 py-1.5 text-sm flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Preview
                  </button>
                  <button
                    onClick={() => handleExecute(rule.id)}
                    disabled={executing === rule.id}
                    className="fhr-btn fhr-btn-secondary px-3 py-1.5 text-sm flex items-center gap-1 disabled:opacity-50"
                  >
                    {executing === rule.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Play className="w-3.5 h-3.5" />
                    )}
                    {executing === rule.id ? 'Ejecutando...' : 'Ejecutar'}
                  </button>
                  <button
                    onClick={() => handleDelete(rule.id)}
                    className="p-2 text-slate-400 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Info adicional */}
              <div className="mt-4 pt-4 border-t border-slate-700/50 flex items-center gap-6 text-sm">
                <span className="flex items-center gap-2 text-slate-400">
                  <Users className="w-4 h-4" />
                  {rule.isLeaderOnly ? 'Solo líderes' : 'Todos elegibles'}
                </span>
                <span className="text-slate-400">
                  Peso: <span className="text-white">{rule.assignedWeight}%</span>
                </span>
                <span className="text-slate-400">
                  Ejecutada: <span className="text-white">{rule.executionCount} veces</span>
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* PREVIEW MODAL */}
      {previewData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-2xl fhr-card p-6 max-h-[80vh] overflow-auto"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl text-white font-medium">
                Preview: {previewData.rule.name}
              </h2>
              <button
                onClick={() => setPreviewData(null)}
                className="p-2 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-4 bg-emerald-500/10 rounded-lg text-center">
                <div className="text-3xl font-light text-emerald-400">{previewData.toCreate}</div>
                <div className="text-sm text-slate-400">Se crearán</div>
              </div>
              <div className="p-4 bg-slate-700/50 rounded-lg text-center">
                <div className="text-3xl font-light text-slate-400">{previewData.toSkip}</div>
                <div className="text-sm text-slate-500">Ya tienen meta</div>
              </div>
            </div>

            <div className="space-y-2 max-h-60 overflow-auto">
              {previewData.affectedEmployees.map((emp) => (
                <div
                  key={emp.id}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    emp.alreadyHasGoal
                      ? 'bg-slate-800/50'
                      : 'bg-emerald-500/5 border border-emerald-500/20'
                  }`}
                >
                  <div>
                    <span className="text-white">{emp.fullName}</span>
                    <span className="text-xs text-slate-500 ml-2">
                      {emp.standardJobLevel || 'Sin nivel'}
                    </span>
                  </div>
                  <span
                    className={`text-xs ${
                      emp.alreadyHasGoal ? 'text-slate-500' : 'text-emerald-400'
                    }`}
                  >
                    {emp.alreadyHasGoal ? 'Ya tiene' : 'Se creará'}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setPreviewData(null)}
                className="fhr-btn fhr-btn-ghost px-4 py-2"
              >
                Cerrar
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* CREAR MODAL */}
      {isCreating && (
        <CascadeRuleBuilder
          onClose={() => setIsCreating(false)}
          onSave={() => {
            setIsCreating(false)
            loadRules()
          }}
        />
      )}
    </div>
  )
}
