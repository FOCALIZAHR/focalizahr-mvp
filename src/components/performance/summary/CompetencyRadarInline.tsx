'use client'

// ════════════════════════════════════════════════════════════════════════════
// COMPETENCY RADAR INLINE - Gráfico araña embebido (no modal)
// src/components/performance/summary/CompetencyRadarInline.tsx
// ════════════════════════════════════════════════════════════════════════════
// Basado en CompetencyRadarModal pero sin wrapper modal

import { memo, useMemo } from 'react'
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar as RechartsRadar,
  Legend,
  Tooltip
} from 'recharts'
import type { CompetencyScoreSummary } from '@/types/evaluator-cinema'

interface CompetencyRadarInlineProps {
  competencyScores: CompetencyScoreSummary[]
  className?: string
}

// Paleta Oficial Enterprise v2
const THEME = {
  self: {
    stroke: '#22D3EE',
    fill: 'rgba(34, 211, 238, 0.25)'
  },
  manager: {
    stroke: '#A78BFA',
    fill: 'rgba(167, 139, 250, 0.25)'
  },
  peer: {
    stroke: '#94A3B8',
    fill: 'rgba(148, 163, 184, 0.15)'
  }
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#0F172A]/90 backdrop-blur-xl border border-slate-700/50 p-4 rounded-xl shadow-2xl min-w-[200px]">
      <p className="text-white font-semibold mb-3 text-sm border-b border-slate-700/50 pb-2">
        {label}
      </p>
      <div className="space-y-2">
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: entry.stroke }}
              />
              <span className="text-slate-300 font-medium">{entry.name}</span>
            </div>
            <span
              className="font-mono font-bold text-sm"
              style={{ color: entry.stroke }}
            >
              {Number(entry.value).toFixed(1)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default memo(function CompetencyRadarInline({
  competencyScores,
  className = ''
}: CompetencyRadarInlineProps) {

  const chartData = useMemo(() => {
    if (!competencyScores?.length) return []
    return competencyScores.map(c => ({
      competency: c.competencyName.length > 18
        ? c.competencyName.slice(0, 16) + '...'
        : c.competencyName,
      fullCompetency: c.competencyName,
      self: Number(c.selfScore || 0),
      manager: Number(c.managerScore || 0),
      peer: Number(c.peerAvgScore || 0),
      fullMark: 5
    }))
  }, [competencyScores])

  const hasPeerData = useMemo(
    () => competencyScores?.some(c => c.peerAvgScore != null),
    [competencyScores]
  )

  if (!chartData.length) return null

  return (
    <div className={`relative bg-[#0F172A]/60 backdrop-blur-md border border-slate-800 rounded-2xl p-6 ${className}`}>
      {/* Línea Tesla */}
      <div className="absolute top-0 left-4 right-4 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent rounded-t-2xl" />

      <div className="w-full h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="75%" data={chartData}>
            <PolarGrid stroke="#334155" strokeDasharray="4 4" />
            <PolarAngleAxis
              dataKey="competency"
              tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }}
            />
            <PolarRadiusAxis domain={[0, 5]} tick={false} axisLine={false} />

            <RechartsRadar
              name="Autoevaluación"
              dataKey="self"
              stroke={THEME.self.stroke}
              fill={THEME.self.fill}
              fillOpacity={1}
              strokeWidth={2}
              isAnimationActive={false}
            />
            <RechartsRadar
              name="Evaluación Jefe"
              dataKey="manager"
              stroke={THEME.manager.stroke}
              fill={THEME.manager.fill}
              fillOpacity={1}
              strokeWidth={2}
              isAnimationActive={false}
            />
            {hasPeerData && (
              <RechartsRadar
                name="Pares"
                dataKey="peer"
                stroke={THEME.peer.stroke}
                fill={THEME.peer.fill}
                fillOpacity={1}
                strokeWidth={2}
                strokeDasharray="4 4"
                isAnimationActive={false}
              />
            )}

            <Legend
              wrapperStyle={{ paddingTop: '16px', fontSize: '12px' }}
              iconType="circle"
            />
            <Tooltip content={<CustomTooltip />} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
})
