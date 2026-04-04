'use client'

// ════════════════════════════════════════════════════════════════════════════
// COMPENSATION GERENCIA MODAL — Detalle de confianza por gerencia
// src/app/dashboard/executive-hub/components/GoalsCorrelation/cascada/CompensationGerenciaModal.tsx
// ════════════════════════════════════════════════════════════════════════════
// Portal modal con selector de gerencia (pills).
// Muestra: cobertura + desconexión + Pearson + narrativa + evaluadores.
// Auto-selecciona la primera gerencia roja.
// ════════════════════════════════════════════════════════════════════════════

import { memo, useState, useMemo, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDisplayName } from '@/lib/utils/formatName'

import type { GerenciaGoalsStatsV2 } from '@/lib/services/GoalsDiagnosticService'
import type { ManagerGoalsStats } from '../GoalsCorrelation.types'
import { buildGerenciaNarrative } from '@/config/narratives/GoalsNarrativeDictionary'

// ════════════════════════════════════════════════════════════════════════════

interface CompensationGerenciaModalProps {
  isOpen: boolean
  onClose: () => void
  byGerencia: GerenciaGoalsStatsV2[]
  byManager: ManagerGoalsStats[]
}

// ════════════════════════════════════════════════════════════════════════════

export default memo(function CompensationGerenciaModal({
  isOpen,
  onClose,
  byGerencia,
  byManager,
}: CompensationGerenciaModalProps) {
  // Auto-select first red gerencia, or first overall
  const defaultIdx = useMemo(() => {
    const redIdx = byGerencia.findIndex(g => g.confidenceLevel === 'red')
    return redIdx >= 0 ? redIdx : 0
  }, [byGerencia])

  const [selectedIdx, setSelectedIdx] = useState(defaultIdx)

  // Reset selection when modal opens
  useEffect(() => {
    if (isOpen) setSelectedIdx(defaultIdx)
  }, [isOpen, defaultIdx])

  const selected = byGerencia[selectedIdx]
  if (!selected) return null

  // Evaluadores de esta gerencia
  const evaluadores = useMemo(() =>
    byManager.filter(m => m.gerenciaName === selected.gerenciaName)
  , [byManager, selected.gerenciaName])

  // Narrativa
  const narrative = useMemo(() =>
    buildGerenciaNarrative({
      gerenciaName: selected.gerenciaName,
      disconnectionRate: selected.disconnectionRate,
      coverage: selected.coverage,
      avgProgress: selected.avgProgress,
      avgScore360: selected.avgScore360,
      evaluatorClassification: selected.evaluatorClassification,
      confidenceLevel: selected.confidenceLevel,
      employeeCount: selected.employeeCount,
      pearsonR: selected.pearsonRoleFitGoals,
      calibrationUpWithLowGoals: selected.calibrationCross?.adjustedUpCount,
      calibrationDownWithHighGoals: selected.calibrationCross?.adjustedDownCount,
    })
  , [selected])

  if (!isOpen) return null

  const content = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            className="relative z-10 w-full max-w-md bg-slate-950/95 backdrop-blur-xl border border-slate-700/30 rounded-2xl shadow-2xl shadow-black/40 max-h-[80vh] overflow-y-auto"
          >
            {/* Tesla line */}
            <div
              className="absolute top-0 left-0 right-0 h-[2px] rounded-t-2xl"
              style={{
                background: 'linear-gradient(90deg, transparent, #22D3EE, #A78BFA, transparent)',
                boxShadow: '0 0 15px #22D3EE40',
              }}
            />

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-slate-600 hover:text-slate-400 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="p-6 pt-8">
              {/* Gerencia pills */}
              <div className="flex flex-wrap gap-1.5 mb-6">
                {byGerencia.map((g, i) => (
                  <button
                    key={g.gerenciaName}
                    onClick={() => setSelectedIdx(i)}
                    className={cn(
                      'text-[10px] px-3 py-1.5 rounded-full border transition-all',
                      selectedIdx === i
                        ? 'border-cyan-500/30 text-white bg-cyan-500/10'
                        : 'border-slate-800/50 text-slate-500 hover:border-slate-700 hover:text-slate-400'
                    )}
                  >
                    {g.gerenciaName}
                    {g.confidenceLevel === 'red' && (
                      <span className="ml-1.5 inline-block w-1.5 h-1.5 rounded-full bg-red-400" />
                    )}
                  </button>
                ))}
              </div>

              {/* Selected gerencia name */}
              <h3 className="text-lg font-extralight text-white tracking-tight mb-5">
                {selected.gerenciaName}
              </h3>

              {/* Metrics */}
              <div className="space-y-3 mb-5">
                <MetricRow label="Cobertura" value={`${Math.round(selected.coverage)}%`} warn={selected.coverage < 70} />
                <MetricRow label="Desconexión" value={`${Math.round(selected.disconnectionRate)}%`} warn={selected.disconnectionRate > 25} />
                <MetricRow
                  label="Pearson"
                  value={selected.pearsonRoleFitGoals !== null ? selected.pearsonRoleFitGoals.toFixed(2) : '—'}
                  warn={selected.pearsonRoleFitGoals !== null && selected.pearsonRoleFitGoals < 0.3}
                />
              </div>

              {/* Narrativa */}
              <p className="text-xs font-light text-slate-400 leading-relaxed mb-5">
                {narrative}
              </p>

              {/* Evaluadores */}
              {evaluadores.length > 0 && (
                <div>
                  <p className="text-[9px] uppercase tracking-[1.5px] text-slate-600 font-medium mb-2">
                    Evaluadores
                  </p>
                  <div className="space-y-1.5">
                    {evaluadores.map(ev => (
                      <div key={ev.managerId} className="flex items-center gap-2 py-1.5">
                        <span className="text-xs font-light text-slate-300 flex-1 truncate">
                          {formatDisplayName(ev.managerName)}
                        </span>
                        {ev.evaluatorStatus && (
                          <span className={cn(
                            'text-[8px] px-2 py-0.5 rounded-full border font-light',
                            ev.evaluatorStatus === 'INDULGENTE' ? 'text-amber-400/60 border-amber-500/15' :
                            ev.evaluatorStatus === 'SEVERA' ? 'text-cyan-400/60 border-cyan-500/15' :
                            ev.evaluatorStatus === 'OPTIMA' ? 'text-emerald-400/60 border-emerald-500/15' :
                            'text-slate-400/60 border-slate-700/30'
                          )}>
                            {ev.evaluatorStatus === 'OPTIMA' ? 'Óptima' :
                             ev.evaluatorStatus === 'INDULGENTE' ? 'Indulgente' :
                             ev.evaluatorStatus === 'SEVERA' ? 'Severa' : 'Central'}
                          </span>
                        )}
                        <span className="text-[10px] font-mono text-slate-500">
                          {ev.coherenceGap}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )

  if (typeof document === 'undefined') return null
  return createPortal(content, document.body)
})

// ════════════════════════════════════════════════════════════════════════════
// METRIC ROW
// ════════════════════════════════════════════════════════════════════════════

function MetricRow({ label, value, warn }: { label: string; value: string; warn: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-slate-500">{label}</span>
      <span className={cn('text-sm font-mono', warn ? 'text-amber-400' : 'text-slate-300')}>
        {value}
      </span>
    </div>
  )
}
