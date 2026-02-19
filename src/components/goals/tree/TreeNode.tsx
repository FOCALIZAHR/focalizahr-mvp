// ════════════════════════════════════════════════════════════════════════════
// TREE NODE - Nodo individual del árbol de alineación
// src/components/goals/tree/TreeNode.tsx
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { memo, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronRight, ChevronDown, Building2, Users, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import GoalProgressBar from '../GoalProgressBar'
import type { TreeGoal } from '@/hooks/useAlignmentTree'

// ════════════════════════════════════════════════════════════════════════════
// CONFIGURACIÓN POR NIVEL
// ════════════════════════════════════════════════════════════════════════════

const LEVEL_CONFIG = {
  COMPANY: {
    icon: Building2,
    bgClass: 'from-amber-500/20 to-amber-600/10 border-amber-500/30',
    iconColor: 'text-amber-400',
    label: 'Corporativa',
  },
  AREA: {
    icon: Users,
    bgClass: 'from-purple-500/20 to-purple-600/10 border-purple-500/30',
    iconColor: 'text-purple-400',
    label: 'Area',
  },
  INDIVIDUAL: {
    icon: User,
    bgClass: 'from-cyan-500/20 to-cyan-600/10 border-cyan-500/30',
    iconColor: 'text-cyan-400',
    label: 'Individual',
  },
} as const

// ════════════════════════════════════════════════════════════════════════════
// PROPS
// ════════════════════════════════════════════════════════════════════════════

interface TreeNodeProps {
  goal: TreeGoal
  depth?: number
  isLast?: boolean
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE
// ════════════════════════════════════════════════════════════════════════════

export const TreeNode = memo(function TreeNode({
  goal,
  depth = 0,
  isLast = false,
}: TreeNodeProps) {
  const router = useRouter()
  const [isExpanded, setIsExpanded] = useState(depth < 2)
  const hasChildren = goal.children && goal.children.length > 0

  const config = LEVEL_CONFIG[goal.level]
  const Icon = config.icon

  const handleToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    if (hasChildren) {
      setIsExpanded(prev => !prev)
    }
  }, [hasChildren])

  const handleClick = useCallback(() => {
    router.push(`/dashboard/metas/${goal.id}`)
  }, [router, goal.id])

  return (
    <div className="relative">
      {/* Connector lines from parent */}
      {depth > 0 && (
        <div className="absolute left-0 top-0 bottom-0 w-6">
          {/* Vertical line */}
          <div className={cn(
            'absolute left-3 top-0 w-0.5 bg-slate-700/60',
            isLast ? 'h-7' : 'h-full'
          )} />
          {/* Horizontal line */}
          <div className="absolute left-3 top-7 w-3 h-0.5 bg-slate-700/60" />
        </div>
      )}

      <div className={cn('relative', depth > 0 && 'ml-6')}>
        {/* Node card */}
        <div
          onClick={handleClick}
          className={cn(
            'p-3 md:p-4 rounded-xl border cursor-pointer',
            'bg-gradient-to-r transition-all duration-200 hover:scale-[1.01]',
            config.bgClass
          )}
        >
          <div className="flex items-center gap-2 md:gap-3">
            {/* Expand/collapse */}
            {hasChildren ? (
              <button
                onClick={handleToggle}
                className="p-1 rounded hover:bg-white/10 transition-colors flex-shrink-0"
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                )}
              </button>
            ) : (
              <div className="w-6 flex-shrink-0" />
            )}

            {/* Icon */}
            <div className={cn(
              'w-9 h-9 md:w-10 md:h-10 rounded-lg flex items-center justify-center bg-white/10 flex-shrink-0'
            )}>
              <Icon className={cn('w-4 h-4 md:w-5 md:h-5', config.iconColor)} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-white font-medium truncate text-sm md:text-base">
                  {goal.title}
                </h3>
                {hasChildren && (
                  <span className="text-xs text-slate-500 flex-shrink-0">
                    ({goal.children!.length})
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                {goal.owner && <span className="truncate">{goal.owner.fullName}</span>}
                {goal.department && <span className="truncate">{goal.department.displayName}</span>}
                {!goal.owner && !goal.department && <span>{config.label}</span>}
              </div>
            </div>

            {/* Progress */}
            <div className="w-20 md:w-24 flex-shrink-0">
              <div className="text-right text-sm text-white font-medium mb-1">
                {Math.round(goal.progress)}%
              </div>
              <GoalProgressBar
                progress={goal.progress}
                status={goal.status as 'NOT_STARTED' | 'ON_TRACK' | 'AT_RISK' | 'BEHIND' | 'COMPLETED' | 'CANCELLED'}
                size="sm"
                showLabel={false}
              />
            </div>
          </div>
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div className="mt-2 space-y-2">
            {goal.children!.map((child: TreeGoal, index: number) => (
              <TreeNode
                key={child.id}
                goal={child}
                depth={depth + 1}
                isLast={index === goal.children!.length - 1}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
})
