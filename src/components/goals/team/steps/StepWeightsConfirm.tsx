// ════════════════════════════════════════════════════════════════════════════
// STEP 4: WEIGHTS & CONFIRM - Pesos y confirmación final
// src/components/goals/team/steps/StepWeightsConfirm.tsx
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { memo, useCallback, useMemo } from 'react'
import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import { formatDisplayName } from '@/lib/utils/formatName'
import type { BulkAssignData, EmployeeWithStatus } from '../BulkAssignWizard'

// ════════════════════════════════════════════════════════════════════════════
// PROPS
// ════════════════════════════════════════════════════════════════════════════

interface StepWeightsConfirmProps {
  data: BulkAssignData
  updateData: (updates: Partial<BulkAssignData>) => void
  employeesWithStatus: EmployeeWithStatus[]
  isLoadingStatus: boolean
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE
// ════════════════════════════════════════════════════════════════════════════

export default memo(function StepWeightsConfirm({
  data,
  updateData,
  employeesWithStatus,
  isLoadingStatus,
}: StepWeightsConfirmProps) {
  const handleWeightChange = useCallback((employeeId: string, weight: number) => {
    updateData({
      weights: {
        ...data.weights,
        [employeeId]: Math.min(100, Math.max(0, weight)),
      },
    })
  }, [data.weights, updateData])

  // Calcular peso disponible por persona
  const getAvailableWeight = useCallback((employeeId: string) => {
    const emp = employeesWithStatus.find(e => e.id === employeeId)
    if (!emp?.assignmentStatus) return 100
    return 100 - emp.assignmentStatus.totalWeight
  }, [employeesWithStatus])

  // Check if any weight exceeds available
  const hasWeightWarning = useMemo(() => {
    return data.employeeIds.some(id => {
      const assigned = data.weights[id] || 0
      const available = getAvailableWeight(id)
      return assigned > available
    })
  }, [data.weights, data.employeeIds, getAvailableWeight])

  const goalTitle = data.goalSource === 'cascade'
    ? data.parentGoalTitle
    : data.newGoalTitle

  return (
    <div className="space-y-6">
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
            Algún peso supera el disponible. Verifica que la suma de pesos sea correcta.
          </p>
        </div>
      )}

      {/* Weight per employee */}
      <div className="space-y-3">
        {data.employees.map(emp => {
          if (!data.employeeIds.includes(emp.id)) return null
          const weight = data.weights[emp.id] ?? 0
          const target = data.targets[emp.id]
          const available = getAvailableWeight(emp.id)
          const exceeded = weight > available

          return (
            <div
              key={emp.id}
              className={`p-4 rounded-xl bg-slate-800/50 border ${exceeded ? 'border-red-500/50' : 'border-slate-700/50'}`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="min-w-0">
                  <p className="text-white text-sm font-medium truncate">{formatDisplayName(emp.fullName, 'short')}</p>
                  <p className="text-xs text-slate-400">
                    Target: {target?.targetValue || 100} {target?.unit || '%'}
                  </p>
                </div>
                <div className="text-right flex-shrink-0 ml-2">
                  <span className="text-sm text-cyan-400 font-medium">
                    {weight}%
                  </span>
                  {!isLoadingStatus && (
                    <p className={`text-xs ${exceeded ? 'text-red-400' : 'text-slate-500'}`}>
                      Disponible: {available}%
                    </p>
                  )}
                </div>
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
                  className={`fhr-input w-16 text-center text-sm ${exceeded ? 'border-red-500' : ''}`}
                />
              </div>

              {exceeded && (
                <p className="text-xs text-red-400 mt-2">Excede el peso disponible</p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
})
