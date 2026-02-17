'use client'

import { memo } from 'react'
import { Target, Clock, CheckCircle2, BookOpen } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PDIGoalCardProps {
  goal: {
    id: string
    competencyName: string
    title: string
    description: string
    targetOutcome: string
    priority: string
    gapType: string
    status: string
    progressPercent: number
    targetDate: string | null
    suggestedResources?: Array<{ type: string; title: string }> | null
  }
}

const STATUS_COLORS: Record<string, string> = {
  NOT_STARTED: 'text-slate-500',
  IN_PROGRESS: 'text-cyan-400',
  COMPLETED: 'text-emerald-400',
  CANCELLED: 'text-red-400'
}

const STATUS_LABELS: Record<string, string> = {
  NOT_STARTED: 'Sin iniciar',
  IN_PROGRESS: 'En progreso',
  COMPLETED: 'Completado',
  CANCELLED: 'Cancelado'
}

const PRIORITY_COLORS: Record<string, string> = {
  ALTA: 'text-red-400',
  MEDIA: 'text-amber-400',
  BAJA: 'text-slate-400'
}

export default memo(function PDIGoalCard({ goal }: PDIGoalCardProps) {
  const resources = Array.isArray(goal.suggestedResources) ? goal.suggestedResources : []
  const isCompleted = goal.status === 'COMPLETED'
  const progressColor = isCompleted ? 'bg-emerald-500' : goal.progressPercent > 50 ? 'bg-cyan-500' : 'bg-amber-500'

  return (
    <div
      className={cn(
        'relative rounded-xl border p-4 transition-all',
        'bg-[#0F172A]/70 backdrop-blur-xl',
        isCompleted ? 'border-emerald-500/30' : 'border-slate-700/50'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Left: Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Target className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
            <h4 className="text-sm font-semibold text-white truncate">{goal.title}</h4>
          </div>

          <p className="text-xs text-slate-500 mb-2">
            {goal.competencyName} · <span className={PRIORITY_COLORS[goal.priority] || 'text-slate-400'}>Prioridad {goal.priority}</span>
          </p>

          <p className="text-xs text-slate-400 line-clamp-2 mb-3">{goal.targetOutcome}</p>

          {/* Progress bar */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-1.5 rounded-full bg-slate-800">
              <div
                className={cn('h-full rounded-full transition-all duration-500', progressColor)}
                style={{ width: `${Math.min(goal.progressPercent, 100)}%` }}
              />
            </div>
            <span className="text-xs font-medium text-slate-400 w-8 text-right">
              {goal.progressPercent}%
            </span>
          </div>
        </div>

        {/* Right: Status */}
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <div className={cn('flex items-center gap-1 text-xs font-medium', STATUS_COLORS[goal.status] || 'text-slate-500')}>
            {isCompleted ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
            <span>{STATUS_LABELS[goal.status] || goal.status}</span>
          </div>

          {goal.targetDate && (
            <p className="text-[10px] text-slate-600">
              Fecha: {new Date(goal.targetDate).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })}
            </p>
          )}

          {resources.length > 0 && (
            <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-1">
              <BookOpen className="w-3 h-3" />
              <span>{resources.length} recurso(s)</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
})
