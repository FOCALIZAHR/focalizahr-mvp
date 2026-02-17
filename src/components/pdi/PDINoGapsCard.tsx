'use client'

import { memo } from 'react'
import { motion } from 'framer-motion'
import { Target, Plus, CheckCircle } from 'lucide-react'

interface RoleFitSummary {
  roleFitScore: number
  summary: {
    totalCompetencies: number
    matching: number
    exceeds: number
  }
}

interface PDINoGapsCardProps {
  employeeName: string
  roleFit: RoleFitSummary | null
  onAddManual: () => void
  onFinish: () => void
}

export default memo(function PDINoGapsCard({
  employeeName,
  roleFit,
  onAddManual,
  onFinish
}: PDINoGapsCardProps) {
  const firstName = employeeName.split(' ')[0]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 220, damping: 30 }}
      className="relative bg-[#0F172A]/90 backdrop-blur-2xl border border-slate-800 rounded-[24px] overflow-hidden"
    >
      {/* Tesla line verde */}
      <div
        className="absolute top-0 left-0 right-0 h-[1px] z-10"
        style={{
          background: 'linear-gradient(90deg, transparent, #10B981, transparent)',
          boxShadow: '0 0 15px #10B981'
        }}
      />

      <div className="p-10">
        {/* Header */}
        <div className="flex items-center gap-2 mb-2">
          <Target className="w-5 h-5 text-emerald-400" />
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
            Adecuación al Cargo
          </span>
        </div>

        <h2 className="text-2xl font-light text-white mb-1">
          Excelente, <span className="text-cyan-400 font-medium">{firstName}</span>
        </h2>
        <p className="text-sm text-slate-400 mb-8">
          No se detectaron brechas de desarrollo
        </p>

        {/* Divider */}
        <div className="h-px bg-slate-800 mb-8" />

        {/* Role Fit Score */}
        {roleFit && (
          <div className="flex items-center gap-8 mb-8">
            <div className="text-center">
              <div className="text-5xl font-extralight text-emerald-400 tabular-nums">
                {roleFit.roleFitScore}%
              </div>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">
                Role Fit
              </p>
            </div>

            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span className="text-sm text-slate-300">
                  {roleFit.summary.matching} competencias al nivel esperado
                </span>
              </div>
              {roleFit.summary.exceeds > 0 && (
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-cyan-400" />
                  <span className="text-sm text-slate-300">
                    {roleFit.summary.exceeds} por encima del estándar
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Message */}
        <div className="rounded-xl p-5 bg-slate-800/50 border border-slate-700/50 mb-8">
          <p className="text-sm text-slate-300 leading-relaxed">
            Todas las competencias evaluadas están al nivel esperado o superior para su cargo.
            Puedes agregar un objetivo de desarrollo personalizado si lo deseas.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onFinish}
            className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition-colors"
          >
            Finalizar sin objetivos
          </button>
          <button
            onClick={onAddManual}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-500 text-white text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            Agregar objetivo
          </button>
        </div>
      </div>
    </motion.div>
  )
})
