// src/components/goals/cycles/ActivateCycleModal.tsx
// ════════════════════════════════════════════════════════════════════════════
// Modal de CONFIRMACIÓN de activación de ciclo — Gate D.4.
//
// Fricción PROPORCIONAL (opuesto a D.3 crear): activar es irreversible y pasa
// por el candado singleton (SPEC §3.1) — 1 ACTIVE/CLOSING por cuenta. Paso de
// revisión explícito + confirmación + botón anti-doble-submit.
//
// Consume POST /api/goals/cycles/[id]/activate (Gate C). El candado vive en
// GoalCycleService.activate; el 409 GOAL_CYCLE_ALREADY_ACTIVE llega si la cuenta
// ya tiene otro ciclo vigente. Chrome .fhr-* simétrico a EditCycleWindowsModal.
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Power, X } from 'lucide-react'
import { GhostButton, PrimaryButton } from '@/components/ui/PremiumButton'
import { useToast } from '@/components/ui/toast-system'

export interface ActivatableCycle {
  id: string
  name: string
}

interface ActivateCycleModalProps {
  cycle: ActivatableCycle | null // null = cerrado
  onClose: () => void
  onActivated: () => void // la página pasa () => mutate()
}

export default function ActivateCycleModal({
  cycle,
  onClose,
  onActivated,
}: ActivateCycleModalProps) {
  const { success, error } = useToast()
  const [submitting, setSubmitting] = useState(false)

  function handleClose() {
    if (submitting) return
    onClose()
  }

  async function handleActivate() {
    if (!cycle || submitting) return
    setSubmitting(true)
    try {
      const token =
        typeof window !== 'undefined'
          ? localStorage.getItem('focalizahr_token')
          : null

      const res = await fetch(`/api/goals/cycles/${cycle.id}/activate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
      })

      const body = await res.json().catch(() => null)

      if (res.ok) {
        success(
          'El ciclo quedó activo. Las metas nuevas se anclarán a este período.',
          'Ciclo activado'
        )
        onActivated()
        onClose()
        return
      }

      if (body?.code === 'GOAL_CYCLE_ALREADY_ACTIVE') {
        error(
          'Ya hay un ciclo activo. Cerralo antes de activar otro.',
          'Ciclo activo existente'
        )
      } else {
        error(body?.error ?? 'No pudimos activar el ciclo. Intentá de nuevo.', 'Error')
      }
    } catch {
      error('No pudimos conectar con el servidor. Intentá de nuevo.', 'Error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AnimatePresence>
      {cycle && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Panel */}
          <motion.div
            className="fhr-card-static relative overflow-hidden w-full max-w-lg max-h-[90vh] overflow-y-auto p-0"
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 220, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Línea Tesla */}
            <div
              className="absolute top-0 left-0 right-0 h-[2px] z-10"
              style={{
                background:
                  'linear-gradient(90deg, transparent, #22D3EE, #A78BFA, transparent)',
                opacity: 0.7,
              }}
            />

            <div className="p-6 md:p-8">
              {/* Header */}
              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-2xl font-extralight text-white tracking-tight leading-tight">
                    Activar{' '}
                    <span className="fhr-title-gradient">ciclo</span>
                  </h2>
                  <p className="text-sm font-light text-slate-400 mt-1">
                    Ciclo: <span className="text-slate-300">{cycle.name}</span>
                  </p>
                </div>
                <button
                  onClick={handleClose}
                  disabled={submitting}
                  className="text-slate-400 hover:text-white transition-colors disabled:opacity-40 shrink-0"
                  aria-label="Cerrar"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Paso de revisión — la fricción proporcional */}
              <div className="rounded-lg border border-slate-700/50 bg-slate-800/30 p-4">
                <p className="text-base font-light text-slate-300 leading-relaxed">
                  Vas a activar{' '}
                  <span className="text-white">{cycle.name}</span>. Será el{' '}
                  <span className="text-white">único ciclo activo</span> hasta su
                  cierre, y las metas nuevas quedarán ancladas a este período.
                </p>
              </div>

              {/* Footer */}
              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 mt-8">
                <GhostButton onClick={handleClose} disabled={submitting} fullWidth>
                  Cancelar
                </GhostButton>
                <PrimaryButton
                  onClick={handleActivate}
                  isLoading={submitting}
                  disabled={submitting}
                  icon={Power}
                  fullWidth
                >
                  Activar ciclo
                </PrimaryButton>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
