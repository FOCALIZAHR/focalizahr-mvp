// ════════════════════════════════════════════════════════════════════════════
// DiamondVisual - Radar AAE (Aspiración, Capacidad, Compromiso)
// src/components/calibration/cinema/DiamondVisual.tsx
// ════════════════════════════════════════════════════════════════════════════
// REDISEÑO v2.0 - Filosofía Tesla/Apple FocalizaHR
// Muestra los 3 factores AAE en un RadarChart triangular.
// Indicadores sutiles: sin badges gritones, señales elegantes.
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
// CONSTANTS - Colores más sutiles y elegantes
// ════════════════════════════════════════════════════════════════════════════

const SIZES = {
  sm: { width: 120, height: 120, fontSize: 10, dotSize: 3 },
  md: { width: 160, height: 160, fontSize: 11, dotSize: 4 },
  lg: { width: 220, height: 220, fontSize: 12, dotSize: 5 },
}

// Colores más desaturados y elegantes - línea Tesla
const VALUE_COLORS: Record<string, string> = {
  '3': 'text-emerald-400/80 bg-emerald-500/10 border-emerald-500/20',
  '2': 'text-amber-400/80 bg-amber-500/10 border-amber-500/20',
  '1': 'text-rose-400/80 bg-rose-500/10 border-rose-500/20',
  'null': 'text-slate-500/80 bg-slate-500/10 border-slate-500/20',
}

// ════════════════════════════════════════════════════════════════════════════
// FACTOR PILL (leyenda) - Más sutil y minimalista
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
        'flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-medium border',
        colorClass,
        // Conflicto: borde sutil pulsante, no ring agresivo
        isConflict && 'border-rose-500/40 animate-pulse'
      )}
    >
      <span className="opacity-70">{label}:</span>
      <span className="font-semibold">{value ?? '\u2014'}</span>
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

  // Estado vacío - minimalista
  if (!hasAnyData) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center',
          'bg-slate-800/30 rounded-lg border border-slate-700/30',
          className
        )}
        style={{ width: sizeConfig.width, height: sizeConfig.height }}
      >
        <span className="text-[10px] text-slate-500 text-center px-2">
          Sin evaluación
        </span>
      </div>
    )
  }

  return (
    <div className={cn('relative', className)}>
      {/* Indicador de datos incompletos - punto sutil, no badge gritón */}
      {!isComplete && (
        <div className="absolute -top-0.5 -right-0.5 z-10">
          <div className="w-2 h-2 bg-amber-500/60 rounded-full" />
        </div>
      )}

      {/* Indicador de conflictos - línea lateral sutil, no badge pulsante */}
      {hasConflicts && (
        <div className="absolute top-0 left-0 w-0.5 h-full bg-gradient-to-b from-rose-500/50 via-rose-500/30 to-transparent rounded-full" />
      )}

      {/* RadarChart */}
      <div style={{ width: sizeConfig.width, height: sizeConfig.height }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={chartData} margin={{ top: 12, right: 12, bottom: 12, left: 12 }}>
            <defs>
              <linearGradient id="diamondGradient" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#22D3EE" stopOpacity={0.5} />
                <stop offset="50%" stopColor="#3B82F6" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#A78BFA" stopOpacity={0.5} />
              </linearGradient>
            </defs>

            <PolarGrid
              stroke="#334155"
              strokeDasharray="2 4"
              strokeOpacity={0.5}
            />

            <PolarAngleAxis
              dataKey="factor"
              tick={{
                fill: '#64748B',
                fontSize: sizeConfig.fontSize,
                fontWeight: 400,
              }}
            />

            <PolarRadiusAxis
              angle={90}
              domain={[0, 3]}
              tick={{ fill: '#475569', fontSize: 8 }}
              tickCount={4}
              axisLine={false}
            />

            <Radar
              name="AAE"
              dataKey="value"
              stroke="#22D3EE"
              fill="url(#diamondGradient)"
              fillOpacity={0.35}
              strokeWidth={1.5}
              strokeOpacity={0.8}
              dot={{
                r: sizeConfig.dotSize,
                fill: '#22D3EE',
                stroke: '#0f172a',
                strokeWidth: 2,
                fillOpacity: 0.9,
              }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend - más sutil */}
      {showLegend && (
        <div className="flex justify-center gap-1.5 mt-2">
          <FactorPill label="A" value={aspiration} isConflict={conflicts.includes('aspiration')} />
          <FactorPill label="C" value={ability} isConflict={conflicts.includes('ability')} />
          <FactorPill label="E" value={engagement} isConflict={conflicts.includes('engagement')} />
        </div>
      )}
    </div>
  )
})