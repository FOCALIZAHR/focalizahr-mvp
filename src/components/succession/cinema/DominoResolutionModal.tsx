'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, CheckCircle, AlertTriangle, Shield, ShieldAlert,
  Search, Building2, ChevronRight, Brain,
} from 'lucide-react'
import { PrimaryButton, GhostButton } from '@/components/ui/PremiumButton'
import { useToast } from '@/components/ui/toast-system'
import { formatDisplayName } from '@/lib/utils/formatName'

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

interface BenchCandidate {
  id: string
  employeeId: string
  employeeName: string
  position: string | null
  departmentName: string | null
  readinessLevel: string
  matchPercent: number
}

export interface DominoResolution {
  resolution: 'COVERED' | 'EXTERNAL_SEARCH' | 'POSITION_ELIMINATED' | 'PENDING'
  backfillEmployeeId?: string
  backfillEmployeeName?: string
  manualEmployeeId?: string
  externalReason?: string
}

interface BackfillSuggestion {
  employeeId: string
  employeeName: string
  position: string | null
  departmentName: string | null
  roleFitScore: number
}

interface DominoResolutionModalProps {
  isOpen: boolean
  onClose: () => void
  candidateId: string
  nivel1: {
    candidatoNombre: string
    posicionAsume: string
    matchPercent: number
    readinessLevel: string
  }
  nivel2: {
    posicionDejaId: string | null
    posicionDejaTitulo: string
    posicionDejaDepartamento: string | null
    posicionDejaJobLevel: string | null
    esCargoCritico: boolean
    benchStrength: string | null
    benchStatus: 'HEALTHY' | 'EMPTY' | 'NON_CRITICAL'
    benchCandidates: BenchCandidate[]
  }
  isMandatory: boolean
  onConfirm: (resolution: DominoResolution) => Promise<void>
  onSkip: () => void
  isLoading: boolean
  onNavigate?: (url: string) => void
  renderEmployeeSearch?: (props: {
    positionId: string
    onSelect: (employee: { id: string; fullName: string; roleFitScore: number; meetsThreshold: boolean }) => void
    onClear: () => void
  }) => React.ReactNode
}

// ════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ════════════════════════════════════════════════════════════════════════════

