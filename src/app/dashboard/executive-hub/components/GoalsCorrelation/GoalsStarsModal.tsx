'use client'

// ════════════════════════════════════════════════════════════════════════════
// GOALS STARS & CRITICAL MODAL — Drill-down visual por persona
// src/app/dashboard/executive-hub/components/GoalsCorrelation/GoalsStarsModal.tsx
// ════════════════════════════════════════════════════════════════════════════
// Patrón: FocalizaIntelligenceModal header (palabra blanca + gradiente)
// + Tesla divider + narrativa protagonista + person cards
// Colores: cyan + purple only. LED dot por cuadrante.
// ════════════════════════════════════════════════════════════════════════════

import { memo, useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, HelpCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

import type { NarrativeEmployee } from './GoalsCorrelation.types'
import { GoalsDiagnosticService } from '@/lib/services/GoalsDiagnosticService'
import { getCompensacionNarrative } from '@/config/narratives/CompensacionNarrativeDictionary'
import { MetricBar } from './shared/MetricBar'
import { getQuadrantNarrative } from '@/config/narratives/GoalsNarrativeDictionary'

// ════════════════════════════════════════════════════════════════════════════
// QUADRANT MICRO-NARRATIVES
// ════════════════════════════════════════════════════════════════════════════

const QUADRANT_MICRO: Record<string, { text: string; met: boolean }> = {
  CONSISTENT:       { text: 'Clasificación respaldada por resultados', met: true },
  PERCEPTION_BIAS:  { text: 'Domina su cargo pero no entrega resultados', met: false },
  HIDDEN_PERFORMER: { text: 'Entrega resultados pero no domina su cargo', met: false },
  DOUBLE_RISK:      { text: 'No entrega ni domina — revisar clasificación', met: false },
  NO_GOALS:         { text: 'Sin metas asignadas', met: false },
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

const TITLE_WORDS: Record<'stars' | 'critical', { white: string; gradient: string }> = {
  stars: { white: 'Estrellas', gradient: 'del 9-Box' },
  critical: { white: 'Cargos', gradient: 'Críticos' },
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
  const titleWords = TITLE_WORDS[type]

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const content = (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center"
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/90 backdrop-blur-md"
        />

        {/* Ambient glow */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/3 left-1/3 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/3 right-1/3 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-[120px]" />
        </div>

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 20 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          onClick={(e) => e.stopPropagation()}
          className="relative z-10 w-full max-w-md mx-4 bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl shadow-black/50 max-h-[85vh] overflow-y-auto"
        >
          {/* Tesla line */}
          <div
            className="absolute top-0 left-0 right-0 h-[2px] z-10"
            style={{
              background: `linear-gradient(90deg, transparent, ${teslaColor}, transparent)`,
              boxShadow: `0 0 20px ${teslaColor}`,
            }}
          />

          {/* ═══ HEADER — Patrón FocalizaIntelligenceModal ═══ */}
          <div className="text-center pt-8 pb-4 px-6">
            {/* Title: white + gradient */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
            >
              <h1 className="text-2xl md:text-3xl font-extralight text-white tracking-tight">
                {titleWords.white}
              </h1>
              <h1 className="text-2xl md:text-3xl font-extralight tracking-tight bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                {titleWords.gradient}
              </h1>
            </motion.div>

            {/* Tesla divider */}
            <motion.div
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ delay: 0.25, duration: 0.5 }}
              className="flex items-center justify-center gap-3 my-5"
            >
              <div className="h-px w-12 bg-white/20" />
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              <div className="h-px w-12 bg-white/20" />
            </motion.div>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-sm text-slate-500 font-light"
            >
              {subtitle}
            </motion.p>

            {/* Headline narrativo — protagonista */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35 }}
              className="text-base text-slate-300 font-light leading-relaxed mt-4 max-w-sm mx-auto"
            >
              {headline}
            </motion.p>
          </div>

          {/* Divider */}
          <div className="mx-6 h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" />

          {/* ═══ PERSON CARDS ═══ */}
          <div className="px-6 py-4 space-y-3">
            {persons.map((entry, idx) => (
              <PersonCard
                key={entry.employee.id}
                entry={entry}
                index={idx}
                isCriticalPosition={criticalPositionIds.has(entry.employee.id)}
              />
            ))}
          </div>

          {/* ═══ FOOTER ═══ */}
          <div className="px-6 py-4 border-t border-slate-700/50">
            <button
              onClick={onClose}
              className="w-full text-center text-slate-500 hover:text-slate-300 text-sm transition-colors min-h-[44px]"
            >
              Cerrar
            </button>
          </div>

        </motion.div>
      </motion.div>
    </AnimatePresence>
  )

  return createPortal(content, document.body)
})

