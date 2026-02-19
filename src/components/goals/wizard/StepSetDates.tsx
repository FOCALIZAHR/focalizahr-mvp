// ════════════════════════════════════════════════════════════════════════════
// STEP SET DATES - Paso 4: Fechas y periodo
// src/components/goals/wizard/StepSetDates.tsx
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { memo, useCallback, useMemo } from 'react'
import { Calendar, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { GoalWizardData } from './CreateGoalWizard'

// ════════════════════════════════════════════════════════════════════════════
// TIPOS
// ════════════════════════════════════════════════════════════════════════════

interface StepSetDatesProps {
  data: GoalWizardData
  updateData: (updates: Partial<GoalWizardData>) => void
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

const currentYear = new Date().getFullYear()
const YEARS = [currentYear - 1, currentYear, currentYear + 1]

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE
// ════════════════════════════════════════════════════════════════════════════

export default memo(function StepSetDates({
  data,
  updateData,
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

  const handleYearChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      updateData({ periodYear: parseInt(e.target.value) })
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
      <div className="text-center">
        <h2 className="fhr-title-card text-xl mb-2">Plazos y periodo</h2>
        <p className="text-slate-400 text-sm">
          Define cuando inicia y cuando debe completarse la meta
        </p>
      </div>

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
          {/* Ano */}
          <div className="space-y-2">
            <label className="text-sm text-slate-400">Ano</label>
            <select
              value={data.periodYear}
              onChange={handleYearChange}
              className="fhr-input w-full"
            >
              {YEARS.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
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
