'use client'

// ════════════════════════════════════════════════════════════════════════════
// GERENCIA HEATMAP — Tabla de confianza por gerencia
// src/app/dashboard/executive-hub/components/GoalsCorrelation/cascada/GerenciaHeatmap.tsx
// ════════════════════════════════════════════════════════════════════════════
// Patrón: Executive Dashboard (split narrativa + datos)
// Tesla line dinámica por fila, glassmorphism, fhr-* classes
// ════════════════════════════════════════════════════════════════════════════

import { memo } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { GerenciaGoalsStatsV2 } from '@/lib/services/GoalsDiagnosticService'

// ════════════════════════════════════════════════════════════════════════════
// TESLA LINE COLORS (per confidence level)
// ════════════════════════════════════════════════════════════════════════════

const CONFIDENCE = {
  green: {
    dot: 'bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.6)]',
    tesla: '#10B981',
    label: 'Confiable',
    labelClass: 'text-emerald-400',
  },
  amber: {
    dot: 'bg-amber-400 shadow-[0_0_6px_rgba(245,158,11,0.6)]',
    tesla: '#F59E0B',
    label: 'Revisar',
    labelClass: 'text-amber-400',
  },
  red: {
    dot: 'bg-red-400 shadow-[0_0_6px_rgba(239,68,68,0.6)]',
    tesla: '#EF4444',
    label: 'Crítico',
    labelClass: 'text-red-400',
  },
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ════════════════════════════════════════════════════════════════════════════

interface GerenciaHeatmapProps {
  byGerencia: GerenciaGoalsStatsV2[]
}

export default memo(function GerenciaHeatmap({ byGerencia }: GerenciaHeatmapProps) {
  if (byGerencia.length === 0) {
    return (
      <div className="fhr-card p-8 text-center">
        <Info className="w-8 h-8 mx-auto mb-3 text-slate-600" />
        <p className="text-sm font-light text-slate-400">Sin datos de gerencias disponibles.</p>
      </div>
    )
  }

  const sorted = [...byGerencia].sort((a, b) => {
    const order = { red: 0, amber: 1, green: 2 }
    const diff = order[a.confidenceLevel] - order[b.confidenceLevel]
    if (diff !== 0) return diff
    return b.disconnectionRate - a.disconnectionRate
  })

  const redCount = sorted.filter(g => g.confidenceLevel === 'red').length

  return (
    <div className="space-y-5">
      {/* Header — narrativa primero */}
      <div>
        <h3 className="text-xl font-extralight text-white tracking-tight">
          Confianza{' '}
          <span className="fhr-title-gradient">por gerencia</span>
        </h3>
        <p className="text-sm font-light text-slate-500 mt-1.5">
          {redCount > 0 ? (
            <>
              <span className="text-amber-400">{redCount}</span> de {sorted.length} gerencia{sorted.length !== 1 ? 's' : ''} requiere{redCount === 1 ? '' : 'n'} intervención.
              La evaluación no coincide con los resultados.
            </>
          ) : (
            <>{sorted.length} gerencia{sorted.length !== 1 ? 's' : ''} evaluada{sorted.length !== 1 ? 's' : ''}. Base confiable para compensar.</>
          )}
        </p>
      </div>

      {/* Cards — una por gerencia (mobile-first, no tabla) */}
      <div className="space-y-2">
        {sorted.map((g, idx) => {
          const conf = CONFIDENCE[g.confidenceLevel]

          return (
            <motion.div
              key={g.gerenciaName}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04, duration: 0.25 }}
              className="fhr-card relative overflow-hidden p-0"
            >
              {/* Tesla line — color by confidence */}
              <div
                className="absolute top-0 left-0 right-0 h-[2px]"
                style={{
                  background: `linear-gradient(90deg, transparent, ${conf.tesla}, transparent)`,
                  boxShadow: `0 0 12px ${conf.tesla}40`,
                }}
              />

              <div className="flex items-center gap-4 px-4 py-3.5">
                {/* Confidence dot + name */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2.5">
                    <div className={cn('w-2 h-2 rounded-full flex-shrink-0', conf.dot)} />
                    <span className="text-sm font-medium text-slate-200 truncate">
                      {g.gerenciaName}
                    </span>
                  </div>
                  {/* Mobile: inline metrics */}
                  <div className="flex items-center gap-3 mt-1.5 md:hidden">
                    <span className="text-[10px] text-slate-500">
                      Cob <span className={cn('font-mono', g.coverage >= 70 ? 'text-slate-400' : 'text-amber-400')}>{Math.round(g.coverage)}%</span>
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Desc <span className={cn('font-mono', g.disconnectionRate >= 25 ? 'text-red-400' : g.disconnectionRate >= 15 ? 'text-amber-400' : 'text-slate-400')}>{Math.round(g.disconnectionRate)}%</span>
                    </span>
                    {g.evaluatorClassification && (
                      <span className={cn('fhr-badge text-[8px]',
                        g.evaluatorClassification === 'INDULGENTE' ? 'fhr-badge-error' :
                        g.evaluatorClassification === 'SEVERA' ? 'fhr-badge-warning' :
                        g.evaluatorClassification === 'OPTIMA' ? 'fhr-badge-success' : 'fhr-badge-active'
                      )}>
                        {g.evaluatorClassification === 'OPTIMA' ? 'Óptima' : g.evaluatorClassification === 'INDULGENTE' ? 'Indul.' : g.evaluatorClassification === 'SEVERA' ? 'Severa' : 'Central'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Desktop metrics */}
                <div className="hidden md:flex items-center gap-5 flex-shrink-0">
                  <div className="text-center w-16">
                    <p className="text-[9px] text-slate-600 uppercase tracking-wider">Cobertura</p>
                    <p className={cn('text-sm font-mono', g.coverage >= 70 ? 'text-slate-400' : 'text-amber-400')}>
                      {Math.round(g.coverage)}%
                    </p>
                  </div>
                  <div className="text-center w-16">
                    <p className="text-[9px] text-slate-600 uppercase tracking-wider">Desconexión</p>
                    <p className={cn('text-sm font-mono',
                      g.disconnectionRate >= 25 ? 'text-red-400' :
                      g.disconnectionRate >= 15 ? 'text-amber-400' : 'text-slate-400'
                    )}>
                      {Math.round(g.disconnectionRate)}%
                    </p>
                  </div>
                  <div className="text-center w-16">
                    <p className="text-[9px] text-slate-600 uppercase tracking-wider">Pearson</p>
                    <p className={cn('text-sm font-mono',
                      g.pearsonRoleFitGoals === null ? 'text-slate-700' :
                      g.pearsonRoleFitGoals >= 0.5 ? 'text-cyan-400' :
                      g.pearsonRoleFitGoals >= 0.3 ? 'text-slate-400' : 'text-amber-400'
                    )}>
                      {g.pearsonRoleFitGoals !== null ? g.pearsonRoleFitGoals.toFixed(2) : '—'}
                    </p>
                  </div>
                  <div className="text-center w-20">
                    <p className="text-[9px] text-slate-600 uppercase tracking-wider">Evaluador</p>
                    {g.evaluatorClassification ? (
                      <span className={cn('fhr-badge text-[8px] mt-0.5 inline-block',
                        g.evaluatorClassification === 'INDULGENTE' ? 'fhr-badge-error' :
                        g.evaluatorClassification === 'SEVERA' ? 'fhr-badge-warning' :
                        g.evaluatorClassification === 'OPTIMA' ? 'fhr-badge-success' : 'fhr-badge-active'
                      )}>
                        {g.evaluatorClassification === 'OPTIMA' ? 'Óptima' : g.evaluatorClassification === 'INDULGENTE' ? 'Indulgente' : g.evaluatorClassification === 'SEVERA' ? 'Severa' : 'Central'}
                      </span>
                    ) : (
                      <p className="text-[10px] text-slate-700">—</p>
                    )}
                  </div>
                </div>

                {/* Confidence label + alert */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={cn('text-[10px] font-medium hidden sm:inline', conf.labelClass)}>
                    {conf.label}
                  </span>
                  {(g.confidenceLevel === 'red' || g.disconnectionRate >= 25) && (
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                  )}
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Footer */}
      <p className="text-[10px] font-light text-slate-600 px-1">
        Pearson mide correlación competencias × metas. Sobre 0.5 las competencias predicen resultados.
      </p>
    </div>
  )
})
