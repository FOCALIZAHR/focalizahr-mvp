// ════════════════════════════════════════════════════════════════════════════
// DiamondVisual - Radar AAE (Aspiración, Capacidad, Compromiso)
// src/components/calibration/cinema/DiamondVisual.tsx
// ════════════════════════════════════════════════════════════════════════════
// Muestra los 3 factores AAE en un RadarChart triangular.
// Estados: vacío, incompleto (badge amarillo), conflicto (badge rojo pulsante).
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { memo, useMemo } from 'react'
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from 'recharts'
import { cn } from '@/lib/utils'
import { AlertTriangle } from 'lucide-react'

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

interface DiamondVisualProps {
  aspiration: 1 | 2 | 3 | null
  ability: 1 | 2 | 3 | null
  engagement: 1 | 2 | 3 | null
  conflicts?: Array<'aspiration' | 'ability' | 'engagement'>
  size?: 'sm' | 'md' | 'lg'
  showLegend?: boolean
  className?: string
}

// ════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ════════════════════════════════════════════════════════════════════════════

const SIZES = {
  sm: { width: 120, height: 120, fontSize: 10, dotSize: 3 },
  md: { width: 160, height: 160, fontSize: 11, dotSize: 4 },
  lg: { width: 220, height: 220, fontSize: 12, dotSize: 5 },
}

const VALUE_COLORS: Record<string, string> = {
  '3': 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30',
  '2': 'text-amber-400 bg-amber-500/20 border-amber-500/30',
  '1': 'text-rose-400 bg-rose-500/20 border-rose-500/30',
  'null': 'text-slate-500 bg-slate-500/20 border-slate-500/30',
}

// ════════════════════════════════════════════════════════════════════════════
// FACTOR PILL (leyenda)
// ════════════════════════════════════════════════════════════════════════════

const FactorPill = memo(function FactorPill({
  label,
  value,
  isConflict,
}: {
  label: string
  value: 1 | 2 | 3 | null
  isConflict: boolean
}) {
  const colorClass = VALUE_COLORS[String(value ?? 'null')]

  return (
    <div
      className={cn(
        'flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border',
        colorClass,
        isConflict && 'ring-2 ring-rose-500 ring-offset-1 ring-offset-[#0B1120]'
      )}
    >
      <span>{label}:</span>
      <span>{value ?? '\u2014'}</span>
    </div>
  )
})

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════

export default memo(function DiamondVisual({
  aspiration,
  ability,
  engagement,
  conflicts = [],
  size = 'md',
  showLegend = false,
  className,
}: DiamondVisualProps) {
  const sizeConfig = SIZES[size]

  const chartData = useMemo(() => [
    {
      factor: 'Aspiración',
      value: aspiration ?? 0,
      fullMark: 3,
    },
    {
      factor: 'Capacidad',
      value: ability ?? 0,
      fullMark: 3,
    },
    {
      factor: 'Compromiso',
      value: engagement ?? 0,
      fullMark: 3,
    },
  ], [aspiration, ability, engagement])

  const hasAnyData = aspiration !== null || ability !== null || engagement !== null
  const isComplete = aspiration !== null && ability !== null && engagement !== null
  const hasConflicts = conflicts.length > 0

  // Estado vacío
  if (!hasAnyData) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center bg-[#111827]/60 rounded-lg border border-slate-800',
          className
        )}
        style={{ width: sizeConfig.width, height: sizeConfig.height }}
      >
        <AlertTriangle size={20} className="text-slate-600 mb-1.5" />
        <span className="text-[10px] text-slate-500 text-center px-2">
          Sin evaluación AAE
        </span>
      </div>
    )
  }

  return (
    <div className={cn('relative', className)}>
      {/* Badge de datos incompletos */}
      {!isComplete && (
        <div className="absolute -top-1 -right-1 z-10">
          <div className="w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center">
            <span className="text-[8px] font-bold text-slate-900">!</span>
          </div>
        </div>
      )}

      {/* Badge de conflictos */}
      {hasConflicts && (
        <div className="absolute -top-1 -left-1 z-10">
          <div className="w-4 h-4 bg-rose-500 rounded-full flex items-center justify-center animate-pulse">
            <AlertTriangle size={10} className="text-white" />
          </div>
        </div>
      )}

      {/* RadarChart */}
      <div style={{ width: sizeConfig.width, height: sizeConfig.height }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={chartData} margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
            <defs>
              <linearGradient id="diamondGradient" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#22D3EE" stopOpacity={0.6} />
                <stop offset="50%" stopColor="#3B82F6" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#A78BFA" stopOpacity={0.6} />
              </linearGradient>
            </defs>

            <PolarGrid
              stroke="#1e293b"
              strokeDasharray="3 3"
            />

            <PolarAngleAxis
              dataKey="factor"
              tick={{
                fill: '#94A3B8',
                fontSize: sizeConfig.fontSize,
                fontWeight: 500,
              }}
            />

            <PolarRadiusAxis
              angle={90}
              domain={[0, 3]}
              tick={{ fill: '#64748B', fontSize: 8 }}
              tickCount={4}
              axisLine={false}
            />

            <Radar
              name="AAE"
              dataKey="value"
              stroke="#22D3EE"
              fill="url(#diamondGradient)"
              fillOpacity={0.4}
              strokeWidth={2}
              dot={{
                r: sizeConfig.dotSize,
                fill: '#22D3EE',
                stroke: '#0f172a',
                strokeWidth: 2,
              }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      {showLegend && (
        <div className="flex justify-center gap-2 mt-2">
          <FactorPill label="A" value={aspiration} isConflict={conflicts.includes('aspiration')} />
          <FactorPill label="C" value={ability} isConflict={conflicts.includes('ability')} />
          <FactorPill label="E" value={engagement} isConflict={conflicts.includes('engagement')} />
        </div>
      )}
    </div>
  )
})
