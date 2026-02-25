// ════════════════════════════════════════════════════════════════════════════
// GOAL CARD - Card individual de meta
// src/components/goals/GoalCard.tsx
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { memo, useMemo, useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar, Link2, AlertTriangle, CheckCircle2, Clock, Send } from 'lucide-react'
import { cn } from '@/lib/utils'
import GoalProgressBar from './GoalProgressBar'
import GoalLevelBadge from './GoalLevelBadge'

// ════════════════════════════════════════════════════════════════════════════
// TIPOS
// ════════════════════════════════════════════════════════════════════════════

type GoalLevel = 'COMPANY' | 'AREA' | 'INDIVIDUAL'
type GoalStatus = 'NOT_STARTED' | 'ON_TRACK' | 'AT_RISK' | 'BEHIND' | 'PENDING_CLOSURE' | 'COMPLETED' | 'CANCELLED'

interface GoalCardData {
  id: string
  title: string
  level: GoalLevel
  status: GoalStatus
  progress: number
  dueDate: string
  isAligned: boolean
  isOrphan: boolean
  isLeaderGoal?: boolean
  owner?: { id: string; fullName: string; position?: string | null } | null
  department?: { id: string; displayName: string } | null
  _count?: { children: number }
  // Campos de cierre
  closureRequestedAt?: string | null
  closureRequestedBy?: string | null
}

interface GoalCardProps {
  goal: GoalCardData
  size?: 'compact' | 'full'
  showOwner?: boolean
  className?: string
  onRequestClosure?: (goalId: string) => Promise<void>
}

// ════════════════════════════════════════════════════════════════════════════
// CONFIGURACIÓN
// ════════════════════════════════════════════════════════════════════════════

const STATUS_LABELS: Record<GoalStatus, { label: string; className: string }> = {
  NOT_STARTED: { label: 'Sin iniciar', className: 'text-slate-400' },
  ON_TRACK: { label: 'En tiempo', className: 'text-cyan-400' },
  AT_RISK: { label: 'En riesgo', className: 'text-amber-400' },
  BEHIND: { label: 'Atrasada', className: 'text-red-400' },
  PENDING_CLOSURE: { label: 'Pendiente Aprobación', className: 'text-amber-400' },
  COMPLETED: { label: 'Completada', className: 'text-emerald-400' },
  CANCELLED: { label: 'Cancelada', className: 'text-slate-500' },
}

// ════════════════════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════════════════════

function formatDueDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays < 0) return 'Vencida'
  if (diffDays === 0) return 'Hoy'
  if (diffDays <= 7) return `${diffDays}d restantes`

  return date.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE
// ════════════════════════════════════════════════════════════════════════════

export default memo(function GoalCard({
  goal,
  size = 'full',
  showOwner = false,
  className = '',
  onRequestClosure,
}: GoalCardProps) {
  const router = useRouter()
  const [isRequestingClosure, setIsRequestingClosure] = useState(false)

  const statusConfig = useMemo(
    () => STATUS_LABELS[goal.status] || STATUS_LABELS.NOT_STARTED,
    [goal.status]
  )

  const dueDateLabel = useMemo(
    () => formatDueDate(goal.dueDate),
    [goal.dueDate]
  )

  const handleClick = useCallback(() => {
    router.push(`/dashboard/metas/${goal.id}`)
  }, [router, goal.id])

  const isCompact = size === 'compact'

  // ═══ LÓGICA CIERRE ═══
  const canRequestClosure = useMemo(() => {
    return goal.progress >= 80 &&
           !['PENDING_CLOSURE', 'COMPLETED', 'CANCELLED'].includes(goal.status)
  }, [goal.progress, goal.status])

  const handleRequestClosure = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation() // Evitar navegación al detalle
    if (!onRequestClosure || isRequestingClosure) return

    setIsRequestingClosure(true)
    try {
      await onRequestClosure(goal.id)
    } finally {
      setIsRequestingClosure(false)
    }
  }, [goal.id, onRequestClosure, isRequestingClosure])

  return (
    <div
      onClick={handleClick}
      className={cn(
        'fhr-card cursor-pointer transition-transform duration-200 hover:scale-[1.02]',
        className
      )}
    >
      {/* Header: Badge + Alignment */}
      <div className="flex items-center justify-between mb-3">
        <GoalLevelBadge level={goal.level} isLeaderGoal={goal.isLeaderGoal} />

        <div className="flex items-center gap-2">
          {goal.isAligned ? (
            <Link2 className="w-4 h-4 text-cyan-400" />
          ) : goal.isOrphan ? (
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          ) : null}

          {goal.status === 'PENDING_CLOSURE' && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-xs">
              <Clock className="w-3 h-3" />
              Pendiente
            </span>
          )}

          {goal.status === 'COMPLETED' && (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          )}
        </div>
      </div>

      {/* Título */}
      <h3 className={cn(
        'fhr-title-card mb-2 line-clamp-2',
        isCompact && 'text-sm'
      )}>
        {goal.title}
      </h3>

      {/* Owner / Department (si aplica) */}
      {showOwner && !isCompact && (
        <p className="fhr-text-sm text-slate-400 mb-3 truncate">
          {goal.owner?.fullName || goal.department?.displayName || '—'}
        </p>
      )}

      {/* Progress */}
      <GoalProgressBar
        progress={goal.progress}
        status={goal.status}
        size={isCompact ? 'sm' : 'md'}
        className="mb-3"
      />

      {/* Footer: Status + Fecha */}
      <div className="flex items-center justify-between">
        <span className={cn('fhr-text-sm font-medium', statusConfig.className)}>
          {statusConfig.label}
        </span>

        <span className="fhr-text-sm flex items-center gap-1 text-slate-400">
          <Calendar className="w-3 h-3" />
          {dueDateLabel}
        </span>
      </div>

      {/* Hijos (si tiene) */}
      {!isCompact && goal._count && goal._count.children > 0 && (
        <p className="fhr-text-sm text-slate-500 mt-2">
          {goal._count.children} meta{goal._count.children > 1 ? 's' : ''} hija{goal._count.children > 1 ? 's' : ''}
        </p>
      )}

      {/* Botón solicitar cierre */}
      {!isCompact && canRequestClosure && onRequestClosure && (
        <button
          onClick={handleRequestClosure}
          disabled={isRequestingClosure}
          className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
          {isRequestingClosure ? 'Solicitando...' : 'Solicitar Cierre'}
        </button>
      )}
    </div>
  )
})
