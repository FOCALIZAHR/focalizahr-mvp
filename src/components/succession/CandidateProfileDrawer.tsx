// src/components/succession/CandidateProfileDrawer.tsx
'use client'

import { useState } from 'react'
import { X, AlertTriangle, ChevronDown, ChevronUp, HelpCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

// ════════════════════════════════════════════════════════════════════════════
// TYPES (mirrors SuccessionService.CompetencyGapDetail)
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
  gaps?: GapDetail[]
}

interface CandidateProfileDrawerProps {
  candidate: CandidateProfile
  targetPosition: string
  onNominate: (overrideReadiness?: string, justification?: string) => void
  onClose: () => void
  isNominating?: boolean
}

// ════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ════════════════════════════════════════════════════════════════════════════

const READINESS_STYLES: Record<string, { line: string; text: string; label: string }> = {
  READY_NOW:       { line: 'bg-emerald-500', text: 'text-emerald-400', label: 'Listo ahora' },
  READY_1_2_YEARS: { line: 'bg-amber-500',   text: 'text-amber-400',  label: '1-2 anos' },
  READY_3_PLUS:    { line: 'bg-rose-500',     text: 'text-rose-400',   label: '3+ anos' },
  NOT_VIABLE:      { line: 'bg-slate-600',    text: 'text-slate-400',  label: 'No viable' },
}

const OVERRIDE_OPTIONS = [
  { value: 'READY_NOW', label: 'Listo ahora' },
  { value: 'READY_1_2_YEARS', label: '1-2 anos' },
  { value: 'READY_3_PLUS', label: '3+ anos' },
]

// ════════════════════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════════════════════

function deriveStatus(g: GapDetail): GapStatus {
  if (g.status) return g.status
  // Backward compat: derive from rawGap
  if (g.actualScore === null || g.notEvaluated) return 'NOT_EVALUATED'
  if (g.rawGap === null) return 'NOT_EVALUATED'
  if (g.rawGap >= 0) return 'READY'
  if (g.rawGap > -1) return 'GAP_SMALL'
  return 'GAP_CRITICAL'
}

// ════════════════════════════════════════════════════════════════════════════
// NARRATIVE GENERATOR (3-dimension aware)
// ════════════════════════════════════════════════════════════════════════════

