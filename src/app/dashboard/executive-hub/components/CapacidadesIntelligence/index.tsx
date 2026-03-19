'use client'

// ════════════════════════════════════════════════════════════════════════════
// CAPACIDADES INTELLIGENCE — Orquestador (patrón CalibrationHealth)
// Portada narrativa → Tabs (Overview | Heatmap | Foco Estratégico)
// ════════════════════════════════════════════════════════════════════════════

import { memo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PanelPortada } from '../PanelPortada'
import { getCapacidadesNarrative } from './Capacidades.utils'
import { TABS } from './Capacidades.constants'
import type { CapacidadesData, CapacidadesTab } from './Capacidades.types'

// Lazy import tabs to keep orchestrator lean
import OverviewTab from './tabs/OverviewTab'
import HeatmapTab from './tabs/HeatmapTab'
import StrategicFocusTab from './tabs/StrategicFocusTab'

interface CapacidadesIntelligenceProps {
  data: CapacidadesData
  cycleId?: string
}

export const CapacidadesIntelligence = memo(function CapacidadesIntelligence({
  data,
  cycleId
}: CapacidadesIntelligenceProps) {
  const [view, setView] = useState<'portada' | 'content'>('portada')
  const [activeTab, setActiveTab] = useState<CapacidadesTab>('overview')

  const { narrative, ctaVariant, coachingTip } = getCapacidadesNarrative(data)
  const hasFocus = (data.strategicFocus?.length ?? 0) > 0

  return (
    <div className="relative h-full">
      {/* Tesla line */}
      <div className="fhr-top-line absolute inset-x-0 top-0 z-10" />

      <AnimatePresence mode="wait">
        {view === 'portada' ? (
          <motion.div
            key="portada"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.25 }}
          >
            <PanelPortada
              narrative={narrative}
              ctaLabel="Ver capacidades"
              ctaVariant={ctaVariant}
              onCtaClick={() => setView('content')}
              coachingTip={coachingTip}
            />
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="p-6 md:p-8 space-y-5"
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
              <a
                href="/dashboard/performance/nine-box"
                className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                Ver Competencias →
              </a>
            </div>

            {/* Tab Bar */}
            <div className="relative flex gap-1 bg-slate-800/30 rounded-xl p-1">
              {TABS.map(tab => {
                if (tab.key === 'focus' && !hasFocus) return null
                const isActive = activeTab === tab.key
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={cn(
                      'relative flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors',
                      isActive ? 'text-white' : 'text-slate-500 hover:text-slate-300'
                    )}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="capacidades-tab-indicator"
                        className="absolute inset-0 bg-slate-700/60 rounded-lg"
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                    )}
                    <span className="relative z-10 flex items-center gap-1.5">
                      <tab.icon size={12} />
                      {tab.label}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
              {activeTab === 'overview' && (
                <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <OverviewTab data={data} />
                </motion.div>
              )}
              {activeTab === 'heatmap' && (
                <motion.div key="heatmap" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <HeatmapTab data={data} cycleId={cycleId} />
                </motion.div>
              )}
              {activeTab === 'focus' && hasFocus && (
                <motion.div key="focus" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <StrategicFocusTab
                    foci={data.strategicFocus!}
                    availableFoci={data.availableFoci!}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
})

export default CapacidadesIntelligence
