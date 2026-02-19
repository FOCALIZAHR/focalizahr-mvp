// ════════════════════════════════════════════════════════════════════════════
// ALIGNMENT TREE - Contenedor principal del árbol de alineación
// src/components/goals/tree/AlignmentTree.tsx
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { memo, useState, useCallback } from 'react'
import { TreeNode } from './TreeNode'
import { OrphanAlert } from './OrphanAlert'
import { Target, Expand, Shrink, RefreshCw } from 'lucide-react'
import { GhostButton, SecondaryButton } from '@/components/ui/PremiumButton'
import type { TreeGoal } from '@/hooks/useAlignmentTree'

// ════════════════════════════════════════════════════════════════════════════
// TIPOS
// ════════════════════════════════════════════════════════════════════════════

interface AlignmentTreeProps {
  tree: TreeGoal[]
  orphans: Array<{
    id: string
    title: string
    owner?: { id: string; fullName: string } | null
  }>
  report: {
    totalGoals: number
    alignedGoals: number
    alignmentRate: number
  } | null
  isLoading: boolean
  onRefresh?: () => void
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE
// ════════════════════════════════════════════════════════════════════════════

export const AlignmentTree = memo(function AlignmentTree({
  tree,
  orphans,
  report,
  isLoading,
  onRefresh,
}: AlignmentTreeProps) {
  const [expandAll, setExpandAll] = useState(false)

  const handleExpandToggle = useCallback(() => {
    setExpandAll(prev => !prev)
  }, [])

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="fhr-skeleton h-32 w-full rounded-xl" />
        <div className="fhr-skeleton h-24 w-full ml-6 rounded-xl" />
        <div className="fhr-skeleton h-20 w-full ml-12 rounded-xl" />
      </div>
    )
  }

  if (tree.length === 0) {
    return (
      <div className="fhr-card p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800 flex items-center justify-center">
          <Target className="w-8 h-8 text-slate-600" />
        </div>
        <h3 className="text-xl text-white mb-2">Sin metas corporativas</h3>
        <p className="text-slate-400 mb-6">
          Crea tu primera meta corporativa para comenzar el árbol de alineación
        </p>
        <SecondaryButton
          icon={Target}
          onClick={() => window.location.href = '/dashboard/metas/crear'}
        >
          Crear Meta Corporativa
        </SecondaryButton>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header con stats */}
      {report && (
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-4 bg-slate-800/30 rounded-xl border border-slate-700/30">
          <div className="flex items-center gap-6">
            <div>
              <div className="text-2xl font-light text-white">
                {report.alignmentRate}%
              </div>
              <div className="text-xs text-slate-400">Tasa de alineación</div>
            </div>
            <div className="h-8 w-px bg-slate-700" />
            <div>
              <div className="text-lg text-white">
                {report.alignedGoals}/{report.totalGoals}
              </div>
              <div className="text-xs text-slate-400">Metas alineadas</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <GhostButton
              size="sm"
              icon={expandAll ? Shrink : Expand}
              onClick={handleExpandToggle}
            >
              {expandAll ? 'Colapsar' : 'Expandir'}
            </GhostButton>
            {onRefresh && (
              <GhostButton
                size="sm"
                icon={RefreshCw}
                onClick={onRefresh}
              >
                Actualizar
              </GhostButton>
            )}
          </div>
        </div>
      )}

      {/* Orphan alert */}
      <OrphanAlert count={orphans.length} orphans={orphans} />

      {/* Tree */}
      <div className="space-y-4">
        {tree.map((rootGoal, index) => (
          <TreeNode
            key={rootGoal.id}
            goal={rootGoal}
            depth={0}
            isLast={index === tree.length - 1}
          />
        ))}
      </div>
    </div>
  )
})
