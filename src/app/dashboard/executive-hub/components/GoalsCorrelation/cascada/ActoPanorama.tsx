// ════════════════════════════════════════════════════════════════════════════
// ACTO 1 — CONFIABILIDAD
// Ancla: coherenceScore (17%) — QUÉ SIGNIFICA para el negocio
// No repite la composición (eso lo hizo el Acto Ancla).
// Dice: "tus datos predicen la realidad en un 17%" + "O" McKinsey.
// ════════════════════════════════════════════════════════════════════════════

import { memo } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { ActSeparator, fadeIn, fadeInDelay } from './shared'

interface ActoPanoramaProps {
  coherenceScore: number
  totalEvaluados: number
}

export default memo(function ActoPanorama({
  coherenceScore,
  totalEvaluados,
}: ActoPanoramaProps) {
  const ruido = 100 - coherenceScore

  return (
    <>
      <ActSeparator label="Confiabilidad" color="cyan" />

      <div>
        {/* Ancla — mismo 17% del gauge, ahora como SIGNIFICADO */}
        <motion.div {...fadeInDelay} className="text-center mb-10">
          <p className={cn(
            'text-7xl md:text-8xl font-extralight tracking-tight',
            coherenceScore < 20 ? 'text-violet-400' :
            coherenceScore < 50 ? 'text-amber-400' : 'text-cyan-400'
          )}>
            {coherenceScore}%
          </p>
          <p className="text-xs text-slate-500 mt-3 uppercase tracking-wider">
            de confiabilidad
          </p>
        </motion.div>

        {/* Narrativa — qué significa para el negocio */}
        <motion.div {...fadeIn} className="max-w-2xl mx-auto space-y-4">
          <p className="text-xl font-light text-slate-300 text-center leading-relaxed">
            Tus datos de evaluación predicen la realidad en un{' '}
            <span className="font-medium text-cyan-400">{coherenceScore}%</span>.
            El <span className="font-medium text-slate-200">{ruido}%</span> restante es ruido.
          </p>

          <p className="text-base font-light text-slate-400 leading-relaxed text-center">
            De <span className="font-medium text-slate-200">{totalEvaluados}</span> personas evaluadas,
            las decisiones de compensación, promoción y sucesión se construyen sobre esa base.
          </p>

          {/* "O" McKinsey — las dos hipótesis */}
          <p className="text-base font-light text-slate-400 leading-relaxed text-center">
            O tus mejores evaluados no están entregando resultados.
            O quienes sí entregan no están siendo reconocidos por el sistema.
          </p>

          <p className="text-base font-light text-slate-400 leading-relaxed text-center">
            En ambos casos, las decisiones se construyen sobre una base inconsistente.
          </p>

          {/* Coaching tip */}
          <div className="border-l-2 border-cyan-500/30 pl-4 mt-6">
            <p className="text-sm italic font-light text-slate-300 leading-relaxed">
              La confiabilidad no es un dato más. Es la señal de que el sistema está midiendo lo que el negocio necesita — o no.
            </p>
          </div>
        </motion.div>
      </div>
    </>
  )
})
