// ════════════════════════════════════════════════════════════════════════════
// SHOCK GLOBAL — Estado inicial del Efficiency Hub (antes de elegir familia)
// src/components/efficiency/ShockGlobalPortada.tsx
// ════════════════════════════════════════════════════════════════════════════
// Un número protagonista centrado. Sin bordes, sin cards, sin stats.
// El CEO entra al Hub y lo primero que ve es una cifra que lo detiene.
//
// Patrón alineado con el Acto Ancla (Nivel 1B):
//   · Valor: (L1.totalMonthly + L5.total) × 12 → escala ANUAL
//   · Formato: entero en millones, sin $ ni M (ej: "1.234")
//   · Leyenda: "MM$ / AÑO" da el contexto de magnitud y periodicidad
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { PrimaryButton } from '@/components/ui/PremiumButton'
import { formatInt } from '@/lib/services/efficiency/EfficiencyNarrativeEngine'

interface ShockGlobalPortadaProps {
  shockGlobalMonthly: number
  /** CTA "Ver diagnóstico →" — abre el Acto Ancla (Nivel 1B) */
  onShowDiagnostico?: () => void
}

export function ShockGlobalPortada({
  shockGlobalMonthly,
  onShowDiagnostico,
}: ShockGlobalPortadaProps) {
  // Escala anual en millones (entero), coherente con el Acto Ancla.
  const shockAnualMillones = Math.round((shockGlobalMonthly * 12) / 1_000_000)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="relative h-full overflow-hidden flex flex-col items-center justify-center px-6 text-center"
    >
      {/* Tesla line top — firma visual canónica */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px] z-10"
        style={{
          background:
            'linear-gradient(90deg, transparent, #22D3EE, #A78BFA, transparent)',
          boxShadow: '0 0 20px #22D3EE',
        }}
        aria-hidden
      />

      <p
        className="font-extralight text-white leading-none tabular-nums"
        style={{
          fontSize: 'clamp(56px, 9vw, 96px)',
          letterSpacing: '-0.03em',
        }}
      >
        {formatInt(shockAnualMillones)}
      </p>
      <p className="text-xs uppercase tracking-widest text-slate-500 mt-4">
        MM$ / AÑO
      </p>
      <p className="text-base font-light text-slate-400 mt-6 max-w-xl leading-relaxed">
        La organización financia hoy trabajo que la IA ya resolvió.
      </p>

      {onShowDiagnostico && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25, ease: 'easeOut' }}
          className="mt-10"
        >
          <PrimaryButton
            icon={ArrowRight}
            iconPosition="right"
            onClick={onShowDiagnostico}
          >
            Ver diagnóstico
          </PrimaryButton>
        </motion.div>
      )}
    </motion.div>
  )
}
