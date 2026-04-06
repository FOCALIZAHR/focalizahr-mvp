'use client'

// ════════════════════════════════════════════════════════════════════════════
// PANEL PORTADA - Componente Reutilizable para Executive Hub
// src/app/dashboard/executive-hub/components/PanelPortada.tsx
// ════════════════════════════════════════════════════════════════════════════
// FILOSOFÍA: "El CEO nunca aterriza en datos crudos"
// INSPIRACIÓN: StorytellingGuide.tsx + PDICategoryCover.tsx
// PATRÓN: StatusBadge + Narrativa + CTA + Coaching Tip
// ════════════════════════════════════════════════════════════════════════════

import { memo } from 'react'
import { motion } from 'framer-motion'
import { ChevronRight, Lightbulb, CheckCircle, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

export interface PanelPortadaNarrative {
  prefix?: string
  highlight: string
  suffix: string
}

export interface PanelPortadaProps {
  /** Narrativa con highlight */
  narrative: PanelPortadaNarrative
  /** Badge de estado opcional (ej: "100% Confianza") */
  statusBadge?: { label: string; showCheck?: boolean }
  /** Color del highlight — default cyan */
  highlightColor?: 'cyan' | 'purple'
  /** Texto del CTA */
  ctaLabel: string
  /** Ícono del CTA (opcional) */
  ctaIcon?: LucideIcon
  /** Variante de color del CTA */
  ctaVariant?: 'cyan' | 'purple' | 'amber' | 'red'
  /** Handler del CTA */
  onCtaClick: () => void
  /** Coaching tip opcional */
  coachingTip?: string
}

// ════════════════════════════════════════════════════════════════════════════
// COLOR MAPS
// ════════════════════════════════════════════════════════════════════════════

const CTA_VARIANTS = {
  cyan: 'bg-gradient-to-r from-cyan-400 to-cyan-500 text-slate-900 shadow-[0_8px_20px_-6px_rgba(34,211,238,0.4)]',
  purple: 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-[0_8px_20px_-6px_rgba(167,139,250,0.4)]',
  amber: 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-[0_8px_20px_-6px_rgba(245,158,11,0.4)]',
  red: 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-[0_8px_20px_-6px_rgba(239,68,68,0.4)]',
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ════════════════════════════════════════════════════════════════════════════

const HIGHLIGHT_COLORS = {
  cyan: 'text-cyan-400',
  purple: 'text-violet-400',
} as const

export const PanelPortada = memo(function PanelPortada({
  narrative,
  statusBadge,
  highlightColor = 'cyan',
  ctaLabel,
  ctaIcon: CtaIcon = ChevronRight,
  ctaVariant = 'cyan',
  onCtaClick,
  coachingTip,
}: PanelPortadaProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[320px] px-8 py-12">

      {/* ═══ STATUS BADGE (opcional) ═══ */}
      {statusBadge && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="flex items-center gap-2 mb-6"
        >
          {statusBadge.showCheck && (
            <CheckCircle className="w-4 h-4 text-cyan-400/80" />
          )}
          <span className="text-sm text-cyan-400/90 font-medium tracking-wide">
            {statusBadge.label}
          </span>
        </motion.div>
      )}

      {/* ═══ NARRATIVA PROTAGONISTA ═══ */}
      <motion.p
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="text-2xl md:text-3xl font-light text-center leading-relaxed max-w-xl mb-10"
      >
        {narrative.prefix && (
          <span className="text-slate-400">{narrative.prefix}</span>
        )}
        <span className={cn(HIGHLIGHT_COLORS[highlightColor], 'font-medium')}>{narrative.highlight}</span>
        <span className="text-slate-300">{narrative.suffix}</span>
      </motion.p>

      {/* ═══ CTA PROTAGONISTA ═══ */}
      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        onClick={onCtaClick}
        className={cn(
          'flex items-center gap-3 py-3 px-7 rounded-xl font-medium text-base transition-all',
          CTA_VARIANTS[ctaVariant]
        )}
        whileHover={{ scale: 1.02, y: -2 }}
        whileTap={{ scale: 0.98 }}
      >
        <span>{ctaLabel}</span>
        <CtaIcon className="w-4 h-4" />
      </motion.button>

      {/* ═══ COACHING TIP (opcional) ═══ */}
      {coachingTip && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="mt-10 flex items-start gap-2.5 max-w-md"
        >
          <Lightbulb className="w-4 h-4 text-amber-400/60 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-slate-500 leading-relaxed">
            {coachingTip}
          </p>
        </motion.div>
      )}

    </div>
  )
})

export default PanelPortada