// ════════════════════════════════════════════════════════════════════════════
// PERSON CARD — Stateful component (toggle compensación independiente)
// ════════════════════════════════════════════════════════════════════════════

const PersonCard = memo(function PersonCard({
  entry,
  index,
  isCriticalPosition,
}: {
  entry: PersonEntry
  index: number
  isCriticalPosition: boolean
}) {
  const [compExpanded, setCompExpanded] = useState(false)

  const { employee, positionTitle, benchStrength } = entry
  const goalsPercent = employee.goalsPercent ?? 0
  const roleFitScore = employee.roleFitScore ?? 0

  const quadrant = GoalsDiagnosticService.classifyQuadrant(
    employee.roleFitScore,
    employee.goalsPercent
  )
  const micro = QUADRANT_MICRO[quadrant] ?? QUADRANT_MICRO.NO_GOALS
  const isFuga = employee.riskQuadrant === 'FUGA_CEREBROS'
  const compEntry = getCompensacionNarrative(quadrant)
  const quadrantNarr = getQuadrantNarrative(quadrant)

  const displayName = employee.name
    .toLowerCase()
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 + index * 0.04 }}
      className="rounded-xl border border-slate-800/40 bg-slate-800/20 backdrop-blur-sm p-4 space-y-3"
    >
      {/* Name + quadrant LED */}
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-sm font-light text-slate-200">{displayName}</p>
          <p className="text-[10px] text-slate-500 font-light">
            {employee.gerencia !== employee.department
              ? `${employee.gerencia} · ${employee.department}`
              : employee.department}
            {positionTitle && <> · <span className="text-purple-400/70">{positionTitle}</span></>}
          </p>
        </div>
        {/* LED dot: cyan if met, purple if not */}
        <div className="flex items-center gap-2 flex-shrink-0 mt-1">
          <div className={cn(
            'w-2 h-2 rounded-full',
            micro.met
              ? 'bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.6)]'
              : 'bg-purple-400 shadow-[0_0_6px_rgba(167,139,250,0.6)]'
          )} />
        </div>
      </div>

      {/* Two bars */}
      <div className="space-y-2.5">
        <MetricBar label="Metas" value={goalsPercent} threshold={80} color="cyan" />
        <MetricBar label="RoleFit" value={roleFitScore} threshold={75} color="purple" />
      </div>

      {/* Micro-narrative + tooltip */}
      <div className="flex items-start gap-1.5">
        <p className="text-[10px] font-light text-slate-500 leading-relaxed">
          {micro.text}
        </p>
        <div className="relative group flex-shrink-0 mt-px">
          <HelpCircle className="w-3 h-3 text-slate-600 hover:text-slate-400 cursor-help transition-colors" />
          {quadrantNarr && (
            <div className="absolute bottom-full right-0 mb-2 px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 w-56 text-left">
              <p className="text-[10px] text-slate-300 leading-relaxed">
                {quadrantNarr.explanation}
              </p>
              <p className="text-[9px] text-slate-500 mt-1.5 leading-relaxed">
                {quadrantNarr.implication}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Compensación link + expandible */}
      {compEntry && (
        <>
          <button
            onClick={() => setCompExpanded(!compExpanded)}
            className="group inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 transition-colors mt-1"
          >
            Ver perspectiva de compensaciones
            <ArrowRight className={cn(
              'w-3 h-3 transition-transform',
              compExpanded ? 'rotate-90' : 'group-hover:translate-x-0.5'
            )} />
          </button>

          <AnimatePresence>
            {compExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="border-t border-slate-800/30 pt-3 mt-1 space-y-4">
                  <div className="border-l-2 border-cyan-500/30 pl-3">
                    <p className="text-[10px] font-medium text-white/80 uppercase tracking-widest mb-1.5">
                      La Observación
                    </p>
                    <p className="text-[11px] font-light text-slate-400 leading-relaxed">
                      {compEntry.observacion}
                    </p>
                  </div>
                  <div className="border-l-2 border-purple-500/30 pl-3">
                    <p className="text-[10px] font-medium text-white/80 uppercase tracking-widest mb-1.5">
                      La Decisión de Valor
                    </p>
                    <p className="text-[11px] font-light text-slate-300 leading-relaxed">
                      {compEntry.decisionValor}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      {/* Amplifiers — subtle monochrome badges */}
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
})

// MetricBar imported from ./shared/MetricBar
