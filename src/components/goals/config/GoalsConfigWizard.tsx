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
  HelpCircle,
  AlertCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { PrimaryButton, GhostButton } from '@/components/ui/PremiumButton'
import GoalEligibilityManager, { type EligibilityStats } from '@/components/goals/admin/GoalEligibilityManager'
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
  { id: 1, name: 'Grupos', description: '¿Cuáles son los pesos?', icon: Settings2 },
  { id: 2, name: 'Elegibilidad', description: '¿Quiénes participan?', icon: Users },
  { id: 3, name: 'Automatización', description: '¿Cómo se cascadea?', icon: Workflow },
  { id: 4, name: 'Impacto', description: 'Revisar y confirmar', icon: Rocket },
]

const STEP_COVERS: Record<number, {
  step: string
  title: string
  subtitle: string
  cta: string
  smartTip: string
}> = {
  1: {
    step: 'Paso 1 de 4',
    title: 'Crea los grupos de ponderación',
    subtitle: 'Tu misión: definir cómo se distribuye el 100% de la evaluación por tipo de cargo.',
    cta: 'Comenzar',
    smartTip: 'Ejemplo: Gerentes pueden tener 40% negocio, 30% liderazgo, 30% específico.'
  },
  2: {
    step: 'Paso 2 de 4',
    title: 'Asigna cargos a los grupos',
    subtitle: 'Tu misión: definir qué cargos participan y a qué grupo pertenecen.',
    cta: 'Continuar',
    smartTip: 'Los cargos sin grupo asignado no tendrán metas en su evaluación.'
  },
  3: {
    step: 'Paso 3 de 4',
    title: 'Define el cascadeo automático',
    subtitle: 'Tu misión: conectar metas corporativas con los grupos que las recibirán.',
    cta: 'Continuar',
    smartTip: 'Esto ahorra tiempo y asegura alineamiento estratégico.'
  }
}

