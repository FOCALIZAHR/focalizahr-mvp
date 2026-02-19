'use client'

import { memo, useState, useCallback, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, ChevronDown, ChevronUp, BookOpen, Lightbulb, Clock } from 'lucide-react'
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
  // Smart Router fields
  narrative?: string
  category?: 'URGENTE' | 'IMPACTO' | 'QUICK_WIN' | 'POTENCIAR'
  categoryLabel?: string
  categoryColor?: string
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
  onUpdateGoal?: (updates: { title?: string; targetOutcome?: string }) => void
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
  onPrevious,
  onUpdateGoal
}: PDIWizardCardProps) {
  const [step, setStep] = useState<'brecha' | 'plan'>('brecha')
  const [editedTitle, setEditedTitle] = useState(suggestion.title)
  const [editedOutcome, setEditedOutcome] = useState(suggestion.targetOutcome)

  // Sincronizar cuando cambia de card (goalId cambia)
  useEffect(() => {
    setEditedTitle(suggestion.title)
    setEditedOutcome(suggestion.targetOutcome)
    setStep('brecha')
  }, [goalId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced autosave: guarda 1s después de dejar de escribir
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (editedTitle === suggestion.title && editedOutcome === suggestion.targetOutcome) return

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      const updates: { title?: string; targetOutcome?: string } = {}
      if (editedTitle !== suggestion.title) updates.title = editedTitle
      if (editedOutcome !== suggestion.targetOutcome) updates.targetOutcome = editedOutcome
      if (Object.keys(updates).length > 0) onUpdateGoal?.(updates)
    }, 1000)

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [editedTitle, editedOutcome]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleNext = useCallback((included: boolean) => {
    onNext({
      goalId,
      competencyCode: gap.competencyCode,
      title: editedTitle,
      targetOutcome: editedOutcome,
      included
    })
  }, [goalId, gap.competencyCode, editedTitle, editedOutcome, onNext])

  // ════════════════════════════════════════════════════════════════════════════
  // TESLA LINE - Siempre cyan corporativo FocalizaHR
  // ════════════════════════════════════════════════════════════════════════════

  const getTeslaLineColor = () => {
    return 'linear-gradient(90deg, transparent, #22D3EE, #22D3EE, transparent)'
  }

  const getTeslaGlow = () => {
    return '0 0 20px #22D3EE, 0 0 40px rgba(34, 211, 238, 0.4)'
  }

  return (
    <motion.div
      key={`gap-${currentIndex}`}
      custom={direction}
      variants={cardVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="relative bg-[#0F172A]/90 backdrop-blur-2xl border border-slate-800 rounded-[24px] overflow-hidden"
      onKeyDown={(e) => {
        const el = e.target as HTMLElement
        const isTyping = el.tagName === 'TEXTAREA' || el.tagName === 'INPUT' || el.isContentEditable
        console.log('[PDIWizardCard onKeyDown]', {
          key: e.key,
          targetTag: el.tagName,
          targetClass: el.className?.slice?.(0, 50),
          isTyping
        })
        if (isTyping) return
        e.stopPropagation()
      }}
    >
      {/* Tesla Line Dinámica */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px] z-10"
        style={{
          background: getTeslaLineColor(),
          boxShadow: getTeslaGlow()
        }}
      />

      <div className="p-6 md:p-8">
        {/* Header con Badge de Categoría */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {/* Dot de severidad */}
            <div
              className={`w-3 h-3 rounded-full ${
                suggestion.category === 'URGENTE'
                  ? 'bg-red-400'
                  : suggestion.category === 'IMPACTO'
                  ? 'bg-amber-400'
                  : suggestion.category === 'QUICK_WIN'
                  ? 'bg-purple-400'
                  : suggestion.category === 'POTENCIAR'
                  ? 'bg-emerald-400'
                  : 'bg-cyan-400'
              }`}
            />
            <h3 className="text-lg font-medium text-white">
              {gap.competencyName}
            </h3>
          </div>

          {/* Badge de categoría */}
          <div
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              suggestion.category === 'URGENTE'
                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                : suggestion.category === 'IMPACTO'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : suggestion.category === 'QUICK_WIN'
                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                : suggestion.category === 'POTENCIAR'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
            }`}
          >
            {suggestion.categoryLabel || SEVERITY_CONFIG[gap.status]?.label}
          </div>
        </div>

        {/* Indicador de progreso */}
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-6">
          <span>Card {currentIndex + 1} de {totalCount}</span>
          <span>&middot;</span>
          <span className={step === 'brecha' ? 'text-cyan-400' : 'text-slate-500'}>
            Entender
          </span>
          <span>&rarr;</span>
          <span className={step === 'plan' ? 'text-cyan-400' : 'text-slate-500'}>
            Decidir
          </span>
        </div>

        {/* ════════════════════════════════════════════════════════════════════ */}
        {/* PASO 1: ENTENDER LA BRECHA */}
        {/* ════════════════════════════════════════════════════════════════════ */}
        {step === 'brecha' && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Encabezado explicativo */}
            <div className="text-center mb-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Diagnóstico de Brecha
              </span>
            </div>

            {/* Barra de Gap */}
            <div className="mb-6">
              <PDIGapBar
                actual={gap.actualScore}
                target={gap.targetScore}
              />
            </div>

            {/* Narrativa de la brecha */}
            <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-4 mb-4">
              <p className="text-sm text-slate-300 leading-relaxed">
                {suggestion.narrative ||
                 `Esta competencia presenta una brecha de ${Math.abs(gap.rawGap).toFixed(1)} puntos respecto al nivel esperado para el cargo.`}
              </p>
            </div>

            {/* Coaching Tip */}
            {suggestion.coachingTip && (
              <div className="flex items-start gap-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 p-4 mb-6">
                <Lightbulb className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-cyan-400 mb-1">Tip para tu 1:1</p>
                  <p className="text-sm text-slate-300">{suggestion.coachingTip}</p>
                </div>
              </div>
            )}

            {/* Instrucción clara */}
            <p className="text-xs text-slate-500 text-center mt-4 mb-2">
              Revisa esta brecha y luego define el plan de acción &rarr;
            </p>

            {/* Botones Paso 1 */}
            <div className="flex items-center justify-between pt-4">
              <button
                onClick={onPrevious}
                disabled={currentIndex === 0}
                className="fhr-btn fhr-btn-ghost flex items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronUp className="w-4 h-4 rotate-[-90deg]" />
                Anterior
              </button>

              <button
                onClick={() => setStep('plan')}
                className="fhr-btn fhr-btn-primary flex items-center gap-2"
              >
                Ver Plan Sugerido
                <ChevronDown className="w-4 h-4 rotate-[-90deg]" />
              </button>
            </div>
          </motion.div>
        )}

        {/* ════════════════════════════════════════════════════════════════════ */}
        {/* PASO 2: DECIDIR EL PLAN */}
        {/* ════════════════════════════════════════════════════════════════════ */}
        {step === 'plan' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Mini-resumen del gap */}
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-700/50">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  gap.status === 'CRITICAL' ? 'bg-red-400' :
                  gap.status === 'IMPROVE' ? 'bg-amber-400' :
                  'bg-cyan-400'
                }`} />
                <span className="text-sm text-slate-400">
                  Brecha: <span className="text-white font-medium">{Math.abs(gap.rawGap).toFixed(1)}</span> puntos
                </span>
              </div>
              <span className="text-xs text-slate-500">
                {gap.actualScore.toFixed(1)} &rarr; {gap.targetScore.toFixed(1)}
              </span>
            </div>

            {/* Instrucción clara */}
            <p className="text-xs text-cyan-400 mb-4">
              Revisa y ajusta el plan sugerido, luego agr&eacute;galo o s&aacute;ltalo
            </p>

            {/* Título del objetivo */}
            <div className="mb-4">
              <label className="flex items-center gap-2 text-xs font-medium text-slate-400 mb-2">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                Objetivo sugerido
              </label>
              <textarea
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                rows={2}
                className="w-full bg-transparent text-sm text-slate-200 leading-relaxed p-4 resize-none border border-slate-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 placeholder:text-slate-600"
                placeholder="Escribe el objetivo de desarrollo..."
              />
            </div>

            {/* Meta medible */}
            <div className="mb-4">
              <label className="flex items-center gap-2 text-xs font-medium text-slate-400 mb-2">
                <BookOpen className="w-3.5 h-3.5 text-purple-400" />
                Meta medible
              </label>
              <textarea
                value={editedOutcome}
                onChange={(e) => setEditedOutcome(e.target.value)}
                rows={2}
                className="w-full bg-transparent text-sm text-slate-200 leading-relaxed p-4 resize-none border border-slate-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 placeholder:text-slate-600"
                placeholder="¿Cómo se medirá el éxito?"
              />
            </div>

            {/* Recursos y tiempo */}
            <div className="flex items-center gap-4 text-xs text-slate-500 mb-6">
              {suggestion.suggestedResources?.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>{suggestion.suggestedResources.length} recursos</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>{suggestion.estimatedWeeks} semanas</span>
              </div>
            </div>

            {/* Botones Paso 2 */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <button
                onClick={() => setStep('brecha')}
                className="fhr-btn fhr-btn-ghost flex items-center gap-2"
              >
                <ChevronUp className="w-4 h-4 rotate-[-90deg]" />
                Ver Brecha
              </button>

              <div className="flex items-center gap-3">
                {/* Omitir */}
                <button
                  onClick={() => handleNext(false)}
                  className="fhr-btn fhr-btn-ghost"
                >
                  Omitir
                </button>

                {/* Agregar al Plan */}
                <button
                  onClick={() => handleNext(true)}
                  className="fhr-btn fhr-btn-primary flex items-center gap-2"
                >
                  Agregar al Plan
                  <ChevronDown className="w-4 h-4 rotate-[-90deg]" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
})
