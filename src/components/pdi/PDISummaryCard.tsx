'use client'

import { memo } from 'react'
import { motion } from 'framer-motion'
import { Target, ArrowRight, Sparkles } from 'lucide-react'
import { getRoleFitClassification } from '@/config/performanceClassification'
import { formatDisplayName } from '@/lib/utils/formatName'
import { PrimaryButton } from '@/components/ui/PremiumButton'

interface SummaryGoal {
  competencyCode: string
  title: string
  isManual?: boolean
}

interface PDISummaryCardProps {
  employeeName: string
  roleFitScore: number | null
  overallScore: number | null
  goals: SummaryGoal[]
  manualGoalsCount: number
  onViewPlan: () => void
}

export default memo(function PDISummaryCard({
  employeeName,
  roleFitScore,
  overallScore,
  goals,
  manualGoalsCount,
  onViewPlan
}: PDISummaryCardProps) {
  // Normalizador FocalizaHR: "NUÑEZ,MARIA ANTONIETA" → "María"
  const firstName = formatDisplayName(employeeName, 'short').split(' ')[0]
  const aiGoals = goals.length - manualGoalsCount

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 220, damping: 30 }}
      className="relative bg-[#0F172A] backdrop-blur-2xl border border-slate-800 rounded-2xl overflow-hidden"
    >
      {/* ═══ LÍNEA TESLA CYAN ═══ */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px] z-10 bg-cyan-500"
        style={{ boxShadow: '0 0 20px rgba(34, 211, 238, 0.4)' }}
      />

      <div className="p-6 sm:p-8 md:p-10">
        {/* ═══ CABECERA (Copywriting Apple) ═══ */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full
            bg-emerald-500/10 border border-emerald-500/20 mb-6">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
              Plan Estructurado
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-light text-white mb-3">
            Plan de desarrollo listo para{' '}
            <span className="text-cyan-400">{firstName}</span>
          </h2>

          <p className="text-slate-400 leading-relaxed">
            Has creado un plan claro y accionable.
          </p>
        </div>

        {/* ═══ METRIC CARDS (Premium + Mobile First) ═══ */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-8">
          {/* Role Fit */}
          <div className="relative rounded-xl bg-slate-900/50 backdrop-blur border border-slate-800 p-4 text-center overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-slate-600" />
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-3">
              Role Fit
            </p>
            {roleFitScore !== null && roleFitScore !== undefined ? (() => {
              const classification = getRoleFitClassification(roleFitScore)
              return (
                <>
                  <div
                    className="text-2xl sm:text-3xl font-extralight tabular-nums"
                    style={{ color: classification.color }}
                  >
                    {roleFitScore}%
                  </div>
                  <p
                    className="text-xs font-medium mt-1"
                    style={{ color: classification.color }}
                  >
                    {classification.labelShort}
                  </p>
                </>
              )
            })() : (
              <p className="text-sm text-slate-500 italic">Evaluación pendiente</p>
            )}
          </div>

          {/* Nota 360 */}
          <div className="relative rounded-xl bg-slate-900/50 backdrop-blur border border-slate-800 p-4 text-center overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-slate-600" />
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-3">
              Nota 360
            </p>
            {overallScore !== null && overallScore !== undefined ? (
              <div className="text-2xl sm:text-3xl font-extralight tabular-nums text-white">
                {overallScore.toFixed(1)}/5
              </div>
            ) : (
              <p className="text-sm text-slate-500 italic">Evaluación pendiente</p>
            )}
          </div>

          {/* Goals count - PROTAGONISTA */}
          <div className="relative rounded-xl bg-slate-900/50 backdrop-blur border border-cyan-500/30 p-4 text-center overflow-hidden">
            <div
              className="absolute top-0 left-0 right-0 h-[2px] bg-cyan-500"
              style={{ boxShadow: '0 0 10px rgba(34, 211, 238, 0.5)' }}
            />
            <p className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 mb-3">
              Objetivos
            </p>
            <div className="text-2xl sm:text-3xl font-extralight tabular-nums text-cyan-400">
              {goals.length}
            </div>
            <p className="text-[10px] text-slate-400 mt-2">
              {aiGoals > 0 && `${aiGoals} de brechas`}
              {aiGoals > 0 && manualGoalsCount > 0 && ' · '}
              {manualGoalsCount > 0 && `${manualGoalsCount} manual${manualGoalsCount > 1 ? 'es' : ''}`}
            </p>
          </div>
        </div>

        {/* ═══ RESUMEN EJECUTIVO (Lista de Objetivos Premium) ═══ */}
        <div className="bg-slate-900/50 backdrop-blur border border-slate-700 rounded-2xl p-5 sm:p-6 mb-8">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-4">
            Objetivos del plan
          </p>
          <div className="space-y-3">
            {goals.map((goal, i) => (
              <div key={i} className="flex items-start gap-3">
                <Target className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-slate-300 leading-relaxed">
                  {goal.title}
                </span>
                {goal.isManual && (
                  <span className="bg-purple-500/10 text-purple-400 border border-purple-500/20
                    text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-md
                    flex-shrink-0 ml-auto">
                    Manual
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ═══ CAJA DE PRÓXIMO PASO (Copywriting Activo) ═══ */}
        <div className="bg-cyan-900/10 border border-cyan-800/50 rounded-xl p-5 mb-8">
          <p className="text-sm text-slate-300 leading-relaxed">
            <span className="mr-2">🎯</span>
            <span className="font-medium text-white">Tu misión ahora:</span>{' '}
            Agenda un espacio 1:1 con {firstName} para oficializar este plan.
            Al guardar, verás el detalle final del documento.
          </p>
        </div>

        {/* ═══ CTA ÚNICO (Firma Final) ═══ */}
        <div className="flex justify-center">
          <div className="w-full sm:w-auto">
            <PrimaryButton
              icon={ArrowRight}
              iconPosition="right"
              onClick={onViewPlan}
              size="xl"
              glow
              fullWidth
            >
              Guardar y Ver Plan
            </PrimaryButton>
          </div>
        </div>
      </div>
    </motion.div>
  )
})
