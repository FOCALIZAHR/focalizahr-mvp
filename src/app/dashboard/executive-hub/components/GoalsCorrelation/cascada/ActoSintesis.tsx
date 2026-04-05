// ════════════════════════════════════════════════════════════════════════════
// SÍNTESIS — Cierre ejecutivo + acceso a scatter
// ════════════════════════════════════════════════════════════════════════════

import { memo, useMemo } from 'react'
import { motion } from 'framer-motion'
import { BarChart3 } from 'lucide-react'

import type { GoalsCorrelationDataV2 } from '../GoalsCorrelation.types'
import { GoalsSynthesisEngine } from '@/lib/services/GoalsSynthesisEngine'
import { ActSeparator, fadeIn } from './shared'

interface ActoSintesisProps {
  data: GoalsCorrelationDataV2
  onOpenScatter: () => void
}

export default memo(function ActoSintesis({ data, onOpenScatter }: ActoSintesisProps) {
  const synthesis = useMemo(() => GoalsSynthesisEngine.generate(data), [data])

  // Personas con discrepancia que entran al checkpoint de compensaciones
  const discrepancyInComp =
    data.quadrantCounts.perceptionBias +
    data.quadrantCounts.hiddenPerformer +
    data.quadrantCounts.doubleRisk

  return (
    <>
      <ActSeparator label="Síntesis" color="cyan" />

      <motion.div {...fadeIn} className="max-w-2xl mx-auto space-y-6">
        {/* Classification */}
        <p className="text-lg font-light text-slate-200 text-center leading-relaxed">
          {synthesis.classification}
        </p>

        {/* Implication */}
        <p className="text-base italic font-light text-slate-300 leading-relaxed text-center">
          {synthesis.implication}
        </p>

        {/* Path */}
        <div className="border-l-2 border-cyan-500/30 pl-4">
          <p className="text-base font-light text-slate-400 leading-relaxed">
            {synthesis.path}
          </p>
        </div>

        {/* Accountability */}
        <p className="text-sm italic font-light text-slate-500 text-center">
          {synthesis.accountability}
        </p>

        {/* Dato del checkpoint de compensaciones */}
        {discrepancyInComp > 0 && (
          <p className="text-sm font-light text-slate-400 text-center border-t border-slate-800/40 pt-4">
            <span className="text-white font-normal">{discrepancyInComp}</span>{' '}
            {discrepancyInComp === 1 ? 'persona' : 'personas'} con discrepancia{' '}
            {discrepancyInComp === 1 ? 'está' : 'están'} en la lista de compensaciones de este ciclo.
          </p>
        )}

        {/* Compensation bridge */}
        <p className="text-[11px] font-light text-slate-600 text-center">
          Antes de aprobar compensaciones, valida estos datos en la pestaña Compensación.
        </p>

        {/* Scatter link */}
        <div className="text-center pt-2">
          <button
            onClick={onOpenScatter}
            className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-400 transition-colors"
          >
            <BarChart3 className="w-4 h-4" />
            Explorar datos en scatter
          </button>
        </div>
      </motion.div>
    </>
  )
})
