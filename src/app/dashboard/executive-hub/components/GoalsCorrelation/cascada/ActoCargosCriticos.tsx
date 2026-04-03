// ════════════════════════════════════════════════════════════════════════════
// ACTO CARGOS CRÍTICOS (condicional: hay incumbentes evaluados)
// Ancla: % de cargos críticos que cumplen metas
// ════════════════════════════════════════════════════════════════════════════

import { memo } from 'react'
import { motion } from 'framer-motion'
import { ActSeparator, SubtleLink, fadeIn, fadeInDelay } from './shared'

interface ActoCargosCriticosProps {
  total: number
  withHighGoals: number
  percentage: number
  onViewDetail: () => void
}

export default memo(function ActoCargosCriticos({
  total,
  withHighGoals,
  percentage,
  onViewDetail,
}: ActoCargosCriticosProps) {
  if (total === 0) return null

  return (
    <>
      <ActSeparator label="Cargos Críticos" color="purple" />

      <div>
        <motion.div {...fadeInDelay} className="text-center mb-10">
          <p className="text-7xl md:text-8xl font-extralight text-purple-400 tracking-tight">
            {percentage}%
          </p>
          <p className="text-xs text-slate-500 mt-3 uppercase tracking-wider">
            de tus cargos críticos cumplen metas
          </p>
        </motion.div>

        <motion.div {...fadeIn} className="max-w-2xl mx-auto space-y-6">
          {/* Narrativa condicional */}
          {percentage >= 80 ? (
            <p className="text-base font-light text-slate-400 leading-relaxed">
              <span className="font-medium text-cyan-400">{withHighGoals}</span> de{' '}
              <span className="font-medium text-slate-200">{total}</span> personas
              en cargos críticos entregan resultados. La continuidad operacional está respaldada por ejecución.
            </p>
          ) : percentage >= 60 ? (
            <p className="text-base font-light text-slate-400 leading-relaxed">
              <span className="font-medium text-amber-400">{total - withHighGoals}</span> persona{(total - withHighGoals) !== 1 ? 's' : ''} en
              cargos críticos no cumple{(total - withHighGoals) !== 1 ? 'n' : ''} metas sobre el 80%.
              Si alguno de estos cargos queda vacante, el plan de sucesión se activa sobre alguien que no está entregando.
            </p>
          ) : (
            <p className="text-base font-light text-slate-400 leading-relaxed">
              La mayoría de los cargos críticos no entrega resultados sobre el 80%.
              La continuidad operacional depende de personas que no están cumpliendo.
              Cada día sin plan de acción incrementa la exposición.
            </p>
          )}

          {/* Blockquote coaching */}
          <div className="border-l-2 border-purple-500/30 pl-4">
            <p className="text-sm italic font-light text-slate-300 leading-relaxed">
              Los cargos críticos son los que no pueden quedar vacantes sin consecuencias inmediatas.
              Si quien los ocupa no entrega resultados, la pregunta no es si tiene sucesor — es si necesita uno ahora.
            </p>
          </div>

          <SubtleLink onClick={onViewDetail}>
            Ver {total} cargo{total !== 1 ? 's' : ''} crítico{total !== 1 ? 's' : ''}
          </SubtleLink>
        </motion.div>
      </div>
    </>
  )
})
