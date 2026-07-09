// ════════════════════════════════════════════════════════════════════════════
// STEP SET DATES - Paso 4: Fechas y periodo
// src/components/goals/wizard/StepSetDates.tsx
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { memo, useCallback, useMemo } from 'react'
import { Calendar, CalendarRange, Clock, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { GoalWizardData } from './CreateGoalWizard'

// ════════════════════════════════════════════════════════════════════════════
// TIPOS
// ════════════════════════════════════════════════════════════════════════════

interface StepSetDatesProps {
  data: GoalWizardData
  updateData: (updates: Partial<GoalWizardData>) => void
  // Ciclo heredado (Gate D.6): periodYear se deriva del year del ciclo activo,
  // el usuario ya no elige año. Lo resuelve/setea el orquestador; acá solo se muestra.
  activeCycle: { id: string; name: string; year: number } | null
  loadingCycle: boolean
}

// ════════════════════════════════════════════════════════════════════════════
// CONSTANTES
// ════════════════════════════════════════════════════════════════════════════

const QUARTERS = [
  { value: 1, label: 'Q1 (Ene-Mar)' },
  { value: 2, label: 'Q2 (Abr-Jun)' },
  { value: 3, label: 'Q3 (Jul-Sep)' },
  { value: 4, label: 'Q4 (Oct-Dic)' },
]

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE
// ════════════════════════════════════════════════════════════════════════════

export default memo(function StepSetDates({
  data,
  updateData,
  activeCycle,
  loadingCycle,
}: StepSetDatesProps) {
  // Calcular dias entre fechas
  const daysBetween = useMemo(() => {
    if (!data.startDate || !data.dueDate) return null
    const start = new Date(data.startDate)
    const end = new Date(data.dueDate)
    const diff = Math.ceil(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    )
    return diff
  }, [data.startDate, data.dueDate])

  const isValidRange = daysBetween !== null && daysBetween > 0

  const handleStartDateChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      updateData({ startDate: e.target.value })
    },
    [updateData]
  )

  const handleDueDateChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      updateData({ dueDate: e.target.value })
    },
    [updateData]
  )

  const handleQuarterSelect = useCallback(
    (quarter: number | undefined) => {
      updateData({
        periodQuarter: data.periodQuarter === quarter ? undefined : quarter,
      })
    },
    [updateData, data.periodQuarter]
  )

  return (
    <div className="space-y-6">
      {/* Fechas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Fecha inicio */}
        <div className="space-y-2">
          <label className="text-sm text-slate-300 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            Fecha de inicio
          </label>
          <input
            type="date"
            value={data.startDate}
            onChange={handleStartDateChange}
            className="fhr-input w-full"
          />
        </div>

        {/* Fecha limite */}
        <div className="space-y-2">
          <label className="text-sm text-slate-300 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            Fecha limite
          </label>
          <input
            type="date"
            value={data.dueDate}
            onChange={handleDueDateChange}
            min={data.startDate || undefined}
            className="fhr-input w-full"
          />
        </div>
      </div>

      {/* Indicador de dias */}
      {daysBetween !== null && (
        <div
          className={cn(
            'flex items-center gap-2 p-3 rounded-lg text-sm',
            isValidRange
              ? 'bg-cyan-500/10 text-cyan-400'
              : 'bg-red-500/10 text-red-400'
          )}
        >
          <Clock className="w-4 h-4" />
          {isValidRange
            ? `${daysBetween} dias para completar la meta`
            : 'La fecha limite debe ser posterior a la fecha de inicio'}
        </div>
      )}

      {/* Periodo fiscal */}
      <div className="space-y-4 pt-4 border-t border-slate-700/50">
        <h3 className="text-sm font-medium text-slate-300">
          Periodo fiscal (para reportes)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Ciclo heredado (read-only) — reemplaza el selector de año (Gate D.6) */}
          <div className="space-y-2">
            <label className="text-sm text-slate-400">Ciclo</label>
            {loadingCycle ? (
              <div className="rounded-lg border border-slate-700/50 bg-slate-800/30 px-4 py-3 flex items-center gap-2 text-sm text-slate-500">
                <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                Cargando ciclo…
              </div>
            ) : activeCycle ? (
              <>
                <div className="rounded-lg border border-slate-700/50 bg-slate-800/30 px-4 py-3 flex items-center gap-2 text-sm">
                  <CalendarRange className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span className="text-slate-200 truncate">{activeCycle.name}</span>
                </div>
                <p className="text-[11px] font-light text-slate-500">
                  Año de reporte {activeCycle.year}, heredado del ciclo.
                </p>
              </>
            ) : (
              <div className="rounded-lg border border-slate-700/50 bg-slate-800/30 px-4 py-3 text-xs font-light text-slate-500">
                Sin ciclo activo — esta meta no quedará anclada a ningún período.
              </div>
            )}
          </div>

          {/* Quarter */}
          <div className="space-y-2">
            <label className="text-sm text-slate-400">
              Trimestre <span className="text-slate-500">(opcional)</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {QUARTERS.map((q) => (
                <button
                  key={q.value}
                  onClick={() => handleQuarterSelect(q.value)}
                  className={cn(
                    'p-2 rounded-lg border text-xs text-center transition-all',
                    data.periodQuarter === q.value
                      ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400'
                      : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600'
                  )}
                >
                  {q.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
})
