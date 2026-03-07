'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, HelpCircle, CheckCircle, AlertTriangle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

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
  gaps?: GapDetail[]
  hireDate?: string | null
}

interface FilterStats {
  totalEmployees: number
  passedRoleFit: number
  passedAspiration: number
  finalCandidates: number
  candidateRank: number
}

interface CandidateIntelligenceStoryProps {
  candidate: CandidateProfile
  position: { positionTitle: string; standardJobLevel: string }
  filterStats: FilterStats | null
}

// ════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ════════════════════════════════════════════════════════════════════════════

const READINESS_STYLES: Record<string, { color: string; label: string }> = {
  READY_NOW:       { color: '#22D3EE', label: 'Lista para asumir hoy' },
  READY_1_2_YEARS: { color: '#F59E0B', label: '1-2 anos de preparacion' },
  READY_3_PLUS:    { color: '#F97316', label: '3+ anos de desarrollo' },
  NOT_VIABLE:      { color: '#64748B', label: 'No viable' },
}

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

const ASPIRATION_TEXT: Record<number, string> = {
  1: 'prefiere consolidarse en su rol actual',
  2: 'esta abierto/a a asumir mas responsabilidad',
  3: 'busca activamente roles de mayor impacto',
}

const CATEGORY_LABELS: Record<string, string> = {
  Strategic: 'Vision organizacional',
  Leadership: 'Liderazgo de equipos',
  Core: 'Fundamento profesional',
}

// ════════════════════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════════════════════

function safeNum(val: unknown): number {
  const n = Number(val)
  return isNaN(n) ? 0 : n
}

function deriveStatus(g: GapDetail): GapStatus {
  if (g.status) return g.status
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
  // If name is "LASTNAME LASTNAME FIRSTNAME", try to pick a capitalized-only word
  const capitalized = parts.find(p => p[0] === p[0].toUpperCase() && p.slice(1) === p.slice(1).toLowerCase())
  return capitalized || parts[0]
}

