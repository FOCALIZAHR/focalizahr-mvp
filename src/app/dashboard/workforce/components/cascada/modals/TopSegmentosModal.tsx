'use client'

// ════════════════════════════════════════════════════════════════════════════
// TOP SEGMENTOS MODAL — Detalle del Acto 1 Gancho (v3.1)
//
// Lista completa de segmentos ordenados por impactScore descendente
// Columnas: Segmento | Headcount | Exp. Prom. | Impacto
// Drill-down: click en fila expande inline con personas del segmento
// SIN recomendaciones de accion (solo MOSTRAR)
// Portal a document.body, z-[9999], Tesla line cyan
// src/app/dashboard/workforce/components/cascada/modals/TopSegmentosModal.tsx
// ════════════════════════════════════════════════════════════════════════════

import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { X, ChevronDown, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { calculateSegmentMetrics, type SegmentMetrics } from '@/lib/workforce/segmentUtils'
import type { WorkforceDiagnosticData, PersonAlert } from '../../../types/workforce.types'

interface TopSegmentosModalProps {
  data: WorkforceDiagnosticData
  onClose: () => void
}

export default function TopSegmentosModal({ data, onClose }: TopSegmentosModalProps) {
  const [expandedKey, setExpandedKey] = useState<string | null>(null)

  // ESC para cerrar
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // Computar segmentos desde la union zombies + flightRisk (mismo source que el Acto)
  const segments = useMemo<SegmentMetrics<PersonAlert>[]>(() => {
    const riskMap = new Map<string, PersonAlert>()
    for (const z of data.zombies.persons) riskMap.set(z.employeeId, z)
    for (const f of data.flightRisk.persons) {
      if (!riskMap.has(f.employeeId)) riskMap.set(f.employeeId, f)
    }
    const allRisk = Array.from(riskMap.values())
    const classified = allRisk.filter(p => p.acotadoGroup && p.standardCategory)
    return calculateSegmentMetrics(classified, p => p.observedExposure)
  }, [data.zombies.persons, data.flightRisk.persons])

  const toggleExpand = (key: string) => {
    setExpandedKey(prev => (prev === key ? null : key))
  }

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
        className="relative bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col"
      >
        {/* Tesla line — cyan (gancho = identificacion neutra) */}
        <div
          className="absolute top-0 left-0 right-0 h-[2px] z-20"
          style={{
            background: 'linear-gradient(90deg, transparent, #22D3EE, transparent)',
            boxShadow: '0 0 20px #22D3EE',
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
        <div className="p-6 pt-8 border-b border-slate-800/50 flex-shrink-0">
          <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">
            Concentracion del riesgo
          </p>
          <h2 className="text-xl font-light text-white">
            {segments.length} segmentos en riesgo
          </h2>
          <p className="text-xs text-slate-400 font-light mt-2">
            Ordenados por impacto = headcount × exposición promedio.
            Click en una fila para ver las personas del segmento.
          </p>
        </div>

        {/* Body — tabla scrollable */}
        <div className="flex-1 overflow-y-auto">
          {segments.length === 0 ? (
            <p className="text-center text-slate-500 text-sm py-12">
              Sin segmentos clasificados con riesgo concentrado.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-slate-900/95 backdrop-blur-xl">
                <tr className="border-b border-slate-800/50">
                  <th className="text-left text-[10px] text-slate-500 font-medium uppercase tracking-wider px-6 py-3 w-8"></th>
                  <th className="text-left text-[10px] text-slate-500 font-medium uppercase tracking-wider py-3">
                    Segmento
                  </th>
                  <th className="text-right text-[10px] text-slate-500 font-medium uppercase tracking-wider py-3">
                    Headcount
                  </th>
                  <th className="text-right text-[10px] text-slate-500 font-medium uppercase tracking-wider py-3">
                    Exp. Prom.
                  </th>
                  <th className="text-right text-[10px] text-slate-500 font-medium uppercase tracking-wider px-6 py-3">
                    Impacto
                  </th>
                </tr>
              </thead>
              <tbody>
                {segments.map(seg => {
                  const isExpanded = expandedKey === seg.key
                  const expPct = Math.round(seg.avgExposure * 100)
                  const impactDisplay = Math.round(seg.impactScore * 10) / 10
                  return (
                    <>
                      <tr
                        key={seg.key}
                        onClick={() => toggleExpand(seg.key)}
                        className={cn(
                          'border-b border-slate-800/20 cursor-pointer transition-colors',
                          isExpanded ? 'bg-slate-800/30' : 'hover:bg-slate-800/20'
                        )}
                      >
                        <td className="px-6 py-3">
                          {isExpanded ? (
                            <ChevronDown className="w-3.5 h-3.5 text-cyan-400" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                          )}
                        </td>
                        <td className="py-3 text-cyan-400 font-light">{seg.key}</td>
                        <td className="py-3 text-right text-slate-300 font-mono">{seg.headcount}</td>
                        <td className={cn(
                          'py-3 text-right font-mono',
                          expPct > 60 ? 'text-red-400' : expPct > 40 ? 'text-amber-400' : 'text-slate-300'
                        )}>
                          {expPct}%
                        </td>
                        <td className="px-6 py-3 text-right text-purple-400 font-mono">
                          {impactDisplay}
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="bg-slate-900/40">
                          <td colSpan={5} className="px-6 py-4">
                            <div className="space-y-1">
                              {seg.members.map(person => (
                                <div
                                  key={person.employeeId}
                                  className="flex items-center justify-between text-xs py-1 border-b border-slate-800/20 last:border-0"
                                >
                                  <div className="flex-1 min-w-0">
                                    <span className="text-slate-200 font-light">{person.employeeName}</span>
                                    <span className="text-slate-500 ml-2">{person.position}</span>
                                  </div>
                                  <div className="flex items-center gap-4 flex-shrink-0">
                                    <span className="text-slate-400 font-mono">
                                      {Math.round(person.observedExposure * 100)}%
                                    </span>
                                    {person.metasCompliance !== null && (
                                      <span className="text-slate-500 font-mono text-[10px]">
                                        metas {Math.round(person.metasCompliance)}%
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Nota metodologica */}
        <div className="border-t border-slate-800/50 p-4 flex-shrink-0">
          <p className="text-[10px] text-slate-500 text-center leading-relaxed max-w-md mx-auto">
            Segmento = nivel jerárquico × área funcional. Impacto = headcount × exposición promedio,
            calculado sobre la unión de personas en talento zombie y riesgo de fuga.
          </p>
        </div>
      </motion.div>
    </div>
  )

  return createPortal(content, document.body)
}
