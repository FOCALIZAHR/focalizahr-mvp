'use client'

// ════════════════════════════════════════════════════════════════════════════
// ACTO 4 — "El Costo de No Actuar" — Proyeccion 12 meses
// Patron narrativo PURO: ActSeparator + ancla + narrativa + coaching tip + SubtleLink
// El detalle (tabla consolidada) vive en ProyeccionModal
// Narrativa exacta del script CASCADA_WORKFORCE_PLANNING_SCRIPT_v2.md
// src/app/dashboard/workforce/components/cascada/CascadeActo4Proyeccion.tsx
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
import type { ComputedCascadeValues } from '../../hooks/useWorkforceCascade'

interface CascadeActo4Props {
  data: WorkforceDiagnosticData
  computed: ComputedCascadeValues
  onOpenProyeccion: () => void
  // Legacy
  onContinue?: () => void
  onBack?: () => void
}

export default memo(function CascadeActo4Proyeccion({
  data,
  computed,
  onOpenProyeccion,
}: CascadeActo4Props) {
  const { costoNoActuar12M } = computed

  // Acto condicional: si no hay costo proyectado, no renderizar
  if (costoNoActuar12M === 0) return null

  const costoFinal = formatCurrency(costoNoActuar12M)
  const costoInerciaAnual = formatCurrency(data.inertiaCost.totalAnnual)
  const costoReemplazo = formatCurrency(data.flightRisk.totalReplacementCost)
  const costoFiniquitos = formatCurrency(data.severanceLiability.totalSeverance)

  return (
    <>
      <ActSeparator label="Riesgo futuro" color="purple" />

      <div>
        {/* Ancla — costo total 12 meses */}
        <motion.div {...fadeInDelay} className="text-center mb-10">
          <p className="text-7xl md:text-8xl font-extralight text-violet-400 tracking-tight">
            {costoFinal}
          </p>
          <p className="text-xs text-slate-500 mt-3 uppercase tracking-wider">
            costo acumulado en 12 meses de inaccion
          </p>
        </motion.div>

        {/* Narrativa — del script v2 */}
        <motion.div {...fadeIn} className="max-w-2xl mx-auto space-y-4">
          <p className="text-xl font-light text-slate-300 text-center leading-relaxed">
            Proyectamos el escenario donde ninguna de las decisiones identificadas se toma
            durante los proximos 12 meses.
          </p>

          <p className="text-base font-light text-slate-400 leading-relaxed text-center">
            Finiquitos acumulandose. Talento fugandose. Eficiencia no capturada.
            Competidores avanzando.
          </p>

          <p className="text-base font-light text-slate-400 leading-relaxed text-center">
            <span className="font-medium text-purple-400">{costoFiniquitos}</span> en finiquitos legales.{' '}
            <span className="font-medium text-purple-400">{costoReemplazo}</span> en costo de reemplazo.{' '}
            <span className="font-medium text-purple-400">{costoInerciaAnual}</span> en capacidad
            que la IA puede absorber.
          </p>

          {/* Coaching tip */}
          <div className="border-l-2 border-purple-500/30 pl-4 mt-6">
            <p className="text-sm italic font-light text-slate-300 leading-relaxed">
              El costo de no actuar no aparece en ningun presupuesto. No tiene dueño. No tiene
              fecha de vencimiento. Por eso se acumula silenciosamente hasta que explota.
            </p>
          </div>
        </motion.div>

        {/* SubtleLink al modal con la proyeccion consolidada */}
        <motion.div {...fadeIn} className="max-w-2xl mx-auto mt-10 flex justify-center">
          <SubtleLink onClick={onOpenProyeccion}>
            Ver proyeccion detallada
          </SubtleLink>
        </motion.div>
      </div>
    </>
  )
})
