// ════════════════════════════════════════════════════════════════════════════
// GOAL PROGRESS TIMELINE - Historial de avances (Time Travel)
// src/components/goals/GoalProgressTimeline.tsx
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { memo } from 'react'
import { TrendingUp, TrendingDown, Minus, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'

// ════════════════════════════════════════════════════════════════════════════
// TIPOS
// ════════════════════════════════════════════════════════════════════════════

interface ProgressUpdate {
  id: string
  previousValue: number
  newValue: number
  previousProgress: number
  newProgress: number
  comment?: string | null
  createdAt: string
}

interface GoalProgressTimelineProps {
  updates: ProgressUpdate[]
  unit?: string | null
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE
// ════════════════════════════════════════════════════════════════════════════

export default memo(function GoalProgressTimeline({
  updates,
  unit,
}: GoalProgressTimelineProps) {
  if (!updates || updates.length === 0) {
    return (
      <div className="fhr-card">
        <h3 className="fhr-title-card mb-4">Historial de Avances</h3>
        <div className="text-center py-8">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-800 flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-slate-600" />
          </div>
          <p className="fhr-text-sm text-slate-400">
            Aún no hay registros de avance
          </p>
          <p className="fhr-text-sm text-slate-500 mt-1">
            Registra tu primer avance para ver el historial aquí.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="fhr-card">
      <h3 className="fhr-title-card mb-4">Historial de Avances</h3>

      <div className="space-y-4">
        {updates.map((update) => {
          const delta = update.newValue - update.previousValue
          const isPositive = delta > 0
          const isNeutral = delta === 0

          return (
            <div
              key={update.id}
              className="relative pl-6 pb-4 border-l-2 border-slate-700 last:border-l-transparent last:pb-0"
            >
              {/* Dot */}
              <div
                className={cn(
                  'absolute -left-[9px] top-0 w-4 h-4 rounded-full flex items-center justify-center',
                  isPositive
                    ? 'bg-emerald-500/20 border-2 border-emerald-500'
                    : isNeutral
                    ? 'bg-slate-500/20 border-2 border-slate-500'
                    : 'bg-red-500/20 border-2 border-red-500'
                )}
              >
                {isPositive ? (
                  <TrendingUp className="w-2 h-2 text-emerald-400" />
                ) : isNeutral ? (
                  <Minus className="w-2 h-2 text-slate-400" />
                ) : (
                  <TrendingDown className="w-2 h-2 text-red-400" />
                )}
              </div>

              {/* Content */}
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={cn(
                      'text-sm font-medium',
                      isPositive
                        ? 'text-emerald-400'
                        : isNeutral
                        ? 'text-slate-400'
                        : 'text-red-400'
                    )}
                  >
                    {isPositive ? '+' : ''}
                    {delta.toLocaleString()}
                    {unit ? ` ${unit}` : ''}
                  </span>
                  <span className="fhr-text-sm text-slate-500">
                    ({update.previousProgress.toFixed(0)}% → {update.newProgress.toFixed(0)}%)
                  </span>
                </div>

                <div className="fhr-text-sm text-slate-500">
                  {new Date(update.createdAt).toLocaleDateString('es-CL', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>

                {update.comment && (
                  <div className="mt-2 flex items-start gap-2 text-sm text-slate-300 bg-slate-800/50 rounded-lg p-3">
                    <MessageSquare className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                    <span>{update.comment}</span>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
})
