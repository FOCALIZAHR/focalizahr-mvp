// ════════════════════════════════════════════════════════════════════════════
// BULK ASSIGN WIZARD - Cinema Mode wizard para asignación masiva de metas
// src/components/goals/team/BulkAssignWizard.tsx
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ArrowLeft, ArrowRight, Target, Loader2, HelpCircle } from 'lucide-react'
import { PrimaryButton, GhostButton } from '@/components/ui/PremiumButton'
import { cn } from '@/lib/utils'

import StepConfirmSelection from './steps/StepConfirmSelection'
import StepSelectGoal from './steps/StepSelectGoal'
import StepSetTargets from './steps/StepSetTargets'
import StepWeightsConfirm from './steps/StepWeightsConfirm'

// ════════════════════════════════════════════════════════════════════════════
// CONSTANTES
// ════════════════════════════════════════════════════════════════════════════

const STEPS = [
  { id: 1, name: 'Confirmar' },
  { id: 2, name: 'Meta' },
  { id: 3, name: 'Nivel de Meta' },
  { id: 4, name: 'Pesos' },
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
    title: 'Define tu equipo',
    subtitle: 'Vas a asignar la misma meta a varias personas. Confirma quiénes participan.',
    cta: 'Confirmar Equipo',
    smartTip: 'Incluye solo a quienes tienen capacidad de peso disponible.'
  },
  2: {
    step: 'Paso 2 de 4',
    title: 'Elige el origen',
    subtitle: 'Una meta clara alinea a tu equipo. ¿Cascadeas desde la estrategia o creas algo nuevo?',
    cta: 'Continuar',
    smartTip: 'S: Específica. Cascadear conecta automáticamente con los objetivos del negocio.'
  },
  3: {
    step: 'Paso 3 de 4',
    title: 'Define el objetivo',
    subtitle: 'El mismo propósito, pero cada persona puede tener un número diferente. ¿Cuánto debe alcanzar cada uno?',
    cta: 'Continuar',
    smartTip: 'M: Medible. Un objetivo sin número no es meta, es deseo.'
  },
  4: {
    step: 'Último paso',
    title: 'Asigna la importancia',
    subtitle: 'El peso define cuánto vale esta meta en la evaluación de cada persona.',
    cta: 'Asignar a Todos',
    smartTip: 'A: Alcanzable. Verifica que cada persona tenga peso disponible antes de asignar.'
  }
}

const STEP_NAMES: Record<number, string> = {
  1: 'Selección',
  2: 'Objetivo',
  3: 'Nivel de Meta',
  4: 'Pesos'
}

// ════════════════════════════════════════════════════════════════════════════
// TIPOS
// ════════════════════════════════════════════════════════════════════════════

interface Employee {
  id: string
  fullName: string
  position: string
}

export interface EmployeeWithStatus extends Employee {
  assignmentStatus?: {
    totalWeight: number
    goalCount: number
    maxGoals: number
    status: string
  }
}

interface BulkAssignWizardProps {
  employees: Employee[]
  onClose: () => void
  onComplete: () => void
}

export interface BulkAssignData {
  employeeIds: string[]
  employees: Employee[]

  // Step 2
  goalSource: 'cascade' | 'new'
  parentGoalId?: string
  parentGoalTitle?: string
  newGoalTitle?: string
  newGoalDescription?: string

  // Step 3: targets individuales
  targets: Record<string, { targetValue: number; unit: string }>

  // Step 4: pesos
  weights: Record<string, number>
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE
// ════════════════════════════════════════════════════════════════════════════

export default function BulkAssignWizard({ employees, onClose, onComplete }: BulkAssignWizardProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [stepPhase, setStepPhase] = useState<'cover' | 'form'>('cover')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [employeesWithStatus, setEmployeesWithStatus] = useState<EmployeeWithStatus[]>([])
  const [isLoadingStatus, setIsLoadingStatus] = useState(true)

  const [data, setData] = useState<BulkAssignData>({
    employeeIds: employees.map(e => e.id),
    employees,
    goalSource: 'cascade',
    targets: {},
    weights: Object.fromEntries(employees.map(e => [e.id, 0])),
  })

  // Fetch datos frescos al montar
  useEffect(() => {
    const fetchEmployeeStatus = async () => {
      setIsLoadingStatus(true)
      try {
        const token = typeof window !== 'undefined'
          ? localStorage.getItem('focalizahr_token')
          : null

        const res = await fetch('/api/goals/team', {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
          credentials: 'include',
        })

        if (!res.ok) throw new Error('Error fetching team')

        const { data } = await res.json()

        const enriched = employees.map(emp => {
          const found = data.find((e: any) => e.id === emp.id)
          return {
            ...emp,
            assignmentStatus: found?.assignmentStatus || undefined
          }
        })

        setEmployeesWithStatus(enriched)
      } catch (err) {
        console.error('Error fetching employee status:', err)
        setEmployeesWithStatus(employees.map(e => ({ ...e, assignmentStatus: undefined })))
      } finally {
        setIsLoadingStatus(false)
      }
    }

    fetchEmployeeStatus()
  }, [employees])

  const updateData = useCallback((updates: Partial<BulkAssignData>) => {
    setData(prev => ({ ...prev, ...updates }))
  }, [])

  const removeEmployee = useCallback((id: string) => {
    setData(prev => ({
      ...prev,
      employeeIds: prev.employeeIds.filter(eid => eid !== id),
      employees: prev.employees.filter(e => e.id !== id),
    }))
  }, [])

  // Validation per step
  const canProceed = useMemo(() => {
    switch (currentStep) {
      case 1:
        return data.employeeIds.length > 0
      case 2:
        if (data.goalSource === 'cascade') return !!data.parentGoalId
        return !!data.newGoalTitle && data.newGoalTitle.length >= 3
      case 3:
        return data.employeeIds.every(id =>
          data.targets[id]?.targetValue !== undefined &&
          data.targets[id]?.targetValue > 0
        )
      case 4:
        return true
      default:
        return false
    }
  }, [currentStep, data])

  const goNext = useCallback(() => {
    if (stepPhase === 'cover') {
      setStepPhase('form')
    } else if (canProceed && currentStep < STEPS.length) {
      setCurrentStep(prev => prev + 1)
      setStepPhase('cover')
    }
  }, [canProceed, currentStep, stepPhase])

  const goBack = useCallback(() => {
    if (currentStep === 1 && stepPhase === 'cover') return

    if (stepPhase === 'form') {
      setStepPhase('cover')
    } else {
      // En cover, volver al form del paso anterior
      setCurrentStep(prev => prev - 1)
      setStepPhase('form')
    }
  }, [currentStep, stepPhase])

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true)
    setError('')

