'use client'

import { useState } from 'react'
import { X, AlertTriangle, ChevronDown, ChevronUp, HelpCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

type GapStatus = 'READY' | 'GAP_SMALL' | 'GAP_CRITICAL' | 'NOT_EVALUATED'

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
  gaps?: GapDetail[]
}

interface SuccessionCandidateModalProps {
  candidate: CandidateProfile
  targetPosition: string
  onNominate: (overrideReadiness?: string, justification?: string) => void
  onClose: () => void
  isNominating?: boolean
}

// ════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ════════════════════════════════════════════════════════════════════════════

const READINESS_STYLES: Record<string, { color: string; text: string; label: string; description: string }> = {
  READY_NOW:       { color: '#10B981', text: 'text-emerald-400', label: 'Listo ahora',  description: 'Listo para asumir el cargo hoy' },
  READY_1_2_YEARS: { color: '#F59E0B', text: 'text-amber-400',  label: '1-2 anos',     description: 'Listo en 12-24 meses con PDI dirigido' },
  READY_3_PLUS:    { color: '#EF4444', text: 'text-rose-400',   label: '3+ anos',      description: 'Requiere 3+ anos de desarrollo' },
  NOT_VIABLE:      { color: '#64748B', text: 'text-slate-400',  label: 'No viable',    description: 'No viable para esta posicion' },
}

const OVERRIDE_OPTIONS = [
  { value: 'READY_NOW', label: 'Listo ahora' },
  { value: 'READY_1_2_YEARS', label: '1-2 anos' },
  { value: 'READY_3_PLUS', label: '3+ anos' },
]

const NINE_BOX_LABELS: Record<string, string> = {
  star: 'Estrella',
  high_performer: 'Alto Desempeno',
  consistent_star: 'Estrella Consistente',
  core_player: 'Jugador Clave',
  growth_potential: 'Potencial de Crecimiento',
  solid_contributor: 'Contribuidor Solido',
  question_mark: 'Signo de Pregunta',
  underperformer: 'Bajo Desempeno',
  risk: 'En Riesgo',
}

const NINE_BOX_DESC: Record<string, string> = {
  star: 'alto desempeno y alto potencial',
  high_performer: 'alto desempeno con potencial moderado',
  consistent_star: 'desempeno consistente y potencial alto',
  core_player: 'desempeno solido, pilar del equipo',
  growth_potential: 'potencial alto con desempeno en desarrollo',
  solid_contributor: 'contribucion estable y confiable',
  question_mark: 'potencial incierto, requiere atencion',
  underperformer: 'desempeno bajo, requiere intervencion',
  risk: 'riesgo para la organizacion',
}

const ASPIRATION_LABELS: Record<number, string> = {
  1: 'No desea ascender',
  2: 'Abierto/a a crecer',
  3: 'Busca activamente ascender',
}

// ════════════════════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════════════════════

function safeNum(val: unknown): number {
  const n = Number(val)
  return isNaN(n) ? 0 : n
}

function deriveStatus(g: GapDetail): GapStatus {
  // 1. Respect pre-computed status from SuccessionService
  if (g.status) return g.status
  // 2. Explicit notEvaluated flag
  if (g.notEvaluated) return 'NOT_EVALUATED'
  // 3. No actual score at all (null or undefined)
  if (g.actualScore == null) return 'NOT_EVALUATED'
  // 4. Score is 0 AND no current-role target → competency doesn't apply to current role
  if (g.actualScore === 0 && g.targetCurrentRole == null) return 'NOT_EVALUATED'
  // 5. No gap computed
  if (g.rawGap == null) return 'NOT_EVALUATED'
  // 6. Normal gap classification
  if (g.rawGap >= 0) return 'READY'
  if (g.rawGap > -1) return 'GAP_SMALL'
  return 'GAP_CRITICAL'
}

