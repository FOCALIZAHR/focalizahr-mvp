'use client'

// ════════════════════════════════════════════════════════════════════════════
// GOALS CORRELATION — Tab Análisis (Scatter Plot SVG)
// src/app/dashboard/executive-hub/components/GoalsCorrelation/tabs/AnalisisTab.tsx
// ════════════════════════════════════════════════════════════════════════════
// Eje X: goalsPercent (0-100) | Eje Y: score360 (1-5)
// 4 zonas de color + líneas guía + dots interactivos
// SVG directo para control total (no recharts)
// ════════════════════════════════════════════════════════════════════════════

import { memo, useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { CorrelationPoint } from '../GoalsCorrelation.types'
import type { CorrelationQuadrant } from '@/lib/services/GoalsDiagnosticService'
import { QUADRANT_CONFIG } from '../GoalsCorrelation.constants'
import { GOALS_THRESHOLDS } from '@/lib/services/GoalsDiagnosticService'

interface AnalisisTabProps {
  correlation: CorrelationPoint[]
  quadrantCounts: {
    consistent: number
    perceptionBias: number
    hiddenPerformer: number
    doubleRisk: number
    noGoals: number
  }
}

// ════════════════════════════════════════════════════════════════════════════
// SCATTER PLOT DIMENSIONS
// ════════════════════════════════════════════════════════════════════════════

const CHART = {
  width: 600,
  height: 400,
  padding: { top: 20, right: 20, bottom: 40, left: 45 },
}

const plotW = CHART.width - CHART.padding.left - CHART.padding.right
const plotH = CHART.height - CHART.padding.top - CHART.padding.bottom

// Scale functions
const scaleX = (goalsPercent: number) => CHART.padding.left + (goalsPercent / 100) * plotW
const scaleY = (score360: number) => CHART.padding.top + plotH - ((score360 - 1) / 4) * plotH // 1-5 range

// Guide lines
const guideX = scaleX(GOALS_THRESHOLDS.SCATTER_GOALS_LINE) // 50%
const guideY = scaleY(GOALS_THRESHOLDS.SCATTER_SCORE_LINE)  // 3.0

// ════════════════════════════════════════════════════════════════════════════
// QUADRANT CARD
// ════════════════════════════════════════════════════════════════════════════

const QUADRANT_ORDER: { key: CorrelationQuadrant; countKey: keyof AnalisisTabProps['quadrantCounts'] }[] = [
  { key: 'CONSISTENT', countKey: 'consistent' },
  { key: 'PERCEPTION_BIAS', countKey: 'perceptionBias' },
  { key: 'HIDDEN_PERFORMER', countKey: 'hiddenPerformer' },
  { key: 'DOUBLE_RISK', countKey: 'doubleRisk' },
]

// ════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ════════════════════════════════════════════════════════════════════════════

export default memo(function AnalisisTab({ correlation, quadrantCounts }: AnalisisTabProps) {
  const [activeFilter, setActiveFilter] = useState<CorrelationQuadrant | null>(null)
  const [hoveredDot, setHoveredDot] = useState<CorrelationPoint | null>(null)

  // Filter out NO_GOALS for scatter
  const withGoals = useMemo(() =>
    correlation.filter(c => c.quadrant !== 'NO_GOALS')
  , [correlation])

  // Apply filter
  const visibleDots = useMemo(() =>
    activeFilter ? withGoals.filter(c => c.quadrant === activeFilter) : withGoals
  , [withGoals, activeFilter])

  // Not enough data
  if (withGoals.length < GOALS_THRESHOLDS.MIN_FOR_SCATTER) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-500">
        <p className="text-sm font-light">Menos de {GOALS_THRESHOLDS.MIN_FOR_SCATTER} empleados con metas.</p>
        <p className="text-xs text-slate-600 mt-1">El scatter plot requiere más datos para ser útil.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Quadrant Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {QUADRANT_ORDER.map(({ key, countKey }) => {
          const config = QUADRANT_CONFIG[key]
          const count = quadrantCounts[countKey]
          const isActive = activeFilter === key

          return (
            <button
              key={key}
              onClick={() => setActiveFilter(isActive ? null : key)}
              className={cn(
                'rounded-xl border p-3 text-center transition-all',
                'bg-slate-800/30 backdrop-blur-xl',
                isActive
                  ? 'border-slate-600 ring-1 ring-slate-600'
                  : 'border-slate-800/40 hover:border-slate-700/50'
              )}
            >
              <p className={cn('text-xl font-mono font-medium', config.color)}>
                {count}
              </p>
              <p className="text-[9px] text-slate-500 mt-0.5">{config.label}</p>
            </button>
          )
        })}
      </div>

      {/* NO_GOALS count */}
      {quadrantCounts.noGoals > 0 && (
        <p className="text-[10px] text-slate-600 text-center">
          {quadrantCounts.noGoals} persona{quadrantCounts.noGoals > 1 ? 's' : ''} sin metas asignadas (no incluidas en el gráfico)
        </p>
      )}

      {/* Scatter Plot SVG */}
      <div className="relative rounded-xl border border-slate-800/40 bg-slate-900/30 backdrop-blur-xl p-2 overflow-hidden">
        <svg
          viewBox={`0 0 ${CHART.width} ${CHART.height}`}
          className="w-full h-auto"
          style={{ maxHeight: '400px' }}
        >
          {/* Background zones */}
          {/* Top-left: HIDDEN_PERFORMER */}
          <rect
            x={CHART.padding.left} y={CHART.padding.top}
            width={guideX - CHART.padding.left} height={guideY - CHART.padding.top}
            fill={QUADRANT_CONFIG.HIDDEN_PERFORMER.bgColor}
          />
          {/* Top-right: CONSISTENT */}
          <rect
            x={guideX} y={CHART.padding.top}
            width={CHART.padding.left + plotW - guideX} height={guideY - CHART.padding.top}
            fill={QUADRANT_CONFIG.CONSISTENT.bgColor}
          />
          {/* Bottom-left: DOUBLE_RISK */}
          <rect
            x={CHART.padding.left} y={guideY}
            width={guideX - CHART.padding.left} height={CHART.padding.top + plotH - guideY}
            fill={QUADRANT_CONFIG.DOUBLE_RISK.bgColor}
          />
          {/* Bottom-right: PERCEPTION_BIAS */}
          <rect
            x={guideX} y={guideY}
            width={CHART.padding.left + plotW - guideX} height={CHART.padding.top + plotH - guideY}
            fill={QUADRANT_CONFIG.PERCEPTION_BIAS.bgColor}
          />

          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map(v => (
            <line key={`gx-${v}`}
              x1={scaleX(v)} y1={CHART.padding.top}
              x2={scaleX(v)} y2={CHART.padding.top + plotH}
              stroke="#1e293b" strokeWidth={1}
            />
          ))}
          {[1, 2, 3, 4, 5].map(v => (
            <line key={`gy-${v}`}
              x1={CHART.padding.left} y1={scaleY(v)}
              x2={CHART.padding.left + plotW} y2={scaleY(v)}
              stroke="#1e293b" strokeWidth={1}
            />
          ))}

          {/* Guide lines (dashed) */}
          <line
            x1={guideX} y1={CHART.padding.top}
            x2={guideX} y2={CHART.padding.top + plotH}
            stroke="#475569" strokeWidth={1} strokeDasharray="6 4"
          />
          <line
            x1={CHART.padding.left} y1={guideY}
            x2={CHART.padding.left + plotW} y2={guideY}
            stroke="#475569" strokeWidth={1} strokeDasharray="6 4"
          />

          {/* Axis labels — X */}
          {[0, 25, 50, 75, 100].map(v => (
            <text key={`lx-${v}`}
              x={scaleX(v)} y={CHART.height - 8}
              fill="#64748b" fontSize={10} textAnchor="middle"
            >
              {v}%
            </text>
          ))}
          <text
            x={CHART.padding.left + plotW / 2} y={CHART.height}
            fill="#94a3b8" fontSize={10} textAnchor="middle"
          >
            Cumplimiento Metas
          </text>

          {/* Axis labels — Y */}
          {[1, 2, 3, 4, 5].map(v => (
            <text key={`ly-${v}`}
              x={CHART.padding.left - 8} y={scaleY(v) + 3}
              fill="#64748b" fontSize={10} textAnchor="end"
            >
              {v}.0
            </text>
          ))}
          <text
            x={12} y={CHART.padding.top + plotH / 2}
            fill="#94a3b8" fontSize={10} textAnchor="middle"
            transform={`rotate(-90, 12, ${CHART.padding.top + plotH / 2})`}
          >
            Score 360°
          </text>

          {/* Data dots */}
          {visibleDots.map((point, idx) => {
            if (point.goalsPercent === null) return null
            const cx = scaleX(Math.min(100, Math.max(0, point.goalsPercent)))
            const cy = scaleY(Math.min(5, Math.max(1, point.score360)))
            const config = QUADRANT_CONFIG[point.quadrant]
            const isHovered = hoveredDot?.employeeId === point.employeeId

            return (
              <circle
                key={point.employeeId}
                cx={cx} cy={cy}
                r={isHovered ? 6 : 4}
                className={cn(config.dotColor, 'transition-all duration-150 cursor-pointer')}
                opacity={isHovered ? 1 : 0.7}
                stroke={isHovered ? '#fff' : 'none'}
                strokeWidth={isHovered ? 1.5 : 0}
                onMouseEnter={() => setHoveredDot(point)}
                onMouseLeave={() => setHoveredDot(null)}
              />
            )
          })}
        </svg>

        {/* Tooltip */}
        {hoveredDot && hoveredDot.goalsPercent !== null && (
          <div
            className="absolute z-10 px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 shadow-xl pointer-events-none"
            style={{
              left: `${(scaleX(hoveredDot.goalsPercent) / CHART.width) * 100}%`,
              top: `${(scaleY(hoveredDot.score360) / CHART.height) * 100 - 12}%`,
              transform: 'translate(-50%, -100%)',
            }}
          >
            <p className="text-xs text-white font-medium truncate max-w-[200px]">{hoveredDot.employeeName}</p>
            <p className="text-[10px] text-slate-400">
              Metas: <span className="text-cyan-400 font-mono">{Math.round(hoveredDot.goalsPercent)}%</span>
              {' · '}360°: <span className="text-amber-400 font-mono">{hoveredDot.score360.toFixed(1)}</span>
            </p>
            <p className="text-[9px] text-slate-500">{hoveredDot.departmentName}</p>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-4 text-[9px] text-slate-500">
        {QUADRANT_ORDER.map(({ key }) => {
          const config = QUADRANT_CONFIG[key]
          return (
            <span key={key} className="flex items-center gap-1.5">
              <span className={cn('w-2 h-2 rounded-full', config.dotColor.replace('fill-', 'bg-'))} />
              {config.label}
            </span>
          )
        })}
      </div>
    </div>
  )
})
