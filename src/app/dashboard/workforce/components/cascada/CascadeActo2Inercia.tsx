'use client'

// ════════════════════════════════════════════════════════════════════════════
// ACTO 2 — "El Precio de la Inercia"
// Patron narrativo PURO: ActSeparator + ancla + narrativa + coaching tip + SubtleLink
// El detalle (tabla por gerencia) vive en InerciaDesgloseModal
// Narrativa exacta del script CASCADA_WORKFORCE_PLANNING_SCRIPT_v2.md
// src/app/dashboard/workforce/components/cascada/CascadeActo2Inercia.tsx
// ════════════════════════════════════════════════════════════════════════════

import { memo } from 'react'
import { motion } from 'framer-motion'
import {
  ActSeparator,
  fadeIn,
  fadeInDelay,
  SubtleLink,
} from '@/app/dashboard/executive-hub/components/GoalsCorrelation/cascada/shared'
import { formatCurrency } from '../../utils/format'
import type { WorkforceDiagnosticData } from '../../types/workforce.types'

interface CascadeActo2Props {
  data: WorkforceDiagnosticData
  onOpenDesglose: () => void
  // Legacy
  onContinue?: () => void
  onBack?: () => void
}

export default memo(function CascadeActo2Inercia({ data, onOpenDesglose }: CascadeActo2Props) {
  const costoMensual = formatCurrency(data.inertiaCost.totalMonthly)
  const costoAnual = formatCurrency(data.inertiaCost.totalAnnual)
  const fteLiberados = Math.round(data.liberatedFTEs.totalFTEs)
  const cantidadGerencias = data.inertiaCost.byDepartment.length

  // Acto condicional: si no hay costo, no renderizar
  if (data.inertiaCost.totalMonthly === 0) return null

  return (
    <>
      <ActSeparator label="Inercia" color="amber" />

      <div>
        {/* Ancla — costo mensual en grande */}
        <motion.div {...fadeInDelay} className="text-center mb-10">
          <p className="text-7xl md:text-8xl font-extralight text-amber-400 tracking-tight">
            {costoMensual}
          </p>
          <p className="text-xs text-slate-500 mt-3 uppercase tracking-wider">
            por mes en capacidad atrapada
          </p>
        </motion.div>

        {/* Narrativa — del script v2 */}
        <motion.div {...fadeIn} className="max-w-2xl mx-auto space-y-4">
          <p className="text-xl font-light text-slate-300 text-center leading-relaxed">
            Tu organizacion paga{' '}
            <span className="font-medium text-purple-400">{costoAnual}</span>{' '}
            al año en salarios de cargos con mas de 50% de exposicion a IA.
          </p>

          <p className="text-base font-light text-slate-400 leading-relaxed text-center">
            Eso equivale a{' '}
            <span className="font-medium text-purple-400">{fteLiberados} FTEs</span>{' '}
            de capacidad atrapada — personas haciendo trabajo que una maquina puede hacer
            mas rapido, sin errores, y sin costo marginal.
          </p>

          <p className="text-base font-light text-slate-400 leading-relaxed text-center">
            El costo de postergar siempre supera el costo de actuar. Siempre.
          </p>

          {/* Coaching tip */}
          <div className="border-l-2 border-amber-500/30 pl-4 mt-6">
            <p className="text-sm italic font-light text-slate-300 leading-relaxed">
              Estos numeros no son un presupuesto de recortes. Son capacidad que puedes
              reasignar a trabajo de alto valor — o capturar como ahorro directo al P&L.
              La decision define que tipo de organizacion quieres ser.
            </p>
          </div>
        </motion.div>

        {/* SubtleLink al modal con desglose */}
        <motion.div {...fadeIn} className="max-w-2xl mx-auto mt-10 flex justify-center">
          <SubtleLink onClick={onOpenDesglose}>
            Ver desglose por {cantidadGerencias} gerencia{cantidadGerencias !== 1 ? 's' : ''}
          </SubtleLink>
        </motion.div>
      </div>
    </>
  )
})
