'use client'

// ════════════════════════════════════════════════════════════════════════════
// STICKY FOOTER — Simulador de Cargos IA · Página 6
// StickyFooter.tsx
// ════════════════════════════════════════════════════════════════════════════
// Layout horizontal · 3 secciones:
//   IZQ:    RECUPERABLE — cyan (suma β=1.0 × headcount)
//   CENTRO: ASISTIDO    — púrpura (suma β=0.5 × headcount)
//   DER:    [ Ver Síntesis ]
//
// Position: ABSOLUTE bottom-0 dentro del centro 70% del Layout 30/70.
// NO `fixed` — el container padre es h-[700px] overflow-hidden (Patrón G).
// ════════════════════════════════════════════════════════════════════════════

import { memo } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { formatCLP } from '../_shared/format'
import MoneyTooltip from './atomos/MoneyTooltip'
import type { LiveSimulation } from './descriptor-simulator-utils'

interface StickyFooterProps {
  simulation: LiveSimulation
  onSeeSynthesis: () => void
}

export default memo(function StickyFooter({
  simulation,
  onSeeSynthesis,
}: StickyFooterProps) {
  const hasChanges = simulation.hasChanges

  return (
    <div
      className="absolute bottom-0 left-0 right-0 z-20 border-t border-cyan-500/15 px-3 md:px-4 py-2 md:py-3"
      style={{
        // Espíritu fhr-glass-card adaptado a ribbon horizontal:
        // glass intenso + glow cyan sutil interior + shadow superior
        background: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        boxShadow:
          '0 -10px 40px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(34, 211, 238, 0.08)',
      }}
    >
      <div className="flex items-center gap-2 md:gap-4">
        {/* IZQUIERDA — Recuperable cyan */}
        <FooterMetric
          label="Recuperable"
          amount={simulation.recuperableCLPTotal}
          color="cyan"
        />

        {/* Divisor */}
        <div className="h-8 w-px bg-slate-700/40" />

        {/* CENTRO — Asistido púrpura */}
        <FooterMetric
          label="Asistido"
          amount={simulation.asistidoCLPTotal}
          color="purple"
        />

        {/* DERECHA — CTA */}
        <div className="ml-auto flex-shrink-0">
          <button
            type="button"
            onClick={onSeeSynthesis}
            disabled={!hasChanges}
            className="inline-flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-medium text-[11px] md:text-xs transition-all duration-200 shadow-lg shadow-cyan-500/25 disabled:bg-slate-800 disabled:text-slate-600 disabled:shadow-none disabled:cursor-not-allowed whitespace-nowrap"
          >
            <span className="hidden sm:inline">Ver </span>Síntesis
            <ArrowRight className="w-3 h-3 md:w-3.5 md:h-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
})

function FooterMetric({
  label,
  amount,
  color,
}: {
  label: string
  amount: number
  color: 'cyan' | 'purple'
}) {
  const palette = {
    cyan: { text: 'text-cyan-300', label: 'text-cyan-400/70' },
    purple: { text: 'text-purple-300', label: 'text-purple-400/70' },
  }
  const c = palette[color]
  const isActive = amount > 0
  return (
    <div className="flex-shrink-0">
      <p
        className={
          isActive
            ? `text-[9px] uppercase tracking-widest font-bold ${c.label}`
            : 'text-[9px] uppercase tracking-widest font-bold text-slate-600'
        }
      >
        {label} / mes
      </p>
      <MoneyTooltip>
        <motion.p
          key={Math.round(amount)}
          initial={{ opacity: 0.5, y: -1 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className={
            isActive
              ? `text-lg font-mono font-bold tabular-nums ${c.text}`
              : 'text-lg font-mono tabular-nums text-slate-600'
          }
        >
          {isActive ? formatCLP(amount) : '—'}
        </motion.p>
      </MoneyTooltip>
    </div>
  )
}
