'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Target, Sparkles } from 'lucide-react'
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
  aiGenerated: boolean
}

interface Plan {
  id: string
  status: string
  managerCanEditProgress: boolean
  aiSuggestionsUsed: boolean
  createdAt: string
  goals: Goal[]
  candidate?: {
    criticalPosition?: {
      positionTitle?: string
    }
  }
}

interface SuccessionPlanDrawerProps {
  employeeId: string
  employeeName: string
  isOpen: boolean
  onClose: () => void
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
  NOT_STARTED:  { label: 'Sin iniciar',  color: 'bg-slate-500/20 text-slate-400 border-slate-500/30' },
  IN_PROGRESS:  { label: 'En progreso',  color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
  ON_TRACK:     { label: 'En camino',    color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  AT_RISK:      { label: 'En riesgo',    color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  COMPLETED:    { label: 'Completado',   color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  CANCELLED:    { label: 'Cancelado',    color: 'bg-slate-500/20 text-slate-400 border-slate-500/30' },
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ════════════════════════════════════════════════════════════════════════════

export default function SuccessionPlanDrawer({
  employeeId,
  employeeName,
  isOpen,
  onClose,
}: SuccessionPlanDrawerProps) {
  const { error: toastError } = useToast()
  const [plans, setPlans] = useState<Plan[]>([])
  const [canEditProgress, setCanEditProgress] = useState(false)
  const [loading, setLoading] = useState(true)
  const [savingGoal, setSavingGoal] = useState<string | null>(null)

  const fetchPlans = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/employees/${employeeId}/succession-plan`)
      const json = await res.json()
      if (json.success) {
        setPlans(json.data || [])
        setCanEditProgress(json.canEditProgress || false)
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [employeeId])

  useEffect(() => {
    if (isOpen) fetchPlans()
  }, [isOpen, fetchPlans])

  async function handleUpdateProgress(goalId: string, progressPercent: number) {
    setSavingGoal(goalId)
    try {
      const res = await fetch(`/api/employees/${employeeId}/succession-plan/progress`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goalId, progressPercent }),
      })
      if (!res.ok) {
        toastError('Error al actualizar progreso', 'Error')
        return
      }
      await fetchPlans()
    } catch {
      toastError('Error de conexion', 'Error')
    } finally {
      setSavingGoal(null)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[90]"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-[#0F172A]/98 backdrop-blur-xl border-l border-slate-800 z-[91] overflow-y-auto"
          >
            {/* Tesla line */}
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-purple-400/60 to-transparent" />

            {/* Header */}
            <div className="p-5 border-b border-slate-800/50 flex items-center justify-between sticky top-0 bg-[#0F172A]/95 backdrop-blur-xl z-10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                  <Target className="w-4 h-4 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Plan de Sucesion</h3>
                  <p className="text-xs text-slate-400">{employeeName}</p>
                </div>
              </div>
              <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-5">
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="w-5 h-5 border-2 border-purple-500/30 border-t-purple-400 rounded-full animate-spin" />
                </div>
              ) : plans.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-sm text-slate-500">Sin planes de desarrollo visibles</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {plans.map(plan => {
                    const positionTitle = plan.candidate?.criticalPosition?.positionTitle
                    const overallProgress = plan.goals.length > 0
                      ? Math.round(plan.goals.reduce((s, g) => s + g.progressPercent, 0) / plan.goals.length)
                      : 0

                    return (
                      <div key={plan.id} className="space-y-3">
                        {positionTitle && (
                          <p className="text-xs text-slate-400">
                            Preparacion para: <span className="text-white font-medium">{positionTitle}</span>
                          </p>
                        )}

                        {/* Progress */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] text-slate-500 uppercase tracking-wider">Progreso</span>
                            <span className="text-xs text-purple-400 font-mono">{overallProgress}%</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{ width: `${overallProgress}%`, background: 'linear-gradient(90deg, #A78BFA, #7C3AED)' }}
                            />
                          </div>
                        </div>

                        {/* Goals */}
                        <div className="space-y-2">
                          {plan.goals.map(goal => {
                            const pCfg = PRIORITY_CONFIG[goal.priority] || PRIORITY_CONFIG.MEDIA
                            const sCfg = STATUS_CONFIG[goal.status] || STATUS_CONFIG.NOT_STARTED
                            return (
                              <div key={goal.id} className="bg-slate-800/40 border border-slate-700/30 rounded-xl p-3 space-y-2">
                                <div className="flex items-start justify-between gap-2">
                                  <p className="text-sm text-white font-medium leading-snug flex-1">{goal.title}</p>
                                  <div className="flex gap-1 flex-shrink-0">
                                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full border ${pCfg.color}`}>{pCfg.label}</span>
                                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full border ${sCfg.color}`}>{sCfg.label}</span>
                                  </div>
                                </div>

                                <p className="text-xs text-slate-400 leading-relaxed">{goal.targetOutcome}</p>

                                {/* Progress bar */}
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 h-1 rounded-full bg-slate-800 overflow-hidden">
                                    <div
                                      className="h-full rounded-full bg-purple-500/60 transition-all duration-300"
                                      style={{ width: `${goal.progressPercent}%` }}
                                    />
                                  </div>
                                  <span className="text-[10px] text-slate-400 font-mono">{goal.progressPercent}%</span>
                                </div>

                                {/* Manager progress editing */}
                                {canEditProgress && goal.status !== 'COMPLETED' && goal.status !== 'CANCELLED' && (
                                  <div className="flex items-center gap-2 pt-1">
                                    <input
                                      type="range"
                                      min={0}
                                      max={100}
                                      step={5}
                                      defaultValue={goal.progressPercent}
                                      onMouseUp={(e) => handleUpdateProgress(goal.id, Number((e.target as HTMLInputElement).value))}
                                      className="flex-1 accent-purple-500 h-1"
                                      disabled={savingGoal === goal.id}
                                    />
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
