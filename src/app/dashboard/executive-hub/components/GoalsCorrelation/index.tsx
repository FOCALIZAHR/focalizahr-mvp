'use client'

// ════════════════════════════════════════════════════════════════════════════
// GOALS CORRELATION V2 — Insight #7 Executive Hub
// src/app/dashboard/executive-hub/components/GoalsCorrelation/index.tsx
// ════════════════════════════════════════════════════════════════════════════
// CEO-first: Portada → Cascada → Anomalías → Scatter
// 4 vistas, progressive disclosure, modales para drill-down
// ════════════════════════════════════════════════════════════════════════════

import { memo, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Crosshair } from 'lucide-react'

import type { GoalsCorrelationPropsV2, SubFinding } from './GoalsCorrelation.types'
import { getPortadaNarrativeV2, computeCoherenceIndex } from './GoalsCorrelation.utils'
import { cn } from '@/lib/utils'
import { PanelPortada } from '../PanelPortada'
import GoalsCascada from './GoalsCascada'
import AnomalíasView from './AnomalíasView'
import AnalisisTab from './tabs/AnalisisTab'
import GoalsFindingModal from './GoalsFindingModal'
import GerenciaHeatmap from './cascada/GerenciaHeatmap'

// ════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════════════════════

export const GoalsCorrelation = memo(function GoalsCorrelation({ data }: GoalsCorrelationPropsV2) {
  const [view, setView] = useState<'portada' | 'cascada' | 'anomalias' | 'scatter' | 'heatmap'>('portada')
  const [modalFinding, setModalFinding] = useState<SubFinding | null>(null)

  const narrative = useMemo(() => getPortadaNarrativeV2(data), [data])
  const coherence = useMemo(() => data ? computeCoherenceIndex(data) : null, [data])

  // Empty state
  if (!data || data.correlation.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-500">
        <Crosshair className="w-8 h-8 mb-3 opacity-40" />
        <p className="text-sm font-light">Sin datos de metas para este ciclo.</p>
        <p className="text-xs text-slate-600 mt-1">Asigna metas antes de evaluar correlación con desempeño.</p>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Tesla line */}
      <div className="fhr-top-line absolute inset-x-0 top-0 z-10" />

      <AnimatePresence mode="wait">
        {view === 'portada' && (
          <motion.div
            key="portada"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <PanelPortada
              statusBadge={narrative.statusBadge}
              narrative={{
                prefix: narrative.prefix,
                highlight: narrative.highlight,
                suffix: narrative.suffix,
              }}
              ctaLabel={narrative.ctaLabel}
              ctaVariant={narrative.ctaVariant}
              onCtaClick={() => setView('cascada')}
              coachingTip={narrative.coachingTip}
            />

            {/* Coherence Index — dot + score + tooltip */}
            {coherence && (
              <div className="group relative flex items-center justify-center gap-2 -mt-2">
                <div className={cn(
                  'w-2 h-2 rounded-full',
                  coherence.level === 'high' && 'bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.6)]',
                  coherence.level === 'medium' && 'bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.6)]',
                  coherence.level === 'low' && 'bg-amber-400 shadow-[0_0_6px_rgba(245,158,11,0.6)]',
                  coherence.level === 'critical' && 'bg-red-400 shadow-[0_0_6px_rgba(239,68,68,0.6)]',
                )} />
                <span className="text-xs text-slate-400">
                  {coherence.score}% Coherencia
                </span>

                {/* Tooltip with component breakdown */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-60 px-3 py-2.5 rounded-lg bg-slate-950 border border-slate-800 shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-50 translate-y-1 group-hover:translate-y-0">
                  <p className="text-[10px] text-white font-medium mb-2">Índice de Coherencia</p>
                  <div className="space-y-1.5 text-[10px] text-slate-400">
                    <div className="flex justify-between">
                      <span>Alineamiento metas × evaluación</span>
                      <span className="font-mono text-slate-300">{coherence.components.alignment}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Correlación Pearson (promedio)</span>
                      <span className="font-mono text-slate-300">{coherence.components.pearson}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Estrellas que cumplen metas</span>
                      <span className="font-mono text-slate-300">{coherence.components.stars}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Gerencias con confianza verde</span>
                      <span className="font-mono text-slate-300">{coherence.components.confidence}%</span>
                    </div>
                  </div>
                  <p className="text-[9px] text-slate-600 mt-2 leading-relaxed">
                    Sobre 75% es confiable para decisiones de compensación.
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {view === 'cascada' && (
          <motion.div
            key="cascada"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="p-4 md:p-6"
          >
            <button
              onClick={() => setView('portada')}
              className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 transition-colors text-xs mb-6"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Portada
            </button>

            <GoalsCascada
              data={data}
              onOpenScatter={() => setView('scatter')}
              onOpenAnomalias={() => setView('anomalias')}
            />
          </motion.div>
        )}

        {view === 'anomalias' && (
          <motion.div
            key="anomalias"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="p-4 md:p-6"
          >
            <AnomalíasView
              data={data}
              onBack={() => setView('cascada')}
              onOpenFinding={(f) => setModalFinding(f)}
            />
          </motion.div>
        )}

        {view === 'scatter' && (
          <motion.div
            key="scatter"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="p-4 md:p-6"
          >
            <button
              onClick={() => setView('cascada')}
              className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 transition-colors text-xs mb-6"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Diagnóstico
            </button>

            <AnalisisTab
              correlation={data.correlation}
              quadrantCounts={data.quadrantCounts}
            />
          </motion.div>
        )}
        {view === 'heatmap' && (
          <motion.div
            key="heatmap"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="p-4 md:p-6"
          >
            <button
              onClick={() => setView('cascada')}
              className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 transition-colors text-xs mb-6"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Diagnóstico
            </button>

            <GerenciaHeatmap byGerencia={data.byGerencia} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal — drill-down a personas (shared across views) */}
      {modalFinding && (
        <GoalsFindingModal
          finding={modalFinding}
          onClose={() => setModalFinding(null)}
        />
      )}
    </div>
  )
})

export default GoalsCorrelation
