'use client'

// ════════════════════════════════════════════════════════════════════════════
// EVALUADOR ACCOUNTABILITY — "La Radiografía del Evaluador"
// src/app/dashboard/executive-hub/components/GoalsCorrelation/cascada/EvaluadorAccountability.tsx
// ════════════════════════════════════════════════════════════════════════════
// Diferenciador competitivo: ningún sistema en LATAM muestra accountability
// individual del evaluador cruzando 360° dado vs metas de evaluados.
// Design: fhr-card + Tesla line dinámica + fhr-badge + gap hero number
// ════════════════════════════════════════════════════════════════════════════

import { memo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

import type { ManagerGoalsStats } from '../GoalsCorrelation.types'
import { MetricBar } from '../shared/MetricBar'

// ════════════════════════════════════════════════════════════════════════════
// STATUS CONFIG — maps to fhr-badge-* and Tesla colors
// ════════════════════════════════════════════════════════════════════════════

const STATUS_CONFIG: Record<string, { text: string; badge: string; tesla: string }> = {
  INDULGENTE: { text: 'Indulgente', badge: 'fhr-badge-error', tesla: '#EF4444' },
  SEVERA: { text: 'Severa', badge: 'fhr-badge-warning', tesla: '#F59E0B' },
  CENTRAL: { text: 'Central', badge: 'fhr-badge-active', tesla: '#22D3EE' },
  OPTIMA: { text: 'Óptima', badge: 'fhr-badge-success', tesla: '#10B981' },
}

function getGapNarrative(mgr: ManagerGoalsStats): string {
  const firstName = mgr.managerName.split(' ')[0]
  if (mgr.coherenceGap >= 40) {
    return `Las evaluaciones de ${firstName} no predicen resultados. Gap de ${mgr.coherenceGap}% entre lo que evalúa y lo que su equipo entrega.`
  }
  if (mgr.coherenceGap >= 20) {
    return `Desconexión moderada entre evaluación y resultados de ${firstName}. Revisar criterios antes de compensar.`
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
      <div className="fhr-card p-8 text-center">
        <CheckCircle className="w-6 h-6 mx-auto mb-2 text-emerald-400/40" />
        <p className="text-sm font-light text-slate-400">Todos los evaluadores muestran coherencia.</p>
      </div>
    )
  }

  const withIssues = byManager.filter(m => m.coherenceGap >= 20)
  const aligned = byManager.filter(m => m.coherenceGap < 20)
  const totalAffected = withIssues.reduce((sum, m) => sum + m.evaluatedCount, 0)

  return (
    <div className="space-y-5">
      {/* Header — narrativa ejecutiva */}
      <div>
        <h3 className="text-xl font-extralight text-white tracking-tight">
          Radiografía{' '}
          <span className="fhr-title-gradient">del evaluador</span>
        </h3>
        <p className="text-sm font-light text-slate-500 mt-1.5">
          {withIssues.length > 0 ? (
            <>
              <span className="text-amber-400 font-medium">{withIssues.length}</span> de {byManager.length} evaluador{byManager.length !== 1 ? 'es' : ''} muestra{withIssues.length === 1 ? '' : 'n'} desconexión entre lo que evalúa{withIssues.length === 1 ? '' : 'n'} y lo que su{withIssues.length === 1 ? '' : 's'} equipo{withIssues.length === 1 ? '' : 's'} entrega{withIssues.length === 1 ? '' : 'n'}.
            </>
          ) : (
            <>{byManager.length} evaluador{byManager.length !== 1 ? 'es' : ''} analizados. Evaluaciones alineadas con resultados.</>
          )}
        </p>
      </div>

      {/* Hero anchor stat — magnitude at a glance */}
      {withIssues.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="text-center py-4"
        >
          <p className="text-5xl font-extralight text-amber-400 tracking-tight">
            {totalAffected}
          </p>
          <p className="text-xs text-slate-500 mt-1.5 uppercase tracking-wider">
            personas evaluadas por managers con desconexión
          </p>
        </motion.div>
      )}

      {/* Cards — issues first, then aligned */}
      <div className="space-y-2">
        {withIssues.map((mgr, idx) => (
          <EvaluadorCard key={mgr.managerId} manager={mgr} index={idx} />
        ))}

        {aligned.length > 0 && withIssues.length > 0 && (
          <div className="fhr-divider my-4" />
        )}

        {aligned.map((mgr, idx) => (
          <EvaluadorCard key={mgr.managerId} manager={mgr} index={withIssues.length + idx} />
        ))}
      </div>
    </div>
  )
})

