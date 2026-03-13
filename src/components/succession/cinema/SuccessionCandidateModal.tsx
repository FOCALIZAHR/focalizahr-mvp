'use client'

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, ChevronDown, ChevronUp, Check, Brain, Info, UserMinus } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { DangerButton, GhostButton, ButtonGroup } from '@/components/ui/PremiumButton'
import { useToast } from '@/components/ui/toast-system'
import { formatDisplayName, getInitials } from '@/lib/utils/formatName'
import { getNineBoxPositionConfig, NineBoxPosition } from '@/config/performanceClassification'
import { TalentNarrativeService } from '@/lib/services/TalentNarrativeService'
import SuccessionStatementPanel from './SuccessionStatementPanel'

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

type GapStatus = 'READY' | 'GAP_SMALL' | 'GAP_CRITICAL' | 'NOT_EVALUATED' | 'EXCEEDS'

interface GapDetail {
  competencyCode: string
  competencyName: string
  category: string
  actualScore: number | null
  targetScore: number
  targetCurrentRole?: number | null
  rawGap: number | null
  fitPercent: number
  status?: GapStatus
  notEvaluated?: boolean
}

interface CandidateProfile {
  employeeId: string
  employeeName: string
  position: string | null
  departmentName: string | null
  roleFitScore: number
  nineBoxPosition: string | null
  matchPercent: number
  readinessLevel: string
  readinessLabel: string
  flightRisk: string | null
  gapsCriticalCount: number
  potentialAspiration?: number | null
  riskQuadrant?: string | null
  mobilityQuadrant?: string | null
  gaps?: GapDetail[]
  hireDate?: string | null
  isNominated?: boolean
  nominatedId?: string
}

interface SuccessionCandidateModalProps {
  candidate: CandidateProfile & { _openTab?: 'profile' | 'evidence' | 'plan' }
  targetPosition: string
  targetJobLevel?: string
  filterStats?: { totalEmployees: number; candidateRank: number } | null
  mode?: 'suggestion' | 'nominated'
  canManage?: boolean
  onNominate: (overrideReadiness?: string, justification?: string) => void
  onWithdraw?: () => void
  onClose: () => void
  isNominating?: boolean
}

// ════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ════════════════════════════════════════════════════════════════════════════

