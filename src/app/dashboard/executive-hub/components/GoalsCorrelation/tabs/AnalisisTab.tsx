'use client'

// ════════════════════════════════════════════════════════════════════════════
// GOALS CORRELATION — Tab Análisis V2 (Scatter RoleFit × Metas)
// src/app/dashboard/executive-hub/components/GoalsCorrelation/tabs/AnalisisTab.tsx
// ════════════════════════════════════════════════════════════════════════════
// Eje X: goalsPercent (0-100) | Eje Y: roleFitScore (0-100)
// Color del dot: score360 (verde=alto, rojo=bajo)
// 4 zonas + líneas guía + dots interactivos + glow
// ════════════════════════════════════════════════════════════════════════════

import { memo, useState, useMemo } from 'react'
import { cn } from '@/lib/utils'
import type { CorrelationPoint } from '../GoalsCorrelation.types'
import type { CorrelationQuadrant } from '@/lib/services/GoalsDiagnosticService'
import { QUADRANT_CONFIG } from '../GoalsCorrelation.constants'
import { GOALS_THRESHOLDS } from '@/lib/services/GoalsDiagnosticService'
import { getQuadrantNarrative } from '@/config/narratives/GoalsNarrativeDictionary'

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

// Scales — V2: X=Metas (0-100), Y=RoleFit (0-100)
const scaleX = (goalsPercent: number) => CHART.padding.left + (goalsPercent / 100) * plotW
const scaleY = (roleFit: number) => CHART.padding.top + plotH - (roleFit / 100) * plotH

// Guide lines: Metas=50%, RoleFit=75 (ROLEFIT_THRESHOLD)
const guideX = scaleX(GOALS_THRESHOLDS.SCATTER_GOALS_LINE) // 50%
const guideY = scaleY(75) // RoleFit threshold

