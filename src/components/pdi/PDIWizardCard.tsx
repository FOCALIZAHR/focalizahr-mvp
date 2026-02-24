'use client'

import { memo, useState, useCallback, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { BrainCircuit, ArrowRight, ArrowLeft, Check, MessageSquare, Clock } from 'lucide-react'
import { PrimaryButton, GhostButton, SecondaryButton } from '@/components/ui/PremiumButton'

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
      className="relative bg-[#0F172A] backdrop-blur-2xl border border-slate-800 rounded-2xl overflow-hidden"
      onKeyDown={(e) => {
        const el = e.target as HTMLElement
        const isTyping = el.tagName === 'TEXTAREA' || el.tagName === 'INPUT' || el.isContentEditable
        if (isTyping) return
        e.stopPropagation()
      }}
    >
      {/* ═══ LÍNEA TESLA ═══ */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px] z-10"
        style={{
          background: getTeslaLineColor(),
          boxShadow: getTeslaGlow()
        }}
      />

      <div className="p-8">
        {/* ═══ INDICADOR GLOBAL (Breadcrumb de negocio) ═══ */}
        <div className="text-sm text-slate-500 mb-6">
          Brecha {currentIndex + 1} de {totalCount} · {' '}
          <span className={step === 'brecha' ? 'text-cyan-400' : 'text-slate-500'}>
            Entender
          </span>
          {' → '}
          <span className={step === 'plan' ? 'text-cyan-400' : 'text-slate-500'}>
            Decidir
          </span>
        </div>

        {/* ════════════════════════════════════════════════════════════════════
            VISTA 1: PORTADA DE LA BRECHA (step === 'brecha')
        ════════════════════════════════════════════════════════════════════ */}
        {step === 'brecha' && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Badge de categoría */}
            <div className="flex items-center gap-3">
              <span
                className={`px-2.5 py-1 rounded-md border text-[10px] font-semibold uppercase tracking-wider ${
                  suggestion.category === 'URGENTE'
                    ? 'bg-red-500/10 text-red-400 border-red-500/20'
                    : suggestion.category === 'IMPACTO'
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    : suggestion.category === 'QUICK_WIN'
                    ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                }`}
              >
                {suggestion.categoryLabel || 'Desarrollo'}
              </span>
            </div>

            {/* EL HÉROE: Competencia + Diagnóstico */}
            <div>
              <h2 className="text-3xl font-light text-white leading-tight mb-3">
                {gap.competencyName}
              </h2>
              <p className="text-xl text-slate-300 font-light leading-relaxed">
                {suggestion.narrative ||
                  `Esta competencia presenta una brecha de ${Math.abs(gap.rawGap).toFixed(1)} puntos respecto al nivel esperado.`}
              </p>
            </div>

            {/* LA IDEA FUERZA */}
            <p className="text-slate-400 leading-relaxed">
              Como líder, conoces a tu colaborador mejor que nadie. Hemos preparado un lineamiento
              para abordar esta competencia. Tu misión en el siguiente paso es revisar el borrador
              de la IA, perfeccionarlo con tu contexto y darle tu toque de liderazgo.
            </p>

            {/* TIP DE 1:1 (Glassmorphism) */}
            {suggestion.coachingTip && (
              <div className="bg-slate-800/30 backdrop-blur p-5 rounded-xl border border-slate-700/50">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20
                    flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-2">
                      Tip para tu 1:1
                    </p>
                    <p className="text-sm text-slate-300 leading-relaxed">
                      {suggestion.coachingTip}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* CTAs VISTA 1 (Responsive: principal arriba en móvil) */}
            <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between w-full gap-3 pt-6">
              <div className="w-full sm:w-auto">
                <GhostButton
                  icon={ArrowLeft}
                  onClick={onPrevious}
                  disabled={currentIndex === 0}
                  size="md"
                  fullWidth
                >
                  Anterior
                </GhostButton>
              </div>

              <div className="w-full sm:w-auto">
                <PrimaryButton
                  icon={ArrowRight}
                  iconPosition="right"
                  onClick={() => setStep('plan')}
                  size="lg"
                  glow
                  fullWidth
                >
                  Ver borrador de desarrollo
                </PrimaryButton>
              </div>
            </div>
          </motion.div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            VISTA 2: WORKSPACE DE EDICIÓN (step === 'plan')
        ════════════════════════════════════════════════════════════════════ */}
        {step === 'plan' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* SELLO DE IA - Inteligencia Focaliza */}
            <div className="flex items-start sm:items-center gap-3 text-sm text-slate-400">
              <BrainCircuit className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5 sm:mt-0" />
              <span>
                Borrador generado por <span className="text-purple-400 font-medium">Inteligencia Focaliza</span>.
                <span className="text-slate-500"> Edítalo a tu estilo o apruébalo directamente.</span>
              </span>
            </div>

            {/* HEADER: Competencia + Métricas (Responsive) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-4 border-b border-slate-800/50">
              <h3 className="text-lg font-medium text-white">
                {gap.competencyName}
              </h3>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-slate-500">
                <span>
                  Brecha: <span className="text-white font-medium">{Math.abs(gap.rawGap).toFixed(1)}</span>
                </span>
                <span className="text-slate-700">|</span>
                <span>
                  {gap.actualScore.toFixed(1)} → {gap.targetScore.toFixed(1)}
                </span>
                {suggestion.estimatedWeeks && (
                  <>
                    <span className="text-slate-700">|</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {suggestion.estimatedWeeks} sem
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* INPUT: Objetivo sugerido */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">
                Objetivo de desarrollo
              </label>
              <textarea
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                rows={2}
                className="w-full bg-slate-900/50 backdrop-blur border border-slate-700 rounded-xl
                  p-5 text-lg text-white placeholder:text-slate-500 resize-none
                  transition-all duration-200
                  hover:border-slate-600
                  focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/20 focus:outline-none"
                placeholder="Escribe el objetivo de desarrollo..."
              />
            </div>

            {/* INPUT: Meta medible */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">
                Meta medible
              </label>
              <textarea
                value={editedOutcome}
                onChange={(e) => setEditedOutcome(e.target.value)}
                rows={2}
                className="w-full bg-slate-900/50 backdrop-blur border border-slate-700 rounded-xl
                  p-5 text-lg text-white placeholder:text-slate-500 resize-none
                  transition-all duration-200
                  hover:border-slate-600
                  focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/20 focus:outline-none"
                placeholder="¿Cómo se medirá el éxito?"
              />
            </div>

            {/* CTAs VISTA 2 (Responsive: principal arriba en móvil) */}
            <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between w-full gap-3 pt-6 border-t border-slate-800/50">
              <div className="w-full sm:w-auto">
                <GhostButton
                  icon={ArrowLeft}
                  onClick={() => setStep('brecha')}
                  size="md"
                  fullWidth
                >
                  Volver
                </GhostButton>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                <div className="w-full sm:w-auto order-2 sm:order-1">
                  <GhostButton
                    onClick={() => handleNext(false)}
                    size="md"
                    fullWidth
                  >
                    Omitir
                  </GhostButton>
                </div>

                <div className="w-full sm:w-auto order-1 sm:order-2">
                  <SecondaryButton
                    icon={Check}
                    onClick={() => handleNext(true)}
                    size="lg"
                    glow
                    fullWidth
                  >
                    Aprobar este objetivo
                  </SecondaryButton>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
})
