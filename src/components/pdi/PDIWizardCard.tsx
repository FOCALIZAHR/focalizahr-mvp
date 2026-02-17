'use client'

import { memo, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, ChevronDown, ChevronUp, BookOpen, Lightbulb, Clock, Pencil } from 'lucide-react'
import PDIGapBar from './PDIGapBar'

// ════════════════════════════════════════════════════════════════════════════
// TIPOS
// ════════════════════════════════════════════════════════════════════════════

export interface WizardGap {
  competencyCode: string
  competencyName: string
  actualScore: number
  targetScore: number
  rawGap: number
  status: 'CRITICAL' | 'IMPROVE' | 'MATCH' | 'EXCEEDS'
}

export interface WizardSuggestion {
  title: string
  description: string
  targetOutcome: string
  suggestedResources: Array<{ type: string; title: string; url?: string }>
  coachingTip: string
  action: string
  estimatedWeeks: number
}

export interface EditedGoal {
  goalId: string
  competencyCode: string
  title: string
  targetOutcome: string
  included: boolean
}

interface PDIWizardCardProps {
  gap: WizardGap
  suggestion: WizardSuggestion
  goalId: string
  currentIndex: number
  totalCount: number
  direction: number
  onNext: (edited: EditedGoal) => void
  onPrevious: () => void
}

// ════════════════════════════════════════════════════════════════════════════
// CONFIGURACIÓN DE SEVERIDAD
// ════════════════════════════════════════════════════════════════════════════

const SEVERITY_CONFIG = {
  CRITICAL: { color: '#EF4444', label: 'Brecha crítica', dot: 'bg-red-400' },
  IMPROVE: { color: '#F59E0B', label: 'Área de desarrollo', dot: 'bg-amber-400' },
  MATCH: { color: '#10B981', label: 'Al nivel esperado', dot: 'bg-emerald-400' },
  EXCEEDS: { color: '#22D3EE', label: 'Sobre el estándar', dot: 'bg-cyan-400' }
}

// Animation variants
const cardVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 120 : -120, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -120 : 120, opacity: 0 })
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE
// ════════════════════════════════════════════════════════════════════════════

