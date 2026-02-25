// src/components/goals/hub/GoalsRail.tsx
'use client'

import { memo, useRef } from 'react'
import { ChevronRight, ChevronLeft, Plus, Target } from 'lucide-react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import type { GoalSummary } from '@/hooks/useGoalsHubData'

interface GoalsRailProps {
  goals: GoalSummary[]
  onGoalClick: (goal: GoalSummary) => void
}

const LEVEL_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  COMPANY: { bg: 'bg-amber-500/10', text: 'text-amber-400', label: 'Corporativa' },
  AREA: { bg: 'bg-purple-500/10', text: 'text-purple-400', label: 'Área' },
  INDIVIDUAL: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', label: 'Individual' },
}

export const GoalsRail = memo(function GoalsRail({
  goals,
  onGoalClick,
}: GoalsRailProps) {
  const router = useRouter()
  const scrollRef = useRef<HTMLDivElement>(null)

  const scrollLeft = () => scrollRef.current?.scrollBy({ left: -200, behavior: 'smooth' })
  const scrollRight = () => scrollRef.current?.scrollBy({ left: 200, behavior: 'smooth' })

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-white font-medium flex items-center gap-2">
          <Target className="w-5 h-5 text-cyan-400" />
          Mis Metas
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={scrollLeft}
            className="p-1.5 rounded-lg bg-slate-800/80 text-slate-400 hover:text-white border border-slate-700 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={scrollRight}
            className="p-1.5 rounded-lg bg-slate-800/80 text-slate-400 hover:text-white border border-slate-700 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Horizontal Scroll Rail */}
      <div className="relative group">
        <div
          ref={scrollRef}
          className="flex overflow-x-auto gap-4 pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] scroll-smooth"
        >
          {goals.map((goal) => {
            const level = LEVEL_STYLES[goal.level] || LEVEL_STYLES.INDIVIDUAL

            return (
              <motion.button
                key={goal.id}
                onClick={() => onGoalClick(goal)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-shrink-0 w-48 p-4 fhr-card text-left hover:border-cyan-500/30 transition-colors"
              >
                {/* Level badge */}
                <div className={`inline-flex px-2 py-0.5 rounded text-xs mb-2 ${level.bg} ${level.text}`}>
                  {level.label}
                </div>

                {/* Title */}
                <h4 className="text-white text-sm font-medium mb-3 line-clamp-2">
                  {goal.title}
                </h4>

                {/* Progress bar */}
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden mb-2">
                  <motion.div
                    className="h-full bg-gradient-to-r from-cyan-500 to-purple-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(goal.progress, 100)}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>

                {/* Progress text */}
                <span className="text-xs text-slate-400">
                  {Math.round(goal.progress)}% completado
                </span>
              </motion.button>
            )
          })}

          {/* Add Goal Card */}
          <motion.button
            onClick={() => router.push('/dashboard/metas/crear')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex-shrink-0 w-48 p-4 fhr-card flex flex-col items-center justify-center gap-2 border-dashed hover:border-cyan-500/30 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-cyan-500/10 flex items-center justify-center">
              <Plus className="w-5 h-5 text-cyan-400" />
            </div>
            <span className="text-sm text-slate-400">Crear Meta</span>
          </motion.button>
        </div>
      </div>
    </div>
  )
})
