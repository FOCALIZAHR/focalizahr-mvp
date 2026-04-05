'use client'

// ════════════════════════════════════════════════════════════════════════════
// GERENCIA HEATMAP V2 — Pareto + Patrón G
// src/app/dashboard/executive-hub/components/GoalsCorrelation/cascada/GerenciaHeatmap.tsx
// ════════════════════════════════════════════════════════════════════════════
// Layer 1 — Portada: "N de M concentran X%" con hero + CTA
// Layer 2 — Distribución: bars horizontales por discrepancia (Pareto 70%)
// Rol diferenciado de Tab 3 Ranking: este responde DÓNDE concentrar,
// no CÓMO auditar una por una. Lectura pura, sin navegación cross-tab.
// ════════════════════════════════════════════════════════════════════════════

import { memo, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PrimaryButton } from '@/components/ui/PremiumButton'

import type { CorrelationPoint } from '../GoalsCorrelation.types'
import type { GerenciaGoalsStatsV2 } from '@/lib/services/GoalsDiagnosticService'
import {
  buildIntegrityVerdict,
  type IntegrityStatus,
} from '@/config/narratives/GoalsNarrativeDictionary'

// ════════════════════════════════════════════════════════════════════════════
// CONFIG
// ════════════════════════════════════════════════════════════════════════════

const PARETO_THRESHOLD = 0.7 // 70% de cobertura acumulada

// Color de la barra por status — mismo ADN que Tab 2 Scatter
const STATUS_COLOR: Record<IntegrityStatus, string> = {
  AUDITABLE: '#22D3EE',     // cyan — base confiable
  CON_RESERVAS: '#F59E0B',  // amber — atención
  NO_AUDITABLE: '#A78BFA',  // purple — crisis
}

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

interface GerenciaHeatmapProps {
  byGerencia: GerenciaGoalsStatsV2[]
  correlation: CorrelationPoint[]
}

interface EnrichedGerencia {
  gerencia: GerenciaGoalsStatsV2
  discrepancyCount: number
  status: IntegrityStatus
  verdictTitle: string
  firstSentence: string
}

