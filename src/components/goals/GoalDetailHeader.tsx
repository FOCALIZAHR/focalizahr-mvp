// ════════════════════════════════════════════════════════════════════════════
// GOAL DETAIL HEADER - Encabezado de detalle de meta
// src/components/goals/GoalDetailHeader.tsx
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { memo, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Calendar, Target, Link2, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import GoalLevelBadge from './GoalLevelBadge'
import GoalProgressBar from './GoalProgressBar'
import { PrimaryButton } from '@/components/ui/PremiumButton'

// ════════════════════════════════════════════════════════════════════════════
// TIPOS
// ════════════════════════════════════════════════════════════════════════════

type GoalLevel = 'COMPANY' | 'AREA' | 'INDIVIDUAL'
type GoalStatus = 'NOT_STARTED' | 'ON_TRACK' | 'AT_RISK' | 'BEHIND' | 'COMPLETED' | 'CANCELLED'

interface GoalDetailHeaderProps {
  goal: {
    id: string
    title: string
    description?: string | null
    level: GoalLevel
    status: GoalStatus
    progress: number
    currentValue: number
    targetValue: number
    startValue: number
    unit?: string | null
    dueDate: string
    isAligned: boolean
    isOrphan: boolean
    parent?: { id: string; title: string } | null
    owner?: { id: string; fullName: string } | null
  }
  onCheckIn: () => void
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE
// ════════════════════════════════════════════════════════════════════════════

export default memo(function GoalDetailHeader({
  goal,
  onCheckIn,
}: GoalDetailHeaderProps) {
  const router = useRouter()

  const daysRemaining = useMemo(
    () => Math.ceil((new Date(goal.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
    [goal.dueDate]
  )

  const isOverdue = daysRemaining < 0
  const isUrgent = daysRemaining >= 0 && daysRemaining <= 7
  const isFinished = goal.status === 'COMPLETED' || goal.status === 'CANCELLED'

  const handleBack = useCallback(() => {
    router.push('/dashboard/metas')
  }, [router])

  const handleParentNav = useCallback(() => {
    if (goal.parent) {
      router.push(`/dashboard/metas/${goal.parent.id}`)
    }
  }, [router, goal.parent])

  return (
    <div className="space-y-6">
      {/* Navegación */}
      <button
        onClick={handleBack}
        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm">Volver a Metas</span>
      </button>

      {/* Header principal */}
      <div className="fhr-card space-y-6">
        {/* Título + Badge + CTA */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <GoalLevelBadge level={goal.level} />
              {!goal.isAligned && goal.level !== 'COMPANY' && (
                <span className="flex items-center gap-1 fhr-text-sm text-amber-400">
                  <AlertTriangle className="w-3 h-3" />
                  Sin alinear
                </span>
              )}
            </div>
            <h1 className="text-2xl md:text-3xl font-light text-white">
              {goal.title}
            </h1>
            {goal.description && (
              <p className="fhr-text text-slate-400">
                {goal.description}
              </p>
            )}
          </div>

          <PrimaryButton
            icon={Target}
            onClick={onCheckIn}
            disabled={isFinished}
          >
            Registrar Avance
          </PrimaryButton>
        </div>

        {/* Progreso grande */}
        <div className="space-y-3">
          <div className="flex items-end justify-between flex-wrap gap-2">
            <div>
              <span className="text-4xl font-light text-white tabular-nums">
                {goal.progress.toFixed(0)}%
              </span>
              <span className="fhr-text-sm text-slate-400 ml-2">completado</span>
            </div>
            <div className="text-right">
              <div className="text-lg text-white tabular-nums">
                {goal.currentValue.toLocaleString()} / {goal.targetValue.toLocaleString()}
                {goal.unit && <span className="text-slate-400 ml-1">{goal.unit}</span>}
              </div>
              <div className="fhr-text-sm text-slate-500">
                Inicio: {goal.startValue.toLocaleString()}
              </div>
            </div>
          </div>
          <GoalProgressBar
            progress={goal.progress}
            status={goal.status}
            size="lg"
            showLabel={false}
          />
        </div>

        {/* Meta info */}
        <div className="flex flex-wrap gap-4 pt-4 border-t border-slate-700/50">
          {/* Fecha límite */}
          <div className="flex items-center gap-2">
            <Calendar
              className={cn(
                'w-4 h-4',
                isOverdue ? 'text-red-400' : isUrgent ? 'text-amber-400' : 'text-slate-400'
              )}
            />
            <span
              className={cn(
                'text-sm',
                isOverdue ? 'text-red-400' : isUrgent ? 'text-amber-400' : 'text-slate-300'
              )}
            >
              {isOverdue
                ? `Vencida hace ${Math.abs(daysRemaining)} días`
                : daysRemaining === 0
                ? 'Vence hoy'
                : `${daysRemaining} días restantes`}
            </span>
          </div>

          {/* Meta padre */}
          {goal.parent && (
            <button
              onClick={handleParentNav}
              className="flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              <Link2 className="w-4 h-4" />
              <span className="truncate max-w-[200px]">Deriva de: {goal.parent.title}</span>
            </button>
          )}

          {/* Owner */}
          {goal.owner && (
            <span className="fhr-text-sm text-slate-400">
              Responsable: {goal.owner.fullName}
            </span>
          )}
        </div>
      </div>
    </div>
  )
})
