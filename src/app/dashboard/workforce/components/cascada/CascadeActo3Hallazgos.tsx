'use client'

// ════════════════════════════════════════════════════════════════════════════
// ACTO 3 — "Los Hallazgos" — Situaciones que requieren decision
// Patron narrativo PURO: ActSeparator + ancla + narrativa + coaching tip + SubtleLink
// El detalle (5 FindingCards con tablas) vive en HallazgosModal
// Narrativa exacta del script CASCADA_WORKFORCE_PLANNING_SCRIPT_v2.md
// src/app/dashboard/workforce/components/cascada/CascadeActo3Hallazgos.tsx
// ════════════════════════════════════════════════════════════════════════════

import { memo } from 'react'
import { motion } from 'framer-motion'
import {
  ActSeparator,
  fadeIn,
  fadeInDelay,
  SubtleLink,
} from '@/app/dashboard/executive-hub/components/GoalsCorrelation/cascada/shared'
import type { WorkforceDiagnosticData } from '../../types/workforce.types'
import type { ComputedCascadeValues } from '../../hooks/useWorkforceCascade'

interface CascadeActo3Props {
  data: WorkforceDiagnosticData
  computed: ComputedCascadeValues
  onOpenHallazgos: () => void
  // Legacy
  onContinue?: () => void
  onBack?: () => void
}

export default memo(function CascadeActo3Hallazgos({
  data,
  computed,
  onOpenHallazgos,
}: CascadeActo3Props) {
  const { cantidadHallazgos } = computed

  // Acto condicional: si no hay hallazgos, no renderizar
  if (cantidadHallazgos === 0) return null

  // Tier de color por gravedad (cantidad absoluta)
  const heroColor =
    cantidadHallazgos > 5 ? 'text-violet-400' :
    cantidadHallazgos > 2 ? 'text-amber-400' :
    'text-cyan-400'

  return (
    <>
      <ActSeparator label="Hallazgos" color="amber" />

      <div>
        {/* Ancla — cantidad de hallazgos */}
        <motion.div {...fadeInDelay} className="text-center mb-10">
          <p className={`text-7xl md:text-8xl font-extralight tracking-tight ${heroColor}`}>
            {cantidadHallazgos}
          </p>
          <p className="text-xs text-slate-500 mt-3 uppercase tracking-wider">
            situaciones que requieren decision
          </p>
        </motion.div>

        {/* Narrativa apertura — del script v2 */}
        <motion.div {...fadeIn} className="max-w-2xl mx-auto space-y-4">
          <p className="text-xl font-light text-slate-300 text-center leading-relaxed">
            El sistema cruzo exposicion a IA con datos de performance, compromiso, clima y
            estructura organizacional.
          </p>

          <p className="text-base font-light text-slate-400 leading-relaxed text-center">
            El resultado: <span className="font-medium text-amber-400">{cantidadHallazgos}</span>{' '}
            situaciones donde la inaccion tiene consecuencias medibles. Algunas son oportunidades.
            Otras son riesgos que se acumulan cada dia.
          </p>

          {/* Coaching tip */}
          <div className="border-l-2 border-amber-500/30 pl-4 mt-6">
            <p className="text-sm italic font-light text-slate-300 leading-relaxed">
              Cada hallazgo tiene nombre, cargo y monto. La decision de actuar o postergar
              tambien tiene consecuencias con nombre y monto.
            </p>
          </div>
        </motion.div>

        {/* SubtleLink al modal con los 5 hallazgos */}
        <motion.div {...fadeIn} className="max-w-2xl mx-auto mt-10 flex justify-center">
          <SubtleLink onClick={onOpenHallazgos}>
            Ver los {cantidadHallazgos} hallazgo{cantidadHallazgos !== 1 ? 's' : ''} con nombres
          </SubtleLink>
        </motion.div>
      </div>
    </>
  )
})
