// ════════════════════════════════════════════════════════════════════════════
// CALIBRATION COMPARISON CHART - Before/After overlay
// src/components/calibration/closing/CalibrationComparisonChart.tsx
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { memo, useMemo } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip
} from 'recharts'

interface CalibrationComparisonChartProps {
  originalDistribution: number[]
  calibratedDistribution: number[]
}

export default memo(function CalibrationComparisonChart({
  originalDistribution,
  calibratedDistribution
}: CalibrationComparisonChartProps) {

  const chartData = useMemo(() => {
    const labels = ['Bajo', 'Desarrollo', 'Sólido', 'Alto', 'Excepcional']

    return labels.map((label, idx) => ({
      label,
      original: originalDistribution[idx] || 0,
      calibrated: calibratedDistribution[idx] || 0
    }))
  }, [originalDistribution, calibratedDistribution])

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
      <div className="mb-4">
        <h3 className="text-sm font-medium text-slate-300 mb-1">
          Distribución de Potencial: Antes vs Después
        </h3>
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-0.5 border-t-2 border-dashed border-slate-500" />
            <span className="text-slate-500">Original</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-0.5 bg-cyan-400 rounded" />
            <span className="text-slate-500">Calibrada</span>
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="gradOrigClosing" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#64748B" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#64748B" stopOpacity={0.05} />
            </linearGradient>
            <linearGradient id="gradCalibratedClosing" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22D3EE" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#A78BFA" stopOpacity={0.1} />
            </linearGradient>
          </defs>

          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#64748B', fontSize: 11 }}
          />

          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#64748B', fontSize: 11 }}
            tickFormatter={(v) => `${v}%`}
          />

          {/* Original: gris, línea punteada */}
          <Area
            type="monotone"
            dataKey="original"
            name="Original"
            stroke="#64748B"
            strokeWidth={1.5}
            strokeDasharray="4 4"
            fill="url(#gradOrigClosing)"
            fillOpacity={0.4}
          />

          {/* Calibrado: color vibrante, línea sólida */}
          <Area
            type="monotone"
            dataKey="calibrated"
            name="Calibrada"
            stroke="#22D3EE"
            strokeWidth={2.5}
            fill="url(#gradCalibratedClosing)"
            fillOpacity={1}
          />

          <Tooltip
            contentStyle={{
              backgroundColor: '#0f172a',
              border: '1px solid #334155',
              borderRadius: '8px',
              fontSize: '12px'
            }}
            labelStyle={{ color: '#94a3b8' }}
            formatter={(value: number, name: string) => [
              `${value}%`,
              name === 'original' ? 'Original' : 'Calibrada'
            ]}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
})
