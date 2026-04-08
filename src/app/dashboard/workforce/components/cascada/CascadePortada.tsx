'use client'

// ════════════════════════════════════════════════════════════════════════════
// CASCADE PORTADA — Hero number + sentencia unica
// Narrativas exactas del script CASCADA_WORKFORCE_PLANNING_SCRIPT_v2.md
// src/app/dashboard/workforce/components/cascada/CascadePortada.tsx
// ════════════════════════════════════════════════════════════════════════════

import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { PrimaryButton } from '@/components/ui/PremiumButton'

interface CascadePortadaProps {
  exposureScore: number
  cantidadHallazgos: number
  onContinue: () => void
}

export default function CascadePortada({
  exposureScore,
  cantidadHallazgos,
  onContinue,
}: CascadePortadaProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex flex-col items-center justify-center text-center min-h-[60vh] w-full max-w-xl mx-auto px-4"
    >
      {/* Subtitulo */}
      <p className="text-xs text-slate-500 uppercase tracking-widest mb-6">
        De exposicion a la automatizacion
      </p>

      {/* Hero Number */}
      <p className="text-6xl md:text-7xl font-extralight text-white tracking-tight">
        {exposureScore}%
      </p>

      {/* Narrativa — del script */}
      <p className="text-base text-slate-300 font-light leading-relaxed max-w-md mt-8">
        Tu organizacion opera con <span className="text-purple-400">{exposureScore}%</span> de exposicion a la automatizacion.
      </p>

      {/* Consecuencia — del script */}
      <p className="text-sm text-slate-400 italic font-light max-w-md mt-3">
        Eso compromete la estructura de costos y la continuidad operativa si no se gestiona antes que la competencia.
      </p>

      {/* CTA */}
      <div className="mt-10">
        <PrimaryButton
          icon={ArrowRight}
          iconPosition="right"
          onClick={onContinue}
        >
          Ver evidencia
        </PrimaryButton>
      </div>
    </motion.div>
  )
}
