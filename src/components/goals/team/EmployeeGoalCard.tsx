// ════════════════════════════════════════════════════════════════════════════
// EMPLOYEE GOAL CARD - Card de colaborador con estado de metas
// src/components/goals/team/EmployeeGoalCard.tsx
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { memo, useCallback, useMemo } from 'react'
import { Check, AlertTriangle, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TeamMember } from '@/hooks/useTeamGoals'

// ════════════════════════════════════════════════════════════════════════════
// PROPS
// ════════════════════════════════════════════════════════════════════════════

interface EmployeeGoalCardProps {
  employee: TeamMember
  isSelected: boolean
  onToggleSelect: (id: string) => void
  onClick: (id: string) => void
}

// ════════════════════════════════════════════════════════════════════════════
// STATUS CONFIG
// ════════════════════════════════════════════════════════════════════════════

interface StatusConfig {
  icon: typeof Check | typeof AlertTriangle | typeof Settings
  iconColor: string
  borderColor: string
  bgColor: string
  label: string
  labelColor: string
}

function getStatusConfig(employee: TeamMember): StatusConfig {
  if (!employee.hasGoalsConfigured) {
    return {
      icon: Settings,
      iconColor: 'text-slate-500',
      borderColor: 'border-slate-700',
      bgColor: 'bg-slate-800/30',
      label: 'Cargo sin metas',
      labelColor: 'text-slate-500',
    }
  }
  if (employee.goalsCount === 0) {
    return {
      icon: AlertTriangle,
      iconColor: 'text-amber-400',
      borderColor: 'border-amber-500/30',
      bgColor: 'bg-amber-500/5',
      label: 'Sin metas',
      labelColor: 'text-amber-400',
    }
  }
  return {
    icon: Check,
    iconColor: 'text-emerald-400',
    borderColor: 'border-emerald-500/30',
    bgColor: 'bg-emerald-500/5',
    label: `${employee.goalsCount} ${employee.goalsCount === 1 ? 'meta' : 'metas'}`,
    labelColor: 'text-emerald-400',
  }
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE
// ════════════════════════════════════════════════════════════════════════════

export const EmployeeGoalCard = memo(function EmployeeGoalCard({
  employee,
  isSelected,
  onToggleSelect,
  onClick,
}: EmployeeGoalCardProps) {
  const handleCardClick = useCallback(() => {
    onClick(employee.id)
  }, [onClick, employee.id])

  const handleCheckboxClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    if (employee.hasGoalsConfigured) {
      onToggleSelect(employee.id)
    }
  }, [onToggleSelect, employee.id, employee.hasGoalsConfigured])

  const status = useMemo(() => getStatusConfig(employee), [employee])
  const StatusIcon = status.icon

  return (
    <div
      onClick={handleCardClick}
      className={cn(
        'relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200',
        status.bgColor,
        isSelected ? 'border-cyan-500 ring-2 ring-cyan-500/20' : status.borderColor,
        'hover:scale-[1.02]'
      )}
    >
      {/* Checkbox (solo si cargo tiene metas configuradas) */}
      {employee.hasGoalsConfigured && (
        <button
          onClick={handleCheckboxClick}
          className={cn(
            'absolute top-3 right-3 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors',
            isSelected
              ? 'bg-cyan-500 border-cyan-500'
              : 'border-slate-600 hover:border-slate-500'
          )}
        >
          {isSelected && <Check className="w-3 h-3 text-white" />}
        </button>
      )}

      {/* Status icon */}
      <div className={cn(
        'w-10 h-10 rounded-lg flex items-center justify-center mb-3',
        employee.hasGoalsConfigured ? 'bg-slate-800' : 'bg-slate-800/50'
      )}>
        <StatusIcon className={cn('w-5 h-5', status.iconColor)} />
      </div>

      {/* Info */}
      <div className="space-y-1">
        <h3 className="text-white font-medium truncate pr-6">
          {employee.fullName}
        </h3>
        <p className="text-xs text-slate-400 truncate">
          {employee.position}
        </p>
      </div>

      {/* Status / Progress */}
      <div className="mt-3 pt-3 border-t border-slate-700/50">
        <div className="flex items-center justify-between">
          <span className={cn('text-xs font-medium', status.labelColor)}>
            {status.label}
          </span>
          {employee.hasGoalsConfigured && employee.goalsCount > 0 && (
            <span className="text-xs text-slate-400">
              {employee.avgProgress.toFixed(0)}% avg
            </span>
          )}
        </div>

        {/* Mini progress bar */}
        {employee.hasGoalsConfigured && employee.goalsCount > 0 && (
          <div className="mt-2 h-1 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full transition-all"
              style={{ width: `${Math.min(100, employee.avgProgress)}%` }}
            />
          </div>
        )}
      </div>
    </div>
  )
})
