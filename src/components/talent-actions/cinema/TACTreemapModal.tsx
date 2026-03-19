'use client'

// ════════════════════════════════════════════════════════════════════════════
// TAC TREEMAP MODAL — Pilar 2: Mapa de Talento org-wide por cuadrante
// Flujo: Cover narrativa → TalentTreemap (si viene con quadrant, salta cover)
// ════════════════════════════════════════════════════════════════════════════

import { memo, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import TalentTreemap from '../TalentTreemap'
import TACOrgCover from './TACOrgCover'

interface TACTreemapModalProps {
  isOpen: boolean
  onClose: () => void
  expandedQuadrant?: string
  // Stats org-wide para la cover
  fugaCount?: number
  burnoutCount?: number
  bajoRendimientoCount?: number
}

export default memo(function TACTreemapModal({
  isOpen,
  onClose,
  expandedQuadrant,
  fugaCount = 0,
  burnoutCount = 0,
  bajoRendimientoCount = 0
}: TACTreemapModalProps) {
  // Si viene con quadrant específico (desde Rail), saltar cover
  const [showTreemap, setShowTreemap] = useState(!!expandedQuadrant)

  // Reset al cerrar
  useEffect(() => {
    if (!isOpen) {
      setShowTreemap(!!expandedQuadrant)
    }
  }, [isOpen, expandedQuadrant])

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

          {/* Modal — clon del wrapper de TACGerenciaCover en el stage */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 30 }}
            transition={{ type: 'spring', stiffness: 220, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className={`relative z-10 w-full max-w-3xl mx-4 bg-slate-950 border border-slate-800/50 rounded-[24px] shadow-2xl overflow-hidden ${
              showTreemap ? 'max-h-[85vh] overflow-y-auto' : 'h-[70vh] flex flex-col'
            }`}
          >
            {/* Esferas difusas — patrón onboarding/inicio */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[24px]">
              <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-cyan-500/5 rounded-full blur-[100px]" />
              <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[100px]" />
            </div>

            {/* Tesla line */}
            <div
              className="absolute top-0 left-0 right-0 h-[1px] z-20"
              style={{
                background: 'linear-gradient(90deg, transparent, #22D3EE, transparent)',
                boxShadow: '0 0 15px #22D3EE'
              }}
            />

            <AnimatePresence mode="wait">
              {!showTreemap ? (
                /* Cover narrativa — clon exacto del wrapper de TACGerenciaCover en el stage */
                <motion.div
                  key="cover"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, x: -40 }}
                  transition={{ duration: 0.3 }}
                  className="flex-1 flex flex-col"
                >
                  <TACOrgCover
                    fugaCount={fugaCount}
                    burnoutCount={burnoutCount}
                    bajoRendimientoCount={bajoRendimientoCount}
                    onEnter={() => setShowTreemap(true)}
                  />
                </motion.div>
              ) : (
                /* Treemap */
                <motion.div
                  key="treemap"
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="px-6 py-6 relative z-10">
                    <TalentTreemap initialQuadrant={expandedQuadrant} />
                  </div>

                  {/* Footer solo en treemap */}
                  <div className="px-6 py-4 border-t border-slate-800/50">
                    <button
                      onClick={onClose}
                      className="w-full text-center text-sm text-slate-600 hover:text-slate-400 transition-colors min-h-[44px]"
                    >
                      Cerrar
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
})
