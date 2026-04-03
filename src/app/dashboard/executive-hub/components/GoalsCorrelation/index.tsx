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
import { getPortadaNarrativeV2 } from './GoalsCorrelation.utils'
import { PanelPortada } from '../PanelPortada'
import GoalsCascada from './GoalsCascada'
import AnomalíasView from './AnomalíasView'
import AnalisisTab from './tabs/AnalisisTab'
import GoalsFindingModal from './GoalsFindingModal'

// ════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════════════════════

export const GoalsCorrelation = memo(function GoalsCorrelation({ data }: GoalsCorrelationPropsV2) {
  const [view, setView] = useState<'portada' | 'cascada' | 'anomalias' | 'scatter'>('portada')
  const [modalFinding, setModalFinding] = useState<SubFinding | null>(null)

  const narrative = useMemo(() => getPortadaNarrativeV2(data), [data])

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
