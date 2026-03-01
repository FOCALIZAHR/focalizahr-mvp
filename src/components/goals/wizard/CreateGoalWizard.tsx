// ════════════════════════════════════════════════════════════════════════════
// CREATE GOAL WIZARD - Orquestador principal del wizard de metas
// src/components/goals/wizard/CreateGoalWizard.tsx
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, ArrowRight, X, Target, HelpCircle } from 'lucide-react'
import { PrimaryButton, GhostButton } from '@/components/ui/PremiumButton'
import { formatDisplayName } from '@/lib/utils/formatName'

import { WizardProgress } from './WizardProgress'
import StepSelectLevel from './StepSelectLevel'
import StepDefineGoal from './StepDefineGoal'
import StepConfigureMetric from './StepConfigureMetric'
import StepSetDates from './StepSetDates'
import StepLinkParent from './StepLinkParent'
import StepConfirm from './StepConfirm'
import GoalStepCover from './GoalStepCover'

// ════════════════════════════════════════════════════════════════════════════
// CONSTANTES
// ════════════════════════════════════════════════════════════════════════════

const STEPS_FULL = [
  { id: 1, name: 'Nivel' },
  { id: 2, name: 'Definición' },
  { id: 3, name: 'Medición' },
  { id: 4, name: 'Tiempo' },
  { id: 5, name: 'Cascada' },
  { id: 6, name: 'Confirmar' },
]

const STEPS_INDIVIDUAL = [
  { id: 2, name: 'Definición' },
  { id: 3, name: 'Medición' },
  { id: 4, name: 'Tiempo' },
  { id: 5, name: 'Cascada' },
  { id: 6, name: 'Confirmar' },
]

const STEP_COVERS: Record<number, {
  step: string
  title: string
  subtitle: string
  cta: string
  smartTip: string
}> = {
  1: {
    step: 'Paso 1 de 6',
    title: '¿Dónde impacta esta meta?',
    subtitle: 'Define el alcance: ¿es para toda la empresa, un área, o una persona específica?',
    cta: 'Definir Alcance',
    smartTip: 'SMART: Empieza definiendo a quién aplica.'
  },
  2: {
    step: 'Paso 2 de 6',
    title: 'Define el objetivo',
    subtitle: 'Tu misión: describir qué debe lograr. Sé claro y específico.',
    cta: 'Comenzar',
    smartTip: 'S: Específica. Evita "mejorar". Di exactamente qué.'
  },
  3: {
    step: 'Paso 3 de 6',
    title: 'Define la medición',
    subtitle: 'Tu misión: establecer cómo sabrás que se logró. Sin número, no hay meta.',
    cta: 'Continuar',
    smartTip: 'M: Medible. Ejemplo: "Aumentar ventas 20%".'
  },
  4: {
    step: 'Paso 4 de 6',
    title: 'Define el plazo',
    subtitle: 'Tu misión: establecer inicio y cierre. Sin fecha, las metas se postergan.',
    cta: 'Continuar',
    smartTip: 'T: Temporal. Una meta sin fecha no se cumple.'
  },
  5: {
    step: 'Paso 5 de 6',
    title: 'Conecta con la estrategia',
    subtitle: 'Tu misión: vincular a un objetivo mayor. Una meta conectada tiene más impacto.',
    cta: 'Continuar',
    smartTip: 'R: Relevante. ¿Aporta a los objetivos del negocio?'
  },
  6: {
    step: 'Último paso',
    title: 'Confirma y activa',
    subtitle: 'Revisa los datos. Al guardar, el colaborador será notificado.',
    cta: 'Crear Meta',
    smartTip: 'A: Alcanzable. ¿Tiene los recursos para lograrlo?'
  },
}

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

  // Meta Líder
  isLeaderGoal: boolean
}

interface EmployeeData {
  id: string
  fullName: string
  assignmentStatus: {
    totalWeight: number
    goalCount: number
    maxGoals: number
    status: 'EMPTY' | 'INCOMPLETE' | 'READY' | 'EXCEEDED'
    isComplete: boolean
  }
}

