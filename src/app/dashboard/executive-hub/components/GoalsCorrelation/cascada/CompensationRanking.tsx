'use client'

// ════════════════════════════════════════════════════════════════════════════
// COMPENSATION RANKING — T2 del rediseño Tab 3
// src/app/dashboard/executive-hub/components/GoalsCorrelation/cascada/CompensationRanking.tsx
// ════════════════════════════════════════════════════════════════════════════
// Cards de gerencia colapsables ordenadas por gravedad (confidenceLevel red primero).
// Reemplaza CompensationGerenciaModal — todo el contenido vive inline.
// Colapsada: verdict.title + primera oración + count discrepancias + chevron
// Expandida: narrativa full + slope chart + evidencia + evaluadores
// ════════════════════════════════════════════════════════════════════════════

import { memo, useMemo, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, ArrowRight, ChevronDown, Home, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDisplayName, formatEvaluatorStyle } from '@/lib/utils/formatName'
import { PrimaryButton } from '@/components/ui/PremiumButton'

import type { CorrelationPoint, ManagerGoalsStats } from '../GoalsCorrelation.types'
import type { GerenciaGoalsStatsV2 } from '@/lib/services/GoalsDiagnosticService'
import { buildIntegrityVerdict, type IntegrityStatus } from '@/config/narratives/GoalsNarrativeDictionary'

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

interface CompensationRankingProps {
  byGerencia: GerenciaGoalsStatsV2[]
  byManager: ManagerGoalsStats[]
  correlation: CorrelationPoint[]
  onContinue: () => void
  onBack: () => void
  onHome: () => void
}

// Ranking item: gerencia + verdict computed + discrepancy count
interface RankedGerencia {
  gerencia: GerenciaGoalsStatsV2
  status: IntegrityStatus
  verdictTitle: string
  verdictNarrative: string
  firstSentence: string
  remainingNarrative: string  // Narrativa sin la primera oración (para expand)
  discrepancyCount: number
}

const STATUS_ORDER: Record<IntegrityStatus, number> = {
  NO_AUDITABLE: 0,
  CON_RESERVAS: 1,
  AUDITABLE: 2,
}

const STATUS_DOT: Record<IntegrityStatus, string> = {
  NO_AUDITABLE: 'bg-purple-400',
  CON_RESERVAS: 'bg-purple-400/60',
  AUDITABLE: 'bg-cyan-400',
}

// Primera oración del veredicto (truncada al primer punto)
function extractFirstSentence(text: string): string {
  const match = text.match(/^[^.]+\./)
  return match ? match[0].trim() : text
}

