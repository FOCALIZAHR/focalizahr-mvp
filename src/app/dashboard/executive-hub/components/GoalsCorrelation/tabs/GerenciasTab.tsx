'use client'

// ════════════════════════════════════════════════════════════════════════════
// GOALS CORRELATION — Tab Gerencias (Cards Narrativas + Semáforo Confianza)
// src/app/dashboard/executive-hub/components/GoalsCorrelation/tabs/GerenciasTab.tsx
// ════════════════════════════════════════════════════════════════════════════
// Cards por gerencia con narrativa del diccionario, Tesla line por confianza,
// y métricas inline. Reemplaza tabla plana (anti-patrón).
// ════════════════════════════════════════════════════════════════════════════

import { memo, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { GerenciaGoalsStats } from '../GoalsCorrelation.types'
import { buildGerenciaNarrative } from '@/config/narratives/GoalsNarrativeDictionary'

interface GerenciasTabProps {
  byGerencia: GerenciaGoalsStats[]
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

export default memo(function GerenciasTab({ byGerencia }: GerenciasTabProps) {
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

      {/* Gerencia cards */}
      <div className="space-y-3">
        {byGerencia.map((ger, idx) => {
          const conf = CONFIDENCE_VISUAL[ger.confidenceLevel]
          const isExpanded = expanded === ger.gerenciaName
          const narrative = buildGerenciaNarrative({
            gerenciaName: ger.gerenciaName,
            disconnectionRate: ger.disconnectionRate,
            coverage: ger.coverage,
            avgProgress: ger.avgProgress,
            avgScore360: ger.avgScore360,
            evaluatorClassification: ger.evaluatorClassification,
            confidenceLevel: ger.confidenceLevel,
            employeeCount: ger.employeeCount,
          })

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

              {/* Expandible — narrative */}
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
