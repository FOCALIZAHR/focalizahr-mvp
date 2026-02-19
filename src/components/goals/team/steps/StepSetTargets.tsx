// ════════════════════════════════════════════════════════════════════════════
// STEP 3: SET TARGETS - Personalizar targets individuales
// src/components/goals/team/steps/StepSetTargets.tsx
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { memo, useCallback } from 'react'
import { Target } from 'lucide-react'
import type { BulkAssignData } from '../BulkAssignWizard'

// ════════════════════════════════════════════════════════════════════════════
// PROPS
// ════════════════════════════════════════════════════════════════════════════

interface StepSetTargetsProps {
  data: BulkAssignData
  updateData: (updates: Partial<BulkAssignData>) => void
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE
// ════════════════════════════════════════════════════════════════════════════

export default memo(function StepSetTargets({
  data,
  updateData,
}: StepSetTargetsProps) {
  const handleTargetChange = useCallback((employeeId: string, targetValue: number) => {
    updateData({
      targets: {
        ...data.targets,
        [employeeId]: {
          ...(data.targets[employeeId] || { unit: '%' }),
          targetValue,
        },
      },
    })
  }, [data.targets, updateData])

  const handleUnitChange = useCallback((employeeId: string, unit: string) => {
    updateData({
      targets: {
        ...data.targets,
        [employeeId]: {
          ...(data.targets[employeeId] || { targetValue: 100 }),
          unit,
        },
      },
    })
  }, [data.targets, updateData])

  return (
    <div className="space-y-6">
      <div className="text-center mb-4">
        <h3 className="text-lg text-white font-medium">Personalizar targets</h3>
        <p className="text-sm text-slate-400 mt-1">
          Define el objetivo específico de cada colaborador
        </p>
      </div>

      <div className="space-y-3">
        {data.employees.map(emp => {
          if (!data.employeeIds.includes(emp.id)) return null
          const target = data.targets[emp.id] || { targetValue: 100, unit: '%' }

          return (
            <div
              key={emp.id}
              className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center flex-shrink-0">
                  <Target className="w-4 h-4 text-cyan-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-white text-sm font-medium truncate">{emp.fullName}</p>
                  <p className="text-xs text-slate-400 truncate">{emp.position}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="text-xs text-slate-500 mb-1 block">Target</label>
                  <input
                    type="number"
                    value={target.targetValue || ''}
                    onChange={e => handleTargetChange(emp.id, parseFloat(e.target.value) || 0)}
                    placeholder="100"
                    className="fhr-input w-full"
                    min={0}
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Unidad</label>
                  <select
                    value={target.unit}
                    onChange={e => handleUnitChange(emp.id, e.target.value)}
                    className="fhr-input w-full"
                  >
                    <option value="%">%</option>
                    <option value="USD">USD</option>
                    <option value="CLP">CLP</option>
                    <option value="unidades">Unidades</option>
                    <option value="clientes">Clientes</option>
                    <option value="tickets">Tickets</option>
                  </select>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
})
