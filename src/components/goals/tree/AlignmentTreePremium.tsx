// ════════════════════════════════════════════════════════════════════════════
// AlignmentTreePremium - Árbol de Alineación Apple/FocalizaHR
// src/components/goals/tree/AlignmentTreePremium.tsx
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { memo, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, ChevronDown, Target } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDisplayName } from '@/lib/utils/formatName'
import type { TreeGoal } from '@/hooks/useAlignmentTree'

// ════════════════════════════════════════════════════════════════════════════
// TIPOS
// ════════════════════════════════════════════════════════════════════════════

interface AlignmentTreePremiumProps {
  goals: TreeGoal[]
  onGoalClick?: (goalId: string) => void
}

// ════════════════════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════════════════════

const INDENT_PX = 48

function getContextLine(goal: TreeGoal): string {
  const children = goal.children ?? []
  if (goal.level === 'COMPANY') {
    return children.length > 0
      ? `${children.length} meta${children.length > 1 ? 's' : ''} conectada${children.length > 1 ? 's' : ''}`
      : 'Sin metas conectadas'
  }
  if (goal.level === 'AREA') {
    return goal.department?.displayName || ''
  }
  // INDIVIDUAL
  return goal.owner ? formatDisplayName(goal.owner.fullName, 'short') : ''
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════

export const AlignmentTreePremium = memo(function AlignmentTreePremium({
  goals,
  onGoalClick,
}: AlignmentTreePremiumProps) {
  if (goals.length === 0) {
    return (
      <div className="fhr-card p-12 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800/50 flex items-center justify-center">
          <Target className="w-8 h-8 text-slate-600" />
        </div>
        <h3 className="text-xl text-white mb-2">Sin metas corporativas</h3>
        <p className="text-slate-400">
          Crea tu primera meta corporativa para visualizar el mapa de alineamiento.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {goals.map((goal) => (
        <TreeNodePremium
          key={goal.id}
          goal={goal}
          onGoalClick={onGoalClick}
        />
      ))}
    </div>
  )
})

// ════════════════════════════════════════════════════════════════════════════
// NODO DEL ÁRBOL (Recursivo)
// ════════════════════════════════════════════════════════════════════════════

const TreeNodePremium = memo(function TreeNodePremium({
  goal,
  depth = 0,
  onGoalClick,
}: {
  goal: TreeGoal
  depth?: number
  onGoalClick?: (goalId: string) => void
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  const children = goal.children ?? []
  const hasChildren = children.length > 0
  const progress = goal.progress || 0
  const contextLine = getContextLine(goal)

  const handleToggle = useCallback(() => {
    if (hasChildren) setIsExpanded(prev => !prev)
  }, [hasChildren])

  const handleClick = useCallback(() => {
    onGoalClick?.(goal.id)
  }, [goal.id, onGoalClick])

  return (
    <div className="relative">
      {/* Línea conectora vertical */}
      {depth > 0 && (
        <div
          className="absolute top-0 bottom-0 w-px bg-slate-600"
          style={{ left: `${(depth - 1) * INDENT_PX + 16}px` }}
        />
      )}

      {/* Línea conectora horizontal */}
      {depth > 0 && (
        <div
          className="absolute top-5 h-px bg-slate-600"
          style={{
            left: `${(depth - 1) * INDENT_PX + 16}px`,
            width: `${INDENT_PX - 16}px`,
          }}
        />
      )}

      {/* Card del nodo */}
      <motion.div
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.15, delay: depth * 0.03 }}
        style={{ marginLeft: `${depth * INDENT_PX}px` }}
        className="relative rounded-xl border border-slate-700/30 bg-slate-800/40 backdrop-blur
                   hover:border-cyan-500/30 transition-all duration-200"
      >
        <div className="p-3 sm:p-4 flex items-center gap-3">
          {/* Chevron expandir/colapsar */}
          {hasChildren ? (
            <button
              onClick={handleToggle}
              className="flex-shrink-0 text-slate-500 hover:text-cyan-400 transition-colors"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          ) : (
            <div className="w-4 flex-shrink-0" />
          )}

          {/* Contenido */}
          <div className="flex-1 min-w-0">
            <button
              onClick={handleClick}
              className={cn(
                'truncate hover:text-cyan-400 transition-colors text-left block max-w-full',
                goal.level === 'COMPANY' && 'text-base font-medium text-white',
                goal.level === 'AREA' && 'text-sm font-normal text-slate-200',
                goal.level === 'INDIVIDUAL' && 'text-sm text-slate-400',
              )}
            >
              {goal.title}
            </button>
            {contextLine && (
              <p className="text-xs text-slate-500 truncate mt-0.5">{contextLine}</p>
            )}
          </div>

          {/* Progreso */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="w-20 sm:w-24 h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${Math.min(progress, 100)}%`,
                  backgroundColor: '#22D3EE',
                  boxShadow: progress >= 100 ? '0 0 6px #22D3EE' : 'none',
                }}
              />
            </div>
            <span
              className={cn(
                'text-sm w-10 text-right tabular-nums',
                progress >= 100 ? 'text-cyan-400 font-medium' : 'text-slate-400'
              )}
            >
              {progress}%
            </span>
          </div>
        </div>
      </motion.div>

      {/* Children (recursivo) */}
      <AnimatePresence>
        {isExpanded && hasChildren && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-1.5 space-y-1.5"
          >
            {children.map((child) => (
              <TreeNodePremium
                key={child.id}
                goal={child}
                depth={depth + 1}
                onGoalClick={onGoalClick}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
})