const READINESS_LABEL: Record<string, string> = {
  READY_NOW:       'Listo ahora',
  READY_1_2_YEARS: '1-2 anos',
  READY_3_PLUS:    '3+ anos',
  NOT_VIABLE:      'En desarrollo',
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ════════════════════════════════════════════════════════════════════════════

export default function DominoResolutionModal({
  isOpen,
  onClose,
  candidateId,
  nivel1,
  nivel2,
  isMandatory,
  onConfirm,
  onSkip,
  isLoading,
  onNavigate,
  renderEmployeeSearch,
}: DominoResolutionModalProps) {
  const [wasResolved, setWasResolved] = useState(false)
  const benchStatus = nivel2.benchStatus

  function handleClose() {
    if (!wasResolved) onSkip()
    onClose()
  }

  // ── CASO A handlers ──
  async function handleHealthyConfirm() {
    await onConfirm({ resolution: 'COVERED' })
    setWasResolved(true)
  }
  async function handleEditBench() {
    await onConfirm({ resolution: 'PENDING' })
    setWasResolved(true)
    if (nivel2.posicionDejaId && onNavigate) {
      onNavigate(`/dashboard/succession?position=${nivel2.posicionDejaId}`)
    }
  }

  // ── CASO B handlers ──
  async function handlePlanBench() {
    await onConfirm({ resolution: 'PENDING' })
    setWasResolved(true)
    if (nivel2.posicionDejaId && onNavigate) {
      onNavigate(`/dashboard/succession?position=${nivel2.posicionDejaId}`)
    }
  }
  async function handleContinueEmpty() {
    await onConfirm({ resolution: 'PENDING' })
    setWasResolved(true)
  }

  if (!isOpen) return null

  // ── CASO C: shell propio ──
  if (benchStatus === 'NON_CRITICAL') {
    return (
      <ViewNonCritical
        candidateId={candidateId}
        positionTitle={nivel2.posicionDejaTitulo}
        onConfirm={onConfirm}
        onSkip={onSkip}
        onClose={onClose}
        isLoading={isLoading}
        renderEmployeeSearch={renderEmployeeSearch}
      />
    )
  }

  // ── CASO A / B: shell compartido ──
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
          {/* Tesla line */}
          <div className={`absolute top-0 inset-x-0 h-[2px] rounded-t-[24px] ${
            benchStatus === 'HEALTHY'
              ? 'bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_rgba(52,211,153,0.4)]'
              : 'bg-gradient-to-r from-transparent via-rose-400 to-transparent shadow-[0_0_12px_rgba(251,113,133,0.4)]'
          }`} />

          <button onClick={handleClose} className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 transition-colors z-10">
            <X className="w-5 h-5" />
          </button>

          <div className="p-6 space-y-5">
            {/* Nivel 1 */}
            <div className="bg-slate-900/60 border border-emerald-500/30 rounded-xl p-4 relative">
              <div className="absolute top-0 inset-x-0 h-[2px] rounded-t-xl bg-gradient-to-r from-transparent via-emerald-400 to-transparent" />
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span className="text-xs text-emerald-400 font-medium uppercase tracking-wider">Nominacion confirmada</span>
              </div>
              <p className="text-white font-semibold text-sm">
                {formatDisplayName(nivel1.candidatoNombre, 'short')} → {nivel1.posicionAsume}
              </p>
              <p className="text-slate-400 text-xs mt-0.5">
                Match {Math.round(nivel1.matchPercent)}% · {READINESS_LABEL[nivel1.readinessLevel] || nivel1.readinessLevel}
              </p>
            </div>

            {/* Nivel 2 */}
            <div className="bg-slate-900/60 border border-amber-500/30 rounded-xl p-4 relative">
              <div className="absolute top-0 inset-x-0 h-[2px] rounded-t-xl bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span className="text-xs text-amber-400 font-medium uppercase tracking-wider">Vacante detectada</span>
              </div>
              <p className="text-white font-semibold text-sm">{nivel2.posicionDejaTitulo}</p>
              <p className="text-slate-400 text-xs mt-0.5">
                {[nivel2.posicionDejaDepartamento, nivel2.posicionDejaJobLevel].filter(Boolean).join(' · ')}
              </p>
              <p className="text-slate-500 text-[10px] mt-1">
                {formatDisplayName(nivel1.candidatoNombre, 'short')} deja vacante esta posicion{nivel2.esCargoCritico ? ' critica' : ''}
              </p>
            </div>

            {/* CASO A */}
            {benchStatus === 'HEALTHY' && (
              <ViewHealthy
                benchCandidates={nivel2.benchCandidates}
                onConfirm={handleHealthyConfirm}
                onEditBench={handleEditBench}
                isLoading={isLoading}
              />
            )}

            {/* CASO B */}
            {benchStatus === 'EMPTY' && (
              <ViewEmpty
                positionTitle={nivel2.posicionDejaTitulo}
                onPlanBench={handlePlanBench}
                onContinue={handleContinueEmpty}
                isLoading={isLoading}
              />
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// VISTA 1 — CASO A (HEALTHY)
// ════════════════════════════════════════════════════════════════════════════

function ViewHealthy({
  benchCandidates,
  onConfirm,
  onEditBench,
  isLoading,
}: {
  benchCandidates: BenchCandidate[]
  onConfirm: () => void
  onEditBench: () => void
  isLoading: boolean
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Shield className="w-4 h-4 text-emerald-400" />
        <p className="text-sm text-emerald-400 font-medium">Banca cubierta</p>
      </div>
      <p className="text-xs text-slate-400">
        Esta posicion tiene {benchCandidates.length} candidato{benchCandidates.length > 1 ? 's' : ''} preparado{benchCandidates.length > 1 ? 's' : ''} para asumir.
      </p>
      <div className="space-y-2">
        {benchCandidates.map(c => (
          <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/40 border border-slate-700/30">
            <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-emerald-400">
                {(c.employeeName || '').split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white truncate">{formatDisplayName(c.employeeName, 'short')}</p>
              <p className="text-[10px] text-slate-500 truncate">
                {[c.position, c.departmentName].filter(Boolean).join(' · ') || 'Sin cargo'}
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-xs text-slate-300">{Math.round(c.matchPercent)}%</p>
              <p className="text-[10px] text-slate-500">{READINESS_LABEL[c.readinessLevel] || c.readinessLevel}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between pt-2 border-t border-slate-800/50">
        <GhostButton size="sm" onClick={onEditBench} disabled={isLoading}>
          Editar banca <ChevronRight className="w-3 h-3 ml-1" />
        </GhostButton>
        <PrimaryButton size="sm" onClick={onConfirm} disabled={isLoading}>
          {isLoading ? 'Procesando...' : 'Confirmar nominacion'}
        </PrimaryButton>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// VISTA 2 — CASO B (EMPTY)
// ════════════════════════════════════════════════════════════════════════════

function ViewEmpty({
  positionTitle,
  onPlanBench,
  onContinue,
  isLoading,
}: {
  positionTitle: string
  onPlanBench: () => void
  onContinue: () => void
  isLoading: boolean
}) {
  return (
    <div className="space-y-4">
      <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <ShieldAlert className="w-5 h-5 text-rose-400" />
          <p className="text-sm text-rose-400 font-bold">Riesgo Operativo</p>
        </div>
        <p className="text-xs text-slate-400">
          <span className="text-white font-medium">{positionTitle}</span> es un cargo critico
          que quedara vacante <span className="text-rose-400 font-medium">sin sucesores identificados</span>.
        </p>
        <p className="text-[10px] text-slate-500 mt-2">
          Te recomendamos planificar la banca de sucesion ahora.
        </p>
      </div>
      <div className="flex items-center justify-between pt-2 border-t border-slate-800/50">
        <GhostButton size="sm" onClick={onContinue} disabled={isLoading}>
          Continuar y omitir
        </GhostButton>
        <PrimaryButton size="sm" onClick={onPlanBench} disabled={isLoading}>
          {isLoading ? 'Procesando...' : 'Planificar banca ahora'}
          <ChevronRight className="w-3 h-3 ml-1" />
        </PrimaryButton>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// VISTA 3 — CASO C (NON_CRITICAL): Una sola pantalla, divulgacion progresiva
// Shell propio con Tesla cyan + titulo "Asegurar Continuidad"
// ════════════════════════════════════════════════════════════════════════════

function ViewNonCritical({
  candidateId,
  positionTitle,
  onConfirm,
  onSkip,
  onClose,
  isLoading,
  renderEmployeeSearch,
}: {
  candidateId: string
  positionTitle: string
  onConfirm: (resolution: DominoResolution) => Promise<void>
  onSkip: () => void
  onClose: () => void
  isLoading: boolean
  renderEmployeeSearch?: DominoResolutionModalProps['renderEmployeeSearch']
}) {
  const toast = useToast()
  const [wasResolved, setWasResolved] = useState(false)

  // Suggestions (lazy loaded on mount)
  const [suggestions, setSuggestions] = useState<BackfillSuggestion[]>([])
  const [loadingSuggestions, setLoadingSuggestions] = useState(true)

  // Selection state
  const [selectedSuggestion, setSelectedSuggestion] = useState<BackfillSuggestion | null>(null)
  const [expandedAlt, setExpandedAlt] = useState<'search' | 'external' | null>(null)
  const [manualEmployee, setManualEmployee] = useState<{ id: string; fullName: string; roleFitScore: number; meetsThreshold: boolean } | null>(null)
  const [confirmLowFit, setConfirmLowFit] = useState(false)
  const [externalReason, setExternalReason] = useState('')

  // Lazy load on mount
  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await fetch(`/api/succession/candidates/${candidateId}/backfill-suggestions`)
        const data = await res.json()
        if (!cancelled && data.success) setSuggestions(data.data ?? [])
      } catch { /* silent */ }
      if (!cancelled) setLoadingSuggestions(false)
    }
    load()
    return () => { cancelled = true }
  }, [candidateId])

  function handleCloseX() {
    if (!wasResolved) onSkip()
    onClose()
  }

  // Determine what is selected
  const hasSelection = !!selectedSuggestion || !!manualEmployee || expandedAlt === 'external'

  function canConfirm(): boolean {
    if (isLoading) return false
    if (selectedSuggestion) return true
    if (manualEmployee) {
      if (!manualEmployee.meetsThreshold && !confirmLowFit) return false
      return true
    }
    if (expandedAlt === 'external') return true
    return false
  }

  async function handleConfirm() {
    if (selectedSuggestion) {
      await onConfirm({
        resolution: 'COVERED',
        backfillEmployeeId: selectedSuggestion.employeeId,
        backfillEmployeeName: selectedSuggestion.employeeName,
      })
      setWasResolved(true)
      toast.success(
        `"${formatDisplayName(selectedSuggestion.employeeName, 'short')}" quedara a cargo de la posicion. Plan de continuidad registrado.`,
        'Continuidad asegurada'
      )
    } else if (manualEmployee) {
      await onConfirm({
        resolution: 'COVERED',
        backfillEmployeeId: manualEmployee.id,
        backfillEmployeeName: manualEmployee.fullName,
      })
      setWasResolved(true)
      toast.success(
        `"${formatDisplayName(manualEmployee.fullName, 'short')}" quedara a cargo de la posicion. Plan de continuidad registrado.`,
        'Continuidad asegurada'
      )
    } else if (expandedAlt === 'external') {
      await onConfirm({
        resolution: 'EXTERNAL_SEARCH',
        externalReason: externalReason.trim() || undefined,
      })
      setWasResolved(true)
      toast.success(
        `Busqueda externa registrada para "${positionTitle}". RRHH tomara el proceso.`,
        'Proceso iniciado'
      )
    }
  }

  async function handleSkip() {
    await onConfirm({ resolution: 'PENDING' })
    setWasResolved(true)
    toast.info(
      'La posicion quedara sin cobertura designada. Puedes resolverlo desde el perfil del candidato.',
      'Pendiente de resolucion'
    )
  }

  // Select a suggestion (deselect alternatives)
  function selectSuggestion(s: BackfillSuggestion) {
    setSelectedSuggestion(s)
    setExpandedAlt(null)
    setManualEmployee(null)
    setConfirmLowFit(false)
  }

  // Expand alternative (deselect suggestion)
  function expandAlternative(alt: 'search' | 'external') {
    if (expandedAlt === alt) {
      setExpandedAlt(null)
      return
    }
    setExpandedAlt(alt)
    setSelectedSuggestion(null)
    setManualEmployee(null)
    setConfirmLowFit(false)
    setExternalReason('')
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
          className="w-full max-w-xl max-h-[85vh] overflow-y-auto rounded-[24px] bg-[#0F172A]/90 backdrop-blur-2xl border border-slate-800 shadow-2xl relative"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Tesla line — cyan fija */}
          <div
            className="absolute top-0 left-0 right-0 h-[1px] rounded-t-[24px]"
            style={{
              background: 'linear-gradient(90deg, transparent, #22D3EE, transparent)',
              boxShadow: '0 0 15px #22D3EE',
            }}
          />

          {/* Close */}
          <button onClick={handleCloseX} className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 transition-colors z-10">
            <X className="w-5 h-5" />
          </button>

          <div className="p-6 space-y-5">
            {/* ── 1. Header ── */}
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Asegurar Continuidad: {positionTitle}
              </h2>
            </div>

            {/* Banner */}
            <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg px-4 py-2">
              <p className="text-sm text-cyan-400">
                Nominacion guardada. Su posicion actual quedara vacante.
              </p>
            </div>

            {/* ── 2. AI Suggestions ── */}
            {loadingSuggestions ? (
              <div className="flex items-center justify-center h-16 text-slate-500 animate-pulse text-sm">
                Analizando talento interno...
              </div>
            ) : suggestions.length > 0 ? (
              <div className="space-y-3">
                {/* AI Branding */}
                <div className="flex items-center gap-2">
                  <Brain className="w-4 h-4 text-purple-400 flex-shrink-0" />
                  <p className="text-xs text-purple-300">
                    <span className="font-medium">FocalizaHR</span><span className="text-purple-500">&reg;</span> sugiere estos perfiles por su alto Fit:
                  </p>
                </div>

                {/* Radio-style suggestion cards */}
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
                        {/* Radio */}
                        <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${
                          isSelected ? 'border-purple-400 bg-purple-400/20' : 'border-slate-600'
                        }`}>
                          {isSelected && <div className="w-full h-full rounded-full bg-purple-400 scale-50" />}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white truncate">{formatDisplayName(s.employeeName, 'short')}</p>
                          <p className="text-[10px] text-slate-500 truncate">
                            {s.position || 'Sin cargo'}
                          </p>
                        </div>

                        {/* Fit badge */}
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
            ) : null}

            {/* ── 3. Otras alternativas (divulgacion progresiva) ── */}
            <div className="space-y-2">
              <p className="text-slate-500 text-xs uppercase tracking-wider">Otras alternativas:</p>

              {/* Search */}
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
                      {renderEmployeeSearch ? (
                        renderEmployeeSearch({
                          positionId: '',
                          onSelect: (emp) => {
                            setManualEmployee(emp)
                            setConfirmLowFit(false)
                          },
                          onClear: () => {
                            setManualEmployee(null)
                            setConfirmLowFit(false)
                          },
                        })
                      ) : (
                        <p className="text-xs text-slate-500 italic">Busqueda de empleados no disponible</p>
                      )}
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

              {/* External */}
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

            {/* ── 4. Footer ── */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800/50">
              <GhostButton size="sm" onClick={handleSkip} disabled={isLoading}>
                Dejar vacante por ahora
              </GhostButton>
              <PrimaryButton size="sm" onClick={handleConfirm} disabled={!canConfirm()}>
                {isLoading ? 'Procesando...' : 'Confirmar Reemplazo'}
              </PrimaryButton>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