// 360° score → dot color (gradient green to red)
function score360ToColor(score: number): string {
  if (score >= 4.0) return '#10B981' // emerald — alto
  if (score >= 3.0) return '#22D3EE' // cyan — medio-alto
  if (score >= 2.0) return '#F59E0B' // amber — medio-bajo
  return '#EF4444'                    // red — bajo
}

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

  const withGoals = useMemo(() =>
    correlation.filter(c => c.quadrant !== 'NO_GOALS')
  , [correlation])

  const visibleDots = useMemo(() =>
    activeFilter ? withGoals.filter(c => c.quadrant === activeFilter) : withGoals
  , [withGoals, activeFilter])

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
          const quadNarr = getQuadrantNarrative(key)

          return (
            <button
              key={key}
              onClick={() => setActiveFilter(isActive ? null : key)}
              className={cn(
                'rounded-xl border p-3 text-center transition-all relative group',
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

              {quadNarr && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 w-56 text-left">
                  <p className="text-[10px] text-slate-300 leading-relaxed">{quadNarr.explanation}</p>
                  <p className="text-[9px] text-slate-500 mt-1 leading-relaxed">{quadNarr.implication}</p>
                </div>
              )}
            </button>
          )
        })}
      </div>

      {quadrantCounts.noGoals > 0 && (
        <p className="text-[10px] text-slate-600 text-center">
          {quadrantCounts.noGoals} persona{quadrantCounts.noGoals > 1 ? 's' : ''} sin metas asignadas (no incluidas)
        </p>
      )}

      {/* Scatter Plot — RoleFit × Metas, color = 360° */}
      <div className="fhr-card relative p-3 overflow-hidden">
        <div
          className="absolute top-0 left-0 right-0 h-[2px] z-10"
          style={{
            background: 'linear-gradient(90deg, transparent, #22D3EE, #A78BFA, transparent)',
            boxShadow: '0 0 15px #22D3EE',
          }}
        />
        <svg
          viewBox={`0 0 ${CHART.width} ${CHART.height}`}
          className="w-full h-auto"
          style={{ maxHeight: '400px' }}
        >
          {/* Background zones — adapted for RoleFit Y axis */}
          {/* Top-left: High RoleFit + Low Goals → "Sabe pero no entrega" */}
          <rect
            x={CHART.padding.left} y={CHART.padding.top}
            width={guideX - CHART.padding.left} height={guideY - CHART.padding.top}
            fill="rgba(245, 158, 11, 0.06)"
          />
          {/* Top-right: High RoleFit + High Goals → "Consistente" */}
          <rect
            x={guideX} y={CHART.padding.top}
            width={CHART.padding.left + plotW - guideX} height={guideY - CHART.padding.top}
            fill="rgba(16, 185, 129, 0.06)"
          />
          {/* Bottom-left: Low RoleFit + Low Goals → "Doble Riesgo" */}
          <rect
            x={CHART.padding.left} y={guideY}
            width={guideX - CHART.padding.left} height={CHART.padding.top + plotH - guideY}
            fill="rgba(239, 68, 68, 0.06)"
          />
          {/* Bottom-right: Low RoleFit + High Goals → "Sobrevivientes" */}
          <rect
            x={guideX} y={guideY}
            width={CHART.padding.left + plotW - guideX} height={CHART.padding.top + plotH - guideY}
            fill="rgba(167, 139, 250, 0.06)"
          />

          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map(v => (
            <line key={`gx-${v}`}
              x1={scaleX(v)} y1={CHART.padding.top}
              x2={scaleX(v)} y2={CHART.padding.top + plotH}
              stroke="#1e293b" strokeWidth={1}
            />
          ))}
          {[0, 25, 50, 75, 100].map(v => (
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

          {/* Axis labels — X (Metas) */}
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

          {/* Axis labels — Y (RoleFit) */}
          {[0, 25, 50, 75, 100].map(v => (
            <text key={`ly-${v}`}
              x={CHART.padding.left - 8} y={scaleY(v) + 3}
              fill="#64748b" fontSize={10} textAnchor="end"
            >
              {v}
            </text>
          ))}
          <text
            x={12} y={CHART.padding.top + plotH / 2}
            fill="#94a3b8" fontSize={10} textAnchor="middle"
            transform={`rotate(-90, 12, ${CHART.padding.top + plotH / 2})`}
          >
            RoleFit Score
          </text>

          {/* Glow filter */}
          <defs>
            <filter id="dotGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Data dots — color = 360° score */}
          {visibleDots.map((point) => {
            if (point.goalsPercent === null || point.roleFitScore === null) return null
            const cx = scaleX(Math.min(100, Math.max(0, point.goalsPercent)))
            const cy = scaleY(Math.min(100, Math.max(0, point.roleFitScore)))
            const dotColor = score360ToColor(point.score360)
            const isHovered = hoveredDot?.employeeId === point.employeeId

            return (
              <circle
                key={point.employeeId}
                cx={cx} cy={cy}
                r={isHovered ? 6 : 4}
                fill={dotColor}
                className="transition-all duration-150 cursor-pointer"
                opacity={isHovered ? 1 : 0.75}
                stroke={isHovered ? '#fff' : 'none'}
                strokeWidth={isHovered ? 1.5 : 0}
                filter={isHovered ? 'url(#dotGlow)' : undefined}
                onMouseEnter={() => setHoveredDot(point)}
                onMouseLeave={() => setHoveredDot(null)}
              />
            )
          })}
        </svg>

        {/* Tooltip */}
        {hoveredDot && hoveredDot.goalsPercent !== null && hoveredDot.roleFitScore !== null && (
          <div
            className="absolute z-10 px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 shadow-xl pointer-events-none"
            style={{
              left: `${(scaleX(hoveredDot.goalsPercent) / CHART.width) * 100}%`,
              top: `${(scaleY(hoveredDot.roleFitScore) / CHART.height) * 100 - 12}%`,
              transform: 'translate(-50%, -100%)',
            }}
          >
            <p className="text-xs text-white font-medium truncate max-w-[200px]">{hoveredDot.employeeName}</p>
            <p className="text-[10px] text-slate-400">
              Metas: <span className="text-cyan-400 font-mono">{Math.round(hoveredDot.goalsPercent)}%</span>
              {' · '}RoleFit: <span className="text-purple-400 font-mono">{Math.round(hoveredDot.roleFitScore)}</span>
              {' · '}360°: <span style={{ color: score360ToColor(hoveredDot.score360) }} className="font-mono">{hoveredDot.score360.toFixed(1)}</span>
            </p>
            <p className="text-[9px] text-slate-500">{hoveredDot.departmentName}</p>
          </div>
        )}
      </div>

      {/* Legend — 360° color scale */}
      <div className="flex flex-wrap items-center justify-center gap-4 text-[9px] text-slate-500">
        <span className="text-slate-600 mr-1">Color = Score 360°:</span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          ≥4.0
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-cyan-400" />
          3.0-3.9
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          2.0-2.9
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-red-400" />
          &lt;2.0
        </span>
      </div>
    </div>
  )
})
