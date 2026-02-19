// ════════════════════════════════════════════════════════════════════════════
// GOAL PROGRESS BAR - Barra de progreso visual con status
// src/components/goals/GoalProgressBar.tsx
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { memo, useMemo } from 'react'
import { cn } from '@/lib/utils'

// ════════════════════════════════════════════════════════════════════════════
// TIPOS
// ════════════════════════════════════════════════════════════════════════════

type GoalStatus = 'NOT_STARTED' | 'ON_TRACK' | 'AT_RISK' | 'BEHIND' | 'COMPLETED' | 'CANCELLED'

interface GoalProgressBarProps {
  progress: number
  status: GoalStatus
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

// ════════════════════════════════════════════════════════════════════════════
// CONFIGURACIÓN DE COLORES POR STATUS
// ════════════════════════════════════════════════════════════════════════════

const STATUS_COLORS: Record<GoalStatus, { bar: string; bg: string }> = {
  NOT_STARTED: {
    bar: 'bg-slate-500',
    bg: 'bg-slate-800',
  },
  ON_TRACK: {
    bar: 'bg-gradient-to-r from-cyan-500 to-cyan-400',
    bg: 'bg-cyan-950/30',
  },
  AT_RISK: {
    bar: 'bg-gradient-to-r from-amber-600 to-amber-400',
    bg: 'bg-amber-950/30',
  },
  BEHIND: {
    bar: 'bg-gradient-to-r from-red-600 to-red-400',
    bg: 'bg-red-950/30',
  },
  COMPLETED: {
    bar: 'bg-gradient-to-r from-emerald-600 to-emerald-400',
    bg: 'bg-emerald-950/30',
  },
  CANCELLED: {
    bar: 'bg-slate-600',
    bg: 'bg-slate-800',
  },
}

const SIZE_MAP = {
  sm: 'h-1.5',
  md: 'h-2.5',
  lg: 'h-4',
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE
// ════════════════════════════════════════════════════════════════════════════

export default memo(function GoalProgressBar({
  progress,
  status,
  showLabel = true,
  size = 'md',
  className = '',
}: GoalProgressBarProps) {
  const clampedProgress = useMemo(
    () => Math.min(100, Math.max(0, progress)),
    [progress]
  )

  const colors = STATUS_COLORS[status] || STATUS_COLORS.NOT_STARTED

  return (
    <div className={cn('flex items-center gap-3', className)}>
      {/* Barra */}
      <div className={cn('flex-1 rounded-full overflow-hidden', colors.bg, SIZE_MAP[size])}>
        <div
          className={cn('h-full rounded-full transition-all duration-500 ease-out', colors.bar)}
          style={{ width: `${clampedProgress}%` }}
        />
      </div>

      {/* Label */}
      {showLabel && (
        <span className="fhr-text-sm tabular-nums min-w-[3rem] text-right">
          {Math.round(progress)}%
        </span>
      )}
    </div>
  )
})
