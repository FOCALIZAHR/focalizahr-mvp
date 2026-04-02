'use client'

// ════════════════════════════════════════════════════════════════════════════
// GOALS CORRELATION — Tab Organizacional V2 (Gerencias + Pearson + Calibración)
// src/app/dashboard/executive-hub/components/GoalsCorrelation/tabs/GerenciasTab.tsx
// ════════════════════════════════════════════════════════════════════════════
// Cards por gerencia: narrativa, Pearson RoleFit×Metas (3A), calibración (3D)
// ════════════════════════════════════════════════════════════════════════════

import { memo, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { GerenciaGoalsStatsV2, SubFinding } from '../GoalsCorrelation.types'
import { SUBFINDING_CARDS, SUBFINDING_TO_NARRATIVE } from '../GoalsCorrelation.constants'
import { buildGerenciaNarrative, getNarrative } from '@/config/narratives/GoalsNarrativeDictionary'

interface GerenciasTabProps {
  byGerencia: GerenciaGoalsStatsV2[]
  orgFindings?: SubFinding[]
}

const CONFIDENCE_VISUAL = {
  green: {
    teslaColor: '#10B981',
    dot: 'bg-emerald-400',
    label: 'Confiable',
    text: 'text-emerald-400',
    border: 'border-emerald-500/20',
  },
  amber: {
    teslaColor: '#F59E0B',
    dot: 'bg-amber-400',
    label: 'Revisar',
    text: 'text-amber-400',
    border: 'border-amber-500/20',
  },
  red: {
    teslaColor: '#EF4444',
    dot: 'bg-red-400',
    label: 'Alerta',
    text: 'text-red-400',
    border: 'border-red-500/20',
  },
}

function getPearsonLabel(r: number | null): { label: string; color: string } | null {
  if (r === null) return null
  if (r > 0.7) return { label: `r=${r.toFixed(2)} — Competencias predicen`, color: 'text-emerald-400' }
  if (r > 0.4) return { label: `r=${r.toFixed(2)} — Correlación moderada`, color: 'text-cyan-400' }
  if (r > 0.0) return { label: `r=${r.toFixed(2)} — Correlación débil`, color: 'text-amber-400' }
  return { label: `r=${r.toFixed(2)} — Sin correlación`, color: 'text-red-400' }
}

export default memo(function GerenciasTab({ byGerencia, orgFindings = [] }: GerenciasTabProps) {
  const [expanded, setExpanded] = useState<string | null>(null)

  // Worst gerencia for hero narrative
  const worstGerencia = useMemo(() => {
    const withDisconnection = byGerencia.filter(g => g.disconnectionRate > 0 && g.coverage > 30)
    return withDisconnection.length > 0 ? withDisconnection[0] : null
  }, [byGerencia])

  if (byGerencia.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-500">
        <p className="text-sm font-light">Sin datos por gerencia.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">

      {/* Hero — worst gerencia narrative */}
      {worstGerencia && (
        <div className="fhr-card relative overflow-hidden p-5">
          <div
            className="absolute top-0 left-0 right-0 h-[2px] z-10"
            style={{
              background: `linear-gradient(90deg, transparent, ${CONFIDENCE_VISUAL[worstGerencia.confidenceLevel].teslaColor}, transparent)`,
              boxShadow: `0 0 15px ${CONFIDENCE_VISUAL[worstGerencia.confidenceLevel].teslaColor}`,
            }}
          />
          <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-2">
            Mayor desconexión detectada
          </p>
          <p className="text-sm font-light text-slate-300 leading-relaxed">
            <span className="font-medium text-slate-200">{worstGerencia.gerenciaName}</span>
            {' '}presenta {worstGerencia.disconnectionRate}% de desconexión entre evaluación 360° y cumplimiento de metas.
            {worstGerencia.evaluatorClassification && (
              <> Evaluador clasificado <span className={cn('font-medium', CONFIDENCE_VISUAL[worstGerencia.confidenceLevel].text)}>{worstGerencia.evaluatorClassification}</span>.</>
            )}
          </p>
        </div>
      )}

      {/* ═══ Organizational Findings (3B, 3A, 3D) ═══ */}
      {orgFindings.length > 0 && (
        <div className="space-y-2.5">
          <p className="text-[10px] uppercase tracking-widest text-slate-600 px-1">
            Alertas sistémicas
          </p>
          {orgFindings.map((finding, idx) => {
            const cardConfig = SUBFINDING_CARDS[finding.key]
            if (!cardConfig) return null
            const narrativeKey = SUBFINDING_TO_NARRATIVE[finding.key]
            const dictNarrative = narrativeKey ? getNarrative(narrativeKey) : null
            const gerencias = (finding.meta?.gerencias as { name: string; [k: string]: unknown }[]) ?? []
            const totalAffected = (finding.meta?.totalAffectedEmployees as number) ?? finding.employees.length

            return (
              <motion.div
                key={finding.key}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15, delay: idx * 0.04 }}
                className={cn(
                  'rounded-xl border overflow-hidden relative',
                  'bg-slate-800/30 backdrop-blur-xl',
                  cardConfig.borderColor
                )}
              >
                {dictNarrative && (
                  <div
                    className="absolute top-0 left-0 right-0 h-[2px] z-10"
                    style={{
                      background: `linear-gradient(90deg, transparent, ${dictNarrative.teslaColor}, transparent)`,
                      boxShadow: `0 0 12px ${dictNarrative.teslaColor}`,
                    }}
                  />
                )}
                <div className="p-4 space-y-2">
                  <div className="flex items-center gap-2.5">
                    <div className={cn('w-2 h-2 rounded-full flex-shrink-0', cardConfig.dotColor)} />
                    <p className="text-sm font-light text-slate-200">
                      {dictNarrative?.headline ?? cardConfig.title}
                    </p>
                    <span className={cn('text-xs font-mono font-medium', cardConfig.textColor)}>
                      {finding.count} gerencia{finding.count !== 1 ? 's' : ''}
                    </span>
                  </div>

                  <p className="text-[11px] font-light text-slate-400 leading-relaxed pl-[18px]">
                    {dictNarrative?.description ?? ''}
                  </p>

                  {/* Gerencias affected */}
                  {gerencias.length > 0 && (
                    <div className="pl-[18px] flex flex-wrap gap-1.5">
                      {gerencias.map((g) => (
                        <span
                          key={g.name as string}
                          className={cn(
                            'text-[9px] px-2 py-0.5 rounded-full border',
                            cardConfig.borderColor, cardConfig.textColor,
                            'bg-slate-900/50'
                          )}
                        >
                          {g.name as string} ({(g as { employeeCount?: number }).employeeCount ?? '?'} pers.)
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Coaching tip */}
                  {dictNarrative?.coachingTip && (
                    <div className="flex gap-2 items-start rounded-lg bg-slate-900/50 px-3 py-2 border border-slate-800/30 ml-[18px]">
                      <span className="text-[10px] text-cyan-500 font-medium flex-shrink-0 mt-px">TIP</span>
                      <p className="text-[10px] font-light text-slate-500 leading-relaxed">
                        {dictNarrative.coachingTip}
                      </p>
                    </div>
                  )}

                  <p className="text-[9px] text-slate-600 pl-[18px]">
                    {totalAffected} personas afectadas en total
                  </p>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Gerencia cards — detail by gerencia */}
      <div className="space-y-3">
        {byGerencia.map((ger, idx) => {
          const conf = CONFIDENCE_VISUAL[ger.confidenceLevel]
          const isExpanded = expanded === ger.gerenciaName

          // V2: compute calibration cross counts for narrative
          const calUpLowGoals = ger.calibrationCross && ger.calibrationCross.avgGoalsAdjustedUp !== null && ger.calibrationCross.avgGoalsAdjustedUp < 40
            ? ger.calibrationCross.adjustedUpCount : 0
          const calDownHighGoals = ger.calibrationCross && ger.calibrationCross.avgGoalsAdjustedDown !== null && ger.calibrationCross.avgGoalsAdjustedDown > 80
            ? ger.calibrationCross.adjustedDownCount : 0

          const narrative = buildGerenciaNarrative({
            gerenciaName: ger.gerenciaName,
            disconnectionRate: ger.disconnectionRate,
            coverage: ger.coverage,
            avgProgress: ger.avgProgress,
            avgScore360: ger.avgScore360,
            evaluatorClassification: ger.evaluatorClassification,
            confidenceLevel: ger.confidenceLevel,
            employeeCount: ger.employeeCount,
            pearsonR: ger.pearsonRoleFitGoals,
            calibrationUpWithLowGoals: calUpLowGoals,
            calibrationDownWithHighGoals: calDownHighGoals,
          })

          const pearsonInfo = getPearsonLabel(ger.pearsonRoleFitGoals)

          return (
            <motion.div
              key={ger.gerenciaName}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15, delay: idx * 0.04 }}
              className={cn(
                'rounded-xl border overflow-hidden relative',
                'bg-slate-800/30 backdrop-blur-xl',
                conf.border
              )}
            >
              {/* Tesla line — confidence color */}
              <div
                className="absolute top-0 left-0 right-0 h-[2px] z-10"
                style={{
                  background: `linear-gradient(90deg, transparent, ${conf.teslaColor}, transparent)`,
                  boxShadow: `0 0 12px ${conf.teslaColor}`,
                }}
              />

              {/* Header */}
              <button
                onClick={() => setExpanded(isExpanded ? null : ger.gerenciaName)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-800/40 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className={cn('w-2 h-2 rounded-full flex-shrink-0', conf.dot)} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-light text-slate-200">{ger.gerenciaName}</p>
                      <span className={cn('text-[9px] font-medium', conf.text)}>{conf.label}</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      {ger.employeeCount} personas
                      {pearsonInfo && (
                        <span className={cn('ml-2', pearsonInfo.color)}>
                          {pearsonInfo.label}
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Inline metrics */}
                <div className="flex items-center gap-4 mr-3 flex-shrink-0">
                  <div className="text-right">
                    <p className="text-[9px] text-slate-600">Cob.</p>
                    <p className={cn('text-xs font-mono', ger.coverage >= 70 ? 'text-slate-300' : 'text-amber-400')}>
                      {ger.coverage}%
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] text-slate-600">Prog.</p>
                    <p className="text-xs font-mono text-slate-300">{ger.avgProgress}%</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] text-slate-600">Desc.</p>
                    <p className={cn(
                      'text-xs font-mono',
                      ger.disconnectionRate > 25 ? 'text-red-400' :
                      ger.disconnectionRate > 15 ? 'text-amber-400' :
                      'text-slate-500'
                    )}>
                      {ger.disconnectionRate}%
                    </p>
                  </div>
                </div>

                <ChevronDown className={cn(
                  'w-4 h-4 text-slate-600 transition-transform flex-shrink-0',
                  isExpanded && 'rotate-180'
                )} />
              </button>

              {/* Expandible — narrative + Pearson + calibration */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 space-y-3">
                      <p className="text-[11px] font-light text-slate-400 leading-relaxed">
                        {narrative}
                      </p>

                      {/* Metric detail row */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        <MetricPill label="360° Prom." value={ger.avgScore360.toFixed(1)} />
                        <MetricPill label="Cobertura" value={`${ger.coverage}%`} warn={ger.coverage < 70} />
                        <MetricPill label="Progreso" value={`${ger.avgProgress}%`} />
                        <MetricPill label="Desconexión" value={`${ger.disconnectionRate}%`} warn={ger.disconnectionRate > 25} />
                      </div>

                      {/* 3A: Pearson detail */}
                      {pearsonInfo && (
                        <div className="flex gap-2 items-start rounded-lg bg-slate-900/50 px-3 py-2 border border-slate-800/30">
                          <span className={cn('text-[10px] font-medium flex-shrink-0 mt-px', pearsonInfo.color)}>r</span>
                          <p className="text-[10px] font-light text-slate-500 leading-relaxed">
                            Correlación RoleFit × Metas: {pearsonInfo.label}.
                            {ger.pearsonRoleFitGoals !== null && ger.pearsonRoleFitGoals < 0.3 &&
                              ' Las competencias definidas no predicen ejecución — revisar framework.'}
                            {ger.pearsonRoleFitGoals !== null && ger.pearsonRoleFitGoals > 0.7 &&
                              ' Las competencias que exiges predicen resultados. Framework bien calibrado.'}
                          </p>
                        </div>
                      )}

                      {/* 3D: Calibration cross */}
                      {ger.calibrationCross && (ger.calibrationCross.adjustedUpCount > 0 || ger.calibrationCross.adjustedDownCount > 0) && (
                        <div className="flex gap-2 items-start rounded-lg bg-slate-900/50 px-3 py-2 border border-slate-800/30">
                          <span className="text-[10px] text-purple-400 font-medium flex-shrink-0 mt-px">CAL</span>
                          <div className="text-[10px] font-light text-slate-500 leading-relaxed">
                            {ger.calibrationCross.adjustedUpCount > 0 && (
                              <p>
                                ⬆ {ger.calibrationCross.adjustedUpCount} calibrados arriba
                                {ger.calibrationCross.avgGoalsAdjustedUp !== null && (
                                  <> — metas prom. {ger.calibrationCross.avgGoalsAdjustedUp}%
                                    {ger.calibrationCross.avgGoalsAdjustedUp < 40 && (
                                      <span className="text-red-400"> (inflación política)</span>
                                    )}
                                  </>
                                )}
                              </p>
                            )}
                            {ger.calibrationCross.adjustedDownCount > 0 && (
                              <p>
                                ⬇ {ger.calibrationCross.adjustedDownCount} calibrados abajo
                                {ger.calibrationCross.avgGoalsAdjustedDown !== null && (
                                  <> — metas prom. {ger.calibrationCross.avgGoalsAdjustedDown}%
                                    {ger.calibrationCross.avgGoalsAdjustedDown > 80 && (
                                      <span className="text-amber-400"> (sesgo contra resultados)</span>
                                    )}
                                  </>
                                )}
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Evaluator classification */}
                      {ger.evaluatorClassification && (
                        <div className="flex gap-2 items-start rounded-lg bg-slate-900/50 px-3 py-2 border border-slate-800/30">
                          <span className={cn('text-[10px] font-medium flex-shrink-0 mt-px', conf.text)}>EVAL</span>
                          <p className="text-[10px] font-light text-slate-500 leading-relaxed">
                            Evaluador clasificado como &ldquo;{ger.evaluatorClassification}&rdquo;.
                            {ger.confidenceLevel === 'red' && ' Las evaluaciones podrían estar sobreestimadas.'}
                            {ger.confidenceLevel === 'amber' && ' Difícil distinguir top performers de underperformers.'}
                            {ger.confidenceLevel === 'green' && ' Datos confiables para decisiones de compensación.'}
                          </p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-4 text-[9px] text-slate-600">
        <span>Cob. = Cobertura de metas</span>
        <span>Prog. = Progreso promedio</span>
        <span>Desc. = Desconexión 360° vs metas</span>
        <span>r = Pearson RoleFit × Metas</span>
      </div>
    </div>
  )
})

// ════════════════════════════════════════════════════════════════════════════
// METRIC PILL — mini badge with label + value
// ════════════════════════════════════════════════════════════════════════════

function MetricPill({ label, value, warn = false }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="rounded-lg bg-slate-900/40 border border-slate-800/20 px-3 py-1.5 text-center">
      <p className="text-[9px] text-slate-600">{label}</p>
      <p className={cn('text-xs font-mono', warn ? 'text-amber-400' : 'text-slate-300')}>
        {value}
      </p>
    </div>
  )
}
