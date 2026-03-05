'use client'

// ════════════════════════════════════════════════════════════════════════════
// BELL CURVE CHART - Gráfico de distribución Target vs Real
// ════════════════════════════════════════════════════════════════════════════

import { Zap } from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer
} from 'recharts'
import type { ChartDataPoint } from '../CalibrationHealth.types'

// ════════════════════════════════════════════════════════════════════════════
// CHART
// ════════════════════════════════════════════════════════════════════════════

interface BellCurveChartProps {
  data: ChartDataPoint[]
  height?: number
}

export function BellCurveChart({ data, height = 110 }: BellCurveChartProps) {
  return (
    <div className="rounded-2xl bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
          Distribución
        </span>
        <div className="flex items-center gap-4 text-[10px]">
          <span className="flex items-center gap-1.5">
            <span className="w-6 h-[2px] border-t-2 border-dashed border-cyan-500/60" />
            <span className="text-slate-500">Target</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-6 h-[2px] bg-purple-400 rounded" />
            <span className="text-slate-500">Real</span>
          </span>
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="gradientRealCalib" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#A78BFA" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#A78BFA" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="gradientTargetCalib" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22D3EE" stopOpacity={0.1} />
              <stop offset="95%" stopColor="#22D3EE" stopOpacity={0} />
            </linearGradient>
          </defs>

          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#64748B', fontSize: 10 }}
            dy={5}
          />
          <YAxis hide domain={[0, 50]} />

          <Area
            type="monotone"
            dataKey="target"
            stroke="#22D3EE"
            strokeWidth={2}
            strokeDasharray="5 3"
            fill="url(#gradientTargetCalib)"
            fillOpacity={1}
            animationDuration={800}
            dot={false}
          />

          <Area
            type="monotone"
            dataKey="real"
            stroke="#A78BFA"
            strokeWidth={2.5}
            fill="url(#gradientRealCalib)"
            fillOpacity={1}
            animationDuration={1200}
            animationBegin={300}
            dot={{ fill: '#A78BFA', r: 3, strokeWidth: 0 }}
            activeDot={{ fill: '#A78BFA', r: 5, stroke: '#A78BFA', strokeWidth: 2, strokeOpacity: 0.3 }}
          />

          <Tooltip content={<ChartTooltip />} cursor={false} />
        </AreaChart>
      </ResponsiveContainer>

      {/* Insight */}
      <div className="mt-2 pt-2 border-t border-slate-700/30">
        <DeviationInsight chartData={data} />
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// TOOLTIP
// ════════════════════════════════════════════════════════════════════════════

function ChartTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  if (!d) return null

  const diff = d.real - d.target
  const diffColor = Math.abs(diff) <= 5 ? '#10B981' : diff > 0 ? '#F59E0B' : '#EF4444'

  return (
    <div className="px-3 py-2 rounded-lg bg-slate-900/95 border border-slate-700/50 backdrop-blur-xl shadow-xl">
      <p className="text-[11px] font-medium text-slate-300 mb-1">{d.label}</p>
      <div className="flex items-center gap-3 text-[10px]">
        <span className="text-cyan-400">Target: {d.target}%</span>
        <span className="text-purple-400">Real: {d.real}%</span>
        <span style={{ color: diffColor }}>({diff > 0 ? '+' : ''}{diff}%)</span>
      </div>
      <p className="text-[9px] text-slate-500 mt-0.5">{d.count} personas</p>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// DEVIATION INSIGHT
// ════════════════════════════════════════════════════════════════════════════

function DeviationInsight({ chartData }: { chartData: ChartDataPoint[] }) {
  let maxDev = { label: '', diff: 0 }
  for (const d of chartData) {
    if (Math.abs(d.deviation) > Math.abs(maxDev.diff)) {
      maxDev = { label: d.label, diff: d.deviation }
    }
  }

  const isHealthy = chartData.every(d => Math.abs(d.deviation) <= 10)

  if (isHealthy) {
    return (
      <p className="text-[10px] text-emerald-400/80 flex items-center gap-1.5">
        <Zap size={12} />
        Distribución alineada con el estándar industria (McKinsey 10-20-40-20-10)
      </p>
    )
  }

  return (
    <p className="text-[10px] text-amber-400/80 flex items-center gap-1.5">
      <Zap size={12} />
      {maxDev.label} {maxDev.diff > 0 ? 'excedido' : 'bajo'} por {Math.abs(maxDev.diff)}% vs target
    </p>
  )
}
