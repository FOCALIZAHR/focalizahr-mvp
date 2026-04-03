'use client'

// ════════════════════════════════════════════════════════════════════════════
// COMPENSACION MODAL — Perspectiva de compensaciones por cuadrante
// src/app/dashboard/executive-hub/components/GoalsCorrelation/CompensacionModal.tsx
// ════════════════════════════════════════════════════════════════════════════
// Patrón: GoalsStarsModal (FocalizaIntelligenceModal header)
// Contenido: La Observación + La Decisión de Valor
// Colores: cyan + purple only
// ════════════════════════════════════════════════════════════════════════════

import { memo, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

import type { CompensacionNarrativeEntry } from '@/config/narratives/CompensacionNarrativeDictionary'

interface CompensacionModalProps {
  entry: CompensacionNarrativeEntry
  findingHeadline: string
  teslaColor: string
  onClose: () => void
}

export default memo(function CompensacionModal({
  entry,
  findingHeadline,
  teslaColor,
  onClose,
}: CompensacionModalProps) {

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const content = (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center"
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/90 backdrop-blur-md"
        />

        {/* Ambient glow */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/3 left-1/3 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/3 right-1/3 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-[120px]" />
        </div>

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 20 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          onClick={(e) => e.stopPropagation()}
          className="relative z-10 w-full max-w-md mx-4 bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl shadow-black/50 max-h-[85vh] overflow-y-auto"
        >
          {/* Tesla line */}
          <div
            className="absolute top-0 left-0 right-0 h-[2px] z-10"
            style={{
              background: `linear-gradient(90deg, transparent, ${teslaColor}, transparent)`,
              boxShadow: `0 0 20px ${teslaColor}`,
            }}
          />

          {/* Header */}
          <div className="text-center pt-8 pb-4 px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
            >
              <h1 className="text-2xl md:text-3xl font-extralight text-white tracking-tight">
                Perspectiva de
              </h1>
              <h1 className="text-2xl md:text-3xl font-extralight tracking-tight bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                Compensaciones
              </h1>
            </motion.div>

            {/* Tesla divider */}
            <motion.div
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ delay: 0.25, duration: 0.5 }}
              className="flex items-center justify-center gap-3 my-5"
            >
              <div className="h-px w-12 bg-white/20" />
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              <div className="h-px w-12 bg-white/20" />
            </motion.div>

            {/* Context: which finding */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-sm text-slate-500 font-light"
            >
              {findingHeadline}
            </motion.p>
          </div>

          {/* Divider */}
          <div className="mx-6 h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" />

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.4 }}
            className="px-6 py-6 space-y-6"
          >
            <div>
              <p className="text-[9px] font-medium text-slate-500 uppercase tracking-widest mb-2">
                La Observación
              </p>
              <p className="text-sm font-light text-slate-400 leading-relaxed">
                {entry.observacion}
              </p>
            </div>

            <div>
              <p className="text-[9px] font-medium text-slate-500 uppercase tracking-widest mb-2">
                La Decisión de Valor
              </p>
              <p className="text-sm font-light text-slate-300 leading-relaxed">
                {entry.decisionValor}
              </p>
            </div>
          </motion.div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-700/50">
            <button
              onClick={onClose}
              className="w-full text-center text-slate-500 hover:text-slate-300 text-sm transition-colors min-h-[44px]"
            >
              Cerrar
            </button>
          </div>

        </motion.div>
      </motion.div>
    </AnimatePresence>
  )

  return createPortal(content, document.body)
})
