'use client'

// ════════════════════════════════════════════════════════════════════════════
// P&L TALENT - Executive Hub Panel
// src/app/dashboard/executive-hub/components/PLTalent/index.tsx
// ════════════════════════════════════════════════════════════════════════════
// Patrón clonado de CalibrationHealth/index.tsx
// Portada (PanelPortada) → Content (TabBar + Tabs)
// ════════════════════════════════════════════════════════════════════════════

import { memo, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'

import type { PLTalentProps, PLTalentTabKey } from './PLTalent.types'
import { getPortadaNarrative } from './PLTalent.utils'
import { PanelPortada } from '../PanelPortada'
import { TabBar } from './shared/TabBar'
import BrechaProductivaTab from './tabs/BrechaProductivaTab'
import SemaforoLegalTab from './tabs/SemaforoLegalTab'

// ════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ════════════════════════════════════════════════════════════════════════════

export const PLTalent = memo(function PLTalent({ data }: PLTalentProps) {
  const [view, setView] = useState<'portada' | 'content'>('portada')
  const [activeTab, setActiveTab] = useState<PLTalentTabKey>('brecha')

  const narrative = useMemo(() => getPortadaNarrative(data), [data])

  return (
    <div className="relative">
      {/* Tesla line — cyan, igual que todos los módulos */}
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
            </div>

            {/* TabBar */}
            <TabBar activeTab={activeTab} onTabChange={setActiveTab} />

            {/* Tab Content */}
            <AnimatePresence mode="wait">
              {activeTab === 'brecha' && (
                <motion.div
                  key="brecha"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.15 }}
                >
                  <BrechaProductivaTab data={data.brecha} />
                </motion.div>
              )}
              {activeTab === 'semaforo' && (
                <motion.div
                  key="semaforo"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.15 }}
                >
                  <SemaforoLegalTab data={data.semaforo} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
})

export default PLTalent
