'use client'

// ════════════════════════════════════════════════════════════════════════════
// GERENCIA HEATMAP — Tabla de confianza por gerencia
// src/app/dashboard/executive-hub/components/GoalsCorrelation/cascada/GerenciaHeatmap.tsx
// ════════════════════════════════════════════════════════════════════════════
// Patrón clonado de CalibrationHealth/GerenciaHealthTab.tsx
// Tesla line por fila + dots de confianza + responsive
// ════════════════════════════════════════════════════════════════════════════

import { memo } from 'react'
import { AlertTriangle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { GerenciaGoalsStatsV2 } from '@/lib/services/GoalsDiagnosticService'

// ════════════════════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════════════════════

const CONFIDENCE_STYLES = {
  green: {
    dot: 'bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.6)]',
    tesla: 'bg-emerald-500',
    label: 'Confiable',
  },
  amber: {
    dot: 'bg-amber-400 shadow-[0_0_6px_rgba(245,158,11,0.6)]',
    tesla: 'bg-amber-500',
    label: 'Revisar',
  },
  red: {
    dot: 'bg-red-400 shadow-[0_0_6px_rgba(239,68,68,0.6)]',
    tesla: 'bg-red-500',
    label: 'Crítico',
  },
}

const EVALUATOR_BADGE: Record<string, { text: string; color: string }> = {
  INDULGENTE: { text: 'Indulgente', color: 'text-red-400 bg-red-500/10 border-red-500/20' },
  SEVERA: { text: 'Severa', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  CENTRAL: { text: 'Central', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' },
  OPTIMA: { text: 'Óptima', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
}

function pearsonColor(p: number | null): string {
  if (p === null) return 'text-slate-600'
  if (p >= 0.5) return 'text-cyan-400'
  if (p >= 0.3) return 'text-slate-400'
  return 'text-amber-400'
}

function disconnectionColor(rate: number): string {
  if (rate >= 25) return 'text-red-400'
  if (rate >= 15) return 'text-amber-400'
  return 'text-slate-400'
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
      <div className="flex flex-col items-center justify-center py-16 text-slate-500">
        <Info className="w-8 h-8 mb-3 opacity-40" />
        <p className="text-sm font-light">Sin datos de gerencias disponibles.</p>
      </div>
    )
  }

  // Sort: red first, then amber, then green; within same level, by disconnectionRate desc
  const sorted = [...byGerencia].sort((a, b) => {
    const order = { red: 0, amber: 1, green: 2 }
    const diff = order[a.confidenceLevel] - order[b.confidenceLevel]
    if (diff !== 0) return diff
    return b.disconnectionRate - a.disconnectionRate
  })

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h3 className="text-lg font-extralight text-white tracking-tight">
          Confianza{' '}
          <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
            por gerencia
          </span>
        </h3>
        <p className="text-xs font-light text-slate-500 mt-1">
          {sorted.length} gerencia{sorted.length !== 1 ? 's' : ''} evaluada{sorted.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Table */}
      <div className="rounded-xl overflow-hidden border border-slate-800/60" style={{ background: 'rgba(15, 23, 42, 0.6)' }}>
        <table className="w-full border-collapse table-fixed">
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(51, 65, 85, 0.5)' }}>
              <TH align="left" className="w-[55%] md:w-[28%]" style={{ paddingLeft: '20px' }}>Gerencia</TH>
              <TH className="hidden md:table-cell md:w-[12%]">Cobertura</TH>
              <TH className="hidden md:table-cell md:w-[14%]">Desconexión</TH>
              <TH className="hidden md:table-cell md:w-[14%]">Evaluador</TH>
              <TH className="hidden md:table-cell md:w-[12%]">Pearson</TH>
              <TH className="w-[30%] md:w-[12%]">Confianza</TH>
              <th className="py-3 w-[15%] md:w-[8%]" />
            </tr>
          </thead>
          <tbody>
            {sorted.map((g, idx) => {
              const conf = CONFIDENCE_STYLES[g.confidenceLevel]
              const evalBadge = g.evaluatorClassification ? EVALUATOR_BADGE[g.evaluatorClassification] : null
              const hasAlert = g.confidenceLevel === 'red' || g.disconnectionRate >= 25
              const isLast = idx === sorted.length - 1

              return (
                <tr
                  key={g.gerenciaName}
                  className="group transition-colors duration-150 hover:bg-slate-700/15"
                  style={{ borderBottom: isLast ? 'none' : '1px solid rgba(51, 65, 85, 0.3)' }}
                >
                  {/* Gerencia + Tesla line */}
                  <td className="py-3.5" style={{ paddingLeft: 0 }}>
                    <div className="flex items-center gap-3">
                      <div
                        className={cn('flex-shrink-0 self-stretch w-0.5 rounded-full', conf.tesla)}
                        style={{ minHeight: '42px', marginLeft: '6px', opacity: 0.85 }}
                      />
                      <div className="min-w-0">
                        <span className="text-sm font-medium text-slate-200 truncate block">
                          {g.gerenciaName}
                        </span>
                        <span className="text-[10px] text-slate-600 md:hidden">
                          {Math.round(g.coverage)}% cob · {Math.round(g.disconnectionRate)}% desc
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Cobertura */}
                  <td className="hidden md:table-cell px-3 py-3.5 text-center">
                    <span className={cn(
                      'text-sm font-mono',
                      g.coverage >= 70 ? 'text-slate-400' : 'text-amber-400'
                    )}>
                      {Math.round(g.coverage)}%
                    </span>
                  </td>

                  {/* Desconexión */}
                  <td className="hidden md:table-cell px-3 py-3.5 text-center">
                    <span className={cn('text-sm font-mono', disconnectionColor(g.disconnectionRate))}>
                      {Math.round(g.disconnectionRate)}%
                    </span>
                  </td>

                  {/* Evaluador */}
                  <td className="hidden md:table-cell px-3 py-3.5 text-center">
                    {evalBadge ? (
                      <span className={cn(
                        'text-[9px] px-2 py-0.5 rounded-full border font-semibold uppercase',
                        evalBadge.color
                      )}>
                        {evalBadge.text}
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-700">—</span>
                    )}
                  </td>

                  {/* Pearson */}
                  <td className="hidden md:table-cell px-3 py-3.5 text-center">
                    <span className={cn('text-sm font-mono', pearsonColor(g.pearsonRoleFitGoals))}>
                      {g.pearsonRoleFitGoals !== null ? g.pearsonRoleFitGoals.toFixed(2) : '—'}
                    </span>
                  </td>

                  {/* Confianza */}
                  <td className="px-3 py-3.5">
                    <div className="flex items-center justify-center gap-2">
                      <div className={cn('w-2 h-2 rounded-full flex-shrink-0', conf.dot)} />
                      <span className="text-[10px] text-slate-500 hidden sm:inline">{conf.label}</span>
                    </div>
                  </td>

                  {/* Alert */}
                  <td className="px-2 py-3.5 text-center">
                    {hasAlert && <AlertTriangle className="w-4 h-4 inline-block text-amber-500 opacity-85" />}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <p className="px-1 text-[10px] text-slate-700">
        Pearson mide correlación competencias × metas. Sobre 0.5 = las competencias predicen resultados.
      </p>
    </div>
  )
})

// ════════════════════════════════════════════════════════════════════════════
// TH HELPER — Styled header cell
// ════════════════════════════════════════════════════════════════════════════

function TH({ children, align, className, style }: {
  children?: React.ReactNode; align?: string; className?: string; style?: React.CSSProperties
}) {
  return (
    <th
      className={cn(
        'px-3 py-3 text-[10px] font-semibold tracking-widest uppercase',
        className
      )}
      style={{ color: '#475569', textAlign: (align as 'left' | 'center' | 'right') || 'center', ...style }}
    >
      {children}
    </th>
  )
}
