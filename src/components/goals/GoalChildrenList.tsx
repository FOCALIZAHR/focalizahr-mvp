// ════════════════════════════════════════════════════════════════════════════
// GOAL CHILDREN LIST - Lista de metas derivadas
// src/components/goals/GoalChildrenList.tsx
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { memo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronRight } from 'lucide-react'
import GoalLevelBadge from './GoalLevelBadge'
import GoalProgressBar from './GoalProgressBar'

// ════════════════════════════════════════════════════════════════════════════
// TIPOS
// ════════════════════════════════════════════════════════════════════════════

type GoalLevel = 'COMPANY' | 'AREA' | 'INDIVIDUAL'
type GoalStatus = 'NOT_STARTED' | 'ON_TRACK' | 'AT_RISK' | 'BEHIND' | 'COMPLETED' | 'CANCELLED'

interface GoalChild {
  id: string
  title: string
  level: GoalLevel
  progress: number
  status: GoalStatus
  owner?: { id: string; fullName: string } | null
}

interface GoalChildrenListProps {
  children: GoalChild[]
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE
// ════════════════════════════════════════════════════════════════════════════

export default memo(function GoalChildrenList({
  children: childGoals,
}: GoalChildrenListProps) {
  const router = useRouter()

  const handleNavigate = useCallback(
    (id: string) => {
      router.push(`/dashboard/metas/${id}`)
    },
    [router]
  )

  if (!childGoals || childGoals.length === 0) {
    return null
  }

  return (
    <div className="fhr-card">
      <h3 className="fhr-title-card mb-4">
        Metas Derivadas ({childGoals.length})
      </h3>

      <div className="space-y-3">
        {childGoals.map((child) => (
          <button
            key={child.id}
            onClick={() => handleNavigate(child.id)}
            className="w-full p-4 bg-slate-800/50 hover:bg-slate-800 rounded-xl transition-colors text-left group"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 min-w-0">
                <GoalLevelBadge level={child.level} />
                <span className="text-sm text-white font-medium truncate">
                  {child.title}
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-colors shrink-0 ml-2" />
            </div>

            <GoalProgressBar
              progress={child.progress}
              status={child.status}
              size="sm"
            />

            {child.owner && (
              <p className="fhr-text-sm text-slate-500 mt-2">
                {child.owner.fullName}
              </p>
            )}
          </button>
        ))}
      </div>
    </div>
  )
})
