// src/components/succession/SuccessionMissionControl.tsx
'use client'

import { memo } from 'react'
import { ArrowRight, AlertTriangle } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

interface PositionSummary {
  id: string
  positionTitle: string
  benchStrength: string
  _count: { candidates: number }
}

interface SuccessionMissionControlProps {
  coverage: number
  coveredRoles: number
  totalRoles: number
  positions: PositionSummary[]
  onPositionClick: (positionId: string) => void
}

// ════════════════════════════════════════════════════════════════════════════
// GAUGE (cloned from SegmentedRing.tsx)
// ════════════════════════════════════════════════════════════════════════════

function getProgressColor(pct: number): string {
  if (pct >= 100) return '#10B981'  // emerald
  if (pct >= 60) return '#22D3EE'   // cyan
  if (pct >= 30) return '#A78BFA'   // purple
  return '#22D3EE'                   // cyan default
}

function getInsightText(coverage: number): string {
  if (coverage === 0) return 'Sin Cobertura'
  if (coverage < 50) return 'Cobertura Baja'
  if (coverage < 100) return 'En Progreso'
  return 'Cobertura Total'
}

function SuccessionGauge({ coverage, coveredRoles, totalRoles }: {
  coverage: number; coveredRoles: number; totalRoles: number
}) {
  const size = 280
  const strokeWidth = 10
  const radius = (size / 2) - strokeWidth
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (coverage / 100) * circumference
  const color = getProgressColor(coverage)
  const uncovered = totalRoles - coveredRoles

  return (
    <div className="relative flex items-center justify-center w-[200px] h-[200px] sm:w-[280px] sm:h-[280px]">
      {/* Glow sutil */}
      <div
        className="absolute rounded-full blur-[60px]"
        style={{
          width: '60%',
          height: '60%',
          backgroundColor: color,
          opacity: 0.08
        }}
      />

      <svg viewBox={`0 0 ${size} ${size}`} className="-rotate-90 w-full h-full">
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(71, 85, 105, 0.3)"
          strokeWidth={strokeWidth}
        />

        {/* Progress arc */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          style={{
            strokeDasharray: circumference,
            filter: `drop-shadow(0 0 6px ${color})`
          }}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
        />
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <motion.span
          className="text-7xl font-black text-white tracking-tighter font-mono"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          {coverage}%
        </motion.span>
        <span className="text-xs font-bold tracking-[0.2em] uppercase mt-2" style={{ color }}>
          {getInsightText(coverage)}
        </span>
        <span className="text-xs text-slate-500 font-mono mt-1">
          {coveredRoles}/{totalRoles} · {uncovered} sin cubrir
        </span>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// LED INDICATORS (cloned from DashboardIndicators pattern)
// ════════════════════════════════════════════════════════════════════════════

function SuccessionIndicators({ positions, layout }: {
  positions: PositionSummary[]
  layout: 'vertical' | 'horizontal'
}) {
  const noCoverage = positions.filter(p => p.benchStrength === 'NONE').length
  const atRisk = positions.filter(p => p.benchStrength === 'WEAK').length

  const indicators = [
    {
      label: 'Sin Cobertura',
      count: noCoverage,
      color: noCoverage > 0 ? 'text-rose-400' : 'text-slate-600',
      dot: noCoverage > 0 ? 'bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.6)]' : 'bg-slate-700',
    },
    {
      label: 'En Riesgo',
      count: atRisk,
      color: atRisk > 0 ? 'text-amber-400' : 'text-slate-600',
      dot: atRisk > 0 ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]' : 'bg-slate-700',
    },
  ]

  return (
    <div className={cn(
      'flex gap-4',
      layout === 'vertical' ? 'flex-col' : 'flex-row'
    )}>
      {indicators.map(ind => (
        <div key={ind.label} className="flex items-center gap-2">
          <div className={cn('w-2.5 h-2.5 rounded-full', ind.dot)} />
          <div>
            <span className={cn('text-[10px] font-bold uppercase tracking-wider block', ind.color)}>
              {ind.label}
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              {ind.count} posicion{ind.count !== 1 ? 'es' : ''}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ════════════════════════════════════════════════════════════════════════════

export const SuccessionMissionControl = memo(function SuccessionMissionControl({
  coverage,
  coveredRoles,
  totalRoles,
  positions,
  onPositionClick,
}: SuccessionMissionControlProps) {
  // Detect most urgent position
  const urgent = positions
    .filter(p => p.benchStrength === 'NONE' || p.benchStrength === 'WEAK')
    .sort((a, b) => {
      if (a.benchStrength === 'NONE' && b.benchStrength !== 'NONE') return -1
      if (a.benchStrength !== 'NONE' && b.benchStrength === 'NONE') return 1
      return a._count.candidates - b._count.candidates
    })[0]

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 220, damping: 30 }}
      className="flex flex-col items-center gap-6 w-full max-w-4xl px-4"
    >
      {/* Title */}
      <div className="text-center">
        <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight mb-1">
          Pipeline de Sucesion
        </h1>
        <p className="text-xs text-slate-500 font-mono uppercase tracking-wider">
          Cobertura de posiciones criticas
        </p>
      </div>

      {/* Main row: Indicators | Gauge | CTA */}
      <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-10 w-full">

        {/* LED Indicators — desktop left */}
        <div className="hidden md:block">
          <SuccessionIndicators positions={positions} layout="vertical" />
        </div>

        {/* Gauge */}
        <SuccessionGauge coverage={coverage} coveredRoles={coveredRoles} totalRoles={totalRoles} />

        {/* CTA — desktop right */}
        {urgent && (
          <div className="hidden md:block">
            <motion.button
              onClick={() => onPositionClick(urgent.id)}
              className="group relative flex items-center rounded-xl transition-all transform hover:-translate-y-0.5 gap-4 pl-5 pr-2 py-2 bg-gradient-to-r from-cyan-400 to-cyan-500 hover:from-cyan-300 hover:to-cyan-400 text-slate-950 shadow-[0_8px_24px_-6px_rgba(34,211,238,0.35)]"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="text-left">
                <span className="block text-[9px] uppercase tracking-wider font-semibold text-slate-700 opacity-70">
                  Ver Pipeline
                </span>
                <span className="block text-sm font-bold leading-tight">
                  {urgent.positionTitle}
                </span>
              </div>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-slate-950/10">
                <ArrowRight className="w-4 h-4" />
              </div>
            </motion.button>
          </div>
        )}
      </div>

      {/* LED Indicators — mobile */}
      <div className="md:hidden">
        <SuccessionIndicators positions={positions} layout="horizontal" />
      </div>

      {/* Insight text */}
      {urgent && (
        <p className="text-sm text-slate-400 text-center max-w-xs">
          {urgent.positionTitle} necesita sucesores urgentes
        </p>
      )}
      {!urgent && totalRoles > 0 && (
        <p className="text-sm text-emerald-400 text-center max-w-xs font-medium">
          Todos los roles criticos tienen cobertura
        </p>
      )}

      {/* CTA — mobile */}
      {urgent && (
        <div className="md:hidden">
          <motion.button
            onClick={() => onPositionClick(urgent.id)}
            className="group relative flex items-center rounded-xl transition-all gap-4 pl-5 pr-2 py-2 bg-gradient-to-r from-cyan-400 to-cyan-500 hover:from-cyan-300 hover:to-cyan-400 text-slate-950 shadow-[0_8px_24px_-6px_rgba(34,211,238,0.35)]"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="text-left">
              <span className="block text-[9px] uppercase tracking-wider font-semibold text-slate-700 opacity-70">
                Ver Pipeline
              </span>
              <span className="block text-sm font-bold leading-tight">
                {urgent.positionTitle}
              </span>
            </div>
            <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-slate-950/10">
              <ArrowRight className="w-4 h-4" />
            </div>
          </motion.button>
        </div>
      )}
    </motion.div>
  )
})
