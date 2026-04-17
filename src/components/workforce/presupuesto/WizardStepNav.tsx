'use client'

// Barra superior de pasos del wizard de Presupuesto.
// Patron identico al stepper de CalibrationWizard.tsx (lineas 245-269):
// circulos w-8 h-8 + conectores w-8 h-[2px] + Check para completados.
// Desktop-visible. Mobile muestra "Paso N de 5 — Label" como texto.

import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { PasoWizard } from './types'

interface Step {
  id: PasoWizard
  name: string
}

const STEPS: Step[] = [
  { id: 1, name: 'Organizacion' },
  { id: 2, name: 'Movimientos' },
  { id: 3, name: 'Supuestos' },
  { id: 4, name: 'Salidas' },
  { id: 5, name: 'Resultado' },
]

interface WizardStepNavProps {
  pasoActual: PasoWizard
  pasosCompletados: PasoWizard[]
  onStepClick?: (paso: PasoWizard) => void
}

export default function WizardStepNav({
  pasoActual,
  pasosCompletados,
  onStepClick,
}: WizardStepNavProps) {
  const currentStep = pasoActual
  const stepActualName = STEPS.find(s => s.id === currentStep)?.name ?? ''

  return (
    <nav aria-label="Progreso del wizard" className="mb-6">
      {/* Mobile: texto simple con progreso */}
      <div className="md:hidden flex items-center justify-between">
        <span className="text-xs uppercase tracking-widest text-slate-500 font-medium">
          Paso {currentStep} de {STEPS.length}
        </span>
        <span className="text-sm text-cyan-400 font-light">{stepActualName}</span>
      </div>

      {/* Desktop: stepper circular clonado de CalibrationWizard */}
      <div className="hidden md:flex items-center gap-2">
        {STEPS.map((step, index) => {
          const isCompleted =
            pasosCompletados.includes(step.id) || currentStep > step.id
          const isActive = currentStep === step.id
          const isFuture = currentStep < step.id && !pasosCompletados.includes(step.id)
          const canClick = (isCompleted || isActive) && onStepClick

          return (
            <div key={step.id} className="flex items-center">
              <button
                type="button"
                disabled={isFuture}
                onClick={() => canClick && onStepClick?.(step.id)}
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-200',
                  isCompleted && !isActive && 'bg-cyan-500 text-white',
                  isActive && 'bg-cyan-500/20 text-cyan-400 ring-2 ring-cyan-500',
                  isFuture && 'bg-slate-800 text-slate-500',
                  canClick && !isActive && 'cursor-pointer hover:scale-105',
                  isFuture && 'cursor-not-allowed',
                )}
                title={step.name}
              >
                {isCompleted && !isActive ? (
                  <Check className="w-4 h-4" />
                ) : (
                  step.id
                )}
              </button>
              {index < STEPS.length - 1 && (
                <div
                  className={cn(
                    'w-8 h-[2px] mx-1 transition-all duration-200',
                    isCompleted ? 'bg-cyan-500' : 'bg-slate-700',
                  )}
                />
              )}
            </div>
          )
        })}
        <span className="ml-3 text-sm font-light text-slate-300">
          {stepActualName}
        </span>
      </div>
    </nav>
  )
}
