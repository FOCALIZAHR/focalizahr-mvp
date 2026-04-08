'use client'

// ════════════════════════════════════════════════════════════════════════════
// CASCADE ACTO 2 — "El Precio de la Inercia"
// Narrativas exactas del script CASCADA_WORKFORCE_PLANNING_SCRIPT_v2.md
// src/app/dashboard/workforce/components/cascada/CascadeActo2Inercia.tsx
// ════════════════════════════════════════════════════════════════════════════

import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { PrimaryButton } from '@/components/ui/PremiumButton'
import { formatCurrency } from '../../utils/format'
import type { WorkforceDiagnosticData } from '../../types/workforce.types'

interface CascadeActo2Props {
  data: WorkforceDiagnosticData
  onContinue: () => void
  onBack: () => void
}

export default function CascadeActo2Inercia({
  data,
  onContinue,
}: CascadeActo2Props) {
  const costoMensual = formatCurrency(data.inertiaCost.totalMonthly)
  const costoAnual = formatCurrency(data.inertiaCost.totalAnnual)
  const fteLiberados = Math.round(data.liberatedFTEs.totalFTEs)

  // Ordenar departamentos por costo descendente
  const deptsSorted = [...data.liberatedFTEs.byDepartment]
    .sort((a, b) => b.monthlySavings - a.monthlySavings)

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="w-full max-w-3xl mx-auto px-4"
    >
      {/* Hero */}
      <div className="text-center mb-8">
        <p className="text-xs text-slate-500 uppercase tracking-widest mb-2">Acto 2</p>
        <p className="text-4xl md:text-5xl font-extralight text-white">
          <span className="text-purple-400">{costoMensual}</span>
        </p>
        <p className="text-xs text-slate-500 uppercase tracking-widest mt-2">
          por mes en capacidad atrapada
        </p>
      </div>

      {/* Narrativa — del script */}
      <p className="text-sm text-slate-400 font-light leading-relaxed max-w-lg mx-auto text-center mb-4">
        Tu organizacion paga <span className="text-purple-400">{costoAnual}</span> al año en salarios de cargos con mas de 50% de exposicion a IA.
      </p>
      <p className="text-sm text-slate-400 font-light leading-relaxed max-w-lg mx-auto text-center mb-8">
        Eso equivale a <span className="text-purple-400">{fteLiberados} FTEs</span> de capacidad atrapada — personas haciendo trabajo que una maquina puede hacer mas rapido, sin errores, y sin costo marginal.
      </p>

      {/* Tabla desglose por gerencia */}
      {deptsSorted.length > 0 && (
        <div className="bg-slate-900/60 backdrop-blur-sm border border-slate-800/40 rounded-xl p-4 md:p-6 mb-6 overflow-x-auto">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-3 font-medium">
            Desglose por gerencia
          </p>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800/50">
                <th className="text-left text-xs text-slate-500 font-medium pb-2">Gerencia</th>
                <th className="text-right text-xs text-slate-500 font-medium pb-2">FTE liberados</th>
                <th className="text-right text-xs text-slate-500 font-medium pb-2">$/mes atrapado</th>
              </tr>
            </thead>
            <tbody>
              {deptsSorted.map(dept => (
                <tr key={dept.departmentId} className="border-b border-slate-800/20">
                  <td className="py-2 text-slate-300 font-light">{dept.departmentName}</td>
                  <td className="py-2 text-right text-slate-300 font-light">{dept.liberatedFTEs.toFixed(1)}</td>
                  <td className="py-2 text-right text-purple-400 font-light">{formatCurrency(dept.monthlySavings)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Coaching tip — del script */}
      <p className="text-xs text-slate-500 font-light text-center mb-6">
        ● Estos numeros no son un presupuesto de recortes. Son capacidad que puedes reasignar a trabajo de alto valor — o capturar como ahorro directo al P&L.
      </p>

      {/* Transicion — del script */}
      <div className="text-center mb-6">
        <p className="text-sm text-slate-300 font-light italic">
          El costo mensual ya esta claro. Ahora veamos las personas y cargos especificos que requieren decision.
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
