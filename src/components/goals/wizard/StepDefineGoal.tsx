// ════════════════════════════════════════════════════════════════════════════
// STEP DEFINE GOAL - Paso 2: Titulo y descripcion
// src/components/goals/wizard/StepDefineGoal.tsx
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { memo, useCallback } from 'react'
import { cn } from '@/lib/utils'
import type { GoalWizardData } from './CreateGoalWizard'

// ════════════════════════════════════════════════════════════════════════════
// TIPOS
// ════════════════════════════════════════════════════════════════════════════

interface StepDefineGoalProps {
  data: GoalWizardData
  updateData: (updates: Partial<GoalWizardData>) => void
}

// ════════════════════════════════════════════════════════════════════════════
// CONSTANTES
// ════════════════════════════════════════════════════════════════════════════

const GOAL_TYPES = [
  { value: 'KPI' as const, label: 'KPI', description: 'Meta numerica medible' },
  {
    value: 'PROJECT' as const,
    label: 'Proyecto',
    description: 'Hito completado/no completado',
  },
  {
    value: 'OBJECTIVE' as const,
    label: 'Objetivo (O)',
    description: 'Objetivo cualitativo OKR',
  },
  {
    value: 'KEY_RESULT' as const,
    label: 'Key Result (KR)',
    description: 'Resultado clave OKR',
  },
]

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE
// ════════════════════════════════════════════════════════════════════════════

export default memo(function StepDefineGoal({
  data,
  updateData,
}: StepDefineGoalProps) {
  const handleTitleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      updateData({ title: e.target.value })
    },
    [updateData]
  )

  const handleDescriptionChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      updateData({ description: e.target.value })
    },
    [updateData]
  )

  const handleTypeSelect = useCallback(
    (value: GoalWizardData['type']) => {
      updateData({ type: value })
    },
    [updateData]
  )

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="fhr-title-card text-xl mb-2">Define tu meta</h2>
        <p className="text-slate-400 text-sm">
          Un buen titulo es claro, especifico y accionable
        </p>
      </div>

      {/* Titulo */}
      <div className="space-y-2">
        <label className="text-sm text-slate-300">
          Titulo de la meta <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={data.title}
          onChange={handleTitleChange}
          placeholder="Ej: Aumentar ventas Q1 en 30%"
          className="fhr-input w-full"
          maxLength={100}
        />
        <div className="flex justify-between text-xs text-slate-500">
          <span>Minimo 3 caracteres</span>
          <span>{data.title.length}/100</span>
        </div>
      </div>

      {/* Descripcion */}
      <div className="space-y-2">
        <label className="text-sm text-slate-300">
          Descripcion <span className="text-slate-500">(opcional)</span>
        </label>
        <textarea
          value={data.description}
          onChange={handleDescriptionChange}
          placeholder="Contexto adicional, criterios de exito, etc."
          rows={3}
          className="fhr-input w-full resize-none"
          maxLength={500}
        />
      </div>

      {/* Tipo */}
      <div className="space-y-2">
        <label className="text-sm text-slate-300">Tipo de meta</label>
        <div className="grid grid-cols-2 gap-2">
          {GOAL_TYPES.map((type) => (
            <button
              key={type.value}
              onClick={() => handleTypeSelect(type.value)}
              className={cn(
                'p-3 rounded-lg border text-left transition-all',
                data.type === type.value
                  ? 'border-cyan-500 bg-cyan-500/10'
                  : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
              )}
            >
              <div className="font-medium text-sm text-white">{type.label}</div>
              <div className="text-xs text-slate-400">{type.description}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
})