const STEP_NAMES: Record<number, string> = {
  1: 'Grupos',
  2: 'Elegibilidad',
  3: 'Automatización',
  4: 'Impacto'
}

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
        <PrimaryButton icon={Rocket} onClick={onConfirm} disabled={isLoading}>
          {isLoading ? 'Ejecutando...' : 'Ejecutar Configuración'}
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
  const [stepPhase, setStepPhase] = useState<'cover' | 'form'>('cover')
  const [isConfirming, setIsConfirming] = useState(false)

  // Eligibility confirmation modal
  const [showEligibilityConfirmModal, setShowEligibilityConfirmModal] = useState(false)
  const [isSavingEligibility, setIsSavingEligibility] = useState(false)
  const [eligibilitySaveError, setEligibilitySaveError] = useState<string | null>(null)
  const [eligibilityStats, setEligibilityStats] = useState<EligibilityStats>({
    eligibleLevels: 0,
    totalLevels: 0,
    affectedEmployees: 0,
    hasChanges: false,
    pendingConfigs: [],
  })

  // Navigation handlers
  const handleNext = useCallback(() => {
    if (currentStep === 4) return // Paso 4 tiene su propio botón de confirmar

    if (stepPhase === 'cover') {
      setStepPhase('form')
      return
    }

    // Interceptar paso 2 (Elegibilidad) si hay cambios sin guardar
    if (currentStep === 2 && eligibilityStats.hasChanges) {
      setEligibilitySaveError(null)
      setShowEligibilityConfirmModal(true)
      return
    }

    if (currentStep < 4) {
      setCurrentStep(prev => prev + 1)
      setStepPhase(currentStep + 1 === 4 ? 'form' : 'cover')
    }
  }, [currentStep, stepPhase, eligibilityStats.hasChanges])

  const handleBack = useCallback(() => {
    if (currentStep === 1 && stepPhase === 'cover') {
      router.push('/dashboard/metas/configuracion')
      return
    }

    if (stepPhase === 'form') {
      // Si estamos en paso 4 (sin cover), volver al form del paso 3
      if (currentStep === 4) {
        setCurrentStep(3)
        setStepPhase('form')
      } else {
        setStepPhase('cover')
      }
    } else {
      // En cover, volver al form del paso anterior
      setCurrentStep(prev => prev - 1)
      setStepPhase('form')
    }
  }, [currentStep, stepPhase, router])

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

  // Guardar elegibilidad desde modal y avanzar
  const handleEligibilityConfirm = useCallback(async () => {
    setIsSavingEligibility(true)
    setEligibilitySaveError(null)
    try {
      const res = await fetch('/api/config/goal-eligibility', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ configs: eligibilityStats.pendingConfigs }),
      })
      if (!res.ok) throw new Error('Error guardando configuración de elegibilidad')

      setShowEligibilityConfirmModal(false)
      setEligibilityStats(prev => ({ ...prev, hasChanges: false }))

      // Avanzar al paso 3
      setCurrentStep(3)
      setStepPhase('cover')
    } catch (err: any) {
      setEligibilitySaveError(err.message || 'Error guardando')
    } finally {
      setIsSavingEligibility(false)
    }
  }, [eligibilityStats.pendingConfigs])

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <GoalGroupManager embedded />
      case 2:
        return <GoalEligibilityManager embedded onStatsChange={setEligibilityStats} />
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

  const renderStepCover = () => {
    const cover = STEP_COVERS[currentStep]
    if (!cover) return null

    return (
      <div className="flex flex-col items-center justify-center text-center px-6 py-6 min-h-[400px]">
        <span className="text-sm font-semibold text-cyan-400 tracking-widest uppercase mb-4">
          {cover.step}
        </span>

        <h1 className="text-3xl font-light text-white mb-4">
          {cover.title}
        </h1>

        <p className="text-lg text-slate-400 mb-4 max-w-md">
          {cover.subtitle}
        </p>

        <div className="flex items-center gap-2 text-slate-500 text-sm mb-6">
          <HelpCircle className="w-4 h-4" />
          <span className="italic">{cover.smartTip}</span>
        </div>

        <PrimaryButton onClick={handleNext} icon={ArrowRight}>
          {cover.cta}
        </PrimaryButton>
      </div>
    )
  }

  const renderStepForm = () => {
    const cover = STEP_COVERS[currentStep]

    return (
      <div>
        {/* Header minimalista */}
        <div className="flex items-center justify-between mb-6">
          <span className="text-sm font-semibold text-cyan-400">
            Paso {currentStep} de 4 · {STEP_NAMES[currentStep]}
          </span>

          {cover?.smartTip && (
            <div className="group relative">
              <HelpCircle className="w-4 h-4 text-slate-500 hover:text-cyan-400 cursor-help transition-colors" />
              <div className="absolute right-0 top-6 w-64 p-3 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-300 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                {cover.smartTip}
              </div>
            </div>
          )}
        </div>

        {/* Contenido del step */}
        {renderStepContent()}
      </div>
    )
  }

  return (
    <div className="min-h-screen fhr-bg-main">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
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

        {/* Contenedor card */}
        <div className="fhr-card p-4 sm:p-6">
          {/* Step Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`${currentStep}-${stepPhase}`}
              variants={stepVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.2 }}
            >
              {currentStep < 4 && stepPhase === 'cover'
                ? renderStepCover()
                : renderStepForm()
              }
            </motion.div>
          </AnimatePresence>

          {/* Navigation - Solo mostrar en form, no en cover */}
          {stepPhase === 'form' && currentStep < 4 && (
            <div className="flex justify-between mt-6 pt-6 border-t border-slate-700/50">
              <GhostButton icon={ArrowLeft} onClick={handleBack}>
                Atrás
              </GhostButton>
              <PrimaryButton icon={ArrowRight} onClick={handleNext}>
                Siguiente
              </PrimaryButton>
            </div>
          )}
        </div>
      </div>

      {/* Modal confirmación elegibilidad */}
      {showEligibilityConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-md fhr-card p-6"
          >
            <h3 className="text-lg font-medium text-white mb-3">
              Confirmar cambios de Elegibilidad
            </h3>

            <p className="text-sm text-slate-400 mb-4">
              Esta configuración afecta a toda la empresa. Los cambios se aplicarán inmediatamente.
            </p>

            <div className="rounded-lg bg-slate-900/50 border border-slate-700/50 p-4 mb-5 space-y-2">
              <p className="text-sm font-medium text-slate-300">Resumen de impacto:</p>
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Settings2 className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                <span>
                  <span className="text-white font-medium">{eligibilityStats.eligibleLevels}</span> de {eligibilityStats.totalLevels} niveles tendrán metas
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Users className="w-4 h-4 text-purple-400 flex-shrink-0" />
                <span>
                  <span className="text-white font-medium">{eligibilityStats.affectedEmployees}</span> empleados afectados
                </span>
              </div>
            </div>

            {eligibilitySaveError && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {eligibilitySaveError}
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <GhostButton
                onClick={() => setShowEligibilityConfirmModal(false)}
                disabled={isSavingEligibility}
              >
                Cancelar
              </GhostButton>
              <PrimaryButton
                icon={isSavingEligibility ? Loader2 : Check}
                onClick={handleEligibilityConfirm}
                disabled={isSavingEligibility}
                isLoading={isSavingEligibility}
              >
                {isSavingEligibility ? 'Guardando...' : 'Guardar y Continuar'}
              </PrimaryButton>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
