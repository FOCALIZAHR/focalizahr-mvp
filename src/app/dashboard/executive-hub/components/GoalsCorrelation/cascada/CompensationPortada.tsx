'use client'

// ════════════════════════════════════════════════════════════════════════════
// COMPENSATION PORTADA — Revisión de alineación antes de compensar
// src/app/dashboard/executive-hub/components/GoalsCorrelation/cascada/CompensationPortada.tsx
// ════════════════════════════════════════════════════════════════════════════
// T1 del rediseño Tab 3: título → dato → consecuencia → acción única.
// Zero (i), zero segundo CTA. La info de gerencias vive en el ranking.
// ════════════════════════════════════════════════════════════════════════════

import { memo, useMemo } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { PrimaryButton } from '@/components/ui/PremiumButton'

import type { CorrelationPoint } from '../GoalsCorrelation.types'

// ════════════════════════════════════════════════════════════════════════════

interface CompensationPortadaProps {
  correlation: CorrelationPoint[]
  onContinue: () => void
}

export default memo(function CompensationPortada({
  correlation,
  onContinue,
}: CompensationPortadaProps) {
  const discrepancy = useMemo(() => {
    return correlation.filter(
      c => c.quadrant !== 'NO_GOALS' && c.quadrant !== 'CONSISTENT' && c.goalsPercent !== null
    ).length
  }, [correlation])

  return (
    <div className="relative rounded-2xl border border-slate-800/40 bg-slate-900/60 backdrop-blur-sm overflow-hidden">
      {/* Tesla line */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{
          background: 'linear-gradient(90deg, transparent 5%, #22D3EE 35%, #A78BFA 65%, transparent 95%)',
          opacity: 0.7,
        }}
      />

      <div className="px-6 py-14 md:px-10 md:py-20 flex flex-col items-center text-center">
        {/* ─── TÍTULO ─── */}
        <div className="mb-12">
          <h2 className="text-3xl font-extralight text-white tracking-tight leading-tight">
            Revisión de alineación
          </h2>
          <p className="text-xl font-light tracking-tight leading-tight fhr-title-gradient mt-1">
            Metas y Talento
          </p>
        </div>

        {/* ─── DATO HERO ─── */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-[72px] font-extralight text-white leading-[0.9] tabular-nums"
        >
          {discrepancy}
        </motion.p>

        {/* ─── CONSECUENCIA ─── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="max-w-md mt-6"
        >
          <p className="text-base font-light text-slate-400 leading-relaxed mb-3">
            Casos donde la evaluación del líder contradice el resultado del negocio.
          </p>
          <p className="text-sm font-light text-slate-500 leading-relaxed">
            Aprobar estas compensaciones impacta directamente en la cultura de mérito.
          </p>
        </motion.div>

        {/* ─── ACCIÓN ÚNICA ─── */}
        <div className="mt-14">
          <PrimaryButton icon={ArrowRight} iconPosition="right" onClick={onContinue}>
            Ver áreas
          </PrimaryButton>
        </div>
      </div>
    </div>
  )
})