export default memo(function PDIWizardCard({
  gap,
  suggestion,
  goalId,
  currentIndex,
  totalCount,
  direction,
  onNext,
  onPrevious
}: PDIWizardCardProps) {
  const [showDetail, setShowDetail] = useState(false)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [isEditingOutcome, setIsEditingOutcome] = useState(false)
  const [editedTitle, setEditedTitle] = useState(suggestion.title)
  const [editedOutcome, setEditedOutcome] = useState(suggestion.targetOutcome)

  const config = SEVERITY_CONFIG[gap.status]

  const handleAddToPlan = useCallback(() => {
    onNext({
      goalId,
      competencyCode: gap.competencyCode,
      title: editedTitle,
      targetOutcome: editedOutcome,
      included: true
    })
  }, [onNext, goalId, gap.competencyCode, editedTitle, editedOutcome])

  return (
    <motion.div
      key={`gap-${currentIndex}`}
      custom={direction}
      variants={cardVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="relative bg-[#0F172A]/90 backdrop-blur-2xl border border-slate-800 rounded-[24px] overflow-hidden"
    >
      {/* Tesla line */}
      <div
        className="absolute top-0 left-0 right-0 h-[1px] z-10"
        style={{
          background: `linear-gradient(90deg, transparent, ${config.color}, transparent)`,
          boxShadow: `0 0 15px ${config.color}`
        }}
      />

      <div className="p-8 md:p-10">
        {/* Top bar */}
        <div className="mb-8">
          <span className="text-xs text-slate-500">
            BRECHA {currentIndex + 1} de {totalCount}
          </span>
        </div>

        {/* Competency name + score */}
        <h3 className="text-2xl font-light text-white mb-6">
          {gap.competencyName}
        </h3>

        {/* Gap bar */}
        <div className="mb-4">
          <PDIGapBar actual={gap.actualScore} target={gap.targetScore} />
        </div>

        {/* Severity badge (dot + neutral text) */}
        <div className="flex items-center gap-2 mb-6">
          <div className={`w-2 h-2 rounded-full ${config.dot}`} />
          <span className="text-xs text-slate-400">
            {config.label} &middot; {gap.rawGap > 0 ? '+' : ''}{gap.rawGap.toFixed(1)} puntos
          </span>
        </div>

        {/* Expandable detail */}
        <button
          onClick={() => setShowDetail(!showDetail)}
          className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors mb-6"
        >
          {showDetail ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          Ver origen del dato
        </button>

        {showDetail && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-lg bg-slate-800/30 border border-slate-700/30 p-4 mb-6 text-xs text-slate-400 space-y-1"
          >
            <p>Score actual (evaluación 360°): <span className="text-cyan-400">{gap.actualScore.toFixed(1)}</span></p>
            <p>Meta del cargo: <span className="text-white">{gap.targetScore.toFixed(1)}</span></p>
            <p>Diferencia: <span className={gap.rawGap < 0 ? 'text-amber-400' : 'text-emerald-400'}>{gap.rawGap.toFixed(1)}</span></p>
          </motion.div>
        )}

        {/* Divider */}
        <div className="h-px bg-slate-800 mb-6" />

        {/* Plan de acción header */}
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-5">
          Plan de Acción
        </p>

        {/* Editable title */}
        <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Objetivo</span>
            <div className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-purple-400" />
              <span className="text-[10px] text-purple-400">IA</span>
              <button
                onClick={() => setIsEditingTitle(!isEditingTitle)}
                className="ml-2 text-slate-500 hover:text-slate-300 transition-colors"
              >
                <Pencil className="w-3 h-3" />
              </button>
            </div>
          </div>
          {isEditingTitle ? (
            <textarea
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              onBlur={() => setIsEditingTitle(false)}
              autoFocus
              rows={2}
              className="w-full bg-transparent text-sm text-slate-200 leading-relaxed resize-none focus:outline-none focus:ring-1 focus:ring-cyan-500/30 rounded p-1"
            />
          ) : (
            <p className="text-sm text-slate-200 leading-relaxed">{editedTitle}</p>
          )}
        </div>

        {/* Description (read-only) */}
        <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-4 mb-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-2">Descripción</span>
          <p className="text-sm text-slate-300 leading-relaxed">{suggestion.description}</p>
        </div>

        {/* Editable target outcome */}
        <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Meta Medible</span>
            <button
              onClick={() => setIsEditingOutcome(!isEditingOutcome)}
              className="text-slate-500 hover:text-slate-300 transition-colors"
            >
              <Pencil className="w-3 h-3" />
            </button>
          </div>
          {isEditingOutcome ? (
            <textarea
              value={editedOutcome}
              onChange={(e) => setEditedOutcome(e.target.value)}
              onBlur={() => setIsEditingOutcome(false)}
              autoFocus
              rows={2}
              className="w-full bg-transparent text-sm text-slate-200 leading-relaxed resize-none focus:outline-none focus:ring-1 focus:ring-cyan-500/30 rounded p-1"
            />
          ) : (
            <p className="text-sm text-slate-200 leading-relaxed">{editedOutcome}</p>
          )}
        </div>

        {/* Resources + tip + time */}
        <div className="rounded-xl bg-slate-800/30 border border-slate-700/30 p-4 space-y-3">
          {suggestion.suggestedResources.length > 0 && (
            <div className="flex items-start gap-2">
              <BookOpen className="w-3.5 h-3.5 text-slate-500 mt-0.5 shrink-0" />
              <p className="text-xs text-slate-400">
                {suggestion.suggestedResources.map(r => r.title).join(' · ')}
              </p>
            </div>
          )}
          {suggestion.coachingTip && (
            <div className="flex items-start gap-2">
              <Lightbulb className="w-3.5 h-3.5 text-slate-500 mt-0.5 shrink-0" />
              <p className="text-xs text-slate-400 italic">"{suggestion.coachingTip}"</p>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <p className="text-xs text-slate-400">Tiempo estimado: {suggestion.estimatedWeeks} semanas</p>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-800">
          <button
            onClick={onPrevious}
            disabled={currentIndex === 0}
            className="px-4 py-2.5 rounded-xl text-sm text-slate-400 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            &larr; Anterior
          </button>

          {/* Dots */}
          <div className="flex items-center gap-1.5">
            {Array.from({ length: totalCount }).map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-200 ${
                  i === currentIndex ? 'w-4 bg-cyan-400' : 'w-1.5 bg-slate-600'
                }`}
              />
            ))}
          </div>

          <button
            onClick={handleAddToPlan}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-500 text-white text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Agregar al Plan &rarr;
          </button>
        </div>
      </div>
    </motion.div>
  )
})
