// ════════════════════════════════════════════════════════════════════════════
// DISTRIBUTION GAUGE - Curva Gauss: Target vs Real en Vivo
// src/components/performance/DistributionGauge.tsx
// ════════════════════════════════════════════════════════════════════════════
// FILOSOFÍA: "Entender en 3 segundos. Decidir en 10 segundos."
// INSPIRACIÓN: Tesla energy dashboard + Apple Health trends
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { memo, useMemo } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer
} from 'recharts'

// ════════════════════════════════════════════════════════════════════════════
// DISTRIBUCIÓN ESTÁNDAR INDUSTRIA (McKinsey 10-20-40-20-10)
// ════════════════════════════════════════════════════════════════════════════

const INDUSTRY_DISTRIBUTION = [
  { score: 1, label: 'Bajo',       targetPct: 10 },
  { score: 2, label: 'Desarrollo', targetPct: 20 },
  { score: 3, label: 'Sólido',     targetPct: 40 },
  { score: 4, label: 'Alto',       targetPct: 20 },
  { score: 5, label: 'Excepcional', targetPct: 10 },
]

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

interface DistributionGaugeProps {
  /** Array de potentialScores asignados (ej: [3, 4, 5, 3, 2, 4, ...]) */
  assignedScores: number[]
  /** Mínimo de asignaciones para mostrar el gráfico */
  minToShow?: number
}

interface ChartDataItem {
  score: number
  label: string
  target: number
  real: number
  count: number
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE
// ════════════════════════════════════════════════════════════════════════════

export default memo(function DistributionGauge({
  assignedScores,
  minToShow = 3
}: DistributionGaugeProps) {

  // Calcular distribución real
  const chartData = useMemo(() => {
    const total = assignedScores.length || 1

    return INDUSTRY_DISTRIBUTION.map(item => {
      const count = assignedScores.filter(s => s === item.score).length
      const realPct = Math.round((count / total) * 100)

      return {
        score: item.score,
        label: item.label,
        target: item.targetPct,
        real: realPct,
        count,
      }
    })
  }, [assignedScores])

  // Mostrar mensaje si hay pocas asignaciones
  if (assignedScores.length < minToShow) {
    return (
      <div className="p-3 rounded-lg bg-slate-800/30 border border-slate-700/30">
        <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1">
          Distribución
        </p>
        <p className="text-xs text-slate-500">
          Asigna al menos <span className="text-cyan-400 font-medium">{minToShow}</span> potenciales para ver la curva
        </p>
        <p className="text-[10px] text-slate-600 mt-1">
          {assignedScores.length}/{minToShow} asignados
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
          Distribución
        </span>
        <div className="flex items-center gap-3 text-[10px]">
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-[2px] border-t-2 border-dashed border-cyan-500/60" />
            <span className="text-slate-500">Target</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-[2px] bg-purple-400 rounded" />
            <span className="text-slate-500">Real</span>
          </span>
        </div>
      </div>

      {/* Gráfico Curva Gauss */}
      <div className="relative">
        <ResponsiveContainer width="100%" height={80}>
          <AreaChart
            data={chartData}
            margin={{ top: 5, right: 5, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="gradientReal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#A78BFA" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#A78BFA" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="gradientTarget" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22D3EE" stopOpacity={0.1} />
                <stop offset="95%" stopColor="#22D3EE" stopOpacity={0} />
              </linearGradient>
            </defs>

            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#64748B', fontSize: 9 }}
              dy={2}
            />

            <YAxis hide domain={[0, 50]} />

            {/* Curva Target — línea discontinua cyan */}
            <Area
              type="monotone"
              dataKey="target"
              stroke="#22D3EE"
              strokeWidth={1.5}
              strokeDasharray="4 3"
              fill="url(#gradientTarget)"
              fillOpacity={1}
              animationDuration={800}
              dot={false}
            />

            {/* Curva Real — línea sólida púrpura brillante */}
            <Area
              type="monotone"
              dataKey="real"
              stroke="#A78BFA"
              strokeWidth={2}
              fill="url(#gradientReal)"
              fillOpacity={1}
              animationDuration={1200}
              animationBegin={300}
              dot={{
                fill: '#A78BFA',
                r: 2.5,
                strokeWidth: 0
              }}
              activeDot={{
                fill: '#A78BFA',
                r: 4,
                stroke: '#A78BFA',
                strokeWidth: 2,
                strokeOpacity: 0.3
              }}
            />

            <Tooltip
              content={<CustomTooltip />}
              cursor={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Resumen rápido (1 línea) */}
      <DistributionSummary chartData={chartData} total={assignedScores.length} />
    </div>
  )
})

// ════════════════════════════════════════════════════════════════════════════
// CUSTOM TOOLTIP
// ════════════════════════════════════════════════════════════════════════════

interface TooltipProps {
  active?: boolean
  payload?: Array<{
    payload: ChartDataItem
  }>
}

function CustomTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload?.length) return null

  const data = payload[0]?.payload
  if (!data) return null

  const diff = data.real - data.target
  const diffColor = Math.abs(diff) <= 5 ? '#10B981' : diff > 0 ? '#F59E0B' : '#EF4444'

  return (
    <div className="px-3 py-2 rounded-lg bg-slate-900/95 border border-slate-700/50 backdrop-blur-xl shadow-xl">
      <p className="text-[11px] font-medium text-slate-300 mb-1">
        Potencial {data.score}: {data.label}
      </p>
      <div className="flex items-center gap-3 text-[10px]">
        <span className="text-cyan-400">
          Target: {data.target}%
        </span>
        <span className="text-purple-400">
          Real: {data.real}%
        </span>
        <span style={{ color: diffColor }}>
          ({diff > 0 ? '+' : ''}{diff}%)
        </span>
      </div>
      <p className="text-[9px] text-slate-500 mt-0.5">
        {data.count} persona{data.count !== 1 ? 's' : ''}
      </p>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// DISTRIBUTION SUMMARY - Una línea de insight
// ════════════════════════════════════════════════════════════════════════════

function DistributionSummary({
  chartData
}: {
  chartData: ChartDataItem[]
  total: number
}) {
  // Encontrar la mayor desviación
  let maxDev = { label: '', diff: 0, direction: '' }
  for (const d of chartData) {
    const diff = Math.abs(d.real - d.target)
    if (diff > Math.abs(maxDev.diff)) {
      maxDev = {
        label: d.label,
        diff: d.real - d.target,
        direction: d.real > d.target ? 'excedido' : 'bajo'
      }
    }
  }

  // Si todas las desviaciones son ≤8%, la distribución es saludable
  const isHealthy = chartData.every(d => Math.abs(d.real - d.target) <= 8)

  if (isHealthy) {
    return (
      <p className="text-[10px] text-emerald-400/80">
        ✓ Distribución alineada con el estándar industria
      </p>
    )
  }

  return (
    <p className="text-[10px] text-amber-400/80">
      ⚡ {maxDev.label} {maxDev.direction} por {Math.abs(maxDev.diff)}% vs target
    </p>
  )
}
