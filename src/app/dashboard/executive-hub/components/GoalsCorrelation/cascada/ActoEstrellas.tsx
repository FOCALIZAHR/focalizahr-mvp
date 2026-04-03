// ════════════════════════════════════════════════════════════════════════════
// ACTO ESTRELLAS (condicional: hay stars en 9-Box)
// Ancla: % de estrellas que cumplen metas
// ════════════════════════════════════════════════════════════════════════════

import { memo } from 'react'
import { motion } from 'framer-motion'
import { ActSeparator, SubtleLink, fadeIn, fadeInDelay } from './shared'

interface ActoEstrellasProps {
  total: number
  withHighGoals: number
  percentage: number
  onViewDetail: () => void
}

export default memo(function ActoEstrellas({
  total,
  withHighGoals,
  percentage,
  onViewDetail,
}: ActoEstrellasProps) {
  if (total === 0) return null

  return (
    <>
      <ActSeparator label="Estrellas" color="amber" />

      <div>
        {/* Frase puente con Acto 2 */}
        <motion.div {...fadeIn} className="max-w-2xl mx-auto mb-12">
          <p className="text-base italic font-light text-slate-400 text-center leading-relaxed">
            Las contradicciones anteriores también alcanzan a quienes la organización considera su mejor talento.
          </p>
        </motion.div>

        <motion.div {...fadeInDelay} className="text-center mb-10">
          <p className="text-7xl md:text-8xl font-extralight text-amber-400 tracking-tight">
            {percentage}%
          </p>
          <p className="text-xs text-slate-500 mt-3 uppercase tracking-wider">
            de tus estrellas cumplen metas
          </p>
        </motion.div>

        <motion.div {...fadeIn} className="max-w-2xl mx-auto space-y-6">
          {/* Narrativa condicional */}
          {percentage >= 80 ? (
            <p className="text-base font-light text-slate-400 leading-relaxed">
              <span className="font-medium text-cyan-400">{withHighGoals}</span> de{' '}
              <span className="font-medium text-slate-200">{total}</span> estrellas
              entregan resultados sobre el 80%. La clasificación está respaldada por ejecución —
              estas personas son lo que el sistema dice que son.
            </p>
          ) : percentage >= 60 ? (
            <p className="text-base font-light text-slate-400 leading-relaxed">
              <span className="font-medium text-amber-400">{total - withHighGoals}</span> de{' '}
              <span className="font-medium text-slate-200">{total}</span> estrellas
              no respaldan su clasificación con resultados.
              El 9-Box las posiciona arriba — las metas no lo confirman.
              Antes de tomar decisiones de promoción o compensación, valida con evidencia.
            </p>
          ) : (
            <p className="text-base font-light text-slate-400 leading-relaxed">
              Solo <span className="font-medium text-amber-400">{withHighGoals}</span> de{' '}
              <span className="font-medium text-slate-200">{total}</span> estrellas
              cumplen metas sobre el 80%. La mayoría de tus &ldquo;mejores talentos&rdquo; no
              entrega resultados que respalden esa clasificación.
              El 9-Box está midiendo percepción, no ejecución.
            </p>
          )}

          {/* Blockquote coaching */}
          <div className="border-l-2 border-amber-500/30 pl-4">
            <p className="text-sm italic font-light text-slate-300 leading-relaxed">
              Las estrellas definen tus decisiones de sucesión, compensación y retención.
              Si la clasificación no coincide con los resultados, esas decisiones se construyen sobre arena.
            </p>
          </div>

          <SubtleLink onClick={onViewDetail}>
            Ver {total} estrella{total !== 1 ? 's' : ''} en detalle
          </SubtleLink>
        </motion.div>
      </div>
    </>
  )
})
