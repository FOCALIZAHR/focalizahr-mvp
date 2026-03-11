'use client'

// ════════════════════════════════════════════════════════════════════════════
// BENCH EMPTY WIZARD - Wizard de 2 pasos para CASO B (sin sucesores)
// src/components/succession/BenchEmptyWizard.tsx
// Paso 1: Portada amber | Paso 2: Clonado de BackfillWizard Step 2
// ════════════════════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, X, AlertTriangle, Brain, Search, Building2 } from 'lucide-react'
import { PrimaryButton, GhostButton } from '@/components/ui/PremiumButton'
import { useToast } from '@/components/ui/toast-system'
import { formatDisplayName } from '@/lib/utils/formatName'
import EmployeeSearchInput from '@/components/succession/cinema/EmployeeSearchInput'

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

interface BenchEmptyWizardProps {
  candidateId: string
  candidateName: string
  vacatedPositionTitle: string
  posicionDejaId: string | null
  onConfirm: (resolution: string, data?: Record<string, string>) => void
  onNavigate: (url: string) => void
  onClose: () => void
}

interface BackfillSuggestion {
  employeeId: string
  employeeName: string
  position: string | null
  departmentName: string | null
  roleFitScore: number
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ════════════════════════════════════════════════════════════════════════════

export default function BenchEmptyWizard({
  candidateId,
  vacatedPositionTitle,
  posicionDejaId,
  onConfirm,
  onNavigate,
  onClose,
}: BenchEmptyWizardProps) {
  const toast = useToast()
  const [step, setStep] = useState<1 | 2>(1)

  // Step 2 state
  const [suggestions, setSuggestions] = useState<BackfillSuggestion[]>([])
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const [selectedSuggestion, setSelectedSuggestion] = useState<BackfillSuggestion | null>(null)
  const [showAlternatives, setShowAlternatives] = useState(false)
  const [expandedAlt, setExpandedAlt] = useState<'search' | 'external' | null>(null)
  const [manualEmployee, setManualEmployee] = useState<{ id: string; fullName: string; roleFitScore: number; meetsThreshold: boolean } | null>(null)
  const [confirmLowFit, setConfirmLowFit] = useState(false)
  const [externalReason, setExternalReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Lazy load suggestions when entering step 2
  useEffect(() => {
    if (step !== 2) return
    let cancelled = false
    async function load() {
      setLoadingSuggestions(true)
      try {
        const res = await fetch(`/api/succession/candidates/${candidateId}/backfill-suggestions`)
        const data = await res.json()
        if (!cancelled && data.success) setSuggestions(data.data ?? [])
      } catch { /* silent */ }
      if (!cancelled) setLoadingSuggestions(false)
    }
    load()
    return () => { cancelled = true }
  }, [candidateId, step])

  // ── Selection helpers ──
  function selectSuggestion(s: BackfillSuggestion) {
    setSelectedSuggestion(s)
    setExpandedAlt(null)
    setManualEmployee(null)
    setConfirmLowFit(false)
  }

  function expandAlternative(alt: 'search' | 'external') {
    if (expandedAlt === alt) { setExpandedAlt(null); return }
    setExpandedAlt(alt)
    setSelectedSuggestion(null)
    setManualEmployee(null)
    setConfirmLowFit(false)
    setExternalReason('')
  }

  function canConfirm(): boolean {
    if (isSubmitting) return false
    if (selectedSuggestion) return true
    if (manualEmployee) {
      if (!manualEmployee.meetsThreshold && !confirmLowFit) return false
      return true
    }
    if (expandedAlt === 'external') return true
    return false
  }

  // ── Confirm handler ──
  async function handleConfirm() {
    setIsSubmitting(true)
    try {
      if (selectedSuggestion) {
        onConfirm('COVERED', {
          backfillEmployeeId: selectedSuggestion.employeeId,
          backfillEmployeeName: selectedSuggestion.employeeName,
        })
        toast.success(
          `"${formatDisplayName(selectedSuggestion.employeeName, 'short')}" quedará a cargo de la posición.`,
          '¡Continuidad asegurada!'
        )
      } else if (manualEmployee) {
        onConfirm('COVERED', {
          backfillEmployeeId: manualEmployee.id,
          backfillEmployeeName: manualEmployee.fullName,
        })
        toast.success(
          `"${formatDisplayName(manualEmployee.fullName, 'short')}" quedará a cargo de la posición.`,
          '¡Continuidad asegurada!'
        )
      } else if (expandedAlt === 'external') {
        onConfirm('EXTERNAL_SEARCH', {
          externalReason: externalReason.trim() || '',
        })
        toast.success(
          `RRHH tomará el proceso de "${vacatedPositionTitle}".`,
          'Búsqueda externa iniciada'
        )
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleDefer() {
    onConfirm('PENDING')
    toast.warning(
      `Riesgo registrado. Recuerda asignar sucesores para "${vacatedPositionTitle}" en el panel de Gestión de Talento.`,
      'Pendiente de atención'
    )
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
          {/* Tesla line — amber */}
          <div
            className="absolute top-0 left-0 right-0 h-[2px] rounded-t-[24px]"
            style={{
              background: 'linear-gradient(90deg, transparent, #F59E0B, transparent)',
              boxShadow: '0 0 15px #F59E0B',
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
                   PASO 1 — Portada: riesgo operativo detectado
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
                    <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto mb-6" />
                  </motion.div>

                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="text-3xl font-light text-white leading-relaxed max-w-md mb-3"
                  >
                    Riesgo operativo detectado.
                  </motion.p>

                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="text-base text-slate-400 font-light max-w-md mb-10"
                  >
                    <span className="text-amber-400 font-medium">{vacatedPositionTitle}</span>{' '}
                    quedará sin sucesor preparado. Es el momento de planificar.
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
                        background: 'linear-gradient(135deg, #F59E0B, #F59E0BDD)',
                        color: '#0F172A',
                        boxShadow: '0 8px 24px -6px rgba(245,158,11,0.4)',
                      }}
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <span>Buscar sucesor ahora</span>
                      <ArrowRight className="w-4 h-4" />
                    </motion.button>

                    <button
                      onClick={handleDefer}
                      className="text-sm text-slate-500 hover:text-slate-300 transition-colors py-2"
                      title="En deportes, la 'banca' son los jugadores listos para entrar. Tu banca de sucesores funciona igual."
                    >
                      Resolver después
                    </button>
                  </motion.div>
                </motion.div>
              ) : (
                /* ═══════════════════════════════════════════════════════
                   PASO 2 — Inteligencia y acción (Vista 2A / 2B)
                   ═══════════════════════════════════════════════════════ */
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="p-6 space-y-5"
                >
                  {/* Loading */}
                  {loadingSuggestions ? (
                    <div className="flex items-center justify-center h-20 text-slate-500 animate-pulse text-sm">
                      Analizando talento interno...
                    </div>
                  ) : (
                    <AnimatePresence mode="wait">
                      {!showAlternatives ? (
                        /* ─── VISTA 2A: Sugerencias IA ─── */
                        <motion.div
                          key="vista2a"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ duration: 0.2 }}
                          className="space-y-4 min-h-[400px] flex flex-col"
                        >
                          <p className="text-3xl font-light text-white leading-relaxed mb-6">
                            Selecciona el candidato ideal para{' '}
                            <span className="text-purple-400 font-medium">{vacatedPositionTitle}</span>
                          </p>

                          {suggestions.length > 0 && (
                            <div className="space-y-3 flex-1">
                              <div className="flex items-center gap-2">
                                <Brain className="w-4 h-4 text-purple-400 flex-shrink-0" />
                                <p className="text-xs text-purple-300">
                                  <span className="font-medium">FocalizaHR</span>
                                  <span className="text-purple-500">&reg;</span> sugiere estos perfiles por su alto Fit:
                                </p>
                              </div>

                              <div className="space-y-2">
                                {suggestions.map(s => {
                                  const isSelected = selectedSuggestion?.employeeId === s.employeeId
                                  return (
                                    <div
                                      key={s.employeeId}
                                      onClick={() => selectSuggestion(s)}
                                      className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                                        isSelected
                                          ? 'bg-purple-500/10 border border-purple-500/50'
                                          : 'bg-slate-800/40 border border-slate-700/30 hover:border-slate-600/50'
                                      }`}
                                    >
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm text-white truncate">{formatDisplayName(s.employeeName, 'short')}</p>
                                        <p className="text-[10px] text-slate-500 truncate">
                                          {s.position || 'Sin cargo'}
                                        </p>
                                      </div>

                                      <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
                                        isSelected
                                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                          : 'bg-slate-700/50 text-slate-400 border border-slate-600/30'
                                      }`}>
                                        Fit {Math.round(s.roleFitScore)}%
                                      </span>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          )}

                          {/* Footer Vista 2A */}
                          <div className="flex items-center justify-between pt-2 border-t border-slate-800/50 mt-auto">
                            <GhostButton size="sm" onClick={() => {
                              setShowAlternatives(true)
                              setSelectedSuggestion(null)
                            }} disabled={isSubmitting}>
                              Explorar otras alternativas
                            </GhostButton>
                            <PrimaryButton size="sm" onClick={handleConfirm} disabled={!selectedSuggestion || isSubmitting}>
                              {isSubmitting ? 'Procesando...' : 'Confirmar Reemplazo'}
                            </PrimaryButton>
                          </div>
                        </motion.div>
                      ) : (
                        /* ─── VISTA 2B: Alternativas manuales ─── */
                        <motion.div
                          key="vista2b"
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ duration: 0.2 }}
                          className="space-y-4 min-h-[400px] flex flex-col"
                        >
                          <p className="text-3xl font-light text-white leading-relaxed mb-6">
                            Encuentra el talento{' '}
                            <span className="text-cyan-400 font-medium">correcto</span>{' '}
                            para esta posición
                          </p>

                          {/* Search */}
                          <div className="space-y-2">
                            <button
                              onClick={() => expandAlternative('search')}
                              className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                                expandedAlt === 'search'
                                  ? 'bg-slate-800/60 border-cyan-500/40'
                                  : 'bg-slate-900/40 border-slate-700/30 hover:border-slate-600/50'
                              }`}
                            >
                              <Search className={`w-4 h-4 flex-shrink-0 ${expandedAlt === 'search' ? 'text-cyan-400' : 'text-slate-500'}`} />
                              <span className={`text-sm ${expandedAlt === 'search' ? 'text-white font-medium' : 'text-slate-300'}`}>
                                Buscar otro talento
                              </span>
                            </button>

                            <AnimatePresence>
                              {expandedAlt === 'search' && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="overflow-hidden"
                                >
                                  <div className="pl-3 pr-1 pb-1">
                                    <EmployeeSearchInput
                                      onSelect={(emp) => {
                                        setManualEmployee(emp)
                                        setConfirmLowFit(false)
                                      }}
                                      onClear={() => {
                                        setManualEmployee(null)
                                        setConfirmLowFit(false)
                                      }}
                                    />
                                    {manualEmployee && !manualEmployee.meetsThreshold && (
                                      <div className="mt-2 p-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
                                        <p className="text-xs text-purple-300">
                                          {manualEmployee.fullName} tiene RoleFit {Math.round(manualEmployee.roleFitScore)}% (bajo umbral 75%)
                                        </p>
                                        <label className="flex items-center gap-2 mt-1.5 cursor-pointer">
                                          <input
                                            type="checkbox"
                                            checked={confirmLowFit}
                                            onChange={(e) => setConfirmLowFit(e.target.checked)}
                                            className="accent-purple-400"
                                          />
                                          <span className="text-[10px] text-slate-400">Confirmo que deseo nominar a este empleado</span>
                                        </label>
                                      </div>
                                    )}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>

                          {/* External */}
                          <div className="space-y-2">
                            <button
                              onClick={() => expandAlternative('external')}
                              className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                                expandedAlt === 'external'
                                  ? 'bg-slate-800/60 border-cyan-500/40'
                                  : 'bg-slate-900/40 border-slate-700/30 hover:border-slate-600/50'
                              }`}
                            >
                              <Building2 className={`w-4 h-4 flex-shrink-0 ${expandedAlt === 'external' ? 'text-cyan-400' : 'text-slate-500'}`} />
                              <span className={`text-sm ${expandedAlt === 'external' ? 'text-white font-medium' : 'text-slate-300'}`}>
                                Declarar busqueda externa
                              </span>
                            </button>

                            <AnimatePresence>
                              {expandedAlt === 'external' && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="overflow-hidden"
                                >
                                  <div className="pl-3 pr-1 pb-1">
                                    <label className="text-xs text-slate-400 block mb-1">
                                      Justificacion (opcional)
                                    </label>
                                    <textarea
                                      value={externalReason}
                                      onChange={(e) => setExternalReason(e.target.value)}
                                      placeholder="Motivo de busqueda externa..."
                                      className="w-full bg-slate-800/60 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50 resize-none"
                                      rows={2}
                                    />
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>

                          <div className="mt-6 p-4 rounded-xl bg-slate-800/30 border border-slate-700/30">
                            <p className="text-xs text-slate-500 font-light leading-relaxed">
                              La búsqueda manual considera todos los colaboradores activos. La búsqueda externa quedará registrada para seguimiento del equipo de RRHH.
                            </p>
                          </div>

                          {/* Footer Vista 2B */}
                          <div className="flex items-center justify-between pt-2 border-t border-slate-800/50 mt-auto">
                            <GhostButton size="sm" onClick={() => {
                              setShowAlternatives(false)
                              setManualEmployee(null)
                              setConfirmLowFit(false)
                              setExpandedAlt(null)
                              setExternalReason('')
                            }} disabled={isSubmitting}>
                              Volver a sugerencias
                            </GhostButton>
                            <PrimaryButton size="sm" onClick={handleConfirm} disabled={!canConfirm()}>
                              {isSubmitting ? 'Procesando...' : 'Confirmar Reemplazo'}
                            </PrimaryButton>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