const READINESS_CONFIG: Record<string, { color: string; badge: string; label: string }> = {
  READY_NOW:       { color: '#10B981', badge: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', label: 'Listo ahora' },
  READY_1_2_YEARS: { color: '#F59E0B', badge: 'bg-amber-500/20 text-amber-400 border-amber-500/30',     label: 'Listo en 1-2 anos' },
  READY_3_PLUS:    { color: '#A78BFA', badge: 'bg-purple-500/20 text-purple-400 border-purple-500/30',   label: 'Listo en 3+ anos' },
  NOT_VIABLE:      { color: '#64748B', badge: 'bg-slate-500/20 text-slate-400 border-slate-500/30',      label: 'No viable' },
}

const OVERRIDE_OPTIONS = [
  { value: 'READY_NOW', label: 'Listo ahora' },
  { value: 'READY_1_2_YEARS', label: '1-2 anos' },
  { value: 'READY_3_PLUS', label: '3+ anos' },
]

// ════════════════════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════════════════════

function safeNum(val: unknown): number {
  const n = Number(val); return isNaN(n) ? 0 : n
}

function deriveStatus(g: GapDetail): GapStatus {
  if (g.status) return g.status as GapStatus
  if (g.notEvaluated) return 'NOT_EVALUATED'
  if (g.actualScore == null) return 'NOT_EVALUATED'
  if (g.actualScore === 0 && g.targetCurrentRole == null) return 'NOT_EVALUATED'
  if (g.rawGap == null) return 'NOT_EVALUATED'
  if (g.rawGap > 0.5) return 'EXCEEDS'
  if (g.rawGap >= 0) return 'READY'
  if (g.rawGap > -1) return 'GAP_SMALL'
  return 'GAP_CRITICAL'
}

function getFirstName(fullName: string): string {
  const parts = (fullName || '').split(' ').filter(Boolean)
  if (parts.length === 0) return 'Candidato'
  const capitalized = parts.find(p => p.length > 2 && p[0] === p[0].toUpperCase() && p.slice(1) === p.slice(1).toLowerCase())
  return capitalized || parts[0]
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ════════════════════════════════════════════════════════════════════════════

export default function SuccessionCandidateModal({
  candidate,
  targetPosition,
  filterStats,
  mode = 'suggestion',
  canManage = false,
  onNominate,
  onWithdraw,
  onClose,
  isNominating,
}: SuccessionCandidateModalProps) {
  const { success, error } = useToast()
  const initialTab = candidate._openTab && candidate._openTab === 'plan' && mode === 'nominated' && candidate.nominatedId
    ? 'plan' : 'profile'
  const [activeTab, setActiveTab] = useState<'profile' | 'evidence' | 'plan'>(initialTab)
  const [showOverride, setShowOverride] = useState(false)
  const [showBrainTooltip, setShowBrainTooltip] = useState(false)
  const [brainTooltipPos, setBrainTooltipPos] = useState({ x: 0, y: 0 })
  const [brainTooltipBelow, setBrainTooltipBelow] = useState(false)
  const [metricTooltip, setMetricTooltip] = useState<{ key: string; x: number; y: number; below: boolean } | null>(null)
  const [mounted, setMounted] = useState(false)
  const brainRef = useRef<HTMLDivElement>(null)
  const [overrideReadiness, setOverrideReadiness] = useState(candidate.readinessLevel)

  useEffect(() => { setMounted(true) }, [])

  // Guard: if plan tab is active but nominatedId gone, fall back to profile
  useEffect(() => {
    if (activeTab === 'plan' && (!candidate.nominatedId || mode !== 'nominated')) {
      setActiveTab('profile')
    }
  }, [activeTab, candidate.nominatedId, mode])
  const [justification, setJustification] = useState('')

  const rc = READINESS_CONFIG[candidate.readinessLevel] || READINESS_CONFIG.NOT_VIABLE
  const roleFit = safeNum(candidate.roleFitScore)
  const matchPct = safeNum(candidate.matchPercent)
  const displayName = formatDisplayName(candidate.employeeName || '', 'short')
  const firstName = getFirstName(displayName)
  const initials = getInitials(displayName)

  const gaps = (candidate.gaps || []).map(g => ({ ...g, _status: deriveStatus(g) }))
  const strengths = gaps.filter(g => g._status === 'READY' || g._status === 'EXCEEDS')
    .sort((a, b) => (b.fitPercent || 0) - (a.fitPercent || 0))
  const brechas = gaps.filter(g => g._status === 'GAP_SMALL' || g._status === 'GAP_CRITICAL')
    .sort((a, b) => (a.rawGap ?? 0) - (b.rawGap ?? 0))
  const notEval = gaps.filter(g => g._status === 'NOT_EVALUATED')
  const criticalCount = brechas.filter(g => g._status === 'GAP_CRITICAL').length
  const evaluatedGaps = gaps.filter(g => g._status !== 'NOT_EVALUATED')

  // Talent narrative from TalentNarrativeService
  const talentNarrative = TalentNarrativeService.getIndividualNarrative(
    candidate.riskQuadrant ?? null,
    candidate.mobilityQuadrant ?? null,
    roleFit,
    displayName
  )

  const formattedPosition = targetPosition
    ? targetPosition.split(' ')
        .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ')
    : 'este cargo'

  const aspLabel = candidate.potentialAspiration === 3
    ? `busca activamente crecer — lo declaró su jefe en la evaluación de potencial`
    : `está abierto a nuevos desafíos cuando se presentan — evaluación de potencial`

  const brainTooltipText = `Algoritmo FocalizaHR® analiza la evaluación de potencial del colaborador para determinar su orientación de carrera. No es una inferencia — es lo que su jefe declaró formalmente en el último ciclo de evaluación.`

  // Narrative helpers
  const aspText = candidate.potentialAspiration === 3
    ? `Detectó que ${displayName} busca activamente crecer, según su última evaluación de potencial.`
    : `Detectó que ${displayName} se abre a nuevos desafíos cuando se presentan, según su última evaluación de potencial.`
  const top2Names = brechas
    .filter(g => g._status === 'GAP_CRITICAL')
    .slice(0, 2)
    .map(g => g.competencyName || g.competencyCode)
    .join(', ')

  const METRIC_TOOLTIPS: Record<string, { title: string; lines: string[]; accent: string }> = {
    fit: {
      title: 'Fit Rol',
      lines: [
        'Qué tan bien domina su cargo actual.',
        'FocalizaHR® compara sus competencias evaluadas en 360° contra el perfil requerido para su nivel.',
      ],
      accent: '100% = cumple o supera todas.',
    },
    match: {
      title: 'Match',
      lines: [
        'Qué tan preparado/a está para el cargo objetivo.',
        'FocalizaHR® analiza sus competencias actuales contra las requeridas para la posición crítica.',
      ],
      accent: '100% = listo/a para asumir hoy.',
    },
    talent: {
      title: 'Matriz Talento',
      lines: [
        'Clasificación calibrada en sesión de liderazgo.',
        'FocalizaHR® cruza desempeño objetivo (360°) con potencial evaluado por su jefe (Aspiración + Capacidad).',
      ],
      accent: '⭐ Estrella = Alto en ambos ejes.',
    },
  }

  function handleMetricHover(key: string, e: React.MouseEvent) {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const showBelow = rect.top < 120
    setMetricTooltip({
      key,
      x: rect.left + rect.width / 2,
      y: showBelow ? rect.bottom + 8 : rect.top - 8,
      below: showBelow,
    })
  }

  function handleConfirm() {
    if (showOverride && overrideReadiness !== candidate.readinessLevel) {
      onNominate(overrideReadiness, justification)
    } else {
      onNominate()
    }
  }

  const [hasPlanChanges, setHasPlanChanges] = useState(false)
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false)

  function handleBackdropClick() {
    if (hasPlanChanges) {
      setShowDiscardConfirm(true)
    } else {
      onClose()
    }
  }

  const [withdrawing, setWithdrawing] = useState(false)
  async function handleWithdraw() {
    if (!candidate.nominatedId) return
    setWithdrawing(true)
    try {
      const res = await fetch(`/api/succession/candidates/${candidate.nominatedId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'WITHDRAWN' }),
      })
      if (!res.ok) {
        error(
          `No se pudo retirar a ${displayName}. Intenta nuevamente.`,
          'Error'
        )
        return
      }
      success(
        `${displayName} fue retirado como sucesor de ${formattedPosition}`,
        'Sucesor retirado'
      )
      onWithdraw?.()
      setTimeout(() => onClose(), 400)
    } catch {
      error(
        `No se pudo retirar a ${displayName}. Intenta nuevamente.`,
        'Error'
      )
    } finally {
      setWithdrawing(false)
    }
  }

  const canConfirm = !showOverride || (
    overrideReadiness !== candidate.readinessLevel
      ? justification.trim().length > 0
      : true
  )

  // NineBox mapping
  const nineBoxEnum = candidate.nineBoxPosition
    ? (Object.values(NineBoxPosition).find(v => v === candidate.nineBoxPosition) as NineBoxPosition | undefined)
    : undefined

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-[100] bg-black/60 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-[24px] bg-[#0F172A]/95 backdrop-blur-2xl border border-slate-800 shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Tesla line */}
        <div
          className="absolute top-0 left-0 right-0 h-[1px] z-20 rounded-t-[24px]"
          style={{
            background: `linear-gradient(90deg, transparent, ${rc.color}, transparent)`,
            boxShadow: `0 0 15px ${rc.color}`,
          }}
        />

        <div className="p-6">
          {/* ═══════════ ZONA 1 — IDENTIDAD ═══════════ */}
          <div className="flex items-start justify-between mb-5">
            <div className="flex items-center gap-3">
              <div
                className="w-11 h-11 rounded-full border-2 flex items-center justify-center text-sm font-bold flex-shrink-0"
                style={{ borderColor: rc.color + '40', background: '#0B1120', color: rc.color }}
              >
                {initials || '?'}
              </div>
              <div>
                <h2 className="text-base font-medium text-white leading-tight">{displayName || 'Sin nombre'}</h2>
                <p className="text-xs text-slate-400">
                  {candidate.position || 'Sin cargo'}{candidate.departmentName ? ` · ${candidate.departmentName}` : ''}
                </p>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className={cn(
                    'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border',
                    rc.badge
                  )}>
                    {candidate.readinessLevel === 'READY_NOW' && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    )}
                    {rc.label}
                  </span>
                  <div
                    ref={brainRef}
                    onMouseEnter={() => {
                      const rect = brainRef.current?.getBoundingClientRect()
                      if (rect) {
                        const showBelow = rect.top < 120
                        setBrainTooltipPos({
                          x: rect.left + rect.width / 2,
                          y: showBelow ? rect.bottom + 12 : rect.top - 12,
                        })
                        setBrainTooltipBelow(showBelow)
                      }
                      setShowBrainTooltip(true)
                    }}
                    onMouseLeave={() => setShowBrainTooltip(false)}
                  >
                    <Brain className="w-3.5 h-3.5 text-purple-400 cursor-help" />
                  </div>
                  <button
                    onClick={() => setShowOverride(!showOverride)}
                    className="text-[10px] text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-0.5"
                  >
                    Cambiar
                    <ChevronDown className="w-2.5 h-2.5" />
                  </button>
                </div>
              </div>
            </div>
            <button
              onClick={handleBackdropClick}
              className="text-slate-500 hover:text-slate-300 transition-colors p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Override panel (inline under readiness) */}
          <AnimatePresence>
            {showOverride && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="mb-4 space-y-2">
                  <select
                    className="fhr-input w-full text-sm"
                    value={overrideReadiness}
                    onChange={e => setOverrideReadiness(e.target.value)}
                  >
                    {OVERRIDE_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  {overrideReadiness !== candidate.readinessLevel && (
                    <>
                      <textarea
                        className="fhr-input w-full min-h-[60px] resize-none text-sm"
                        placeholder="Razon del cambio (requerida)..."
                        value={justification}
                        onChange={e => setJustification(e.target.value)}
                      />
                      {justification.trim().length === 0 && (
                        <p className="text-[11px] text-rose-400">Justificacion obligatoria</p>
                      )}
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ═══════════ ZONA 2 — METRICAS ═══════════ */}
          <div className="flex gap-2 mb-5">
            <div
              className="flex-1 bg-white/5 rounded-xl p-3 text-center cursor-help"
              onMouseEnter={(e) => handleMetricHover('fit', e)}
              onMouseLeave={() => setMetricTooltip(null)}
            >
              <span className="text-2xl font-bold text-[#22D3EE] block">{Math.round(roleFit)}%</span>
              <span className="text-[10px] text-slate-400 uppercase tracking-wide">Fit Rol <Info className="w-3 h-3 opacity-40 inline ml-0.5" /></span>
            </div>
            <div
              className="flex-1 bg-white/5 rounded-xl p-3 text-center cursor-help"
              onMouseEnter={(e) => handleMetricHover('match', e)}
              onMouseLeave={() => setMetricTooltip(null)}
            >
              <span className="text-2xl font-bold text-[#22D3EE] block">{Math.round(matchPct)}%</span>
              <span className="text-[10px] text-slate-400 uppercase tracking-wide">Match <Info className="w-3 h-3 opacity-40 inline ml-0.5" /></span>
            </div>
            <div
              className="flex-1 bg-white/5 rounded-xl p-3 text-center flex flex-col items-center justify-center cursor-help"
              onMouseEnter={(e) => handleMetricHover('talent', e)}
              onMouseLeave={() => setMetricTooltip(null)}
            >
              {nineBoxEnum ? (
                <span className="text-sm font-bold text-[#A78BFA] block leading-tight">
                  {getNineBoxPositionConfig(nineBoxEnum)?.label || nineBoxEnum}
                </span>
              ) : (
                <span className="text-sm text-slate-500 font-medium">Sin evaluar</span>
              )}
              <span className="text-[10px] text-slate-400 uppercase tracking-wide mt-1">Matriz Talento <Info className="w-3 h-3 opacity-40 inline ml-0.5" /></span>
            </div>
          </div>

          {/* ═══════════ ZONA 3 — NARRATIVA (profile tab only) ═══════════ */}
          {activeTab === 'profile' && (<>
          {/* ZONA 3 — NARRATIVA */}
          <p className="text-sm text-slate-300 italic leading-relaxed mb-5">
            {brechas.length === 0 && notEval.length === 0 && (
              <>{displayName} no presenta brechas bloqueantes para asumir como {formattedPosition}.{' '}</>
            )}
            {brechas.length === 0 && notEval.length > 0 && (
              <>{displayName} no presenta brechas bloqueantes para asumir como {formattedPosition}. Hay que tener atención: {notEval.length} competencias son nuevas para su rol, pero es el aprendizaje natural del ascenso.{' '}</>
            )}
            {brechas.length > 0 && (
              <>{displayName} tiene {brechas.length} brecha{brechas.length !== 1 ? 's' : ''} a desarrollar para asumir como {formattedPosition}: {top2Names}. Tiempo estimado: {rc.label.toLowerCase()}.{' '}</>
            )}
            <span className="flex items-start gap-1.5 mt-1.5 not-italic">
              <Brain className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
              <span className="text-slate-400 text-xs leading-relaxed">{aspText}</span>
            </span>
          </p>

          {/* ═══════════ ZONA 3.5 — NARRATIVA TALENTO ═══════════ */}
          {talentNarrative && (
            <div className="relative mb-5 p-3 rounded-xl bg-slate-900/60 border border-slate-800 overflow-hidden">
              {/* Tesla line cyan */}
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/60 to-transparent" />
              <div className="flex items-center gap-2 mb-1.5">
                <span className={cn(
                  'px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider border',
                  talentNarrative.urgencyLevel === 'CRITICA'
                    ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                    : talentNarrative.urgencyLevel === 'ALTA'
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                )}>
                  {talentNarrative.urgencyLevel}
                </span>
                <span className="text-xs font-semibold text-white">{talentNarrative.headline}</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed mb-1">{talentNarrative.context}</p>
              {talentNarrative.urgencySignal && (
                <p className="text-[11px] text-slate-300 leading-relaxed mb-1.5">{talentNarrative.urgencySignal}</p>
              )}
              <p className="text-[11px] text-slate-200 leading-relaxed">
                <span className="text-slate-500 font-medium">Accion: </span>{talentNarrative.recommendedAction}
              </p>
              {talentNarrative.conflictAlert && (
                <div className="mt-2 p-2 rounded-lg bg-rose-500/10 border border-rose-500/20">
                  <p className="text-[10px] text-rose-400 leading-relaxed font-medium">
                    {talentNarrative.conflictAlert}
                  </p>
                </div>
              )}
            </div>
          )}
          </>)}

          {/* ═══════════ ZONA 4 — TABS ═══════════ */}
          <div className="mb-5 border-b border-slate-800/50">
            <div className="flex gap-0">
              {(['profile', 'evidence', ...(mode === 'nominated' && candidate.nominatedId ? ['plan'] : [])] as const).map(tab => {
                const labels: Record<string, string> = { profile: 'Perfil', evidence: 'Analisis', plan: 'Plan' }
                const isActive = activeTab === tab
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab as typeof activeTab)}
                    className={cn(
                      'px-4 py-2 text-xs font-medium transition-all relative',
                      isActive
                        ? 'text-cyan-400'
                        : 'text-slate-500 hover:text-slate-300'
                    )}
                  >
                    {labels[tab]}
                    {isActive && (
                      <motion.div
                        layoutId="tab-underline"
                        className="absolute bottom-0 inset-x-0 h-[2px] bg-cyan-400"
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* ═══════════ TAB: PLAN (Succession Statement v3.0) ═══════════ */}
          {activeTab === 'plan' && candidate.nominatedId && (
            <div className="mb-5">
              <SuccessionStatementPanel
                candidateId={candidate.nominatedId}
                canManage={canManage}
                candidateName={displayName}
                targetPosition={formattedPosition}
                onDirtyChange={setHasPlanChanges}
              />
            </div>
          )}

          {/* ═══════════ TAB: EVIDENCE ═══════════ */}
          <AnimatePresence>
            {activeTab === 'evidence' && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.25 }}
                className="space-y-4 pb-5"
              >
                  {/* Fortalezas / Brechas side by side */}
                  {gaps.length > 0 && (
                    <div className="grid grid-cols-2 gap-3">
                      {/* Fortalezas */}
                      {strengths.length > 0 && (
                        <div>
                          <h4 className="text-[10px] text-emerald-400 uppercase tracking-wider font-bold mb-1.5">
                            Fortalezas ({strengths.length})
                          </h4>
                          <div className="space-y-1">
                            {strengths.slice(0, 4).map(g => {
                              const target = g.targetCurrentRole != null ? Number(g.targetCurrentRole) : Number(g.targetScore || 0)
                              const actual = g.actualScore !== null ? Number(g.actualScore) : 0
                              const pct = target > 0 ? Math.min((actual / target) * 100, 100) : 0
                              return (
                                <div key={g.competencyCode} className="p-1.5 rounded-lg bg-emerald-500/5 border border-emerald-500/15">
                                  <div className="flex items-center justify-between mb-0.5">
                                    <span className="text-[11px] text-slate-200 truncate">{g.competencyName || g.competencyCode}</span>
                                    <span className="text-[10px] text-emerald-400 font-mono flex-shrink-0 ml-1">
                                      {g.actualScore !== null ? Number(g.actualScore).toFixed(1) : '—'}/{target.toFixed(1)}
                                    </span>
                                  </div>
                                  <div className="h-1 rounded-full bg-slate-800 overflow-hidden">
                                    <div
                                      className="h-full rounded-full bg-emerald-500/60 transition-all duration-500"
                                      style={{ width: `${pct}%` }}
                                    />
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      {/* Brechas */}
                      <div>
                        <h4 className="text-[10px] text-amber-400 uppercase tracking-wider font-bold mb-1.5">
                          Brechas ({brechas.length})
                        </h4>
                        {brechas.length === 0 ? (
                          <div className="p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/15">
                            <span className="text-[11px] text-emerald-400">Sin brechas</span>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            {brechas.slice(0, 4).map(g => {
                              const target = g.targetCurrentRole != null ? Number(g.targetCurrentRole) : Number(g.targetScore || 0)
                              const actual = g.actualScore !== null ? Number(g.actualScore) : 0
                              const pct = target > 0 ? Math.min((actual / target) * 100, 100) : 0
                              return (
                                <div key={g.competencyCode} className="p-1.5 rounded-lg bg-amber-500/5 border border-amber-500/15">
                                  <div className="flex items-center justify-between mb-0.5">
                                    <span className="text-[11px] text-slate-200 truncate">{g.competencyName || g.competencyCode}</span>
                                    <span className="text-[10px] text-amber-400 font-mono flex-shrink-0 ml-1">
                                      {g.actualScore !== null ? Number(g.actualScore).toFixed(1) : '—'}/{target.toFixed(1)}
                                    </span>
                                  </div>
                                  <div className="h-1 rounded-full bg-slate-800 overflow-hidden">
                                    <div
                                      className="h-full rounded-full bg-amber-500/60 transition-all duration-500"
                                      style={{ width: `${pct}%` }}
                                    />
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Apoyo Requerido */}
                  {brechas.length > 0 && (
                    <div className="relative rounded-xl bg-slate-900/60 border border-slate-800 p-4">
                      {/* Tesla line purple */}
                      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-400/60 to-transparent rounded-t-xl" />

                      <div className="flex items-center gap-1 mb-2">
                        <p>
                          <span className="text-slate-400 font-normal text-[9px] uppercase tracking-widest">Apoyo requerido para </span>
                          <span className="text-slate-200 font-semibold text-[9px] uppercase tracking-widest">{displayName}</span>
                          <span className="text-slate-400 font-normal text-[9px] uppercase tracking-widest"> en rol de </span>
                          <span className="text-slate-200 font-semibold text-[9px] uppercase tracking-widest">{formattedPosition}</span>
                        </p>
                        <div className="group relative inline-flex items-center gap-1 cursor-help">
                          <span className="text-slate-500 text-[10px]">ⓘ</span>
                          <div className="absolute bottom-5 right-0 hidden group-hover:block w-56 bg-slate-900 border border-slate-700 rounded-lg p-3 text-[10px] text-slate-400 leading-relaxed z-20 shadow-xl">
                            Diferencia entre el nivel actual de esta persona y lo que requiere el nuevo cargo. No es una falla — es lo que la organización debe acompañar para que el ascenso sea exitoso.
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        {brechas.map(g => (
                          <div key={g.competencyCode} className="flex items-center justify-between">
                            <span className="text-[11px] text-slate-300 truncate">{g.competencyName || g.competencyCode}</span>
                            <span className="text-[10px] font-mono flex-shrink-0 ml-2 font-semibold text-purple-400">
                              {g.actualScore !== null ? Number(g.actualScore).toFixed(1) : '—'}/{Number(g.targetScore || 0).toFixed(1)}
                            </span>
                          </div>
                        ))}
                      </div>

                      <p className="text-[10px] text-slate-500 italic mt-2">
                        Estas competencias requieren desarrollo en la nueva posición.
                      </p>
                    </div>
                  )}

                  {/* Sin evaluar */}
                  {notEval.length > 0 && (
                    <div className="p-2.5 rounded-lg bg-slate-800/20 border border-slate-700/20">
                      <h4 className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-1">
                        Sin evaluar ({notEval.length})
                      </h4>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        {notEval.map(g => g.competencyName || g.competencyCode).join(' · ')}
                      </p>
                      <p className="text-[9px] text-slate-400 mt-0.5">
                        {notEval.length} competencia{notEval.length !== 1 ? 's' : ''} son nuevas para su rol actual. No son brechas — son el aprendizaje natural del ascenso, que se deben acompanar.
                      </p>
                    </div>
                  )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ═══════════ ZONA 5 — ACCIONES ═══════════ */}
          {mode === 'nominated' ? (
            <ButtonGroup spacing={8}>
              <DangerButton
                icon={UserMinus}
                size="md"
                isLoading={withdrawing}
                onClick={handleWithdraw}
              >
                {withdrawing ? 'Retirando...' : 'Retirar como sucesor'}
              </DangerButton>
              <GhostButton icon={X} size="md" onClick={onClose}>
                Cerrar
              </GhostButton>
            </ButtonGroup>
          ) : (
            <button
              onClick={handleConfirm}
              disabled={isNominating || !canConfirm}
              className={cn(
                'w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium text-sm transition-all',
                'disabled:opacity-50 disabled:cursor-not-allowed',
              )}
              style={{
                background: 'linear-gradient(135deg, #22D3EE, #0891B2)',
                boxShadow: '0 4px 20px rgba(34, 211, 238, 0.3)',
                color: '#0F172A',
              }}
            >
              {isNominating ? (
                <span className="animate-pulse">Nominando...</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Confirmar Nominacion
                </>
              )}
            </button>
          )}
        </div>

        {/* ═══════════ DISCARD CONFIRMATION ═══════════ */}
        <AnimatePresence>
          {showDiscardConfirm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-30 flex items-center justify-center rounded-[24px] bg-black/70 backdrop-blur-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 mx-6 max-w-xs w-full shadow-2xl">
                <p className="text-sm text-white font-medium mb-1">¿Descartar cambios?</p>
                <p className="text-xs text-slate-400 mb-4">
                  Tienes cambios sin guardar en el plan. Se perderan si cierras.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowDiscardConfirm(false)}
                    className="flex-1 px-3 py-2 rounded-lg text-xs font-medium text-slate-300 border border-slate-700 hover:bg-slate-800 transition-colors"
                  >
                    Volver
                  </button>
                  <button
                    onClick={() => { setShowDiscardConfirm(false); onClose() }}
                    className="flex-1 px-3 py-2 rounded-lg text-xs font-medium text-rose-400 border border-rose-500/30 hover:bg-rose-500/10 transition-colors"
                  >
                    Descartar
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Metric tooltip portal */}
      {mounted && metricTooltip && createPortal(
        <div
          style={{
            position: 'fixed',
            left: metricTooltip.x,
            top: metricTooltip.y,
            transform: metricTooltip.below ? 'translate(-50%, 0)' : 'translate(-50%, -100%)',
            zIndex: 99999,
            pointerEvents: 'none',
            transition: 'opacity 0.15s ease-out',
          }}
        >
          <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-xl max-w-[280px] p-4 shadow-2xl">
            <p className="text-xs font-semibold text-white mb-1.5">{METRIC_TOOLTIPS[metricTooltip.key].title}</p>
            {METRIC_TOOLTIPS[metricTooltip.key].lines.map((line, i) => (
              <p key={i} className="text-[10px] text-slate-300 leading-relaxed">{line}</p>
            ))}
            <p className="text-[10px] text-[#22D3EE] mt-1.5 font-medium">{METRIC_TOOLTIPS[metricTooltip.key].accent}</p>
          </div>
        </div>,
        document.body
      )}

      {/* Brain tooltip portal */}
      {mounted && createPortal(
        <div
          style={{
            position: 'fixed',
            left: brainTooltipPos.x,
            top: brainTooltipPos.y,
            transform: brainTooltipBelow ? 'translate(-50%, 0)' : 'translate(-50%, -100%)',
            zIndex: 99999,
            pointerEvents: 'none',
            opacity: showBrainTooltip ? 1 : 0,
            transition: 'opacity 0.2s ease-out',
          }}
        >
          <div className="relative bg-slate-950 border border-slate-700 rounded-xl p-2.5 shadow-2xl w-64">
            <div className="absolute inset-x-0 top-0 h-[2px] rounded-t-xl bg-gradient-to-r from-transparent via-purple-400/60 to-transparent" />
            <p className="text-[10px] text-slate-300 leading-relaxed whitespace-pre-line">
              {brainTooltipText}
            </p>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
