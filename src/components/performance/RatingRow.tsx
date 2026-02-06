// ════════════════════════════════════════════════════════════════════════════
// RATING ROW - Fila de empleado con score y asignador de potencial
// src/components/performance/RatingRow.tsx
// ════════════════════════════════════════════════════════════════════════════
// PATRON: SpotlightCard (avatar) + Mini-cards (scores)
// TASK_11B: Bugs arreglados + mejoras UX
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { memo, useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import {
  TrendingUp, Sparkles, ChevronRight,
  Check, Loader2, Building2
} from 'lucide-react'
import { getPerformanceClassification } from '@/config/performanceClassification'
import { useToast } from '@/components/ui/toast-system'

// ════════════════════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════════════════════

function getInitials(fullName: string): string {
  const parts = fullName.trim().split(' ').filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function getPotentialColor(score: number | null): string {
  if (!score) return '#64748b' // slate
  if (score >= 4.0) return '#10B981' // emerald (high)
  if (score >= 3.0) return '#F59E0B' // amber (medium)
  return '#EF4444' // red (low)
}

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

export interface RatingData {
  id: string
  employeeId: string
  employeeName: string
  employeePosition?: string | null
  departmentName?: string | null
  calculatedScore: number
  finalScore?: number | null
  potentialScore?: number | null
  potentialLevel?: string | null
  nineBoxPosition?: string | null
  potentialNotes?: string | null // TASK_11B: Agregar notas
}

export interface RatingRowProps {
  rating: RatingData
  onPotentialAssigned?: (ratingId: string, newPotential: number) => void
  isExpanded?: boolean
  onToggleExpand?: () => void
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════

export default memo(function RatingRow({
  rating,
  onPotentialAssigned,
  isExpanded = false,
  onToggleExpand
}: RatingRowProps) {
  const [isAssigning, setIsAssigning] = useState(false)
  const [localPotential, setLocalPotential] = useState<number | null>(rating.potentialScore ?? null)
  const [localNotes, setLocalNotes] = useState(rating.potentialNotes ?? '')
  const [notesStatus, setNotesStatus] = useState<'idle' | 'saving' | 'saved'>('idle')

  // Sistema de toasts oficial FocalizaHR
  const { success, error: showError } = useToast()

  const effectiveScore = rating.finalScore ?? rating.calculatedScore
  const perfClassification = getPerformanceClassification(effectiveScore)
  const potentialColor = getPotentialColor(localPotential)

  // ══════════════════════════════════════════════════════════════════════════
  // HANDLERS
  // ══════════════════════════════════════════════════════════════════════════

  // BUG 2 FIX: Enviar notes junto con potentialScore
  const handleAssignPotential = async (score: number) => {
    setIsAssigning(true)
    try {
      const res = await fetch(`/api/performance-ratings/${rating.id}/potential`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          potentialScore: score,
          notes: localNotes || undefined // BUG 2 FIX
        })
      })

      if (res.ok) {
        setLocalPotential(score)
        onPotentialAssigned?.(rating.id, score)
        // Toast sistema oficial FocalizaHR
        success(`Potencial asignado a "${rating.employeeName}"`, '¡Guardado!')
      } else {
        showError('Error al guardar. Intenta nuevamente.', 'Error')
      }
    } catch (err) {
      console.error('Error assigning potential:', err)
      showError('Error al guardar. Intenta nuevamente.', 'Error')
    } finally {
      setIsAssigning(false)
    }
  }

  // BUG 1 FIX: Auto-save notas con onBlur
  const handleSaveNotes = async () => {
    if (localNotes === (rating.potentialNotes ?? '')) return // sin cambios
    if (!localPotential) return // necesita tener potencial asignado primero

    setNotesStatus('saving')
    try {
      const res = await fetch(`/api/performance-ratings/${rating.id}/potential`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          potentialScore: localPotential,
          notes: localNotes
        })
      })
      if (res.ok) {
        setNotesStatus('saved')
        setTimeout(() => setNotesStatus('idle'), 2500)
      }
    } catch (error) {
      console.error('Error saving notes:', error)
      setNotesStatus('idle')
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════════════════

  return (
    <motion.div
      layout
      className={cn(
        'group relative p-4 rounded-xl transition-all duration-200',
        'bg-slate-800/30 hover:bg-slate-800/50',
        'border border-slate-700/30 hover:border-slate-600/50',
        isExpanded && 'bg-slate-800/60 border-slate-600/50'
      )}
    >
      {/* Linea Tesla sutil en hover */}
      <div
        className="absolute top-0 left-0 right-0 h-[1px] opacity-0 group-hover:opacity-100 transition-opacity"
        style={{
          background: `linear-gradient(90deg, transparent, ${perfClassification.color}40, transparent)`
        }}
      />

      <div className="flex items-center gap-4">
        {/* AVATAR - Estilo SpotlightCard */}
        <div className="relative flex-shrink-0">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-semibold border-2"
            style={{
              background: `linear-gradient(135deg, ${perfClassification.color}20, ${perfClassification.color}10)`,
              borderColor: `${perfClassification.color}40`,
              color: perfClassification.color
            }}
          >
            {getInitials(rating.employeeName)}
          </div>

          {/* Indicador de potencial asignado */}
          {localPotential && (
            <div
              className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-slate-900"
              style={{ backgroundColor: potentialColor, color: 'white' }}
            >
              {localPotential.toFixed(0)}
            </div>
          )}
        </div>

        {/* INFO EMPLEADO */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-slate-200 truncate">
              {rating.employeeName}
            </span>
            {rating.nineBoxPosition && (
              <span className="px-1.5 py-0.5 text-[10px] rounded bg-cyan-500/20 text-cyan-400">
                {rating.nineBoxPosition}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
            {rating.employeePosition && (
              <span className="truncate">{rating.employeePosition}</span>
            )}
            {rating.departmentName && (
              <span className="flex items-center gap-1">
                <Building2 className="w-3 h-3" />
                {rating.departmentName}
              </span>
            )}
          </div>
        </div>

        {/* SCORE PERFORMANCE - MEJORA 6: Mostrar label de clasificacion */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900/50">
          <TrendingUp className="w-4 h-4 text-slate-500" />
          <div className="text-right">
            <div
              className="text-lg font-semibold tabular-nums"
              style={{ color: perfClassification.color }}
            >
              {effectiveScore.toFixed(1)}
            </div>
            <div
              className="text-[10px]"
              style={{ color: `${perfClassification.color}80` }}
            >
              {effectiveScore > 0 ? perfClassification.label : 'Sin evaluar'}
            </div>
          </div>
        </div>

        {/* ASIGNADOR POTENCIAL */}
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <PotentialSelector
            currentValue={localPotential}
            isLoading={isAssigning}
            onSelect={handleAssignPotential}
          />
        </div>

        {/* CHEVRON para expandir */}
        <button
          onClick={onToggleExpand}
          className="p-2 rounded-lg hover:bg-slate-700/50 text-slate-500 hover:text-slate-300 transition-colors"
        >
          <ChevronRight className={cn(
            'w-4 h-4 transition-transform',
            isExpanded && 'rotate-90'
          )} />
        </button>
      </div>

      {/* EXPANDED: Notas y detalles */}
      {isExpanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="mt-4 pt-4 border-t border-slate-700/30"
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">
                Notas de Potencial (confidencial)
              </label>
              {/* BUG 1 FIX: Textarea conectado a estado */}
              <textarea
                value={localNotes}
                onChange={(e) => setLocalNotes(e.target.value)}
                onBlur={handleSaveNotes}
                disabled={!localPotential}
                className={cn(
                  'w-full px-3 py-2 rounded-lg text-sm resize-none',
                  'bg-slate-900/50 border border-slate-700/50',
                  'text-slate-300 placeholder-slate-600',
                  'focus:outline-none focus:ring-2 focus:ring-cyan-500/30',
                  !localPotential && 'opacity-50 cursor-not-allowed'
                )}
                placeholder={localPotential
                  ? "Observaciones sobre el potencial del empleado..."
                  : "Asigna potencial primero para agregar notas"
                }
                rows={3}
              />
              {/* MEJORA 7: Indicador de guardado */}
              <div className="flex items-center justify-between mt-1">
                <span className="text-[10px] text-slate-600">Confidencial - Solo visible para HR</span>
                {notesStatus === 'saving' && (
                  <span className="text-[10px] text-cyan-400 flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" /> Guardando...
                  </span>
                )}
                {notesStatus === 'saved' && (
                  <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                    <Check className="w-3 h-3" /> Guardado
                  </span>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-xs text-slate-500">Guia de Potencial</div>
              <div className="space-y-1 text-[11px]">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-slate-400">4-5: Alto potencial de crecimiento</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span className="text-slate-400">3-4: Potencial moderado</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  <span className="text-slate-400">1-3: Potencial limitado</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
})

// ════════════════════════════════════════════════════════════════════════════
// POTENTIAL SELECTOR - Botones 1-5
// ════════════════════════════════════════════════════════════════════════════

interface PotentialSelectorProps {
  currentValue: number | null
  isLoading: boolean
  onSelect: (value: number) => void
}

const PotentialSelector = memo(function PotentialSelector({
  currentValue,
  isLoading,
  onSelect
}: PotentialSelectorProps) {
  const options = [1, 2, 3, 4, 5]

  if (isLoading) {
    return (
      <div className="flex items-center gap-1 px-3 py-2">
        <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1">
      {options.map((value) => {
        const isSelected = currentValue === value
        const color = value >= 4 ? '#10B981' : value >= 3 ? '#F59E0B' : '#EF4444'

        return (
          <button
            key={value}
            onClick={() => onSelect(value)}
            className={cn(
              'w-8 h-8 rounded-lg text-sm font-medium transition-all',
              'border hover:scale-105',
              isSelected
                ? 'border-transparent text-white shadow-lg'
                : 'border-slate-700 text-slate-500 hover:text-slate-300 hover:border-slate-600 bg-slate-800/50'
            )}
            style={isSelected ? {
              backgroundColor: color,
              boxShadow: `0 0 12px ${color}40`
            } : {}}
          >
            {isSelected && <Check className="w-4 h-4 mx-auto" />}
            {!isSelected && value}
          </button>
        )
      })}
    </div>
  )
})
