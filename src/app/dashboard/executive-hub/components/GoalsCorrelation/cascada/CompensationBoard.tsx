'use client'

// ════════════════════════════════════════════════════════════════════════════
// COMPENSATION BOARD — Mérito (360°) vs Bonos (Metas)
// src/app/dashboard/executive-hub/components/GoalsCorrelation/cascada/CompensationBoard.tsx
// ════════════════════════════════════════════════════════════════════════════
// Columna Mérito: quiénes priorizaría el sistema para aumento salarial (360°)
// Columna Bonos: quiénes recibirían bono variable (metas cumplidas)
// Badge por cuadrante + tooltip narrativo del CompensacionNarrativeDictionary
// ════════════════════════════════════════════════════════════════════════════

import { memo, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, ArrowUp, ArrowDown, Minus, BarChart3, Target } from 'lucide-react'
import { cn } from '@/lib/utils'

import type { CorrelationPoint } from '../GoalsCorrelation.types'
import type { CorrelationQuadrant } from '@/lib/services/GoalsDiagnosticService'
import { getCompensacionNarrative } from '@/config/narratives/CompensacionNarrativeDictionary'
import { NavPill } from '../../shared/NavPill'
import type { NavPillTab } from '../../shared/NavPill'

// ════════════════════════════════════════════════════════════════════════════
// CONFIG
// ════════════════════════════════════════════════════════════════════════════

const MAX_SHOWN = 15

const MOBILE_TABS: NavPillTab[] = [
  { key: 'merito', icon: BarChart3, label: 'Mérito' },
  { key: 'bonos', icon: Target, label: 'Bonos' },
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
// QUADRANT BADGE CONFIG — maps quadrant to badge + tooltip
// ════════════════════════════════════════════════════════════════════════════

const QUADRANT_BADGE: Record<string, { label: string; badge: string; tooltipKey: string }> = {
  PERCEPTION_BIAS: {
    label: 'Sesgo evaluador',
    badge: 'fhr-badge-warning',
    tooltipKey: 'PERCEPTION_BIAS',
  },
  HIDDEN_PERFORMER: {
    label: 'Talento invisible',
    badge: 'fhr-badge-purple',
    tooltipKey: 'HIDDEN_PERFORMER',
  },
  DOUBLE_RISK: {
    label: 'Doble riesgo',
    badge: 'fhr-badge-error',
    tooltipKey: 'DOUBLE_RISK',
  },
  CONSISTENT: {
    label: 'Alineado',
    badge: 'fhr-badge-success',
    tooltipKey: 'CONSISTENT',
  },
}

// Condensed tooltip from CompensacionNarrativeDictionary.observacion
const QUADRANT_TOOLTIP: Record<string, string> = {
  PERCEPTION_BIAS:
    'Evaluación alta, resultados bajos. El sistema prioriza a esta persona para mérito — pero las metas no respaldan un bono. Aprobar un aumento a quien no trae resultados puede normalizar el bajo rendimiento.',
  HIDDEN_PERFORMER:
    'Resultados altos, evaluación baja. El bono premia su ejecución — pero mérito no lo reconoce. El efecto: desmotivar a quien efectivamente trae resultados.',
  DOUBLE_RISK:
    'Dos fuentes confirman el mismo diagnóstico. No hay respaldo para bono ni incremento. El riesgo no es qué pagar — es por qué sigue en el cargo.',
  CONSISTENT:
    'Excelencia confirmada. Califica para bono máximo y mejor mérito. El riesgo: creer que el paquete estándar es suficiente para retenerlo.',
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ════════════════════════════════════════════════════════════════════════════

interface CompensationBoardProps {
  correlation: CorrelationPoint[]
}

export default memo(function CompensationBoard({ correlation }: CompensationBoardProps) {
  const [mobileView, setMobileView] = useState('merito')

  const { withGoals, byMerito, byBonos, biasCount, rankMerito, rankBonos } = useMemo(() => {
    const wg = correlation.filter(c => c.quadrant !== 'NO_GOALS' && c.goalsPercent !== null)
    const allMerito = [...wg].sort((a, b) => b.score360 - a.score360)
    const allBonos = [...wg].sort((a, b) => (b.goalsPercent ?? 0) - (a.goalsPercent ?? 0))
    const sortedMerito = allMerito.slice(0, MAX_SHOWN)
    const sortedBonos = allBonos.slice(0, MAX_SHOWN)
    const bias = wg.filter(c => c.quadrant === 'PERCEPTION_BIAS').length
    const rankMerito = new Map(allMerito.map((p, i) => [p.employeeId, i + 1]))
    const rankBonos = new Map(allBonos.map((p, i) => [p.employeeId, i + 1]))
    return { withGoals: wg, byMerito: sortedMerito, byBonos: sortedBonos, biasCount: bias, rankMerito, rankBonos }
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
            <span className="text-amber-400 font-medium">{biasCount} persona{biasCount !== 1 ? 's' : ''}</span> recibiría{biasCount !== 1 ? 'n' : ''} aumento por mérito pero no entregó resultados que respalden un bono.
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
        {/* Column 1: Mérito (360°) */}
        <div className={cn(mobileView !== 'merito' && 'hidden md:block')}>
          <ColumnCard
            icon={<BarChart3 className="w-3.5 h-3.5 text-cyan-400" />}
            title="Mérito"
            subtitle="Quiénes priorizaría el sistema para aumento salarial"
            teslaColor="#22D3EE"
            items={byMerito}
            metric="360"
            otherRankMap={rankBonos}
            otherLabel="Bonos"
          />
        </div>

        {/* Column 2: Bonos (Metas) */}
        <div className={cn(mobileView !== 'bonos' && 'hidden md:block')}>
          <ColumnCard
            icon={<Target className="w-3.5 h-3.5 text-purple-400" />}
            title="Bonos"
            subtitle="Quiénes recibirían bono variable por cumplir metas"
            teslaColor="#A78BFA"
            items={byBonos}
            metric="goals"
            otherRankMap={rankMerito}
            otherLabel="Mérito"
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
  otherRankMap,
  otherLabel,
}: {
  icon: React.ReactNode
  title: string
  subtitle: string
  teslaColor: string
  items: CorrelationPoint[]
  metric: '360' | 'goals'
  otherRankMap: Map<string, number>
  otherLabel: string
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
          <PersonRow
            key={p.employeeId}
            point={p}
            rank={idx + 1}
            metric={metric}
            index={idx}
            otherRank={otherRankMap.get(p.employeeId)}
            otherLabel={otherLabel}
          />
        ))}
      </div>
    </div>
  )
})

