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
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent z-10" />

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
            className="space-y-3 p-2"
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => setView('portada')}
                className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-xs font-medium"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Volver</span>
              </button>

              <div className="flex items-center gap-2">
                <div className={cn(
                  'w-2 h-2 rounded-full',
                  (data.integrityScore?.score ?? data.overallConfidence) >= 75 ? 'bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.6)]' :
                  (data.integrityScore?.score ?? data.overallConfidence) >= 50 ? 'bg-amber-400 shadow-[0_0_6px_rgba(245,158,11,0.6)]' :
                  'bg-red-400 shadow-[0_0_6px_rgba(239,68,68,0.6)]'
                )} />
                <span className="text-xs text-slate-400">
                  {data.integrityScore?.score ?? data.overallConfidence}% Integridad
                </span>
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
