'use client'

// ════════════════════════════════════════════════════════════════════════════
// CLIMA PORTADA — El gancho de la Cascada Ejecutiva (doc 2 §0.1).
// Clon de tokens canónicos de CompensationPortada.tsx. Regla de la portada:
// cero costo, cero amplificador — solo el número y la pregunta que abre.
// El hook (4 variantes por zona) es copy VERBATIM del ClimaNarrativeDictionary.
//
// GEOMETRÍA recalibrada 2026-07-20 (Gate 4.5a reabierto SOLO para esto, cambio
// visual puro — sin lógica ni datos). El padding se APILA: el wrapper de
// ClimaIntroSequence:40 ya aporta `md:py-10`, y la card sumaba `md:py-20` → 120px
// antes del título, con el CTA cortado bajo la línea de flote (Mandamiento 2) y el
// texto en `max-w-md` dentro de una card de ~832px (62% de uso).
// Ahora: `py-8 md:py-10`, gaps `mb-4`/`mt-4`/`mt-6`, hero 56px, texto `max-w-2xl`
// (~89% de uso). Mismo tratamiento que ClimaPlanPortada — mantener ambas alineadas.
// Si se agranda algo acá: verificar contra captura real, no estimando.
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

      <div className="px-6 py-8 md:px-10 md:py-10 flex flex-col items-center text-center">
        {/* ─── TÍTULO ─── */}
        <div className="mb-4">
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
          className="text-[56px] font-extralight text-white leading-[0.9] tabular-nums"
        >
          {favorability !== null ? `${Math.round(favorability)}%` : '—'}
        </motion.p>

        {/* ─── GANCHO (verbatim §0.1) ─── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="max-w-3xl mt-4"
        >
          <p className="text-base font-light text-slate-400 leading-relaxed">{hook}</p>
        </motion.div>

        {/* ─── ACCIÓN ÚNICA ─── */}
        <div className="mt-6">
          <PrimaryButton icon={ArrowRight} iconPosition="right" onClick={onContinue}>
            {ctaLabel.replace(/\s*→\s*$/, '')}
          </PrimaryButton>
        </div>
      </div>
    </div>
  )
})
