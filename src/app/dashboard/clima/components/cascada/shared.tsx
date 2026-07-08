'use client'

// ════════════════════════════════════════════════════════════════════════════
// CASCADA CLIMA — Primitivas compartidas (clon verbatim de
// GoalsCorrelation/cascada/shared.tsx, patrón canónico). Solo cambia el import
// del tipo de color (ActColor de clima-cascada).
// ════════════════════════════════════════════════════════════════════════════

import { memo } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ActColor } from '@/types/clima-cascada'

const viewport = { once: true, margin: '-80px' }

export const fadeIn = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport,
  transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const },
}

export const fadeInDelay = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport,
  transition: { duration: 0.4, delay: 0.15, ease: [0.16, 1, 0.3, 1] as const },
}

const ACT_COLORS: Record<ActColor, string> = {
  amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  cyan: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  red: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
}

export function ActSeparator({ label, color }: { label: string; color: ActColor }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3 }}
      className="flex items-center justify-center gap-4"
    >
      <div className="flex-1 h-px bg-slate-800" />
      <span
        className={cn(
          'px-4 py-1.5 text-[10px] font-semibold uppercase tracking-widest border rounded-full',
          ACT_COLORS[color],
        )}
      >
        {label}
      </span>
      <div className="flex-1 h-px bg-slate-800" />
    </motion.div>
  )
}

/** Color del hero number por gravedad (skill cascada-ejecutiva: purple=crisis). */
export const HERO_COLOR: Record<ActColor, string> = {
  amber: 'text-amber-400',
  purple: 'text-violet-400',
  cyan: 'text-cyan-400',
  red: 'text-amber-400',
}

export const SubtleLink = memo(function SubtleLink({
  children,
  onClick,
}: {
  children: React.ReactNode
  onClick?: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="group inline-flex items-center gap-1.5 text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
    >
      {children}
      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
    </button>
  )
})
