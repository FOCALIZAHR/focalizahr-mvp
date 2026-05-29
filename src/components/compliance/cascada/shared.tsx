// ════════════════════════════════════════════════════════════════════════════
// CASCADA SHARED — Primitivas reutilizables por todos los actos
// src/components/compliance/cascada/shared.tsx
// Clon verbatim de GoalsCorrelation/cascada/shared.tsx (patrón canónico).
// ════════════════════════════════════════════════════════════════════════════

import { memo, useState, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, HelpCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { legalBadgeForCountry } from '@/lib/services/compliance/CoverageNarrativeDictionary'

// ════════════════════════════════════════════════════════════════════════════
// ANIMATION — whileInView (scroll-triggered, once)
// ════════════════════════════════════════════════════════════════════════════

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

// ════════════════════════════════════════════════════════════════════════════
// ACT SEPARATOR — Línea divisoria entre actos
// ════════════════════════════════════════════════════════════════════════════

const ACT_COLORS = {
  amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  cyan: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  red: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
}

export function ActSeparator({ label, color }: { label: string; color: 'amber' | 'purple' | 'cyan' | 'red' }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3 }}
      className="flex items-center justify-center gap-4"
    >
      <div className="flex-1 h-px bg-slate-800" />
      <span className={cn('px-4 py-1.5 text-[10px] font-semibold uppercase tracking-widest border rounded-full', ACT_COLORS[color])}>
        {label}
      </span>
      <div className="flex-1 h-px bg-slate-800" />
    </motion.div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// SUBTLE LINK — Reutilizable con flecha animada
// ════════════════════════════════════════════════════════════════════════════

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

// ════════════════════════════════════════════════════════════════════════════
// TOOLTIP UNIVERSAL — onClick toggle (mobile tap) + hover (desktop)
// ════════════════════════════════════════════════════════════════════════════

export function Tooltip({
  content,
  children,
}: {
  content: string
  children: ReactNode
}) {
  const [open, setOpen] = useState(false)
  return (
    <span className="relative inline-flex items-baseline align-middle">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        className="inline-flex items-baseline cursor-help"
        aria-label="Más información"
      >
        {children}
      </button>
      {open && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 shadow-xl z-50 pointer-events-none">
          <span className="block text-xs font-light text-slate-300 leading-relaxed normal-case tracking-normal">
            {content}
          </span>
        </span>
      )}
    </span>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// LEGAL BADGE PILL — Flag amber para deptos con exposición jurídica
// (Ley Karin en CL, equivalente normativo por país).
// Texto + tooltip dinámicos vía legalBadgeForCountry.
// ════════════════════════════════════════════════════════════════════════════

export function LegalBadgePill({ country }: { country: string | null | undefined }) {
  const config = legalBadgeForCountry(country)
  return (
    <Tooltip content={config.tooltip}>
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-amber-500/40 bg-amber-500/10 text-[9px] uppercase tracking-wider text-amber-300">
        {config.label}
        <HelpCircle className="w-2.5 h-2.5" strokeWidth={1.5} />
      </span>
    </Tooltip>
  )
}