// ════════════════════════════════════════════════════════════════════════════
// EVALUADOR CARD — fhr-card + Tesla line + expand
// ════════════════════════════════════════════════════════════════════════════

const EvaluadorCard = memo(function EvaluadorCard({
  manager: mgr,
  index,
}: {
  manager: ManagerGoalsStats
  index: number
}) {
  const [expanded, setExpanded] = useState(false)
  const config = mgr.evaluatorStatus ? STATUS_CONFIG[mgr.evaluatorStatus] : null
  const teslaColor = config?.tesla ?? '#22D3EE'

  // Normalize score360 to 0-100 for MetricBar (1-5 scale → 0-100)
  const normalized360 = ((mgr.avgScore360Given - 1) / 4) * 100

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.25 }}
      className="fhr-card relative overflow-hidden p-0"
    >
      {/* Tesla line — dynamic color by evaluator status */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{
          background: `linear-gradient(90deg, transparent, ${teslaColor}, transparent)`,
          boxShadow: `0 0 12px ${teslaColor}40`,
        }}
      />

      {/* Main row — clickable */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-white/[0.02]"
      >
        {/* Name + gerencia */}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-slate-200 truncate">{mgr.managerName}</p>
          <p className="text-[10px] text-slate-600 truncate">{mgr.gerenciaName} · {mgr.evaluatedCount} persona{mgr.evaluatedCount !== 1 ? 's' : ''}</p>
        </div>

        {/* Badge + gap hero number */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {config && (
            <span className={cn('fhr-badge text-[8px]', config.badge)}>
              {config.text}
            </span>
          )}

          {/* Gap as hero metric — the protagonist number */}
          <span className={cn(
            'text-lg font-extralight font-mono',
            mgr.coherenceGap >= 40 ? 'text-red-400' :
            mgr.coherenceGap >= 20 ? 'text-amber-400' : 'text-slate-600'
          )}>
            {mgr.coherenceGap}%
          </span>

          <ChevronDown className={cn(
            'w-4 h-4 text-slate-600 transition-transform duration-200',
            expanded && 'rotate-180'
          )} />
        </div>
      </button>

      {/* Expanded detail — progressive disclosure */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-4 border-t border-slate-800/30">
              {/* Dual metric bars — the visual proof */}
              <div className="space-y-2.5 pt-4">
                <MetricBar label="360° promedio dado" value={normalized360} threshold={75} color="cyan" />
                <MetricBar label="Metas promedio evaluados" value={mgr.avgGoalsOfReports} threshold={80} color="purple" />
              </div>

              {/* Narrative — coaching tip style */}
              <div className="border-l-2 border-cyan-500/30 pl-3">
                <p className="text-xs font-light text-slate-400 leading-relaxed">
                  {getGapNarrative(mgr)}
                </p>
              </div>

              {/* Employee list — minimal, data-dense */}
              <div>
                <p className="text-[9px] text-slate-600 uppercase tracking-widest mb-2">Evaluados</p>
                <div className="space-y-0.5">
                  {mgr.employees.map(emp => (
                    <div key={emp.id} className="flex items-center justify-between py-1.5 border-b border-slate-800/15 last:border-0">
                      <span className="text-xs font-light text-slate-300 truncate min-w-0 flex-1">{emp.name}</span>
                      <div className="flex items-center gap-3 flex-shrink-0 ml-2">
                        <span className="text-[10px] font-mono text-cyan-400/70">
                          {emp.score360.toFixed(1)}
                        </span>
                        <span className={cn(
                          'text-[10px] font-mono',
                          emp.goalsPercent !== null && emp.goalsPercent >= 80 ? 'text-purple-400/70' : 'text-slate-500'
                        )}>
                          {emp.goalsPercent !== null ? `${Math.round(emp.goalsPercent)}%` : '—'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
})
