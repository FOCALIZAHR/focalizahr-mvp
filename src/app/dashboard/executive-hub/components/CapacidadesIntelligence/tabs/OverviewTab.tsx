'use client'

// ════════════════════════════════════════════════════════════════════════════
// OVERVIEW TAB — Vista ejecutiva por capa organizacional
// Barras horizontales + narrativa + investment priorities
// ════════════════════════════════════════════════════════════════════════════

import { memo } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { GraduationCap } from 'lucide-react'
import { LAYER_ORDER, ACOTADO_LABELS, ROLE_FIT_HIGH } from '../Capacidades.constants'
import { getScoreTextColor } from '../Capacidades.utils'
import type { CapacidadesData } from '../Capacidades.types'

interface OverviewTabProps {
  data: CapacidadesData
}

export default memo(function OverviewTab({ data }: OverviewTabProps) {
  const layers = LAYER_ORDER.filter(l => data.byLayer[l] !== undefined)

  return (
    <div className="space-y-5">

      {/* Overall */}
      <div className="text-center">
        <span className={cn('text-4xl font-light font-mono', getScoreTextColor(data.overall))}>
          {data.overall}%
        </span>
        <p className="text-xs text-slate-500 mt-1">Role Fit Organizacional</p>
      </div>

      {/* Barras por capa */}
      <div className="space-y-3">
        {layers.map((layer, i) => {
          const score = data.byLayer[layer]
          const belowThreshold = score < ROLE_FIT_HIGH
          return (
            <motion.div
              key={layer}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              className="flex items-center gap-3"
            >
              <span className="text-[11px] text-slate-400 w-28 text-right shrink-0">
                {ACOTADO_LABELS[layer] || layer}
              </span>
              <div className="flex-1 h-5 bg-slate-800/50 rounded-full overflow-hidden relative">
                <motion.div
                  className={cn(
                    'h-full rounded-full',
                    belowThreshold ? 'bg-amber-500/50' : 'bg-cyan-500/40'
                  )}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(score, 3)}%` }}
                  transition={{ duration: 0.6, delay: i * 0.06 + 0.2 }}
                />
                {/* Threshold line */}
                <div
                  className="absolute top-0 bottom-0 w-px bg-white/20"
                  style={{ left: `${ROLE_FIT_HIGH}%` }}
                />
              </div>
              <span className={cn(
                'text-sm font-mono font-bold w-12 text-right shrink-0',
                getScoreTextColor(score)
              )}>
                {score}%
              </span>
            </motion.div>
          )
        })}

        {/* Legend */}
        <div className="flex items-center justify-end gap-4 text-[9px] text-slate-600 pt-1">
          <span className="flex items-center gap-1">
            <span className="w-px h-3 bg-white/20" /> Umbral {ROLE_FIT_HIGH}%
          </span>
        </div>
      </div>

      {/* Investment Priorities */}
      {data.investmentPriorities.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="h-px w-8 bg-white/10" />
            <span className="text-[10px] text-slate-500 font-medium">Prioridades de inversión</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>
          <div className="space-y-2">
            {data.investmentPriorities.slice(0, 4).map((p, i) => (
              <div key={i} className="px-3 py-2.5 rounded-xl bg-slate-900/40 backdrop-blur-sm border border-slate-800/40">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-white font-medium">
                    {p.layerLabel} · {p.gerencia}
                  </span>
                  <span className={cn('text-xs font-mono font-bold', getScoreTextColor(p.avgRoleFit))}>
                    {p.avgRoleFit}%
                  </span>
                </div>
                {p.topGaps.length > 0 && (
                  <p className="text-[10px] text-slate-500">
                    {p.topGaps.slice(0, 3).join(' · ')}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
})
