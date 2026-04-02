'use client'

// ════════════════════════════════════════════════════════════════════════════
// GOALS STARS & CRITICAL MODAL — Drill-down visual por persona
// src/app/dashboard/executive-hub/components/GoalsCorrelation/GoalsStarsModal.tsx
// ════════════════════════════════════════════════════════════════════════════
// Design: FocalizaHR — cyan + purple only, glassmorphism, font-light,
// sin colores funcionales (no rojo/verde/amber en barras).
// Las barras muestran posición vs umbral. La narrativa explica, no el color.
// ════════════════════════════════════════════════════════════════════════════

import { memo, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

import type { NarrativeEmployee } from './GoalsCorrelation.types'
import { GoalsDiagnosticService } from '@/lib/services/GoalsDiagnosticService'

// ════════════════════════════════════════════════════════════════════════════
// QUADRANT MICRO-NARRATIVES — texto plano, sin colores
// ════════════════════════════════════════════════════════════════════════════

const QUADRANT_MICRO: Record<string, string> = {
  CONSISTENT:       'Clasificación respaldada por resultados.',
  PERCEPTION_BIAS:  'Domina su cargo pero no entrega resultados.',
  HIDDEN_PERFORMER: 'Entrega resultados pero no domina su cargo.',
  DOUBLE_RISK:      'No entrega ni domina — revisar clasificación.',
  NO_GOALS:         'Sin metas asignadas.',
}

// ════════════════════════════════════════════════════════════════════════════
// DYNAMIC HEADLINES
// ════════════════════════════════════════════════════════════════════════════

const DYNAMIC_HEADLINES: Record<'stars' | 'critical', { under: string; over: string }> = {
  stars: {
    under: 'La clasificación no coincide con los resultados. Antes de tomar decisiones de promoción o compensación, valida con evidencia.',
    over: 'Clasificación y ejecución se alinean. Ese es el estándar que debería replicarse.',
  },
  critical: {
    under: 'La continuidad operacional depende de personas que no están cumpliendo. Cada día sin plan de acción incrementa la exposición.',
    over: 'La operación tiene cobertura real donde más importa.',
  },
}

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

interface PersonEntry {
  employee: NarrativeEmployee
  positionTitle?: string
  benchStrength?: string
}

interface GoalsStarsModalProps {
  title: string
  subtitle: string
  teslaColor: string
  type: 'stars' | 'critical'
  percentage: number
  persons: PersonEntry[]
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
  type,
  percentage,
  persons,
  criticalPositionIds = new Set(),
  onClose,
}: GoalsStarsModalProps) {

  const isUnderStandard = percentage < 80
  const headline = isUnderStandard ? DYNAMIC_HEADLINES[type].under : DYNAMIC_HEADLINES[type].over

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
        <div className="p-6 pb-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="fhr-hero-title text-lg">
                <span className="fhr-title-gradient">{title}</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1 font-light">{subtitle}</p>
            </div>
            <button
              onClick={onClose}
              className="text-slate-600 hover:text-slate-400 transition-colors p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Headline narrativo */}
          <p className="text-sm font-light text-slate-400 leading-relaxed mt-4">
            {headline}
          </p>
        </div>

        {/* Divider */}
        <div className="mx-6 h-px bg-gradient-to-r from-transparent via-slate-800 to-transparent" />

        {/* Person cards — scrollable */}
        <div className="px-6 py-4 overflow-y-auto max-h-[calc(85vh-160px)] space-y-3">
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
// PERSON CARD — Barras cyan/purple + narrativa texto plano
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

  const quadrant = GoalsDiagnosticService.classifyQuadrant(
    employee.roleFitScore,
    employee.goalsPercent
  )
  const micro = QUADRANT_MICRO[quadrant] ?? QUADRANT_MICRO.NO_GOALS

  const isFuga = employee.riskQuadrant === 'FUGA_CEREBROS'

  // Capitalize name from DB
  const displayName = employee.name
    .toLowerCase()
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className="rounded-xl border border-slate-800/40 bg-slate-800/20 backdrop-blur-sm p-4 space-y-3"
    >
      {/* Name + position */}
      <div>
        <p className="text-sm font-light text-slate-200">{displayName}</p>
        <p className="text-[10px] text-slate-500 font-light">
          {employee.department}
          {positionTitle && <> · <span className="text-purple-400/70">{positionTitle}</span></>}
        </p>
      </div>

      {/* Two bars — cyan for Metas, purple for RoleFit */}
      <div className="space-y-2.5">
        <MetricBar label="Metas" value={goalsPercent} threshold={80} color="cyan" />
        <MetricBar label="RoleFit" value={roleFitScore} threshold={75} color="purple" />
      </div>

      {/* Micro-narrative — plain text, no colors */}
      <p className="text-[10px] font-light text-slate-500 leading-relaxed">
        {micro}
      </p>

      {/* Amplifiers — subtle, monochrome badges */}
      {(isFuga || isCriticalPosition || benchStrength) && (
        <div className="flex flex-wrap gap-1.5">
          {isFuga && (
            <span className="text-[9px] px-2 py-0.5 rounded-full bg-slate-800/60 text-cyan-400/80 border border-cyan-500/20">
              Riesgo de fuga
            </span>
          )}
          {isCriticalPosition && !positionTitle && (
            <span className="text-[9px] px-2 py-0.5 rounded-full bg-slate-800/60 text-purple-400/80 border border-purple-500/20">
              Cargo crítico
            </span>
          )}
          {benchStrength && (
            <span className="text-[9px] px-2 py-0.5 rounded-full bg-slate-800/60 text-slate-400 border border-slate-700/30">
              Cobertura: {benchStrength === 'STRONG' ? 'Fuerte' : benchStrength === 'MODERATE' ? 'Moderada' : benchStrength === 'WEAK' ? 'Débil' : 'Sin cobertura'}
            </span>
          )}
        </div>
      )}
    </motion.div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// METRIC BAR — Thin, cyan or purple, with threshold marker
// ════════════════════════════════════════════════════════════════════════════

function MetricBar({
  label,
  value,
  threshold,
  color,
}: {
  label: string
  value: number
  threshold: number
  color: 'cyan' | 'purple'
}) {
  const clampedValue = Math.min(100, Math.max(0, value))
  const meetsThreshold = value >= threshold

  const barColor = color === 'cyan'
    ? 'bg-gradient-to-r from-cyan-500/80 to-cyan-400/60'
    : 'bg-gradient-to-r from-purple-500/80 to-purple-400/60'

  const glowColor = color === 'cyan'
    ? 'shadow-[0_0_8px_rgba(34,211,238,0.3)]'
    : 'shadow-[0_0_8px_rgba(167,139,250,0.3)]'

  const valueColor = meetsThreshold
    ? (color === 'cyan' ? 'text-cyan-400' : 'text-purple-400')
    : 'text-slate-400'

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[9px] text-slate-600 uppercase tracking-wider font-medium">{label}</span>
        <span className={cn('text-[10px] font-mono', valueColor)}>{Math.round(value)}%</span>
      </div>
      <div className="relative h-[3px] bg-slate-800/80 rounded-full">
        {/* Bar fill */}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${clampedValue}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className={cn('absolute inset-y-0 left-0 rounded-full', barColor, meetsThreshold && glowColor)}
        />
        {/* Threshold marker — subtle vertical line */}
        <div
          className="absolute top-[-2px] bottom-[-2px] w-px bg-slate-600/50"
          style={{ left: `${threshold}%` }}
        />
      </div>
    </div>
  )
}
