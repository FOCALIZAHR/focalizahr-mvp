'use client'

// ════════════════════════════════════════════════════════════════════════════
// COMPENSATION PORTADA — Sentencia de confianza antes de compensar
// src/app/dashboard/executive-hub/components/GoalsCorrelation/cascada/CompensationPortada.tsx
// ════════════════════════════════════════════════════════════════════════════
// El CEO ve primero si PUEDE confiar en los datos, después revisa los casos.
// ════════════════════════════════════════════════════════════════════════════

import { memo, useMemo } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, HelpCircle } from 'lucide-react'
import { PrimaryButton } from '@/components/ui/PremiumButton'

import type { CorrelationPoint } from '../GoalsCorrelation.types'
import type { GerenciaGoalsStatsV2 } from '@/lib/services/GoalsDiagnosticService'

// ════════════════════════════════════════════════════════════════════════════

interface CompensationPortadaProps {
  correlation: CorrelationPoint[]
  byGerencia: GerenciaGoalsStatsV2[]
  onContinue: () => void
  onOpenGerenciaModal: () => void
}

export default memo(function CompensationPortada({
  correlation,
  byGerencia,
  onContinue,
  onOpenGerenciaModal,
}: CompensationPortadaProps) {
  const stats = useMemo(() => {
    const withGoals = correlation.filter(c => c.quadrant !== 'NO_GOALS' && c.goalsPercent !== null)
    const discrepancy = withGoals.filter(c => c.quadrant !== 'CONSISTENT').length
    const totalGerencias = byGerencia.length
    const sinConfianza = byGerencia.filter(g => g.confidenceLevel === 'red').length
    return { discrepancy, totalGerencias, sinConfianza }
  }, [correlation, byGerencia])

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
        {/* Title — word split */}
        <div className="mb-6">
          <span className="text-2xl font-extralight text-white tracking-tight block leading-tight">
            Antes de
          </span>
          <span className="text-2xl font-light tracking-tight block leading-tight fhr-title-gradient">
            aprobar
          </span>
        </div>

        {/* Hero number */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-[44px] font-extralight text-cyan-400 leading-none mb-1"
        >
          {stats.discrepancy}
        </motion.p>
        <p className="text-sm font-light text-slate-400 leading-relaxed max-w-[400px] mb-5">
          personas con discrepancia entre evaluación y resultados.
        </p>

        {/* Confianza por gerencia */}
        {stats.sinConfianza > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex items-center gap-1.5 mb-6"
          >
            <p className="text-sm font-light text-slate-400">
              <span className="text-amber-400 font-medium">{stats.sinConfianza}</span> de {stats.totalGerencias} gerencias no tienen base confiable para compensar.
            </p>
            <button
              onClick={onOpenGerenciaModal}
              className="group/info relative flex-shrink-0"
            >
              <HelpCircle className="w-4 h-4 text-slate-600 hover:text-cyan-400 transition-colors cursor-pointer" />
            </button>
          </motion.div>
        )}

        {stats.sinConfianza === 0 && stats.totalGerencias > 0 && (
          <p className="text-sm font-light text-slate-500 mb-6">
            {stats.totalGerencias} gerencias con base confiable para compensar.
          </p>
        )}

        {/* CTA */}
        <PrimaryButton icon={ArrowRight} iconPosition="right" onClick={onContinue}>
          Revisar casos
        </PrimaryButton>
      </div>
    </div>
  )
})
