// ════════════════════════════════════════════════════════════════════════════
// BULK ASSIGN WIZARD - Cinema Mode wizard para asignación masiva de metas
// src/components/goals/team/BulkAssignWizard.tsx
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ArrowLeft, ArrowRight, Target, Loader2 } from 'lucide-react'
import { PrimaryButton, GhostButton } from '@/components/ui/PremiumButton'
import { WizardProgress } from '../wizard/WizardProgress'

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
  { id: 3, name: 'Targets' },
  { id: 4, name: 'Pesos' },
]

// ════════════════════════════════════════════════════════════════════════════
// TIPOS
// ════════════════════════════════════════════════════════════════════════════

interface Employee {
  id: string
  fullName: string
  position: string
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
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [data, setData] = useState<BulkAssignData>({
    employeeIds: employees.map(e => e.id),
    employees,
    goalSource: 'cascade',
    targets: {},
    weights: Object.fromEntries(employees.map(e => [e.id, 0])),
  })

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
    if (canProceed && currentStep < STEPS.length) {
      setCurrentStep(prev => prev + 1)
    }
  }, [canProceed, currentStep])

  const goBack = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1)
    }
  }, [currentStep])

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

  const renderStep = useCallback(() => {
    switch (currentStep) {
      case 1:
        return <StepConfirmSelection data={data} removeEmployee={removeEmployee} />
      case 2:
        return <StepSelectGoal data={data} updateData={updateData} />
      case 3:
        return <StepSetTargets data={data} updateData={updateData} />
      case 4:
        return <StepWeightsConfirm data={data} updateData={updateData} />
      default:
        return null
    }
  }, [currentStep, data, updateData, removeEmployee])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-2xl max-h-[90vh] overflow-hidden fhr-card"
      >
        {/* Header */}
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
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress */}
        <div className="px-4 pt-4">
          <WizardProgress steps={STEPS} currentStep={currentStep} />
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 200px)' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>

          {error && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
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
      </motion.div>
    </div>
  )
}
