'use client'

// ════════════════════════════════════════════════════════════════════════════
// SCENARIO EXPORT MODAL — V1: snapshot del escenario simulado
// src/app/dashboard/workforce/components/instruments/descriptor-simulator/ScenarioExportModal.tsx
// ════════════════════════════════════════════════════════════════════════════
// V1: solo muestra fotografía del estado actual. NO persiste en BD.
// Portal al document.body. Click outside o botón cierra.
// Lenguaje arbitrador: "Bajo este escenario, el rediseño libera X horas/mes
// y reduce la exposición de Y% a Z%."
// ════════════════════════════════════════════════════════════════════════════

import { memo, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { formatCLP } from '../_shared/format'
import TeslaLine from '../_shared/TeslaLine'
import type { SimulationResult } from './descriptor-simulator-utils'

interface ScenarioExportModalProps {
  isOpen: boolean
  onClose: () => void
  jobTitle: string
  baselineExposurePct: number
  simulation: SimulationResult
}

const ScenarioExportModal = memo(function ScenarioExportModal({
  isOpen,
  onClose,
  jobTitle,
  baselineExposurePct,
  simulation,
}: ScenarioExportModalProps) {
  // Lock scroll cuando está abierto
  useEffect(() => {
    if (!isOpen) return
    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => {
      document.body.style.overflow = original
      window.removeEventListener('keydown', handler)
    }
  }, [isOpen, onClose])

  if (typeof document === 'undefined') return null

  const totalTareas =
    simulation.totalHuman + simulation.totalAugmented + simulation.totalAutomated

  const beforePct = Math.round(baselineExposurePct)
  const afterPct = Math.round(simulation.nuevaExposicionPct)

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            onClick={e => e.stopPropagation()}
            className="fhr-card relative overflow-hidden w-full max-w-md p-0"
          >
            <TeslaLine />

            {/* Header */}
            <div className="px-6 pt-6 pb-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-[9px] uppercase tracking-widest text-slate-500 font-bold">
                  Escenario simulado
                </p>
                <h2 className="text-xl font-extralight text-white mt-1.5 leading-tight">
                  {jobTitle}
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar"
                className="p-1.5 rounded text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Frase arbitradora canónica */}
            <div className="px-6 pb-5">
              <p className="text-sm font-light text-slate-300 leading-relaxed">
                Bajo este escenario, el rediseño libera{' '}
                <span className="text-cyan-400 font-medium tabular-nums">
                  {Math.round(simulation.capacidadLiberada)} horas/mes
                </span>{' '}
                y reduce la exposición de{' '}
                <span className="text-amber-400 font-medium tabular-nums">
                  {beforePct}%
                </span>{' '}
                a{' '}
                <span className="text-cyan-400 font-medium tabular-nums">
                  {afterPct}%
                </span>
                .
              </p>
            </div>

            {/* Stats grid */}
            <div className="border-t border-white/5 px-6 py-5 space-y-3">
              <Row
                label="Capacidad liberada"
                value={`${Math.round(simulation.capacidadLiberada)} h / mes`}
              />
              <Row
                label="Rescate de EBITDA"
                value={`${formatCLP(simulation.rescateMensual)} / mes`}
                accent
              />
              <Row
                label="Tareas automatizadas"
                value={`${simulation.totalAutomated} de ${totalTareas}`}
              />
              <Row
                label="Tareas aumentadas"
                value={`${simulation.totalAugmented} de ${totalTareas}`}
              />
            </div>

            {/* Footer */}
            <div className="border-t border-white/5 px-6 py-4 flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 text-[10px] uppercase tracking-widest font-bold text-slate-400 hover:text-cyan-400 border border-slate-700/50 hover:border-cyan-500/40 rounded transition-all"
              >
                Cerrar
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
})

function Row({
  label,
  value,
  accent = false,
}: {
  label: string
  value: string
  accent?: boolean
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-[10px] uppercase tracking-wider text-slate-500 font-light">
        {label}
      </span>
      <span
        className={
          accent
            ? 'text-sm font-mono font-light text-cyan-300 tabular-nums'
            : 'text-sm font-mono font-light text-slate-200 tabular-nums'
        }
      >
        {value}
      </span>
    </div>
  )
}

export default ScenarioExportModal
