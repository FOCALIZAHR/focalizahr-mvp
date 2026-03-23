'use client'

// ════════════════════════════════════════════════════════════════════════════
// LENS SELECTOR — 3 lentes de auditoría para CEO
// ════════════════════════════════════════════════════════════════════════════

import { memo } from 'react'
import { cn } from '@/lib/utils'
import { BarChart3, Crown, Clock } from 'lucide-react'

export type LensType = 'gerencia' | 'critical' | 'tenure'

interface PLTalentLensSelectorProps {
  activeLens: LensType
  onLensChange: (lens: LensType) => void
  counts: {
    gerencias: number
    critical: number
    tenureRisk: number
  }
  disabled?: boolean
}

const LENSES = [
  { key: 'gerencia' as const, label: 'Visión Gerencia', icon: BarChart3, countKey: 'gerencias' as const },
  { key: 'critical' as const, label: 'Cargos Críticos', icon: Crown, countKey: 'critical' as const, requiresOrchestrator: true },
  { key: 'tenure' as const, label: 'ROI Antigüedad', icon: Clock, countKey: 'tenureRisk' as const, requiresOrchestrator: true },
]

export default memo(function PLTalentLensSelector({
  activeLens,
  onLensChange,
  counts,
  disabled = false,
}: PLTalentLensSelectorProps) {
  return (
    <div className="flex items-center gap-1 p-1 bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-x-auto">
      {LENSES.map(lens => {
        const Icon = lens.icon
        const count = counts[lens.countKey]
        const isActive = activeLens === lens.key
        const isDisabled = disabled && lens.requiresOrchestrator

        return (
          <button
            key={lens.key}
            onClick={() => !isDisabled && onLensChange(lens.key)}
            disabled={isDisabled}
            className={cn(
              'flex items-center gap-2 px-3 py-2 md:px-4 md:py-2.5 rounded-lg transition-all duration-200',
              'text-xs md:text-sm font-medium whitespace-nowrap',
              isActive
                ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-white border border-cyan-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50',
              isDisabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            <Icon className="w-3.5 h-3.5 md:w-4 md:h-4" />
            <span className="hidden md:inline">{lens.label}</span>
            <span className={cn(
              'px-1.5 py-0.5 rounded-full text-[10px] md:text-xs',
              isActive ? 'bg-cyan-500/30 text-cyan-300' : 'bg-slate-700 text-slate-400'
            )}>
              {count}
            </span>
          </button>
        )
      })}
    </div>
  )
})
