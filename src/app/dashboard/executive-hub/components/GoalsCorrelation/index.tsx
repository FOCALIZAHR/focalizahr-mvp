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

import type { GoalsCorrelationPropsV2, GoalsCorrelationDataV2, SubFinding } from './GoalsCorrelation.types'
import { getPortadaNarrativeV2, computeCoherenceIndex, type CoherenceIndex } from './GoalsCorrelation.utils'
import { cn } from '@/lib/utils'
import { PanelPortada } from '../PanelPortada'
import { NavPill } from '../shared/NavPill'
import type { NavPillTab } from '../shared/NavPill'
import { ActSeparator } from './cascada/shared'
import AnclaInteligente from '@/components/executive/AnclaInteligente'
import type { AnclaComponent } from '@/components/executive/AnclaInteligente'
import GoalsCascada from './GoalsCascada'
import AnomalíasView from './AnomalíasView'
import AnalisisTab from './tabs/AnalisisTab'
import GoalsFindingModal from './GoalsFindingModal'
import GerenciaHeatmap from './cascada/GerenciaHeatmap'
import CompensationBoard from './cascada/CompensationBoard'
import EvaluadorHeatmap from './cascada/EvaluadorHeatmap'

// ════════════════════════════════════════════════════════════════════════════
// TABS CONFIG
// ════════════════════════════════════════════════════════════════════════════

const GOALS_TABS: NavPillTab[] = [
  { key: 'diagnostico', icon: Brain, label: 'Diagnóstico' },
  { key: 'localizacion', icon: MapPin, label: 'Localización' },
  { key: 'compensacion', icon: DollarSign, label: 'Compensación' },
]

type View = 'portada' | 'ancla' | 'diagnostico' | 'localizacion' | 'compensacion'
type SubView = 'cascada' | 'anomalias'

// ════════════════════════════════════════════════════════════════════════════
// ANCLA — helpers de narrativa por componente
// Cada helper traduce un valor 0-100 a UNA frase ejecutiva sin jerga.
// ════════════════════════════════════════════════════════════════════════════

function narrativeAlignment(value: number): string {
  const outOf10 = Math.round(value / 10)
  if (value === 0) return 'La evaluación no coincide con el cumplimiento de metas en ningún caso.'
  if (outOf10 <= 2) return `De cada 10 personas, solo en ${outOf10} la evaluación coincide con el cumplimiento de sus metas.`
  if (outOf10 <= 5) return `De cada 10 personas, en ${outOf10} la evaluación coincide con el cumplimiento de sus metas.`
  if (outOf10 <= 7) return `De cada 10 personas, en ${outOf10} hay coincidencia entre evaluación y metas.`
  return `De cada 10 personas, en ${outOf10} la evaluación refleja el cumplimiento de metas.`
}

function narrativePearson(value: number): string {
  if (value < 10) return 'La evaluación del líder no predice quién cumple metas. Es azar.'
  if (value < 30) return 'La evaluación del líder predice débilmente quién cumple metas.'
  if (value < 60) return 'La evaluación predice parcialmente quién cumple metas.'
  return 'La evaluación del líder predice con fuerza quién cumple metas.'
}

function narrativeStars(value: number): string {
  if (value === 0) return 'Ninguna estrella respalda su clasificación con resultados.'
  if (value < 20) return `Solo ${Math.round(value)}% de los mejores talentos respalda su clasificación con resultados.`
  if (value < 60) return `${Math.round(value)}% de los mejores talentos respalda su clasificación.`
  return `${Math.round(value)}% de los mejores talentos respalda su clasificación con resultados.`
}

function narrativeConfidence(value: number): string {
  if (value === 0) return 'Ninguna gerencia tiene base confiable para compensar.'
  if (value < 30) return 'Pocas gerencias tienen base confiable para compensar.'
  if (value < 70) return 'Algunas gerencias tienen base confiable para compensar.'
  return 'La mayoría de gerencias tiene base confiable para compensar.'
}

