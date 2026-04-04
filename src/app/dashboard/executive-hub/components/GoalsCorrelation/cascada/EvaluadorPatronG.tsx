'use client'

// ════════════════════════════════════════════════════════════════════════════
// EVALUADOR PATRÓN G — Panel 2 actos + lista colapsada
// src/app/dashboard/executive-hub/components/GoalsCorrelation/cascada/EvaluadorPatronG.tsx
// ════════════════════════════════════════════════════════════════════════════
// Acto 1: "Cómo evalúa este líder" (narrativa + MetricBars + coaching)
// Acto 2: "Impacto en compensaciones" (conexión Tab 3)
// Capa 3: Lista evaluados colapsada
// ════════════════════════════════════════════════════════════════════════════

import { memo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDisplayName } from '@/lib/utils/formatName'
import { GhostButton } from '@/components/ui/PremiumButton'

import type { ManagerGoalsStats } from '../GoalsCorrelation.types'
import { MetricBar } from '../shared/MetricBar'
import {
  type EvaluadorNarrative,
  getGapNarrative,
  getCompensationImpactNarrative,
} from '@/config/narratives/EvaluadorNarrativeDictionary'

// ════════════════════════════════════════════════════════════════════════════

interface EvaluadorPatronGProps {
  manager: ManagerGoalsStats
  narrative: EvaluadorNarrative
  compensationImpact: {
    totalInCheckpoint: number
    perceptionBiasCount: number
  }
  onClose: () => void
}

export default memo(function EvaluadorPatronG({
  manager: mgr,
  narrative,
  compensationImpact,
  onClose,
}: EvaluadorPatronGProps) {
  const [showTeam, setShowTeam] = useState(false)
  const firstName = formatDisplayName(mgr.managerName)
  const normalized360 = ((mgr.avgScore360Given - 1) / 4) * 100

  return (
    <div className="rounded-2xl border border-slate-800/30 bg-slate-900/30 p-5 relative">
      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-slate-600 hover:text-slate-400 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Evaluator name */}
      <p className="text-lg font-extralight text-white tracking-tight mb-1">
        {firstName}
      </p>
      <p className="text-[10px] text-slate-600 mb-5">
        {mgr.gerenciaName} · {mgr.evaluatedCount} persona{mgr.evaluatedCount !== 1 ? 's' : ''}
      </p>

      {/* ═══ Acto 1: Cómo evalúa este líder ═══ */}
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400/50 flex-shrink-0" />
          <p className="text-xs text-slate-300 font-medium tracking-wide">Cómo evalúa este líder</p>
        </div>

        {/* Observation narrative */}
        <p className="text-xs font-light text-slate-400 leading-relaxed mb-4">
          {narrative.observation}
        </p>

        {/* Gap narrative */}
        <p className="text-xs font-light text-slate-500 leading-relaxed mb-4">
          {getGapNarrative(firstName, mgr.coherenceGap)}
        </p>

        {/* MetricBars */}
        <div className="space-y-2.5 mb-4">
          <MetricBar label="360° promedio dado" value={normalized360} threshold={75} color="cyan" />
          <MetricBar label="Metas promedio evaluados" value={mgr.avgGoalsOfReports} threshold={80} color="purple" />
        </div>

        {/* Coaching tip */}
        {narrative.coachingTip && (
          <div className="border-l-2 border-cyan-500/20 pl-3">
            <p className="text-[11px] font-light text-slate-500 leading-relaxed italic">
              {narrative.coachingTip}
            </p>
          </div>
        )}
      </div>

      {/* ═══ Acto 2: Impacto en compensaciones ═══ */}
      {compensationImpact.totalInCheckpoint > 0 && (
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400/50 flex-shrink-0" />
            <p className="text-xs text-slate-300 font-medium tracking-wide">Impacto en compensaciones</p>
          </div>

          <p className="text-xs font-light text-slate-400 leading-relaxed">
            {getCompensationImpactNarrative(
              firstName,
              mgr.evaluatedCount,
              compensationImpact.totalInCheckpoint,
              compensationImpact.perceptionBiasCount,
            )}
          </p>
        </div>
      )}

      {/* ═══ Capa 3: Lista evaluados colapsada ═══ */}
      <div>
        <GhostButton
          icon={ChevronDown}
          iconPosition="right"
          onClick={() => setShowTeam(!showTeam)}
          size="sm"
        >
          {showTeam ? 'Ocultar' : `Ver ${mgr.employees.length}`} evaluado{mgr.employees.length !== 1 ? 's' : ''}
        </GhostButton>

        <AnimatePresence>
          {showTeam && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="mt-3 space-y-0.5">
                {mgr.employees.map(emp => (
                  <div key={emp.id} className="flex items-center justify-between py-1.5">
                    <span className="text-xs font-light text-slate-300 truncate flex-1">
                      {formatDisplayName(emp.name)}
                    </span>
                    <div className="flex items-center gap-3 flex-shrink-0 ml-2">
                      <span className="text-[10px] font-mono text-cyan-400/60">
                        {emp.score360.toFixed(1)}
                      </span>
                      <span className={cn(
                        'text-[10px] font-mono',
                        emp.goalsPercent !== null && emp.goalsPercent >= 80 ? 'text-purple-400/60' : 'text-slate-600'
                      )}>
                        {emp.goalsPercent !== null ? `${Math.round(emp.goalsPercent)}%` : '—'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
})
