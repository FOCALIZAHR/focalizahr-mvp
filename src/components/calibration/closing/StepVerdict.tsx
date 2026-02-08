// ════════════════════════════════════════════════════════════════════════════
// STEP 3: EL VEREDICTO (The Verdict)
// src/components/calibration/closing/StepVerdict.tsx
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { memo, useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { ArrowLeft, AlertOctagon, Shield, Loader2 } from 'lucide-react'

interface StepVerdictProps {
  totalAdjustments: number
  sessionId: string
  onConfirm: () => Promise<void>
  onBack: () => void
}

export default memo(function StepVerdict({
  totalAdjustments,
  sessionId,
  onConfirm,
  onBack
}: StepVerdictProps) {

  const [confirmText, setConfirmText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isValid = confirmText.toUpperCase() === 'CONFIRMAR'

  async function handleSubmit() {
    if (!isValid || isSubmitting) return

    setIsSubmitting(true)
    setError(null)

    try {
      await onConfirm()
    } catch (err: any) {
      setError(err?.message || 'Error al cerrar la sesión')
      setIsSubmitting(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8"
    >
      {/* Title */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 mb-4">
          <Shield size={14} className="text-rose-400" />
          <span className="text-xs font-bold text-rose-400 uppercase tracking-wider">
            Paso 3: El Veredicto
          </span>
        </div>
        <h3 className="text-2xl font-bold text-white mb-2">
          Confirmación Final
        </h3>
        <p className="text-sm text-slate-400 max-w-lg mx-auto">
          Estás a punto de aplicar {totalAdjustments} ajuste{totalAdjustments !== 1 ? 's' : ''} de
          calibración de forma permanente.
        </p>
      </div>

      {/* Summary */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 text-center">
        <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">
          Ajustes a Aplicar
        </p>
        <p className="text-5xl font-bold text-white">{totalAdjustments}</p>
        <p className="text-xs text-slate-600 mt-2">
          Sesión {sessionId.slice(0, 8)}...
        </p>
      </div>

      {/* Irreversible Warning */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30">
        <AlertOctagon size={20} className="text-rose-400 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-bold text-rose-300">
            Acción Irreversible
          </p>
          <p className="text-xs text-rose-400/80 mt-1">
            Una vez confirmada, esta acción no se puede deshacer.
            Los scores calibrados reemplazarán los originales de forma permanente
            y se generará un acta de auditoría inmutable.
          </p>
        </div>
      </div>

      {/* Confirm Input */}
      <div className="space-y-3">
        <p className="text-sm text-slate-300 text-center">
          Escribe <span className="font-mono font-bold text-rose-400">CONFIRMAR</span> para proceder
        </p>
        <input
          type="text"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder="Escribe CONFIRMAR"
          disabled={isSubmitting}
          className={cn(
            'w-full px-4 py-3 rounded-xl border text-center text-lg font-mono font-bold',
            'bg-slate-900/50 outline-none transition-all',
            'placeholder:text-slate-700 placeholder:font-normal',
            isValid
              ? 'border-rose-500/50 text-rose-400 focus:border-rose-500'
              : 'border-slate-800 text-slate-300 focus:border-slate-600',
            isSubmitting && 'opacity-50 cursor-not-allowed'
          )}
          autoComplete="off"
          spellCheck={false}
        />
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-center">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4">
        <button
          onClick={onBack}
          disabled={isSubmitting}
          className="flex items-center gap-2 px-5 py-3 text-slate-400 hover:text-white text-sm font-medium transition-all disabled:opacity-50"
        >
          <ArrowLeft size={16} />
          Volver
        </button>
        <button
          onClick={handleSubmit}
          disabled={!isValid || isSubmitting}
          className={cn(
            'flex items-center gap-2 px-8 py-3 text-sm font-bold rounded-xl transition-all',
            isValid && !isSubmitting
              ? 'bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white shadow-lg shadow-rose-500/20'
              : 'bg-slate-800 text-slate-600 cursor-not-allowed'
          )}
        >
          {isSubmitting ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Cerrando Sesión...
            </>
          ) : (
            'Cerrar Sesión Definitivamente'
          )}
        </button>
      </div>
    </motion.div>
  )
})
