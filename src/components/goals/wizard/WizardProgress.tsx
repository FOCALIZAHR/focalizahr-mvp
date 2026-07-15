// ════════════════════════════════════════════════════════════════════════════
// WIZARD PROGRESS - Indicador visual de pasos
// src/components/goals/wizard/WizardProgress.tsx
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { memo } from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

// ════════════════════════════════════════════════════════════════════════════
// TIPOS
// ════════════════════════════════════════════════════════════════════════════

interface Step {
  id: number
  name: string
}

interface WizardProgressProps {
  steps: Step[]
  currentStep: number
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE
// ════════════════════════════════════════════════════════════════════════════

export const WizardProgress = memo(function WizardProgress({
  steps,
  currentStep,
}: WizardProgressProps) {
  // Gate C — INDEX-BASED: los `id` de los pasos son identidad de PANTALLA, no orden.
  // Con recorridos no contiguos (…5, 7, 6) comparar ids pintaría el check en el
  // círculo equivocado y mostraría "7" antes que "6" como número del paso.
  const currentIndex = steps.findIndex((s) => s.id === currentStep)

  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {steps.map((step, index) => {
        const isCompleted = index < currentIndex
        const isCurrent = index === currentIndex

        return (
          <div key={step.id} className="flex items-center">
            {/* Step circle */}
            <div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all',
                isCompleted && 'bg-cyan-500 text-white',
                isCurrent &&
                  'bg-cyan-500/20 border-2 border-cyan-500 text-cyan-400',
                !isCompleted && !isCurrent && 'bg-slate-800 text-slate-500'
              )}
            >
              {isCompleted ? <Check className="w-4 h-4" /> : index + 1}
            </div>

            {/* Step name (visible on md+) */}
            <span
              className={cn(
                'hidden md:inline ml-2 text-sm transition-colors',
                isCurrent ? 'text-cyan-400 font-medium' : 'text-slate-500'
              )}
            >
              {step.name}
            </span>

            {/* Connector line */}
            {index < steps.length - 1 && (
              <div
                className={cn(
                  'w-8 md:w-12 h-0.5 mx-2 transition-colors',
                  isCompleted ? 'bg-cyan-500' : 'bg-slate-700'
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
})
