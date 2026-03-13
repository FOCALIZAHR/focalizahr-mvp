'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ChevronUp, Sparkles, Target, Eye, EyeOff } from 'lucide-react'
import { useToast } from '@/components/ui/toast-system'

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

interface Goal {
  id: string
  competencyCode: string
  title: string
  description: string | null
  targetOutcome: string
  action: string | null
  category: string
  priority: string
  status: string
  progressPercent: number
  startDate: string
  targetDate: string
  completedAt: string | null
  suggestedResources: any
  aiGenerated: boolean
}

interface Plan {
  id: string
  status: string
  visibleToDirectManager: boolean
  managerCanEditProgress: boolean
  includeInEmployeeReport: boolean
  aiSuggestionsUsed: boolean
  createdAt: string
  agreedAt: string | null
  completedAt: string | null
  goals: Goal[]
}

interface SuccessionPlanPanelProps {
  candidateId: string
  canManage?: boolean
}

// ════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ════════════════════════════════════════════════════════════════════════════

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  ALTA:  { label: 'Alta',  color: 'bg-rose-500/20 text-rose-400 border-rose-500/30' },
  MEDIA: { label: 'Media', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  BAJA:  { label: 'Baja',  color: 'bg-slate-500/20 text-slate-400 border-slate-500/30' },
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  NOT_STARTED:  { label: 'Sin iniciar',   color: 'bg-slate-500/20 text-slate-400 border-slate-500/30' },
  IN_PROGRESS:  { label: 'En progreso',   color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
  ON_TRACK:     { label: 'En camino',     color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  AT_RISK:      { label: 'En riesgo',     color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  COMPLETED:    { label: 'Completado',    color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  CANCELLED:    { label: 'Cancelado',     color: 'bg-slate-500/20 text-slate-400 border-slate-500/30' },
}

const PLAN_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  DRAFT:        { label: 'Borrador',      color: 'bg-slate-500/20 text-slate-400 border-slate-500/30' },
  ACTIVE:       { label: 'Activo',        color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
  IN_PROGRESS:  { label: 'En progreso',   color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  COMPLETED:    { label: 'Completado',    color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  CANCELLED:    { label: 'Cancelado',     color: 'bg-slate-500/20 text-slate-400 border-slate-500/30' },
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ════════════════════════════════════════════════════════════════════════════

export default function SuccessionPlanPanel({ candidateId, canManage = true }: SuccessionPlanPanelProps) {
  const { success: toastSuccess, error: toastError } = useToast()
  const [plan, setPlan] = useState<Plan | null>(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [expandedGoal, setExpandedGoal] = useState<string | null>(null)
  const [savingGoal, setSavingGoal] = useState<string | null>(null)

  const fetchPlan = useCallback(async () => {
    try {
      const res = await fetch(`/api/succession/candidates/${candidateId}/development-plan`)
      const json = await res.json()
      if (json.success) {
        setPlan(json.data)
      }
    } catch (err) {
      console.error('[SuccessionPlanPanel] Error fetching plan:', err)
    } finally {
      setLoading(false)
    }
  }, [candidateId])

  useEffect(() => { fetchPlan() }, [fetchPlan])

  async function handleCreate() {
    setCreating(true)
    try {
      const res = await fetch(`/api/succession/candidates/${candidateId}/development-plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        toastError(json.error || 'Error al crear plan', 'Error')
        return
      }
      toastSuccess(`Plan creado con ${json.data.goalsCount} objetivos`, 'Plan generado')
      await fetchPlan()
    } catch {
      toastError('Error de conexion', 'Error')
    } finally {
      setCreating(false)
    }
  }

  async function handleUpdateGoal(goalId: string, updates: { status?: string; progressPercent?: number }) {
    const prevPlan = plan // snapshot for rollback
    setSavingGoal(goalId)
    try {
      const res = await fetch(`/api/succession/candidates/${candidateId}/development-plan`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goals: [{ id: goalId, ...updates }] }),
      })
      const json = await res.json()
      if (json.success && json.data) {
        setPlan(json.data)
      } else {
        setPlan(prevPlan) // rollback
        toastError(json.error || 'Error al actualizar', 'Error')
      }
    } catch {
      setPlan(prevPlan) // rollback
      toastError('Error de conexión', 'Error')
    } finally {
      setSavingGoal(null)
    }
  }

  async function handleToggleVisibility(field: 'visibleToDirectManager' | 'managerCanEditProgress' | 'includeInEmployeeReport') {
    if (!plan) return
    try {
      const res = await fetch(`/api/succession/candidates/${candidateId}/development-plan`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: !plan[field] }),
      })
      const json = await res.json()
      if (json.success && json.data) {
        setPlan(json.data)
      }
    } catch {
      toastError('Error al actualizar visibilidad', 'Error')
    }
  }

  // ── Loading state ──
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-5 h-5 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
      </div>
    )
  }

  // ── Empty state ──
  if (!plan) {
    return (
      <div className="text-center py-10 space-y-4">
        <div className="w-14 h-14 mx-auto rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
          <Target className="w-7 h-7 text-purple-400" />
        </div>
        <div>
          <p className="text-sm text-slate-300 font-medium">Sin plan de desarrollo</p>
          <p className="text-xs text-slate-500 mt-1">
            Genera un plan basado en las brechas detectadas con IA
          </p>
        </div>
        {canManage && (
          <button
            onClick={handleCreate}
            disabled={creating}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-50"
            style={{
              background: 'linear-gradient(135deg, #A78BFA, #7C3AED)',
              color: '#fff',
              boxShadow: '0 4px 15px rgba(167,139,250,0.3)',
            }}
          >
            {creating ? (
              <span className="animate-pulse">Generando...</span>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generar Plan con IA
              </>
            )}
          </button>
        )}
      </div>
    )
  }

  // ── Plan exists ──
  const planStatus = PLAN_STATUS_CONFIG[plan.status] || PLAN_STATUS_CONFIG.DRAFT
  const completedGoals = plan.goals.filter(g => g.status === 'COMPLETED').length
  const totalGoals = plan.goals.length
  const overallProgress = totalGoals > 0
    ? Math.round(plan.goals.reduce((sum, g) => sum + g.progressPercent, 0) / totalGoals)
    : 0

  return (
    <div className="space-y-4">
      {/* ─── Header: Status + Progress ─── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${planStatus.color}`}>
            {planStatus.label}
          </span>
          {plan.aiSuggestionsUsed && (
            <span className="text-[10px] text-purple-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> AI
            </span>
          )}
        </div>
        <span className="text-xs text-slate-400">
          {completedGoals}/{totalGoals} completados
        </span>
      </div>

      {/* ─── Overall progress bar ─── */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider">Progreso general</span>
          <span className="text-xs text-cyan-400 font-mono">{overallProgress}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${overallProgress}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, #22D3EE, #A78BFA)' }}
          />
        </div>
      </div>

      {/* ─── Goals list ─── */}
      <div className="space-y-2">
        {plan.goals.map((goal, i) => {
          const pCfg = PRIORITY_CONFIG[goal.priority] || PRIORITY_CONFIG.MEDIA
          const sCfg = STATUS_CONFIG[goal.status] || STATUS_CONFIG.NOT_STARTED
          const isExpanded = expandedGoal === goal.id
          const isSaving = savingGoal === goal.id

          return (
            <motion.div
              key={goal.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-slate-800/40 border border-slate-700/30 rounded-xl overflow-hidden"
            >
              {/* Goal header */}
              <button
                onClick={() => setExpandedGoal(isExpanded ? null : goal.id)}
                className="w-full p-3 flex items-start gap-3 text-left hover:bg-slate-800/60 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium leading-snug">{goal.title}</p>
                  <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full border ${pCfg.color}`}>
                      {pCfg.label}
                    </span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full border ${sCfg.color}`}>
                      {sCfg.label}
                    </span>
                    {goal.aiGenerated && (
                      <Sparkles className="w-3 h-3 text-purple-400/60" />
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs text-slate-400 font-mono">{goal.progressPercent}%</span>
                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-slate-500" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-500" />}
                </div>
              </button>

              {/* Progress bar */}
              <div className="px-3 pb-1">
                <div className="h-1 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-cyan-500/60 transition-all duration-300"
                    style={{ width: `${goal.progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Expanded details */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-3 pb-3 space-y-2 border-t border-slate-700/20 pt-2">
                      {goal.description && (
                        <div>
                          <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">Descripcion</p>
                          <p className="text-xs text-slate-300 leading-relaxed">{goal.description}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">Resultado esperado</p>
                        <p className="text-xs text-slate-300 leading-relaxed">{goal.targetOutcome}</p>
                      </div>
                      {goal.action && (
                        <div>
                          <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">Coaching</p>
                          <p className="text-xs text-slate-400 italic leading-relaxed">{goal.action}</p>
                        </div>
                      )}

                      {/* Progress controls */}
                      {canManage && goal.status !== 'COMPLETED' && goal.status !== 'CANCELLED' && (
                        <div className="pt-2 space-y-2">
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] text-slate-500 flex-shrink-0">Progreso</span>
                            <input
                              type="range"
                              min={0}
                              max={100}
                              step={5}
                              value={goal.progressPercent}
                              disabled={isSaving}
                              onChange={(e) => {
                                const val = Number(e.target.value)
                                setPlan(prev => prev ? {
                                  ...prev,
                                  goals: prev.goals.map(g => g.id === goal.id ? { ...g, progressPercent: val } : g),
                                } : prev)
                              }}
                              onMouseUp={(e) => {
                                handleUpdateGoal(goal.id, { progressPercent: Number((e.target as HTMLInputElement).value) })
                              }}
                              onTouchEnd={(e) => {
                                handleUpdateGoal(goal.id, { progressPercent: Number((e.currentTarget as HTMLInputElement).value) })
                              }}
                              className="flex-1 accent-cyan-500 h-1 disabled:opacity-50"
                            />
                            <span className="text-xs text-cyan-400 font-mono w-8 text-right">{goal.progressPercent}%</span>
                          </div>
                          <div className="flex gap-1.5">
                            {['IN_PROGRESS', 'ON_TRACK', 'AT_RISK', 'COMPLETED'].map(s => {
                              const cfg = STATUS_CONFIG[s]
                              return (
                                <button
                                  key={s}
                                  onClick={() => handleUpdateGoal(goal.id, { status: s, progressPercent: s === 'COMPLETED' ? 100 : undefined })}
                                  disabled={isSaving || goal.status === s}
                                  className={`text-[9px] px-2 py-0.5 rounded-full border transition-all ${
                                    goal.status === s ? cfg.color + ' opacity-100' : 'border-slate-700 text-slate-500 hover:text-slate-300'
                                  } disabled:opacity-30`}
                                >
                                  {cfg.label}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )
        })}
      </div>

      {/* ─── Visibility toggles ─── */}
      {canManage && (
        <div className="border-t border-slate-800/50 pt-3 space-y-2">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Eye className="w-3 h-3" /> Visibilidad
          </p>
          {[
            { field: 'visibleToDirectManager' as const, label: 'Visible para jefe directo' },
            { field: 'managerCanEditProgress' as const, label: 'Jefe puede editar progreso', depends: 'visibleToDirectManager' as const },
            { field: 'includeInEmployeeReport' as const, label: 'Incluir en reporte del colaborador' },
          ].map(({ field, label, depends }) => {
            const disabled = depends ? !plan[depends] : false
            return (
              <label
                key={field}
                className={`flex items-center gap-2 cursor-pointer ${disabled ? 'opacity-40 pointer-events-none' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={plan[field]}
                  onChange={() => handleToggleVisibility(field)}
                  className="w-3.5 h-3.5 rounded border-slate-600 bg-slate-800 text-cyan-500 focus:ring-cyan-500/30 accent-cyan-500"
                />
                <span className="text-xs text-slate-300">{label}</span>
                {plan[field] ? <Eye className="w-3 h-3 text-cyan-400" /> : <EyeOff className="w-3 h-3 text-slate-600" />}
              </label>
            )
          })}
        </div>
      )}
    </div>
  )
}
