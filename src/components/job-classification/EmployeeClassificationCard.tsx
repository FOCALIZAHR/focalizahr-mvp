'use client'

// ============================================================================
// EmployeeClassificationCard - Focus mode card for individual classification
// Shows employee context, conflict detection, suggestion, and track selector.
// Keyboard shortcuts: 1 (EJECUTIVO), 2 (MANAGER), 3 (COLABORADOR)
// ============================================================================

import { memo, useState, useCallback, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  User, Briefcase, Building2, Users, AlertTriangle,
  Lightbulb, HelpCircle, Check
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ClassificationEmployee, PerformanceTrack } from '@/types/job-classification'

// ══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ══════════════════════════════════════════════════════════════════════════

const TRACK_OPTIONS: Array<{
  track: PerformanceTrack
  label: string
  description: string
  examples: string
  color: string
  bgColor: string
  borderColor: string
}> = [
  {
    track: 'EJECUTIVO',
    label: 'Ejecutivo',
    description: 'Alta direcci\u00f3n',
    examples: 'CEO, Gerentes, Directores',
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500'
  },
  {
    track: 'MANAGER',
    label: 'Manager',
    description: 'L\u00edderes de equipo',
    examples: 'Jefes, Supervisores, Coordinadores',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500'
  },
  {
    track: 'COLABORADOR',
    label: 'Colaborador',
    description: 'Contribuidores individuales',
    examples: 'Analistas, Especialistas, T\u00e9cnicos',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500'
  }
]

// ══════════════════════════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════════════════════════

export interface EmployeeClassificationCardProps {
  employee: ClassificationEmployee
  onClassify: (track: PerformanceTrack) => void
  selectedTrack?: PerformanceTrack | null
}

// ══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ══════════════════════════════════════════════════════════════════════════

