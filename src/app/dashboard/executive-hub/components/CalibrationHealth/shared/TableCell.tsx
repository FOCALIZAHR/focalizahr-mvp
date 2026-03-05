'use client'

import { memo, useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { CellTooltip } from './CellTooltip'
import type { TooltipData } from '../CalibrationHealth.types'

interface TableCellProps {
  value: string | null
  tooltip: TooltipData
  highlight?: boolean
  color?: string
  bold?: boolean
  className?: string
  onAction?: () => void
}

export const TableCell = memo(function TableCell({
  value,
  tooltip,
  highlight,
  color,
  bold,
  className,
  onAction
}: TableCellProps) {
  const [tooltipState, setTooltipState] = useState({ visible: false, x: 0, y: 0 })

  const handleMouseEnter = useCallback((e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    setTooltipState({ visible: true, x: rect.left + rect.width / 2, y: rect.top })
  }, [])

  const handleMouseLeave = useCallback(() => {
    setTooltipState(s => ({ ...s, visible: false }))
  }, [])

  const isClickable = !!(tooltip.action && onAction)

  const textColor = value === null
    ? '#475569'
    : color
      ? color
      : highlight
        ? '#94a3b8'
        : '#cbd5e1'

  return (
    <td
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={isClickable ? onAction : undefined}
      className={cn(
        "relative px-4 py-3.5 text-sm text-center select-none",
        bold && "font-semibold",
        isClickable ? "cursor-pointer hover:bg-slate-700/20 transition-colors" : "cursor-default",
        className
      )}
      style={{
        color: textColor,
        fontVariantNumeric: 'tabular-nums',
        letterSpacing: '0.01em',
      }}
    >
      {value ?? '—'}
      <CellTooltip {...tooltipState} data={tooltip} />
    </td>
  )
})