// ════════════════════════════════════════════════════════════════════════════
// PERSON ROW — badge por cuadrante + tooltip narrativo
// ════════════════════════════════════════════════════════════════════════════

const PersonRow = memo(function PersonRow({
  point,
  rank,
  metric,
  index,
  otherRank,
  otherLabel,
}: {
  point: CorrelationPoint
  rank: number
  metric: '360' | 'goals'
  index: number
  otherRank?: number
  otherLabel?: string
}) {
  const quadrantBadge = QUADRANT_BADGE[point.quadrant]
  const tooltip = QUADRANT_TOOLTIP[point.quadrant]
  const isRisk = point.quadrant === 'PERCEPTION_BIAS' || point.quadrant === 'DOUBLE_RISK'
  const delta = otherRank ? otherRank - rank : 0
  const bigDelta = Math.abs(delta) > 5

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.2 }}
      className={cn(
        'group/row relative flex items-center gap-2 py-2 px-2 rounded-lg transition-all duration-200',
        isRisk && bigDelta
          ? 'bg-amber-500/[0.06] border border-amber-500/20 shadow-[0_0_12px_rgba(245,158,11,0.05)]'
          : isRisk
            ? 'bg-amber-500/[0.04] border border-amber-500/15'
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

      {/* Other rank delta */}
      {otherRank && otherLabel && (
        <div className={cn(
          'flex items-center gap-0.5 flex-shrink-0 text-[9px] font-mono',
          delta > 3 ? 'text-amber-400' : delta < -3 ? 'text-cyan-400' : 'text-slate-600'
        )}>
          {delta > 3 ? <ArrowDown className="w-3 h-3" /> :
           delta < -3 ? <ArrowUp className="w-3 h-3" /> :
           <Minus className="w-3 h-3" />}
          <span>#{otherRank}</span>
        </div>
      )}

      {/* Quadrant badge with narrative tooltip */}
      {quadrantBadge && (
        <div className="group/badge relative flex-shrink-0">
          <span className={cn('fhr-badge text-[8px] cursor-default', quadrantBadge.badge)}>
            {quadrantBadge.label}
          </span>

          {/* Tooltip — narrativa de compensación */}
          {tooltip && (
            <div className="absolute bottom-full right-0 mb-2 w-64 px-3 py-2.5 rounded-xl bg-slate-950/95 backdrop-blur-xl border border-slate-700/30 shadow-2xl shadow-black/30 opacity-0 group-hover/badge:opacity-100 transition-all duration-200 pointer-events-none z-50 translate-y-1 group-hover/badge:translate-y-0">
              <p className="text-[10px] text-slate-300 leading-relaxed">
                {tooltip}
              </p>
            </div>
          )}
        </div>
      )}
    </motion.div>
  )
})
