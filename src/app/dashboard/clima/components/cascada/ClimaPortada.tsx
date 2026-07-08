'use client'

// ════════════════════════════════════════════════════════════════════════════
// CLIMA PORTADA — El gancho de la Cascada Ejecutiva (doc 2 §0.1).
// Clon de tokens canónicos de CompensationPortada.tsx. Regla de la portada:
// cero costo, cero amplificador — solo el número y la pregunta que abre.
// El hook (4 variantes por zona) es copy VERBATIM del ClimaNarrativeDictionary.
// ════════════════════════════════════════════════════════════════════════════

import { memo } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { PrimaryButton } from '@/components/ui/PremiumButton'

interface ClimaPortadaProps {
  hook: string
  ctaLabel: string
  favorability: number | null
  onContinue: () => void
}

export default memo(function ClimaPortada({
  hook,
  ctaLabel,
  favorability,
  onContinue,
}: ClimaPortadaProps) {
  return (
    <div className="relative rounded-2xl border border-slate-800/40 bg-slate-900/60 backdrop-blur-sm overflow-hidden">
      {/* Tesla line */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{
          background:
            'linear-gradient(90deg, transparent 5%, #22D3EE 35%, #A78BFA 65%, transparent 95%)',
          opacity: 0.7,
        }}
      />

      <div className="px-6 py-14 md:px-10 md:py-20 flex flex-col items-center text-center">
        {/* ─── TÍTULO ─── */}
        <div className="mb-12">
          <h2 className="text-3xl font-extralight text-white tracking-tight leading-tight">
            Experiencia
          </h2>
          <p className="text-xl font-light tracking-tight leading-tight fhr-title-gradient mt-1">
            Colaborador
          </p>
        </div>

        {/* ─── DATO HERO ─── */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-[72px] font-extralight text-white leading-[0.9] tabular-nums"
        >
          {favorability !== null ? `${Math.round(favorability)}%` : '—'}
        </motion.p>

        {/* ─── GANCHO (verbatim §0.1) ─── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="max-w-md mt-6"
        >
          <p className="text-base font-light text-slate-400 leading-relaxed">{hook}</p>
        </motion.div>

        {/* ─── ACCIÓN ÚNICA ─── */}
        <div className="mt-14">
          <PrimaryButton icon={ArrowRight} iconPosition="right" onClick={onContinue}>
            {ctaLabel.replace(/\s*→\s*$/, '')}
          </PrimaryButton>
        </div>
      </div>
    </div>
  )
})
