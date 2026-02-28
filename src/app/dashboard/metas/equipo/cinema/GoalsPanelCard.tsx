// ════════════════════════════════════════════════════════════════════════════
// GOALS PANEL CARD - Smart Router con 3 Actos (Diseño Gemini / Apple-Tesla)
// src/app/dashboard/metas/equipo/cinema/GoalsPanelCard.tsx
//
// Dentro de GoalSpotlightCard (35/65 split)
// - ACTO 1 (Setup): Briefing hero, tipografía 4xl/5xl, solo cyan
// - ACTO 2 (Ready): Narrativa de liderazgo, stats mono, ghost CTA
// - ACTO 3 (Panel): Gestión expandida de metas
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { memo, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  ChevronUp,
  Target,
  GitBranch
} from 'lucide-react'
import { GhostButton } from '@/components/ui/PremiumButton'

// ════════════════════════════════════════════════════════════════════════════
// TIPOS
// ════════════════════════════════════════════════════════════════════════════

interface Goal {
  id: string
  title: string
  progress: number
  weight: number
  level: 'COMPANY' | 'AREA' | 'INDIVIDUAL'
  status: string
  originType?: string
  parent?: { id: string; title: string } | null
}

interface GoalsPanelCardProps {
  goals: Goal[]
  totalWeight: number
  isComplete: boolean
  onAddGoal: () => void
  onCascadeGoal: () => void
  onGoalClick?: (goalId: string) => void
  employeeName?: string
}

type DimensionKey = 'COMPANY' | 'AREA' | 'INDIVIDUAL'
type ActState = 'setup' | 'ready' | 'panel'

// ════════════════════════════════════════════════════════════════════════════
// CONSTANTES
// ════════════════════════════════════════════════════════════════════════════

const APPLE_CURVE: [number, number, number, number] = [0.16, 1, 0.3, 1]

const DIMENSIONS: { key: DimensionKey; label: string; color: string }[] = [
  { key: 'COMPANY', label: 'Corporativa', color: '#22D3EE' },
  { key: 'AREA', label: 'Área', color: '#A78BFA' },
  { key: 'INDIVIDUAL', label: 'Individual', color: '#94A3B8' },
]

// ════════════════════════════════════════════════════════════════════════════
// UTILS
// ════════════════════════════════════════════════════════════════════════════