export const EmployeeClassificationCard = memo(function EmployeeClassificationCard({
  employee,
  onClassify,
  selectedTrack
}: EmployeeClassificationCardProps) {
  const [localTrack, setLocalTrack] = useState<PerformanceTrack | null>(
    selectedTrack || employee.draftTrack || null
  )

  // Reset local track when employee changes
  useEffect(() => {
    setLocalTrack(selectedTrack || employee.draftTrack || null)
  }, [employee.id, selectedTrack, employee.draftTrack])

  const isConflict = employee.anomalyType === 'CONFLICT'
  const hasReports = employee.directReportsCount > 0
  const suggestedTrack = employee.suggestedTrack

  // Suggestion reason
  const getSuggestionReason = useCallback(() => {
    if (hasReports && employee.directReportsCount >= 3) {
      return `Como tiene ${employee.directReportsCount} reportes directos, probablemente es MANAGER`
    }
    if (employee.position?.toLowerCase().includes('gerente') ||
        employee.position?.toLowerCase().includes('director')) {
      return 'El cargo sugiere rol de alta direcci\u00f3n'
    }
    if (employee.position?.toLowerCase().includes('jefe') ||
        employee.position?.toLowerCase().includes('supervisor')) {
      return 'El cargo sugiere rol de liderazgo de equipo'
    }
    return 'Clasificaci\u00f3n basada en el tipo de cargo'
  }, [employee, hasReports])

  // Conflict explanation
  const conflictData = isConflict && hasReports
    ? {
        title: 'Inconsistencia detectada',
        description: `Su cargo dice "${employee.position}" (t\u00edpicamente COLABORADOR) pero tiene ${employee.directReportsCount} personas a cargo (t\u00edpico de MANAGER)`,
        question: '\u00bfCu\u00e1l describe mejor su rol real?'
      }
    : null

  // Keyboard shortcuts (1, 2, 3)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

      if (e.key === '1') {
        setLocalTrack('EJECUTIVO')
        onClassify('EJECUTIVO')
      } else if (e.key === '2') {
        setLocalTrack('MANAGER')
        onClassify('MANAGER')
      } else if (e.key === '3') {
        setLocalTrack('COLABORADOR')
        onClassify('COLABORADOR')
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClassify])

  const handleSelectTrack = (track: PerformanceTrack) => {
    setLocalTrack(track)
    onClassify(track)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      {/* Employee Info - CARGO as protagonist */}
      <div className="fhr-card p-6 relative">
        <div className="fhr-top-line" />
        <div className="text-center mb-3">
          <div className="inline-flex items-center gap-2 mb-2">
            <Briefcase className="w-4 h-4 text-purple-400" />
            <span className="text-xs text-slate-500 uppercase tracking-wider">Cargo</span>
          </div>
          <h2 className="text-2xl font-light text-white">
            {employee.position || 'Sin cargo'}
          </h2>
          {employee.employeeCount > 1 && (
            <p className="text-sm text-slate-400 mt-1">
              {employee.employeeCount} empleados con este cargo
            </p>
          )}
        </div>

        {/* Secondary context - only when there's data */}
        {(employee.fullName !== employee.position || employee.departmentName || hasReports) && (
          <div className="flex flex-wrap items-center justify-center gap-4 pt-3 border-t border-slate-700/50 text-sm">
            {employee.fullName && employee.fullName !== employee.position && (
              <span className="flex items-center gap-1.5 text-slate-400">
                <User className="w-3.5 h-3.5 text-cyan-400" />
                {employee.fullName}
              </span>
            )}
            {employee.departmentName && (
              <span className="flex items-center gap-1.5 text-slate-400">
                <Building2 className="w-3.5 h-3.5 text-blue-400" />
                {employee.departmentName}
              </span>
            )}
            {hasReports && (
              <span className="flex items-center gap-1.5 text-amber-400">
                <Users className="w-3.5 h-3.5" />
                {employee.directReportsCount} reportes directos
              </span>
            )}
          </div>
        )}
      </div>

      {/* Conflict Alert */}
      {conflictData && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-amber-400 mb-1">
                {conflictData.title}
              </h4>
              <p className="text-sm text-slate-300">
                {conflictData.description}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Suggestion (when no conflict) */}
      {!conflictData && (
        <div className="p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-xl">
          <div className="flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-cyan-400 mb-1">
                Sugerencia inteligente
              </h4>
              <p className="text-sm text-slate-300">
                {getSuggestionReason()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Question */}
      <div className="text-center">
        <h3 className="text-lg font-medium text-white mb-2">
          {conflictData ? conflictData.question : '\u00bfCu\u00e1l es el nivel correcto?'}
        </h3>
        <p className="text-sm text-slate-400">
          Presiona 1, 2 o 3 para selecci\u00f3n r\u00e1pida
        </p>
      </div>

      {/* Track Selection */}
      <div className="grid grid-cols-3 gap-3">
        {TRACK_OPTIONS.map((option, index) => {
          const isSelected = localTrack === option.track
          const isSuggested = suggestedTrack === option.track

          return (
            <motion.button
              key={option.track}
              onClick={() => handleSelectTrack(option.track)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                'relative p-4 rounded-xl border-2 transition-all duration-200',
                'flex flex-col items-center text-center gap-2',
                isSelected
                  ? `${option.bgColor} ${option.borderColor}`
                  : 'bg-slate-800/40 border-slate-700 hover:border-slate-600'
              )}
            >
              {/* Suggested badge */}
              {isSuggested && !isSelected && (
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-cyan-500 text-white text-xs font-medium rounded-full whitespace-nowrap">
                  Sugerido
                </span>
              )}

              {/* Selected checkmark */}
              {isSelected && (
                <span className="absolute top-2 right-2">
                  <Check className={cn('w-5 h-5', option.color)} />
                </span>
              )}

              {/* Number shortcut */}
              <span className="text-xs text-slate-500 font-mono">
                {index + 1}
              </span>

              {/* Label */}
              <span className={cn(
                'text-lg font-semibold',
                isSelected ? option.color : 'text-white'
              )}>
                {option.label}
              </span>

              {/* Description */}
              <span className="text-xs text-slate-400">
                {option.description}
              </span>

              {/* Examples */}
              <span className="text-xs text-slate-500 mt-1">
                {option.examples}
              </span>
            </motion.button>
          )
        })}
      </div>

      {/* Impact info */}
      <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
        <HelpCircle className="w-4 h-4" />
        <span>Esta clasificaci\u00f3n afecta qu\u00e9 preguntas recibir\u00e1 en su evaluaci\u00f3n</span>
      </div>
    </motion.div>
  )
})

export default EmployeeClassificationCard
