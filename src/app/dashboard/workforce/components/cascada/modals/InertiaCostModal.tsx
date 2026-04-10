'use client'

// ════════════════════════════════════════════════════════════════════════════
// INERTIA COST MODAL — Detalle del Acto 4 Costo (v3.1)
//
// 2 secciones V1: Productividad (por segmento) | Inercia (por area)
// Portal a document.body, z-[9999], Tesla line violet (crisis financiera)
// src/app/dashboard/workforce/components/cascada/modals/InertiaCostModal.tsx
// ════════════════════════════════════════════════════════════════════════════

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatCurrency } from '../../../utils/format'
import type { WorkforceDiagnosticData } from '../../../types/workforce.types'

interface InertiaCostModalProps {
  data: WorkforceDiagnosticData
  onClose: () => void
}

type Section = 'productividad' | 'inercia'

export default function InertiaCostModal({ data, onClose }: InertiaCostModalProps) {
  const [section, setSection] = useState<Section>('productividad')

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const productivitySegments = data.productivityGap?.bySegment ?? []
  const inertiaAreas = [...data.inertiaCost.byDepartment].sort((a, b) => b.monthlyCost - a.monthlyCost)

  const content = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
        onClick={onClose}
      />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="relative bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col"
      >
        <div
          className="absolute top-0 left-0 right-0 h-[2px] z-20"
          style={{
            background: 'linear-gradient(90deg, transparent, #A78BFA, transparent)',
            boxShadow: '0 0 20px #A78BFA',
          }}
        />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-slate-800/50 hover:bg-slate-700/50 flex items-center justify-center transition-colors"
          aria-label="Cerrar"
        >
          <X className="w-4 h-4 text-slate-400" />
        </button>

        <div className="p-6 pt-8 border-b border-slate-800/50 flex-shrink-0">
          <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">
            El precio de la inercia
          </p>
          <h2 className="text-xl font-light text-white">Costo cuantificado</h2>
        </div>

        {/* Section selector */}
        <div className="border-b border-slate-800/50 px-6 flex-shrink-0">
          <div className="flex gap-1">
            <button
              onClick={() => setSection('productividad')}
              className={cn(
                'px-4 py-3 text-xs font-medium uppercase tracking-wider transition-colors border-b-2',
                section === 'productividad'
                  ? 'text-violet-400 border-violet-400'
                  : 'text-slate-500 border-transparent hover:text-slate-300'
              )}
            >
              Productividad
              <span className="text-[10px] text-slate-600 ml-2 font-mono">
                {formatCurrency(data.productivityGap?.total ?? 0)}/mes
              </span>
            </button>
            <button
              onClick={() => setSection('inercia')}
              className={cn(
                'px-4 py-3 text-xs font-medium uppercase tracking-wider transition-colors border-b-2',
                section === 'inercia'
                  ? 'text-violet-400 border-violet-400'
                  : 'text-slate-500 border-transparent hover:text-slate-300'
              )}
            >
              Inercia IA
              <span className="text-[10px] text-slate-600 ml-2 font-mono">
                {formatCurrency(data.inertiaCost.totalMonthly)}/mes
              </span>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {section === 'productividad' && (
            <div>
              <p className="text-xs text-slate-400 font-light mb-4 max-w-md mx-auto text-center">
                Salarios pagados por rendimiento no entregado.
                Cálculo: <code className="text-slate-500">SUM(salario × (1 - roleFit/100))</code> donde roleFit &lt; 70.
              </p>
              {productivitySegments.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-8">
                  Sin gap de productividad detectado.
                </p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-800/50">
                      <th className="text-left text-[10px] text-slate-500 font-medium uppercase tracking-wider py-2">
                        Segmento
                      </th>
                      <th className="text-right text-[10px] text-slate-500 font-medium uppercase tracking-wider py-2">
                        Personas
                      </th>
                      <th className="text-right text-[10px] text-slate-500 font-medium uppercase tracking-wider py-2">
                        Gap mensual
                      </th>
                      <th className="text-right text-[10px] text-slate-500 font-medium uppercase tracking-wider py-2">
                        Gap anual
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {productivitySegments.map(seg => (
                      <tr key={seg.key} className="border-b border-slate-800/20 hover:bg-slate-800/20 transition-colors">
                        <td className="py-3 text-cyan-400 font-light">{seg.key}</td>
                        <td className="py-3 text-right text-slate-300 font-mono">{seg.count}</td>
                        <td className="py-3 text-right text-violet-400 font-mono">{formatCurrency(seg.total)}</td>
                        <td className="py-3 text-right text-violet-400 font-mono">{formatCurrency(seg.total * 12)}</td>
                      </tr>
                    ))}
                    <tr className="border-t border-slate-700/50">
                      <td className="py-3 text-white font-medium uppercase text-xs tracking-wider">Total</td>
                      <td className="py-3 text-right text-white font-mono">{data.productivityGap?.affectedCount ?? 0}</td>
                      <td className="py-3 text-right text-violet-400 font-mono font-bold">
                        {formatCurrency(data.productivityGap?.total ?? 0)}
                      </td>
                      <td className="py-3 text-right text-violet-400 font-mono font-bold">
                        {formatCurrency((data.productivityGap?.total ?? 0) * 12)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              )}
            </div>
          )}

          {section === 'inercia' && (
            <div>
              <p className="text-xs text-slate-400 font-light mb-4 max-w-md mx-auto text-center">
                Costo mensual de salarios en cargos con &gt;50% de exposición a IA.
                Calculado por área (gerencia).
              </p>
              {inertiaAreas.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-8">
                  Sin inercia detectada.
                </p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-800/50">
                      <th className="text-left text-[10px] text-slate-500 font-medium uppercase tracking-wider py-2">
                        Área
                      </th>
                      <th className="text-right text-[10px] text-slate-500 font-medium uppercase tracking-wider py-2">
                        Headcount
                      </th>
                      <th className="text-right text-[10px] text-slate-500 font-medium uppercase tracking-wider py-2">
                        Exp. Prom.
                      </th>
                      <th className="text-right text-[10px] text-slate-500 font-medium uppercase tracking-wider py-2">
                        $/mes
                      </th>
                      <th className="text-right text-[10px] text-slate-500 font-medium uppercase tracking-wider py-2">
                        $/año
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {inertiaAreas.map(area => (
                      <tr key={area.departmentId} className="border-b border-slate-800/20 hover:bg-slate-800/20 transition-colors">
                        <td className="py-3 text-cyan-400 font-light">{area.departmentName}</td>
                        <td className="py-3 text-right text-slate-300 font-mono">{area.headcount}</td>
                        <td className="py-3 text-right text-slate-300 font-mono">{Math.round(area.avgExposure * 100)}%</td>
                        <td className="py-3 text-right text-violet-400 font-mono">{formatCurrency(area.monthlyCost)}</td>
                        <td className="py-3 text-right text-violet-400 font-mono">{formatCurrency(area.annualCost)}</td>
                      </tr>
                    ))}
                    <tr className="border-t border-slate-700/50">
                      <td colSpan={3} className="py-3 text-white font-medium uppercase text-xs tracking-wider">Total</td>
                      <td className="py-3 text-right text-violet-400 font-mono font-bold">
                        {formatCurrency(data.inertiaCost.totalMonthly)}
                      </td>
                      <td className="py-3 text-right text-violet-400 font-mono font-bold">
                        {formatCurrency(data.inertiaCost.totalAnnual)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )

  return createPortal(content, document.body)
}
