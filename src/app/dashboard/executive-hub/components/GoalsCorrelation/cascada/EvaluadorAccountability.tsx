'use client'

// ════════════════════════════════════════════════════════════════════════════
// EVALUADOR ACCOUNTABILITY — "La Radiografía del Evaluador"
// src/app/dashboard/executive-hub/components/GoalsCorrelation/cascada/EvaluadorAccountability.tsx
// ════════════════════════════════════════════════════════════════════════════
// Diferenciador competitivo: ningún sistema en LATAM muestra accountability
// individual del evaluador cruzando 360° dado vs metas de evaluados.
// Patrón clonado de BiasDetailModal.tsx (card pattern)
// ════════════════════════════════════════════════════════════════════════════

import { memo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

import type { ManagerGoalsStats } from '../GoalsCorrelation.types'
import { MetricBar } from '../shared/MetricBar'

// ════════════════════════════════════════════════════════════════════════════
// STATUS CONFIG
// ════════════════════════════════════════════════════════════════════════════

const STATUS_BADGE: Record<string, { text: string; color: string; ring: string }> = {
  INDULGENTE: {
    text: 'Indulgente',
    color: 'text-red-400 bg-red-500/10 border-red-500/20',
    ring: 'ring-red-500/20',
  },
  SEVERA: {
    text: 'Severa',
    color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    ring: 'ring-amber-500/20',
  },
  CENTRAL: {
    text: 'Central',
    color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
    ring: 'ring-cyan-500/20',
  },
  OPTIMA: {
    text: 'Óptima',
    color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    ring: 'ring-emerald-500/20',
  },
}

function getGapNarrative(mgr: ManagerGoalsStats): string {
  if (mgr.coherenceGap >= 40) {
    return `Las evaluaciones de ${mgr.managerName.split(' ')[0]} no predicen resultados. Gap de ${mgr.coherenceGap}% entre lo que evalúa y lo que su equipo entrega.`
  }
  if (mgr.coherenceGap >= 20) {
    return `Desconexión moderada entre evaluación y resultados. Revisar criterios de evaluación.`
  }
  return `Evaluación alineada con resultados. Base confiable para decisiones de compensación.`
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ════════════════════════════════════════════════════════════════════════════

interface EvaluadorAccountabilityProps {
  byManager: ManagerGoalsStats[]
}

export default memo(function EvaluadorAccountability({ byManager }: EvaluadorAccountabilityProps) {
  if (byManager.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-500">
        <CheckCircle className="w-6 h-6 mb-2 text-emerald-400/40" />
        <p className="text-sm font-light">Todos los evaluadores muestran coherencia.</p>
      </div>
    )
  }

  const withIssues = byManager.filter(m => m.coherenceGap >= 20)
  const aligned = byManager.filter(m => m.coherenceGap < 20)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h3 className="text-lg font-extralight text-white tracking-tight">
          Radiografía{' '}
          <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
            del evaluador
          </span>
        </h3>
        <p className="text-xs font-light text-slate-500 mt-1">
          {byManager.length} evaluador{byManager.length !== 1 ? 'es' : ''}
          {withIssues.length > 0 && (
            <> · <span className="text-amber-400">{withIssues.length} con desconexión</span></>
          )}
        </p>
      </div>

      {/* Cards — issues first */}
      <div className="space-y-2">
        {withIssues.map((mgr, idx) => (
          <EvaluadorCard key={mgr.managerId} manager={mgr} index={idx} />
        ))}
        {aligned.length > 0 && withIssues.length > 0 && (
          <div className="flex items-center gap-3 py-3">
            <div className="h-px flex-1 bg-slate-800" />
            <span className="text-[9px] text-slate-600 uppercase tracking-widest">Alineados</span>
            <div className="h-px flex-1 bg-slate-800" />
          </div>
        )}
        {aligned.map((mgr, idx) => (
          <EvaluadorCard key={mgr.managerId} manager={mgr} index={withIssues.length + idx} />
        ))}
      </div>
    </div>
  )
})

// ════════════════════════════════════════════════════════════════════════════
// EVALUADOR CARD
// ════════════════════════════════════════════════════════════════════════════

const EvaluadorCard = memo(function EvaluadorCard({
  manager: mgr,
  index,
}: {
  manager: ManagerGoalsStats
  index: number
}) {
  const [expanded, setExpanded] = useState(false)
  const badge = mgr.evaluatorStatus ? STATUS_BADGE[mgr.evaluatorStatus] : null
  const hasBias = mgr.evaluatorStatus === 'INDULGENTE' || mgr.evaluatorStatus === 'SEVERA'

  // Normalize score360 to 0-100 for MetricBar (1-5 scale → 0-100)
  const normalized360 = ((mgr.avgScore360Given - 1) / 4) * 100

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.2 }}
      className={cn(
        'rounded-xl border transition-all',
        hasBias
          ? 'border-amber-500/15 bg-amber-500/[0.02]'
          : 'border-slate-800/40 bg-slate-800/20'
      )}
    >
      {/* Main row */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-4 text-left"
      >
        {/* Name + gerencia */}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-slate-200 truncate">{mgr.managerName}</p>
          <p className="text-[10px] text-slate-600 truncate">{mgr.gerenciaName}</p>
        </div>

        {/* Metrics */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="text-[10px] text-slate-500">
            {mgr.evaluatedCount} persona{mgr.evaluatedCount !== 1 ? 's' : ''}
          </span>

          {badge && (
            <span className={cn(
              'text-[9px] px-2 py-0.5 rounded-full border font-semibold uppercase',
              badge.color
            )}>
              {badge.text}
            </span>
          )}

          <span className={cn(
            'text-xs font-mono',
            mgr.coherenceGap >= 40 ? 'text-red-400' :
            mgr.coherenceGap >= 20 ? 'text-amber-400' : 'text-slate-500'
          )}>
            {mgr.coherenceGap}%
          </span>

          <ChevronDown className={cn(
            'w-4 h-4 text-slate-600 transition-transform',
            expanded && 'rotate-180'
          )} />
        </div>
      </button>

      {/* Expanded detail */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-4">
              {/* Dual metric bars */}
              <div className="space-y-2.5">
                <MetricBar label="360° promedio dado" value={normalized360} threshold={75} color="cyan" />
                <MetricBar label="Metas promedio evaluados" value={mgr.avgGoalsOfReports} threshold={80} color="purple" />
              </div>

              {/* Narrative */}
              <p className="text-xs font-light text-slate-400 leading-relaxed">
                {getGapNarrative(mgr)}
              </p>

              {/* Employee list */}
              <div className="space-y-1">
                <p className="text-[9px] text-slate-600 uppercase tracking-widest mb-2">Evaluados</p>
                {mgr.employees.map(emp => (
                  <div key={emp.id} className="flex items-center justify-between py-1.5 border-b border-slate-800/20 last:border-0">
                    <span className="text-xs font-light text-slate-300 truncate min-w-0 flex-1">{emp.name}</span>
                    <div className="flex items-center gap-3 flex-shrink-0 ml-2">
                      <span className="text-[10px] font-mono text-cyan-400/70">
                        360°: {emp.score360.toFixed(1)}
                      </span>
                      <span className={cn(
                        'text-[10px] font-mono',
                        emp.goalsPercent !== null && emp.goalsPercent >= 80 ? 'text-purple-400/70' : 'text-slate-500'
                      )}>
                        Metas: {emp.goalsPercent !== null ? `${Math.round(emp.goalsPercent)}%` : '—'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
})