function generateNarrative(
  candidate: CandidateProfile,
  targetPosition: string
): string {
  const { employeeName, roleFitScore, matchPercent, readinessLevel, gaps } = candidate
  const name = employeeName.split(' ')[0]

  const allGaps = (gaps || []).map(g => ({ ...g, _status: deriveStatus(g) }))
  const realGaps = allGaps.filter(g => g._status === 'GAP_SMALL' || g._status === 'GAP_CRITICAL')
  const notEvaluated = allGaps.filter(g => g._status === 'NOT_EVALUATED')
  const worstGap = realGaps.sort((a, b) => (a.rawGap ?? 0) - (b.rawGap ?? 0))[0]

  let base: string
  switch (readinessLevel) {
    case 'READY_NOW':
      base = `${name} esta lista para asumir ${targetPosition} hoy. Su adecuacion al rol es del ${Math.round(roleFitScore)}% con un match de ${Math.round(matchPercent)}% contra las competencias evaluadas del cargo. No presenta brechas bloqueantes.`
      break
    case 'READY_1_2_YEARS':
      base = `${name} tiene un perfil solido con ${Math.round(roleFitScore)}% de adecuacion al rol y ${Math.round(matchPercent)}% de match.${worstGap ? ` Su principal brecha es ${worstGap.competencyName} (${worstGap.rawGap?.toFixed(1)} puntos vs target), competencia ${worstGap.category === 'STRATEGIC' ? 'estrategica' : 'relevante'} para ${targetPosition}.` : ''} Con desarrollo dirigido, puede estar lista en 1-2 anos.`
      break
    case 'READY_3_PLUS':
      base = `${name} muestra potencial con ${Math.round(roleFitScore)}% de adecuacion al rol. Presenta brechas en ${realGaps.length} competencia${realGaps.length !== 1 ? 's' : ''}${realGaps.length >= 2 ? `, incluyendo ${realGaps[0].competencyName} y ${realGaps[1].competencyName}` : worstGap ? `, incluyendo ${worstGap.competencyName}` : ''}. Requiere plan de desarrollo de largo plazo (3+ anos).`
      break
    default:
      base = `${name} tiene un match del ${Math.round(matchPercent)}% para ${targetPosition}. Se requiere analisis adicional para determinar viabilidad.`
  }

  // Append NOT_EVALUATED dimension
  if (notEvaluated.length > 0) {
    base += ` Adicionalmente, ${notEvaluated.length} competencia${notEvaluated.length !== 1 ? 's' : ''} del cargo objetivo no ha${notEvaluated.length !== 1 ? 'n' : ''} sido evaluada${notEvaluated.length !== 1 ? 's' : ''} previamente en su rol actual — esto no es una brecha confirmada, sino una incognita que requiere evaluacion.`
  }

  return base
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ════════════════════════════════════════════════════════════════════════════

export default function CandidateProfileDrawer({
  candidate,
  targetPosition,
  onNominate,
  onClose,
  isNominating,
}: CandidateProfileDrawerProps) {
  const [showOverride, setShowOverride] = useState(false)
  const [overrideReadiness, setOverrideReadiness] = useState(candidate.readinessLevel)
  const [justification, setJustification] = useState('')
  const [showAllGapRows, setShowAllGapRows] = useState(false)

  const style = READINESS_STYLES[candidate.readinessLevel] || READINESS_STYLES.NOT_VIABLE
  const gaps = (candidate.gaps || []).map(g => ({ ...g, _status: deriveStatus(g) }))

  // 3 sections
  const readyGaps = gaps.filter(g => g._status === 'READY')
  const realGaps = gaps.filter(g => g._status === 'GAP_SMALL' || g._status === 'GAP_CRITICAL')
  const notEvaluatedGaps = gaps.filter(g => g._status === 'NOT_EVALUATED')

  const initials = candidate.employeeName
    .split(' ')
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase()

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
    <div className="fixed inset-0 z-[60] flex justify-end bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-lg h-full overflow-y-auto bg-[#0F172A] border-l border-slate-700/50 shadow-2xl">
        {/* Tesla line top */}
        <div className={cn('h-[3px] w-full', style.line)} />

        {/* Header */}
        <div className="p-6 border-b border-slate-700/50">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-[#0B1120] border-2 border-slate-700 flex items-center justify-center text-lg font-bold text-slate-300">
                {initials}
              </div>
              <div>
                <h2 className="text-lg font-medium text-white">{candidate.employeeName}</h2>
                <p className="text-sm text-slate-400">{candidate.position || 'Sin cargo'}</p>
                {candidate.departmentName && (
                  <p className="text-xs text-slate-500">{candidate.departmentName}</p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-200 transition-colors p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Metrics row */}
          <div className="flex items-center gap-4 mt-4">
            <span className={cn('text-sm font-medium', style.text)}>
              {candidate.readinessLabel || style.label}
            </span>
            <span className="text-xs text-slate-500 font-mono">
              Fit <span className="text-cyan-400 font-bold">{Math.round(candidate.roleFitScore)}%</span>
            </span>
            <span className="text-xs text-slate-500 font-mono">
              Match <span className="text-white font-bold">{Math.round(candidate.matchPercent)}%</span>
            </span>
            {candidate.flightRisk === 'HIGH' && (
              <span className="text-xs text-rose-400 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Riesgo fuga
              </span>
            )}
          </div>
        </div>

        {/* SECCION 2 — Narrativa de Inteligencia */}
        <div className="p-6 border-b border-slate-700/50">
          <h3 className="text-xs text-slate-500 uppercase tracking-wider mb-3">
            Analisis de Inteligencia
          </h3>
          <p className="text-sm text-slate-300 leading-relaxed">
            {generateNarrative(candidate, targetPosition)}
          </p>
        </div>

        {/* SECCION 3 — Desglose de Competencias (3 sub-secciones) */}
        {gaps.length > 0 && (
          <div className="p-6 border-b border-slate-700/50 space-y-5">

            {/* SECCION A — Listo (READY) */}
            {readyGaps.length > 0 && (
              <div>
                <h3 className="text-xs text-emerald-400 uppercase tracking-wider mb-2">
                  Cumple ({readyGaps.length})
                </h3>
                <div className="space-y-1.5">
                  {readyGaps.map(g => (
                    <div
                      key={g.competencyCode}
                      className="flex items-center justify-between p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/20"
                    >
                      <div className="flex-1 min-w-0">
                        <span className="text-sm text-slate-200 truncate block">{g.competencyName}</span>
                        <span className="text-[10px] text-slate-500">{g.category}</span>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className="text-xs text-emerald-400 font-mono">
                          {g.actualScore !== null ? g.actualScore.toFixed(1) : '—'}/{g.targetScore.toFixed(1)}
                        </span>
                        <span className="fhr-badge fhr-badge-success text-[9px]">Cumple</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SECCION B — Brechas a Desarrollar (GAP_SMALL + GAP_CRITICAL) */}
            {realGaps.length > 0 && (
              <div>
                <h3 className="text-xs text-amber-400 uppercase tracking-wider mb-2">
                  Brechas a Desarrollar ({realGaps.length})
                </h3>
                <div className="space-y-1.5">
                  {(showAllGapRows ? realGaps : realGaps.slice(0, 6)).map(g => (
                    <div
                      key={g.competencyCode}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-slate-800/40 border border-slate-700/30"
                    >
                      <div className="flex-1 min-w-0">
                        <span className="text-sm text-slate-200 truncate block">{g.competencyName}</span>
                        <span className="text-[10px] text-slate-500">{g.category}</span>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className="text-xs text-slate-400 font-mono w-8 text-right">
                          {g.actualScore !== null ? g.actualScore.toFixed(1) : '—'}
                        </span>
                        <span className="text-[10px] text-slate-600">/</span>
                        <span className="text-xs text-slate-400 font-mono w-8">
                          {g.targetScore.toFixed(1)}
                        </span>
                        <span className={cn(
                          'text-xs font-mono w-12 text-right',
                          g._status === 'GAP_CRITICAL' ? 'text-rose-400' : 'text-amber-400'
                        )}>
                          {g.rawGap !== null ? g.rawGap.toFixed(1) : '—'}
                        </span>
                        <span className={`fhr-badge ${g._status === 'GAP_CRITICAL' ? 'fhr-badge-error' : 'fhr-badge-warning'} text-[9px]`}>
                          {g._status === 'GAP_CRITICAL' ? 'Critica' : 'Menor'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                {realGaps.length > 6 && (
                  <button
                    className="mt-2 text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
                    onClick={() => setShowAllGapRows(!showAllGapRows)}
                  >
                    {showAllGapRows ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    {showAllGapRows ? 'Ver menos' : `Ver todas (${realGaps.length})`}
                  </button>
                )}
              </div>
            )}

            {/* SECCION C — Sin evaluacion previa (NOT_EVALUATED) */}
            {notEvaluatedGaps.length > 0 && (
              <div>
                <h3 className="text-xs text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <HelpCircle className="w-3 h-3" />
                  Sin evaluacion previa ({notEvaluatedGaps.length})
                </h3>
                <div className="p-3 rounded-lg bg-slate-800/30 border border-slate-700/20 mb-2">
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Estas competencias aplican al cargo objetivo pero no han sido evaluadas en el rol actual del candidato.
                    Se recomienda un ciclo de evaluacion ejecutiva antes de promover.
                  </p>
                </div>
                <div className="space-y-1">
                  {notEvaluatedGaps.map(g => (
                    <div
                      key={g.competencyCode}
                      className="flex items-center justify-between p-2 rounded-lg bg-slate-800/20 border border-slate-700/20"
                    >
                      <div className="flex-1 min-w-0">
                        <span className="text-sm text-slate-400 truncate block">{g.competencyName}</span>
                        <span className="text-[10px] text-slate-600">{g.category}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs text-slate-600 font-mono">
                          —/{g.targetScore.toFixed(1)}
                        </span>
                        <span className="fhr-badge fhr-badge-draft text-[9px]">Sin evaluar</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* SECCION 4 — Override Humano */}
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

        {/* SECCION 5 — CTA */}
        <div className="p-6 flex gap-3">
          <button
            onClick={onClose}
            className="fhr-btn fhr-btn-ghost flex-1"
          >
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
      </div>
    </div>
  )
}
