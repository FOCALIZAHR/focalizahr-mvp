'use client'

// ════════════════════════════════════════════════════════════════════════════
// RETENTION BY SEGMENT MODAL — Detalle del Acto 5 Riesgo (v3.1)
//
// Acordeon expandible: cada segmento → lista de personas con tier
// SIN etiqueta "despedir" — solo MOSTRAR la clasificacion
// Portal a document.body, z-[9999], Tesla line purple
// src/app/dashboard/workforce/components/cascada/modals/RetentionBySegmentModal.tsx
// ════════════════════════════════════════════════════════════════════════════

import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { X, ChevronDown, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { groupBySegment } from '@/lib/workforce/segmentUtils'
import type { WorkforceDiagnosticData, RetentionEntry } from '../../../types/workforce.types'

interface RetentionBySegmentModalProps {
  data: WorkforceDiagnosticData
  onClose: () => void
}

const TIER_COLOR: Record<RetentionEntry['tier'], string> = {
  intocable: 'text-violet-400',
  valioso: 'text-cyan-400',
  neutro: 'text-slate-400',
  prescindible: 'text-slate-500',
}

const TIER_LABEL: Record<RetentionEntry['tier'], string> = {
  intocable: 'Intocable',
  valioso: 'Valioso',
  neutro: 'Neutro',
  prescindible: 'En evaluación',
}

export default function RetentionBySegmentModal({ data, onClose }: RetentionBySegmentModalProps) {
  const [expandedKey, setExpandedKey] = useState<string | null>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const segments = useMemo(() => {
    const classified = data.retentionPriority.ranking.filter(
      r => r.acotadoGroup && r.standardCategory
    )
    const grouped = groupBySegment(classified)
    return Array.from(grouped.entries())
      .map(([key, members]) => {
        const intocables = members.filter(m => m.tier === 'intocable').length
        const enEvaluacion = members.length - intocables
        return { key, members, intocables, enEvaluacion }
      })
      .sort((a, b) => b.members.length - a.members.length)
  }, [data.retentionPriority.ranking])

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
            Horizonte por segmento
          </p>
          <h2 className="text-xl font-light text-white">
            {data.retentionPriority.intocablesCount} intocables ·{' '}
            {data.retentionPriority.ranking.length - data.retentionPriority.intocablesCount} en evaluación
          </h2>
          <p className="text-xs text-slate-400 font-light mt-2">
            Click en un segmento para ver las personas. La clasificación combina cumplimiento
            de metas, dominio del cargo y capacidad de adaptación.
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
                          <ChevronDown className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                        )}
                        <span className="text-sm font-light text-cyan-400 truncate">
                          {seg.key}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs flex-shrink-0">
                        {seg.intocables > 0 && (
                          <span className="text-violet-400 font-mono" title="Intocables">
                            ●{seg.intocables}
                          </span>
                        )}
                        {seg.enEvaluacion > 0 && (
                          <span className="text-slate-400 font-mono" title="En evaluación">
                            ●{seg.enEvaluacion}
                          </span>
                        )}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="p-3 pt-0 space-y-1 bg-slate-900/40">
                        {seg.members.map(p => (
                          <div
                            key={p.employeeId}
                            className="flex items-center justify-between text-xs py-1.5 border-b border-slate-800/20 last:border-0"
                          >
                            <div className="flex-1 min-w-0">
                              <span className="text-slate-200 font-light">{p.employeeName}</span>
                              <span className="text-slate-500 ml-2">{p.position}</span>
                            </div>
                            <div className="flex items-center gap-3 flex-shrink-0">
                              <span className="text-slate-500 font-mono text-[10px]" title="Exposición IA">
                                exp {Math.round(p.observedExposure * 100)}%
                              </span>
                              <span
                                className={cn('font-mono text-[10px] uppercase tracking-wider', TIER_COLOR[p.tier])}
                              >
                                {TIER_LABEL[p.tier]}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )

  return createPortal(content, document.body)
}
