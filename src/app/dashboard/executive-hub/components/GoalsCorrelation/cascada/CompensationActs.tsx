'use client'

// ════════════════════════════════════════════════════════════════════════════
// COMPENSATION ACTS — Capa 2: Stepper Narrativo (2 o 3 actos)
// src/app/dashboard/executive-hub/components/GoalsCorrelation/cascada/CompensationActs.tsx
// ════════════════════════════════════════════════════════════════════════════
// Mérito/Bonos: 3 actos (Lo que no cuadra → Hallazgo Focaliza → La decisión)
// Señales: 2 actos (Lo que no cuadra → La decisión)
// Watermark + step dots + Brain icon hallazgo + CTA visible sin scroll
// ════════════════════════════════════════════════════════════════════════════

import { memo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, ArrowRight, Home, Brain, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PrimaryButton, SecondaryButton, GhostButton } from '@/components/ui/PremiumButton'

import type { CompensationPath } from './CompensationHub'
import type { CorrelationPoint } from '../GoalsCorrelation.types'
import type { ManagerGoalsStats } from '../GoalsCorrelation.types'

// ════════════════════════════════════════════════════════════════════════════
// ACT DEFINITIONS — dynamic content per path
// ════════════════════════════════════════════════════════════════════════════

interface ActDef {
  title: string
  dotColor: string
  isFocaliza?: boolean
  body: string
  findingCard?: { title: string; body: string }
  cta: string
}

