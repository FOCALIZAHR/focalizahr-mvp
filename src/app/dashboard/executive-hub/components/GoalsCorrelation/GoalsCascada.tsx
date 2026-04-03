'use client'

// ════════════════════════════════════════════════════════════════════════════
// GOALS CASCADA — "La Auditoría" (Cascada de la Verdad pattern)
// src/app/dashboard/executive-hub/components/GoalsCorrelation/GoalsCascada.tsx
// ════════════════════════════════════════════════════════════════════════════
// Dossier Ejecutivo — 3 actos condicionales + síntesis.
// Arquitectura: Flujo tipográfico libre, whileInView, space-y-24.
// Patrón clonado de PLTalentExecutiveBriefing.tsx.
// ════════════════════════════════════════════════════════════════════════════

import { memo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, BarChart3 } from 'lucide-react'
import { cn } from '@/lib/utils'

import type { GoalsCorrelationDataV2, SubFinding } from './GoalsCorrelation.types'
import { SUBFINDING_CARDS, SUBFINDING_TO_NARRATIVE } from './GoalsCorrelation.constants'
import { formatCurrency } from './GoalsCorrelation.utils'
import { getNarrative } from '@/config/narratives/GoalsNarrativeDictionary'
import ScientificBackingTooltip from '@/components/shared/ScientificBackingTooltip'
import { SCIENTIFIC_BACKING } from '@/config/narratives/ScientificBackingDictionary'
import { getCompensacionNarrative } from '@/config/narratives/CompensacionNarrativeDictionary'
import { GoalsSynthesisEngine } from '@/lib/services/GoalsSynthesisEngine'
import GoalsFindingModal from './GoalsFindingModal'
import GoalsStarsModal from './GoalsStarsModal'
import CompensacionModal from './CompensacionModal'
import type { CompensacionNarrativeEntry } from '@/config/narratives/CompensacionNarrativeDictionary'

// ════════════════════════════════════════════════════════════════════════════
// ANIMATION — whileInView (scroll-triggered, once)
// ════════════════════════════════════════════════════════════════════════════

const viewport = { once: true, margin: '-80px' }

const fadeIn = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport,
  transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const },
}

const fadeInDelay = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport,
  transition: { duration: 0.4, delay: 0.15, ease: [0.16, 1, 0.3, 1] as const },
}

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

