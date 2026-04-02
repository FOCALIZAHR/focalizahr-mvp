'use client'

// ════════════════════════════════════════════════════════════════════════════
// GOALS CORRELATION V2 — Insight #7 Executive Hub
// src/app/dashboard/executive-hub/components/GoalsCorrelation/index.tsx
// ════════════════════════════════════════════════════════════════════════════
// CEO-first: 2 segmentos (Entregaron / No Entregaron) + Vista Organizacional
// PORTADA: Progressive Disclosure — titular $$$ + top 3 alertas tipo Cascada
// ════════════════════════════════════════════════════════════════════════════

import { memo, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Crosshair, ChevronRight, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

import type { GoalsCorrelationPropsV2, TabKeyV2, SubFinding } from './GoalsCorrelation.types'
import { getPortadaNarrativeV2, formatCurrency } from './GoalsCorrelation.utils'
import { TABS_V2, SUBFINDING_CARDS, SUBFINDING_TO_NARRATIVE } from './GoalsCorrelation.constants'
import { getNarrative } from '@/config/narratives/GoalsNarrativeDictionary'
import SegmentTab from './tabs/NarrativasTab'
import AnalisisTab from './tabs/AnalisisTab'
import GerenciasTab from './tabs/GerenciasTab'

// ════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════════════════════

export const GoalsCorrelation = memo(function GoalsCorrelation({ data }: GoalsCorrelationPropsV2) {
  const [view, setView] = useState<'portada' | 'content'>('portada')
  const [activeTab, setActiveTab] = useState<TabKeyV2>('entregaron')

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

  // Find segments
  const segEntregaron = data.segments.find(s => s.id === '1_ENTREGARON')
  const segNoEntregaron = data.segments.find(s => s.id === '2_NO_ENTREGARON')
  const segOrganizacional = data.segments.find(s => s.id === '3_ORGANIZACIONAL')

  return (
    <div className="relative">
      {/* Tesla line */}
      <div className="fhr-top-line absolute inset-x-0 top-0 z-10" />

      <AnimatePresence mode="wait">
        {view === 'portada' ? (
          <motion.div
            key="portada"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <GoalsPortada
              data={data}
              narrative={narrative}
              onEnter={() => setView('content')}
            />
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-4 p-4 md:p-6"
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => setView('portada')}
                className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 transition-colors text-xs"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Portada
              </button>

              {/* Cycle config badge */}
              {!data.cycleConfig.includeGoals && (
                <span className="text-[9px] text-amber-400/70 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                  Score Híbrido desactivado
                </span>
              )}
            </div>

            {/* Tab Bar */}
            <TabBar activeTab={activeTab} onTabChange={setActiveTab} />

            {/* Tab Content */}
            {activeTab === 'entregaron' && segEntregaron && (
              <SegmentTab segment={segEntregaron} />
            )}
            {activeTab === 'no_entregaron' && segNoEntregaron && (
              <SegmentTab segment={segNoEntregaron} />
            )}
            {activeTab === 'organizacional' && (
              <GerenciasTab
                byGerencia={data.byGerencia}
                orgFindings={segOrganizacional?.subFindings ?? []}
              />
            )}
            {activeTab === 'analisis' && (
              <AnalisisTab
                correlation={data.correlation}
                quadrantCounts={data.quadrantCounts}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
})

export default GoalsCorrelation

// ════════════════════════════════════════════════════════════════════════════
// PORTADA — Titular $$$ + Top 3 alertas tipo Cascada
// ════════════════════════════════════════════════════════════════════════════

interface PortadaNarrativeShape {
  statusBadge?: { label: string; showCheck?: boolean }
  prefix?: string
  highlight: string
  suffix: string
  ctaLabel: string
  ctaVariant: 'cyan' | 'purple' | 'amber' | 'red'
  coachingTip: string
}

const CTA_VARIANTS: Record<string, string> = {
  cyan: 'bg-gradient-to-r from-cyan-400 to-cyan-500 text-slate-900 shadow-[0_8px_20px_-6px_rgba(34,211,238,0.4)]',
  purple: 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-[0_8px_20px_-6px_rgba(167,139,250,0.4)]',
  amber: 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-[0_8px_20px_-6px_rgba(245,158,11,0.4)]',
  red: 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-[0_8px_20px_-6px_rgba(239,68,68,0.4)]',
}

function GoalsPortada({
  data,
  narrative,
  onEnter,
}: {
  data: GoalsCorrelationPropsV2['data']
  narrative: PortadaNarrativeShape
  onEnter: () => void
}) {
  const { topAlerts, totals } = data

  return (
    <div className="flex flex-col items-center px-6 py-10 md:px-8 md:py-12">

      {/* Status badge */}
      {narrative.statusBadge && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="flex items-center gap-2 mb-5"
        >
          {narrative.statusBadge.showCheck ? (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          ) : (
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400/80" />
          )}
          <span className="text-xs text-cyan-400/90 font-medium tracking-wide">
            {narrative.statusBadge.label}
          </span>
        </motion.div>
      )}

      {/* Titular narrativo */}
      <motion.p
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="text-xl md:text-2xl font-light text-center leading-relaxed max-w-lg mb-8"
      >
        {narrative.prefix && <span className="text-slate-400">{narrative.prefix}</span>}
        <span className="text-cyan-400 font-medium">{narrative.highlight}</span>
        <span className="text-slate-300">{narrative.suffix}</span>
      </motion.p>

      {/* ═══ TOP 3 ALERTAS — Mini Cascada ═══ */}
      {topAlerts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="w-full max-w-md space-y-2.5 mb-8"
        >
          {topAlerts.slice(0, 3).map((alert, i) => (
            <AlertCard key={alert.key} alert={alert} index={i} />
          ))}
        </motion.div>
      )}

      {/* Contadores rápidos */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25 }}
        className="flex items-center gap-6 mb-8 text-center"
      >
        <div>
          <p className="text-lg font-mono text-emerald-400">{totals.totalEntregaron}</p>
          <p className="text-[9px] text-slate-600 uppercase tracking-wider">Entregaron</p>
        </div>
        <div className="w-px h-8 bg-slate-800" />
        <div>
          <p className="text-lg font-mono text-red-400">{totals.totalNoEntregaron}</p>
          <p className="text-[9px] text-slate-600 uppercase tracking-wider">No entregaron</p>
        </div>
        <div className="w-px h-8 bg-slate-800" />
        <div>
          <p className="text-lg font-mono text-amber-400">{totals.totalAnomalias}</p>
          <p className="text-[9px] text-slate-600 uppercase tracking-wider">Anomalías</p>
        </div>
      </motion.div>

      {/* CTA */}
      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        onClick={onEnter}
        className={cn(
          'flex items-center gap-3 py-3 px-7 rounded-xl font-medium text-base transition-all',
          CTA_VARIANTS[narrative.ctaVariant]
        )}
        whileHover={{ scale: 1.02, y: -2 }}
        whileTap={{ scale: 0.98 }}
      >
        <span>{narrative.ctaLabel}</span>
        <ChevronRight className="w-4 h-4" />
      </motion.button>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// ALERT CARD — Mini card por alerta, tipo acto de la Cascada
// ════════════════════════════════════════════════════════════════════════════

function AlertCard({ alert, index }: { alert: SubFinding; index: number }) {
  const cardConfig = SUBFINDING_CARDS[alert.key]
  const narrativeKey = SUBFINDING_TO_NARRATIVE[alert.key]
  const dictNarrative = narrativeKey ? getNarrative(narrativeKey) : null

  if (!cardConfig) return null

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.2 + index * 0.08 }}
      className={cn(
        'relative rounded-xl border overflow-hidden',
        'bg-slate-800/30 backdrop-blur-xl px-4 py-3',
        cardConfig.borderColor
      )}
    >
      {/* Tesla line */}
      {dictNarrative && (
        <div
          className="absolute top-0 left-0 right-0 h-[1.5px]"
          style={{
            background: `linear-gradient(90deg, transparent, ${dictNarrative.teslaColor}, transparent)`,
            boxShadow: `0 0 10px ${dictNarrative.teslaColor}40`,
          }}
        />
      )}

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', cardConfig.dotColor)} />
          <div className="min-w-0">
            <p className="text-xs font-light text-slate-200 truncate">
              {dictNarrative?.headline ?? cardConfig.title}
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5">
              {alert.count} persona{alert.count !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Financial impact or count badge */}
        <div className="flex-shrink-0">
          {alert.financialImpact > 0 ? (
            <span className={cn('text-xs font-mono font-medium', cardConfig.textColor)}>
              {formatCurrency(alert.financialImpact)}
            </span>
          ) : (
            <span className={cn('text-xs font-mono', cardConfig.textColor)}>
              {alert.count}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// TAB BAR — Pills compactos
// ════════════════════════════════════════════════════════════════════════════

function TabBar({ activeTab, onTabChange }: { activeTab: TabKeyV2; onTabChange: (t: TabKeyV2) => void }) {
  return (
    <div className="flex gap-0.5 bg-slate-900/50 backdrop-blur-sm border border-slate-700/30 rounded-full p-[3px] w-fit mx-auto">
      {TABS_V2.map(t => (
        <button
          key={t.key}
          onClick={() => onTabChange(t.key)}
          className={cn(
            'relative px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-[0.1em] transition-colors duration-200',
            activeTab === t.key ? 'text-white' : 'text-slate-500 hover:text-slate-400'
          )}
        >
          {activeTab === t.key && (
            <motion.div
              layoutId="goals-tab"
              className="absolute inset-0 bg-slate-700/50 rounded-full"
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
          )}
          <span className="relative z-10">{t.label}</span>
        </button>
      ))}
    </div>
  )
}
