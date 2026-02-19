// ════════════════════════════════════════════════════════════════════════════
// STEP 2: SELECT GOAL - Elegir meta base (cascadear o crear nueva)
// src/components/goals/team/steps/StepSelectGoal.tsx
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { memo, useCallback } from 'react'
import { Link2, Plus, Target } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useGoals } from '@/hooks/useGoals'
import type { BulkAssignData } from '../BulkAssignWizard'

// ════════════════════════════════════════════════════════════════════════════
// PROPS
// ════════════════════════════════════════════════════════════════════════════

interface StepSelectGoalProps {
  data: BulkAssignData
  updateData: (updates: Partial<BulkAssignData>) => void
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE
// ════════════════════════════════════════════════════════════════════════════

export default memo(function StepSelectGoal({
  data,
  updateData,
}: StepSelectGoalProps) {
  const { goals: areaGoals, isLoading } = useGoals({ level: 'AREA' })

  const handleSourceChange = useCallback((source: 'cascade' | 'new') => {
    updateData({
      goalSource: source,
      parentGoalId: undefined,
      parentGoalTitle: undefined,
      newGoalTitle: undefined,
      newGoalDescription: undefined,
    })
  }, [updateData])

  const handleSelectParent = useCallback((goalId: string, goalTitle: string) => {
    updateData({ parentGoalId: goalId, parentGoalTitle: goalTitle })
  }, [updateData])

  return (
    <div className="space-y-6">
      <div className="text-center mb-4">
        <h3 className="text-lg text-white font-medium">Elige la meta base</h3>
        <p className="text-sm text-slate-400 mt-1">
          Cascadea desde una meta existente o crea una nueva
        </p>
      </div>

      {/* Source toggle */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => handleSourceChange('cascade')}
          className={cn(
            'p-4 rounded-xl border-2 text-left transition-all',
            data.goalSource === 'cascade'
              ? 'border-cyan-500 bg-cyan-500/10'
              : 'border-slate-700 bg-slate-800/30 hover:border-slate-600'
          )}
        >
          <Link2 className={cn(
            'w-5 h-5 mb-2',
            data.goalSource === 'cascade' ? 'text-cyan-400' : 'text-slate-500'
          )} />
          <p className="text-white text-sm font-medium">Cascadear</p>
          <p className="text-xs text-slate-400 mt-1">Desde meta de área</p>
        </button>

        <button
          onClick={() => handleSourceChange('new')}
          className={cn(
            'p-4 rounded-xl border-2 text-left transition-all',
            data.goalSource === 'new'
              ? 'border-cyan-500 bg-cyan-500/10'
              : 'border-slate-700 bg-slate-800/30 hover:border-slate-600'
          )}
        >
          <Plus className={cn(
            'w-5 h-5 mb-2',
            data.goalSource === 'new' ? 'text-cyan-400' : 'text-slate-500'
          )} />
          <p className="text-white text-sm font-medium">Crear nueva</p>
          <p className="text-xs text-slate-400 mt-1">Meta independiente</p>
        </button>
      </div>

      {/* Cascade: select parent */}
      {data.goalSource === 'cascade' && (
        <div className="space-y-2">
          <p className="text-sm text-slate-300">Metas de área disponibles:</p>
          {isLoading ? (
            <div className="space-y-2">
              <div className="fhr-skeleton h-14 rounded-lg" />
              <div className="fhr-skeleton h-14 rounded-lg" />
            </div>
          ) : areaGoals.length === 0 ? (
            <div className="p-4 rounded-lg bg-slate-800/50 text-center">
              <p className="text-sm text-slate-400">No hay metas de área disponibles</p>
              <p className="text-xs text-slate-500 mt-1">Crea primero una meta de área para cascadear</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {areaGoals.map(goal => (
                <button
                  key={goal.id}
                  onClick={() => handleSelectParent(goal.id, goal.title)}
                  className={cn(
                    'w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left',
                    data.parentGoalId === goal.id
                      ? 'border-cyan-500 bg-cyan-500/10'
                      : 'border-slate-700 bg-slate-800/30 hover:border-slate-600'
                  )}
                >
                  <Target className={cn(
                    'w-4 h-4 flex-shrink-0',
                    data.parentGoalId === goal.id ? 'text-cyan-400' : 'text-purple-400'
                  )} />
                  <div className="min-w-0">
                    <p className="text-sm text-white truncate">{goal.title}</p>
                    <p className="text-xs text-slate-400">
                      {Math.round(goal.progress)}% avance
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* New: title + description */}
      {data.goalSource === 'new' && (
        <div className="space-y-4">
          <div>
            <label className="fhr-label mb-1.5 block">Nombre de la meta</label>
            <input
              type="text"
              value={data.newGoalTitle || ''}
              onChange={e => updateData({ newGoalTitle: e.target.value })}
              placeholder="Ej: Aumentar ventas Q1"
              className="fhr-input w-full"
            />
          </div>
          <div>
            <label className="fhr-label mb-1.5 block">Descripción (opcional)</label>
            <textarea
              value={data.newGoalDescription || ''}
              onChange={e => updateData({ newGoalDescription: e.target.value })}
              placeholder="Detalla el objetivo y cómo se medirá"
              className="fhr-input w-full min-h-[80px] resize-none"
              rows={3}
            />
          </div>
        </div>
      )}
    </div>
  )
})
