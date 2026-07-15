// ════════════════════════════════════════════════════════════════════════════
// STEP ASSIGN WEIGHT — Peso en su propio paso, slider hero (Gate C, punto 3 / 4.5)
// src/components/goals/wizard/StepAssignWeight.tsx
// ════════════════════════════════════════════════════════════════════════════
// Dos números gigantes en vivo: % que se asigna a esta meta · % que le queda al
// colaborador. Tope elástico = peso disponible REAL en el ciclo activo (post-Gate A).
//
// ⚠️ EL SLIDER ES UX, NO EL CANDADO. El freno visual (max=disponible) solo evita el
// error humano y la fricción de tipear. La garantía real es el servidor
// (validateTotalWeight, Gate A): rechaza igual si algo lo esquiva. Que nadie relaje
// la validación del backend confiando en este tope.
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { memo } from 'react'
import { AlertTriangle } from 'lucide-react'
import PercentageSlider from '@/components/ui/PercentageSlider'
import type { GoalWizardData } from './CreateGoalWizard'

interface StepAssignWeightProps {
  data: GoalWizardData
  updateData: (updates: Partial<GoalWizardData>) => void
  /** Peso disponible REAL del colaborador (null = todavía sin dato → fallar cerrado). */
  availableWeight: number | null
}

export default memo(function StepAssignWeight({ data, updateData, availableWeight }: StepAssignWeightProps) {
  // Fail-closed: sin dato de disponibilidad no se deja asignar (mismo criterio Gate A).
  if (availableWeight === null) {
    return (
      <div className="p-6 bg-amber-500/10 border border-amber-500/20 rounded-xl text-center">
        <AlertTriangle className="w-6 h-6 text-amber-400 mx-auto mb-2" />
        <p className="text-sm text-amber-300">
          No pudimos cargar el peso disponible del colaborador. No se puede asignar peso hasta resolverlo.
        </p>
      </div>
    )
  }

  const assigned = data.weight || 0
  const remaining = Math.max(0, availableWeight - assigned)

  return (
    <div className="space-y-8">
      {/* Dos números hero */}
      <div className="flex items-center justify-around">
        <div className="text-center">
          <p className="text-[72px] font-extralight tabular-nums text-white leading-[0.9]">{assigned}%</p>
          <p className="text-xs text-slate-400 mt-2">a esta meta</p>
        </div>
        <div className="text-center">
          <p className="text-[72px] font-extralight tabular-nums text-slate-500 leading-[0.9]">{remaining}%</p>
          <p className="text-xs text-slate-500 mt-2">le queda disponible</p>
        </div>
      </div>

      <PercentageSlider
        value={assigned}
        onChange={(v) => updateData({ weight: Math.min(v, availableWeight) })}
        max={availableWeight}
        size="hero"
        showValue={false}
        label={`Peso en la evaluación (disponible: ${availableWeight}%)`}
      />

      <p className="text-xs text-slate-500 text-center">
        Define cuánto pesa esta meta en la evaluación de desempeño del colaborador. El máximo es su peso libre en el ciclo activo.
      </p>
    </div>
  )
})
