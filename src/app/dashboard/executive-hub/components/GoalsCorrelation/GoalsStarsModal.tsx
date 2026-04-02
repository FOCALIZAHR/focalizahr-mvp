'use client'

// ════════════════════════════════════════════════════════════════════════════
// GOALS STARS & CRITICAL MODAL — Drill-down visual por persona
// src/app/dashboard/executive-hub/components/GoalsCorrelation/GoalsStarsModal.tsx
// ════════════════════════════════════════════════════════════════════════════
// Reutilizable para Estrellas y Cargos Críticos.
// Por persona: dos barras (Metas + RoleFit) + micro-narrativa cuadrante
// + amplificador condicional (FUGA_CEREBROS / cargo crítico).
// Patrón: portal a body, glassmorphism, Tesla line, font-light.
// ════════════════════════════════════════════════════════════════════════════

import { memo, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { X, AlertTriangle, Shield } from 'lucide-react'
import { cn } from '@/lib/utils'

import type { NarrativeEmployee } from './GoalsCorrelation.types'
import { GoalsDiagnosticService } from '@/lib/services/GoalsDiagnosticService'

// ════════════════════════════════════════════════════════════════════════════
// QUADRANT MICRO-NARRATIVES — CEO language, not technical
// ════════════════════════════════════════════════════════════════════════════

const QUADRANT_MICRO: Record<string, { label: string; color: string }> = {
  CONSISTENT:       { label: 'Clasificación respaldada', color: 'text-emerald-400' },
  PERCEPTION_BIAS:  { label: 'Domina pero no entrega', color: 'text-amber-400' },
  HIDDEN_PERFORMER: { label: 'Entrega pero no domina', color: 'text-purple-400' },
  DOUBLE_RISK:      { label: 'No entrega ni domina', color: 'text-red-400' },
  NO_GOALS:         { label: 'Sin metas asignadas', color: 'text-slate-500' },
}

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

interface PersonEntry {
  employee: NarrativeEmployee
  /** Optional: critical position title (only in critical positions modal) */
  positionTitle?: string
  /** Optional: bench strength level */
  benchStrength?: string
}

interface GoalsStarsModalProps {
  title: string
  subtitle: string
  teslaColor: string
  persons: PersonEntry[]
  /** Set of employee IDs that occupy critical positions (for amplifier in stars modal) */
  criticalPositionIds?: Set<string>
  onClose: () => void
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ════════════════════════════════════════════════════════════════════════════

export default memo(function GoalsStarsModal({
  title,
  subtitle,
  teslaColor,
  persons,
  criticalPositionIds = new Set(),
  onClose,
}: GoalsStarsModalProps) {

  // Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const content = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="relative w-full max-w-lg max-h-[85vh] overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/95 backdrop-blur-xl shadow-2xl"
      >
        {/* Tesla line */}
        <div
          className="absolute top-0 left-0 right-0 h-[2px] z-10"
          style={{
            background: `linear-gradient(90deg, transparent, ${teslaColor}, transparent)`,
            boxShadow: `0 0 20px ${teslaColor}`,
          }}
        />

        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-4">
          <div>
            <p className="text-lg font-light text-slate-200">{title}</p>
            <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-600 hover:text-slate-400 transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Person cards — scrollable */}
        <div className="px-6 pb-6 overflow-y-auto max-h-[calc(85vh-100px)] space-y-4">
          {persons.map((entry, idx) => (
            <PersonCard
              key={entry.employee.id}
              entry={entry}
              index={idx}
              isCriticalPosition={criticalPositionIds.has(entry.employee.id)}
            />
          ))}
        </div>
      </motion.div>
    </div>
  )

  return createPortal(content, document.body)
})

// ════════════════════════════════════════════════════════════════════════════
// PERSON CARD — Barras + micro-narrativa + amplificadores
// ════════════════════════════════════════════════════════════════════════════

