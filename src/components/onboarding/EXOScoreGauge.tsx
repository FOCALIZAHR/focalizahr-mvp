'use client'

import { memo } from 'react'

interface EXOScoreGaugeProps {
  score: number | null
  previousScore?: number
  label?: string
  size?: 'sm' | 'md' | 'lg'
}

export default memo(function EXOScoreGauge({ 
  score, 
  label = 'EXO Score',
  size = 'md'
}: EXOScoreGaugeProps) {
  const displayScore = score ?? 0
  const hasData = score !== null

  const sizes = {
    sm: { gauge: 160, stroke: 12, text: 'text-4xl' },
    md: { gauge: 200, stroke: 14, text: 'text-5xl' },
    lg: { gauge: 240, stroke: 16, text: 'text-6xl' }
  }

  const { gauge: gaugeSize, stroke: strokeWidth, text: textSize } = sizes[size]
  const radius = (gaugeSize - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (displayScore / 100) * circumference

  const getColor = (value: number): string => {
    if (value >= 80) return '#22D3EE'
    if (value >= 60) return '#F59E0B'
    return '#EF4444'
  }

  return (
    <div className="bg-slate-900/30 border border-slate-800/50 rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-800/50">
        <h3 className="text-base font-medium text-slate-200 text-center">{label}</h3>
      </div>

      <div className="flex flex-col items-center gap-4 p-8">
        {/* Gauge */}
        <div className="relative" style={{ width: gaugeSize, height: gaugeSize }}>
          <svg width={gaugeSize} height={gaugeSize} className="transform -rotate-90">
            {/* Background */}
            <circle
              cx={gaugeSize / 2}
              cy={gaugeSize / 2}
              r={radius}
              stroke="#1e293b"
              strokeWidth={strokeWidth}
              fill="transparent"
            />
            
            {/* Progress */}
            {hasData && (
              <circle
                cx={gaugeSize / 2}
                cy={gaugeSize / 2}
                r={radius}
                stroke={getColor(displayScore)}
                strokeWidth={strokeWidth}
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
                className="transition-all duration-1000"
              />
            )}
          </svg>
          
          {/* Texto centrado */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {hasData ? (
              <>
                <div className={`${textSize} font-extralight text-white tabular-nums`}>
                  {displayScore.toFixed(0)}
                </div>
                <div className="text-sm text-slate-500 mt-1">/ 100</div>
              </>
            ) : (
              <div className="text-center space-y-2">
                <div className="text-5xl font-extralight text-slate-700">—</div>
                <div className="text-sm text-slate-500">Sin datos</div>
              </div>
            )}
          </div>
        </div>

        {/* Interpretación */}
        {hasData && (
          <div className="text-center space-y-1">
            <p className="text-sm text-slate-400">
              {displayScore >= 80 ? 'Excelente' : displayScore >= 60 ? 'Mejorable' : 'Crítico'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
})