function yearsFromDate(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return null
  const diff = Date.now() - d.getTime()
  return Math.round(diff / (365.25 * 24 * 60 * 60 * 1000) * 10) / 10
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ════════════════════════════════════════════════════════════════════════════

export default function CandidateIntelligenceStory({
  candidate,
  position,
  filterStats,
}: CandidateIntelligenceStoryProps) {
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({})
  const toggleSection = (key: string) => setCollapsedSections(prev => ({ ...prev, [key]: !prev[key] }))

  const firstName = getFirstName(candidate.employeeName)
  const roleFit = safeNum(candidate.roleFitScore)
  const matchPct = safeNum(candidate.matchPercent)
  const yearsInCompany = yearsFromDate(candidate.hireDate)
  const readinessStyle = READINESS_STYLES[candidate.readinessLevel] || READINESS_STYLES.NOT_VIABLE

  const gaps = (candidate.gaps || []).map(g => ({ ...g, _status: deriveStatus(g) }))
  const strengths = gaps
    .filter(g => g._status === 'EXCEEDS' || g._status === 'READY')
    .sort((a, b) => (b.fitPercent || 0) - (a.fitPercent || 0))
    .slice(0, 4)
  const criticalGaps = gaps.filter(g => g._status === 'GAP_CRITICAL')
  const notEvaluated = gaps.filter(g => g._status === 'NOT_EVALUATED')

  const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.15 } } }
  const fadeUp = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  }

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="space-y-5"
    >
      {/* ── SECCION 1: EMBUDO INTELIGENTE ── */}
      {filterStats && (
        <motion.div variants={fadeUp}>
          <h3 className="text-xs text-slate-500 uppercase tracking-wider mb-3 font-bold">
            ¿Por que {firstName}?
          </h3>
          <div className="relative pl-5">
            {/* Vertical line */}
            <motion.div
              className="absolute left-[9px] top-2 bottom-2 w-[2px] bg-gradient-to-b from-cyan-500/60 via-purple-500/40 to-cyan-500/60"
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              style={{ transformOrigin: 'top' }}
            />
            {[
              {
                value: filterStats.totalEmployees,
                label: 'Empleados activos',
                color: 'text-slate-400',
                dotColor: 'bg-slate-500',
              },
              {
                value: filterStats.passedRoleFit,
                label: 'Cumplen perfil tecnico (Fit ≥ 75%)',
                color: 'text-cyan-400',
                dotColor: 'bg-cyan-500',
                connector: '✓ Role Fit ≥ 75%',
              },
              {
                value: filterStats.passedAspiration,
                label: 'Con ambicion de ascenso',
                color: 'text-purple-400',
                dotColor: 'bg-purple-500',
                connector: '✓ Quieren crecer',
              },
              {
                value: null,
                label: `${firstName} — #${filterStats.candidateRank} de ${filterStats.finalCandidates}`,
                color: 'text-white font-medium',
                dotColor: 'bg-cyan-400 ring-2 ring-cyan-400/30',
                connector: '★ Mejor match',
                isResult: true,
              },
            ].map((node, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                className="relative mb-4 last:mb-0"
              >
                {node.connector && (
                  <span className="block text-[10px] text-slate-600 ml-5 mb-1 font-mono">
                    {node.connector}
                  </span>
                )}
                <div className="flex items-center gap-3">
                  <div className={cn('w-[10px] h-[10px] rounded-full flex-shrink-0 -ml-[5px]', node.dotColor)} />
                  <span className={cn('text-sm', node.color)}>
                    {node.value !== null && (
                      <span className="font-mono font-bold mr-1.5">{node.value}</span>
                    )}
                    {node.isResult && <span className="mr-1.5">🏆</span>}
                    {node.label}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Percentile badge */}
          {filterStats.totalEmployees > 0 && (
            <motion.div variants={fadeUp} className="mt-3 flex justify-center">
              <span className="px-4 py-1.5 rounded-full text-[11px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                Top {Math.round((1 - filterStats.candidateRank / filterStats.totalEmployees) * 100)}% del talento activo
              </span>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* ── SECCION 2: METRICAS HERO ── */}
      <motion.div variants={fadeUp}>
        <div className="grid grid-cols-3 gap-2.5">
          {/* Row 1 */}
          <MetricCard
            value={`${Math.round(roleFit)}%`}
            label="Adecuacion rol actual"
            sublabel={roleFit >= 90 ? 'Domina su posicion' : roleFit >= 75 ? 'Solidez demostrada' : 'Bases establecidas'}
            glowColor="#22D3EE"
          />
          <MetricCard
            value={candidate.nineBoxPosition ? NINE_BOX_LABELS[candidate.nineBoxPosition] || candidate.nineBoxPosition : '—'}
            label="Calibracion"
            sublabel={candidate.nineBoxPosition ? NINE_BOX_DESC[candidate.nineBoxPosition] || '' : 'Sin calibrar'}
            glowColor="#A78BFA"
            smallValue
          />
          <MetricCard
            value={candidate.potentialAspiration ? `${candidate.potentialAspiration}/3` : '—'}
            label="Aspiracion"
            sublabel={candidate.potentialAspiration ? (ASPIRATION_TEXT[candidate.potentialAspiration] || '') : 'Sin dato'}
            glowColor={candidate.potentialAspiration === 3 ? '#22D3EE' : candidate.potentialAspiration === 2 ? '#F59E0B' : '#64748B'}
          />

          {/* Row 2 */}
          <MetricCard
            value={yearsInCompany !== null ? `${yearsInCompany}` : '—'}
            label="Anos en empresa"
            sublabel={yearsInCompany !== null ? 'Conocimiento institucional' : 'Sin dato'}
            glowColor="#10B981"
          />
          <MetricCard
            value={`${Math.round(matchPct)}%`}
            label="Match cargo objetivo"
            sublabel={matchPct >= 90 ? 'Ajuste excepcional' : matchPct >= 75 ? 'Buen ajuste' : 'Brechas a cerrar'}
            glowColor="#22D3EE"
          />
          <MetricCard
            value={readinessStyle.label.split(' ')[0]}
            label="Tiempo estimado"
            sublabel={readinessStyle.label}
            glowColor={readinessStyle.color}
            smallValue
          />
        </div>
      </motion.div>

      {/* ── SECCION 3: NARRATIVA ── */}
      <motion.div variants={fadeUp} className="space-y-2">
        <h3 className="text-xs text-slate-500 uppercase tracking-wider mb-2 font-bold">
          Analisis de Inteligencia
        </h3>

        {yearsInCompany !== null && (
          <p className="text-sm text-slate-300 leading-relaxed">
            {firstName} lleva <span className="text-white font-medium">{yearsInCompany} anos</span> construyendo su carrera en la empresa.
          </p>
        )}

        <p className="text-sm text-slate-300 leading-relaxed">
          En su evaluacion 360°, obtuvo <span className="text-cyan-400 font-medium">{Math.round(roleFit)}%</span> de
          adecuacion a su rol actual —{' '}
          {roleFit >= 90
            ? 'dominando cada aspecto de su posicion.'
            : roleFit >= 75
              ? 'demostrando solidez y consistencia.'
              : 'con bases establecidas.'}
        </p>

        {candidate.nineBoxPosition && (
          <p className="text-sm text-slate-300 leading-relaxed">
            En calibracion, fue clasificado/a como{' '}
            <span className="text-purple-400 font-medium">
              {NINE_BOX_LABELS[candidate.nineBoxPosition] || candidate.nineBoxPosition}
            </span>
            {NINE_BOX_DESC[candidate.nineBoxPosition]
              ? ` — ${NINE_BOX_DESC[candidate.nineBoxPosition]}.`
              : '.'}
          </p>
        )}

        {candidate.potentialAspiration && (
          <p className="text-sm text-slate-300 leading-relaxed">
            Su nivel de aspiracion es <span className="text-white font-medium">{candidate.potentialAspiration}/3</span>:{' '}
            {ASPIRATION_TEXT[candidate.potentialAspiration] || `nivel ${candidate.potentialAspiration}`}.
          </p>
        )}

        <p className="text-sm text-slate-300 leading-relaxed">
          Para <span className="text-white font-medium">{position.positionTitle}</span>: Match{' '}
          <span className="text-cyan-400 font-medium">{Math.round(matchPct)}%</span>
          {criticalGaps.length === 0
            ? ' sin brechas bloqueantes.'
            : ` con ${criticalGaps.length} area${criticalGaps.length !== 1 ? 's' : ''} a fortalecer.`}
          {notEvaluated.length > 0 && (
            <span className="text-slate-400">
              {' '}{notEvaluated.length} competencia{notEvaluated.length !== 1 ? 's' : ''} estrategica{notEvaluated.length !== 1 ? 's' : ''} aun
              por evaluar — no son brechas confirmadas, son incognitas a explorar.
            </span>
          )}
        </p>

        {/* Insight box */}
        {criticalGaps.length === 0 && roleFit >= 75 && (candidate.potentialAspiration ?? 0) >= 2 && (
          <motion.div
            variants={fadeUp}
            className="p-3 rounded-xl bg-cyan-500/5 border border-cyan-500/20 mt-1"
          >
            <p className="text-[11px] text-cyan-400/80 leading-relaxed">
              💡 El 89% de las promociones exitosas comparten este perfil: Alto Fit + Alta Aspiracion + Sin gaps criticos.
            </p>
          </motion.div>
        )}
      </motion.div>

      {/* ── SECCION 4: FORTALEZAS ── */}
      {strengths.length > 0 && (
        <motion.div variants={fadeUp}>
          <button
            onClick={() => toggleSection('strengths')}
            className="flex items-center gap-2 text-xs text-emerald-400 uppercase tracking-wider mb-3 font-bold hover:text-emerald-300 transition-colors w-full"
          >
            {collapsedSections.strengths ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
            Donde {firstName} brilla ({strengths.length})
          </button>
          <AnimatePresence>
            {!collapsedSections.strengths && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden space-y-2"
              >
                {strengths.map((g, i) => {
                  const pct = Math.min(safeNum(g.fitPercent), 100)
                  const exceeds = g._status === 'EXCEEDS'
                  return (
                    <motion.div
                      key={g.competencyCode}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/20"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-sm text-slate-200 truncate">{g.competencyName || g.competencyCode}</span>
                          {exceeds && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 flex-shrink-0">
                              Talento diferenciador
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-emerald-400 font-mono flex-shrink-0">
                          {g.actualScore !== null ? Number(g.actualScore).toFixed(1) : '—'}/{Number(g.targetScore || 0).toFixed(1)}
                        </span>
                      </div>
                      {/* Progress bar */}
                      <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ background: exceeds ? '#22D3EE' : '#10B981' }}
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.6, delay: i * 0.1 + 0.3 }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-500 mt-0.5 block">
                        {CATEGORY_LABELS[g.category] || g.category}
                      </span>
                    </motion.div>
                  )
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* ── SECCION 5: VEREDICTO ── */}
      {candidate.readinessLevel === 'READY_NOW' && (
        <motion.div variants={fadeUp}>
          <div
            className="p-4 rounded-xl border"
            style={{
              borderColor: '#22D3EE30',
              background: 'linear-gradient(135deg, rgba(34,211,238,0.05), rgba(167,139,250,0.03))',
              boxShadow: '0 0 20px rgba(34,211,238,0.08)',
            }}
          >
            <p className="text-sm text-white font-medium mb-3">
              {firstName} representa el perfil ideal de promocion interna:
            </p>
            <div className="space-y-1.5">
              {yearsInCompany !== null && (
                <div className="flex items-center gap-2 text-sm text-slate-300">
                  <CheckCircle className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                  Conocimiento institucional ({yearsInCompany} anos)
                </div>
              )}
              {candidate.nineBoxPosition && (
                <div className="flex items-center gap-2 text-sm text-slate-300">
                  <CheckCircle className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                  Desempeno probado ({NINE_BOX_LABELS[candidate.nineBoxPosition] || candidate.nineBoxPosition})
                </div>
              )}
              {(candidate.potentialAspiration ?? 0) >= 2 && (
                <div className="flex items-center gap-2 text-sm text-slate-300">
                  <CheckCircle className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                  Ambicion alineada (Aspiracion {candidate.potentialAspiration}/3)
                </div>
              )}
              {criticalGaps.length === 0 && (
                <div className="flex items-center gap-2 text-sm text-slate-300">
                  <CheckCircle className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                  Sin gaps bloqueantes
                </div>
              )}
              {notEvaluated.length > 0 && (
                <div className="flex items-center gap-2 text-sm text-amber-400/80">
                  <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                  {notEvaluated.length} competencia{notEvaluated.length !== 1 ? 's' : ''} ejecutiva{notEvaluated.length !== 1 ? 's' : ''} por confirmar
                </div>
              )}
            </div>

            <div className="mt-3 pt-3 border-t border-slate-700/30">
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Promover talento interno reduce el riesgo de rotacion en 73% vs contratacion externa.
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// METRIC CARD
// ════════════════════════════════════════════════════════════════════════════

function MetricCard({
  value,
  label,
  sublabel,
  glowColor,
  smallValue,
}: {
  value: string
  label: string
  sublabel: string
  glowColor: string
  smallValue?: boolean
}) {
  return (
    <div
      className="p-3 rounded-xl bg-[#0F172A]/90 backdrop-blur-2xl border border-slate-700/40 text-center"
      style={{ boxShadow: `0 0 12px ${glowColor}10` }}
    >
      <span
        className={cn(
          'font-bold block mb-0.5',
          smallValue ? 'text-sm' : 'text-xl',
        )}
        style={{ color: glowColor }}
      >
        {value}
      </span>
      <span className="text-[10px] text-slate-400 block leading-tight">{label}</span>
      <span className="text-[9px] text-slate-600 block mt-0.5 leading-tight">{sublabel}</span>
    </div>
  )
}