interface GoalsCascadaProps {
  data: GoalsCorrelationDataV2
  onOpenScatter: () => void
  onOpenAnomalias: () => void
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ════════════════════════════════════════════════════════════════════════════

export default memo(function GoalsCascada({ data, onOpenScatter, onOpenAnomalias }: GoalsCascadaProps) {
  const [modalFinding, setModalFinding] = useState<SubFinding | null>(null)
  const [showRemainingFindings, setShowRemainingFindings] = useState(false)
  const [showStarsModal, setShowStarsModal] = useState(false)
  const [showCriticalModal, setShowCriticalModal] = useState(false)
  const [compModal, setCompModal] = useState<{ entry: CompensacionNarrativeEntry; headline: string; color: string } | null>(null)

  const { topAlerts, totals, segments, byGerencia, stars, criticalPositions } = data

  // Set of employee IDs occupying critical positions (for amplifier in stars modal)
  const criticalPositionIds = new Set(criticalPositions.positions.map(p => p.employee.id))

  // Helper: open compensacion modal for a finding
  const openCompModal = (findingKey: string) => {
    const quadrantKey = COMP_QUADRANT_MAP[findingKey]
    if (!quadrantKey) return
    const entry = getCompensacionNarrative(quadrantKey)
    if (!entry) return
    const narrativeKey = SUBFINDING_TO_NARRATIVE[findingKey]
    const dictNarr = narrativeKey ? getNarrative(narrativeKey) : null
    setCompModal({
      entry,
      headline: dictNarr?.headline ?? '',
      color: dictNarr?.teslaColor ?? '#22D3EE',
    })
  }
  const allFindings = segments.flatMap(s => s.subFindings)
  const remainingFindings = allFindings.filter(f => !topAlerts.some(a => a.key === f.key))

  // Org findings for Acto 3
  const orgSegment = segments.find(s => s.id === '3_ORGANIZACIONAL')
  const orgFindings = orgSegment?.subFindings ?? []

  // Pearson: worst gerencia (lowest r with enough data)
  const worstPearson = byGerencia
    .filter(g => g.pearsonRoleFitGoals !== null)
    .sort((a, b) => (a.pearsonRoleFitGoals ?? 1) - (b.pearsonRoleFitGoals ?? 1))[0] ?? null

  const bestPearson = byGerencia
    .filter(g => g.pearsonRoleFitGoals !== null && g.pearsonRoleFitGoals > 0.6)
    .sort((a, b) => (b.pearsonRoleFitGoals ?? 0) - (a.pearsonRoleFitGoals ?? 0))[0] ?? null

  return (
    <>
      <div className="space-y-24 pb-12">

        {/* ═══════════════════════════════════════════════════════════════
            ACTO 1 — EL PANORAMA
            Ancla: entregaron / no entregaron
        ═══════════════════════════════════════════════════════════════ */}
        <ActSeparator label="Resultados" color="cyan" />

        <div>
          {(() => {
            const pctDesalineamiento = totals.totalEvaluados > 0
              ? Math.round(((data.quadrantCounts.perceptionBias + data.quadrantCounts.hiddenPerformer) / totals.totalEvaluados) * 100)
              : 0
            return (
              <>
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
                    El <span className="font-medium text-amber-400">{pctDesalineamiento}%</span> de
                    tus evaluados muestra una contradicción entre su capacidad y sus resultados de negocio.
                  </p>
                  <p className="text-base font-light text-slate-400 leading-relaxed text-center">
                    O tus mejores evaluados no están entregando resultados.
                    O quienes sí entregan no están siendo reconocidos por el sistema.
                  </p>
                  <p className="text-base font-light text-slate-400 leading-relaxed text-center">
                    En ambos casos, las decisiones de compensación, promoción y sucesión
                    se construyen sobre una base inconsistente.
                  </p>
                </motion.div>
              </>
            )
          })()}
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            ACTO 2 — LO QUE ENCONTRAMOS (condicional: hay anomalías)
            Ancla: $$$ o conteo de anomalías
        ═══════════════════════════════════════════════════════════════ */}
        {topAlerts.length > 0 && (
          <>
            <ActSeparator label="Anomalías" color="amber" />

            <div>
              {/* Ancla — % en cuadrantes de riesgo (dato real, no estimación) */}
              {(() => {
                const totalRiesgo =
                  data.quadrantCounts.perceptionBias +
                  data.quadrantCounts.hiddenPerformer +
                  data.quadrantCounts.doubleRisk
                const pctRiesgo = totals.totalEvaluados > 0
                  ? Math.round((totalRiesgo / totals.totalEvaluados) * 100)
                  : 0
                return (
                  <>
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
                        De <span className="font-medium text-slate-200">{totals.totalEvaluados}</span> evaluados,{' '}
                        <span className="font-medium text-amber-400">{totalRiesgo}</span> muestran una contradicción
                        entre sus metas y su evaluación de desempeño.
                      </p>
                      <p className="text-sm font-light text-slate-500 mt-2">
                        El sistema identificó el tipo de contradicción. Así se pueden gestionar.
                      </p>
                      {totals.totalFinancialRisk > 0 && (
                        <p className="text-sm font-light text-slate-500 mt-3">
                          Costo estimado de riesgo asociado:{' '}
                          <span className="font-mono text-purple-400">
                            {formatCurrency(totals.totalFinancialRisk)}
                          </span>
                        </p>
                      )}
                      {totals.totalFinancialRisk > 0 && SCIENTIFIC_BACKING.goals_financial_risk && (
                        <div className="mt-3">
                          <ScientificBackingTooltip
                            backing={SCIENTIFIC_BACKING.goals_financial_risk}
                            triggerLabel="¿Cómo se calcula este monto?"
                            position="bottom"
                          />
                        </div>
                      )}
                    </motion.div>
                  </>
                )
              })()}

              {/* Top 2 hallazgos más severos */}
              <div className="space-y-16 max-w-2xl mx-auto">
                {topAlerts.slice(0, 2).map((alert, idx) => (
                  <FindingBlock
                    key={alert.key}
                    finding={alert}
                    index={idx}
                    onViewPersons={() => setModalFinding(alert)}
                    onViewCompensacion={COMP_QUADRANT_MAP[alert.key] ? () => openCompModal(alert.key) : undefined}
                  />
                ))}
              </div>

              {/* CTA a vista completa de anomalías */}
              {allFindings.length > 2 && (
                <motion.div {...fadeIn} className="max-w-2xl mx-auto mt-12">
                  <SubtleLink onClick={onOpenAnomalias}>
                    Ver análisis completo · {allFindings.length} hallazgo{allFindings.length !== 1 ? 's' : ''}
                  </SubtleLink>
                </motion.div>
              )}
            </div>
          </>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            ACTO ESTRELLAS (condicional: hay stars en 9-Box)
            Ancla: % de estrellas que cumplen metas
        ═══════════════════════════════════════════════════════════════ */}
        {stars.total > 0 && (
          <>
            <ActSeparator label="Estrellas" color="amber" />

            <div>
              {/* Frase puente con Acto 2 */}
              <motion.div {...fadeIn} className="max-w-2xl mx-auto mb-12">
                <p className="text-base font-light text-slate-500 text-center leading-relaxed">
                  Las contradicciones anteriores también alcanzan a quienes la organización considera su mejor talento.
                </p>
              </motion.div>

              <motion.div {...fadeInDelay} className="text-center mb-10">
                <p className="text-7xl md:text-8xl font-extralight text-amber-400 tracking-tight">
                  {stars.percentage}%
                </p>
                <p className="text-xs text-slate-500 mt-3 uppercase tracking-wider">
                  de tus estrellas cumplen metas
                </p>
              </motion.div>

              <motion.div {...fadeIn} className="max-w-2xl mx-auto space-y-6">
                {/* Narrativa condicional */}
                {stars.percentage >= 80 ? (
                  <p className="text-base font-light text-slate-400 leading-relaxed">
                    <span className="font-medium text-cyan-400">{stars.withHighGoals}</span> de{' '}
                    <span className="font-medium text-slate-200">{stars.total}</span> estrellas del 9-Box
                    entregan resultados sobre el 80%. La clasificación está respaldada por ejecución —
                    estas personas son lo que el sistema dice que son.
                  </p>
                ) : stars.percentage >= 60 ? (
                  <p className="text-base font-light text-slate-400 leading-relaxed">
                    <span className="font-medium text-amber-400">{stars.total - stars.withHighGoals}</span> de{' '}
                    <span className="font-medium text-slate-200">{stars.total}</span> estrellas
                    no respaldan su clasificación con resultados.
                    El 9-Box las posiciona arriba — las metas no lo confirman.
                    Antes de tomar decisiones de promoción o compensación, valida con evidencia.
                  </p>
                ) : (
                  <p className="text-base font-light text-slate-400 leading-relaxed">
                    Solo <span className="font-medium text-amber-400">{stars.withHighGoals}</span> de{' '}
                    <span className="font-medium text-slate-200">{stars.total}</span> estrellas
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

                <SubtleLink onClick={() => setShowStarsModal(true)}>
                  Ver {stars.total} estrella{stars.total !== 1 ? 's' : ''} en detalle
                </SubtleLink>
              </motion.div>
            </div>
          </>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            ACTO CARGOS CRÍTICOS (condicional: hay incumbentes evaluados)
            Ancla: % de cargos críticos que cumplen metas
        ═══════════════════════════════════════════════════════════════ */}
        {criticalPositions.total > 0 && (
          <>
            <ActSeparator label="Cargos Críticos" color="purple" />

            <div>
              <motion.div {...fadeInDelay} className="text-center mb-10">
                <p className="text-7xl md:text-8xl font-extralight text-purple-400 tracking-tight">
                  {criticalPositions.percentage}%
                </p>
                <p className="text-xs text-slate-500 mt-3 uppercase tracking-wider">
                  de tus cargos críticos cumplen metas
                </p>
              </motion.div>

              <motion.div {...fadeIn} className="max-w-2xl mx-auto space-y-6">
                {/* Narrativa condicional */}
                {criticalPositions.percentage >= 80 ? (
                  <p className="text-base font-light text-slate-400 leading-relaxed">
                    <span className="font-medium text-cyan-400">{criticalPositions.withHighGoals}</span> de{' '}
                    <span className="font-medium text-slate-200">{criticalPositions.total}</span> personas
                    en cargos críticos entregan resultados. La continuidad operacional está respaldada por ejecución.
                  </p>
                ) : criticalPositions.percentage >= 60 ? (
                  <p className="text-base font-light text-slate-400 leading-relaxed">
                    <span className="font-medium text-amber-400">{criticalPositions.total - criticalPositions.withHighGoals}</span> persona{(criticalPositions.total - criticalPositions.withHighGoals) !== 1 ? 's' : ''} en
                    cargos críticos no cumple{(criticalPositions.total - criticalPositions.withHighGoals) !== 1 ? 'n' : ''} metas sobre el 80%.
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

                <SubtleLink onClick={() => setShowCriticalModal(true)}>
                  Ver {criticalPositions.total} cargo{criticalPositions.total !== 1 ? 's' : ''} crítico{criticalPositions.total !== 1 ? 's' : ''}
                </SubtleLink>
              </motion.div>
            </div>
          </>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            ACTO 3 — DÓNDE ACTUAR (condicional: hay datos organizacionales)
            Vista por gerencia: Pearson + sesgo + calibración
        ═══════════════════════════════════════════════════════════════ */}
        {byGerencia.length > 0 && (
          <>
            <ActSeparator label="Organización" color="purple" />

            <div>
              {/* Narrativa Pearson — sin número r, solo conclusión */}
              <motion.div {...fadeIn} className="max-w-2xl mx-auto space-y-6">

                {worstPearson && worstPearson.pearsonRoleFitGoals !== null && worstPearson.pearsonRoleFitGoals < 0.3 && (
                  <div>
                    <p className="text-xs uppercase tracking-widest text-amber-400/60 mb-3">Framework desalineado</p>
                    <p className="text-base font-light text-slate-400 leading-relaxed">
                      En <span className="font-medium text-slate-200">{worstPearson.gerenciaName}</span>,
                      las competencias que se exigen no predicen los resultados que se entregan.
                      El framework de competencias de esta gerencia necesita revisión —
                      está midiendo cosas que no se relacionan con la ejecución real.
                    </p>
                  </div>
                )}

                {bestPearson && bestPearson.pearsonRoleFitGoals !== null && (
                  <div>
                    <p className="text-xs uppercase tracking-widest text-cyan-400/60 mb-3">Framework calibrado</p>
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
                    onViewPersons={() => setModalFinding(finding)}
                    isOrgLevel
                  />
                ))}

                {/* Resumen gerencias — narrativo, no tabla */}
                {(() => {
                  const confiables = byGerencia.filter(g => g.confidenceLevel === 'green')
                  const enRevision = byGerencia.filter(g => g.confidenceLevel !== 'green')
                  const totalGerencias = byGerencia.length

                  if (totalGerencias === 0) return null

                  return (
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
                  )
                })()}
              </motion.div>
            </div>
          </>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            SÍNTESIS — Cierre + acceso a scatter
        ═══════════════════════════════════════════════════════════════ */}
        <ActSeparator label="Síntesis" color="cyan" />

        {(() => {
          const synthesis = GoalsSynthesisEngine.generate(data)
          return (
            <motion.div {...fadeIn} className="max-w-2xl mx-auto space-y-6">

              {/* Classification */}
              <p className="text-base font-light text-slate-300 text-center leading-relaxed">
                {synthesis.classification}
              </p>

              {/* Implication */}
              <p className="text-base italic font-light text-slate-300 leading-relaxed text-center">
                {synthesis.implication}
              </p>

              {/* Path */}
              <p className="text-base font-light text-slate-400 leading-relaxed text-center">
                {synthesis.path}
              </p>

              {/* Accountability */}
              <p className="text-sm italic font-light text-slate-500 text-center">
                {synthesis.accountability}
              </p>

              {/* Scatter link */}
              <div className="text-center pt-4">
                <button
                  onClick={onOpenScatter}
                  className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-400 transition-colors"
                >
                  <BarChart3 className="w-4 h-4" />
                  Explorar datos en scatter
                </button>
              </div>
            </motion.div>
          )
        })()}

      </div>

      {/* ═══ MODAL — Drill-down a personas ═══ */}
      {modalFinding && (
        <GoalsFindingModal
          finding={modalFinding}
          onClose={() => setModalFinding(null)}
        />
      )}

      {/* ═══ MODAL — Estrellas ═══ */}
      {showStarsModal && (
        <GoalsStarsModal
          title="Estrellas del 9-Box"
          subtitle={`${stars.total} estrella${stars.total !== 1 ? 's' : ''} · ${stars.percentage}% cumplen metas`}
          type="stars"
          percentage={stars.percentage}
          teslaColor="#F59E0B"
          persons={stars.employees.map(e => ({ employee: e }))}
          criticalPositionIds={criticalPositionIds}
          onClose={() => setShowStarsModal(false)}
        />
      )}

      {/* ═══ MODAL — Compensaciones ═══ */}
      {compModal && (
        <CompensacionModal
          entry={compModal.entry}
          findingHeadline={compModal.headline}
          teslaColor={compModal.color}
          onClose={() => setCompModal(null)}
        />
      )}

      {/* ═══ MODAL — Cargos Críticos ═══ */}
      {showCriticalModal && (
        <GoalsStarsModal
          title="Cargos Críticos"
          subtitle={`${criticalPositions.total} posicion${criticalPositions.total !== 1 ? 'es' : ''} · ${criticalPositions.percentage}% cumplen metas`}
          type="critical"
          percentage={criticalPositions.percentage}
          teslaColor="#A78BFA"
          persons={criticalPositions.positions.map(p => ({
            employee: p.employee,
            positionTitle: p.positionTitle,
            benchStrength: p.benchStrength,
          }))}
          onClose={() => setShowCriticalModal(false)}
        />
      )}
    </>
  )
})

// ════════════════════════════════════════════════════════════════════════════
// FINDING BLOCK — Hallazgo narrativo completo
// ════════════════════════════════════════════════════════════════════════════

const COMP_QUADRANT_MAP: Record<string, string> = {
  '1D_sostenibilidad': 'HIDDEN_PERFORMER',
  '2B_bonosInjustificados': 'PERCEPTION_BIAS',
  '2A_noPuedeVsNoQuiere': 'DOUBLE_RISK',
}

const FindingBlock = memo(function FindingBlock({
  finding,
  index,
  onViewPersons,
  onViewCompensacion,
  isOrgLevel = false,
}: {
  finding: SubFinding
  index: number
  onViewPersons: () => void
  onViewCompensacion?: () => void
  isOrgLevel?: boolean
}) {
  const cardConfig = SUBFINDING_CARDS[finding.key]
  const narrativeKey = SUBFINDING_TO_NARRATIVE[finding.key]
  const dictNarrative = narrativeKey ? getNarrative(narrativeKey) : null

  if (!cardConfig || !dictNarrative) return null

  const gerencias = isOrgLevel
    ? (finding.meta?.gerencias as { name: string; employeeCount?: number }[]) ?? []
    : []

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.4, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Tesla line accent */}
      <div
        className="w-12 h-[2px] mb-6"
        style={{
          background: dictNarrative.teslaColor,
          boxShadow: `0 0 12px ${dictNarrative.teslaColor}40`,
        }}
      />

      {/* Headline */}
      <p className="text-xl font-light text-slate-200 mb-4">
        {dictNarrative.headline}
      </p>

      {/* Description */}
      <p className="text-base font-light text-slate-400 leading-relaxed mb-4">
        {dictNarrative.description}
      </p>

      {/* Count + financial */}
      <div className="flex items-center gap-4 mb-4">
        <span className={cn('text-sm font-mono', cardConfig.textColor)}>
          {finding.count} {isOrgLevel ? 'gerencia' : 'persona'}{finding.count !== 1 ? 's' : ''}
        </span>
        {finding.financialImpact > 0 && (
          <>
            <span className="text-slate-700">·</span>
            <span className={cn('text-sm font-mono font-medium', cardConfig.textColor)}>
              {formatCurrency(finding.financialImpact)}
            </span>
          </>
        )}
      </div>

      {/* Org-level: gerencias affected */}
      {gerencias.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {gerencias.map(g => (
            <span
              key={g.name}
              className={cn(
                'text-[9px] px-2 py-0.5 rounded-full border',
                cardConfig.borderColor, cardConfig.textColor,
                'bg-slate-900/50'
              )}
            >
              {g.name}
            </span>
          ))}
        </div>
      )}

      {/* Coaching tip as blockquote */}
      <div className="border-l-2 border-cyan-500/30 pl-4 mb-4">
        <p className="text-sm italic font-light text-slate-300 leading-relaxed">
          {dictNarrative.coachingTip}
        </p>
      </div>

      {/* Drill-down link */}
      <SubtleLink onClick={onViewPersons}>
        Ver {isOrgLevel ? 'detalle' : `${finding.employees.length} persona${finding.employees.length !== 1 ? 's' : ''}`}
      </SubtleLink>

      {/* Compensaciones — abre modal */}
      {onViewCompensacion && (
        <div className="mt-2">
          <SubtleLink onClick={onViewCompensacion}>
            Ver perspectiva de compensaciones
          </SubtleLink>
        </div>
      )}
    </motion.div>
  )
})

// ════════════════════════════════════════════════════════════════════════════
// ACT SEPARATOR — Línea divisoria entre actos (cloned from PLTalent)
// ════════════════════════════════════════════════════════════════════════════

function ActSeparator({ label, color }: { label: string; color: 'amber' | 'purple' | 'cyan' | 'red' }) {
  const colors = {
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    cyan: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
    red: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  }
  const lineColor = {
    amber: 'via-amber-700/30',
    purple: 'via-purple-700/30',
    cyan: 'via-cyan-700/30',
    red: 'via-red-700/30',
  }
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3 }}
      className="flex items-center justify-center gap-4"
    >
      <div className={cn('flex-1 h-px bg-gradient-to-r from-transparent to-transparent', lineColor[color])} />
      <span className={cn('px-4 py-1.5 text-[10px] font-semibold uppercase tracking-widest border rounded-full', colors[color])}>
        {label}
      </span>
      <div className={cn('flex-1 h-px bg-gradient-to-r from-transparent to-transparent', lineColor[color])} />
    </motion.div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// SUBTLE LINK — Reutilizable con flecha animada (cloned from PLTalent)
// ════════════════════════════════════════════════════════════════════════════

const SubtleLink = memo(function SubtleLink({
  children,
  onClick,
}: {
  children: React.ReactNode
  onClick?: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="group inline-flex items-center gap-1.5 text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
    >
      {children}
      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
    </button>
  )
})
