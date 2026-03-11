'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, CheckCircle, AlertTriangle, Shield, ShieldAlert,
  ChevronRight,
} from 'lucide-react'
import { PrimaryButton, GhostButton } from '@/components/ui/PremiumButton'
import { formatDisplayName } from '@/lib/utils/formatName'
import BackfillWizard from '@/components/succession/BackfillWizard'

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

  // ── CASO C: delegado a BackfillWizard ──
  if (benchStatus === 'NON_CRITICAL') {
    function handleBackfillConfirm(resolution: string, data?: Record<string, string>) {
      const mapped: DominoResolution = {
        resolution: resolution as DominoResolution['resolution'],
        ...(data?.backfillEmployeeId && {
          backfillEmployeeId: data.backfillEmployeeId,
          backfillEmployeeName: data.backfillEmployeeName,
        }),
        ...(data?.externalReason && { externalReason: data.externalReason }),
      }
      onConfirm(mapped)
      onClose()
    }
    return (
      <BackfillWizard
        candidateId={candidateId}
        vacatedPositionTitle={nivel2.posicionDejaTitulo}
        onClose={() => { onSkip(); onClose() }}
        onConfirm={handleBackfillConfirm}
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

