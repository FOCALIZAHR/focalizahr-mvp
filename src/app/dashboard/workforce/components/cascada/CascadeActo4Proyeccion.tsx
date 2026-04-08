'use client'

// ════════════════════════════════════════════════════════════════════════════
// CASCADE ACTO 4 — "El Costo de No Actuar" — Proyeccion 12 meses
// Narrativas exactas del script CASCADA_WORKFORCE_PLANNING_SCRIPT_v2.md
// src/app/dashboard/workforce/components/cascada/CascadeActo4Proyeccion.tsx
// ════════════════════════════════════════════════════════════════════════════

import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { PrimaryButton } from '@/components/ui/PremiumButton'
import { formatCurrency } from '../../utils/format'
import type { WorkforceDiagnosticData } from '../../types/workforce.types'
import type { ComputedCascadeValues } from '../../hooks/useWorkforceCascade'

interface CascadeActo4Props {
  data: WorkforceDiagnosticData
  computed: ComputedCascadeValues
  onContinue: () => void
  onBack: () => void
}

export default function CascadeActo4Proyeccion({
  data,
  computed,
  onContinue,
}: CascadeActo4Props) {
  const rows = [
    {
      concepto: 'Finiquitos acumulados (sin actuar)',
      costo: data.severanceLiability.totalSeverance,
    },
    {
      concepto: 'Costo reemplazo talento fugado',
      costo: data.flightRisk.totalReplacementCost,
    },
    {
      concepto: 'Capacidad atrapada no capturada',
      costo: data.inertiaCost.totalAnnual,
    },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="w-full max-w-3xl mx-auto px-4"
    >
      {/* Hero */}
      <div className="text-center mb-8">
        <p className="text-xs text-slate-500 uppercase tracking-widest mb-2">Acto 4</p>
        <p className="text-4xl md:text-5xl font-extralight text-white">
          <span className="text-purple-400">{formatCurrency(computed.costoNoActuar12M)}</span>
        </p>
        <p className="text-xs text-slate-500 uppercase tracking-widest mt-2">
          costo acumulado en 12 meses de inaccion
        </p>
      </div>

      {/* Narrativa — del script */}
      <p className="text-sm text-slate-400 font-light leading-relaxed max-w-lg mx-auto text-center mb-8">
        Proyectamos el escenario donde ninguna de las decisiones identificadas se toma durante los proximos 12 meses. El costo de postergar siempre supera el costo de actuar.
      </p>

      {/* Tabla consolidada */}
      <div className="bg-slate-900/60 backdrop-blur-sm border border-slate-800/40 rounded-xl p-4 md:p-6 mb-6">
        <p className="text-xs text-slate-500 uppercase tracking-wider mb-3 font-medium">
          Proyeccion consolidada
        </p>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800/50">
              <th className="text-left text-xs text-slate-500 font-medium pb-2">Concepto</th>
              <th className="text-right text-xs text-slate-500 font-medium pb-2">Costo 12 meses</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-b border-slate-800/20">
                <td className="py-2.5 text-slate-300 font-light">{row.concepto}</td>
                <td className="py-2.5 text-right text-purple-400 font-light">{formatCurrency(row.costo)}</td>
              </tr>
            ))}
            {/* Total */}
            <tr className="border-t border-slate-700/50">
              <td className="py-3 text-white font-bold">Total costo de no actuar</td>
              <td className="py-3 text-right text-purple-400 font-bold text-lg">
                {formatCurrency(computed.costoNoActuar12M)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Coaching tip — del script */}
      <p className="text-xs text-slate-500 font-light text-center mb-6">
        ● El costo de no actuar no aparece en ningun presupuesto. No tiene dueño. No tiene fecha de vencimiento. Por eso se acumula silenciosamente hasta que explota.
      </p>

      {/* Transicion — del script */}
      <div className="text-center mb-6">
        <p className="text-sm text-slate-300 font-light italic">
          El riesgo futuro esta cuantificado. Ahora, la pregunta que importa: ¿por donde empezar?
        </p>
      </div>

      <div className="flex justify-center">
        <PrimaryButton icon={ArrowRight} iconPosition="right" onClick={onContinue}>
          Continuar
        </PrimaryButton>
      </div>
    </motion.div>
  )
}
