// src/components/goals/cycles/CycleWindowsFields.tsx
// ════════════════════════════════════════════════════════════════════════════
// Campos de ventanas del ciclo (asignación / seguimiento / cierre) —
// presentacional puro, compartido por CreateCycleModal (D.3) y
// EditCycleWindowsModal (D.8). 3 date pickers .fhr-* + feedback inline de
// cotas/orden. La validación vive en cycleWindows.ts (fuente única client).
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { Calendar, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  windowBounds,
  validateCycleWindows,
  type CycleWindowValues,
} from './cycleWindows'

type WindowField = keyof CycleWindowValues

interface CycleWindowsFieldsProps {
  year: number
  values: CycleWindowValues
  onChange: (field: WindowField, value: string) => void
}

export default function CycleWindowsFields({
  year,
  values,
  onChange,
}: CycleWindowsFieldsProps) {
  const { assignmentWindow, trackingWindow, closureWindow } = values
  const { assignMin, assignMax, closureMax } = windowBounds(year)
  const v = validateCycleWindows(year, values)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <label className="text-sm text-slate-400 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-500" />
            Asignación
          </label>
          <input
            type="date"
            value={assignmentWindow}
            min={assignMin}
            max={assignMax}
            onChange={(e) => onChange('assignmentWindow', e.target.value)}
            className="fhr-input w-full"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm text-slate-400 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-500" />
            Seguimiento
          </label>
          <input
            type="date"
            value={trackingWindow}
            min={assignmentWindow || undefined}
            max={closureWindow || undefined}
            onChange={(e) => onChange('trackingWindow', e.target.value)}
            className="fhr-input w-full"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm text-slate-400 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-500" />
            Cierre
          </label>
          <input
            type="date"
            value={closureWindow}
            min={assignmentWindow || assignMin}
            max={closureMax}
            onChange={(e) => onChange('closureWindow', e.target.value)}
            className="fhr-input w-full"
          />
        </div>
      </div>

      {/* Indicador de rango asignación → cierre */}
      {v.daysBetween !== null && (
        <div
          className={cn(
            'flex items-center gap-2 p-3 rounded-lg text-sm',
            v.closureAfterAssignment
              ? 'bg-cyan-500/10 text-cyan-400'
              : 'bg-red-500/10 text-red-400'
          )}
        >
          <Clock className="w-4 h-4" />
          {v.closureAfterAssignment
            ? `${v.daysBetween} días de asignación a cierre`
            : 'El cierre debe ser posterior a la asignación'}
        </div>
      )}

      {/* Cota: la asignación arranca dentro del año del ciclo */}
      {assignmentWindow && !v.assignmentInYear && (
        <div className="flex items-center gap-2 p-3 rounded-lg text-sm bg-amber-500/10 text-amber-400">
          <Clock className="w-4 h-4" />
          La asignación debe caer dentro de {year} (entre el 1 de enero y el 31 de
          diciembre).
        </div>
      )}

      {/* Cota: el cierre no pasa del fin del año siguiente (caso A.5) */}
      {closureWindow && !v.closureWithinBound && (
        <div className="flex items-center gap-2 p-3 rounded-lg text-sm bg-amber-500/10 text-amber-400">
          <Clock className="w-4 h-4" />
          El cierre no puede pasar del 31 de diciembre de {year + 1}.
        </div>
      )}

      {/* Guard del seguimiento (fuera del período) */}
      {v.datesPresent && v.closureAfterAssignment && !v.trackingInRange && (
        <div className="flex items-center gap-2 p-3 rounded-lg text-sm bg-amber-500/10 text-amber-400">
          <Clock className="w-4 h-4" />
          El seguimiento debe quedar entre la asignación y el cierre.
        </div>
      )}
    </div>
  )
}
