// ════════════════════════════════════════════════════════════════════════════
// CREATE GOAL WIZARD - Orquestador principal del wizard de metas
// src/components/goals/wizard/CreateGoalWizard.tsx
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, ArrowRight, X, Target } from 'lucide-react'
import { PrimaryButton, GhostButton } from '@/components/ui/PremiumButton'

import { WizardProgress } from './WizardProgress'
import StepSelectLevel from './StepSelectLevel'
import StepDefineGoal from './StepDefineGoal'
import StepConfigureMetric from './StepConfigureMetric'
import StepSetDates from './StepSetDates'
import StepLinkParent from './StepLinkParent'
import StepConfirm from './StepConfirm'

// ════════════════════════════════════════════════════════════════════════════
// CONSTANTES
// ════════════════════════════════════════════════════════════════════════════

const STEPS = [
  { id: 1, name: 'Tipo' },
  { id: 2, name: 'Definicion' },
  { id: 3, name: 'Medicion' },
  { id: 4, name: 'Tiempo' },
  { id: 5, name: 'Cascada' },
  { id: 6, name: 'Confirmar' },
]

// ════════════════════════════════════════════════════════════════════════════
// TIPOS
// ════════════════════════════════════════════════════════════════════════════

export interface GoalWizardData {
  // Paso 1: Tipo/Nivel
  level: 'COMPANY' | 'AREA' | 'INDIVIDUAL' | ''
  employeeId?: string
  departmentId?: string

  // Paso 2: Definicion
  title: string
  description: string
  type: 'KPI' | 'OBJECTIVE' | 'KEY_RESULT' | 'PROJECT'

  // Paso 3: Medicion
  metricType: 'PERCENTAGE' | 'CURRENCY' | 'NUMBER' | 'BINARY'
  startValue: number
  targetValue: number
  unit: string

  // Paso 4: Tiempo
  startDate: string
  dueDate: string
  periodYear: number
  periodQuarter?: number

  // Paso 5: Cascada
  parentId?: string
  parentTitle?: string
  weight: number
}

const initialData: GoalWizardData = {
  level: '',
  title: '',
  description: '',
  type: 'KPI',
  metricType: 'PERCENTAGE',
  startValue: 0,
  targetValue: 100,
  unit: '%',
  startDate: '',
  dueDate: '',
  periodYear: new Date().getFullYear(),
  weight: 0,
}

// ════════════════════════════════════════════════════════════════════════════
// ANIMACIONES
// ════════════════════════════════════════════════════════════════════════════

const stepVariants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
}

const stepTransition = {
  duration: 0.2,
  ease: [0.16, 1, 0.3, 1] as const,
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE
// ════════════════════════════════════════════════════════════════════════════

export default function CreateGoalWizard() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [data, setData] = useState<GoalWizardData>(initialData)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Actualizar datos
  const updateData = useCallback((updates: Partial<GoalWizardData>) => {
    setData((prev) => ({ ...prev, ...updates }))
  }, [])

  // Validacion por paso
  const canProceed = useMemo(() => {
    switch (currentStep) {
      case 1:
        if (!data.level) return false
        if (data.level === 'INDIVIDUAL' && !data.employeeId) return false
        if (data.level === 'AREA' && !data.departmentId) return false
        return true
      case 2:
        return data.title.trim().length >= 3
      case 3:
        return data.targetValue > data.startValue || data.metricType === 'BINARY'
      case 4:
        return (
          !!data.startDate &&
          !!data.dueDate &&
          new Date(data.dueDate) > new Date(data.startDate)
        )
      case 5:
        return true // Opcional
      case 6:
        return true
      default:
        return false
    }
  }, [currentStep, data])

  // Navegacion
  const goNext = useCallback(() => {
    if (canProceed && currentStep < STEPS.length) {
      setCurrentStep((prev) => prev + 1)
    }
  }, [canProceed, currentStep])

  const goBack = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1)
    }
  }, [currentStep])

  // Enviar
  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true)
    setError('')

    try {
      const token = localStorage.getItem('focalizahr_token')

      const payload = {
        title: data.title,
        description: data.description || undefined,
        type: data.type,
        level: data.level,
        employeeId: data.employeeId || undefined,
        departmentId: data.departmentId || undefined,
        metricType: data.metricType,
        startValue: data.startValue,
        targetValue: data.targetValue,
        unit: data.unit || undefined,
        startDate: data.startDate,
        dueDate: data.dueDate,
        periodYear: data.periodYear,
        periodQuarter: data.periodQuarter || undefined,
        parentId: data.parentId || undefined,
        weight: data.weight,
      }

      const res = await fetch('/api/goals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Error creando meta')
      }

      const result = await res.json()
      router.push(`/dashboard/metas/${result.data.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setIsSubmitting(false)
    }
  }, [data, router])

  // Renderizar paso actual
  const renderStep = useCallback(() => {
    const props = { data, updateData }

    switch (currentStep) {
      case 1:
        return <StepSelectLevel {...props} />
      case 2:
        return <StepDefineGoal {...props} />
      case 3:
        return <StepConfigureMetric {...props} />
      case 4:
        return <StepSetDates {...props} />
      case 5:
        return <StepLinkParent {...props} />
      case 6:
        return <StepConfirm {...props} />
      default:
        return null
    }
  }, [currentStep, data, updateData])

  const handleCancel = useCallback(() => {
    router.back()
  }, [router])

  return (
    <div className="fhr-bg-main min-h-screen">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={handleCancel}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
            <span className="text-sm">Cancelar</span>
          </button>

          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-cyan-400" />
            <span className="text-white font-medium">Nueva Meta</span>
          </div>

          <div className="w-20" /> {/* Spacer */}
        </div>

        {/* Progress */}
        <WizardProgress steps={STEPS} currentStep={currentStep} />

        {/* Step content with animation */}
        <div className="fhr-card p-6 md:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              variants={stepVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={stepTransition}
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>

          {/* Error */}
          {error && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-6 border-t border-slate-700/50">
            <GhostButton
              icon={ArrowLeft}
              onClick={goBack}
              disabled={currentStep === 1}
            >
              Atras
            </GhostButton>

            {currentStep < STEPS.length ? (
              <PrimaryButton
                icon={ArrowRight}
                iconPosition="right"
                onClick={goNext}
                disabled={!canProceed}
              >
                Continuar
              </PrimaryButton>
            ) : (
              <PrimaryButton
                icon={Target}
                onClick={handleSubmit}
                disabled={isSubmitting}
                isLoading={isSubmitting}
              >
                {isSubmitting ? 'Creando...' : 'Crear Meta'}
              </PrimaryButton>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
