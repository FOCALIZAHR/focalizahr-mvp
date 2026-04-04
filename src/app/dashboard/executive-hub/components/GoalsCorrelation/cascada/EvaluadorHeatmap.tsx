'use client'

// ════════════════════════════════════════════════════════════════════════════
// EVALUADOR HEATMAP — Mapa de calor de evaluadores + Patrón G drill-down
// src/app/dashboard/executive-hub/components/GoalsCorrelation/cascada/EvaluadorHeatmap.tsx
// ════════════════════════════════════════════════════════════════════════════
// Capa 1: Grilla 4 columnas (SEVERA | CENTRAL | ÓPTIMA | INDULGENTE)
// Capa 2: Panel Patrón G simplificado (2 actos) al clic
// Capa 3: Lista evaluados colapsada
// ════════════════════════════════════════════════════════════════════════════

import { memo, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDisplayName } from '@/lib/utils/formatName'

import type { ManagerGoalsStats, CorrelationPoint } from '../GoalsCorrelation.types'
import { getEvaluadorNarrative } from '@/config/narratives/EvaluadorNarrativeDictionary'
import type { EvaluatorStyle } from '@/config/narratives/EvaluadorNarrativeDictionary'
import EvaluadorPatronG from './EvaluadorPatronG'

// ════════════════════════════════════════════════════════════════════════════
// COLUMN CONFIG
// ════════════════════════════════════════════════════════════════════════════

const COLUMNS: { key: EvaluatorStyle; label: string }[] = [
  { key: 'SEVERA', label: 'Severa' },
  { key: 'CENTRAL', label: 'Central' },
  { key: 'OPTIMA', label: 'Óptima' },
  { key: 'INDULGENTE', label: 'Indulgente' },
]

// ════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ════════════════════════════════════════════════════════════════════════════

interface EvaluadorHeatmapProps {
  byManager: ManagerGoalsStats[]
  correlation: CorrelationPoint[]
}

