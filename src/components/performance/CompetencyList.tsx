'use client'

// ════════════════════════════════════════════════════════════════════════════
// COMPETENCY LIST - Sorted competencies with visual indicators
// src/components/performance/CompetencyList.tsx
// ════════════════════════════════════════════════════════════════════════════

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface CompetencyListProps {
  competencies: Array<{
    code: string
    name: string
    avgScore: number
  }>
  topCode: string
  lowCode: string
}

export function CompetencyList({ competencies, topCode, lowCode }: CompetencyListProps) {
  const sorted = [...competencies].sort((a, b) => b.avgScore - a.avgScore)

  const gap = sorted.length > 1
    ? sorted[0].avgScore - sorted[sorted.length - 1].avgScore
    : 0

  return (
    <div className="space-y-4">
      {sorted.map((comp, index) => {
        const isTop = comp.code === topCode
        const isLow = comp.code === lowCode
        const isCritical = comp.avgScore < 2.5
        const percent = (comp.avgScore / 5) * 100

        return (
          <div key={comp.code} className="space-y-2">
            {/* Name and badges */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/80">{comp.name}</span>
              <div className="flex items-center gap-2">
                {isTop && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full
                    bg-cyan-500/20 text-cyan-400 font-medium">
                    Fortaleza
                  </span>
                )}
                {isLow && !isCritical && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full
                    bg-amber-500/20 text-amber-400 font-medium">
                    Desarrollo
                  </span>
                )}
                {isCritical && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full
                    bg-red-500/20 text-red-400 font-medium animate-pulse">
                    Critico
                  </span>
                )}
              </div>
            </div>

            {/* Progress bar */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percent}%` }}
                  transition={{ duration: 0.8, delay: index * 0.1 }}
                  className={cn(
                    'h-full rounded-full',
                    isCritical && 'bg-gradient-to-r from-red-600 to-red-400',
                    isTop && !isCritical && 'bg-gradient-to-r from-cyan-600 to-cyan-400',
                    isLow && !isCritical && 'bg-gradient-to-r from-amber-600 to-amber-400',
                    !isTop && !isLow && !isCritical && 'bg-gradient-to-r from-slate-600 to-slate-400'
                  )}
                />
              </div>
              <span className="text-xs font-mono text-white/60 w-16 text-right">
                {comp.avgScore.toFixed(1)} / 5.0
              </span>
            </div>
          </div>
        )
      })}

      {/* Gap indicator */}
      {sorted.length > 1 && (
        <div className="pt-4 border-t border-white/5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-white/40">Gap entre top y bottom</span>
            <span className={cn(
              'font-mono font-medium',
              gap < 0.5 && 'text-emerald-400',
              gap >= 0.5 && gap < 1.0 && 'text-amber-400',
              gap >= 1.0 && 'text-red-400'
            )}>
              {gap.toFixed(1)} pts
              {' '}({gap < 0.5 ? 'bajo' : gap < 1.0 ? 'moderado' : 'alto'})
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
