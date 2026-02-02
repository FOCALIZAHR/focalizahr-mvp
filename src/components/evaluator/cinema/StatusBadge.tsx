'use client'

import { Clock, CheckCircle2, Edit } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { EmployeeCardStatus } from '@/types/evaluator-cinema'

const STATUS_CONFIG: Record<EmployeeCardStatus, {
  color: string
  icon: typeof Clock
  text: string
}> = {
  ready: {
    color: 'text-cyan-400 bg-cyan-950/30 border-cyan-500/20',
    icon: Clock,
    text: 'Listo para ti'
  },
  waiting: {
    color: 'text-slate-400 bg-slate-800/50 border-slate-700',
    icon: Clock,
    text: 'Espera auto'
  },
  in_progress: {
    color: 'text-amber-400 bg-amber-950/30 border-amber-500/20',
    icon: Edit,
    text: 'En progreso'
  },
  completed: {
    color: 'text-emerald-400 bg-emerald-950/30 border-emerald-500/20',
    icon: CheckCircle2,
    text: 'Completada'
  }
}

export function StatusBadge({ status }: { status: EmployeeCardStatus }) {
  const config = STATUS_CONFIG[status]
  const Icon = config.icon

  return (
    <div className={cn(
      'flex items-center gap-1.5 px-2 py-1 rounded-md border',
      'text-[10px] font-mono font-bold uppercase tracking-wide backdrop-blur-sm',
      config.color
    )}>
      <Icon className="w-3 h-3" />
      <span>{config.text}</span>
    </div>
  )
}
