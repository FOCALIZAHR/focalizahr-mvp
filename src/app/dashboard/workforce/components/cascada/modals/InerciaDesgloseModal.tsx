'use client'

// ════════════════════════════════════════════════════════════════════════════
// INERCIA DESGLOSE MODAL — Detalle del Acto 2 (Inercia)
// Tabla FTEs por gerencia con costo mensual y anual
// fixed inset-0 z-50, Tesla line amber (cost = warning)
// src/app/dashboard/workforce/components/cascada/modals/InerciaDesgloseModal.tsx
// ════════════════════════════════════════════════════════════════════════════

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { formatCurrency } from '../../../utils/format'
import type { WorkforceDiagnosticData } from '../../../types/workforce.types'

interface InerciaDesgloseModalProps {
  data: WorkforceDiagnosticData
  onClose: () => void
}

export default function InerciaDesgloseModal({ data, onClose }: InerciaDesgloseModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // Combinar datos de inertiaCost y liberatedFTEs por departamento
  const deptMap = new Map<string, {
    name: string
    liberatedFTEs: number
    monthlyCost: number
    annualCost: number
    headcount: number
  }>()

  data.inertiaCost.byDepartment.forEach(d => {
    deptMap.set(d.departmentId, {
      name: d.departmentName,
      liberatedFTEs: 0,
      monthlyCost: d.monthlyCost,
      annualCost: d.annualCost,
      headcount: d.headcount,
    })
  })

  data.liberatedFTEs.byDepartment.forEach(d => {
    const existing = deptMap.get(d.departmentId)
    if (existing) {
      existing.liberatedFTEs = d.liberatedFTEs
    } else {
      deptMap.set(d.departmentId, {
        name: d.departmentName,
        liberatedFTEs: d.liberatedFTEs,
        monthlyCost: d.monthlySavings,
        annualCost: d.monthlySavings * 12,
        headcount: d.headcount,
      })
    }
  })

  const rows = Array.from(deptMap.values()).sort((a, b) => b.monthlyCost - a.monthlyCost)

  const totalMonthly = data.inertiaCost.totalMonthly
  const totalAnnual = data.inertiaCost.totalAnnual
  const totalFTEs = data.liberatedFTEs.totalFTEs

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8"
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', stiffness: 220, damping: 30 }}
          className="relative bg-[#0F172A]/95 backdrop-blur-2xl border border-slate-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden"
        >
          {/* Tesla line — amber para cost warning */}
          <div
            className="absolute top-0 left-0 right-0 h-[1px] z-20"
            style={{
              background: 'linear-gradient(90deg, transparent, #F59E0B, transparent)',
              boxShadow: '0 0 15px #F59E0B',
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
              Costo de inercia
            </p>
            <h2 className="text-xl font-light text-white">
              Desglose por gerencia
            </h2>
            <p className="text-xs text-slate-400 font-light mt-2">
              {rows.length} gerencias con cargos expuestos · {totalFTEs.toFixed(1)} FTEs liberables · {formatCurrency(totalMonthly)}/mes
            </p>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800/50">
                  <th className="text-left text-[10px] text-slate-500 font-medium uppercase tracking-wider pb-3">
                    Gerencia
                  </th>
                  <th className="text-right text-[10px] text-slate-500 font-medium uppercase tracking-wider pb-3">
                    Headcount
                  </th>
                  <th className="text-right text-[10px] text-slate-500 font-medium uppercase tracking-wider pb-3">
                    FTE liberables
                  </th>
                  <th className="text-right text-[10px] text-slate-500 font-medium uppercase tracking-wider pb-3">
                    $/mes
                  </th>
                  <th className="text-right text-[10px] text-slate-500 font-medium uppercase tracking-wider pb-3">
                    $/año
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i} className="border-b border-slate-800/20 hover:bg-slate-800/20 transition-colors">
                    <td className="py-3 text-slate-300 font-light">{row.name}</td>
                    <td className="py-3 text-right text-slate-400 font-light font-mono">{row.headcount}</td>
                    <td className="py-3 text-right text-slate-300 font-light font-mono">{row.liberatedFTEs.toFixed(1)}</td>
                    <td className="py-3 text-right text-amber-400 font-light font-mono">{formatCurrency(row.monthlyCost)}</td>
                    <td className="py-3 text-right text-amber-400 font-light font-mono">{formatCurrency(row.annualCost)}</td>
                  </tr>
                ))}
                {/* Totales */}
                <tr className="border-t border-slate-700/50">
                  <td className="py-3 text-white font-medium uppercase text-xs tracking-wider">Total</td>
                  <td className="py-3 text-right text-slate-300 font-mono">{rows.reduce((s, r) => s + r.headcount, 0)}</td>
                  <td className="py-3 text-right text-white font-mono">{totalFTEs.toFixed(1)}</td>
                  <td className="py-3 text-right text-amber-400 font-mono font-medium">{formatCurrency(totalMonthly)}</td>
                  <td className="py-3 text-right text-amber-400 font-mono font-medium">{formatCurrency(totalAnnual)}</td>
                </tr>
              </tbody>
            </table>

            {/* Nota */}
            <p className="text-xs text-slate-500 text-center mt-6 max-w-md mx-auto leading-relaxed">
              FTE liberable = capacidad humana equivalente que la IA puede absorber, calculada
              con la importancia de cada tarea ponderada por su betaScore (Eloundou et al. 2023).
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