function extractFirstSentence(text: string): string {
  const match = text.match(/^[^.]+\./)
  return match ? match[0].trim() : text
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ════════════════════════════════════════════════════════════════════════════

export default memo(function GerenciaHeatmap({
  byGerencia,
  correlation,
}: GerenciaHeatmapProps) {
  // Con 1 sola gerencia no hay Pareto posible → skip portada
  const hasPortada = byGerencia.length > 1
  const [view, setView] = useState<'portada' | 'distribucion'>(() =>
    hasPortada ? 'portada' : 'distribucion'
  )

  // Enriquecer cada gerencia con discrepancy count + verdict
  const enriched: EnrichedGerencia[] = useMemo(() => {
    return byGerencia.map(g => {
      const discrepancyCount = correlation.filter(
        c =>
          c.gerenciaName === g.gerenciaName &&
          c.quadrant !== 'CONSISTENT' &&
          c.quadrant !== 'NO_GOALS' &&
          c.goalsPercent !== null
      ).length

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

      return {
        gerencia: g,
        discrepancyCount,
        status: verdict.status,
        verdictTitle: verdict.title,
        firstSentence: extractFirstSentence(verdict.narrative),
      }
    })
  }, [byGerencia, correlation])

  // Pareto: sort desc por count, acumulado hasta 70%
  const pareto = useMemo(() => {
    const sorted = [...enriched].sort((a, b) => b.discrepancyCount - a.discrepancyCount)
    const totalDiscrepancy = sorted.reduce((sum, i) => sum + i.discrepancyCount, 0)

    if (totalDiscrepancy === 0) {
      return {
        sorted,
        totalDiscrepancy: 0,
        topN: 0,
        topCoveragePct: 0,
        isUniform: false,
        isHealthy: true,
        maxCount: 0,
      }
    }

    let cumsum = 0
    let topN = 0
    for (const item of sorted) {
      if (item.discrepancyCount === 0) break
      cumsum += item.discrepancyCount
      topN++
      if (cumsum / totalDiscrepancy >= PARETO_THRESHOLD) break
    }

    const topCoveragePct = Math.round((cumsum / totalDiscrepancy) * 100)
    // Uniforme solo si hay múltiples gerencias Y el top necesita más de la mitad
    const isUniform = enriched.length > 1 && topN > enriched.length / 2

    return {
      sorted,
      totalDiscrepancy,
      topN,
      topCoveragePct,
      isUniform,
      isHealthy: false,
      maxCount: sorted[0]?.discrepancyCount ?? 0,
    }
  }, [enriched])

  // Empty state
  if (byGerencia.length === 0) {
    return (
      <div className="fhr-card p-8 text-center">
        <Info className="w-8 h-8 mx-auto mb-3 text-slate-600" />
        <p className="text-sm font-light text-slate-400">Sin datos de gerencias disponibles.</p>
      </div>
    )
  }

  // ────────────────────────────────────────────────────────────────────────
  // LAYER 1 — PORTADA
  // ────────────────────────────────────────────────────────────────────────
  if (view === 'portada') {
    return (
      <motion.div
        key="gh-portada"
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
              Dónde
            </h2>
            <p className="text-xl font-light tracking-tight leading-tight fhr-title-gradient mt-0.5">
              se concentra
            </p>
          </div>

          {pareto.isHealthy ? (
            // Caso saludable — zero discrepancia en toda la org
            <>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-[72px] font-extralight text-white leading-[0.9] tabular-nums"
              >
                {enriched.length}
              </motion.p>
              <p className="text-base font-light text-slate-400 leading-relaxed mt-5 max-w-md">
                gerencia{enriched.length !== 1 ? 's' : ''} sin discrepancias.
              </p>
              <p className="text-sm font-light text-slate-500 leading-relaxed mt-2 max-w-md">
                El juicio de los líderes y los resultados del negocio están alineados en toda la organización.
              </p>
            </>
          ) : pareto.isUniform ? (
            // Caso uniforme — el problema está distribuido
            <>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-[72px] font-extralight text-white leading-[0.9] tabular-nums"
              >
                {enriched.length}
              </motion.p>
              <p className="text-base font-light text-slate-400 leading-relaxed mt-5 max-w-md">
                gerencias con discrepancias.
              </p>
              <p className="text-sm font-light text-slate-500 leading-relaxed mt-2 max-w-md">
                El problema está distribuido. No hay foco único — cada gerencia tiene su proporción.
              </p>
            </>
          ) : (
            // Caso Pareto — concentración clara
            <>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-[72px] font-extralight text-white leading-[0.9] tabular-nums"
              >
                {pareto.topN}
                <span className="text-3xl text-slate-500"> de {enriched.length}</span>
              </motion.p>
              <p className="text-base font-light text-slate-400 leading-relaxed mt-5 max-w-md">
                gerencia{pareto.topN !== 1 ? 's' : ''} concentra{pareto.topN === 1 ? '' : 'n'} el{' '}
                {pareto.topCoveragePct}% de las discrepancias.
              </p>
              <p className="text-sm font-light text-slate-500 leading-relaxed mt-2 max-w-md">
                Si resuelves {pareto.topN === 1 ? 'esta' : 'estas'}, desactivas la mayor parte del
                problema.
              </p>
            </>
          )}

          {/* CTA único */}
          <div className="mt-12">
            <PrimaryButton
              icon={ArrowRight}
              iconPosition="right"
              onClick={() => setView('distribucion')}
            >
              Ver distribución
            </PrimaryButton>
          </div>
        </div>
      </motion.div>
    )
  }

  // ────────────────────────────────────────────────────────────────────────
  // LAYER 2 — DISTRIBUCIÓN VISUAL (bars horizontales)
  // ────────────────────────────────────────────────────────────────────────
  // Subtítulo contextual según estado
  const distribucionSubtitle = pareto.isHealthy
    ? `${enriched.length} gerencia${enriched.length !== 1 ? 's' : ''} sin discrepancias.`
    : enriched.length === 1
    ? `${enriched[0].gerencia.gerenciaName} concentra el 100% de las discrepancias.`
    : pareto.isUniform
    ? 'El problema está distribuido entre todas las gerencias.'
    : `Top ${pareto.topN} concentra${pareto.topN === 1 ? '' : 'n'} el ${pareto.topCoveragePct}% del problema.`

  return (
    <motion.div
      key="gh-distribucion"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0 }}
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

      <div className="px-6 py-8 md:px-8 md:py-10 space-y-5">
        {/* Header con volver (solo si vino de la portada) */}
        {hasPortada && (
          <div className="flex items-center justify-between">
            <button
              onClick={() => setView('portada')}
              className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 transition-colors text-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Volver
            </button>
          </div>
        )}

        {/* Mini-título contextual */}
        <div>
          <h3 className="text-xl font-extralight text-white tracking-tight">
            Distribución{' '}
            <span className="fhr-title-gradient">por gerencia</span>
          </h3>
          <p className="text-sm font-light text-slate-500 mt-1.5">{distribucionSubtitle}</p>
        </div>

        {/* Bars horizontales */}
        <div className="space-y-2.5">
          {pareto.sorted.map((item, idx) => {
            const isInTop = idx < pareto.topN && !pareto.isUniform && !pareto.isHealthy
            const barPct =
              pareto.maxCount > 0 ? (item.discrepancyCount / pareto.maxCount) * 100 : 0
            const color = STATUS_COLOR[item.status]

            return (
              <motion.div
                key={item.gerencia.gerenciaName}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.04, duration: 0.25 }}
                className={cn(
                  'rounded-xl border px-4 py-3 transition-colors',
                  isInTop
                    ? 'border-slate-700/60 bg-slate-900/40'
                    : 'border-slate-800/40 bg-slate-900/20'
                )}
              >
                {/* Fila 1: nombre + count */}
                <div className="flex items-baseline justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <span
                      className={cn(
                        'text-sm font-light truncate',
                        isInTop ? 'text-white' : 'text-slate-400'
                      )}
                    >
                      {item.gerencia.gerenciaName}
                    </span>
                  </div>
                  <span
                    className={cn(
                      'text-sm font-mono tabular-nums flex-shrink-0',
                      isInTop ? 'text-white' : 'text-slate-500'
                    )}
                  >
                    {item.discrepancyCount}
                  </span>
                </div>

                {/* Bar proporcional */}
                <div className="h-1 bg-slate-800/50 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${barPct}%` }}
                    transition={{ duration: 0.6, delay: idx * 0.04, ease: [0.16, 1, 0.3, 1] }}
                    className="h-full rounded-full"
                    style={{
                      backgroundColor: color,
                      opacity: isInTop ? 1 : 0.35,
                    }}
                  />
                </div>

                {/* Narrativa corta */}
                <p
                  className={cn(
                    'text-[11px] font-light mt-2 leading-snug',
                    isInTop ? 'text-slate-400' : 'text-slate-600'
                  )}
                >
                  {item.firstSentence}
                </p>
              </motion.div>
            )
          })}
        </div>
      </div>
    </motion.div>
  )
})
