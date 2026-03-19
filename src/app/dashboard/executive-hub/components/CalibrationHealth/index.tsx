'use client'

// ════════════════════════════════════════════════════════════════════════════
// CALIBRATION HEALTH - Orquestador Principal
// src/app/dashboard/executive-hub/components/CalibrationHealth/index.tsx
// ════════════════════════════════════════════════════════════════════════════
// ARQUITECTURA: Portada (PanelPortada) → Content (TabBar + Tabs)
// FILOSOFÍA: "El CEO nunca aterriza en datos crudos"
// ════════════════════════════════════════════════════════════════════════════

import { memo, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

// Types
import type { CalibrationHealthProps, TabKey } from './CalibrationHealth.types'

// Utils
import { getPortadaNarrative } from './CalibrationHealth.utils'

// Components
import { PanelPortada } from '../PanelPortada'
import { TabBar } from './shared/TabBar'
import { DistributionTab } from './tabs/DistributionTab'
import { GerenciaHealthTab } from './tabs/GerenciaHealthTab'

// ════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════════════════════

export const CalibrationHealth = memo(function CalibrationHealth({
  data,
  showManagerNames = false,
}: CalibrationHealthProps) {
  const [view, setView] = useState<'portada' | 'content'>('portada')
  const [activeTab, setActiveTab] = useState<TabKey>('distribution')

  const narrative = useMemo(() => getPortadaNarrative(data), [data])

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
                suffix: narrative.suffix
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
            className="space-y-4 p-6 md:p-8"
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
                href="/dashboard/performance/calibration"
                className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                Gestionar Calibración →
              </a>
              <div className="group relative flex items-center gap-2">
                <div className={cn(
                  'w-2 h-2 rounded-full',
                  (data.integrityScore?.score ?? data.overallConfidence) >= 75 ? 'bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.6)]' :
                  (data.integrityScore?.score ?? data.overallConfidence) >= 50 ? 'bg-amber-400 shadow-[0_0_6px_rgba(245,158,11,0.6)]' :
                  'bg-red-400 shadow-[0_0_6px_rgba(239,68,68,0.6)]'
                )} />
                <span className="text-xs text-slate-400">
                  {data.integrityScore?.score ?? data.overallConfidence}% Integridad
                </span>

                {/* Tooltip */}
                <div className="absolute bottom-full right-0 mb-2 w-56 px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-50 translate-y-1 group-hover:translate-y-0">
                  <p className="text-[10px] text-white font-medium mb-1">Integridad de Calibración</p>
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    Mide qué tan confiables son las evaluaciones. Combina completitud, ausencia de sesgos y consistencia entre evaluadores. Sobre 75% es confiable para decisiones de compensación.
                  </p>
                </div>
              </div>
            </div>

            {/* Tab Bar */}
            <TabBar activeTab={activeTab} onTabChange={setActiveTab} />

            {/* Tab Content */}
            <AnimatePresence mode="wait">
              {activeTab === 'distribution' && (
                <DistributionTab key="dist" data={data} />
              )}
              {activeTab === 'gerencia' && (
                <GerenciaHealthTab key="ger" data={data} />
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
})

export default CalibrationHealth
