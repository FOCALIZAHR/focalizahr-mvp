// src/components/goals/cycles/EditCycleWindowsModal.tsx
// ════════════════════════════════════════════════════════════════════════════
// Modal de EDICIÓN de ventanas del ciclo — Gate D.8 (ampliación Decisión #7).
//
// Edita las 3 ventanas (asignación / seguimiento / cierre) de un ciclo que NO
// esté CLOSED. name/periodType/year quedan fijos (fuera de alcance). Consume
// PATCH /api/goals/cycles/[id] (extendido en D.8). El server
// (validateWindowOrder) es la autoridad: cota de año + orden. Reusa
// CycleWindowsFields/validateCycleWindows (fuente única con CreateCycleModal).
// Chrome .fhr-* simétrico a CreateCycleModal (consistencia, Mandamiento 7).
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { GhostButton, PrimaryButton } from '@/components/ui/PremiumButton'
import { useToast } from '@/components/ui/toast-system'
import CycleWindowsFields from './CycleWindowsFields'
import { validateCycleWindows, type CycleWindowValues } from './cycleWindows'

// Ciclo editable: solo lo que el modal necesita (ventanas en ISO datetime).
export interface EditableCycle {
  id: string
  name: string
  year: number
  assignmentWindow: string
  trackingWindow: string
  closureWindow: string
}

interface EditCycleWindowsModalProps {
  cycle: EditableCycle | null // null = cerrado
  onClose: () => void
  onUpdated: () => void // la página pasa () => mutate()
}

const currentYear = new Date().getFullYear()

// ISO datetime ('2026-01-16T00:00:00.000Z') → 'yyyy-mm-dd' para el date picker.
function toDateInput(iso: string): string {
  return iso.slice(0, 10)
}

export default function EditCycleWindowsModal({
  cycle,
  onClose,
  onUpdated,
}: EditCycleWindowsModalProps) {
  const { success, error } = useToast()

  const [assignmentWindow, setAssignmentWindow] = useState('')
  const [trackingWindow, setTrackingWindow] = useState('')
  const [closureWindow, setClosureWindow] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Pre-cargar las ventanas actuales cada vez que se abre sobre un ciclo.
  useEffect(() => {
    if (cycle) {
      setAssignmentWindow(toDateInput(cycle.assignmentWindow))
      setTrackingWindow(toDateInput(cycle.trackingWindow))
      setClosureWindow(toDateInput(cycle.closureWindow))
    }
  }, [cycle])

  // year FIJO del ciclo (no editable) — ancla la cota de año.
  const year = cycle?.year ?? currentYear
  const windowsV = validateCycleWindows(year, {
    assignmentWindow,
    trackingWindow,
    closureWindow,
  })
  const isValid = windowsV.isValid

  function handleClose() {
    if (submitting) return
    onClose()
  }

  function handleWindowChange(field: keyof CycleWindowValues, value: string) {
    if (field === 'assignmentWindow') setAssignmentWindow(value)
    else if (field === 'trackingWindow') setTrackingWindow(value)
    else setClosureWindow(value)
  }

  async function handleSubmit() {
    if (!cycle || !isValid || submitting) return
    setSubmitting(true)
    try {
      const token =
        typeof window !== 'undefined'
          ? localStorage.getItem('focalizahr_token')
          : null

      const res = await fetch(`/api/goals/cycles/${cycle.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({
          assignmentWindow: new Date(assignmentWindow).toISOString(),
          trackingWindow: new Date(trackingWindow).toISOString(),
          closureWindow: new Date(closureWindow).toISOString(),
        }),
      })

      const body = await res.json().catch(() => null)

      if (res.ok) {
        success('Las ventanas del ciclo quedaron actualizadas.', 'Fechas actualizadas')
        onUpdated()
        onClose()
        return
      }

      if (body?.code === 'GOAL_CYCLE_CLOSED') {
        error('El ciclo está cerrado y no admite cambios de fechas.', 'Ciclo cerrado')
      } else {
        error(body?.error ?? 'No pudimos actualizar las fechas. Intentá de nuevo.', 'Error')
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
                    Editar{' '}
                    <span className="fhr-title-gradient">fechas</span>
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

              {/* Ventanas del ciclo (componente compartido con creación D.3) */}
              <CycleWindowsFields
                year={year}
                values={{ assignmentWindow, trackingWindow, closureWindow }}
                onChange={handleWindowChange}
              />

              {/* Footer */}
              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 mt-8">
                <GhostButton onClick={handleClose} disabled={submitting} fullWidth>
                  Cancelar
                </GhostButton>
                <PrimaryButton
                  onClick={handleSubmit}
                  isLoading={submitting}
                  disabled={!isValid}
                  fullWidth
                >
                  Guardar cambios
                </PrimaryButton>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