type WizardPhase = 'cover' | 'steps'

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
  isLeaderGoal: false,
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

interface CreateGoalWizardProps {
  employeeId?: string
  context?: string
}

export default function CreateGoalWizard({ employeeId: initialEmployeeId, context }: CreateGoalWizardProps) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(initialEmployeeId ? 2 : 1)
  const [data, setData] = useState<GoalWizardData>(() => {
    if (initialEmployeeId) {
      return { ...initialData, level: 'INDIVIDUAL', employeeId: initialEmployeeId }
    }
    return initialData
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Per-step cover/form phase
  const [stepPhase, setStepPhase] = useState<'cover' | 'form'>('cover')

  // Cinema Mode: wizard-level phase y datos del empleado
  const [phase, setPhase] = useState<WizardPhase>(
    initialEmployeeId ? 'cover' : 'steps'
  )
  const [employeeData, setEmployeeData] = useState<EmployeeData | null>(null)
  const [isLoadingEmployee, setIsLoadingEmployee] = useState(!!initialEmployeeId)

  // Peso disponible
  const availableWeight = employeeData
    ? 100 - employeeData.assignmentStatus.totalWeight
    : 100

  // Steps dinámicos
  const steps = initialEmployeeId ? STEPS_INDIVIDUAL : STEPS_FULL
  const firstStepId = initialEmployeeId ? 2 : 1

  // Cargar datos del empleado
  useEffect(() => {
    if (!initialEmployeeId) return

    setIsLoadingEmployee(true)
    const token = localStorage.getItem('focalizahr_token')

    fetch('/api/goals/team', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      credentials: 'include',
    })
      .then(res => res.json())
      .then(res => {
        if (res.success && res.data) {
          const employee = res.data.find((e: any) => e.id === initialEmployeeId)
          if (employee) {
            setEmployeeData({
              id: employee.id,
              fullName: employee.fullName,
              assignmentStatus: employee.assignmentStatus,
            })
          }
        }
      })
      .catch(err => console.error('Error loading employee:', err))
      .finally(() => setIsLoadingEmployee(false))
  }, [initialEmployeeId])

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

  // Navegacion con cover/form
  const goNext = useCallback(() => {
    if (stepPhase === 'cover') {
      setStepPhase('form')
    } else if (canProceed && currentStep < 6) {
      setCurrentStep(prev => prev + 1)
      setStepPhase('cover')
    }
  }, [canProceed, currentStep, stepPhase])

  const goBack = useCallback(() => {
    if (stepPhase === 'form') {
      setStepPhase('cover')
    } else if (currentStep > firstStepId) {
      setCurrentStep(prev => prev - 1)
      setStepPhase('form')
    }
  }, [currentStep, firstStepId, stepPhase])

  // Entrar al wizard desde GoalStepCover (opción A: skip step cover)
  const handleEnterWizard = useCallback(() => {
    setPhase('steps')
    setStepPhase('form')
  }, [])

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
        isLeaderGoal: data.isLeaderGoal || false,
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

  // Renderizar cover de un paso
  const renderStepCover = useCallback(() => {
    const cover = STEP_COVERS[currentStep]
    if (!cover) return null

    return (
      <div className="h-full flex flex-col items-center justify-center text-center px-8 py-12">
        {/* Indicador paso */}
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm font-semibold text-cyan-400 tracking-widest uppercase mb-4"
        >
          {cover.step}
        </motion.span>

        {/* Título */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl md:text-4xl font-light text-white mb-4"
        >
          {cover.title}
        </motion.h1>

        {/* Subtítulo coach */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-lg text-slate-400 mb-8 max-w-md"
        >
          {cover.subtitle}
        </motion.p>

        {/* Smart Tip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="flex items-center gap-2 text-slate-500 text-sm mb-10"
        >
          <HelpCircle className="w-4 h-4" />
          <span className="italic">{cover.smartTip}</span>
        </motion.div>

        {/* CTA */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          onClick={goNext}
          className="flex items-center gap-3 px-8 py-3 rounded-xl font-medium text-base transition-all"
          style={{
            background: 'linear-gradient(135deg, #22D3EE, #22D3EEDD)',
            color: '#0F172A',
            boxShadow: '0 8px 24px -6px rgba(34, 211, 238, 0.4)'
          }}
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
        >
          <span>{cover.cta}</span>
          <ArrowRight className="w-4 h-4" />
        </motion.button>
      </div>
    )
  }, [currentStep, goNext])

  // Nombres de paso para header del form
  const stepNames: Record<number, string> = {
    1: 'Alcance',
    2: 'Definición',
    3: 'Medición',
    4: 'Tiempo',
    5: 'Cascada',
    6: 'Confirmación'
  }

  // Renderizar formulario del paso actual
  const renderStepForm = useCallback(() => {
    const props = { data, updateData }
    const cover = STEP_COVERS[currentStep]

    const stepContent = (() => {
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
          return <StepLinkParent {...props} availableWeight={availableWeight} />
        case 6:
          return <StepConfirm {...props} />
        default:
          return null
      }
    })()

    return (
      <div className="flex flex-col">
        {/* Header minimalista del form */}
        <div className="flex items-center justify-between mb-6 px-2">
          <span className="text-sm font-semibold text-cyan-400">
            Paso {currentStep} de 6 · {stepNames[currentStep]}
          </span>

          {/* Tooltip SMART */}
          {cover?.smartTip && (
            <div className="group relative">
              <HelpCircle className="w-4 h-4 text-slate-500 hover:text-cyan-400 cursor-help transition-colors" />

              {/* Tooltip content */}
              <div className="absolute right-0 top-6 w-64 p-3 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-300 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                {cover.smartTip}
              </div>
            </div>
          )}
        </div>

        {/* Contenido del step */}
        {stepContent}
      </div>
    )
  }, [currentStep, data, updateData, availableWeight])

  const handleCancel = useCallback(() => {
    router.back()
  }, [router])

  // Loading state
  if (isLoadingEmployee) {
    return (
      <div className="fhr-bg-main min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Cargando información...</p>
        </div>
      </div>
    )
  }

  // Cover phase (solo si viene con employeeId)
  if (phase === 'cover' && employeeData) {
    return (
      <div className="fhr-bg-main min-h-screen">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="flex justify-end mb-8">
            <button
              onClick={handleCancel}
              className="p-2 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <GoalStepCover
            employeeName={employeeData.fullName}
            assignmentStatus={employeeData.assignmentStatus}
            onEnter={handleEnterWizard}
          />
        </div>
      </div>
    )
  }

  // Steps phase
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
            <span className="text-white font-medium">
              {employeeData
                ? `Meta para ${formatDisplayName(employeeData.fullName, 'short').split(' ')[0]}`
                : 'Nueva Meta'}
            </span>
          </div>

          <div className="w-20" />
        </div>

        {/* Progress */}
        <WizardProgress steps={steps} currentStep={currentStep} />

        {/* Step content with animation */}
        <div className="fhr-card p-6 md:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${currentStep}-${stepPhase}`}
              variants={stepVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={stepTransition}
            >
              {stepPhase === 'cover' ? renderStepCover() : renderStepForm()}
            </motion.div>
          </AnimatePresence>

          {/* Error */}
          {error && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Navigation - solo en form */}
          {stepPhase === 'form' && (
            <div className="flex justify-between mt-8 pt-6 border-t border-slate-700/50">
              <GhostButton
                icon={ArrowLeft}
                onClick={goBack}
                disabled={currentStep === firstStepId && stepPhase === 'form'}
              >
                Atrás
              </GhostButton>

              {currentStep < 6 ? (
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
          )}
        </div>
      </div>
    </div>
  )
}
