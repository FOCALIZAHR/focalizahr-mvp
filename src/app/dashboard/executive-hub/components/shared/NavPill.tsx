'use client'

// ════════════════════════════════════════════════════════════════════════════
// NAV PILL — Generic tab navigation with spring animation
// src/app/dashboard/executive-hub/components/shared/NavPill.tsx
// ════════════════════════════════════════════════════════════════════════════
// Extracted from PLTalent/index.tsx for reuse across insights.
// Uses Framer Motion layoutId for smooth pill sliding.
// ════════════════════════════════════════════════════════════════════════════

import { memo } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

export interface NavPillTab {
  key: string
  icon: LucideIcon
  label: string
}

interface NavPillProps {
  tabs: NavPillTab[]
  active: string
  onChange: (key: string) => void
  layoutId?: string
}

export const NavPill = memo(function NavPill({
  tabs,
  active,
  onChange,
  layoutId = 'nav-pill',
}: NavPillProps) {
  return (
    <div className="flex gap-0.5 bg-slate-900/50 backdrop-blur-sm border border-slate-700/30 rounded-full p-[3px]">
      {tabs.map(t => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={cn(
            'relative px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-[0.1em] transition-colors duration-200',
            active === t.key ? 'text-white' : 'text-slate-500 hover:text-slate-400'
          )}
        >
          {active === t.key && (
            <motion.div
              layoutId={layoutId}
              className="absolute inset-0 bg-slate-700/50 rounded-full"
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
          )}
          <span className="relative z-10 flex items-center gap-1.5">
            <t.icon size={10} />
            {t.label}
          </span>
        </button>
      ))}
    </div>
  )
})
