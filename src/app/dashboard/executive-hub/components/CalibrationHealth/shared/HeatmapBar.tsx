'use client'

import { memo, useMemo } from 'react'
import { cn } from '@/lib/utils'

interface HeatmapBarProps {
  counts: {
    OPTIMA: number
    CENTRAL: number
    SEVERA: number
    INDULGENTE: number
  }
  evaluatorCount: number
  className?: string
}

const COLORS = {
  OPTIMA: {
    bg: 'bg-emerald-500',
    glow: 'shadow-[0_0_8px_rgba(16,185,129,0.4)]'
  },
  CENTRAL: {
    bg: 'bg-cyan-500',
    glow: 'shadow-[0_0_8px_rgba(34,211,238,0.4)]'
  },
  SEVERA: {
    bg: 'bg-amber-500',
    glow: 'shadow-[0_0_8px_rgba(245,158,11,0.4)]'
  },
  INDULGENTE: {
    bg: 'bg-yellow-400',
    glow: 'shadow-[0_0_8px_rgba(250,204,21,0.4)]'
  }
}

export const HeatmapBar = memo(function HeatmapBar({
  counts,
  evaluatorCount,
  className
}: HeatmapBarProps) {

  const segments = useMemo(() => {
    if (evaluatorCount === 0) return []

    const order: (keyof typeof counts)[] = ['OPTIMA', 'CENTRAL', 'SEVERA', 'INDULGENTE']

    return order
      .filter(status => counts[status] > 0)
      .map(status => ({
        status,
        count: counts[status],
        percentage: (counts[status] / evaluatorCount) * 100,
        ...COLORS[status]
      }))
  }, [counts, evaluatorCount])

  // Sin datos → barra translúcida
  if (evaluatorCount === 0) {
    return (
      <div className={cn(
        "h-3 rounded-full bg-slate-700/30 border border-slate-600/20",
        className
      )} />
    )
  }

  return (
    <div className={cn(
      "h-3 rounded-full overflow-hidden flex",
      "bg-slate-800/50 border border-slate-700/30",
      className
    )}>
      {segments.map((segment, index) => (
        <div
          key={segment.status}
          className={cn(
            segment.bg,
            segment.glow,
            "transition-all duration-500",
            index === 0 && "rounded-l-full",
            index === segments.length - 1 && "rounded-r-full"
          )}
          style={{ width: `${segment.percentage}%` }}
        />
      ))}
    </div>
  )
})
