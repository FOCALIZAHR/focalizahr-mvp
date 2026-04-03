'use client'

// ════════════════════════════════════════════════════════════════════════════
// GOALS CORRELATION V3 — Insight #7 Executive Hub
// src/app/dashboard/executive-hub/components/GoalsCorrelation/index.tsx
// ════════════════════════════════════════════════════════════════════════════
// CEO-first: Portada → NavPill (3 tabs)
//   Diagnóstico: Cascada + Anomalías (sub-nav interna)
//   Localización: GerenciaHeatmap + Scatter
//   Compensación: CompensationBoard + EvaluadorAccountability
// ════════════════════════════════════════════════════════════════════════════

import { memo, useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Crosshair, Brain, MapPin, DollarSign } from 'lucide-react'

import type { GoalsCorrelationPropsV2, SubFinding } from './GoalsCorrelation.types'
import { getPortadaNarrativeV2, computeCoherenceIndex, type CoherenceIndex } from './GoalsCorrelation.utils'
import { cn } from '@/lib/utils'
import { PanelPortada } from '../PanelPortada'
import { NavPill } from '../shared/NavPill'
import type { NavPillTab } from '../shared/NavPill'
import GoalsCascada from './GoalsCascada'
import AnomalíasView from './AnomalíasView'
import AnalisisTab from './tabs/AnalisisTab'
import GoalsFindingModal from './GoalsFindingModal'
import GerenciaHeatmap from './cascada/GerenciaHeatmap'
import CompensationBoard from './cascada/CompensationBoard'
import EvaluadorAccountability from './cascada/EvaluadorAccountability'

// ════════════════════════════════════════════════════════════════════════════
// TABS CONFIG
// ════════════════════════════════════════════════════════════════════════════

const GOALS_TABS: NavPillTab[] = [
  { key: 'diagnostico', icon: Brain, label: 'Diagnóstico' },
  { key: 'localizacion', icon: MapPin, label: 'Localización' },
  { key: 'compensacion', icon: DollarSign, label: 'Compensación' },
]

type View = 'portada' | 'diagnostico' | 'localizacion' | 'compensacion'
type SubView = 'cascada' | 'anomalias'

// ════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════════════════════

export const GoalsCorrelation = memo(function GoalsCorrelation({ data }: GoalsCorrelationPropsV2) {
  const [view, setView] = useState<View>('portada')
  const [subView, setSubView] = useState<SubView>('cascada')
  const [modalFinding, setModalFinding] = useState<SubFinding | null>(null)

  const narrative = useMemo(() => getPortadaNarrativeV2(data), [data])
  const coherence = useMemo(() => data ? computeCoherenceIndex(data) : null, [data])

  const handleNavChange = useCallback((key: string) => {
    setView(key as View)
    setSubView('cascada') // reset sub-view when switching tabs
  }, [])

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
        {/* ═══ PORTADA ═══ */}
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
              onCtaClick={() => setView('diagnostico')}
              coachingTip={narrative.coachingTip}
            />

            {/* Coherence Gauge — identity number of the insight */}
            {coherence && <CoherenceGauge coherence={coherence} />}
          </motion.div>
        )}

        {/* ═══ CONTENT TABS ═══ */}
        {view !== 'portada' && (
          <motion.div
            key={view}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="p-4 md:p-6"
          >
            {/* Header: Back + NavPill */}
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => { setView('portada'); setSubView('cascada') }}
                className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 transition-colors text-xs"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Portada
              </button>
              <NavPill
                tabs={GOALS_TABS}
                active={view}
                onChange={handleNavChange}
                layoutId="goals-nav"
              />
            </div>

            {/* Tab context — 1-liner narrativo */}
            <p className="text-sm font-light text-slate-500 mt-3 mb-6">
              {view === 'diagnostico' && 'Dossier ejecutivo: qué encontramos y qué significa.'}
              {view === 'localizacion' && 'Dónde está el problema — por gerencia y por persona.'}
              {view === 'compensacion' && 'Revisa antes de aprobar bonos.'}
            </p>

            {/* ─── Tab: Diagnóstico ─── */}
            {view === 'diagnostico' && (
              <>
                {subView === 'cascada' && (
                  <GoalsCascada
                    data={data}
                    onOpenScatter={() => setView('localizacion')}
                    onOpenAnomalias={() => setSubView('anomalias')}
                  />
                )}
                {subView === 'anomalias' && (
                  <AnomalíasView
                    data={data}
                    onBack={() => setSubView('cascada')}
                    onOpenFinding={(f) => setModalFinding(f)}
                  />
                )}
              </>
            )}

            {/* ─── Tab: Localización ─── */}
            {view === 'localizacion' && (
              <div className="space-y-12">
                <GerenciaHeatmap byGerencia={data.byGerencia} />

                <div className="w-8 h-px bg-slate-800" />

                <AnalisisTab
                  correlation={data.correlation}
                  quadrantCounts={data.quadrantCounts}
                />
              </div>
            )}

            {/* ─── Tab: Compensación ─── */}
            {view === 'compensacion' && (
              <div className="space-y-12">
                <CompensationBoard correlation={data.correlation} />

                <div className="w-8 h-px bg-slate-800" />

                <EvaluadorAccountability byManager={data.byManager} />
              </div>
            )}
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

// ════════════════════════════════════════════════════════════════════════════
// COHERENCE GAUGE — SVG circular gauge (premium-components.md pattern)
// ════════════════════════════════════════════════════════════════════════════

const GAUGE_COLORS = {
  high: '#10B981',
  medium: '#22D3EE',
  low: '#F59E0B',
  critical: '#EF4444',
}

function CoherenceGauge({ coherence }: { coherence: CoherenceIndex }) {
  const size = 112
  const strokeWidth = 6
  const radius = (size / 2) - strokeWidth - 8
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (coherence.score / 100) * circumference
  const color = GAUGE_COLORS[coherence.level]

  return (
    <div className="group relative flex flex-col items-center -mt-3 mb-1">
      {/* Glow behind gauge */}
      <div
        className="absolute rounded-full blur-[30px] opacity-15"
        style={{
          width: size * 0.5,
          height: size * 0.5,
          backgroundColor: color,
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      />

      {/* SVG Gauge */}
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="w-full h-full -rotate-90" viewBox={`0 0 ${size} ${size}`}>
          {/* Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(51, 65, 85, 0.4)"
            strokeWidth={strokeWidth}
          />
          {/* Progress */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{
              transition: 'stroke-dashoffset 1.2s ease-out',
              filter: `drop-shadow(0 0 6px ${color}60)`,
            }}
          />
        </svg>

        {/* Central value */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-light text-white">{coherence.score}%</span>
          <span className="text-[9px] text-slate-500 uppercase tracking-wider">Coherencia</span>
        </div>
      </div>

      {/* Tooltip — hover over gauge */}
      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-60 px-3 py-2.5 rounded-xl bg-slate-950/95 backdrop-blur-xl border border-slate-700/30 shadow-2xl shadow-black/30 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-50 translate-y-1 group-hover:translate-y-0">
        <p className="text-[10px] text-white font-medium mb-2">Desglose del Índice</p>
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
  )
}
