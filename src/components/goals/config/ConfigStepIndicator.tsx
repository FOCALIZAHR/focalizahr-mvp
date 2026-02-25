// src/components/goals/config/ConfigStepIndicator.tsx
'use client'

import { memo } from 'react'
import { Check } from 'lucide-react'
import { motion } from 'framer-motion'

interface Step {
  id: number
  key: string
  title: string
  icon: React.ComponentType<{ className?: string }>
}

interface ConfigStepIndicatorProps {
  steps: Step[]
  currentStep: number
  completedSteps: Set<number>
  onStepClick: (step: number) => void
}

export const ConfigStepIndicator = memo(function ConfigStepIndicator({
  steps,
  currentStep,
  completedSteps,
  onStepClick
}: ConfigStepIndicatorProps) {
  return (
    <div className="fhr-card p-4">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = completedSteps.has(step.id)
          const isCurrent = currentStep === step.id
          const isClickable = isCompleted || isCurrent

          return (
            <div key={step.id} className="flex items-center flex-1">
              {/* Step Circle */}
              <button
                onClick={() => isClickable && onStepClick(step.id)}
                disabled={!isClickable}
                className={`
                  relative flex items-center justify-center w-10 h-10 rounded-full
                  transition-all duration-300
                  ${isCompleted
                    ? 'bg-emerald-500 text-white cursor-pointer'
                    : isCurrent
                      ? 'bg-cyan-500 text-white ring-4 ring-cyan-500/30'
                      : 'bg-slate-700 text-slate-400 cursor-not-allowed'
                  }
                `}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <span className="font-medium">{step.id}</span>
                )}
              </button>

              {/* Step Label */}
              <div className={`ml-3 ${index < steps.length - 1 ? 'flex-1' : ''}`}>
                <p className={`text-sm font-medium ${
                  isCurrent ? 'text-cyan-400' : isCompleted ? 'text-emerald-400' : 'text-slate-400'
                }`}>
                  {step.title}
                </p>
              </div>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="flex-1 mx-4">
                  <div className="h-0.5 bg-slate-700 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-cyan-500 to-purple-500"
                      initial={{ width: 0 }}
                      animate={{ width: isCompleted ? '100%' : '0%' }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
})
