'use client'

import { cn } from '@/lib/utils'
import type { InsightCardProps } from '@/types/evaluator-cinema'

const variantStyles = {
  default: 'bg-slate-800/40 border-slate-700/50',
  warning: 'bg-amber-950/10 border-amber-500/20',
  success: 'bg-emerald-950/10 border-emerald-500/20'
}

export default function InsightCard({ insight }: InsightCardProps) {
  const Icon = insight.icon
  const isFullWidth = insight.type === 'gap'

  return (
    <div className={cn(
      'p-5 rounded-xl border',
      variantStyles[insight.variant],
      isFullWidth && 'col-span-2'
    )}>
      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
        <Icon className="w-3 h-3" />
        {insight.label}
      </div>
      <div className="text-xl text-white font-mono font-medium">
        {insight.value}
      </div>
    </div>
  )
}
