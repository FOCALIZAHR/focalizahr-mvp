// src/components/goals/cycles/CloseCycleModal.tsx
// ════════════════════════════════════════════════════════════════════════════
// Modal de CIERRE de ciclo — Gate D.5-UI, wizard de 3 actos
// (Briefing → Decisiones → Veredicto). Patrón calcado de ClosingCeremonyModal
// (calibration): header + "Paso X de 3" + progress bar + AnimatePresence.
// Chrome .fhr-* de los modales hermanos (Create/Edit/Activate).
//
// ⚙️ SP1 (este commit): esqueleto + máquina de estados + Acto 1 (Briefing) +
//   caso vacío / borde 0-accionables (finalize puro). Acto 2 es un STUB y Acto 3
//   no existe todavía — llegan en SP2/SP3.
//
// Máquina de estados:
//   fila ACTIVE  → "Cerrar ciclo"    → Acto 1 (sin mutar) → "Comenzar cierre"
//                  → POST /close (ACTIVE→CLOSING) → Acto 2
//   fila CLOSING → "Continuar cierre" → Acto 2 directo (resumible; re-fetch)
//   caso vacío / 0 accionables → "Cerrar en firme" → /finalize sin decisiones
//     (backend: decisions omitido === [] → finalizeCycle puro).
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock, X } from 'lucide-react'
import { GhostButton, PrimaryButton } from '@/components/ui/PremiumButton'
import { useToast } from '@/components/ui/toast-system'
import { useCycleClosure } from './useCycleClosure'
import CloseActDecisions from './CloseActDecisions'
import {
  buildDecisionsPayload,
  DEFAULT_DECISION,
  type CycleClosureDecisionType,
} from './cycleClosure'

// Ciclo objetivo del cierre (subset de GoalCycleRow).
export interface CloseTargetCycle {
  id: string
  name: string
  status: string // 'ACTIVE' | 'CLOSING' (los demás no llegan acá)
}

type CloseAct = 'briefing' | 'decisiones' | 'veredicto'
const ACT_INDEX: Record<CloseAct, number> = { briefing: 1, decisiones: 2, veredicto: 3 }

interface CloseCycleModalProps {
  cycle: CloseTargetCycle | null // null = cerrado
  onClose: () => void
  onClosed: () => void // la página pasa () => mutate()
}