function getActs(
  path: CompensationPath,
  correlation: CorrelationPoint[],
  byManager: ManagerGoalsStats[]
): ActDef[] {
  const withGoals = correlation.filter(c => c.quadrant !== 'NO_GOALS' && c.goalsPercent !== null)

  if (path === 'merito') {
    const topMerit = withGoals.filter(c => c.score360 >= 4.0)
    const withLowGoals = topMerit.filter(c => (c.goalsPercent ?? 0) < 80)
    const indulgentManagers = byManager.filter(m => m.evaluatorStatus === 'INDULGENTE')
    const hasSecondVar = indulgentManagers.length > 0

    return [
      {
        title: 'Lo que no cuadra',
        dotColor: '#f59e0b40',
        body: `Estas <b>${topMerit.length} personas</b> reciben la evaluación más alta. Son las primeras en la lista para incremento por mérito. Pero al cruzar con metas, <b>${withLowGoals.length} no cumplieron</b> los resultados que el negocio necesitaba. Aprobar sin revisar es normalizar la desconexión.`,
        cta: 'Descubrir más',
      },
      ...(hasSecondVar ? [{
        title: 'El hallazgo Focaliza',
        dotColor: '#22D3EE60',
        isFocaliza: true,
        body: 'La discrepancia tiene una explicación más profunda. Al cruzar evaluación con resultados, detectamos que en varios casos <b>el jefe que evalúa muestra un patrón sistemático de indulgencia</b>.',
        findingCard: {
          title: 'Tipo de evaluador detectado',
          body: `En <b>${indulgentManagers.length} caso${indulgentManagers.length !== 1 ? 's' : ''}</b>, el jefe que evalúa muestra un patrón de calificaciones consistentemente altas. La evaluación no refleja el desempeño real de su equipo — refleja su criterio al evaluar.`,
        },
        cta: 'Entender la decisión',
      }] : []),
      {
        title: 'La decisión de valor',
        dotColor: '#a78bfa40',
        body: 'El problema no es la política. Es entender si la discrepancia tiene explicación. <b>¿Se informaron las metas? ¿Eran inalcanzables?</b> ¿El liderazgo prioriza la relación sobre la exigencia de resultados? Cada incremento aprobado sin esta respuesta normaliza la desconexión entre evaluación y negocio.',
        cta: 'Ver las personas',
      },
    ]
  }

  if (path === 'bonos') {
    const topGoals = withGoals.filter(c => (c.goalsPercent ?? 0) >= 80)
    const withLow360 = topGoals.filter(c => c.score360 < 4.0)
    const hiddenPerformers = withGoals.filter(c => c.quadrant === 'HIDDEN_PERFORMER')
    const hasTalentVar = hiddenPerformers.some(c => c.riskQuadrant)

    return [
      {
        title: 'Lo que no cuadra',
        dotColor: '#f59e0b40',
        body: `Estas <b>${topGoals.length} personas</b> cumplen metas y califican para bono. Pero al cruzar con la evaluación, <b>${withLow360.length} muestran una discrepancia</b> que pone en duda si el reconocimiento es completo. El bono premia lo de hoy — pero ¿el sistema ve lo que falta?`,
        cta: 'Descubrir más',
      },
      ...(hasTalentVar ? [{
        title: 'El hallazgo Focaliza',
        dotColor: '#22D3EE60',
        isFocaliza: true,
        body: 'La discrepancia tiene una explicación más profunda. Al cruzar con inteligencia de talento, detectamos perfiles que el sistema no reconoce.',
        findingCard: {
          title: 'Tipo de talento detectado',
          body: 'Talento que trae resultados pero que el sistema no reconoce. En unos casos, el compromiso con la organización es crítico — entregan pero están desconectados. En otros, sostienen los números del equipo siendo invisibles para las evaluaciones.',
        },
        cta: 'Entender la decisión',
      }] : []),
      {
        title: 'La decisión de valor',
        dotColor: '#a78bfa40',
        body: 'El bono premia resultados — pero si la evaluación no reconoce a quien trae los números, <b>el motor del negocio recibe el mensaje equivocado</b>. La desmotivación del talento real es silenciosa. Cuando se nota, ya es tarde.',
        cta: 'Ver las personas',
      },
    ]
  }

  // Señales: 2 actos (sin Hallazgo Focaliza)
  const contradictory = withGoals.filter(c => c.quadrant !== 'CONSISTENT')
  return [
    {
      title: 'Lo que no cuadra',
      dotColor: '#f59e0b40',
      body: `La combinación de bono y mérito que recibe cada persona <b>envía un mensaje implícito</b>. Estas <b>${contradictory.length} personas</b> reciben señales contradictorias. El talento real lee esas señales mejor que cualquier comunicado.`,
      cta: 'Descubrir más',
    },
    {
      title: 'La decisión de valor',
      dotColor: '#a78bfa40',
      body: 'El desafío no es qué pagar. Es entender <b>qué le estás diciendo a cada persona</b> con tus decisiones. Alto bono + bajo mérito = "te premio hoy pero no invierto en tu futuro."',
      cta: 'Ver las personas',
    },
  ]
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
  const acts = getActs(path, correlation, byManager)
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
        {/* Top bar: back + home — FIX 5: GhostButton */}
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

            {/* Focaliza badge (acto 2 when exists) */}
            {current.isFocaliza && (
              <div className="flex items-center gap-2 relative z-10">
                <Brain className="w-[18px] h-[18px] text-purple-400" />
                <span className="font-mono text-[10px] tracking-[2px] uppercase text-cyan-400/70">
                  Inteligencia Focaliza
                </span>
              </div>
            )}

            {/* Act title — FIX 4: protagonista */}
            <div className="flex items-center gap-3 relative z-10">
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ background: current.dotColor }}
              />
              <h3 className="text-lg font-normal text-slate-200 tracking-tight">
                {current.title}
              </h3>
            </div>

            {/* Body */}
            <p
              className="text-base font-light leading-[1.75] text-slate-400 relative z-10 [&>b]:text-slate-200 [&>b]:font-normal"
              dangerouslySetInnerHTML={{ __html: current.body }}
            />

            {/* Finding card (Hallazgo Focaliza) */}
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

            {/* CTA — FIX 5: PremiumButtons */}
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
