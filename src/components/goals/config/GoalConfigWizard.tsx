// src/components/goals/config/GoalConfigWizard.tsx
'use client'

import { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Settings2, Layers, Users, Workflow, CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react'
import { ConfigStepIndicator } from './ConfigStepIndicator'
import { StepGroups } from './steps/StepGroups'
import { StepEligibility } from './steps/StepEligibility'
import { StepRules } from './steps/StepRules'
import { PrimaryButton, GhostButton } from '@/components/ui/PremiumButton'

interface StepConfig {
  id: number
  key: string
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  instruction: string
}

const STEPS: StepConfig[] = [
  {
    id: 1,
    key: 'groups',
    title: 'Grupos de Ponderación',
    description: 'Define cómo se distribuyen los pesos de las metas',
    icon: Layers,
    instruction: 'Crea al menos un grupo de ponderación. Define qué porcentaje tendrá cada tipo de meta (Negocio, Líder, NPS, Específica) para cada nivel jerárquico.'
  },
  {
    id: 2,
    key: 'eligibility',
    title: 'Elegibilidad por Cargo',
    description: 'Define qué cargos participan en el sistema de metas',
    icon: Users,
    instruction: 'Activa los niveles de cargo que tendrán metas y asigna a cada uno el grupo de ponderación correspondiente.'
  },
  {
    id: 3,
    key: 'rules',
    title: 'Reglas de Cascada',
    description: 'Automatiza la asignación de metas corporativas',
    icon: Workflow,
    instruction: 'Crea reglas para que las metas corporativas se asignen automáticamente a los empleados según su grupo. Este paso es opcional.'
  }
]

export default function GoalConfigWizard() {
  const [currentStep, setCurrentStep] = useState(1)
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())
  const [stepData, setStepData] = useState({
    groupsCount: 0,
    eligibleCount: 0,
    rulesCount: 0
  })

  const step = STEPS[currentStep - 1]
  const isLastStep = currentStep === STEPS.length
  const isFirstStep = currentStep === 1

  const canProceed = useMemo(() => {
    switch (currentStep) {
      case 1: return stepData.groupsCount > 0
      case 2: return stepData.eligibleCount > 0
      case 3: return true // Reglas son opcionales
      default: return false
    }
  }, [currentStep, stepData])

  const handleNext = useCallback(() => {
    if (canProceed && currentStep < STEPS.length) {
      setCompletedSteps(prev => new Set([...prev, currentStep]))
      setCurrentStep(prev => prev + 1)
    }
  }, [canProceed, currentStep])

  const handleBack = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1)
    }
  }, [currentStep])

  const handleStepDataChange = useCallback((key: string, value: number) => {
    setStepData(prev => ({ ...prev, [key]: value }))
  }, [])

  const handleFinish = useCallback(() => {
    window.location.href = '/dashboard/metas'
  }, [])

  const StepIcon = step.icon

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20">
          <Settings2 className="w-6 h-6 text-cyan-400" />
        </div>
        <div>
          <h1 className="text-2xl font-light text-white">Configuración de Metas</h1>
          <p className="text-slate-400 text-sm">Configura el sistema de metas para tu organización</p>
        </div>
      </div>

      {/* Step Indicator */}
      <ConfigStepIndicator
        steps={STEPS}
        currentStep={currentStep}
        completedSteps={completedSteps}
        onStepClick={(s) => {
          if (completedSteps.has(s) || s === currentStep) {
            setCurrentStep(s)
          }
        }}
      />

      {/* Step Content Card */}
      <div className="fhr-card p-6">
        {/* Step Header */}
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-700/50">
          <div className="p-3 rounded-xl bg-cyan-500/10">
            <StepIcon className="w-6 h-6 text-cyan-400" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl text-white font-medium">
              Paso {currentStep}: {step.title}
            </h2>
            <p className="text-slate-400 text-sm">{step.description}</p>
          </div>
        </div>

        {/* Instruction Box */}
        <div className="mb-6 p-4 bg-gradient-to-r from-cyan-500/5 to-purple-500/5 border border-cyan-500/20 rounded-lg">
          <p className="text-sm text-slate-300">
            <span className="text-cyan-400 font-medium">Tu misión:</span> {step.instruction}
          </p>
        </div>

        {/* Step Component */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {currentStep === 1 && (
              <StepGroups
                onDataChange={(count) => handleStepDataChange('groupsCount', count)}
              />
            )}
            {currentStep === 2 && (
              <StepEligibility
                onDataChange={(count) => handleStepDataChange('eligibleCount', count)}
              />
            )}
            {currentStep === 3 && (
              <StepRules
                onDataChange={(count) => handleStepDataChange('rulesCount', count)}
              />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-700/50">
          <div>
            {!isFirstStep && (
              <GhostButton icon={ArrowLeft} onClick={handleBack}>
                Anterior
              </GhostButton>
            )}
          </div>

          <div className="flex items-center gap-3">
            {!canProceed && currentStep < 3 && (
              <span className="text-sm text-amber-400">
                Completa este paso para continuar
              </span>
            )}

            {isLastStep ? (
              <PrimaryButton icon={CheckCircle} onClick={handleFinish}>
                Finalizar Configuración
              </PrimaryButton>
            ) : (
              <PrimaryButton
                icon={ArrowRight}
                iconPosition="right"
                onClick={handleNext}
                disabled={!canProceed}
              >
                Siguiente
              </PrimaryButton>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
