// ════════════════════════════════════════════════════════════════════════════
// METRIC BAR — Thin animated bar with threshold marker
// src/app/dashboard/executive-hub/components/GoalsCorrelation/shared/MetricBar.tsx
// ════════════════════════════════════════════════════════════════════════════

import { memo } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface MetricBarProps {
  label: string
  value: number
  threshold: number
  color: 'cyan' | 'purple'
}

export const MetricBar = memo(function MetricBar({
  label,
  value,
  threshold,
  color,
}: MetricBarProps) {
  const clampedValue = Math.min(100, Math.max(0, value))
  const meetsThreshold = value >= threshold

  const barColor = color === 'cyan'
    ? 'bg-gradient-to-r from-cyan-500/80 to-cyan-400/60'
    : 'bg-gradient-to-r from-purple-500/80 to-purple-400/60'

  const glowColor = color === 'cyan'
    ? 'shadow-[0_0_8px_rgba(34,211,238,0.3)]'
    : 'shadow-[0_0_8px_rgba(167,139,250,0.3)]'

  const valueColor = meetsThreshold
    ? (color === 'cyan' ? 'text-cyan-400' : 'text-purple-400')
    : 'text-slate-400'

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[9px] text-slate-600 uppercase tracking-wider font-medium">{label}</span>
        <span className={cn('text-[10px] font-mono', valueColor)}>{Math.round(value)}%</span>
      </div>
      <div className="relative h-[3px] bg-slate-800/80 rounded-full">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${clampedValue}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className={cn('absolute inset-y-0 left-0 rounded-full', barColor, meetsThreshold && glowColor)}
        />
        <div
          className="absolute top-[-2px] bottom-[-2px] w-px bg-slate-600/50"
          style={{ left: `${threshold}%` }}
        />
      </div>
    </div>
  )
})
