// ════════════════════════════════════════════════════════════════════════════
// STEP 1: CONFIRM SELECTION - Confirmar colaboradores seleccionados
// src/components/goals/team/steps/StepConfirmSelection.tsx
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { memo, useCallback } from 'react'
import { X } from 'lucide-react'
import { formatDisplayName } from '@/lib/utils/formatName'
import type { BulkAssignData } from '../BulkAssignWizard'

// ════════════════════════════════════════════════════════════════════════════
// PROPS
// ════════════════════════════════════════════════════════════════════════════

interface StepConfirmSelectionProps {
  data: BulkAssignData
  removeEmployee: (id: string) => void
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE
// ════════════════════════════════════════════════════════════════════════════

export default memo(function StepConfirmSelection({
  data,
  removeEmployee,
}: StepConfirmSelectionProps) {
  const handleRemove = useCallback((id: string) => {
    if (data.employeeIds.length > 1) {
      removeEmployee(id)
    }
  }, [removeEmployee, data.employeeIds.length])

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {data.employees.map(emp => (
          <div
            key={emp.id}
            className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700/50"
          >
            <div className="min-w-0">
              <p className="text-white text-sm font-medium truncate">{formatDisplayName(emp.fullName, 'short')}</p>
              <p className="text-xs text-slate-400 truncate">{emp.position}</p>
            </div>

            {data.employeeIds.length > 1 && (
              <button
                onClick={() => handleRemove(emp.id)}
                className="p-1 text-slate-500 hover:text-red-400 transition-colors flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
})
