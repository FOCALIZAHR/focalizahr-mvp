'use client'

// ════════════════════════════════════════════════════════════════════════════
// COMPENSATION ACTS — Capa 2: Stepper Narrativo (2 o 3 actos)
// src/app/dashboard/executive-hub/components/GoalsCorrelation/cascada/CompensationActs.tsx
// ════════════════════════════════════════════════════════════════════════════
// Narrativas centralizadas en CompensationActsDictionary.ts
// Zero narrativas hardcodeadas en este archivo.
// ════════════════════════════════════════════════════════════════════════════

import { memo, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, ArrowRight, Home, Brain, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PrimaryButton, SecondaryButton, GhostButton } from '@/components/ui/PremiumButton'

import type { CompensationPath } from './CompensationHub'
import type { CorrelationPoint, ManagerGoalsStats } from '../GoalsCorrelation.types'
import {
  getMeritoNarratives,
  getBonosNarratives,
  getSenalesNarratives,
  type ActNarrative,
} from '@/config/narratives/CompensationActsDictionary'

// ════════════════════════════════════════════════════════════════════════════
// BUILD ACTS FROM DICTIONARY
// ════════════════════════════════════════════════════════════════════════════

function getActs(
  path: CompensationPath,
  correlation: CorrelationPoint[],
  byManager: ManagerGoalsStats[]
): ActNarrative[] {
  const withGoals = correlation.filter(c => c.quadrant !== 'NO_GOALS' && c.goalsPercent !== null)

  if (path === 'merito') {
    const topMerit = withGoals.filter(c => c.score360 >= 4.0)
    const withLowGoals = topMerit.filter(c => (c.goalsPercent ?? 0) < 80)
    const indulgentManagers = byManager.filter(m => m.evaluatorStatus === 'INDULGENTE')
    const { acts } = getMeritoNarratives(
      topMerit.length,
      withLowGoals.length,
      indulgentManagers.length,
      indulgentManagers.length > 0,
    )
    return acts
  }

  if (path === 'bonos') {
    const topGoals = withGoals.filter(c => (c.goalsPercent ?? 0) >= 80)
    const withLow360 = topGoals.filter(c => c.score360 < 4.0)
    const hiddenPerformers = withGoals.filter(c => c.quadrant === 'HIDDEN_PERFORMER')
    const hasTalentVar = hiddenPerformers.some(c => c.riskQuadrant)
    const countRisk = hiddenPerformers.filter(c => c.riskQuadrant === 'FUGA_CEREBROS' || c.riskQuadrant === 'BURNOUT_RISK').length
    const countInvisible = hiddenPerformers.filter(c => !c.riskQuadrant).length
    const { acts } = getBonosNarratives(
      topGoals.length,
      withLow360.length,
      hasTalentVar,
      countRisk,
      countInvisible,
    )
    return acts
  }

  // Señales
  const contradictory = withGoals.filter(c => c.quadrant !== 'CONSISTENT')
  const { acts } = getSenalesNarratives(contradictory.length)
  return acts
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ════════════════════════════════════════════════════════════════════════════

interface CompensationActsProps {
  path: CompensationPath
  correlation: CorrelationPoint[]
  byManager: ManagerGoalsStats[]
  onComplete: () => void
  onBack: () => void
  onHome: () => void
}

export default memo(function CompensationActs({
  path,
  correlation,
  byManager,
  onComplete,
  onBack,
  onHome,
}: CompensationActsProps) {
  const [step, setStep] = useState(0)
  const acts = useMemo(() => getActs(path, correlation, byManager), [path, correlation, byManager])
  const current = acts[step]
  const total = acts.length
  const isLast = step === total - 1

  const handleNext = () => {
    if (isLast) onComplete()
    else setStep(s => s + 1)
  }

  const handleBack = () => {
    if (step === 0) onBack()
    else setStep(s => s - 1)
  }

  if (!current) return null

  return (
    <div className="relative rounded-2xl border border-slate-800/40 bg-slate-900/60 backdrop-blur-sm overflow-hidden">
      {/* Tesla line */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{
          background: 'linear-gradient(90deg, transparent 5%, #22D3EE 35%, #A78BFA 65%, transparent 95%)',
          opacity: 0.7,
        }}
      />

      <div className="p-7">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-5">
          <GhostButton icon={ArrowLeft} onClick={handleBack} size="sm">
            {step === 0 ? 'Checkpoint' : 'Paso anterior'}
          </GhostButton>
          <button
            onClick={onHome}
            className="flex items-center gap-1.5 border border-slate-800/50 text-slate-600 hover:border-cyan-500/20 hover:text-slate-400 text-[10px] px-3 py-1.5 rounded-md transition-all"
          >
            <Home className="w-3 h-3" /> Inicio
          </button>
        </div>

        {/* Act card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="relative flex flex-col gap-4"
          >
            {/* Watermark number */}
            <div className="absolute -bottom-6 -right-1.5 text-[180px] font-black text-white opacity-[0.06] leading-none tracking-tighter select-none pointer-events-none">
              {step + 1}
            </div>

            {/* Step indicator */}
            <div className="flex items-center gap-2 relative z-10">
              <span className="font-mono text-[11px] tracking-[1.5px] text-cyan-400/80">
                {step + 1} de {total}
              </span>
              <div className="flex gap-[5px]">
                {acts.map((_, i) => (
                  <span
                    key={i}
                    className={cn(
                      'w-1.5 h-1.5 rounded-full transition-all duration-300',
                      i === step ? 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.4)]' :
                      i < step ? 'bg-cyan-400/40' : 'bg-slate-800'
                    )}
                  />
                ))}
              </div>
            </div>

            {/* Act title — protagonista. Brain sutil si es Focaliza */}
            <div className="flex items-center gap-3 relative z-10">
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ background: current.isFocaliza ? '#22D3EE60' : step === 0 ? '#f59e0b40' : '#a78bfa40' }}
              />
              <h3 className="text-lg font-normal text-slate-200 tracking-tight">
                {current.title}
              </h3>
              {current.isFocaliza && (
                <div className="group/fz relative">
                  <Brain className="w-3.5 h-3.5 text-purple-400/40 cursor-help" />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 px-3 py-2 rounded-xl bg-slate-950/95 backdrop-blur-xl border border-slate-700/30 shadow-2xl opacity-0 group-hover/fz:opacity-100 transition-all duration-200 pointer-events-none z-50">
                    <p className="text-[10px] text-slate-300 leading-relaxed">
                      Los algoritmos de inteligencia FocalizaHR detectaron esta inconsistencia al cruzar múltiples fuentes de datos.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Body */}
            <p
              className="text-base font-light leading-[1.75] text-slate-400 relative z-10 [&>b]:text-slate-200 [&>b]:font-normal"
              dangerouslySetInnerHTML={{ __html: current.body }}
            />

            {/* Finding card */}
            {current.findingCard && (
              <div className="relative z-10 p-4 rounded-xl bg-[#0B1120]/80 border border-slate-800/50">
                <p className="text-xs text-cyan-400/60 font-normal mb-1.5">
                  {current.findingCard.title}
                </p>
                <p
                  className="text-[13px] text-slate-500 font-light leading-relaxed [&>b]:text-cyan-400 [&>b]:font-normal"
                  dangerouslySetInnerHTML={{ __html: current.findingCard.body }}
                />
              </div>
            )}

            {/* CTA — PremiumButtons */}
            <div className="relative z-10 mt-1">
              {isLast ? (
                <PrimaryButton icon={Users} iconPosition="right" onClick={handleNext}>
                  {current.cta}
                </PrimaryButton>
              ) : (
                <SecondaryButton icon={ArrowRight} iconPosition="right" onClick={handleNext}>
                  {current.cta}
                </SecondaryButton>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
})
