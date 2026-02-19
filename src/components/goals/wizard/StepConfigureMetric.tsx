// ════════════════════════════════════════════════════════════════════════════
// STEP CONFIGURE METRIC - Paso 3: Tipo de medicion y valores
// src/components/goals/wizard/StepConfigureMetric.tsx
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { memo, useCallback, useMemo } from 'react'
import { Percent, DollarSign, Hash, ToggleLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import GoalProgressBar from '../GoalProgressBar'
import type { GoalWizardData } from './CreateGoalWizard'

// ════════════════════════════════════════════════════════════════════════════
// TIPOS
// ════════════════════════════════════════════════════════════════════════════

interface StepConfigureMetricProps {
  data: GoalWizardData
  updateData: (updates: Partial<GoalWizardData>) => void
}

// ════════════════════════════════════════════════════════════════════════════
// CONSTANTES
// ════════════════════════════════════════════════════════════════════════════

const METRIC_TYPES = [
  {
    value: 'PERCENTAGE' as const,
    label: 'Porcentaje',
    icon: Percent,
    defaultUnit: '%',
  },
  {
    value: 'CURRENCY' as const,
    label: 'Moneda',
    icon: DollarSign,
    defaultUnit: 'USD',
  },
  {
    value: 'NUMBER' as const,
    label: 'Cantidad',
    icon: Hash,
    defaultUnit: '',
  },
  {
    value: 'BINARY' as const,
    label: 'Si/No',
    icon: ToggleLeft,
    defaultUnit: '',
  },
]

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE
// ════════════════════════════════════════════════════════════════════════════

export default memo(function StepConfigureMetric({
  data,
  updateData,
}: StepConfigureMetricProps) {
  const isBinary = data.metricType === 'BINARY'

  // Preview del progreso
  const previewProgress = useMemo(() => {
    if (isBinary) return 0
    const range = data.targetValue - data.startValue
    if (range === 0) return 0
    return Math.max(0, ((data.startValue - data.startValue) / range) * 100)
  }, [data.targetValue, data.startValue, isBinary])

  const handleMetricTypeSelect = useCallback(
    (value: GoalWizardData['metricType']) => {
      const mt = METRIC_TYPES.find((m) => m.value === value)
      if (value === 'BINARY') {
        updateData({
          metricType: value,
          startValue: 0,
          targetValue: 100,
          unit: '%',
        })
      } else {
        updateData({
          metricType: value,
          unit: mt?.defaultUnit || data.unit,
        })
      }
    },
    [updateData, data.unit]
  )

  const handleStartValueChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      updateData({ startValue: parseFloat(e.target.value) || 0 })
    },
    [updateData]
  )

  const handleTargetValueChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      updateData({ targetValue: parseFloat(e.target.value) || 0 })
    },
    [updateData]
  )

  const handleUnitChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      updateData({ unit: e.target.value })
    },
    [updateData]
  )

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="fhr-title-card text-xl mb-2">Como se mide?</h2>
        <p className="text-slate-400 text-sm">
          Define el tipo de metrica y los valores objetivo
        </p>
      </div>

      {/* Tipo de metrica */}
      <div className="space-y-2">
        <label className="text-sm text-slate-300">Tipo de metrica</label>
        <div className="grid grid-cols-2 gap-2">
          {METRIC_TYPES.map((mt) => {
            const Icon = mt.icon
            const isSelected = data.metricType === mt.value

            return (
              <button
                key={mt.value}
                onClick={() => handleMetricTypeSelect(mt.value)}
                className={cn(
                  'p-3 rounded-lg border text-left transition-all flex items-center gap-3',
                  isSelected
                    ? 'border-cyan-500 bg-cyan-500/10'
                    : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                )}
              >
                <Icon
                  className={cn(
                    'w-5 h-5',
                    isSelected ? 'text-cyan-400' : 'text-slate-400'
                  )}
                />
                <span className="font-medium text-sm text-white">
                  {mt.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Valores (oculto si BINARY) */}
      {!isBinary && (
        <>
          <div className="grid grid-cols-2 gap-4">
            {/* Valor inicial */}
            <div className="space-y-2">
              <label className="text-sm text-slate-300">Valor inicial</label>
              <input
                type="number"
                value={data.startValue}
                onChange={handleStartValueChange}
                className="fhr-input w-full"
                step={data.metricType === 'PERCENTAGE' ? 1 : 0.01}
              />
            </div>

            {/* Valor objetivo */}
            <div className="space-y-2">
              <label className="text-sm text-slate-300">Valor objetivo</label>
              <input
                type="number"
                value={data.targetValue}
                onChange={handleTargetValueChange}
                className="fhr-input w-full"
                step={data.metricType === 'PERCENTAGE' ? 1 : 0.01}
              />
            </div>
          </div>

          {/* Unidad */}
          <div className="space-y-2">
            <label className="text-sm text-slate-300">
              Unidad <span className="text-slate-500">(opcional)</span>
            </label>
            <input
              type="text"
              value={data.unit}
              onChange={handleUnitChange}
              placeholder="Ej: %, USD, tickets, clientes"
              className="fhr-input w-full"
              maxLength={20}
            />
          </div>
        </>
      )}

      {/* Preview */}
      <div className="p-4 bg-slate-800/50 rounded-xl space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-slate-400">Preview</span>
          <span className="text-white tabular-nums">
            {isBinary
              ? 'Completado: Si/No'
              : `${data.startValue.toLocaleString()} → ${data.targetValue.toLocaleString()} ${data.unit}`}
          </span>
        </div>
        <GoalProgressBar
          progress={previewProgress}
          status="NOT_STARTED"
          size="sm"
        />
      </div>
    </div>
  )
})
