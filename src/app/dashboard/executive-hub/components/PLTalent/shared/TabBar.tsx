'use client'

// ════════════════════════════════════════════════════════════════════════════
// TAB BAR - P&L Talent (clonado de CalibrationHealth/shared/TabBar.tsx)
// ════════════════════════════════════════════════════════════════════════════

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { PLTalentTabKey } from '../PLTalent.types'
import { PL_TABS } from '../PLTalent.constants'

interface TabBarProps {
  activeTab: PLTalentTabKey
  onTabChange: (tab: PLTalentTabKey) => void
}

export function TabBar({ activeTab, onTabChange }: TabBarProps) {
  return (
    <div className="relative flex gap-1 bg-slate-800/30 rounded-xl p-1">
      {PL_TABS.map(tab => {
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
                layoutId="pl-talent-tab-indicator"
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
