// ════════════════════════════════════════════════════════════════════════════
// STEP 4: WEIGHTS & CONFIRM - Pesos y confirmación final
// src/components/goals/team/steps/StepWeightsConfirm.tsx
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { memo, useCallback, useMemo } from 'react'
import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import type { BulkAssignData } from '../BulkAssignWizard'

// ════════════════════════════════════════════════════════════════════════════
// PROPS
// ════════════════════════════════════════════════════════════════════════════

interface StepWeightsConfirmProps {
  data: BulkAssignData
  updateData: (updates: Partial<BulkAssignData>) => void
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE
// ════════════════════════════════════════════════════════════════════════════

export default memo(function StepWeightsConfirm({
  data,
  updateData,
}: StepWeightsConfirmProps) {
  const handleWeightChange = useCallback((employeeId: string, weight: number) => {
    updateData({
      weights: {
        ...data.weights,
        [employeeId]: Math.min(100, Math.max(0, weight)),
      },
    })
  }, [data.weights, updateData])

  // Check if any weight exceeds 100%
  const hasWeightWarning = useMemo(() => {
    return Object.values(data.weights).some(w => w > 100)
  }, [data.weights])

  const goalTitle = data.goalSource === 'cascade'
    ? data.parentGoalTitle
    : data.newGoalTitle

  return (
    <div className="space-y-6">
      <div className="text-center mb-4">
        <h3 className="text-lg text-white font-medium">Pesos y confirmación</h3>
        <p className="text-sm text-slate-400 mt-1">
          Define el peso de esta meta para cada colaborador
        </p>
      </div>

      {/* Summary */}
      <div className="p-4 rounded-xl bg-cyan-500/5 border border-cyan-500/20">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-white text-sm font-medium">Meta a asignar</p>
            <p className="text-cyan-400 text-sm mt-1 truncate">
              {goalTitle || 'Sin nombre'}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Se asignará a {data.employeeIds.length} {data.employeeIds.length === 1 ? 'persona' : 'personas'}
            </p>
          </div>
        </div>
      </div>

      {/* Weight warning */}
      {hasWeightWarning && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <p className="text-xs text-amber-400">
            Algún peso supera 100%. Verifica que la suma de pesos de las metas sea correcta.
          </p>
        </div>
      )}

      {/* Weight per employee */}
      <div className="space-y-3">
        {data.employees.map(emp => {
          if (!data.employeeIds.includes(emp.id)) return null
          const weight = data.weights[emp.id] ?? 0
          const target = data.targets[emp.id]

          return (
            <div
              key={emp.id}
              className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="min-w-0">
                  <p className="text-white text-sm font-medium truncate">{emp.fullName}</p>
                  <p className="text-xs text-slate-400">
                    Target: {target?.targetValue || 100} {target?.unit || '%'}
                  </p>
                </div>
                <span className="text-sm text-cyan-400 font-medium flex-shrink-0 ml-2">
                  {weight}%
                </span>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={weight}
                  onChange={e => handleWeightChange(emp.id, parseInt(e.target.value))}
                  className="flex-1 accent-cyan-500 h-2"
                />
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={weight}
                  onChange={e => handleWeightChange(emp.id, parseInt(e.target.value) || 0)}
                  className="fhr-input w-16 text-center text-sm"
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
})
