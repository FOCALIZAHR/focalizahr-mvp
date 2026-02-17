'use client'

import { memo } from 'react'

interface PDIGapBarProps {
  actual: number   // 0-5
  target: number   // 0-5
  showLabels?: boolean
}

export default memo(function PDIGapBar({ actual, target, showLabels = true }: PDIGapBarProps) {
  const max = 5
  const actualPct = Math.min((actual / max) * 100, 100)
  const targetPct = Math.min((target / max) * 100, 100)

  return (
    <div className="w-full">
      <div className="relative h-3 bg-slate-800 rounded-full overflow-visible">
        {/* Actual fill */}
        <div
          className="absolute top-0 left-0 h-full rounded-full transition-all duration-500"
          style={{
            width: `${actualPct}%`,
            background: actual >= target
              ? 'linear-gradient(90deg, #10B981, #22D3EE)'
              : 'linear-gradient(90deg, #F59E0B, #EF4444)'
          }}
        />

        {/* Target marker */}
        <div
          className="absolute top-[-3px] w-[2px] h-[18px] bg-white/60 rounded-full"
          style={{ left: `${targetPct}%` }}
        />
        <div
          className="absolute top-[-3px] w-1.5 h-1.5 rounded-full bg-white/80 border border-white"
          style={{ left: `calc(${targetPct}% - 3px)` }}
        />
      </div>

      {showLabels && (
        <div className="flex justify-between mt-2">
          <div className="text-left">
            <span className="text-xs text-slate-500">Tu nivel: </span>
            <span className="text-xs font-medium text-cyan-400">{actual.toFixed(1)}</span>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-500">Meta cargo: </span>
            <span className="text-xs font-medium text-white">{target.toFixed(1)}</span>
          </div>
        </div>
      )}
    </div>
  )
})