// Resto del párrafo tras la primera oración (sin repetir lo que ya vive en la card colapsada)
function extractRemaining(text: string, firstSentence: string): string {
  return text.slice(firstSentence.length).trim()
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════════════════════

export default memo(function CompensationRanking({
  byGerencia,
  byManager,
  correlation,
  onContinue,
  onBack,
  onHome,
}: CompensationRankingProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Ranking: calcular verdict + count discrepancias por gerencia, ordenar por gravedad
  const ranked: RankedGerencia[] = useMemo(() => {
    const items = byGerencia.map(g => {
      const verdict = buildIntegrityVerdict({
        gerenciaName: g.gerenciaName,
        disconnectionRate: g.disconnectionRate,
        coverage: g.coverage,
        avgProgress: g.avgProgress,
        avgScore360: g.avgScore360,
        evaluatorClassification: g.evaluatorClassification,
        confidenceLevel: g.confidenceLevel,
        employeeCount: g.employeeCount,
        pearsonR: g.pearsonRoleFitGoals,
        calibrationUpWithLowGoals: g.calibrationCross?.adjustedUpCount,
        calibrationDownWithHighGoals: g.calibrationCross?.adjustedDownCount,
      })

      // Decisión 2: count = casos con discrepancia (no CONSISTENT, no NO_GOALS)
      const discrepancyCount = correlation.filter(
        c =>
          c.gerenciaName === g.gerenciaName &&
          c.quadrant !== 'CONSISTENT' &&
          c.quadrant !== 'NO_GOALS' &&
          c.goalsPercent !== null
      ).length

      const firstSentence = extractFirstSentence(verdict.narrative)
      return {
        gerencia: g,
        status: verdict.status,
        verdictTitle: verdict.title,
        verdictNarrative: verdict.narrative,
        firstSentence,
        remainingNarrative: extractRemaining(verdict.narrative, firstSentence),
        discrepancyCount,
      }
    })

    // Orden: gravedad desc, luego disconnectionRate desc
    return items.sort((a, b) => {
      const statusDiff = STATUS_ORDER[a.status] - STATUS_ORDER[b.status]
      if (statusDiff !== 0) return statusDiff
      return b.gerencia.disconnectionRate - a.gerencia.disconnectionRate
    })
  }, [byGerencia, correlation])

  const notAuditableCount = ranked.filter(r => r.status !== 'AUDITABLE').length

  const handleToggle = useCallback((name: string) => {
    setExpandedId(prev => (prev === name ? null : name))
  }, [])

  return (
    <div className="relative rounded-2xl border border-slate-800/40 bg-slate-900/60 backdrop-blur-sm overflow-hidden">
      {/* Tesla line */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{
          background: 'linear-gradient(90deg, transparent 5%, #22D3EE 35%, #A78BFA 65%, transparent 95%)',
          opacity: 0.7,
        }}
      />

      <div className="px-6 py-8 md:px-8 md:py-10">
        {/* ─── HEADER ─── */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 transition-colors text-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Volver
          </button>
          <button
            onClick={onHome}
            className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 transition-colors text-xs"
          >
            <Home className="w-3.5 h-3.5" />
            Portada
          </button>
        </div>

        {/* ─── TÍTULO + SUBTÍTULO ─── */}
        <div className="mb-8">
          <h2 className="text-2xl font-extralight text-white tracking-tight leading-tight">
            Áreas{' '}
            <span className="fhr-title-gradient">desconectadas</span>
          </h2>
          <p className="text-sm font-light text-slate-500 mt-2 max-w-xl">
            {notAuditableCount > 0 ? (
              <>
                <span className="text-slate-300">{notAuditableCount}</span> de {ranked.length}{' '}
                gerencia{ranked.length !== 1 ? 's' : ''} no {notAuditableCount === 1 ? 'tiene' : 'tienen'}{' '}
                base confiable para compensar.
              </>
            ) : (
              <>{ranked.length} gerencia{ranked.length !== 1 ? 's' : ''} con base confiable para compensar.</>
            )}
          </p>
        </div>

        {/* ─── CARDS DE GERENCIA ─── */}
        <div className="space-y-2">
          {ranked.map((item, idx) => (
            <GerenciaCard
              key={item.gerencia.gerenciaName}
              item={item}
              index={idx}
              expanded={expandedId === item.gerencia.gerenciaName}
              onToggle={() => handleToggle(item.gerencia.gerenciaName)}
              byManager={byManager}
              correlation={correlation}
            />
          ))}
        </div>

        {/* ─── CTA FINAL ─── */}
        <div className="mt-10 flex justify-center">
          <PrimaryButton icon={ArrowRight} iconPosition="right" onClick={onContinue}>
            Continuar al checkpoint
          </PrimaryButton>
        </div>
      </div>
    </div>
  )
})

// ════════════════════════════════════════════════════════════════════════════
// GERENCIA CARD — colapsada/expandida
// ════════════════════════════════════════════════════════════════════════════

const GerenciaCard = memo(function GerenciaCard({
  item,
  index,
  expanded,
  onToggle,
  byManager,
  correlation,
}: {
  item: RankedGerencia
  index: number
  expanded: boolean
  onToggle: () => void
  byManager: ManagerGoalsStats[]
  correlation: CorrelationPoint[]
}) {
  const { gerencia: g, status, verdictTitle, firstSentence, remainingNarrative, discrepancyCount } = item

  // Evaluadores de esta gerencia
  const evaluadores = useMemo(
    () => byManager.filter(m => m.gerenciaName === g.gerenciaName),
    [byManager, g.gerenciaName]
  )

  // Casos normalizados para slope chart
  const cases = useMemo(
    () =>
      correlation
        .filter(c => c.gerenciaName === g.gerenciaName && c.goalsPercent !== null)
        .map(c => ({
          id: c.employeeId,
          evalNorm: Math.max(0, Math.min(1, (c.score360 - 1) / 4)),
          goalsNorm: Math.max(0, Math.min(1, (c.goalsPercent ?? 0) / 100)),
        })),
    [correlation, g.gerenciaName]
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.25 }}
      className="rounded-xl border border-slate-800/50 bg-slate-950/30 overflow-hidden"
    >
      {/* ── Colapsada ── */}
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-slate-900/40 transition-colors"
      >
        {/* Dot indicador */}
        <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', STATUS_DOT[status])} />

        {/* Info principal */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-light text-white truncate">
              {g.gerenciaName}
            </span>
            <span className="text-[10px] text-slate-600 font-mono tabular-nums flex-shrink-0">
              {discrepancyCount} caso{discrepancyCount !== 1 ? 's' : ''}
            </span>
          </div>
          <p className="text-[11px] font-light text-slate-500 mt-0.5 truncate">
            {firstSentence}
          </p>
        </div>

        {/* Chevron */}
        <ChevronDown
          className={cn(
            'w-4 h-4 text-slate-600 transition-transform flex-shrink-0',
            expanded && 'rotate-180'
          )}
        />
      </button>

      {/* ── Expandida ── */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-5 pt-1 border-t border-slate-800/40">
              {/* ─── BLOQUE 1 — NARRATIVA ─── */}
              <div className="mt-4 mb-5">
                <p className="text-sm font-medium text-slate-300 mb-2">
                  {verdictTitle}
                </p>
                {remainingNarrative && (
                  <p className="text-[13px] font-light text-slate-300 leading-[1.7]">
                    {remainingNarrative}
                  </p>
                )}
              </div>

              {/* ─── BLOQUE 2 — EVIDENCIA EN 3 COLUMNAS ─── */}
              <div className="grid grid-cols-3 gap-4 mb-5">
                <MetricColumn
                  value={g.pearsonRoleFitGoals !== null ? g.pearsonRoleFitGoals.toFixed(2) : '—'}
                  label="Correlación de Pearson (r)"
                  hint={
                    g.pearsonRoleFitGoals === null
                      ? 'Sin datos'
                      : g.pearsonRoleFitGoals < 0.3
                      ? 'Equivale a azar puro'
                      : g.pearsonRoleFitGoals > 0.7
                      ? 'Conexión sólida'
                      : 'Conexión parcial'
                  }
                  warn={g.pearsonRoleFitGoals !== null && g.pearsonRoleFitGoals < 0.3}
                />
                <MetricColumn
                  value={`${Math.round(g.disconnectionRate)}%`}
                  label="Brecha evaluación vs meta"
                  hint={g.disconnectionRate > 40 ? 'Personas sin coincidencia' : 'De inconsistencia'}
                  warn={g.disconnectionRate > 25}
                />
                <MetricColumn
                  value={`${Math.round(g.coverage)}%`}
                  label="Cobertura de metas"
                  hint={g.coverage < 70 ? 'Muestra insuficiente' : 'Datos suficientes para auditar'}
                  warn={g.coverage < 70}
                />
              </div>

              {/* ─── BLOQUE 3 — SLOPE CHART ─── */}
              {cases.length >= 2 && (
                <div className="mb-5 border-t border-slate-800/60 pt-5">
                  <SlopeChart cases={cases} layoutKey={g.gerenciaName} />
                  <p className="text-[10px] font-light text-slate-500 text-center mt-3 italic">
                    Si los datos estuvieran alineados, las líneas serían paralelas.
                  </p>
                </div>
              )}

              {/* ─── BLOQUE 4 — QUIÉNES EVALÚAN ─── */}
              {evaluadores.length > 0 && (
                <div className="border-t border-slate-800/60 pt-4">
                  <p className="text-[9px] uppercase tracking-[1.5px] text-slate-600 font-medium mb-3">
                    Quiénes evalúan
                  </p>
                  <div className="space-y-2">
                    {evaluadores.map(ev => (
                      <div key={ev.managerId} className="flex items-center gap-2 text-[11px] font-light">
                        <span className="text-slate-300 flex-1 truncate">
                          {formatDisplayName(ev.managerName)}
                        </span>
                        {ev.evaluatorStatus && (
                          <>
                            <span className="text-slate-700">·</span>
                            <span className="text-slate-500">
                              {formatEvaluatorStyle(ev.evaluatorStatus)}
                            </span>
                          </>
                        )}
                        <span className="text-slate-700">·</span>
                        <span className="text-slate-500 font-mono tabular-nums">
                          {ev.coherenceGap}% gap
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
})

// ════════════════════════════════════════════════════════════════════════════
// METRIC COLUMN — una métrica en vertical centrada (3 por fila)
// ════════════════════════════════════════════════════════════════════════════

function MetricColumn({
  value,
  label,
  hint,
  warn,
}: {
  value: string
  label: string
  hint: string
  warn: boolean
}) {
  return (
    <div className="text-center">
      <span
        className={cn(
          'text-2xl font-extralight font-mono tabular-nums block',
          warn ? 'text-cyan-400' : 'text-white'
        )}
      >
        {value}
      </span>
      <p className="text-[10px] text-slate-500 mt-1 leading-snug">{label}</p>
      <p className="text-[10px] text-slate-500 mt-0.5">{hint}</p>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// SLOPE CHART — percepción (líder) vs realidad (negocio)
// Anomalías (gap > 0.4) en purple grueso opacity 1, coherentes en cyan fantasma.
// Expandible: click → pantalla completa con framer-motion layout.
// ════════════════════════════════════════════════════════════════════════════

const DISCONNECT_THRESHOLD = 0.4

function getLineStyle(evalNormalized: number, goalNormalized: number) {
  const gap = Math.abs(evalNormalized - goalNormalized)
  const isAnomaly = gap > DISCONNECT_THRESHOLD
  return {
    stroke: isAnomaly ? '#A78BFA' : '#22D3EE',
    strokeWidth: isAnomaly ? 2.5 : 0.5,
    opacity: isAnomaly ? 1 : 0.15,
    isAnomaly,
  }
}

function SlopeChart({
  cases,
  layoutKey,
}: {
  cases: { id: string; evalNorm: number; goalsNorm: number }[]
  layoutKey: string
}) {
  const [expanded, setExpanded] = useState(false)

  const width = 320
  const height = 180
  const padX = 20
  const padY = 18
  const xLeft = padX
  const xRight = width - padX
  const yFromNorm = (norm: number) => padY + (1 - norm) * (height - padY * 2)
  const layoutId = `slope-chart-${layoutKey}`

  const renderChart = (showAxisLabels: boolean) => (
    <>
      <div className="flex justify-between mb-2 px-1">
        <span className="text-[10px] uppercase tracking-widest text-cyan-400/50 font-medium">
          Percepción (Líder)
        </span>
        <span className="text-[10px] uppercase tracking-widest text-cyan-400/50 font-medium">
          Realidad (Negocio)
        </span>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" preserveAspectRatio="none">
        <line x1={xLeft} y1={padY} x2={xLeft} y2={height - padY} stroke="rgba(71, 85, 105, 0.3)" strokeWidth="0.5" />
        <line x1={xRight} y1={padY} x2={xRight} y2={height - padY} stroke="rgba(71, 85, 105, 0.3)" strokeWidth="0.5" />

        {/* Coherentes (fantasmas) */}
        {cases.map(c => {
          const style = getLineStyle(c.evalNorm, c.goalsNorm)
          if (style.isAnomaly) return null
          return (
            <line
              key={`c-${c.id}`}
              x1={xLeft}
              y1={yFromNorm(c.evalNorm)}
              x2={xRight}
              y2={yFromNorm(c.goalsNorm)}
              stroke={style.stroke}
              strokeWidth={style.strokeWidth}
              strokeOpacity={style.opacity}
              strokeLinecap="round"
            />
          )
        })}

        {/* Anomalías (purple protagonista) */}
        {cases.map(c => {
          const style = getLineStyle(c.evalNorm, c.goalsNorm)
          if (!style.isAnomaly) return null
          const y1 = yFromNorm(c.evalNorm)
          const y2 = yFromNorm(c.goalsNorm)
          return (
            <g key={`a-${c.id}`}>
              <line
                x1={xLeft}
                y1={y1}
                x2={xRight}
                y2={y2}
                stroke={style.stroke}
                strokeWidth={style.strokeWidth}
                strokeOpacity={style.opacity}
                strokeLinecap="round"
              />
              <circle cx={xLeft} cy={y1} r="3" fill={style.stroke} />
              <circle cx={xRight} cy={y2} r="3" fill={style.stroke} />
            </g>
          )
        })}

        {showAxisLabels && (
          <>
            <text x={xLeft - 4} y={padY + 3} fontSize="6" fill="#64748B" textAnchor="end">
              Indulgencia
            </text>
            <text x={xLeft - 4} y={height - padY + 2} fontSize="6" fill="#64748B" textAnchor="end">
              Exigencia
            </text>
            <text x={xRight + 4} y={padY + 3} fontSize="6" fill="#64748B" textAnchor="start">
              100%
            </text>
            <text x={xRight + 4} y={height - padY + 2} fontSize="6" fill="#64748B" textAnchor="start">
              0%
            </text>
          </>
        )}
      </svg>
    </>
  )

  return (
    <>
      {!expanded && (
        <motion.div
          layoutId={layoutId}
          onClick={() => setExpanded(true)}
          className="cursor-zoom-in relative"
          whileHover={{ scale: 1.01 }}
        >
          {renderChart(false)}
        </motion.div>
      )}

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-slate-950/90 backdrop-blur-md"
            onClick={() => setExpanded(false)}
          >
            <motion.div
              layoutId={layoutId}
              className="fixed inset-10 z-[61] flex items-center justify-center cursor-zoom-out"
              onClick={e => e.stopPropagation()}
            >
              <div className="relative w-full max-w-5xl">
                {renderChart(true)}
                <button
                  onClick={() => setExpanded(false)}
                  className="absolute -top-10 right-0 text-slate-500 hover:text-slate-300 transition-colors text-xs flex items-center gap-1.5"
                >
                  Cerrar <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
