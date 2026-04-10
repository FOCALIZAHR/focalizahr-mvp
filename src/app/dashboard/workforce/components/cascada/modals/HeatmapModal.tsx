'use client'

// ════════════════════════════════════════════════════════════════════════════
// HEATMAP MODAL — Detalle visual del Acto 1 (Distribucion)
// fixed inset-0 z-50, backdrop slate-950/90, Tesla line, ESC para cerrar
// Patron clonado de GoalsFindingModal estructura
// src/app/dashboard/workforce/components/cascada/modals/HeatmapModal.tsx
// ════════════════════════════════════════════════════════════════════════════

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { ExposureHeatmap, type HeatmapCell } from '@/components/charts'
import type { WorkforceDiagnosticData } from '../../../types/workforce.types'

interface HeatmapModalProps {
  data: WorkforceDiagnosticData
  onClose: () => void
}

export default function HeatmapModal({ data, onClose }: HeatmapModalProps) {
  // ESC para cerrar
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // Transformar exposure.byCategory → HeatmapCell[]
  const heatmapData: HeatmapCell[] = Object.entries(data.exposure.byCategory)
    .filter(([, val]) => val.headcount > 0)
    .sort(([, a], [, b]) => b.avgExposure - a.avgExposure)
    .map(([name, val]) => {
      const pct = Math.round(val.avgExposure * 100)
      return {
        rowId: name,
        rowLabel: name.charAt(0).toUpperCase() + name.slice(1),
        colId: 'exposure',
        colLabel: 'Exposicion IA',
        value: pct,
        displayValue: `${pct}%`,
        meta: {
          'Headcount': val.headcount,
        },
      }
    })

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
          {/* Tesla line */}
          <div
            className="absolute top-0 left-0 right-0 h-[1px] z-20"
            style={{
              background: 'linear-gradient(90deg, transparent, #22D3EE, transparent)',
              boxShadow: '0 0 15px #22D3EE',
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
              Mapa de exposicion
            </p>
            <h2 className="text-xl font-light text-white">
              Distribucion por gerencia
            </h2>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            <ExposureHeatmap
              data={heatmapData}
              variant="full"
              colorScale="danger"
              showColLabels={false}
            />

            {/* Leyenda */}
            <div className="mt-6 flex items-center justify-center gap-6 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-emerald-500/30 border border-emerald-500/50" />
                <span className="text-slate-400">Baja (0-33%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-amber-500/30 border border-amber-500/50" />
                <span className="text-slate-400">Media (33-66%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-red-500/30 border border-red-500/50" />
                <span className="text-slate-400">Alta (66-100%)</span>
              </div>
            </div>

            {/* Nota */}
            <p className="text-xs text-slate-500 text-center mt-6 max-w-md mx-auto leading-relaxed">
              Porcentaje de tareas del cargo que la IA puede ejecutar o potenciar, segun datos reales de uso (Anthropic Economic Index).
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
