'use client'

// ════════════════════════════════════════════════════════════════════════════
// GOALS CORRELATION — Insight #7 Executive Hub
// src/app/dashboard/executive-hub/components/GoalsCorrelation/index.tsx
// ════════════════════════════════════════════════════════════════════════════
// Checkpoint pre-compensación: Metas × Performance
// ARQUITECTURA: Portada (PanelPortada) → Content (3 tabs)
// FILOSOFÍA: "El CEO nunca aterriza en datos crudos"
// ════════════════════════════════════════════════════════════════════════════

import { memo, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Crosshair } from 'lucide-react'
import { cn } from '@/lib/utils'

import type { GoalsCorrelationProps, TabKey } from './GoalsCorrelation.types'
import { getPortadaNarrative } from './GoalsCorrelation.utils'
import { TABS } from './GoalsCorrelation.constants'
import { PanelPortada } from '../PanelPortada'
import NarrativasTab from './tabs/NarrativasTab'
import AnalisisTab from './tabs/AnalisisTab'
import GerenciasTab from './tabs/GerenciasTab'

// ════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════════════════════

export const GoalsCorrelation = memo(function GoalsCorrelation({ data }: GoalsCorrelationProps) {
  const [view, setView] = useState<'portada' | 'content'>('portada')
  const [activeTab, setActiveTab] = useState<TabKey>('narrativas')

  const narrative = useMemo(() => getPortadaNarrative(data), [data])

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
        {view === 'portada' ? (
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
              onCtaClick={() => setView('content')}
              coachingTip={narrative.coachingTip}
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
            {activeTab === 'narrativas' && (
              <NarrativasTab narratives={data.narratives} />
            )}
            {activeTab === 'analisis' && (
              <AnalisisTab
                correlation={data.correlation}
                quadrantCounts={data.quadrantCounts}
              />
            )}
            {activeTab === 'gerencias' && (
              <GerenciasTab byGerencia={data.byGerencia} />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
})

export default GoalsCorrelation

// ════════════════════════════════════════════════════════════════════════════
// TAB BAR — Pills compactos
// ════════════════════════════════════════════════════════════════════════════

function TabBar({ activeTab, onTabChange }: { activeTab: TabKey; onTabChange: (t: TabKey) => void }) {
  return (
    <div className="flex gap-0.5 bg-slate-900/50 backdrop-blur-sm border border-slate-700/30 rounded-full p-[3px] w-fit mx-auto">
      {TABS.map(t => (
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
