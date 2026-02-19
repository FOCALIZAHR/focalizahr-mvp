// ════════════════════════════════════════════════════════════════════════════
// TEAM COVERAGE GAUGE - Indicador visual de cobertura de metas del equipo
// src/components/goals/team/TeamCoverageGauge.tsx
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { memo, useMemo } from 'react'
import { Users, AlertTriangle } from 'lucide-react'
import type { TeamStats } from '@/hooks/useTeamGoals'

// ════════════════════════════════════════════════════════════════════════════
// PROPS
// ════════════════════════════════════════════════════════════════════════════

interface TeamCoverageGaugeProps {
  stats: TeamStats
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE
// ════════════════════════════════════════════════════════════════════════════

export const TeamCoverageGauge = memo(function TeamCoverageGauge({ stats }: TeamCoverageGaugeProps) {
  const coveragePercent = useMemo(() => {
    const relevantTotal = stats.total - stats.noGoalsRequired
    return relevantTotal > 0
      ? Math.round((stats.withGoals / relevantTotal) * 100)
      : 100
  }, [stats])

  const relevantTotal = stats.total - stats.noGoalsRequired

  return (
    <div className="fhr-card p-5 md:p-6">
      <div className="flex items-center gap-4 mb-4">
        <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex-shrink-0">
          <Users className="w-6 h-6 text-cyan-400" />
        </div>
        <div>
          <h3 className="text-white font-medium">Cobertura de Metas</h3>
          <p className="text-sm text-slate-400">
            {stats.withGoals} de {relevantTotal} colaboradores con metas
          </p>
        </div>
      </div>

      {/* Gauge bar */}
      <div className="space-y-2">
        <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${coveragePercent}%` }}
          />
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-400">
            {coveragePercent}% de cobertura
          </span>
          {stats.withoutGoals > 0 && (
            <span className="flex items-center gap-1 text-amber-400">
              <AlertTriangle className="w-3 h-3" />
              {stats.withoutGoals} sin metas
            </span>
          )}
        </div>
      </div>

      {/* Stats breakdown */}
      <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-slate-700/50">
        <div className="text-center">
          <div className="text-lg font-medium text-emerald-400">{stats.withGoals}</div>
          <div className="text-xs text-slate-500">Con metas</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-medium text-amber-400">{stats.withoutGoals}</div>
          <div className="text-xs text-slate-500">Sin metas</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-medium text-slate-400">{stats.noGoalsRequired}</div>
          <div className="text-xs text-slate-500">Cargo sin metas</div>
        </div>
      </div>
    </div>
  )
})
