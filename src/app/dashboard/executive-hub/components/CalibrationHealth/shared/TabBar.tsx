'use client'

// ════════════════════════════════════════════════════════════════════════════
// TAB BAR - Barra de tabs animada con spring indicator
// ════════════════════════════════════════════════════════════════════════════

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { TabKey } from '../CalibrationHealth.types'
import { TABS } from '../CalibrationHealth.constants'

interface TabBarProps {
  activeTab: TabKey
  onTabChange: (tab: TabKey) => void
}

export function TabBar({ activeTab, onTabChange }: TabBarProps) {
  return (
    <div className="relative flex gap-1 bg-slate-800/30 rounded-xl p-1">
      {TABS.map(tab => {
        const isActive = activeTab === tab.key
        return (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className={cn(
              'relative flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors',
              isActive ? 'text-white' : 'text-slate-500 hover:text-slate-300'
            )}
          >
            {isActive && (
              <motion.div
                layoutId="calibration-tab-indicator"
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
  )
}
