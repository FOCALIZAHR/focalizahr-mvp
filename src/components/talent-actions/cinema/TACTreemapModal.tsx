'use client'

// ════════════════════════════════════════════════════════════════════════════
// TAC TREEMAP MODAL — Pilar 2: Mapa de Talento org-wide por cuadrante
// Wrapper modal para TalentTreemap dentro del cinema flow
// ════════════════════════════════════════════════════════════════════════════

import { memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import TalentTreemap from '../TalentTreemap'

interface TACTreemapModalProps {
  isOpen: boolean
  onClose: () => void
  expandedQuadrant?: string
}

export default memo(function TACTreemapModal({
  isOpen,
  onClose,
  expandedQuadrant
}: TACTreemapModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] flex items-center justify-center"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/90 backdrop-blur-md"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 20 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative z-10 w-full max-w-2xl mx-4 bg-[#0F172A] border border-slate-700/50 rounded-2xl shadow-2xl shadow-black/50 max-h-[85vh] overflow-y-auto"
          >
            {/* Tesla line */}
            <div className="fhr-top-line" />

            {/* Content */}
            <div className="px-6 py-6">
              <TalentTreemap initialQuadrant={expandedQuadrant} />
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-800/50">
              <button
                onClick={onClose}
                className="w-full text-center text-sm text-slate-600 hover:text-slate-400 transition-colors min-h-[44px]"
              >
                Cerrar
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
})