function capitalize(str: string): string {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE: Goal Row (para Acto 3)
// ════════════════════════════════════════════════════════════════════════════

interface GoalRowProps {
  goal: Goal
  onClick?: () => void
}

const GoalRow = memo(function GoalRow({ goal, onClick }: GoalRowProps) {
  const isAtRisk = goal.status === 'AT_RISK' || goal.status === 'BEHIND'

  return (
    <div
      className="group flex items-center gap-3 py-2.5 hover:bg-white/[0.02] -mx-2 px-2 rounded transition-colors cursor-pointer"
      onClick={onClick}
    >
      <span className="flex-1 text-sm text-slate-200 truncate">
        {capitalize(goal.title)}
      </span>

      {isAtRisk && (
        <div className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
      )}

      <span className="text-xs text-slate-500 font-mono w-10 text-right flex-shrink-0">
        {goal.weight}%
      </span>

      <div className="w-20 flex items-center gap-2 flex-shrink-0">
        <div className="flex-1 h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${goal.progress}%` }}
            className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full"
          />
        </div>
        <span className="text-[10px] text-slate-500 font-mono w-7 text-right">
          {goal.progress}%
        </span>
      </div>
    </div>
  )
})

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE: Dimension Section (para Acto 3)
// ════════════════════════════════════════════════════════════════════════════

interface DimensionSectionProps {
  label: string
  color: string
  goals: Goal[]
  totalWeight: number
  onGoalClick?: (goalId: string) => void
}

const DimensionSection = memo(function DimensionSection({
  label,
  color,
  goals,
  totalWeight,
  onGoalClick
}: DimensionSectionProps) {
  const isEmpty = goals.length === 0

  return (
    <div className="py-2">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: color }}
          />
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            {label}
          </span>
        </div>
        {!isEmpty && (
          <span className="text-xs text-slate-500 font-mono">
            {totalWeight}%
          </span>
        )}
      </div>

      {isEmpty ? (
        <p className="text-xs text-slate-600 italic pl-4">
          Sin metas
        </p>
      ) : (
        <div className="pl-4">
          {goals.map(goal => (
            <GoalRow
              key={goal.id}
              goal={goal}
              onClick={() => onGoalClick?.(goal.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
})

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL: GoalsPanelCard
// ════════════════════════════════════════════════════════════════════════════

export const GoalsPanelCard = memo(function GoalsPanelCard({
  goals,
  totalWeight,
  isComplete,
  onAddGoal,
  onCascadeGoal,
  onGoalClick,
  employeeName
}: GoalsPanelCardProps) {

  // ══════════════════════════════════════════════════════════════════════════
  // STATE
  // ══════════════════════════════════════════════════════════════════════════

  const [isExpanded, setIsExpanded] = useState(false)

  // ══════════════════════════════════════════════════════════════════════════
  // COMPUTED VALUES
  // ══════════════════════════════════════════════════════════════════════════

  const currentAct: ActState = useMemo(() => {
    if (isExpanded) return 'panel'
    if (isComplete) return 'ready'
    return 'setup'
  }, [isComplete, isExpanded])

  const grouped = useMemo(() => {
    const groups: Record<DimensionKey, Goal[]> = {
      COMPANY: [],
      AREA: [],
      INDIVIDUAL: []
    }
    goals.forEach(goal => {
      if (groups[goal.level]) {
        groups[goal.level].push(goal)
      }
    })
    return groups
  }, [goals])

  const weightByDimension = useMemo(() => {
    const weights: Record<DimensionKey, number> = {
      COMPANY: 0,
      AREA: 0,
      INDIVIDUAL: 0
    }
    goals.forEach(goal => {
      if (weights[goal.level] !== undefined) {
        weights[goal.level] += goal.weight
      }
    })
    return weights
  }, [goals])

  const weightedProgress = useMemo(() => {
    if (goals.length === 0 || totalWeight === 0) return 0
    const weighted = goals.reduce((sum, g) => sum + (g.progress * g.weight), 0)
    return Math.round(weighted / totalWeight)
  }, [goals, totalWeight])

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════════════════

  return (
    <motion.div
      className="relative h-full"
      layout
    >
      <AnimatePresence mode="wait">
        {/* ════════════════════════════════════════════════════════════════ */}
        {/* ACTO 1: BRIEFING (totalWeight < 100) */}
        {/* ════════════════════════════════════════════════════════════════ */}
        {currentAct === 'setup' && (
          <motion.div
            key="setup"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: APPLE_CURVE }}
            className="h-full flex flex-col items-center justify-center px-12 pt-12"
          >
            {/* Mensaje Hero */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4, ease: APPLE_CURVE }}
              className="text-center"
            >
              <p className="text-4xl md:text-5xl font-light leading-[1.15] text-white">
                A{' '}
                <span className="text-cyan-400">{employeeName || 'este colaborador'}</span>
                {' '}le falta un{' '}
                <span className="text-cyan-400">{100 - totalWeight}%</span>
                {' '}para completar su plan de Metas.
              </p>

              {/* Subtexto Coach */}
              <p className="text-lg font-light text-slate-500 mt-6">
                Definamos su próximo enfoque objetivo.
              </p>
            </motion.div>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.4, ease: APPLE_CURVE }}
              className="mt-16"
            >
              <button
                onClick={onAddGoal}
                className="group flex items-center gap-2 px-6 py-2.5 bg-cyan-500 rounded-xl text-slate-900 font-semibold hover:bg-cyan-400 transition-all duration-300"
              >
                <Plus className="w-5 h-5 transition-transform duration-500 group-hover:rotate-90" />
                Definir Meta
              </button>
            </motion.div>
          </motion.div>
        )}

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* ACTO 2: READY (isComplete = true) */}
        {/* ════════════════════════════════════════════════════════════════ */}
        {currentAct === 'ready' && (
          <motion.div
            key="ready"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: APPLE_CURVE }}
            className="h-full flex flex-col items-center justify-center px-12 pt-12"
          >
            {/* Mensaje Hero */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4, ease: APPLE_CURVE }}
              className="text-center"
            >
              <p className="text-4xl md:text-5xl font-light leading-[1.15] text-white">
                Asignaste las metas de{' '}
                <span className="text-cyan-400 font-semibold uppercase">
                  {employeeName || 'este colaborador'}
                </span>.
              </p>

              {/* Narrativa de Liderazgo */}
              <p className="text-lg font-light text-slate-500 mt-6">
                Tu misión ahora es ayudarlo a{' '}
                <span className="text-white font-medium">alcanzar y sobrepasar</span>
                {' '}sus metas.
              </p>
            </motion.div>

            {/* Separador + Stats */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="mt-10 flex flex-col items-center gap-4"
            >
              <div className="h-px w-24 bg-white/10" />
              <p className="text-xs font-mono text-slate-500 tracking-widest uppercase">
                {goals.length} {goals.length === 1 ? 'meta definida' : 'metas definidas'} · Progreso actual: {weightedProgress}%
              </p>
            </motion.div>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.4, ease: APPLE_CURVE }}
              className="mt-10"
            >
              <button
                onClick={() => setIsExpanded(true)}
                className="group flex items-center gap-2 px-6 py-2.5 bg-cyan-500 rounded-xl text-slate-900 font-semibold hover:bg-cyan-400 transition-all duration-300"
              >
                <Target className="w-5 h-5" />
                Gestionar Metas
              </button>
            </motion.div>
          </motion.div>
        )}

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* ACTO 3: PANEL (Gestión expandida) */}
        {/* ════════════════════════════════════════════════════════════════ */}
        {currentAct === 'panel' && (
          <motion.div
            key="panel"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Header minimalista */}
            <div className="px-6 py-4 border-b border-slate-800/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-400">Progreso:</span>
                <span className="text-lg font-semibold text-white">{weightedProgress}%</span>
              </div>
              {isComplete && (
                <div
                  className="w-2.5 h-2.5 rounded-full bg-cyan-400"
                  style={{ boxShadow: '0 0 8px rgba(34, 211, 238, 0.6)' }}
                />
              )}
            </div>

            {/* Dimensiones */}
            <div className="px-4 py-2 divide-y divide-slate-800/20">
              {DIMENSIONS.map(dim => (
                <DimensionSection
                  key={dim.key}
                  label={dim.label}
                  color={dim.color}
                  goals={grouped[dim.key]}
                  totalWeight={weightByDimension[dim.key]}
                  onGoalClick={onGoalClick}
                />
              ))}
            </div>

            {/* Footer con CTAs */}
            <div className="px-6 py-4 border-t border-slate-800/30 flex items-center justify-between">
              <div className="flex gap-3">
                <button
                  onClick={onAddGoal}
                  className="flex items-center gap-2 px-4 py-2 bg-cyan-500 rounded-lg text-slate-900 font-semibold text-sm hover:bg-cyan-400 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Agregar Meta
                </button>
                <GhostButton size="sm" icon={GitBranch} onClick={onCascadeGoal}>
                  Cascadear
                </GhostButton>
              </div>
              <GhostButton size="sm" icon={ChevronUp} onClick={() => setIsExpanded(false)}>
                Colapsar
              </GhostButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
})

export default GoalsPanelCard
