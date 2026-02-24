// src/components/goals/admin/GoalGroupManager.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Layers,
  Plus,
  Edit2,
  Trash2,
  Users,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import GoalGroupEditor from './GoalGroupEditor'

// ════════════════════════════════════════════════════════════════════════════
// TIPOS
// ════════════════════════════════════════════════════════════════════════════

interface GoalGroup {
  id: string
  name: string
  code: string
  weightBusiness: number
  weightLeader: number
  weightNPS: number
  weightSpecific: number
  isDefault: boolean
  _count: { jobConfigs: number }
}

// ════════════════════════════════════════════════════════════════════════════
// WEIGHT BAR
// ════════════════════════════════════════════════════════════════════════════

function WeightBar({ label, value, color }: { label: string; value: number; color: string }) {
  const colorClasses: Record<string, string> = {
    amber: 'bg-amber-500',
    purple: 'bg-purple-500',
    cyan: 'bg-cyan-500',
    emerald: 'bg-emerald-500',
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-slate-400 w-16">{label}</span>
      <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full ${colorClasses[color]} transition-all`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-xs text-white w-8 text-right">{value}%</span>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════

export default function GoalGroupManager() {
  const [groups, setGroups] = useState<GoalGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingGroup, setEditingGroup] = useState<GoalGroup | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  // ──────────────────────────────────────────────────────────────────────
  // CARGA
  // ──────────────────────────────────────────────────────────────────────

  const loadGroups = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch('/api/config/goal-groups')
      if (!res.ok) throw new Error('Error cargando grupos')
      const json = await res.json()
      setGroups(json.data || [])
    } catch (err: any) {
      setError(err.message || 'Error de conexión')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadGroups()
  }, [loadGroups])

  // ──────────────────────────────────────────────────────────────────────
  // HANDLERS
  // ──────────────────────────────────────────────────────────────────────

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este grupo de ponderación?')) return
    try {
      const res = await fetch(`/api/config/goal-groups/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const json = await res.json()
        alert(json.error || 'Error eliminando grupo')
        return
      }
      loadGroups()
    } catch {
      alert('Error de conexión')
    }
  }

  const handleSaved = () => {
    setIsCreating(false)
    setEditingGroup(null)
    loadGroups()
  }

  // ──────────────────────────────────────────────────────────────────────
  // RENDER
  // ──────────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
        <span className="ml-3 text-slate-400">Cargando grupos...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20">
            <Layers className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-xl text-white font-medium">Grupos de Ponderación</h2>
            <p className="text-slate-400 text-sm">
              Define qué porcentaje de cada tipo de meta aplica según el nivel del cargo
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="fhr-btn fhr-btn-primary flex items-center gap-2 px-4 py-2"
        >
          <Plus className="w-4 h-4" />
          Nuevo Grupo
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
      {groups.length === 0 ? (
        <div className="fhr-card p-12 text-center">
          <Layers className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-white text-lg mb-2">Sin grupos configurados</h3>
          <p className="text-slate-400 mb-6">
            Crea tu primer grupo de ponderación para definir cómo se distribuyen las metas
          </p>
          <button
            onClick={() => setIsCreating(true)}
            className="fhr-btn fhr-btn-primary px-6 py-2"
          >
            Crear Primer Grupo
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map((group, idx) => (
            <motion.div
              key={group.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="fhr-card p-5 hover:border-cyan-500/30 transition-colors"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-white font-medium">{group.name}</h3>
                  <span className="text-xs text-slate-500 font-mono">{group.code}</span>
                  {group.isDefault && (
                    <span className="ml-2 text-xs text-cyan-400">(default)</span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setEditingGroup(group)}
                    className="p-2 text-slate-400 hover:text-cyan-400 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(group.id)}
                    className="p-2 text-slate-400 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Barras de pesos */}
              <div className="space-y-3">
                <WeightBar label="Negocio" value={group.weightBusiness} color="amber" />
                <WeightBar label="Líder" value={group.weightLeader} color="purple" />
                <WeightBar label="NPS" value={group.weightNPS} color="cyan" />
                <WeightBar label="Específica" value={group.weightSpecific} color="emerald" />
              </div>

              {/* Footer */}
              <div className="mt-4 pt-4 border-t border-slate-700/50 flex items-center gap-2 text-sm text-slate-400">
                <Users className="w-4 h-4" />
                <span>{group._count.jobConfigs} niveles de cargo</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* MODAL EDITOR */}
      {(isCreating || editingGroup) && (
        <GoalGroupEditor
          group={editingGroup}
          onClose={() => {
            setIsCreating(false)
            setEditingGroup(null)
          }}
          onSave={handleSaved}
        />
      )}
    </div>
  )
}