export default memo(function EvaluadorHeatmap({ byManager, correlation }: EvaluadorHeatmapProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)

  // Group managers by evaluatorStatus
  const grouped = useMemo(() => {
    const map: Record<EvaluatorStyle, ManagerGoalsStats[]> = {
      SEVERA: [], CENTRAL: [], OPTIMA: [], INDULGENTE: [],
    }
    for (const m of byManager) {
      if (m.evaluatorStatus && map[m.evaluatorStatus as EvaluatorStyle]) {
        map[m.evaluatorStatus as EvaluatorStyle].push(m)
      }
    }
    // Sort each column by gap desc
    for (const key of Object.keys(map) as EvaluatorStyle[]) {
      map[key].sort((a, b) => b.coherenceGap - a.coherenceGap)
    }
    return map
  }, [byManager])

  // Compensation impact: pre-compute quadrant map for all employees
  const employeeQuadrantMap = useMemo(() =>
    new Map(correlation.map(c => [c.employeeId, c.quadrant]))
  , [correlation])

  const withIssues = byManager.filter(m => m.coherenceGap >= 20).length
  const total = byManager.filter(m => m.evaluatorStatus).length

  // Selected manager data
  const selectedManager = selectedId ? byManager.find(m => m.managerId === selectedId) : null
  const selectedNarrative = selectedManager ? getEvaluadorNarrative(selectedManager.evaluatorStatus) : null

  // Compensation impact for selected manager
  const compensationImpact = useMemo(() => {
    if (!selectedManager) return { totalInCheckpoint: 0, perceptionBiasCount: 0 }
    const empIds = new Set(selectedManager.employees.map(e => e.id))
    let totalInCheckpoint = 0
    let perceptionBiasCount = 0
    for (const [empId, quadrant] of employeeQuadrantMap) {
      if (!empIds.has(empId)) continue
      if (quadrant !== 'CONSISTENT' && quadrant !== 'NO_GOALS') totalInCheckpoint++
      if (quadrant === 'PERCEPTION_BIAS') perceptionBiasCount++
    }
    return { totalInCheckpoint, perceptionBiasCount }
  }, [selectedManager, employeeQuadrantMap])

  if (total === 0) {
    return (
      <div className="relative rounded-2xl border border-slate-800/40 bg-slate-900/60 backdrop-blur-sm overflow-hidden p-8 text-center">
        <CheckCircle className="w-6 h-6 mx-auto mb-2 text-emerald-400/40" />
        <p className="text-sm font-light text-slate-400">Todos los evaluadores muestran coherencia.</p>
      </div>
    )
  }

  return (
    <div className="relative rounded-2xl border border-slate-800/40 bg-slate-900/60 backdrop-blur-sm overflow-hidden">
      {/* Tesla line */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{
          background: 'linear-gradient(90deg, transparent 5%, #22D3EE 35%, #A78BFA 65%, transparent 95%)',
          opacity: 0.7,
        }}
      />

      <div className="p-7">
        {/* Header */}
        <h3 className="text-xl font-extralight text-white tracking-tight mb-1">
          Radiografía{' '}
          <span className="fhr-title-gradient">del evaluador</span>
        </h3>
        <p className="text-sm font-light text-slate-500 mb-6">
          {withIssues > 0 ? (
            <>
              <span className="text-amber-400 font-medium">{withIssues}</span> de {total} evaluador{total !== 1 ? 'es' : ''} con desconexión entre evaluación y resultados.
            </>
          ) : (
            <>{total} evaluador{total !== 1 ? 'es' : ''} analizados. Evaluaciones alineadas con resultados.</>
          )}
        </p>

        {/* Heatmap grid — 4 columns */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {COLUMNS.map(col => {
            const managers = grouped[col.key]
            return (
              <div key={col.key}>
                {/* Column label */}
                <p className="text-[9px] uppercase tracking-widest text-slate-600 mb-2 text-center font-medium">
                  {col.label}
                </p>

                {/* Cells */}
                <div className="space-y-2">
                  {managers.length === 0 && (
                    <div className="rounded-xl border border-slate-800/20 p-4 text-center">
                      <p className="text-[10px] text-slate-700">—</p>
                    </div>
                  )}
                  {managers.map(m => {
                    const isSelected = selectedId === m.managerId
                    const intensity = 0.3 + (m.coherenceGap / 100) * 0.7
                    const needsAttention = m.coherenceGap > 30

                    return (
                      <motion.button
                        key={m.managerId}
                        onClick={() => setSelectedId(isSelected ? null : m.managerId)}
                        className={cn(
                          'w-full text-left rounded-xl border p-3 transition-all duration-300 relative overflow-hidden cursor-pointer',
                          isSelected
                            ? 'border-cyan-500/20 bg-slate-800/40'
                            : 'border-slate-800/30 hover:border-slate-700/50 hover:bg-slate-800/20'
                        )}
                        style={{ opacity: isSelected ? 1 : intensity }}
                      >
                        {/* Tesla line purple si necesita atención */}
                        {needsAttention && (
                          <div
                            className="absolute top-0 left-0 right-0 h-[1px]"
                            style={{
                              background: 'linear-gradient(90deg, transparent, #A78BFA, transparent)',
                              boxShadow: '0 0 8px #A78BFA40',
                            }}
                          />
                        )}
                        {/* Dot cyan si seleccionado */}
                        {isSelected && (
                          <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-cyan-400" style={{ boxShadow: '0 0 6px #22D3EE40' }} />
                        )}

                        <p className="text-xs font-light text-slate-200 truncate">
                          {formatDisplayName(m.managerName)}
                        </p>
                        <p className="text-lg font-extralight text-slate-400 font-mono mt-0.5">
                          {m.coherenceGap}%
                        </p>
                        <p className="text-[10px] text-slate-600">
                          {m.evaluatedCount} persona{m.evaluatedCount !== 1 ? 's' : ''}
                        </p>
                      </motion.button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        {/* Patrón G panel — appears below grid when selected */}
        <AnimatePresence>
          {selectedManager && selectedNarrative && (
            <motion.div
              key={selectedManager.managerId}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden mt-4"
            >
              <EvaluadorPatronG
                manager={selectedManager}
                narrative={selectedNarrative}
                compensationImpact={compensationImpact}
                onClose={() => setSelectedId(null)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
})
