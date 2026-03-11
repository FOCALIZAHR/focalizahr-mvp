'use client'

// ════════════════════════════════════════════════════════════════════════════
// BENCH HEALTHY WIZARD - Wizard de 2 pasos para CASO A (banca cubierta)
// src/components/succession/BenchHealthyWizard.tsx
// Patron clonado de BackfillWizard.tsx
// ════════════════════════════════════════════════════════════════════════════

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, X, ShieldCheck } from 'lucide-react'
import { PrimaryButton, GhostButton } from '@/components/ui/PremiumButton'
import { useToast } from '@/components/ui/toast-system'
import { formatDisplayName } from '@/lib/utils/formatName'

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

interface BenchHealthyWizardProps {
  candidateName: string
  vacatedPositionTitle: string
  benchCandidates: Array<{
    name: string
    position: string
    readinessLevel: string
    matchPercent: number
  }>
  posicionDejaId: string | null
  onConfirm: (resolution: 'COVERED' | 'PENDING') => void
  onNavigate: (url: string) => void
  onClose: () => void
}

const READINESS_CONFIG: Record<string, { label: string; color: string; dotColor: string }> = {
  READY_NOW:       { label: 'Listo ahora',   color: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',    dotColor: 'bg-cyan-400' },
  READY_1_2_YEARS: { label: '1-2 años',      color: 'bg-purple-500/15 text-purple-300 border-purple-500/30', dotColor: 'bg-purple-400' },
  READY_3_PLUS:    { label: '3+ años',        color: 'bg-purple-500/15 text-purple-300 border-purple-500/30', dotColor: 'bg-purple-400' },
  NOT_VIABLE:      { label: 'En desarrollo',  color: 'bg-purple-500/15 text-purple-300 border-purple-500/30', dotColor: 'bg-purple-400' },
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ════════════════════════════════════════════════════════════════════════════

export default function BenchHealthyWizard({
  candidateName,
  vacatedPositionTitle,
  benchCandidates,
  posicionDejaId,
  onConfirm,
  onNavigate,
  onClose,
}: BenchHealthyWizardProps) {
  const toast = useToast()
  const [step, setStep] = useState<1 | 2>(1)
  const [isSubmitting, setIsSubmitting] = useState(false)

  function handleCovered() {
    setIsSubmitting(true)
    onConfirm('COVERED')
    toast.success(
      `"${vacatedPositionTitle}" tiene sucesor designado. Plan de continuidad activo.`,
      '¡Cobertura confirmada!'
    )
  }

  function handleEditBench() {
    onConfirm('PENDING')
    toast.info(
      `Redirigiendo al plan de sucesores para "${vacatedPositionTitle}".`,
      'Editando sucesores'
    )
    if (posicionDejaId) {
      onNavigate(`/dashboard/succession?position=${posicionDejaId}`)
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 flex items-center justify-center z-[100] bg-black/60 backdrop-blur-sm"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.25 }}
          className="w-full max-w-xl max-h-[85vh] overflow-y-auto rounded-[24px] bg-[#0F172A]/95 backdrop-blur-2xl border border-slate-800 shadow-2xl relative"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Tesla line — cyan */}
          <div
            className="absolute top-0 left-0 right-0 h-[2px] rounded-t-[24px]"
            style={{
              background: 'linear-gradient(90deg, transparent, #22D3EE, transparent)',
              boxShadow: '0 0 15px #22D3EE',
            }}
          />

          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 transition-colors z-10"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col min-h-[400px]">
            <AnimatePresence mode="wait">
              {step === 1 ? (
                /* ═══════════════════════════════════════════════════════
                   PASO 1 — Portada: la organización está protegida
                   ═══════════════════════════════════════════════════════ */
                <motion.div
                  key="step1"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, x: -40 }}
                  transition={{ duration: 0.3 }}
                  className="flex-1 flex flex-col items-center justify-center text-center px-8 py-12"
                >
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <ShieldCheck className="w-10 h-10 text-cyan-400 mx-auto mb-6" />
                  </motion.div>

                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="text-3xl font-light text-white leading-relaxed max-w-md mb-3"
                  >
                    La organización está protegida.
                  </motion.p>

                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="text-base text-slate-400 font-light max-w-md mb-10"
                  >
                    Al nominar a {formatDisplayName(candidateName, 'short')}, detectamos que{' '}
                    <span className="text-cyan-400 font-medium">{vacatedPositionTitle}</span>{' '}
                    ya tiene sucesores preparados.
                  </motion.p>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                    className="flex flex-col items-center gap-3"
                  >
                    <motion.button
                      onClick={() => setStep(2)}
                      className="flex items-center gap-3 px-8 py-3 rounded-xl font-medium text-base transition-all shadow-lg"
                      style={{
                        background: 'linear-gradient(135deg, #22D3EE, #22D3EEDD)',
                        color: '#0F172A',
                        boxShadow: '0 8px 24px -6px rgba(34,211,238,0.4)',
                      }}
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <span>Ver los sucesores</span>
                      <ArrowRight className="w-4 h-4" />
                    </motion.button>

                    <button
                      onClick={handleCovered}
                      className="text-sm text-slate-500 hover:text-slate-300 transition-colors py-2"
                    >
                      Confirmar y cerrar
                    </button>
                  </motion.div>
                </motion.div>
              ) : (
                /* ═══════════════════════════════════════════════════════
                   PASO 2 — La banca
                   ═══════════════════════════════════════════════════════ */
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="p-6 space-y-5 min-h-[400px] flex flex-col"
                >
                  <p className="text-3xl font-light text-white leading-relaxed">
                    Sucesores listos para{' '}
                    <span className="text-cyan-400 font-medium">{vacatedPositionTitle}</span>
                  </p>

                  <div className="space-y-2 flex-1">
                    {benchCandidates.map((c, i) => {
                      const readiness = READINESS_CONFIG[c.readinessLevel] ?? READINESS_CONFIG.NOT_VIABLE
                      return (
                        <div
                          key={i}
                          className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/40 border border-slate-700/30"
                        >
                          <div className="w-8 h-8 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-bold text-cyan-400">
                              {(c.name || '').split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-white truncate">{formatDisplayName(c.name, 'short')}</p>
                            <p className="text-[10px] text-slate-500 truncate">
                              {c.position || 'Sin cargo'}
                            </p>
                          </div>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full flex-shrink-0 border flex items-center gap-1 ${readiness.color}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${readiness.dotColor}`} />
                            {readiness.label}
                          </span>
                        </div>
                      )
                    })}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/50 mt-auto">
                    <GhostButton size="sm" onClick={handleEditBench} disabled={isSubmitting} title="En deportes, la 'banca' son los jugadores listos para entrar al campo. Tu banca de sucesores funciona igual.">
                      Gestionar sucesores
                    </GhostButton>
                    <PrimaryButton size="sm" onClick={handleCovered} disabled={isSubmitting}>
                      {isSubmitting ? 'Procesando...' : 'Confirmar sucesores'}
                    </PrimaryButton>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