function buildAnclaComponents(coherence: CoherenceIndex): AnclaComponent[] {
  const { alignment, pearson, stars, confidence } = coherence.components
  return [
    {
      value: alignment,
      label: 'Evaluación vs metas',
      narrative: narrativeAlignment(alignment),
    },
    {
      value: stars,
      label: 'Estrellas reales',
      narrative: narrativeStars(stars),
    },
    {
      value: confidence,
      label: 'Gerencias confiables',
      narrative: narrativeConfidence(confidence),
    },
    {
      // Ancla Científica — último nodo (sello antes del CTA)
      value: pearson,
      label: 'Poder predictivo',
      narrative: narrativePearson(pearson),
      tooltip:
        'Calculado mediante Coeficiente de Correlación de Pearson (r). ' +
        'Mide si la evaluación del líder predice quién cumple metas en el negocio. ' +
        'Sobre 0.5 hay predicción, debajo de 0.3 es azar.',
    },
  ]
}

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
              onCtaClick={() => setView('ancla')}
              coachingTip={narrative.coachingTip}
            />
          </motion.div>
        )}

        {/* ═══ ACTO ANCLA (Pre-Cascada) ═══ */}
        {view === 'ancla' && coherence && (
          <motion.div
            key="ancla"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="p-4 md:p-6"
          >
            <AnclaInteligente
              score={coherence.score}
              scoreLabel="Confiabilidad"
              components={buildAnclaComponents(coherence)}
              onContinue={() => setView('diagnostico')}
              onBack={() => setView('portada')}
              ctaLabel="Ver diagnóstico completo"
            />
          </motion.div>
        )}

        {/* ═══ CONTENT TABS ═══ */}
        {view !== 'portada' && view !== 'ancla' && (
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

            {/* Tab context — 1-liner narrativo (solo diagnóstico y compensación) */}
            {view === 'diagnostico' && (
              <p className="text-sm font-light text-slate-500 mt-3 mb-6">
                Dossier ejecutivo: qué encontramos y qué significa.
              </p>
            )}
            {view === 'compensacion' && (
              <p className="text-sm font-light text-slate-500 mt-3 mb-6" />
            )}

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

            {/* ─── Tab: Localización (zoom progresivo: personas → áreas → responsables) ─── */}
            {view === 'localizacion' && (
              <LocalizacionTab data={data} />
            )}

            {/* ─── Tab: Compensación (limpio — solo CompensationBoard) ─── */}
            {view === 'compensacion' && (
              <CompensationBoard correlation={data.correlation} byManager={data.byManager} byGerencia={data.byGerencia} />
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

// ════════════════════════════════════════════════════════════════════════════
// LOCALIZACIÓN TAB — zoom progresivo con articulación narrativa
// ════════════════════════════════════════════════════════════════════════════

function LocalizacionTab({ data }: { data: GoalsCorrelationDataV2 }) {
  const { correlation, quadrantCounts, byGerencia, byManager } = data

  return (
    <div>
      {/* ════════ 01 · MAGNITUD DEL RIESGO ════════ */}
      <ForensicChapter
        label="01 · Magnitud del riesgo"
        letter="M"
        isFirst
      >
        <AnalisisTab correlation={correlation} quadrantCounts={quadrantCounts} />
      </ForensicChapter>

      {/* ════════ 02 · FOCO DEL PROBLEMA ════════ */}
      <ForensicChapter
        label="02 · Foco del problema"
        letter="F"
      >
        <GerenciaHeatmap byGerencia={byGerencia} correlation={correlation} />
      </ForensicChapter>

      {/* ════════ 03 · ORIGEN DEL PROBLEMA ════════ */}
      <ForensicChapter
        label="03 · Origen del problema"
        letter="O"
      >
        <EvaluadorHeatmap byManager={byManager} correlation={correlation} />
      </ForensicChapter>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// FORENSIC CHAPTER — ActSeparator (cascada) + marca de agua letra (skill)
// ════════════════════════════════════════════════════════════════════════════

function ForensicChapter({
  label,
  letter,
  isFirst = false,
  children,
}: {
  label: string
  letter: string
  isFirst?: boolean
  children: React.ReactNode
}) {
  return (
    <section
      className={cn(
        'relative overflow-hidden',
        isFirst ? 'pb-20 md:pb-24' : 'py-20 md:py-24'
      )}
    >
      {/* Separador estilo Tab Diagnóstico (cascada) */}
      <div className="mb-10">
        <ActSeparator label={label} color="cyan" />
      </div>

      {/* Marca de agua — letra única, serif, estilo skill */}
      <span
        aria-hidden="true"
        className="absolute bottom-6 right-6 text-[140px] md:text-[200px] font-serif font-black text-white opacity-[0.04] pointer-events-none leading-none select-none z-0"
      >
        {letter}
      </span>

      {/* Contenido del capítulo */}
      <div className="relative z-10">{children}</div>
    </section>
  )
}

