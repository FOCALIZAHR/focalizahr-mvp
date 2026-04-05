'use client'

// ════════════════════════════════════════════════════════════════════════════
// GOALS CORRELATION — Tab Análisis V4 (Patrón G: Portada + Scatter)
// src/app/dashboard/executive-hub/components/GoalsCorrelation/tabs/AnalisisTab.tsx
// ════════════════════════════════════════════════════════════════════════════
// Layer 1 — Portada: título + hero 86% + CTA "Explorar distribución"
// Layer 2 — Scatter: selectores + narrativa por cuadrante + gráfico + volver
// ════════════════════════════════════════════════════════════════════════════

import { memo, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PrimaryButton } from '@/components/ui/PremiumButton'
import type { CorrelationPoint } from '../GoalsCorrelation.types'
import type { CorrelationQuadrant } from '@/lib/services/GoalsDiagnosticService'
import { QUADRANT_CONFIG } from '../GoalsCorrelation.constants'
import { GOALS_THRESHOLDS } from '@/lib/services/GoalsDiagnosticService'
import { getQuadrantNarrative } from '@/config/narratives/GoalsNarrativeDictionary'

// ════════════════════════════════════════════════════════════════════════════
// TYPES + CONFIG
// ════════════════════════════════════════════════════════════════════════════

interface AnalisisTabProps {
  correlation: CorrelationPoint[]
  quadrantCounts: {
    consistent: number
    perceptionBias: number
    hiddenPerformer: number
    doubleRisk: number
    noGoals: number
  }
}

// Color del dot por cuadrante — escalera de gravedad ADN Focaliza
// cyan (confianza) → slate (ambiguo) → amber (atención) → purple (crisis)
const QUADRANT_DOT_COLOR: Record<CorrelationQuadrant, string> = {
  CONSISTENT: '#22D3EE',        // cyan — entrega + domina (confianza)
  HIDDEN_PERFORMER: '#94A3B8',  // slate-400 — entrega sin dominar (señal ambigua)
  PERCEPTION_BIAS: '#F59E0B',   // amber — domina pero no entrega (alerta media)
  DOUBLE_RISK: '#A78BFA',       // purple — ni entrega ni domina (crisis)
  NO_GOALS: '#64748B',          // (excluido del render)
}

const QUADRANT_ORDER: {
  key: CorrelationQuadrant
  countKey: keyof AnalisisTabProps['quadrantCounts']
}[] = [
  { key: 'CONSISTENT', countKey: 'consistent' },
  { key: 'PERCEPTION_BIAS', countKey: 'perceptionBias' },
  { key: 'HIDDEN_PERFORMER', countKey: 'hiddenPerformer' },
  { key: 'DOUBLE_RISK', countKey: 'doubleRisk' },
]

// ════════════════════════════════════════════════════════════════════════════
// CHART DIMENSIONS
// ════════════════════════════════════════════════════════════════════════════

const CHART = {
  width: 600,
  height: 400,
  padding: { top: 20, right: 20, bottom: 40, left: 45 },
}

const plotW = CHART.width - CHART.padding.left - CHART.padding.right
const plotH = CHART.height - CHART.padding.top - CHART.padding.bottom

const scaleX = (goalsPercent: number) =>
  CHART.padding.left + (goalsPercent / 100) * plotW
const scaleY = (roleFit: number) =>
  CHART.padding.top + plotH - (roleFit / 100) * plotH

// Divisores alineados con los cortes reales del motor (classifyQuadrant)
const guideX = scaleX(GOALS_THRESHOLDS.HIGH_GOALS) // 80% — cumplir metas
const guideY = scaleY(GOALS_THRESHOLDS.HIGH_ROLEFIT) // 75% — dominio del cargo

// ════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ════════════════════════════════════════════════════════════════════════════

