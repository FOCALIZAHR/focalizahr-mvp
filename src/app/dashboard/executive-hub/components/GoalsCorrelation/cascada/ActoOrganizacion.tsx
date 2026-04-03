// ════════════════════════════════════════════════════════════════════════════
// ACTO 3 — DÓNDE ACTUAR (condicional: hay datos organizacionales)
// Vista por gerencia: Pearson + sesgo + calibración
// ════════════════════════════════════════════════════════════════════════════

import { memo } from 'react'
import { motion } from 'framer-motion'

import type { SubFinding } from '../GoalsCorrelation.types'
import { ActSeparator, fadeIn } from './shared'
import { FindingBlock } from './FindingBlock'

interface GerenciaData {
  gerenciaName: string
  pearsonRoleFitGoals: number | null
  confidenceLevel: string
}

interface ActoOrganizacionProps {
  byGerencia: GerenciaData[]
  orgFindings: SubFinding[]
  onViewPersons: (finding: SubFinding) => void
}

export default memo(function ActoOrganizacion({
  byGerencia,
  orgFindings,
  onViewPersons,
}: ActoOrganizacionProps) {
  if (byGerencia.length === 0) return null

  const worstPearson = byGerencia
    .filter(g => g.pearsonRoleFitGoals !== null)
    .sort((a, b) => (a.pearsonRoleFitGoals ?? 1) - (b.pearsonRoleFitGoals ?? 1))[0] ?? null

  const bestPearson = byGerencia
    .filter(g => g.pearsonRoleFitGoals !== null && g.pearsonRoleFitGoals > 0.6)
    .sort((a, b) => (b.pearsonRoleFitGoals ?? 0) - (a.pearsonRoleFitGoals ?? 0))[0] ?? null

  const confiables = byGerencia.filter(g => g.confidenceLevel === 'green')
  const enRevision = byGerencia.filter(g => g.confidenceLevel !== 'green')
  const totalGerencias = byGerencia.length

  return (
    <>
      <ActSeparator label="Organización" color="purple" />

      <div>
        <motion.div {...fadeIn} className="max-w-2xl mx-auto space-y-6">

          {worstPearson && worstPearson.pearsonRoleFitGoals !== null && worstPearson.pearsonRoleFitGoals < 0.3 && (
            <div>
              <p className="text-xs uppercase tracking-widest text-slate-500 mb-3">Señal de desalineamiento</p>
              <p className="text-base font-light text-slate-400 leading-relaxed">
                En <span className="font-medium text-slate-200">{worstPearson.gerenciaName}</span>,
                las competencias que se exigen no predicen los resultados que se entregan.
                Lo que se mide como competencia en esta gerencia no se relaciona con la ejecución real.
              </p>
            </div>
          )}

          {bestPearson && bestPearson.pearsonRoleFitGoals !== null && (
            <div>
              <p className="text-xs uppercase tracking-widest text-slate-500 mb-3">Alineamiento confirmado</p>
              <p className="text-base font-light text-slate-400 leading-relaxed">
                En <span className="font-medium text-slate-200">{bestPearson.gerenciaName}</span>,
                las competencias que se exigen predicen resultados.
                Lo que se mide es lo que se entrega — base confiable para decisiones de compensación.
              </p>
            </div>
          )}

          {/* Org findings narrativos */}
          {orgFindings.map((finding, idx) => (
            <FindingBlock
              key={finding.key}
              finding={finding}
              index={idx}
              onViewPersons={() => onViewPersons(finding)}
              isOrgLevel
            />
          ))}

          {/* Resumen gerencias — narrativo, no tabla */}
          {totalGerencias > 0 && (
            <div className="mt-8 space-y-4">
              {confiables.length > 0 && (
                <p className="text-base font-light text-slate-400 leading-relaxed">
                  De {totalGerencias} gerencia{totalGerencias !== 1 ? 's' : ''} evaluada{totalGerencias !== 1 ? 's' : ''},{' '}
                  <span className="font-medium text-cyan-400">{confiables.length}</span>{' '}
                  muestra{confiables.length === 1 ? '' : 'n'} alineación entre evaluación y resultados
                  {confiables.length <= 3 && (
                    <>: {confiables.map(g => g.gerenciaName).join(', ')}.</>
                  )}
                  {confiables.length > 3 && '.'}
                </p>
              )}

              {enRevision.length > 0 && (
                <p className="text-base font-light text-slate-400 leading-relaxed">
                  <span className="font-medium text-amber-400">{enRevision.length}</span>{' '}
                  gerencia{enRevision.length !== 1 ? 's' : ''} requiere{enRevision.length === 1 ? '' : 'n'} revisión
                  {enRevision.length <= 3 && (
                    <>: {enRevision.map(g => g.gerenciaName).join(', ')}.</>
                  )}
                  {enRevision.length > 3 && '.'}
                  {' '}La evaluación de desempeño en {enRevision.length === 1 ? 'esa unidad' : 'esas unidades'} no
                  coincide con los resultados que entrega{enRevision.length === 1 ? '' : 'n'}.
                </p>
              )}

              {confiables.length === totalGerencias && (
                <div className="border-l-2 border-cyan-500/30 pl-4">
                  <p className="text-sm italic font-light text-slate-300 leading-relaxed">
                    Las evaluaciones están alineadas con los resultados a nivel de gerencia.
                    Base confiable para decisiones de compensación.
                  </p>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </>
  )
})