    try {
      const token = typeof window !== 'undefined'
        ? localStorage.getItem('focalizahr_token')
        : null

      const promises = data.employeeIds.map(async (employeeId) => {
        const payload = {
          title: data.goalSource === 'cascade'
            ? data.parentGoalTitle
            : data.newGoalTitle,
          description: data.newGoalDescription || undefined,
          level: 'INDIVIDUAL' as const,
          employeeId,
          parentId: data.parentGoalId || undefined,
          targetValue: data.targets[employeeId]?.targetValue || 100,
          unit: data.targets[employeeId]?.unit || '%',
          weight: data.weights[employeeId] || 0,
          startDate: new Date().toISOString(),
          dueDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
          periodYear: new Date().getFullYear(),
          metricType: 'NUMBER' as const,
          startValue: 0,
        }

        const res = await fetch('/api/goals', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          },
          credentials: 'include',
          body: JSON.stringify(payload),
        })

        if (!res.ok) throw new Error('Error creando meta')
        return res.json()
      })

      await Promise.all(promises)
      onComplete()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error asignando metas')
    } finally {
      setIsSubmitting(false)
    }
  }, [data, onComplete])

  const renderStepContent = useCallback(() => {
    switch (currentStep) {
      case 1:
        return <StepConfirmSelection data={data} removeEmployee={removeEmployee} />
      case 2:
        return <StepSelectGoal data={data} updateData={updateData} />
      case 3:
        return <StepSetTargets data={data} updateData={updateData} />
      case 4:
        return (
          <StepWeightsConfirm
            data={data}
            updateData={updateData}
            employeesWithStatus={employeesWithStatus}
            isLoadingStatus={isLoadingStatus}
          />
        )
      default:
        return null
    }
  }, [currentStep, data, updateData, removeEmployee, employeesWithStatus, isLoadingStatus])

  const renderStepCover = () => {
    const cover = STEP_COVERS[currentStep]
    if (!cover) return null

    return (
      <div className="flex flex-col items-center justify-center text-center px-8 py-6">
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

        <PrimaryButton onClick={goNext} icon={ArrowRight}>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-2xl max-h-[90vh] flex flex-col fhr-card"
      >
        {/* Header con progress compacto */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/10">
              <Target className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-white font-medium">Asignar Metas</h2>
              <p className="text-xs text-slate-400">{data.employeeIds.length} colaboradores</p>
            </div>
          </div>

          {/* Progress compacto */}
          <div className="flex items-center gap-2">
            {STEPS.map((step, idx) => (
              <div key={step.id} className="flex items-center gap-1">
                <div className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium',
                  currentStep > step.id
                    ? 'bg-cyan-500 text-slate-900'
                    : currentStep === step.id
                      ? 'bg-cyan-500/20 border border-cyan-500 text-cyan-400'
                      : 'bg-slate-800 text-slate-500'
                )}>
                  {currentStep > step.id ? '✓' : step.id}
                </div>
                {idx < STEPS.length - 1 && (
                  <div className={cn(
                    'w-4 h-px',
                    currentStep > step.id ? 'bg-cyan-500' : 'bg-slate-700'
                  )} />
                )}
              </div>
            ))}
          </div>

          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 160px)' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={`${currentStep}-${stepPhase}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {stepPhase === 'cover' ? renderStepCover() : renderStepForm()}
            </motion.div>
          </AnimatePresence>

          {error && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Footer - Solo en form, no en cover */}
        {stepPhase === 'form' && (
          <div className="flex justify-between p-4 border-t border-slate-700">
            <GhostButton icon={ArrowLeft} onClick={goBack} disabled={currentStep === 1}>
              Atrás
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
                icon={isSubmitting ? Loader2 : Target}
                onClick={handleSubmit}
                disabled={isSubmitting}
                isLoading={isSubmitting}
              >
                {isSubmitting ? 'Asignando...' : `Asignar a ${data.employeeIds.length}`}
              </PrimaryButton>
            )}
          </div>
        )}
      </motion.div>
    </div>
  )
}
