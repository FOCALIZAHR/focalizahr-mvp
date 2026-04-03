'use client'

// ════════════════════════════════════════════════════════════════════════════
// COMPENSATION BOARD — Pre-Bonos checkpoint dual-column
// src/app/dashboard/executive-hub/components/GoalsCorrelation/cascada/CompensationBoard.tsx
// ════════════════════════════════════════════════════════════════════════════
// "Según evaluación 360°" vs "Según resultados reales"
// Highlight: PERCEPTION_BIAS = recibiría bono pero no entregó resultados
// Patrón clonado de SemaforoLegalTab.tsx (card structure + stagger)
// ════════════════════════════════════════════════════════════════════════════

import { memo, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, ArrowUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'

import type { CorrelationPoint } from '../GoalsCorrelation.types'

// ════════════════════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════════════════════

const MAX_SHOWN = 15

function scoreColor(score360: number): string {
  if (score360 >= 4.0) return 'text-cyan-400'
  if (score360 >= 3.0) return 'text-purple-400'
  return 'text-amber-400'
}

function goalsColor(pct: number): string {
  if (pct >= 80) return 'text-cyan-400'
  if (pct >= 50) return 'text-slate-400'
  return 'text-amber-400'
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ════════════════════════════════════════════════════════════════════════════

interface CompensationBoardProps {
  correlation: CorrelationPoint[]
}

export default memo(function CompensationBoard({ correlation }: CompensationBoardProps) {
  const [mobileView, setMobileView] = useState<'360' | 'goals'>('360')

  const { withGoals, by360, byGoals, biasCount } = useMemo(() => {
    const wg = correlation.filter(c => c.quadrant !== 'NO_GOALS' && c.goalsPercent !== null)
    const sorted360 = [...wg].sort((a, b) => b.score360 - a.score360).slice(0, MAX_SHOWN)
    const sortedGoals = [...wg].sort((a, b) => (b.goalsPercent ?? 0) - (a.goalsPercent ?? 0)).slice(0, MAX_SHOWN)
    const bias = wg.filter(c => c.quadrant === 'PERCEPTION_BIAS').length
    return { withGoals: wg, by360: sorted360, byGoals: sortedGoals, biasCount: bias }
  }, [correlation])

  if (withGoals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-500">
        <p className="text-sm font-light">Sin datos suficientes para comparar.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h3 className="text-lg font-extralight text-white tracking-tight">
          Checkpoint{' '}
          <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
            pre-compensación
          </span>
        </h3>
        {biasCount > 0 && (
          <p className="text-sm font-light text-amber-400/80 mt-1.5 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
            {biasCount} persona{biasCount !== 1 ? 's' : ''} recibiría{biasCount !== 1 ? 'n' : ''} bono alto pero no entregó resultados
          </p>
        )}
        {biasCount === 0 && (
          <p className="text-xs font-light text-slate-500 mt-1">
            Evaluación y resultados coinciden. Base confiable para compensar.
          </p>
        )}
      </div>

      {/* Mobile toggle */}
      <div className="flex md:hidden gap-0.5 bg-slate-900/50 border border-slate-700/30 rounded-full p-[3px]">
        {(['360', 'goals'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setMobileView(tab)}
            className={cn(
              'flex-1 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-[0.1em] transition-colors',
              mobileView === tab ? 'bg-slate-700/50 text-white' : 'text-slate-500'
            )}
          >
            {tab === '360' ? 'Evaluación 360°' : 'Resultados'}
          </button>
        ))}
      </div>

      {/* Dual columns (desktop) / single column (mobile) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Column 1: By 360° */}
        <div className={cn('space-y-1', mobileView !== '360' && 'hidden md:block')}>
          <div className="flex items-center gap-2 mb-3">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-600" />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
              Según evaluación 360°
            </span>
          </div>
          {by360.map((p, idx) => (
            <PersonRow
              key={p.employeeId}
              point={p}
              rank={idx + 1}
              metric="360"
              index={idx}
            />
          ))}
        </div>

        {/* Column 2: By Goals */}
        <div className={cn('space-y-1', mobileView !== 'goals' && 'hidden md:block')}>
          <div className="flex items-center gap-2 mb-3">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-600" />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
              Según resultados reales
            </span>
          </div>
          {byGoals.map((p, idx) => (
            <PersonRow
              key={p.employeeId}
              point={p}
              rank={idx + 1}
              metric="goals"
              index={idx}
            />
          ))}
        </div>
      </div>

      {/* Footer */}
      <p className="text-[10px] text-slate-700 px-1">
        Top {MAX_SHOWN} por cada criterio. Filas amber = evaluación alta pero resultados bajos.
      </p>
    </div>
  )
})

// ════════════════════════════════════════════════════════════════════════════
// PERSON ROW
// ════════════════════════════════════════════════════════════════════════════

const PersonRow = memo(function PersonRow({
  point,
  rank,
  metric,
  index,
}: {
  point: CorrelationPoint
  rank: number
  metric: '360' | 'goals'
  index: number
}) {
  const isBias = point.quadrant === 'PERCEPTION_BIAS'

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.2 }}
      className={cn(
        'flex items-center gap-3 py-2 px-3 rounded-lg transition-colors',
        isBias
          ? 'bg-amber-500/5 border border-amber-500/15'
          : 'border border-transparent hover:bg-slate-800/30'
      )}
    >
      {/* Rank */}
      <span className="text-[10px] font-mono text-slate-600 w-5 text-right flex-shrink-0">
        {rank}
      </span>

      {/* Name + dept */}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-light text-slate-200 truncate">{point.employeeName}</p>
        <p className="text-[10px] text-slate-600 truncate">{point.departmentName}</p>
      </div>

      {/* Metric value */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {metric === '360' ? (
          <span className={cn('text-sm font-mono', scoreColor(point.score360))}>
            {point.score360.toFixed(1)}
          </span>
        ) : (
          <span className={cn('text-sm font-mono', goalsColor(point.goalsPercent ?? 0))}>
            {Math.round(point.goalsPercent ?? 0)}%
          </span>
        )}
      </div>

      {/* Bias badge */}
      {isBias && (
        <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 font-semibold uppercase flex-shrink-0">
          Sesgo
        </span>
      )}
    </motion.div>
  )
})
