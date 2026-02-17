'use client'

import { memo } from 'react'
import { cn } from '@/lib/utils'

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; border: string }> = {
  DRAFT: { label: 'Borrador', bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/30' },
  PENDING_REVIEW: { label: 'Pendiente', bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
  AGREED: { label: 'Acordado', bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/30' },
  IN_PROGRESS: { label: 'En Progreso', bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30' },
  COMPLETED: { label: 'Completado', bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  CANCELLED: { label: 'Cancelado', bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30' }
}

interface PDIStatusBadgeProps {
  status: string
  className?: string
}

export default memo(function PDIStatusBadge({ status, className }: PDIStatusBadgeProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.DRAFT

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border',
        config.bg,
        config.text,
        config.border,
        className
      )}
    >
      {config.label}
    </span>
  )
})
