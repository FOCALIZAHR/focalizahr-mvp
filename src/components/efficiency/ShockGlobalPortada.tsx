// ════════════════════════════════════════════════════════════════════════════
// SHOCK GLOBAL — Estado inicial del Efficiency Hub (antes de elegir familia)
// src/components/efficiency/ShockGlobalPortada.tsx
// ════════════════════════════════════════════════════════════════════════════
// Un número protagonista centrado. Sin bordes, sin cards, sin stats.
// El CEO entra al Hub y lo primero que ve es una cifra que lo detiene.
// L1.totalMonthly + L5.total (flujo mensual puro).
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { motion } from 'framer-motion'
import { formatCLP } from '@/lib/services/efficiency/EfficiencyNarrativeEngine'

interface ShockGlobalPortadaProps {
  shockGlobalMonthly: number
  /** Label sutil insinuando que hay un primer lente debajo */
  hintLenteLabel?: string
}

export function ShockGlobalPortada({
  shockGlobalMonthly,
  hintLenteLabel = 'L1 · Costo de Inercia',
}: ShockGlobalPortadaProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="h-full flex flex-col items-center justify-center px-6 text-center"
    >
      <p
        className="font-extralight text-white leading-none"
        style={{
          fontSize: 'clamp(56px, 9vw, 96px)',
          letterSpacing: '-0.03em',
        }}
      >
        {formatCLP(shockGlobalMonthly)}
      </p>
      <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500 mt-4">
        al mes
      </p>
      <p className="text-base md:text-lg font-light text-slate-400 mt-6 max-w-xl leading-relaxed">
        La organización financia hoy trabajo que la IA ya resolvió.
      </p>

      {/* Label sutil insinuando el primer lente (CTA implícito: elige una familia arriba) */}
      <div className="mt-12 flex flex-col items-center gap-1.5">
        <span
          className="w-px h-8"
          style={{
            background:
              'linear-gradient(to bottom, transparent, rgba(148, 163, 184, 0.3))',
          }}
          aria-hidden
        />
        <span className="text-[10px] uppercase tracking-[0.18em] text-slate-600 font-light">
          {hintLenteLabel}
        </span>
      </div>
    </motion.div>
  )
}
