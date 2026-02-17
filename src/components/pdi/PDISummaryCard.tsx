'use client'

import { memo } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, ArrowRight } from 'lucide-react'

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
  const firstName = employeeName.split(' ')[0]
  const aiGoals = goals.length - manualGoalsCount

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 220, damping: 30 }}
      className="relative bg-[#0F172A]/90 backdrop-blur-2xl border border-slate-800 rounded-[24px] overflow-hidden"
    >
      {/* Tesla line animada */}
      <div
        className="absolute top-0 left-0 right-0 h-[1px] z-10"
        style={{
          background: 'linear-gradient(90deg, transparent, #22D3EE, #A78BFA, transparent)',
          boxShadow: '0 0 15px #22D3EE'
        }}
      />

      <div className="p-8 md:p-10">
        {/* Header */}
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle className="w-5 h-5 text-emerald-400" />
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
            Plan Creado
          </span>
        </div>

        <h2 className="text-2xl font-light text-white mb-1">
          Plan de Desarrollo de <span className="text-cyan-400 font-medium">{firstName}</span>
        </h2>
        <p className="text-sm text-slate-400 mb-8">
          Ciclo actual
        </p>

        {/* Divider */}
        <div className="h-px bg-slate-800 mb-8" />

        {/* Metric cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {/* Role Fit */}
          <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-4 text-center">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Role Fit</p>
            <div className="text-3xl font-extralight tabular-nums text-cyan-400">
              {roleFitScore !== null ? `${roleFitScore}%` : 'N/A'}
            </div>
            {roleFitScore !== null && (
              <div className="mt-2 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-700"
                  style={{ width: `${roleFitScore}%` }}
                />
              </div>
            )}
          </div>

          {/* Score 360 */}
          <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-4 text-center">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Nota 360</p>
            <div className="text-3xl font-extralight tabular-nums text-white">
              {overallScore !== null ? `${overallScore.toFixed(1)}/5` : 'N/A'}
            </div>
            {overallScore !== null && (
              <div className="mt-2 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-white/30 transition-all duration-700"
                  style={{ width: `${(overallScore / 5) * 100}%` }}
                />
              </div>
            )}
          </div>

          {/* Goals count */}
          <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-4 text-center">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Objetivos</p>
            <div className="text-3xl font-extralight tabular-nums text-purple-400">
              {goals.length}
            </div>
            <p className="text-[10px] text-slate-500 mt-2">
              {aiGoals > 0 && `${aiGoals} brechas`}
              {aiGoals > 0 && manualGoalsCount > 0 && ' · '}
              {manualGoalsCount > 0 && `${manualGoalsCount} manual${manualGoalsCount > 1 ? 'es' : ''}`}
            </p>
          </div>
        </div>

        {/* Goals list */}
        <div className="space-y-2 mb-8">
          {goals.map((goal, i) => (
            <div key={i} className="flex items-center gap-3 text-sm">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
              <span className="text-slate-300 truncate">{goal.title}</span>
              {goal.isManual && (
                <span className="text-[10px] text-purple-400 border border-purple-500/30 px-1.5 py-0.5 rounded shrink-0">
                  manual
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Next step */}
        <div className="rounded-xl p-4 bg-slate-800/30 border border-slate-700/30 mb-8">
          <p className="text-xs text-slate-400">
            Próximo paso: El colaborador debe revisar y aceptar el plan de desarrollo.
          </p>
        </div>

        {/* Action */}
        <div className="flex justify-center">
          <button
            onClick={onViewPlan}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-500 text-white text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Ver Plan Completo
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  )
})
