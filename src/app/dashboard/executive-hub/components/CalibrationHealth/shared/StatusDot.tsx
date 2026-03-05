// ════════════════════════════════════════════════════════════════════════════
// STATUS DOT - LED dot con glow para heatmap
// ════════════════════════════════════════════════════════════════════════════

import { cn } from '@/lib/utils'
import { STATUS_COLORS } from '../CalibrationHealth.constants'

interface HeatmapDotsProps {
  count: number
  status: string
}

export function HeatmapDots({ count, status }: HeatmapDotsProps) {
  const colors = STATUS_COLORS[status]
  if (!count) {
    return <span className="text-[10px] text-slate-700 text-center">—</span>
  }

  const dots = Math.min(count, 4)
  return (
    <div className="flex items-center justify-center gap-0.5">
      {Array.from({ length: dots }).map((_, i) => (
        <div key={i} className={cn('w-1.5 h-1.5 rounded-full', colors?.led)} />
      ))}
      {count > 4 && (
        <span className={cn('text-[9px] font-mono ml-0.5', colors?.text)}>+{count - 4}</span>
      )}
    </div>
  )
}
