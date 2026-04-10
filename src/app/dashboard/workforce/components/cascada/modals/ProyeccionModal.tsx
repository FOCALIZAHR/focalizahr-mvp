'use client'

// ════════════════════════════════════════════════════════════════════════════
// PROYECCION MODAL — Detalle del Acto 4 (Costo de No Actuar 12 meses)
// Tabla consolidada de 3 conceptos + total
// Portal a document.body, z-[9999], Tesla line violet (crisis financiera)
// src/app/dashboard/workforce/components/cascada/modals/ProyeccionModal.tsx
// ════════════════════════════════════════════════════════════════════════════

import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import { formatCurrency } from '../../../utils/format'
import type { WorkforceDiagnosticData } from '../../../types/workforce.types'

interface ProyeccionModalProps {
  data: WorkforceDiagnosticData
  costoNoActuar12M: number
  onClose: () => void
}

export default function ProyeccionModal({ data, costoNoActuar12M, onClose }: ProyeccionModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const rows = [
    {
      concepto: 'Finiquitos acumulados',
      detalle: `${data.severanceLiability.affectedCount} personas en riesgo de desvinculacion`,
      costo: data.severanceLiability.totalSeverance,
    },
    {
      concepto: 'Reemplazo talento fugado',
      detalle: `${data.flightRisk.count} personas en riesgo de fuga`,
      costo: data.flightRisk.totalReplacementCost,
    },
    {
      concepto: 'Capacidad atrapada (anual)',
      detalle: `${data.inertiaCost.byDepartment.length} gerencias con cargos expuestos`,
      costo: data.inertiaCost.totalAnnual,
    },
  ]

  const content = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-8">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="relative bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden"
      >
        {/* Tesla line — violet (crisis financiera) */}
        <div
          className="absolute top-0 left-0 right-0 h-[2px] z-20"
          style={{
            background: 'linear-gradient(90deg, transparent, #A78BFA, transparent)',
            boxShadow: '0 0 20px #A78BFA',
          }}
        />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-slate-800/50 hover:bg-slate-700/50 flex items-center justify-center transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4 text-slate-400" />
          </button>

          {/* Header */}
          <div className="p-6 pt-8 border-b border-slate-800/50">
            <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">
              Proyeccion 12 meses
            </p>
            <h2 className="text-xl font-light text-white">
              Costo de no actuar
            </h2>
            <p className="text-xs text-slate-400 font-light mt-2">
              Escenario donde ninguna decision identificada se toma durante los proximos 12 meses.
            </p>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800/50">
                  <th className="text-left text-[10px] text-slate-500 font-medium uppercase tracking-wider pb-3">
                    Concepto
                  </th>
                  <th className="text-left text-[10px] text-slate-500 font-medium uppercase tracking-wider pb-3">
                    Detalle
                  </th>
                  <th className="text-right text-[10px] text-slate-500 font-medium uppercase tracking-wider pb-3">
                    Costo 12 meses
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i} className="border-b border-slate-800/20 hover:bg-slate-800/20 transition-colors">
                    <td className="py-3 text-slate-300 font-light">{row.concepto}</td>
                    <td className="py-3 text-slate-500 font-light text-xs">{row.detalle}</td>
                    <td className="py-3 text-right text-purple-400 font-light font-mono">{formatCurrency(row.costo)}</td>
                  </tr>
                ))}
                {/* Total */}
                <tr className="border-t border-slate-700/50">
                  <td colSpan={2} className="py-4 text-white font-medium uppercase text-xs tracking-wider">
                    Total costo de no actuar
                  </td>
                  <td className="py-4 text-right text-violet-400 font-mono font-bold text-lg">
                    {formatCurrency(costoNoActuar12M)}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Nota metodologica */}
            <p className="text-xs text-slate-500 text-center mt-6 max-w-md mx-auto leading-relaxed">
              Calculo: finiquitos legales por antiguedad real (Codigo del Trabajo Chile) +
              costo de reemplazo (SHRM 2024) + masa salarial expuesta a IA durante 12 meses.
            </p>
          </div>
      </motion.div>
    </div>
  )

  return createPortal(content, document.body)
}
