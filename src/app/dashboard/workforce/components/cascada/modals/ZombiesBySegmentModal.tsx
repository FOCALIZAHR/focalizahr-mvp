'use client'

// ════════════════════════════════════════════════════════════════════════════
// ZOMBIES BY SEGMENT MODAL — Detalle del Acto 2 Problema (v3.1)
//
// Acordeon expandible: cada segmento → lista de personas con dominio + metas
// Indicador: cumple (>=80) / no cumple (<80) / sin medicion (null)
// Portal a document.body, z-[9999], Tesla line amber
// src/app/dashboard/workforce/components/cascada/modals/ZombiesBySegmentModal.tsx
// ════════════════════════════════════════════════════════════════════════════

import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { X, ChevronDown, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { groupBySegment } from '@/lib/workforce/segmentUtils'
import type { WorkforceDiagnosticData } from '../../../types/workforce.types'

interface ZombiesBySegmentModalProps {
  data: WorkforceDiagnosticData
  onClose: () => void
}

export default function ZombiesBySegmentModal({ data, onClose }: ZombiesBySegmentModalProps) {
  const [expandedKey, setExpandedKey] = useState<string | null>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const segments = useMemo(() => {
    const classified = data.zombies.persons.filter(z => z.acotadoGroup && z.standardCategory)
    const grouped = groupBySegment(classified)
    return Array.from(grouped.entries())
      .map(([key, members]) => {
        const cumple = members.filter(m => m.metasCompliance !== null && m.metasCompliance >= 80).length
        const noCumple = members.filter(m => m.metasCompliance !== null && m.metasCompliance < 80).length
        const sinMedicion = members.filter(m => m.metasCompliance === null).length
        return { key, members, cumple, noCumple, sinMedicion }
      })
      .sort((a, b) => b.members.length - a.members.length)
  }, [data.zombies.persons])

  const toggleExpand = (key: string) => setExpandedKey(prev => (prev === key ? null : key))

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
            background: 'linear-gradient(90deg, transparent, #F59E0B, transparent)',
            boxShadow: '0 0 20px #F59E0B',
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
            Talento atrapado por segmento
          </p>
          <h2 className="text-xl font-light text-white">
            {data.zombies.count} personas con dominio &gt;70%
          </h2>
          <p className="text-xs text-slate-400 font-light mt-2">
            Click en un segmento para ver las personas. El cumplimiento de metas distingue
            capacidad mal asignada de rendimiento ya degradado.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {segments.length === 0 ? (
            <p className="text-center text-slate-500 text-sm py-12">
              Sin segmentos clasificados.
            </p>
          ) : (
            <div className="space-y-2">
              {segments.map(seg => {
                const isExpanded = expandedKey === seg.key
                return (
                  <div
                    key={seg.key}
                    className="border border-slate-800/50 rounded-lg overflow-hidden"
                  >
                    <button
                      onClick={() => toggleExpand(seg.key)}
                      className={cn(
                        'w-full flex items-center justify-between p-3 text-left transition-colors',
                        isExpanded ? 'bg-slate-800/40' : 'hover:bg-slate-800/20'
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {isExpanded ? (
                          <ChevronDown className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                        )}
                        <span className="text-sm font-light text-cyan-400 truncate">
                          {seg.key}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs flex-shrink-0">
                        <span className="text-slate-300 font-mono">{seg.members.length}</span>
                        {seg.cumple > 0 && (
                          <span className="text-amber-400 font-mono" title="Cumplen metas — capacidad mal asignada">
                            ●{seg.cumple}
                          </span>
                        )}
                        {seg.noCumple > 0 && (
                          <span className="text-red-400 font-mono" title="No cumplen — ya no rindiendo">
                            ●{seg.noCumple}
                          </span>
                        )}
                        {seg.sinMedicion > 0 && (
                          <span className="text-slate-600 font-mono" title="Sin medición de metas">
                            ●{seg.sinMedicion}
                          </span>
                        )}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="p-3 pt-0 space-y-1 bg-slate-900/40">
                        {seg.members.map(p => {
                          const metasState =
                            p.metasCompliance === null ? 'sin' :
                            p.metasCompliance >= 80 ? 'cumple' : 'no_cumple'
                          return (
                            <div
                              key={p.employeeId}
                              className="flex items-center justify-between text-xs py-1.5 border-b border-slate-800/20 last:border-0"
                            >
                              <div className="flex-1 min-w-0">
                                <span className="text-slate-200 font-light">{p.employeeName}</span>
                                <span className="text-slate-500 ml-2">{p.position}</span>
                              </div>
                              <div className="flex items-center gap-3 flex-shrink-0">
                                <span className="text-slate-400 font-mono" title="Dominio del cargo">
                                  {Math.round(p.roleFitScore)}%
                                </span>
                                {p.metasCompliance !== null ? (
                                  <span
                                    className={cn(
                                      'font-mono',
                                      metasState === 'cumple' ? 'text-amber-400' : 'text-red-400'
                                    )}
                                    title="Cumplimiento de metas"
                                  >
                                    metas {Math.round(p.metasCompliance)}%
                                  </span>
                                ) : (
                                  <span className="text-slate-600 text-[10px]">sin medición</span>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="border-t border-slate-800/50 p-4 flex-shrink-0">
          <p className="text-[10px] text-slate-500 text-center leading-relaxed max-w-md mx-auto">
            Talento Zombie = dominio &gt;85% del cargo + alta exposición a IA + baja capacidad
            de adaptación. Las metas distinguen los dos sub-patrones del problema.
          </p>
        </div>
      </motion.div>
    </div>
  )

  return createPortal(content, document.body)
}
