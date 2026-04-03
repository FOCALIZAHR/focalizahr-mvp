// ════════════════════════════════════════════════════════════════════════════
// ACTO 1 — EL PANORAMA
// Ancla: % desalineamiento organizacional
// ════════════════════════════════════════════════════════════════════════════

import { memo } from 'react'
import { motion } from 'framer-motion'
import { ActSeparator, fadeIn, fadeInDelay } from './shared'

interface ActoPanoramaProps {
  totalEvaluados: number
  perceptionBiasCount: number
  hiddenPerformerCount: number
}

export default memo(function ActoPanorama({
  totalEvaluados,
  perceptionBiasCount,
  hiddenPerformerCount,
}: ActoPanoramaProps) {
  const pctDesalineamiento = totalEvaluados > 0
    ? Math.round(((perceptionBiasCount + hiddenPerformerCount) / totalEvaluados) * 100)
    : 0

  return (
    <>
      <ActSeparator label="Resultados" color="cyan" />

      <div>
        <motion.div {...fadeInDelay} className="text-center mb-10">
          <p className="text-7xl md:text-8xl font-extralight text-amber-400 tracking-tight">
            {pctDesalineamiento}%
          </p>
          <p className="text-xs text-slate-500 mt-3 uppercase tracking-wider">
            de desalineamiento organizacional
          </p>
        </motion.div>

        <motion.div {...fadeIn} className="max-w-2xl mx-auto space-y-4">
          <p className="text-xl font-light text-slate-300 text-center leading-relaxed">
            De <span className="font-medium text-slate-200">{totalEvaluados}</span> personas evaluadas,
            el <span className="font-medium text-amber-400">{pctDesalineamiento}%</span> muestra
            una contradicción entre su capacidad y sus resultados de negocio.
          </p>
          <p className="text-base font-light text-slate-400 leading-relaxed text-center">
            O tus mejores evaluados no están entregando resultados.
            O quienes sí entregan no están siendo reconocidos por el sistema.
          </p>
          <p className="text-base font-light text-slate-400 leading-relaxed text-center">
            En ambos casos, las decisiones de compensación, promoción y sucesión
            se construyen sobre una base inconsistente.
          </p>

          {/* Blockquote coaching */}
          <div className="border-l-2 border-cyan-500/30 pl-4 mt-6">
            <p className="text-sm italic font-light text-slate-300 leading-relaxed">
              El desalineamiento no es un dato más. Es la señal de que el sistema no está midiendo lo que el negocio necesita.
            </p>
          </div>
        </motion.div>
      </div>
    </>
  )
})