export default function CloseCycleModal({ cycle, onClose, onClosed }: CloseCycleModalProps) {
  const { success, error } = useToast()
  const [act, setAct] = useState<CloseAct>('briefing')
  const [submitting, setSubmitting] = useState(false)
  const { actionable, inReview, loading, error: loadError, refetch } = useCycleClosure(
    cycle?.id ?? null
  )

  // Resumible: un ciclo que ya está en CLOSING entra directo a Decisiones.
  useEffect(() => {
    if (cycle) setAct(cycle.status === 'CLOSING' ? 'decisiones' : 'briefing')
  }, [cycle])

  // Decisiones por meta (Acto 2). Se inicializan en LEAVE_AS_IS para TODAS las
  // accionables (soberanía). Se re-siembra al re-fetch (defaults frescos en resume).
  const [decisions, setDecisions] = useState<Map<string, CycleClosureDecisionType>>(
    new Map()
  )
  useEffect(() => {
    // Merge-preservador: conserva la decisión de las metas que siguen accionables
    // tras un re-fetch (caso carrera de SP3); las nuevas caen a LEAVE_AS_IS. En la
    // primera carga prev está vacío → todas default.
    setDecisions((prev) => new Map(actionable.map((g) => [g.id, prev.get(g.id) ?? DEFAULT_DECISION])))
  }, [actionable])

  function setDecision(goalId: string, decision: CycleClosureDecisionType) {
    setDecisions((prev) => {
      const next = new Map(prev)
      next.set(goalId, decision)
      return next
    })
  }
  function applyToAll(decision: CycleClosureDecisionType) {
    setDecisions(new Map(actionable.map((g) => [g.id, decision])))
  }

  const n = actionable.length
  const m = inReview.length

  function handleClose() {
    if (submitting) return
    onClose()
  }

  async function apiPost(suffix: string, payload?: unknown) {
    const token =
      typeof window !== 'undefined' ? localStorage.getItem('focalizahr_token') : null
    const res = await fetch(`/api/goals/cycles/${cycle!.id}${suffix}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      credentials: 'include',
      body: JSON.stringify(payload ?? {}),
    })
    const body = await res.json().catch(() => null)
    return { res, body }
  }

  // ACTIVE → CLOSING (acción explícita del estratega), avanza a Decisiones.
  async function handleStartClose() {
    if (!cycle || submitting) return
    setSubmitting(true)
    try {
      const { res, body } = await apiPost('/close')
      if (res.ok) {
        setAct('decisiones')
        await refetch()
      } else {
        error(body?.error ?? 'No pudimos iniciar el cierre.', 'Error')
      }
    } catch {
      error('No pudimos conectar con el servidor. Intentá de nuevo.', 'Error')
    } finally {
      setSubmitting(false)
    }
  }

  // finalize puro (ya en CLOSING): CLOSING → CLOSED sin decisiones.
  async function handleFinalizePure() {
    if (!cycle || submitting) return
    setSubmitting(true)
    try {
      const { res, body } = await apiPost('/finalize', {})
      if (res.ok) {
        success('El ciclo quedó cerrado.', 'Ciclo cerrado')
        onClosed()
        onClose()
        return
      }
      error(body?.error ?? 'No pudimos cerrar el ciclo.', 'Error')
    } catch {
      error('No pudimos conectar con el servidor. Intentá de nuevo.', 'Error')
    } finally {
      setSubmitting(false)
    }
  }

  // Caso vacío desde ACTIVE (0 accionables): /close y luego /finalize puro.
  async function handleCloseThenFinalize() {
    if (!cycle || submitting) return
    setSubmitting(true)
    try {
      const closed = await apiPost('/close')
      if (!closed.res.ok) {
        error(closed.body?.error ?? 'No pudimos iniciar el cierre.', 'Error')
        return
      }
      const finalized = await apiPost('/finalize', {})
      if (finalized.res.ok) {
        success('El ciclo quedó cerrado.', 'Ciclo cerrado')
        onClosed()
        onClose()
        return
      }
      error(
        finalized.body?.error ??
          'El ciclo quedó en proceso de cierre; reabrí para finalizar.',
        'Error'
      )
    } catch {
      error('No pudimos conectar con el servidor. Intentá de nuevo.', 'Error')
    } finally {
      setSubmitting(false)
    }
  }

  // Acto 3 (SP3): CLOSING → CLOSED aplicando las decisiones del Acto 2.
  async function handleFinalizeWithDecisions() {
    if (!cycle || submitting) return
    setSubmitting(true)
    try {
      const { res, body } = await apiPost('/finalize', {
        decisions: buildDecisionsPayload(decisions),
      })
      if (res.ok) {
        const s = body?.summary
        const detail = s
          ? ` ${s.closedWithScore} cerradas con score · ${s.markedReview} a revisión · ${s.leftAsIs} sin cambio.`
          : ''
        success(`El ciclo quedó cerrado.${detail}`, 'Ciclo cerrado')
        onClosed()
        onClose()
        return
      }
      // Carrera: una meta cambió de estado con el modal abierto (todo-o-nada).
      if (body?.code === 'GOAL_CYCLE_VALIDATION') {
        error(
          'Algunas metas cambiaron de estado. Actualizá la lista y volvé a decidir.',
          'La lista cambió'
        )
        await refetch()
        setAct('decisiones')
        return
      }
      error(body?.error ?? 'No pudimos cerrar el ciclo.', 'Error')
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
            className="fhr-card-static relative overflow-hidden w-full max-w-2xl max-h-[90vh] flex flex-col p-0"
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

            {/* Header */}
            <div className="flex items-start justify-between gap-4 px-6 py-5 md:px-8 shrink-0">
              <div>
                <h2 className="text-2xl font-extralight text-white tracking-tight leading-tight">
                  Cerrar{' '}
                  <span className="fhr-title-gradient">ciclo</span>
                </h2>
                <p className="text-sm font-light text-slate-400 mt-1">
                  {cycle.name} · Paso {ACT_INDEX[act]} de 3
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

            {/* Progress bar */}
            <div className="h-1 bg-slate-800/60 shrink-0">
              <motion.div
                className="h-full bg-gradient-to-r from-cyan-400 to-purple-400"
                animate={{ width: `${(ACT_INDEX[act] / 3) * 100}%` }}
                transition={{ duration: 0.4, ease: 'easeInOut' }}
              />
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-6 md:px-8">
              {loading ? (
                <div className="space-y-4">
                  <div className="fhr-skeleton h-6 w-2/3 rounded-lg" />
                  <div className="fhr-skeleton h-24 rounded-lg" />
                </div>
              ) : loadError ? (
                <div className="text-center py-8">
                  <p className="text-slate-300 font-light mb-4">
                    No pudimos cargar las metas del ciclo.
                  </p>
                  <GhostButton onClick={() => refetch()}>Reintentar</GhostButton>
                </div>
              ) : (
                <AnimatePresence mode="wait">
                  {/* ── ACTO 1: BRIEFING (solo desde ACTIVE) ── */}
                  {act === 'briefing' && (
                    <motion.div
                      key="briefing"
                      initial={{ opacity: 0, x: 12 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -12 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="flex items-baseline gap-3">
                        <span className="text-[64px] font-extralight tabular-nums text-white leading-none">
                          {n}
                        </span>
                        <span className="text-base font-light text-slate-400">
                          {n === 1 ? 'meta sin completar' : 'metas sin completar'}
                        </span>
                      </div>
                      {m > 0 && (
                        <p className="text-sm font-light text-slate-500 mt-2">
                          · {m} {m === 1 ? 'meta ya en revisión' : 'metas ya en revisión'}
                        </p>
                      )}

                      <p className="text-base font-light text-slate-400 leading-relaxed mt-6">
                        {n === 0
                          ? 'No hay metas pendientes de decidir. Podés cerrar el ciclo en firme.'
                          : 'Al comenzar el cierre, el ciclo entra en proceso de cierre y vas a decidir qué hacer con cada meta sin completar.'}
                      </p>

                      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 mt-8">
                        <GhostButton onClick={handleClose} disabled={submitting} fullWidth>
                          Cancelar
                        </GhostButton>
                        {n === 0 ? (
                          <PrimaryButton
                            onClick={handleCloseThenFinalize}
                            isLoading={submitting}
                            disabled={submitting}
                            icon={Lock}
                            fullWidth
                          >
                            Cerrar en firme
                          </PrimaryButton>
                        ) : (
                          <PrimaryButton
                            onClick={handleStartClose}
                            isLoading={submitting}
                            disabled={submitting}
                            fullWidth
                          >
                            Comenzar cierre
                          </PrimaryButton>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {/* ── ACTO 2: DECISIONES ── */}
                  {act === 'decisiones' && (
                    <motion.div
                      key="decisiones"
                      initial={{ opacity: 0, x: 12 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -12 }}
                      transition={{ duration: 0.2 }}
                    >
                      {n === 0 ? (
                        <>
                          <p className="text-base font-light text-slate-400 leading-relaxed">
                            Nada por decidir: no quedan metas accionables en este ciclo.
                            Podés cerrarlo en firme.
                          </p>
                          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 mt-8">
                            <GhostButton onClick={handleClose} disabled={submitting} fullWidth>
                              Cerrar más tarde
                            </GhostButton>
                            <PrimaryButton
                              onClick={handleFinalizePure}
                              isLoading={submitting}
                              disabled={submitting}
                              icon={Lock}
                              fullWidth
                            >
                              Cerrar en firme
                            </PrimaryButton>
                          </div>
                        </>
                      ) : (
                        <CloseActDecisions
                          actionable={actionable}
                          inReview={inReview}
                          decisions={decisions}
                          onSetDecision={setDecision}
                          onApplyToAll={applyToAll}
                          onContinue={() => setAct('veredicto')}
                          onCancel={handleClose}
                        />
                      )}
                    </motion.div>
                  )}

                  {/* ── ACTO 3: VEREDICTO ── */}
                  {act === 'veredicto' && (
                    <motion.div
                      key="veredicto"
                      initial={{ opacity: 0, x: 12 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -12 }}
                      transition={{ duration: 0.2 }}
                    >
                      {(() => {
                        const payload = buildDecisionsPayload(decisions)
                        const c = payload.filter((d) => d.decision === 'CLOSE_WITH_SCORE').length
                        const r = payload.filter((d) => d.decision === 'MARK_REVIEW').length
                        const l = payload.filter((d) => d.decision === 'LEAVE_AS_IS').length
                        return (
                          <div className="space-y-3">
                            <p className="text-base font-light text-slate-300 leading-relaxed">
                              Resumen de decisiones ({payload.length} metas):
                            </p>
                            <ul className="text-sm font-light text-slate-400 space-y-1">
                              <li>
                                <span className="text-white tabular-nums">{c}</span> a cerrar
                                con score actual
                              </li>
                              <li>
                                <span className="text-white tabular-nums">{r}</span> a enviar a
                                revisión
                              </li>
                              <li>
                                <span className="text-white tabular-nums">{l}</span> a dejar
                                como están
                              </li>
                            </ul>
                            <p className="text-sm font-light text-slate-500 leading-relaxed">
                              Al confirmar, el ciclo se cierra en firme y estas decisiones se
                              aplican. No se puede deshacer.
                            </p>
                          </div>
                        )
                      })()}

                      <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-3 mt-8">
                        <GhostButton
                          onClick={() => setAct('decisiones')}
                          disabled={submitting}
                          fullWidth
                        >
                          Volver
                        </GhostButton>
                        <PrimaryButton
                          onClick={handleFinalizeWithDecisions}
                          isLoading={submitting}
                          disabled={submitting}
                          icon={Lock}
                          fullWidth
                        >
                          Cerrar ciclo en firme
                        </PrimaryButton>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
