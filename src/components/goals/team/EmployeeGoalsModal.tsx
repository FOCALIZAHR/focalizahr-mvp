// ════════════════════════════════════════════════════════════════════════════
// EMPLOYEE GOALS MODAL - Modal de gestión de metas de un colaborador
// src/components/goals/team/EmployeeGoalsModal.tsx
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { memo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { X, Target, Plus, ExternalLink } from 'lucide-react'
import { useGoals } from '@/hooks/useGoals'
import GoalProgressBar from '../GoalProgressBar'
import { GhostButton, PrimaryButton } from '@/components/ui/PremiumButton'

// ════════════════════════════════════════════════════════════════════════════
// PROPS
// ════════════════════════════════════════════════════════════════════════════

interface EmployeeGoalsModalProps {
  employeeId: string
  onClose: () => void
}

// ════════════════════════════════════════════════════════════════════════════
// STATUS LABELS
// ════════════════════════════════════════════════════════════════════════════

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  NOT_STARTED: { label: 'Sin iniciar', className: 'text-slate-400' },
  ON_TRACK: { label: 'En tiempo', className: 'text-cyan-400' },
  AT_RISK: { label: 'En riesgo', className: 'text-amber-400' },
  BEHIND: { label: 'Atrasada', className: 'text-red-400' },
  COMPLETED: { label: 'Completada', className: 'text-emerald-400' },
  CANCELLED: { label: 'Cancelada', className: 'text-slate-500' },
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE
// ════════════════════════════════════════════════════════════════════════════

export const EmployeeGoalsModal = memo(function EmployeeGoalsModal({
  employeeId,
  onClose,
}: EmployeeGoalsModalProps) {
  const router = useRouter()
  const { goals, isLoading } = useGoals({ employeeId })

  const handleGoalClick = useCallback((goalId: string) => {
    router.push(`/dashboard/metas/${goalId}`)
  }, [router])

  const handleCreateGoal = useCallback(() => {
    router.push(`/dashboard/metas/crear?employeeId=${employeeId}`)
  }, [router, employeeId])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-lg max-h-[85vh] overflow-hidden fhr-card"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/10">
              <Target className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-white font-medium">Metas del colaborador</h2>
              <p className="text-xs text-slate-400">{goals.length} metas asignadas</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto" style={{ maxHeight: 'calc(85vh - 140px)' }}>
          {isLoading ? (
            <div className="space-y-3">
              <div className="fhr-skeleton h-20 rounded-lg" />
              <div className="fhr-skeleton h-20 rounded-lg" />
              <div className="fhr-skeleton h-20 rounded-lg" />
            </div>
          ) : goals.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-14 h-14 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-3">
                <Target className="w-7 h-7 text-slate-600" />
              </div>
              <p className="text-white mb-1">Sin metas asignadas</p>
              <p className="text-sm text-slate-400 mb-4">
                Este colaborador no tiene metas aún
              </p>
              <PrimaryButton icon={Plus} size="sm" onClick={handleCreateGoal}>
                Crear Meta
              </PrimaryButton>
            </div>
          ) : (
            <div className="space-y-3">
              {goals.map(goal => {
                const statusConfig = STATUS_LABELS[goal.status] || STATUS_LABELS.NOT_STARTED
                return (
                  <button
                    key={goal.id}
                    onClick={() => handleGoalClick(goal.id)}
                    className="w-full text-left p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-slate-600 transition-all group"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h4 className="text-white text-sm font-medium line-clamp-2 group-hover:text-cyan-400 transition-colors">
                        {goal.title}
                      </h4>
                      <ExternalLink className="w-4 h-4 text-slate-600 group-hover:text-cyan-400 flex-shrink-0 transition-colors" />
                    </div>

                    <GoalProgressBar
                      progress={goal.progress}
                      status={goal.status}
                      size="sm"
                      className="mb-2"
                    />

                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-medium ${statusConfig.className}`}>
                        {statusConfig.label}
                      </span>
                      {goal.weight > 0 && (
                        <span className="text-xs text-slate-500">
                          Peso: {goal.weight}%
                        </span>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between p-4 border-t border-slate-700">
          <GhostButton size="sm" onClick={onClose}>
            Cerrar
          </GhostButton>
          {goals.length > 0 && (
            <GhostButton size="sm" icon={Plus} onClick={handleCreateGoal}>
              Agregar Meta
            </GhostButton>
          )}
        </div>
      </motion.div>
    </div>
  )
})
