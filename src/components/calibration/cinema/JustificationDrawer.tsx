// ════════════════════════════════════════════════════════════════════════════
// JUSTIFICATION DRAWER - Drawer lateral para justificar movimiento
// src/components/calibration/cinema/JustificationDrawer.tsx
// ════════════════════════════════════════════════════════════════════════════
// Portado de maqueta CinemaNineBox.tsx
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { memo, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { X, Lock, ArrowRight, AlertTriangle } from 'lucide-react'
import type { CinemaEmployee } from '../hooks/useCalibrationRoom'

// Status colors
const STATUS_COLORS: Record<string, { border: string; text: string; bg: string }> = {
  STARS: { border: 'border-purple-500/20', text: 'text-purple-400', bg: 'bg-purple-500/10' },
  HIGH: { border: 'border-cyan-500/20', text: 'text-cyan-400', bg: 'bg-cyan-500/10' },
  CORE: { border: 'border-emerald-500/20', text: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  RISK: { border: 'border-rose-500/20', text: 'text-rose-400', bg: 'bg-rose-500/10' },
  NEUTRAL: { border: 'border-slate-700', text: 'text-slate-400', bg: 'bg-slate-500/10' },
}

// Quadrant ID → display label
const QUADRANT_LABELS: Record<string, string> = {
  q1: 'Riesgo',
  q2: 'Efectivo',
  q3: 'Experto',
  q4: 'Inconsistente',
  q5: 'Core',
  q6: 'Alto Desempeño',
  q7: 'Diamante en Bruto',
  q8: 'Alto Potencial',
  q9: 'Estrellas',
}

interface JustificationDrawerProps {
  employee: CinemaEmployee | null
  targetQuadrant?: string
  isOpen: boolean
  onClose: () => void
  onConfirm: (justification: string) => void
}

export default memo(function JustificationDrawer({
  employee,
  targetQuadrant,
  isOpen,
  onClose,
  onConfirm
}: JustificationDrawerProps) {
  const [justification, setJustification] = useState('')
  const [error, setError] = useState('')

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setJustification('')
      setError('')
    }
  }, [isOpen])

  if (!employee) return null

  const style = STATUS_COLORS[employee.status] || STATUS_COLORS.NEUTRAL
  const isDowngrade = targetQuadrant
    ? parseInt(targetQuadrant.replace('q', '')) < parseInt(employee.quadrant.replace('q', ''))
    : false

  function handleConfirm() {
    if (justification.trim().length < 10) {
      setError('La justificación debe tener al menos 10 caracteres')
      return
    }
    setError('')
    onConfirm(justification.trim())
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-[2px] z-30"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-[400px] max-w-[90vw] bg-[#0B1120] border-l border-slate-800 z-40 shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800 bg-[#111827]">
              <div className="flex items-center gap-2">
                <Lock size={14} className="text-cyan-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-widest">
                  Justificación
                </h3>
              </div>
              <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* Employee Info */}
            <div className="p-6 bg-[#0f1523] border-b border-slate-800">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-full bg-[#111827] border border-slate-700 flex items-center justify-center text-lg font-bold text-white">
                  {employee.avatar}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">{employee.name}</h2>
                  <p className="text-xs text-slate-400">{employee.role}</p>
                  <div className={cn(
                    'mt-2 inline-flex px-2 py-0.5 rounded text-[9px] font-bold uppercase border',
                    style.border, style.text, style.bg
                  )}>
                    {QUADRANT_LABELS[employee.quadrant] || employee.quadrant}
                  </div>
                </div>
              </div>

              {/* Movement indicator */}
              {targetQuadrant && targetQuadrant !== employee.quadrant && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-[#111827] border border-slate-800">
                  <span className="text-xs text-slate-400">
                    {QUADRANT_LABELS[employee.quadrant]}
                  </span>
                  <ArrowRight size={14} className="text-cyan-400" />
                  <span className="text-xs text-white font-bold">
                    {QUADRANT_LABELS[targetQuadrant]}
                  </span>
                </div>
              )}

              {/* Scores */}
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="bg-[#111827] p-3 rounded border border-slate-800">
                  <span className="text-[9px] text-slate-500 uppercase font-bold">Desempeño</span>
                  <div className="text-lg font-mono font-bold text-white">
                    {employee.effectiveScore.toFixed(1)}
                  </div>
                </div>
                <div className="bg-[#111827] p-3 rounded border border-slate-800">
                  <span className="text-[9px] text-slate-500 uppercase font-bold">Potencial</span>
                  <div className="text-lg font-mono font-bold text-cyan-400">
                    {employee.effectivePotentialScore?.toFixed(1) ?? '—'}
                  </div>
                </div>
              </div>
            </div>

            {/* Justification Form */}
            <div className="flex-1 p-6 overflow-y-auto">
              {/* Downgrade warning */}
              {isDowngrade && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 mb-4">
                  <AlertTriangle size={14} className="text-amber-400 mt-0.5 shrink-0" />
                  <p className="text-xs text-amber-300">
                    Este movimiento baja de categoría al colaborador. Se requiere justificación detallada.
                  </p>
                </div>
              )}

              <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">
                Motivo del Movimiento
              </label>
              <textarea
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                placeholder="Explique por qué este colaborador pertenece a este cuadrante..."
                className="w-full h-32 bg-[#111827] border border-slate-700 rounded-lg p-3 text-sm text-slate-300 placeholder-slate-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none resize-none transition-all"
              />
              <p className="text-[10px] text-slate-600 mt-1">
                Mínimo 10 caracteres. {justification.length}/10
              </p>

              {error && (
                <p className="text-xs text-red-400 mt-2">{error}</p>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-slate-800 bg-[#111827] flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold uppercase tracking-wider rounded border border-slate-700 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirm}
                disabled={justification.trim().length < 10}
                className={cn(
                  'flex-1 py-3 text-white text-xs font-bold uppercase tracking-wider rounded shadow-lg transition-all',
                  justification.trim().length >= 10
                    ? 'bg-cyan-600 hover:bg-cyan-500 shadow-cyan-900/20'
                    : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                )}
              >
                Confirmar
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
})
