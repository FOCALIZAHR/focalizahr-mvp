'use client'

import { useState } from 'react'
import { Crown, ChevronDown, ChevronUp, Filter, ArrowLeft } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import SuccessionCandidateCard from '@/components/succession/SuccessionCandidateCard'
import DominoEffect from '@/components/succession/DominoEffect'

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

interface CriticalPosition {
  id: string
  positionTitle: string
  standardJobLevel: string
  benchStrength: string
  incumbentFlightRisk: string | null
  department: { displayName: string } | null
  incumbent: { id: string; fullName: string; position: string } | null
  _count: { candidates: number }
}

export interface SuccessionSpotlightCardProps {
  position: CriticalPosition
  positionDetail: any
  suggestions: any[]
  loadingSuggestions: boolean
  suggestionsFilter: 'all' | 'area'
  recentNomination: { name: string } | null
  promotingCandidate: { name: string; position: string; department?: string } | null
  nominating: string | null
  canManage: boolean
  onBack: () => void
  onLoadSuggestions: (filterByArea?: boolean) => void
  onFilterChange: (mode: 'all' | 'area') => void
  onCandidateClick: (candidate: any) => void
  onPromotingCandidate: (c: { name: string; position: string; department?: string } | null) => void
}

// ════════════════════════════════════════════════════════════════════════════
// SMART BADGES
// ════════════════════════════════════════════════════════════════════════════

interface Badge { label: string; color: string }

const NINE_BOX_TOP = ['star', 'high_performer', 'consistent_star']

