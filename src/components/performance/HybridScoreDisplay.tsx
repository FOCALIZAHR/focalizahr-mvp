// ════════════════════════════════════════════════════════════════════════════
// HYBRID SCORE DISPLAY - Desglose Competencias + Metas
// src/components/performance/HybridScoreDisplay.tsx
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { memo } from 'react'
import { Brain, Target } from 'lucide-react'

interface HybridScoreDisplayProps {
  hybridScore: number
  competenciesScore: number
  competenciesWeight: number
  goalsScore: number | null
  goalsRawPercent: number | null
  goalsWeight: number
  goalsCount?: number
  includesGoals: boolean
  variant?: 'full' | 'compact'
}

export const HybridScoreDisplay = memo(function HybridScoreDisplay({
  hybridScore,
  competenciesScore,
  competenciesWeight,
  goalsScore,
  goalsRawPercent,
  goalsWeight,
  goalsCount,
  includesGoals,
  variant = 'full'
}: HybridScoreDisplayProps) {
  if (!includesGoals) {
    if (variant === 'compact') return null
    return (
      <div className="text-center text-slate-500 text-sm py-2">
        Este ciclo evalúa solo competencias
      </div>
    )
  }

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-3 text-xs text-slate-400">
        <span className="flex items-center gap-1">
          <Brain className="w-3 h-3 text-purple-400" />
          {competenciesScore.toFixed(1)} × {competenciesWeight}%
        </span>
        <span className="text-slate-600">+</span>
        <span className="flex items-center gap-1">
          <Target className="w-3 h-3 text-cyan-400" />
          {goalsScore?.toFixed(1) ?? '-'} × {goalsWeight}%
        </span>
        <span className="text-slate-600">=</span>
        <span className="text-white font-medium">{hybridScore.toFixed(1)}</span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Competencias */}
      <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-purple-500/15 flex items-center justify-center">
            <Brain className="w-4 h-4 text-purple-400" />
          </div>
          <div>
            <p className="text-sm text-white font-medium">Competencias</p>
            <p className="text-xs text-slate-500">El CÓMO</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg text-white tabular-nums">{competenciesScore.toFixed(1)}</p>
          <p className="text-xs text-slate-500">× {competenciesWeight}%</p>
        </div>
      </div>

      {/* Metas */}
      <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-cyan-500/15 flex items-center justify-center">
            <Target className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <p className="text-sm text-white font-medium">Metas</p>
            <p className="text-xs text-slate-500">
              El QUÉ{goalsCount != null ? ` · ${goalsCount} metas` : ''}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg text-white tabular-nums">{goalsScore?.toFixed(1) ?? '-'}</p>
          <p className="text-xs text-slate-500">
            {goalsRawPercent !== null ? `${goalsRawPercent.toFixed(0)}%` : '-'} × {goalsWeight}%
          </p>
        </div>
      </div>

      {/* Fórmula visual */}
      <div className="text-center pt-3 border-t border-slate-700/50">
        <p className="text-xs text-slate-500">
          ({competenciesScore.toFixed(1)} × {competenciesWeight}%) +{' '}
          ({goalsScore?.toFixed(1) ?? '0'} × {goalsWeight}%) ={' '}
          <span className="text-cyan-400 font-medium">{hybridScore.toFixed(1)}</span>
        </p>
      </div>
    </div>
  )
})
