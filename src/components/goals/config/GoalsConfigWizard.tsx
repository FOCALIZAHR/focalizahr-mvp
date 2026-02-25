// ════════════════════════════════════════════════════════════════════════════
// GOALS CONFIG WIZARD - Wizard unificado de configuración de metas
// src/components/goals/config/GoalsConfigWizard.tsx
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { useState, useCallback, useEffect, memo } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Users,
  Settings2,
  Workflow,
  Rocket,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { PrimaryButton, GhostButton, SecondaryButton } from '@/components/ui/PremiumButton'
import GoalEligibilityManager from '@/components/goals/admin/GoalEligibilityManager'
import GoalGroupManager from '@/components/goals/admin/GoalGroupManager'
import GoalCascadeRuleManager from '@/components/goals/admin/GoalCascadeRuleManager'

// ════════════════════════════════════════════════════════════════════════════
// TIPOS Y CONSTANTES
// ════════════════════════════════════════════════════════════════════════════

interface Step {
  id: number
  name: string
  description: string
  icon: typeof Users
}

const STEPS: Step[] = [
  {
    id: 1,
    name: 'Elegibilidad',
    description: '¿Quiénes participan?',
    icon: Users
  },
  {
    id: 2,
    name: 'Grupos',
    description: '¿Cuáles son los pesos?',
    icon: Settings2
  },
  {
    id: 3,
    name: 'Automatización',
    description: '¿Cómo se cascadea?',
    icon: Workflow
  },
  {
    id: 4,
    name: 'Impacto',
    description: 'Revisar y confirmar',
    icon: Rocket
  },
]