function deriveBadges(s: any): Badge[] {
  const badges: Badge[] = []
  const fit = s.roleFitScore ?? s.currentRoleFit ?? 0
  const aspiration = s.potentialAspiration

  if (fit >= 75 && aspiration === 3) {
    badges.push({ label: 'Sucesor Natural', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' })
  }
  if (s.nineBoxPosition && NINE_BOX_TOP.includes(s.nineBoxPosition)) {
    badges.push({ label: 'Top Performer', color: 'bg-amber-500/20 text-amber-400 border-amber-500/40' })
  }
  if (aspiration === 3 && !(fit >= 75 && aspiration === 3)) {
    badges.push({ label: 'Quiere Crecer', color: 'bg-purple-500/20 text-purple-400 border-purple-500/40' })
  }
  if (s.gapsCriticalCount === 0 || (s.gaps && s.gaps.filter((g: any) => g.status === 'GAP_CRITICAL').length === 0)) {
    badges.push({ label: 'Sin Gaps Criticos', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40' })
  }
  if (s.flightRisk === 'HIGH') {
    badges.push({ label: 'Riesgo Fuga', color: 'bg-rose-500/20 text-rose-400 border-rose-500/40' })
  }
  return badges
}

// ════════════════════════════════════════════════════════════════════════════
// TESLA LINE COLOR
// ════════════════════════════════════════════════════════════════════════════

function getTeslaStyle(position: CriticalPosition, candidateCount: number) {
  if (candidateCount === 0) return { color: '#EF4444' }
  if (position.benchStrength === 'STRONG' || position.benchStrength === 'MODERATE') return { color: '#22D3EE' }
  return { color: '#F59E0B' }
}

const BENCH_LABELS: Record<string, string> = {
  STRONG: 'Fuerte',
  MODERATE: 'Moderado',
  WEAK: 'Debil',
  NONE: 'Sin cobertura',
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENT (cloned from SpotlightCard.tsx evaluator)
// ════════════════════════════════════════════════════════════════════════════

export default function SuccessionSpotlightCard({
  position,
  positionDetail,
  suggestions,
  loadingSuggestions,
  suggestionsFilter,
  recentNomination,
  promotingCandidate,
  nominating,
  canManage,
  onBack,
  onLoadSuggestions,
  onFilterChange,
  onCandidateClick,
  onPromotingCandidate,
}: SuccessionSpotlightCardProps) {
  const [tab, setTab] = useState<'candidates' | 'suggestions'>('candidates')
  const [showMethodology, setShowMethodology] = useState(false)
  const rawCandidates = positionDetail?.candidates || []

  // Sort candidates: READY_NOW > READY_1_2 > READY_3_PLUS, then matchPercent DESC
  const READINESS_ORDER: Record<string, number> = {
    READY_NOW: 0,
    READY_1_2_YEARS: 1,
    READY_1_2: 1,
    READY_3_PLUS: 2,
    NOT_VIABLE: 3,
  }
  const candidates = [...rawCandidates].sort((a: any, b: any) => {
    const aReadiness = a.readinessOverride || a.readinessLevel || ''
    const bReadiness = b.readinessOverride || b.readinessLevel || ''
    const aOrder = READINESS_ORDER[aReadiness] ?? 99
    const bOrder = READINESS_ORDER[bReadiness] ?? 99
    if (aOrder !== bOrder) return aOrder - bOrder
    return (b.matchPercent || 0) - (a.matchPercent || 0)
  })

  const tesla = getTeslaStyle(position, candidates.length)

  // Initials from position title
  const initials = position.positionTitle
    .split(' ')
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase()

  // Methodology stats
  const withHighFit = suggestions.filter((s: any) => (s.roleFitScore ?? 0) >= 75).length
  const wantToGrow = suggestions.filter((s: any) => s.potentialAspiration === 3).length
  const noGapsCritical = suggestions.filter((s: any) =>
    s.gapsCriticalCount === 0 || (s.gaps && s.gaps.filter((g: any) => g.status === 'GAP_CRITICAL').length === 0)
  ).length

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 30 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 30 }}
      transition={{ type: 'spring', stiffness: 220, damping: 30 }}
      className="w-full max-w-5xl"
    >
      <div className="bg-[#0F172A]/90 backdrop-blur-2xl border border-slate-800 rounded-[24px] shadow-2xl flex flex-col md:flex-row relative overflow-y-auto md:overflow-visible">

        {/* TESLA LINE */}
        <div
          className="absolute top-0 left-0 right-0 h-[1px] z-20"
          style={{
            background: `linear-gradient(90deg, transparent, ${tesla.color}, transparent)`,
            boxShadow: `0 0 15px ${tesla.color}`
          }}
        />

        {/* Back button */}
        <button
          onClick={onBack}
          className="absolute top-6 left-6 z-20 flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-[10px] font-bold uppercase tracking-wider bg-black/20 backdrop-blur px-3 py-1.5 rounded-lg border border-white/5 hover:border-white/20"
        >
          <ArrowLeft className="w-3 h-3" /> Pipeline
        </button>

        {/* ── LEFT COLUMN: Identity (250px, cloned from SpotlightCard) ── */}
        <div className="w-full md:w-[250px] md:flex-shrink-0 bg-slate-900/50 p-8 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-800">

          {/* Avatar */}
          <div className="relative mb-6">
            <div className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-gradient-to-br from-slate-800 to-slate-950 flex items-center justify-center text-2xl font-bold text-slate-400 border border-slate-700 shadow-2xl">
              {initials}
            </div>

            {/* Bench strength badge below avatar */}
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2">
              <span className={cn(
                'px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border',
                position.benchStrength === 'STRONG' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' :
                position.benchStrength === 'MODERATE' ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40' :
                position.benchStrength === 'WEAK' ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' :
                position.benchStrength === 'NONE' ? 'bg-rose-500/20 text-rose-400 border-rose-500/40' :
                'bg-slate-700/50 text-slate-400 border-slate-600'
              )}>
                {BENCH_LABELS[position.benchStrength] || 'Sin datos'}
              </span>
            </div>
          </div>

          {/* Info */}
          <div className="text-center mt-4">
            <h2 className="text-xl font-bold text-white mb-1 tracking-tight">
              {position.positionTitle}
            </h2>
            <p className="text-sm text-slate-400 font-medium mb-1">
              {position.department?.displayName || 'Sin departamento'}
            </p>
            {position.incumbent && (
              <p className="text-xs text-slate-600 mb-4">
                Titular: {position.incumbent.fullName}
              </p>
            )}
          </div>

          {/* Metrics */}
          <div className="w-full space-y-2 mt-2">
            <div className="flex justify-between text-xs px-2">
              <span className="text-slate-500">Nominados</span>
              <span className="text-white font-bold">{candidates.length}</span>
            </div>
            {candidates.length > 0 && (() => {
              const best = candidates[0]
              const effective = best.readinessOverride || best.readinessLevel
              return (
                <div className="flex justify-between text-xs px-2">
                  <span className="text-slate-500">Mejor</span>
                  <span className="text-slate-300 text-[10px]">{best.employee?.fullName}</span>
                </div>
              )
            })()}
          </div>

          {/* Methodology panel (collapsible) */}
          {suggestions.length > 0 && (
            <div className="w-full mt-4">
              <button
                onClick={() => setShowMethodology(!showMethodology)}
                className="flex items-center gap-2 text-[10px] text-slate-500 hover:text-slate-300 transition-colors w-full px-2"
              >
                {showMethodology ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                Como seleccionamos?
              </button>
              <AnimatePresence>
                {showMethodology && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-2 p-3 rounded-lg bg-black/20 border border-slate-800 text-[10px] text-slate-400 space-y-1">
                      <p className="text-slate-300 font-medium">De {suggestions.length} elegibles:</p>
                      <p><span className="text-emerald-400">✓</span> {withHighFit} Role Fit ≥75%</p>
                      <p><span className="text-emerald-400">✓</span> {wantToGrow} quieren ascender</p>
                      <p><span className="text-emerald-400">✓</span> {noGapsCritical} sin gaps criticos</p>
                      <p className="text-slate-600">Orden: Readiness → Match%</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* ── RIGHT COLUMN (cloned from StorytellingGuide area) ── */}
        <div className="flex-1 flex flex-col min-h-[500px] pt-4 bg-gradient-to-br from-[#0F172A] to-[#162032]">

          {/* Tabs */}
          <div className="flex border-b border-slate-800 px-6">
            <button
              className={cn(
                'px-5 py-3 text-[11px] font-bold uppercase tracking-wider transition-colors',
                tab === 'candidates' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-500 hover:text-slate-300'
              )}
              onClick={() => setTab('candidates')}
            >
              Candidatos ({candidates.length})
            </button>
            {canManage && (
              <button
                className={cn(
                  'px-5 py-3 text-[11px] font-bold uppercase tracking-wider transition-colors',
                  tab === 'suggestions' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-500 hover:text-slate-300'
                )}
                onClick={() => {
                  setTab('suggestions')
                  if (suggestions.length === 0 && !loadingSuggestions) onLoadSuggestions(suggestionsFilter === 'area')
                }}
              >
                Sugeridos
              </button>
            )}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {tab === 'candidates' ? (
              candidates.length > 0 ? (
                <div className="space-y-3">
                  {candidates.map((c: any, idx: number) => {
                    const effective = c.readinessOverride || c.readinessLevel
                    const rankBadge = idx < 3 ? `#${idx + 1}` : null
                    return (
                      <div key={c.id} className="space-y-2">
                        <div
                          className="cursor-pointer relative"
                          onClick={() => {
                            // gapsJson is stored as Prisma Json — parse if string
                            const rawGaps = c.gapsJson ?? c.gaps
                            const gaps = typeof rawGaps === 'string' ? JSON.parse(rawGaps) : rawGaps
                            onCandidateClick({
                              employeeId: c.employeeId || c.employee?.id,
                              employeeName: c.employee?.fullName || c.employeeName,
                              position: c.employee?.position || c.position,
                              departmentName: c.employee?.department?.displayName || c.departmentName,
                              roleFitScore: c.currentRoleFit ?? c.roleFitScore ?? 0,
                              nineBoxPosition: c.nineBoxPosition || null,
                              matchPercent: c.matchPercent ?? 0,
                              readinessLevel: effective,
                              readinessLabel: c.readinessLabel || '',
                              flightRisk: c.flightRisk || null,
                              gapsCriticalCount: c.gapsCriticalCount ?? 0,
                              potentialAspiration: c.aspirationLevel ?? c.potentialAspiration,
                              gaps: Array.isArray(gaps) ? gaps : [],
                            })
                          }}
                        >
                          {rankBadge && (
                            <span className={cn(
                              'absolute -left-1 -top-1 z-10 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black',
                              idx === 0 ? 'bg-amber-400 text-slate-950' :
                              idx === 1 ? 'bg-slate-300 text-slate-950' :
                              'bg-amber-700 text-white'
                            )}>
                              {rankBadge}
                            </span>
                          )}
                          <SuccessionCandidateCard
                            candidate={{
                              id: c.id,
                              employeeId: c.employeeId || c.employee?.id,
                              employeeName: c.employee.fullName,
                              position: c.employee.position,
                              departmentName: c.employee.department?.displayName,
                              currentRoleFit: c.currentRoleFit,
                              matchPercent: c.matchPercent,
                              readinessLevel: effective,
                              flightRisk: c.flightRisk,
                              hasPDI: !!c.developmentPlan,
                            }}
                            onViewPDI={c.developmentPlan ? () => {
                              window.open(`/dashboard/pdi/${c.developmentPlan.id}`, '_blank')
                            } : undefined}
                          />
                        </div>
                        {canManage && effective === 'READY_NOW' && (
                          <button
                            className="ml-11 text-[10px] text-emerald-400 hover:text-emerald-300 transition-colors"
                            onClick={() => onPromotingCandidate({
                              name: c.employee.fullName,
                              position: c.employee.position || 'Posicion actual',
                              department: c.employee.department?.displayName,
                            })}
                          >
                            Ver efecto domino
                          </button>
                        )}
                      </div>
                    )
                  })}

                  {promotingCandidate && (
                    <div className="mt-4 p-4 rounded-lg bg-black/20 border border-slate-800">
                      <DominoEffect
                        candidateName={promotingCandidate.name}
                        targetPosition={position.positionTitle}
                        chain={[{
                          positionTitle: promotingCandidate.position,
                          employeeName: promotingCandidate.name,
                          department: promotingCandidate.department,
                          action: 'VACANT',
                        }]}
                      />
                      <button
                        className="mt-3 text-[10px] text-slate-400 hover:text-slate-300"
                        onClick={() => onPromotingCandidate(null)}
                      >
                        Cerrar
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-500">
                  <Crown className="w-10 h-10 mb-3 opacity-20" />
                  <p className="text-sm">Sin candidatos nominados</p>
                  {canManage && (
                    <button
                      className="mt-4 bg-cyan-400 hover:bg-cyan-300 text-slate-950 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all shadow-[0_2px_10px_rgba(34,211,238,0.3)]"
                      onClick={() => {
                        setTab('suggestions')
                        if (suggestions.length === 0 && !loadingSuggestions) onLoadSuggestions(suggestionsFilter === 'area')
                      }}
                    >
                      Buscar sugeridos
                    </button>
                  )}
                </div>
              )
            ) : (
              <>
                {/* Filter toggle */}
                <div className="flex items-center gap-2 mb-4">
                  <Filter className="w-3.5 h-3.5 text-slate-600" />
                  {(['all', 'area'] as const).map(mode => (
                    <button
                      key={mode}
                      className={cn(
                        'px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all',
                        suggestionsFilter === mode
                          ? 'bg-cyan-400 text-slate-950 shadow-[0_2px_10px_rgba(34,211,238,0.3)]'
                          : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-700'
                      )}
                      onClick={() => onFilterChange(mode)}
                    >
                      {mode === 'all' ? 'Empresa' : 'Mi Gerencia'}
                    </button>
                  ))}
                </div>

                {/* Recent nomination */}
                {recentNomination && (
                  <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
                    <span className="text-xs text-emerald-300">
                      Crear PDI para {recentNomination.name}
                    </span>
                    <button
                      className="text-[10px] text-emerald-400 hover:text-emerald-300 font-bold uppercase tracking-wider"
                      onClick={() => setTab('candidates')}
                    >
                      Ver candidatos
                    </button>
                  </div>
                )}

                {loadingSuggestions ? (
                  <div className="flex items-center justify-center h-48 text-slate-500 animate-pulse text-sm">
                    Buscando candidatos elegibles...
                  </div>
                ) : suggestions.length > 0 ? (
                  <div className="space-y-3">
                    {suggestions.map((s: any) => {
                      const badges = deriveBadges(s)
                      return (
                        <div
                          key={s.employeeId}
                          className="cursor-pointer"
                          onClick={() => onCandidateClick(s)}
                        >
                          <SuccessionCandidateCard
                            candidate={{
                              employeeId: s.employeeId,
                              employeeName: s.employeeName,
                              position: s.position,
                              departmentName: s.departmentName,
                              roleFitScore: s.roleFitScore,
                              matchPercent: s.matchPercent,
                              readinessLevel: s.readinessLevel,
                              readinessLabel: s.readinessLabel,
                              flightRisk: s.flightRisk,
                              nineBoxPosition: s.nineBoxPosition,
                            }}
                          />
                          {badges.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-1 ml-14">
                              {badges.map(b => (
                                <span
                                  key={b.label}
                                  className={`px-2 py-0.5 rounded-full text-[9px] font-medium border ${b.color}`}
                                >
                                  {b.label}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-48 text-slate-500 text-sm">
                    Sin candidatos elegibles en este filtro
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
