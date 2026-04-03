'use client'

// ════════════════════════════════════════════════════════════════════════════
// COMPENSATION BOARD — Pre-Bonos checkpoint dual-column
// src/app/dashboard/executive-hub/components/GoalsCorrelation/cascada/CompensationBoard.tsx
// ════════════════════════════════════════════════════════════════════════════
// "Según evaluación 360°" vs "Según resultados reales"
// Highlight: PERCEPTION_BIAS = recibiría bono pero no entregó resultados
// Design: fhr-card + fhr-badge + NavPill mobile + Tesla lines
// ════════════════════════════════════════════════════════════════════════════

import { memo, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, ArrowUpDown, BarChart3, Target } from 'lucide-react'
import { cn } from '@/lib/utils'

import type { CorrelationPoint } from '../GoalsCorrelation.types'
import { NavPill } from '../../shared/NavPill'
import type { NavPillTab } from '../../shared/NavPill'

// ════════════════════════════════════════════════════════════════════════════
// CONFIG
// ════════════════════════════════════════════════════════════════════════════

const MAX_SHOWN = 15

const MOBILE_TABS: NavPillTab[] = [
  { key: '360', icon: BarChart3, label: 'Evaluación 360°' },
  { key: 'goals', icon: Target, label: 'Resultados' },
]

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
  const [mobileView, setMobileView] = useState('360')

  const { withGoals, by360, byGoals, biasCount } = useMemo(() => {
    const wg = correlation.filter(c => c.quadrant !== 'NO_GOALS' && c.goalsPercent !== null)
    const sorted360 = [...wg].sort((a, b) => b.score360 - a.score360).slice(0, MAX_SHOWN)
    const sortedGoals = [...wg].sort((a, b) => (b.goalsPercent ?? 0) - (a.goalsPercent ?? 0)).slice(0, MAX_SHOWN)
    const bias = wg.filter(c => c.quadrant === 'PERCEPTION_BIAS').length
    return { withGoals: wg, by360: sorted360, byGoals: sortedGoals, biasCount: bias }
  }, [correlation])

  if (withGoals.length === 0) {
    return (
      <div className="fhr-card p-8 text-center">
        <p className="text-sm font-light text-slate-400">Sin datos suficientes para comparar.</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Header — narrativa ejecutiva */}
      <div>
        <h3 className="text-xl font-extralight text-white tracking-tight">
          Checkpoint{' '}
          <span className="fhr-title-gradient">pre-compensación</span>
        </h3>
        {biasCount > 0 ? (
          <p className="text-sm font-light text-slate-400 mt-1.5">
            <span className="text-amber-400 font-medium">{biasCount} persona{biasCount !== 1 ? 's' : ''}</span> recibiría{biasCount !== 1 ? 'n' : ''} bono alto según su evaluación 360° pero no entregó resultados que lo respalden.
          </p>
        ) : (
          <p className="text-sm font-light text-slate-500 mt-1.5">
            Evaluación y resultados coinciden. Base confiable para compensar.
          </p>
        )}
      </div>

      {/* Mobile: NavPill toggle */}
      <div className="flex justify-center md:hidden">
        <NavPill
          tabs={MOBILE_TABS}
          active={mobileView}
          onChange={setMobileView}
          layoutId="comp-board-nav"
        />
      </div>

      {/* Dual columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Column 1: By 360° */}
        <div className={cn(mobileView !== '360' && 'hidden md:block')}>
          <ColumnCard
            icon={<BarChart3 className="w-3.5 h-3.5 text-cyan-400" />}
            title="Según evaluación 360°"
            subtitle="Quiénes recibirían mayor bono"
            teslaColor="#22D3EE"
            items={by360}
            metric="360"
          />
        </div>

        {/* Column 2: By Goals */}
        <div className={cn(mobileView !== 'goals' && 'hidden md:block')}>
          <ColumnCard
            icon={<Target className="w-3.5 h-3.5 text-purple-400" />}
            title="Según resultados reales"
            subtitle="Quiénes entregaron más"
            teslaColor="#A78BFA"
            items={byGoals}
            metric="goals"
          />
        </div>
      </div>
    </div>
  )
})

// ════════════════════════════════════════════════════════════════════════════
// COLUMN CARD — fhr-card + Tesla line + ranked list
// ════════════════════════════════════════════════════════════════════════════

const ColumnCard = memo(function ColumnCard({
  icon,
  title,
  subtitle,
  teslaColor,
  items,
  metric,
}: {
  icon: React.ReactNode
  title: string
  subtitle: string
  teslaColor: string
  items: CorrelationPoint[]
  metric: '360' | 'goals'
}) {
  return (
    <div className="fhr-card relative overflow-hidden p-0">
      {/* Tesla line */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{
          background: `linear-gradient(90deg, transparent, ${teslaColor}, transparent)`,
          boxShadow: `0 0 15px ${teslaColor}40`,
        }}
      />

      {/* Header */}
      <div className="px-4 pt-5 pb-3">
        <div className="flex items-center gap-2 mb-0.5">
          {icon}
          <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
            {title}
          </span>
        </div>
        <p className="text-[10px] font-light text-slate-600">{subtitle}</p>
      </div>

      {/* List */}
      <div className="px-3 pb-4 space-y-0.5">
        {items.map((p, idx) => (
          <PersonRow key={p.employeeId} point={p} rank={idx + 1} metric={metric} index={idx} />
        ))}
      </div>
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
        'flex items-center gap-3 py-2 px-2 rounded-lg transition-all duration-200',
        isBias
          ? 'bg-amber-500/[0.04] border border-amber-500/15 hover:bg-amber-500/[0.08]'
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

      {/* Metric */}
      <div className="flex-shrink-0">
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
        <span className="fhr-badge fhr-badge-warning text-[8px] flex-shrink-0">
          Sesgo
        </span>
      )}
    </motion.div>
  )
})
