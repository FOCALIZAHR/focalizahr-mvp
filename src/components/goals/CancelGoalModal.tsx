// ════════════════════════════════════════════════════════════════════════════
// CANCEL GOAL MODAL - Confirmación para cancelar meta
// src/components/goals/CancelGoalModal.tsx
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { memo, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, AlertTriangle } from 'lucide-react'

interface CancelGoalModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
  goalTitle: string
}

export default memo(function CancelGoalModal({
  isOpen,
  onClose,
  onConfirm,
  goalTitle,
}: CancelGoalModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleConfirm = useCallback(async () => {
    setIsSubmitting(true)
    try {
      await onConfirm()
      onClose()
    } catch (error) {
      console.error('Error cancelando meta:', error)
    } finally {
      setIsSubmitting(false)
    }
  }, [onConfirm, onClose])

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md bg-[#0F172A]/95 backdrop-blur-2xl border border-slate-800 rounded-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Tesla line warning (amber) */}
          <div
            className="absolute top-0 left-0 right-0 h-[2px]"
            style={{
              background: 'linear-gradient(90deg, transparent, #F59E0B, #EF4444, transparent)',
              boxShadow: '0 0 15px #F59E0B'
            }}
          />

          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Cancelar Meta</h3>
                <p className="text-xs text-slate-500">Esta accion no se puede deshacer</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <div className="p-5 space-y-4">
            <p className="text-slate-300">
              Estas seguro de que deseas cancelar esta meta?
            </p>
            <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
              <p className="text-white font-medium text-sm">
                &ldquo;{goalTitle}&rdquo;
              </p>
            </div>
            <p className="text-sm text-slate-400">
              La meta quedara marcada como <span className="text-amber-400 font-medium">CANCELADA</span> y
              no se contara para evaluaciones de desempeno.
            </p>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 p-5 border-t border-slate-800">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
            >
              Volver
            </button>
            <button
              onClick={handleConfirm}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Cancelando...' : 'Si, cancelar meta'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
})