interface ImpactData {
  eligibleEmployees: number
  activeGroups: number
  cascadeRules: number
  estimatedGoals: number
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE: WizardStepIndicator
// ════════════════════════════════════════════════════════════════════════════

const WizardStepIndicator = memo(function WizardStepIndicator({
  steps,
  currentStep,
}: {
  steps: Step[]
  currentStep: number
}) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {steps.map((step, index) => {
        const isCompleted = step.id < currentStep
        const isCurrent = step.id === currentStep
        const StepIcon = step.icon

        return (
          <div key={step.id} className="flex items-center">
            <div
              className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center transition-all',
                isCompleted && 'bg-cyan-500 text-white',
                isCurrent && 'bg-cyan-500/20 border-2 border-cyan-500 text-cyan-400',
                !isCompleted && !isCurrent && 'bg-slate-800 text-slate-500'
              )}
            >
              {isCompleted ? (
                <Check className="w-5 h-5" />
              ) : (
                <StepIcon className="w-5 h-5" />
              )}
            </div>

            <div className="hidden md:block ml-2">
              <p className={cn(
                'text-sm font-medium',
                isCurrent ? 'text-cyan-400' : 'text-slate-500'
              )}>
                {step.name}
              </p>
              <p className="text-xs text-slate-600">{step.description}</p>
            </div>

            {index < steps.length - 1 && (
              <div
                className={cn(
                  'w-8 md:w-16 h-0.5 mx-3 transition-colors',
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

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE: ImpactScreen (Paso 4)
// ════════════════════════════════════════════════════════════════════════════

const ImpactScreen = memo(function ImpactScreen({
  onConfirm,
  onBack,
  isLoading,
}: {
  onConfirm: () => void
  onBack: () => void
  isLoading: boolean
}) {
  const [impact, setImpact] = useState<ImpactData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch impact data
  useEffect(() => {
    const fetchImpact = async () => {
      try {
        setLoading(true)
        setError(null)

        const token = localStorage.getItem('focalizahr_token')
        const res = await fetch('/api/config/goals-impact', {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        })

        if (!res.ok) throw new Error('Error obteniendo impacto')

        const json = await res.json()
        setImpact(json.data)
      } catch (err: any) {
        setError(err.message || 'Error de conexión')
      } finally {
        setLoading(false)
      }
    }

    fetchImpact()
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mb-4" />
        <p className="text-slate-400">Calculando impacto...</p>
      </div>
    )
  }

  if (error || !impact) {
    return (
      <div className="fhr-card text-center py-12">
        <p className="text-amber-400 mb-4">{error || 'No se pudo calcular el impacto'}</p>
        <GhostButton onClick={onBack}>Volver</GhostButton>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center">
          <Rocket className="w-8 h-8 text-cyan-400" />
        </div>
        <h2 className="text-2xl font-light text-white mb-2">
          Resumen de <span className="fhr-title-gradient">Impacto</span>
        </h2>
        <p className="text-slate-400">
          Revisa la configuración antes de confirmar
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="fhr-card-metric text-center">
          <Users className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
          <p className="text-3xl font-light text-white">{impact.eligibleEmployees}</p>
          <p className="text-xs text-slate-400">Personas elegibles</p>
        </div>
        <div className="fhr-card-metric text-center">
          <Settings2 className="w-6 h-6 text-purple-400 mx-auto mb-2" />
          <p className="text-3xl font-light text-white">{impact.activeGroups}</p>
          <p className="text-xs text-slate-400">Grupos activos</p>
        </div>
        <div className="fhr-card-metric text-center">
          <Workflow className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
          <p className="text-3xl font-light text-white">{impact.cascadeRules}</p>
          <p className="text-xs text-slate-400">Reglas de cascada</p>
        </div>
        <div className="fhr-card-metric text-center">
          <Rocket className="w-6 h-6 text-amber-400 mx-auto mb-2" />
          <p className="text-3xl font-light text-white">{impact.estimatedGoals}</p>
          <p className="text-xs text-slate-400">Metas estimadas</p>
        </div>
      </div>

      {/* Confirmation Message */}
      <div className="fhr-card bg-cyan-500/5 border-cyan-500/20">
        <p className="text-slate-300 text-center">
          Al confirmar, <span className="text-cyan-400 font-medium">{impact.eligibleEmployees} personas</span> podrán
          tener metas asignadas según los grupos y reglas configurados.
        </p>
      </div>

      {/* Actions */}
      <div className="flex justify-between pt-4">
        <GhostButton icon={ArrowLeft} onClick={onBack} disabled={isLoading}>
          Atrás
        </GhostButton>
        <PrimaryButton icon={Check} onClick={onConfirm} disabled={isLoading}>
          {isLoading ? 'Confirmando...' : 'Confirmar Configuración'}
        </PrimaryButton>
      </div>
    </div>
  )
})

// ════════════════════════════════════════════════════════════════════════════
// ANIMACIONES
// ════════════════════════════════════════════════════════════════════════════

const stepVariants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════

export default function GoalsConfigWizard() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isConfirming, setIsConfirming] = useState(false)

  // Navigation handlers
  const handleNext = useCallback(() => {
    if (currentStep < STEPS.length) {
      setCurrentStep(prev => prev + 1)
    }
  }, [currentStep])

  const handleBack = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1)
    } else {
      router.push('/dashboard/metas/configuracion')
    }
  }, [currentStep, router])

  const handleConfirm = useCallback(async () => {
    setIsConfirming(true)
    try {
      // Pequeña pausa para feedback visual
      await new Promise(resolve => setTimeout(resolve, 500))
      router.push('/dashboard/metas?configured=true')
    } finally {
      setIsConfirming(false)
    }
  }, [router])

  const handleClose = useCallback(() => {
    if (confirm('¿Salir del wizard? Los cambios guardados en cada paso se conservan.')) {
      router.push('/dashboard/metas/configuracion')
    }
  }, [router])

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <GoalEligibilityManager embedded />
      case 2:
        return <GoalGroupManager embedded />
      case 3:
        return <GoalCascadeRuleManager embedded />
      case 4:
        return (
          <ImpactScreen
            onConfirm={handleConfirm}
            onBack={handleBack}
            isLoading={isConfirming}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen fhr-bg-main">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-light text-white">
              Configurar <span className="fhr-title-gradient">Metas</span>
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Paso {currentStep} de {STEPS.length}: {STEPS[currentStep - 1].description}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-white transition-colors text-sm"
          >
            Salir
          </button>
        </div>

        {/* Step Indicator */}
        <WizardStepIndicator steps={STEPS} currentStep={currentStep} />

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            variants={stepVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.2 }}
          >
            {renderStepContent()}
          </motion.div>
        </AnimatePresence>

        {/* Navigation (solo para pasos 1-3) */}
        {currentStep < 4 && (
          <div className="flex justify-between mt-8 pt-6 border-t border-slate-700/50">
            <GhostButton icon={ArrowLeft} onClick={handleBack}>
              {currentStep === 1 ? 'Cancelar' : 'Atrás'}
            </GhostButton>
            <PrimaryButton icon={ArrowRight} onClick={handleNext}>
              Siguiente
            </PrimaryButton>
          </div>
        )}
      </div>
    </div>
  )
}