function PersonCard({
  entry,
  index,
  isCriticalPosition,
}: {
  entry: PersonEntry
  index: number
  isCriticalPosition: boolean
}) {
  const { employee, positionTitle, benchStrength } = entry
  const goalsPercent = employee.goalsPercent ?? 0
  const roleFitScore = employee.roleFitScore ?? 0

  // Classify quadrant for micro-narrative
  const quadrant = GoalsDiagnosticService.classifyQuadrant(
    employee.roleFitScore,
    employee.goalsPercent
  )
  const micro = QUADRANT_MICRO[quadrant] ?? QUADRANT_MICRO.NO_GOALS

  // Amplifiers
  const isFuga = employee.riskQuadrant === 'FUGA_CEREBROS'
  const hasAmplifier = isFuga || isCriticalPosition || !!positionTitle

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="rounded-xl border border-slate-800/40 bg-slate-800/20 p-4 space-y-3"
    >
      {/* Name + department */}
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-sm font-light text-slate-200 truncate">{employee.name}</p>
          <p className="text-[10px] text-slate-500">{employee.department}</p>
          {positionTitle && (
            <p className="text-[10px] text-purple-400 mt-0.5">{positionTitle}</p>
          )}
        </div>
        <span className={cn('text-[10px] font-medium', micro.color)}>
          {micro.label}
        </span>
      </div>

      {/* Two bars — Metas + RoleFit */}
      <div className="space-y-2">
        <ProgressBar
          label="Metas"
          value={goalsPercent}
          threshold={80}
          color={goalsPercent >= 80 ? '#10B981' : goalsPercent >= 40 ? '#F59E0B' : '#EF4444'}
        />
        <ProgressBar
          label="RoleFit"
          value={roleFitScore}
          threshold={75}
          color={roleFitScore >= 75 ? '#10B981' : roleFitScore >= 50 ? '#F59E0B' : '#EF4444'}
        />
      </div>

      {/* Bench strength badge (critical positions only) */}
      {benchStrength && (
        <div className="flex items-center gap-1.5">
          <Shield className="w-3 h-3 text-slate-600" />
          <span className={cn(
            'text-[9px] font-medium',
            benchStrength === 'STRONG' ? 'text-emerald-400' :
            benchStrength === 'MODERATE' ? 'text-amber-400' :
            'text-red-400'
          )}>
            Cobertura: {benchStrength === 'STRONG' ? 'Fuerte' : benchStrength === 'MODERATE' ? 'Moderada' : benchStrength === 'WEAK' ? 'Débil' : 'Sin cobertura'}
          </span>
        </div>
      )}

      {/* Amplifiers */}
      {hasAmplifier && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {isFuga && (
            <span className="inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
              <AlertTriangle className="w-2.5 h-2.5" />
              Riesgo de fuga
            </span>
          )}
          {isCriticalPosition && !positionTitle && (
            <span className="inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Shield className="w-2.5 h-2.5" />
              Cargo crítico
            </span>
          )}
        </div>
      )}
    </motion.div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// PROGRESS BAR — Horizontal bar with threshold marker
// ════════════════════════════════════════════════════════════════════════════

function ProgressBar({
  label,
  value,
  threshold,
  color,
}: {
  label: string
  value: number
  threshold: number
  color: string
}) {
  const clampedValue = Math.min(100, Math.max(0, value))

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[9px] text-slate-500 uppercase tracking-wider">{label}</span>
        <span className="text-[10px] font-mono text-slate-400">{Math.round(value)}%</span>
      </div>
      <div className="relative h-1.5 bg-slate-800 rounded-full overflow-hidden">
        {/* Bar fill */}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${clampedValue}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ backgroundColor: color }}
        />
        {/* Threshold marker */}
        <div
          className="absolute top-0 bottom-0 w-px bg-slate-500"
          style={{ left: `${threshold}%` }}
        />
      </div>
    </div>
  )
}
