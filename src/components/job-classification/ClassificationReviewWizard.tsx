'use client'

// ============================================================================
// ClassificationReviewWizard - Focus mode 1/N review wizard
// Step-by-step classification of pending employees with keyboard navigation,
// conflict detection, and progress tracking.
// Keyboard: 1/2/3 = select track, Arrow keys = navigate, Enter = next, Esc = back
// ============================================================================

import { memo, useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, ArrowRight, AlertTriangle, CheckCircle2,
  Sparkles
} from 'lucide-react'
import { EmployeeClassificationCard } from './EmployeeClassificationCard'
import { cn } from '@/lib/utils'
import { PrimaryButton, GhostButton } from '@/components/ui/PremiumButton'
import type { ClassificationEmployee, PerformanceTrack } from '@/types/job-classification'

// ══════════════════════════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════════════════════════

export interface ClassificationReviewWizardProps {
  employees: ClassificationEmployee[]
  onClassify: (employeeId: string, track: PerformanceTrack, jobLevel: string) => void
  onComplete: () => void
  onBack: () => void
}

// ══════════════════════════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════════════════════════

function trackToJobLevel(track: PerformanceTrack): string {
  switch (track) {
    case 'EJECUTIVO':
      return 'gerente_director'
    case 'MANAGER':
      return 'jefe'
    case 'COLABORADOR':
    default:
      return 'profesional_analista'
  }
}

// Max number of step indicator dots to render
const MAX_STEP_DOTS = 20

// ══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ══════════════════════════════════════════════════════════════════════════

export const ClassificationReviewWizard = memo(function ClassificationReviewWizard({
  employees,
  onClassify,
  onComplete,
  onBack
}: ClassificationReviewWizardProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [classifiedIds, setClassifiedIds] = useState<Set<string>>(() => {
    // Pre-populate with employees that already have draftTrack
    const initial = new Set<string>()
    employees.forEach(emp => {
      if (emp.draftTrack) initial.add(emp.id)
    })
    return initial
  })
  const [direction, setDirection] = useState<'next' | 'prev'>('next')

  const total = employees.length
  const currentEmployee = employees[currentIndex]
  const completed = classifiedIds.size
  const progress = total > 0 ? (completed / total) * 100 : 0

  const isFirst = currentIndex === 0
  const isLast = currentIndex === total - 1
  const allCompleted = completed === total
  const showStepDots = total <= MAX_STEP_DOTS

  // ════════════════════════════════════════════════════════════════════════
  // HANDLERS
  // ════════════════════════════════════════════════════════════════════════

  const handleClassify = useCallback((track: PerformanceTrack) => {
    if (!currentEmployee) return

    const jobLevel = trackToJobLevel(track)
    onClassify(currentEmployee.id, track, jobLevel)

    setClassifiedIds(prev => {
      const next = new Set(prev)
      next.add(currentEmployee.id)
      return next
    })
  }, [currentEmployee, onClassify])

  const handleNext = useCallback(() => {
    if (isLast) {
      if (allCompleted) {
        onComplete()
      }
      return
    }

    setDirection('next')
    setCurrentIndex(prev => prev + 1)
  }, [isLast, allCompleted, onComplete])

  const handlePrev = useCallback(() => {
    if (isFirst) {
      onBack()
      return
    }

    setDirection('prev')
    setCurrentIndex(prev => prev - 1)
  }, [isFirst, onBack])

  // Keyboard navigation (Arrow keys, Enter, Escape)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

      if (e.key === 'ArrowRight' || e.key === 'Enter') {
        e.preventDefault()
        handleNext()
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        handlePrev()
      } else if (e.key === 'Escape') {
        onBack()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleNext, handlePrev, onBack])

  // ════════════════════════════════════════════════════════════════════════
  // EMPTY STATE
  // ════════════════════════════════════════════════════════════════════════

  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <CheckCircle2 className="w-16 h-16 text-emerald-400" />
        <h3 className="text-xl font-semibold text-white">
          Todo clasificado
        </h3>
        <p className="text-slate-400">
          No hay empleados pendientes de revisi&oacute;n
        </p>
        <PrimaryButton onClick={onComplete}>
          Continuar
        </PrimaryButton>
      </div>
    )
  }

  // ════════════════════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════════════════════

  const currentIsClassified = classifiedIds.has(currentEmployee.id) || !!currentEmployee.draftTrack

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500/10 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h2 className="text-lg font-light text-white">
              Cargos que necesitan tu <span className="fhr-title-gradient">decisión</span>
            </h2>
            <p className="text-sm text-slate-400">
              {currentIndex + 1} de {total}
            </p>
          </div>
        </div>

        {/* Quick stats */}
        <div className="text-right">
          <p className="text-sm text-slate-400">Completados</p>
          <p className="text-lg font-semibold text-emerald-400">
            {completed}/{total}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-2">
        <div className="relative h-2 bg-slate-800 rounded-full overflow-hidden">
          <motion.div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-cyan-500 to-purple-500"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Step indicators (only for small sets) */}
        {showStepDots && (
          <div className="flex items-center justify-center gap-1.5">
            {employees.map((emp, idx) => (
              <button
                key={emp.id}
                onClick={() => {
                  setDirection(idx > currentIndex ? 'next' : 'prev')
                  setCurrentIndex(idx)
                }}
                className={cn(
                  'w-2.5 h-2.5 rounded-full transition-all duration-200',
                  idx === currentIndex
                    ? 'bg-white scale-125 shadow-lg shadow-white/20'
                    : classifiedIds.has(emp.id) || emp.draftTrack
                      ? 'bg-emerald-400 hover:bg-emerald-300'
                      : 'bg-slate-600 hover:bg-slate-500'
                )}
                title={`${emp.fullName} (${idx + 1}/${total})`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Employee Card (animated transition) */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentEmployee.id}
          initial={{
            opacity: 0,
            x: direction === 'next' ? 50 : -50
          }}
          animate={{ opacity: 1, x: 0 }}
          exit={{
            opacity: 0,
            x: direction === 'next' ? -50 : 50
          }}
          transition={{ duration: 0.2 }}
        >
          <EmployeeClassificationCard
            employee={currentEmployee}
            onClassify={handleClassify}
            selectedTrack={currentEmployee.draftTrack}
          />
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-700/50">
        <GhostButton
          onClick={handlePrev}
          icon={ArrowLeft}
          size="sm"
        >
          {isFirst ? 'Cancelar' : 'Anterior'}
        </GhostButton>

        <div className="flex items-center gap-2">
          {completed >= 3 && completed < total && (
            <span className="text-xs text-cyan-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Tip: Presiona &rarr; para avanzar
            </span>
          )}
        </div>

        <PrimaryButton
          onClick={handleNext}
          disabled={!currentIsClassified}
          icon={isLast ? (allCompleted ? CheckCircle2 : undefined) : ArrowRight}
          iconPosition={isLast ? 'left' : 'right'}
          size="sm"
        >
          {isLast ? (allCompleted ? 'Finalizar' : 'Clasifica para continuar') : 'Siguiente'}
        </PrimaryButton>
      </div>

      {/* Keyboard hints */}
      <div className="flex items-center justify-center gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-400">&larr;</kbd>
          <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-400">&rarr;</kbd>
          Navegar
        </span>
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-400">1</kbd>
          <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-400">2</kbd>
          <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-400">3</kbd>
          Seleccionar
        </span>
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-400">Enter</kbd>
          Confirmar
        </span>
      </div>
    </div>
  )
})

export default ClassificationReviewWizard
