// ════════════════════════════════════════════════════════════════════════════
// ACTO 2 — LO QUE ENCONTRAMOS (condicional: hay anomalías)
// Ancla: % en cuadrantes de riesgo + top 2 hallazgos
// ════════════════════════════════════════════════════════════════════════════

import { memo } from 'react'
import { motion } from 'framer-motion'

import type { SubFinding } from '../GoalsCorrelation.types'
import { COMP_QUADRANT_MAP } from '../GoalsCorrelation.constants'
import { formatCurrency } from '../GoalsCorrelation.utils'
import ScientificBackingTooltip from '@/components/shared/ScientificBackingTooltip'
import { SCIENTIFIC_BACKING } from '@/config/narratives/ScientificBackingDictionary'
import { ActSeparator, SubtleLink, fadeIn, fadeInDelay } from './shared'
import { FindingBlock } from './FindingBlock'

interface ActoAnomaliasProps {
  topAlerts: SubFinding[]
  totalEvaluados: number
  totalFinancialRisk: number
  perceptionBiasCount: number
  hiddenPerformerCount: number
  doubleRiskCount: number
  allFindingsCount: number
  onOpenAnomalias: () => void
  onViewPersons: (finding: SubFinding) => void
  onViewCompensacion: (findingKey: string) => void
}

export default memo(function ActoAnomalias({
  topAlerts,
  totalEvaluados,
  totalFinancialRisk,
  perceptionBiasCount,
  hiddenPerformerCount,
  doubleRiskCount,
  allFindingsCount,
  onOpenAnomalias,
  onViewPersons,
  onViewCompensacion,
}: ActoAnomaliasProps) {
  if (topAlerts.length === 0) return null

  const totalRiesgo = perceptionBiasCount + hiddenPerformerCount + doubleRiskCount
  const pctRiesgo = totalEvaluados > 0
    ? Math.round((totalRiesgo / totalEvaluados) * 100)
    : 0

  return (
    <>
      <ActSeparator label="Anomalías" color="amber" />

      <div>
        {/* Ancla — % en cuadrantes de riesgo */}
        <motion.div {...fadeInDelay} className="text-center mb-10">
          <p className="text-7xl md:text-8xl font-extralight text-amber-400 tracking-tight">
            {pctRiesgo}%
          </p>
          <p className="text-xs text-slate-500 mt-3 uppercase tracking-wider">
            en cuadrantes de riesgo
          </p>
        </motion.div>

        <motion.div {...fadeIn} className="max-w-2xl mx-auto text-center mb-12">
          <p className="text-base font-light text-slate-400 leading-relaxed">
            De <span className="font-medium text-slate-200">{totalEvaluados}</span> evaluados,{' '}
            <span className="font-medium text-amber-400">{totalRiesgo}</span> muestran una contradicción
            entre sus metas y su evaluación de desempeño.
          </p>
          <p className="text-sm font-light text-slate-500 mt-2">
            El sistema identificó el tipo de contradicción. Así se pueden gestionar.
          </p>
          {totalFinancialRisk > 0 && (
            <p className="text-sm font-light text-slate-500 mt-3">
              Costo estimado de riesgo asociado:{' '}
              <span className="font-mono text-purple-400">
                {formatCurrency(totalFinancialRisk)}
              </span>
            </p>
          )}
          {totalFinancialRisk > 0 && SCIENTIFIC_BACKING.goals_financial_risk && (
            <div className="mt-3">
              <ScientificBackingTooltip
                backing={SCIENTIFIC_BACKING.goals_financial_risk}
                triggerLabel="¿Cómo se calcula este monto?"
                position="bottom"
              />
            </div>
          )}
        </motion.div>

        {/* Top 2 hallazgos más severos */}
        <div className="space-y-16 max-w-2xl mx-auto">
          {topAlerts.slice(0, 2).map((alert, idx) => (
            <FindingBlock
              key={alert.key}
              finding={alert}
              index={idx}
              onViewPersons={() => onViewPersons(alert)}
              onViewCompensacion={COMP_QUADRANT_MAP[alert.key] ? () => onViewCompensacion(alert.key) : undefined}
            />
          ))}
        </div>

        {/* CTA a vista completa de anomalías */}
        {allFindingsCount > 2 && (
          <motion.div {...fadeIn} className="max-w-2xl mx-auto mt-16">
            <div className="w-8 h-px bg-slate-800 mb-6" />
            <SubtleLink onClick={onOpenAnomalias}>
              Ver los {allFindingsCount} hallazgo{allFindingsCount !== 1 ? 's' : ''} detectado{allFindingsCount !== 1 ? 's' : ''}
            </SubtleLink>
          </motion.div>
        )}
      </div>
    </>
  )
})
