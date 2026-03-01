// ════════════════════════════════════════════════════════════════════════════
// AlignmentTreePremium - Árbol de Alineación Estilo Tesla/Apple
// src/components/goals/tree/AlignmentTreePremium.tsx
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { memo, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, ChevronDown, Target, Building2, User } from 'lucide-react'
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
// CONFIG POR NIVEL
// ════════════════════════════════════════════════════════════════════════════

const LEVEL_CONFIG: Record<string, { icon: typeof Target; label: string }> = {
  COMPANY: {
    icon: Target,
    label: 'Corporativa',
  },
  AREA: {
    icon: Building2,
    label: 'Área',
  },
  INDIVIDUAL: {
    icon: User,
    label: 'Individual',
  },
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
    <div className="space-y-3">
      {goals.map((goal, index) => (
        <TreeNodePremium
          key={goal.id}
          goal={goal}
          isLast={index === goals.length - 1}
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
  isLast = false,
  onGoalClick,
}: {
  goal: TreeGoal
  depth?: number
  isLast?: boolean
  onGoalClick?: (goalId: string) => void
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  const children = goal.children ?? []
  const hasChildren = children.length > 0
  const config = LEVEL_CONFIG[goal.level] || LEVEL_CONFIG.INDIVIDUAL
  const Icon = config.icon

  const handleToggle = useCallback(() => {
    if (hasChildren) {
      setIsExpanded(prev => !prev)
    }
  }, [hasChildren])

  const handleClick = useCallback(() => {
    onGoalClick?.(goal.id)
  }, [goal.id, onGoalClick])

  const progress = goal.progress || 0

  return (
    <div className="relative">
      {/* Línea conectora vertical (Tesla style) */}
      {depth > 0 && (
        <div
          className="absolute top-0 bottom-0 w-px"
          style={{
            left: `${(depth - 1) * 32 + 16}px`,
            background: 'linear-gradient(180deg, #22D3EE 0%, #A78BFA 100%)',
            opacity: 0.3,
          }}
        />
      )}

      {/* Línea conectora horizontal */}
      {depth > 0 && (
        <div
          className="absolute top-6 h-px"
          style={{
            left: `${(depth - 1) * 32 + 16}px`,
            width: '16px',
            background: 'linear-gradient(90deg, #22D3EE, #A78BFA)',
            opacity: 0.3,
          }}
        />
      )}

      {/* Card del nodo */}
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2, delay: depth * 0.05 }}
        style={{ marginLeft: `${depth * 32}px` }}
        className={cn(
          'relative rounded-xl border transition-all duration-200 overflow-hidden',
          'bg-slate-800/40 backdrop-blur border-slate-700/50',
          'hover:border-cyan-500/30 hover:bg-slate-800/60',
          goal.level === 'COMPANY' && 'border-cyan-500/20'
        )}
      >
        {/* Línea Tesla en cards COMPANY */}
        {goal.level === 'COMPANY' && (
          <div
            className="absolute top-0 left-0 right-0 h-[2px]"
            style={{
              background: 'linear-gradient(90deg, #22D3EE, #A78BFA)',
              boxShadow: '0 0 10px #22D3EE',
            }}
          />
        )}

        <div className="p-4 flex items-center gap-4">
          {/* Botón expandir */}
          {hasChildren ? (
            <button
              onClick={handleToggle}
              className="w-6 h-6 rounded-md bg-slate-700/50 flex items-center justify-center
                       hover:bg-cyan-500/20 transition-colors flex-shrink-0"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-cyan-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-400" />
              )}
            </button>
          ) : (
            <div className="w-6 h-6 flex-shrink-0" />
          )}

          {/* Icono de nivel */}
          <div
            className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
              goal.level === 'COMPANY' && 'bg-cyan-500/10 border border-cyan-500/20',
              goal.level === 'AREA' && 'bg-purple-500/10 border border-purple-500/20',
              goal.level === 'INDIVIDUAL' && 'bg-slate-700/50 border border-slate-600/50'
            )}
          >
            <Icon
              className={cn(
                'w-5 h-5',
                goal.level === 'COMPANY' && 'text-cyan-400',
                goal.level === 'AREA' && 'text-purple-400',
                goal.level === 'INDIVIDUAL' && 'text-slate-400'
              )}
            />
          </div>

          {/* Contenido */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <button
                onClick={handleClick}
                className="text-white font-medium truncate hover:text-cyan-400 transition-colors text-left"
              >
                {goal.title}
              </button>
              {hasChildren && (
                <span className="text-xs text-slate-500 flex-shrink-0">
                  ({children.length})
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 truncate">
              {config.label}
              {goal.owner && ` · ${formatDisplayName(goal.owner.fullName, 'short')}`}
              {goal.department && ` · ${goal.department.displayName}`}
            </p>
          </div>

          {/* Progreso */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="w-24 h-1.5 bg-slate-700 rounded-full overflow-hidden hidden sm:block">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${Math.min(progress, 100)}%`,
                  background:
                    progress >= 100
                      ? '#22D3EE'
                      : 'linear-gradient(90deg, #22D3EE, #A78BFA)',
                  boxShadow: progress >= 100 ? '0 0 8px #22D3EE' : 'none',
                }}
              />
            </div>
            <span
              className={cn(
                'text-sm font-medium w-12 text-right',
                progress >= 100 ? 'text-cyan-400' : 'text-white'
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
            className="mt-2 space-y-2"
          >
            {children.map((child, index) => (
              <TreeNodePremium
                key={child.id}
                goal={child}
                depth={depth + 1}
                isLast={index === children.length - 1}
                onGoalClick={onGoalClick}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
})