export default memo(function AnalisisTab({ correlation, quadrantCounts }: AnalisisTabProps) {
  const [view, setView] = useState<'portada' | 'scatter'>('portada')
  const [activeFilter, setActiveFilter] = useState<CorrelationQuadrant | null>(null)
  const [hoveredDot, setHoveredDot] = useState<CorrelationPoint | null>(null)

  const withGoals = useMemo(
    () => correlation.filter(c => c.quadrant !== 'NO_GOALS'),
    [correlation]
  )

  // Stats para la portada
  const portadaStats = useMemo(() => {
    const totalWithGoals =
      quadrantCounts.consistent +
      quadrantCounts.perceptionBias +
      quadrantCounts.hiddenPerformer +
      quadrantCounts.doubleRisk
    const atRisk =
      quadrantCounts.perceptionBias +
      quadrantCounts.hiddenPerformer +
      quadrantCounts.doubleRisk
    const riskPct = totalWithGoals > 0 ? Math.round((atRisk / totalWithGoals) * 100) : 0
    return { totalWithGoals, atRisk, riskPct }
  }, [quadrantCounts])

  // Narrativa: resumen general o detalle del cuadrante seleccionado
  const activeNarrative = useMemo(() => {
    if (!activeFilter) return null
    return getQuadrantNarrative(activeFilter)
  }, [activeFilter])

  if (withGoals.length < GOALS_THRESHOLDS.MIN_FOR_SCATTER) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-500">
        <p className="text-sm font-light">
          Menos de {GOALS_THRESHOLDS.MIN_FOR_SCATTER} empleados con metas.
        </p>
        <p className="text-xs text-slate-600 mt-1">
          El scatter plot requiere más datos para ser útil.
        </p>
      </div>
    )
  }

  // ────────────────────────────────────────────────────────────────────────
  // LAYER 1 — PORTADA (Patrón G: narrativa primero)
  // ────────────────────────────────────────────────────────────────────────
  if (view === 'portada') {
    return (
      <motion.div
        key="portada"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.2 }}
        className="relative rounded-2xl border border-slate-800/40 bg-slate-900/60 backdrop-blur-sm overflow-hidden"
      >
        {/* Tesla line */}
        <div
          className="absolute top-0 left-0 right-0 h-[2px]"
          style={{
            background:
              'linear-gradient(90deg, transparent 5%, #22D3EE 35%, #A78BFA 65%, transparent 95%)',
            opacity: 0.7,
          }}
        />

        <div className="px-6 py-14 md:px-10 md:py-20 flex flex-col items-center text-center">
          {/* Título split */}
          <div className="mb-10">
            <h2 className="text-2xl font-extralight text-white tracking-tight leading-tight">
              Así se distribuye
            </h2>
            <p className="text-xl font-light tracking-tight leading-tight fhr-title-gradient mt-0.5">
              tu organización
            </p>
          </div>

          {portadaStats.atRisk === 0 ? (
            <>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-[72px] font-extralight text-white leading-[0.9] tabular-nums"
              >
                {portadaStats.totalWithGoals}
              </motion.p>
              <p className="text-base font-light text-slate-400 leading-relaxed mt-5 max-w-md">
                personas evaluadas.
              </p>
              <p className="text-sm font-light text-slate-500 leading-relaxed mt-2 max-w-md">
                El juicio del líder y los resultados del negocio están alineados.
              </p>
            </>
          ) : (
            <>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-[72px] font-extralight text-white leading-[0.9] tabular-nums"
              >
                {portadaStats.riskPct}
                <span className="text-3xl text-slate-500">%</span>
              </motion.p>
              <p className="text-base font-light text-slate-400 leading-relaxed mt-5 max-w-md">
                de tu organización se encuentra en cuadrantes de discrepancia.
              </p>
              <p className="text-sm font-light text-slate-500 leading-relaxed mt-2 max-w-md">
                {portadaStats.atRisk} {portadaStats.atRisk === 1 ? 'persona' : 'personas'}{' '}
                donde el juicio del líder y los resultados no coinciden.
              </p>
            </>
          )}

          {/* CTA único */}
          <div className="mt-12">
            <PrimaryButton
              icon={ArrowRight}
              iconPosition="right"
              onClick={() => setView('scatter')}
            >
              Explorar distribución
            </PrimaryButton>
          </div>
        </div>
      </motion.div>
    )
  }

  // ────────────────────────────────────────────────────────────────────────
  // LAYER 2 — SCATTER INTERACTIVO
  // ────────────────────────────────────────────────────────────────────────
  return (
    <motion.div
      key="scatter"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-5"
    >
      {/* ─── HEADER: volver a portada ─── */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setView('portada')}
          className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 transition-colors text-xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Volver
        </button>
      </div>

      {/* ─── SELECTORES ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {QUADRANT_ORDER.map(({ key, countKey }) => {
          const config = QUADRANT_CONFIG[key]
          const count = quadrantCounts[countKey]
          const isActive = activeFilter === key

          return (
            <button
              key={key}
              onClick={() => setActiveFilter(isActive ? null : key)}
              className={cn(
                'rounded-xl border p-3 text-center transition-all relative',
                'bg-slate-800/30 backdrop-blur-xl',
                isActive
                  ? 'border-slate-600 ring-1 ring-slate-600'
                  : 'border-slate-800/40 hover:border-slate-700/50'
              )}
            >
              <p className={cn('text-xl font-mono font-medium', config.color)}>{count}</p>
              <p className="text-[9px] text-slate-500 mt-0.5">{config.label}</p>
            </button>
          )
        })}
      </div>

      {quadrantCounts.noGoals > 0 && (
        <p className="text-[10px] text-slate-600 text-center">
          {quadrantCounts.noGoals} persona{quadrantCounts.noGoals > 1 ? 's' : ''} sin metas
          asignadas (no incluidas)
        </p>
      )}

      {/* ─── NARRATIVA FULL-WIDTH ─── */}
      <div className="rounded-xl border border-slate-800/40 bg-slate-900/40 backdrop-blur-sm px-5 py-4 min-h-[90px] flex items-center">
        <AnimatePresence mode="wait">
          {activeFilter && activeNarrative ? (
            <motion.div
              key={activeFilter}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
              className="w-full"
            >
              <p className="text-[10px] uppercase tracking-widest text-slate-600 font-medium mb-2">
                {QUADRANT_CONFIG[activeFilter].label}
              </p>
              <p className="text-sm font-light text-slate-300 leading-relaxed">
                {activeNarrative.explanation}
              </p>
              <p className="text-[12px] font-light text-slate-500 leading-relaxed mt-1.5">
                {activeNarrative.implication}
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
              className="w-full"
            >
              <p className="text-sm font-light text-slate-300 leading-relaxed">
                Cada punto es una persona.{' '}
                <span className="text-slate-400">
                  Cuando el dominio del cargo y el cumplimiento de metas coinciden, el talento es
                  confiable. Cuando se separan, hay una historia que investigar.
                </span>
              </p>
              <p className="text-[12px] font-light text-slate-500 mt-1.5">
                Selecciona un cuadrante para explorar su patrón.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ─── SCATTER ─── */}
      <div className="fhr-card relative p-3 overflow-hidden">
        <div
          className="absolute top-0 left-0 right-0 h-[2px] z-10"
          style={{
            background: 'linear-gradient(90deg, transparent, #22D3EE, #A78BFA, transparent)',
            boxShadow: '0 0 15px #22D3EE',
          }}
        />

        <svg
          viewBox={`0 0 ${CHART.width} ${CHART.height}`}
          className="w-full h-auto"
          style={{ maxHeight: '400px' }}
        >
          {/* Grid lines sutiles */}
          {[0, 25, 50, 75, 100].map(v => (
            <line
              key={`gx-${v}`}
              x1={scaleX(v)}
              y1={CHART.padding.top}
              x2={scaleX(v)}
              y2={CHART.padding.top + plotH}
              stroke="#1e293b"
              strokeWidth={1}
            />
          ))}
          {[0, 25, 50, 75, 100].map(v => (
            <line
              key={`gy-${v}`}
              x1={CHART.padding.left}
              y1={scaleY(v)}
              x2={CHART.padding.left + plotW}
              y2={scaleY(v)}
              stroke="#1e293b"
              strokeWidth={1}
            />
          ))}

          {/* Divisores de cuadrante — solo líneas dashed, sin fondos */}
          <line
            x1={guideX}
            y1={CHART.padding.top}
            x2={guideX}
            y2={CHART.padding.top + plotH}
            stroke="#475569"
            strokeWidth={1}
            strokeDasharray="6 4"
          />
          <line
            x1={CHART.padding.left}
            y1={guideY}
            x2={CHART.padding.left + plotW}
            y2={guideY}
            stroke="#475569"
            strokeWidth={1}
            strokeDasharray="6 4"
          />

          {/* Axis labels X — Cumplimiento Metas */}
          {[0, 25, 50, 75, 100].map(v => (
            <text
              key={`lx-${v}`}
              x={scaleX(v)}
              y={CHART.height - 8}
              fill="#64748b"
              fontSize={10}
              textAnchor="middle"
            >
              {v}%
            </text>
          ))}
          <text
            x={CHART.padding.left + plotW / 2}
            y={CHART.height}
            fill="#94a3b8"
            fontSize={10}
            textAnchor="middle"
          >
            Cumplimiento Metas
          </text>

          {/* Axis labels Y — Dominio del cargo */}
          {[0, 25, 50, 75, 100].map(v => (
            <text
              key={`ly-${v}`}
              x={CHART.padding.left - 8}
              y={scaleY(v) + 3}
              fill="#64748b"
              fontSize={10}
              textAnchor="end"
            >
              {v}%
            </text>
          ))}
          <text
            x={12}
            y={CHART.padding.top + plotH / 2}
            fill="#94a3b8"
            fontSize={10}
            textAnchor="middle"
            transform={`rotate(-90, 12, ${CHART.padding.top + plotH / 2})`}
          >
            Dominio del cargo
          </text>

          {/* Glow filter */}
          <defs>
            <filter id="dotGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Dots — color por cuadrante, dim si hay filtro activo */}
          {withGoals.map(point => {
            if (point.goalsPercent === null || point.roleFitScore === null) return null
            const cx = scaleX(Math.min(100, Math.max(0, point.goalsPercent)))
            const cy = scaleY(Math.min(100, Math.max(0, point.roleFitScore)))
            const dotColor = QUADRANT_DOT_COLOR[point.quadrant]
            const isHovered = hoveredDot?.employeeId === point.employeeId
            const isDimmed = activeFilter !== null && point.quadrant !== activeFilter

            const opacity = isHovered ? 1 : isDimmed ? 0.1 : 0.75

            return (
              <circle
                key={point.employeeId}
                cx={cx}
                cy={cy}
                r={isHovered ? 6 : 4}
                fill={dotColor}
                className="transition-all duration-150 cursor-pointer"
                opacity={opacity}
                stroke={isHovered ? '#fff' : 'none'}
                strokeWidth={isHovered ? 1.5 : 0}
                filter={isHovered ? 'url(#dotGlow)' : undefined}
                onMouseEnter={() => setHoveredDot(point)}
                onMouseLeave={() => setHoveredDot(null)}
              />
            )
          })}
        </svg>

        {/* Tooltip — sin jerga */}
        {hoveredDot &&
          hoveredDot.goalsPercent !== null &&
          hoveredDot.roleFitScore !== null && (
            <div
              className="absolute z-10 px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 shadow-xl pointer-events-none"
              style={{
                left: `${(scaleX(hoveredDot.goalsPercent) / CHART.width) * 100}%`,
                top: `${(scaleY(hoveredDot.roleFitScore) / CHART.height) * 100 - 12}%`,
                transform: 'translate(-50%, -100%)',
              }}
            >
              <p className="text-xs text-white font-medium truncate max-w-[200px]">
                {hoveredDot.employeeName}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Metas:{' '}
                <span className="text-cyan-400 font-mono">
                  {Math.round(hoveredDot.goalsPercent)}%
                </span>
                {' · '}
                Dominio:{' '}
                <span className="text-purple-400 font-mono">
                  {Math.round(hoveredDot.roleFitScore)}%
                </span>
              </p>
              <p className="text-[9px] text-slate-500 mt-0.5">{hoveredDot.departmentName}</p>
            </div>
          )}
      </div>
    </motion.div>
  )
})