function generateNarrative(candidate: CandidateProfile, targetPosition: string): string[] {
  const name = (candidate.employeeName || '').split(' ')[0] || 'Candidato'
  const roleFit = safeNum(candidate.roleFitScore)
  const match = safeNum(candidate.matchPercent)
  const acts: string[] = []

  // Acto 1: Role Fit
  acts.push(`${name} fue evaluado en el ciclo 360 con ${Math.round(roleFit)}% de adecuacion a su rol actual.`)

  // Acto 2: Calibracion 9-Box
  if (candidate.nineBoxPosition) {
    const label = NINE_BOX_LABELS[candidate.nineBoxPosition] || candidate.nineBoxPosition
    const desc = NINE_BOX_DESC[candidate.nineBoxPosition] || ''
    acts.push(`En calibracion fue clasificado como "${label}"${desc ? ` — ${desc}` : ''}.`)
  }

  // Acto 3: Aspiracion
  if (candidate.potentialAspiration) {
    const aspLabel = ASPIRATION_LABELS[candidate.potentialAspiration] || `Nivel ${candidate.potentialAspiration}/3`
    const wants = candidate.potentialAspiration >= 2 ? 'quiere' : 'no quiere'
    acts.push(`Su nivel de aspiracion es ${candidate.potentialAspiration}/3 — ${aspLabel}. ${candidate.potentialAspiration >= 2 ? 'Quiere' : 'No quiere'} asumir roles mayores.`)
  }

  // Acto 4: Match + gaps + conclusion
  const allGaps = (candidate.gaps || []).map(g => ({ ...g, _status: deriveStatus(g) }))
  const evaluated = allGaps.filter(g => g._status !== 'NOT_EVALUATED')
  const criticalGaps = allGaps.filter(g => g._status === 'GAP_CRITICAL')
  const notEvaluated = allGaps.filter(g => g._status === 'NOT_EVALUATED')

  let act4 = `Para ${targetPosition}: Match ${Math.round(match)}% sobre ${evaluated.length} competencias evaluadas.`
  if (criticalGaps.length > 0) {
    act4 += ` ${criticalGaps.length} brecha${criticalGaps.length !== 1 ? 's' : ''} critica${criticalGaps.length !== 1 ? 's' : ''}.`
  }
  if (notEvaluated.length > 0) {
    act4 += ` ${notEvaluated.length} sin evaluar.`
  }

  const rs = READINESS_STYLES[candidate.readinessLevel]
  if (rs) act4 += ` Tiempo estimado: ${rs.label}.`
  acts.push(act4)

  return acts
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ════════════════════════════════════════════════════════════════════════════

export default function SuccessionCandidateModal({
  candidate,
  targetPosition,
  onNominate,
  onClose,
  isNominating,
}: SuccessionCandidateModalProps) {
  const [showOverride, setShowOverride] = useState(false)
  const [overrideReadiness, setOverrideReadiness] = useState(candidate.readinessLevel)
  const [justification, setJustification] = useState('')
  const [showAllGapRows, setShowAllGapRows] = useState(false)
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({})

  const toggleSection = (key: string) => setCollapsedSections(prev => ({ ...prev, [key]: !prev[key] }))

  const readinessStyle = READINESS_STYLES[candidate.readinessLevel] || READINESS_STYLES.NOT_VIABLE
  const roleFit = safeNum(candidate.roleFitScore)
  const matchPct = safeNum(candidate.matchPercent)

  const gaps = (candidate.gaps || []).map(g => ({ ...g, _status: deriveStatus(g) }))
  const readyGaps = gaps.filter(g => g._status === 'READY')
  const exceedsGaps = readyGaps.filter(g => g.rawGap !== null && g.rawGap > 0.5)
  const matchingGaps = readyGaps.filter(g => !g.rawGap || g.rawGap <= 0.5)
  const smallGaps = gaps.filter(g => g._status === 'GAP_SMALL')
  const criticalGaps = gaps.filter(g => g._status === 'GAP_CRITICAL')
  const notEvaluatedGaps = gaps.filter(g => g._status === 'NOT_EVALUATED')

  const initials = (candidate.employeeName || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase()

  const narrativeActs = generateNarrative(candidate, targetPosition)

  function handleConfirm() {
    if (showOverride && overrideReadiness !== candidate.readinessLevel) {
      onNominate(overrideReadiness, justification)
    } else {
      onNominate()
    }
  }

  const canConfirm = !showOverride || (
    overrideReadiness !== candidate.readinessLevel
      ? justification.trim().length > 0
      : true
  )

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-[60] bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl bg-[#0F172A]/95 backdrop-blur-2xl border border-slate-700/50 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Tesla line top */}
        <div
          className="h-[3px] w-full rounded-t-2xl"
          style={{
            background: `linear-gradient(90deg, transparent, ${readinessStyle.color}, transparent)`,
            boxShadow: `0 0 15px ${readinessStyle.color}`,
          }}
        />

        {/* ── HEADER: Identidad ── */}
        <div className="p-6 border-b border-slate-700/50">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-full border-2 flex items-center justify-center text-lg font-bold"
                style={{ borderColor: readinessStyle.color + '40', background: '#0B1120', color: readinessStyle.color }}
              >
                {initials || '?'}
              </div>
              <div>
                <h2 className="text-lg font-medium text-white">{candidate.employeeName || 'Sin nombre'}</h2>
                <p className="text-sm text-slate-400">
                  {candidate.position || 'Sin cargo'}
                  {candidate.departmentName ? ` · ${candidate.departmentName}` : ''}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-200 transition-colors p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Badges row */}
          <div className="flex flex-wrap items-center gap-2 mt-4">
            <span className={cn(
              'px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border',
              readinessStyle.text
            )} style={{ borderColor: readinessStyle.color + '40', background: readinessStyle.color + '15' }}>
              {candidate.readinessLabel || readinessStyle.label}
            </span>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              Fit {Math.round(roleFit)}%
            </span>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold font-mono bg-white/5 text-white border border-white/10">
              Match {Math.round(matchPct)}%
            </span>
            {candidate.nineBoxPosition && (
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/30">
                {NINE_BOX_LABELS[candidate.nineBoxPosition] || candidate.nineBoxPosition}
              </span>
            )}
            {candidate.flightRisk === 'HIGH' && (
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Riesgo fuga
              </span>
            )}
          </div>
        </div>

        {/* ── SECCION 1: Analisis de Inteligencia (narrativa) ── */}
        <div className="p-6 border-b border-slate-700/50">
          <h3 className="text-xs text-slate-500 uppercase tracking-wider mb-3 font-bold">
            Analisis de Inteligencia
          </h3>
          <div className="space-y-2">
            {narrativeActs.map((act, i) => (
              <p key={i} className="text-sm text-slate-300 leading-relaxed">
                {act}
              </p>
            ))}
          </div>
        </div>

        {/* ── SECCION 2: Resumen Gaps (badges horizontales) ── */}
        {gaps.length > 0 && (
          <div className="px-6 py-4 border-b border-slate-700/50">
            <div className="flex flex-wrap gap-2">
              {matchingGaps.length > 0 && (
                <span className="px-3 py-1.5 rounded-lg text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {matchingGaps.length} Cumple
                </span>
              )}
              {exceedsGaps.length > 0 && (
                <span className="px-3 py-1.5 rounded-lg text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  {exceedsGaps.length} Supera
                </span>
              )}
              {smallGaps.length > 0 && (
                <span className="px-3 py-1.5 rounded-lg text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  {smallGaps.length} Mejora
                </span>
              )}
              {criticalGaps.length > 0 && (
                <span className="px-3 py-1.5 rounded-lg text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  {criticalGaps.length} Criticas
                </span>
              )}
              {notEvaluatedGaps.length > 0 && (
                <span className="px-3 py-1.5 rounded-lg text-[10px] font-bold bg-slate-500/10 text-slate-400 border border-slate-500/20">
                  {notEvaluatedGaps.length} Sin evaluar
                </span>
              )}
            </div>
          </div>
        )}

        {/* ── SECCION 3: Tabla Competencias (3 dimensiones colapsables) ── */}
        {gaps.length > 0 && (
          <div className="p-6 border-b border-slate-700/50 space-y-4">

            {/* A — LISTO (READY) */}
            {readyGaps.length > 0 && (
              <div>
                <button
                  onClick={() => toggleSection('ready')}
                  className="flex items-center gap-2 text-xs text-emerald-400 uppercase tracking-wider mb-2 font-bold hover:text-emerald-300 transition-colors w-full"
                >
                  {collapsedSections.ready ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
                  Listo ({readyGaps.length})
                </button>
                {!collapsedSections.ready && (
                  <div className="space-y-1.5">
                    {readyGaps.map(g => (
                      <div
                        key={g.competencyCode}
                        className="flex items-center justify-between p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/20"
                      >
                        <div className="flex-1 min-w-0">
                          <span className="text-sm text-slate-200 truncate block">{g.competencyName || g.competencyCode}</span>
                          <span className="text-[10px] text-slate-500">{g.category || '—'}</span>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <span className="text-xs text-emerald-400 font-mono">
                            {g.actualScore !== null ? Number(g.actualScore).toFixed(1) : '—'}/{Number(g.targetScore || 0).toFixed(1)}
                          </span>
                          <span className="fhr-badge fhr-badge-success text-[9px]">Cumple</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* B — BRECHAS A DESARROLLAR (GAP_SMALL + GAP_CRITICAL) */}
            {(smallGaps.length + criticalGaps.length) > 0 && (
              <div>
                <button
                  onClick={() => toggleSection('gaps')}
                  className="flex items-center gap-2 text-xs text-amber-400 uppercase tracking-wider mb-2 font-bold hover:text-amber-300 transition-colors w-full"
                >
                  {collapsedSections.gaps ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
                  Brechas a Desarrollar ({smallGaps.length + criticalGaps.length})
                </button>
                {!collapsedSections.gaps && (
                  <>
                    <div className="space-y-1.5">
                      {(showAllGapRows
                        ? [...criticalGaps, ...smallGaps]
                        : [...criticalGaps, ...smallGaps].slice(0, 6)
                      ).map(g => (
                        <div
                          key={g.competencyCode}
                          className="flex items-center justify-between p-2.5 rounded-lg bg-slate-800/40 border border-slate-700/30"
                        >
                          <div className="flex-1 min-w-0">
                            <span className="text-sm text-slate-200 truncate block">{g.competencyName || g.competencyCode}</span>
                            <span className="text-[10px] text-slate-500">{g.category || '—'}</span>
                          </div>
                          <div className="flex items-center gap-3 flex-shrink-0">
                            <span className="text-xs text-slate-400 font-mono w-8 text-right">
                              {g.actualScore !== null ? Number(g.actualScore).toFixed(1) : '—'}
                            </span>
                            <span className="text-[10px] text-slate-600">/</span>
                            <span className="text-xs text-slate-400 font-mono w-8">
                              {Number(g.targetScore || 0).toFixed(1)}
                            </span>
                            <span className={cn(
                              'text-xs font-mono w-12 text-right',
                              g._status === 'GAP_CRITICAL' ? 'text-rose-400' : 'text-amber-400'
                            )}>
                              {g.rawGap !== null ? Number(g.rawGap).toFixed(1) : '—'}
                            </span>
                            <span className={`fhr-badge ${g._status === 'GAP_CRITICAL' ? 'fhr-badge-error' : 'fhr-badge-warning'} text-[9px]`}>
                              {g._status === 'GAP_CRITICAL' ? 'Critica' : 'Menor'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                    {(smallGaps.length + criticalGaps.length) > 6 && (
                      <button
                        className="mt-2 text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
                        onClick={() => setShowAllGapRows(!showAllGapRows)}
                      >
                        {showAllGapRows ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        {showAllGapRows ? 'Ver menos' : `Ver todas (${smallGaps.length + criticalGaps.length})`}
                      </button>
                    )}
                  </>
                )}
              </div>
            )}

            {/* C — SIN EVALUACION PREVIA (NOT_EVALUATED) */}
            {notEvaluatedGaps.length > 0 && (
              <div>
                <button
                  onClick={() => toggleSection('noteval')}
                  className="flex items-center gap-2 text-xs text-slate-400 uppercase tracking-wider mb-2 font-bold hover:text-slate-300 transition-colors w-full"
                >
                  {collapsedSections.noteval ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
                  <HelpCircle className="w-3 h-3" />
                  Sin evaluacion previa ({notEvaluatedGaps.length})
                </button>
                {!collapsedSections.noteval && (
                  <>
                    <div className="p-3 rounded-lg bg-slate-800/30 border border-slate-700/20 mb-2">
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        Estas competencias aplican al cargo objetivo pero no han sido evaluadas en el rol actual.
                        Requiere evaluacion ejecutiva antes de promover.
                      </p>
                    </div>
                    <div className="space-y-1">
                      {notEvaluatedGaps.map(g => (
                        <div
                          key={g.competencyCode}
                          className="flex items-center justify-between p-2 rounded-lg bg-slate-800/20 border border-slate-700/20"
                        >
                          <div className="flex-1 min-w-0">
                            <span className="text-sm text-slate-400 truncate block">{g.competencyName || g.competencyCode}</span>
                            <span className="text-[10px] text-slate-600">{g.category || '—'}</span>
                          </div>
                          <span className="fhr-badge fhr-badge-draft text-[9px] flex-shrink-0">Sin evaluar</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── SECCION 4: Tiempo Estimado ── */}
        <div className="px-6 py-5 border-b border-slate-700/50 flex justify-center">
          <div
            className="px-6 py-3 rounded-xl text-center border"
            style={{
              borderColor: readinessStyle.color + '40',
              background: readinessStyle.color + '10',
            }}
          >
            <span className="text-lg font-bold" style={{ color: readinessStyle.color }}>
              {readinessStyle.label}
            </span>
            <p className="text-xs text-slate-400 mt-1">
              {readinessStyle.description}
            </p>
          </div>
        </div>

        {/* ── SECCION 5: Override Humano ── */}
        <div className="p-6 border-b border-slate-700/50">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showOverride}
              onChange={e => setShowOverride(e.target.checked)}
              className="rounded border-slate-600 bg-slate-800 text-cyan-500 focus:ring-cyan-500/30"
            />
            <span className="text-sm text-slate-400">Modificar estimacion del sistema</span>
          </label>

          {showOverride && (
            <div className="mt-4 space-y-3">
              <div>
                <label className="fhr-text-sm text-slate-400 block mb-1">Readiness</label>
                <select
                  className="fhr-input w-full"
                  value={overrideReadiness}
                  onChange={e => setOverrideReadiness(e.target.value)}
                >
                  {OVERRIDE_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="fhr-text-sm text-slate-400 block mb-1">
                  Justificacion <span className="text-rose-400">*</span>
                </label>
                <textarea
                  className="fhr-input w-full min-h-[80px] resize-none"
                  placeholder="Justificacion del cambio..."
                  value={justification}
                  onChange={e => setJustification(e.target.value)}
                />
                {overrideReadiness !== candidate.readinessLevel && justification.trim().length === 0 && (
                  <p className="text-xs text-rose-400 mt-1">La justificacion es obligatoria al cambiar la estimacion</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── SECCION 6: CTA ── */}
        <div className="p-6 flex gap-3">
          <button onClick={onClose} className="fhr-btn fhr-btn-ghost flex-1">
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={isNominating || !canConfirm}
            className="fhr-btn fhr-btn-primary flex-1"
          >
            {isNominating ? 'Nominando...' : 'Confirmar Nominacion'}
          </button>
        </div>
      </motion.div>
    </div>
  )
}
