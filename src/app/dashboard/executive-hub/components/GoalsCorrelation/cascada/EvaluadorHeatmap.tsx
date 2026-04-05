'use client'

// ════════════════════════════════════════════════════════════════════════════
// EVALUADOR HEATMAP V2 — Patrón G: Cultura de evaluación
// src/app/dashboard/executive-hub/components/GoalsCorrelation/cascada/EvaluadorHeatmap.tsx
// ════════════════════════════════════════════════════════════════════════════
// Layer 1 — Portada: hero prioriza anomalía más grave + narrativa cultural
// Layer 2 — Dashboard: 4 cards fijas (Óptima → Central → Severa → Indulgente)
//           + Split Screen (Master list 40% · Detail EvaluadorPatronG 60%)
// Cards en 0 = ghost visible (la ausencia de sesgo es información vital)
// ════════════════════════════════════════════════════════════════════════════

import { memo, useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDisplayName } from '@/lib/utils/formatName'
import { PrimaryButton } from '@/components/ui/PremiumButton'

import type { ManagerGoalsStats, CorrelationPoint } from '../GoalsCorrelation.types'
import {
  getEvaluadorNarrative,
  type EvaluatorStyle,
} from '@/config/narratives/EvaluadorNarrativeDictionary'
import EvaluadorPatronG from './EvaluadorPatronG'

// ════════════════════════════════════════════════════════════════════════════
// CONFIG — orden fijo: menor a mayor riesgo (reading flow good → bad)
// ════════════════════════════════════════════════════════════════════════════

const CARD_ORDER: EvaluatorStyle[] = ['OPTIMA', 'CENTRAL', 'SEVERA', 'INDULGENTE']

// Colores ADN Focaliza — mismo sistema que Scatter y Ranking
const TYPE_COLOR: Record<EvaluatorStyle, string> = {
  OPTIMA: '#22D3EE', // cyan — base calibrada
  CENTRAL: '#94A3B8', // slate — neutralidad
  SEVERA: '#F59E0B', // amber — exigencia extrema
  INDULGENTE: '#A78BFA', // purple — inflación (crisis)
}

const TYPE_LABEL: Record<EvaluatorStyle, string> = {
  OPTIMA: 'Óptima',
  CENTRAL: 'Central',
  SEVERA: 'Severa',
  INDULGENTE: 'Indulgente',
}

const TYPE_BIAS_DESC: Record<EvaluatorStyle, string> = {
  OPTIMA: 'Calibrado',
  CENTRAL: 'Neutralidad',
  SEVERA: 'Exigencia',
  INDULGENTE: 'Inflación',
}

// ════════════════════════════════════════════════════════════════════════════
// PORTADA NARRATIVE BUILDER — prioriza la anomalía más grave
// ════════════════════════════════════════════════════════════════════════════

interface Distribution {
  OPTIMA: number
  CENTRAL: number
  SEVERA: number
  INDULGENTE: number
  total: number
}

interface PortadaNarrative {
  heroCount: number
  heroTotal: number
  primary: string
  secondary: string
  focusType: EvaluatorStyle
}

function buildPortadaNarrative(d: Distribution): PortadaNarrative {
  // Priorización: INDULGENTE > SEVERA > CENTRAL > ÓPTIMA (grave → saludable)
  if (d.INDULGENTE > 0) {
    return {
      heroCount: d.INDULGENTE,
      heroTotal: d.total,
      primary:
        d.INDULGENTE === 1
          ? 'líder infla evaluaciones sistemáticamente.'
          : 'líderes inflan evaluaciones sistemáticamente.',
      secondary:
        'Sus notas premian esfuerzo sin respaldo en resultados. La compensación basada en este criterio financia la ineficiencia.',
      focusType: 'INDULGENTE',
    }
  }
  if (d.SEVERA > 0) {
    return {
      heroCount: d.SEVERA,
      heroTotal: d.total,
      primary:
        d.SEVERA === 1
          ? 'líder opera con exigencia extrema.'
          : 'líderes operan con exigencia extrema.',
      secondary:
        'El talento bajo su supervisión puede estar subestimado — riesgo de fuga de quienes sí rinden.',
      focusType: 'SEVERA',
    }
  }
  if (d.CENTRAL > 0) {
    return {
      heroCount: d.CENTRAL,
      heroTotal: d.total,
      primary:
        d.CENTRAL === 1 ? 'líder evita diferenciar.' : 'líderes evitan diferenciar.',
      secondary:
        'Sus equipos reciben notas uniformes que no reflejan rendimiento real. Imposible distinguir a quien sostiene el negocio.',
      focusType: 'CENTRAL',
    }
  }
  // Todos Óptima — cultura calibrada
  return {
    heroCount: d.OPTIMA,
    heroTotal: d.total,
    primary:
      d.OPTIMA === 1
        ? 'líder opera con criterio calibrado.'
        : 'líderes operan con criterio calibrado.',
    secondary: 'Base confiable para decisiones de compensación en toda la organización.',
    focusType: 'OPTIMA',
  }
}

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

interface EvaluadorHeatmapProps {
  byManager: ManagerGoalsStats[]
  correlation: CorrelationPoint[]
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ════════════════════════════════════════════════════════════════════════════

export default memo(function EvaluadorHeatmap({
  byManager,
  correlation,
}: EvaluadorHeatmapProps) {
  const [view, setView] = useState<'portada' | 'distribucion'>('portada')
  const [activeType, setActiveType] = useState<EvaluatorStyle | null>(null)
  const [selectedManagerId, setSelectedManagerId] = useState<string | null>(null)

  // Agrupar por tipo, sort por coherenceGap desc dentro de cada grupo
  const grouped = useMemo(() => {
    const map: Record<EvaluatorStyle, ManagerGoalsStats[]> = {
      OPTIMA: [],
      CENTRAL: [],
      SEVERA: [],
      INDULGENTE: [],
    }
    for (const m of byManager) {
      if (m.evaluatorStatus && m.evaluatorStatus in map) {
        map[m.evaluatorStatus as EvaluatorStyle].push(m)
      }
    }
    for (const key of Object.keys(map) as EvaluatorStyle[]) {
      map[key].sort((a, b) => b.coherenceGap - a.coherenceGap)
    }
    return map
  }, [byManager])

  const distribution: Distribution = useMemo(
    () => ({
      OPTIMA: grouped.OPTIMA.length,
      CENTRAL: grouped.CENTRAL.length,
      SEVERA: grouped.SEVERA.length,
      INDULGENTE: grouped.INDULGENTE.length,
      total: byManager.filter(m => m.evaluatorStatus).length,
    }),
    [grouped, byManager]
  )

  const sesgoCount = distribution.CENTRAL + distribution.SEVERA + distribution.INDULGENTE
  const portadaNarrative = useMemo(() => buildPortadaNarrative(distribution), [distribution])

  // Active card + selected manager (para Split Screen)
  const activeManagers = activeType ? grouped[activeType] : []
  const selectedManager = useMemo(
    () => activeManagers.find(m => m.managerId === selectedManagerId) ?? null,
    [activeManagers, selectedManagerId]
  )
  const selectedNarrative = selectedManager
    ? getEvaluadorNarrative(selectedManager.evaluatorStatus)
    : null

  // Compensation impact pre-computed map
  const employeeQuadrantMap = useMemo(
    () => new Map(correlation.map(c => [c.employeeId, c.quadrant])),
    [correlation]
  )

  const compensationImpact = useMemo(() => {
    if (!selectedManager) return { totalInCheckpoint: 0, perceptionBiasCount: 0 }
    const empIds = new Set(selectedManager.employees.map(e => e.id))
    let totalInCheckpoint = 0
    let perceptionBiasCount = 0
    for (const [empId, quadrant] of employeeQuadrantMap) {
      if (!empIds.has(empId)) continue
      if (quadrant !== 'CONSISTENT' && quadrant !== 'NO_GOALS') totalInCheckpoint++
      if (quadrant === 'PERCEPTION_BIAS') perceptionBiasCount++
    }
    return { totalInCheckpoint, perceptionBiasCount }
  }, [selectedManager, employeeQuadrantMap])

  // Handlers
  const handleCardClick = useCallback(
    (type: EvaluatorStyle) => {
      if (distribution[type] === 0) return // ghost — no clickeable
      if (activeType === type) {
        setActiveType(null)
        setSelectedManagerId(null)
      } else {
        setActiveType(type)
        setSelectedManagerId(grouped[type][0]?.managerId ?? null)
      }
    },
    [distribution, grouped, activeType]
  )

  const handleBack = useCallback(() => {
    setView('portada')
    setActiveType(null)
    setSelectedManagerId(null)
  }, [])

  // ────────────────────────────────────────────────────────────────────────
  // EMPTY STATE
  // ────────────────────────────────────────────────────────────────────────
  if (distribution.total === 0) {
    return (
      <div className="relative rounded-2xl border border-slate-800/40 bg-slate-900/60 backdrop-blur-sm overflow-hidden p-8 text-center">
        <CheckCircle className="w-6 h-6 mx-auto mb-2 text-cyan-400/40" />
        <p className="text-sm font-light text-slate-400">Sin evaluadores clasificados.</p>
      </div>
    )
  }

  // ────────────────────────────────────────────────────────────────────────
  // LAYER 1 — PORTADA (narrativa cultural primero)
  // ────────────────────────────────────────────────────────────────────────
  if (view === 'portada') {
    return (
      <motion.div
        key="eh-portada"
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
              Tu cultura
            </h2>
            <p className="text-xl font-light tracking-tight leading-tight fhr-title-gradient mt-0.5">
              de evaluación
            </p>
          </div>

          {/* Hero: count de la anomalía priorizada */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-[72px] font-extralight text-white leading-[0.9] tabular-nums"
          >
            {portadaNarrative.heroCount}
            <span className="text-3xl text-slate-500">
              {' '}
              de {portadaNarrative.heroTotal}
            </span>
          </motion.p>

          {/* Narrativa primary */}
          <p className="text-base font-light text-slate-400 leading-relaxed mt-5 max-w-md">
            {portadaNarrative.primary}
          </p>

          {/* Narrativa secondary */}
          <p className="text-sm font-light text-slate-500 leading-relaxed mt-2 max-w-md">
            {portadaNarrative.secondary}
          </p>

          {/* CTA único */}
          <div className="mt-12">
            <PrimaryButton
              icon={ArrowRight}
              iconPosition="right"
              onClick={() => setView('distribucion')}
            >
              Explorar perfiles
            </PrimaryButton>
          </div>
        </div>
      </motion.div>
    )
  }

  // ────────────────────────────────────────────────────────────────────────
  // LAYER 2 — DASHBOARD: 4 cards + Split Screen
  // ────────────────────────────────────────────────────────────────────────
  return (
    <motion.div
      key="eh-distribucion"
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

      <div className="px-6 py-8 md:px-8 md:py-10">
        {/* Header con Volver */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={handleBack}
            className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 transition-colors text-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Volver
          </button>
        </div>

        {/* Título contextual */}
        <div className="mb-6">
          <h3 className="text-xl font-extralight text-white tracking-tight">
            Perfiles{' '}
            <span className="fhr-title-gradient">de evaluador</span>
          </h3>
          <p className="text-sm font-light text-slate-500 mt-1.5">
            {distribution.total} líder{distribution.total !== 1 ? 'es' : ''} evaluado
            {distribution.total !== 1 ? 's' : ''}
            {sesgoCount > 0
              ? ` · ${sesgoCount} con sesgo`
              : ' · criterio calibrado'}
          </p>
        </div>

        {/* ─── 4 CARDS DASHBOARD ─── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {CARD_ORDER.map(type => {
            const count = distribution[type]
            const isActive = activeType === type
            const isGhost = count === 0
            const color = TYPE_COLOR[type]

            return (
              <button
                key={type}
                onClick={() => handleCardClick(type)}
                disabled={isGhost}
                className={cn(
                  'relative rounded-xl border p-5 text-center transition-all overflow-hidden',
                  isGhost
                    ? 'opacity-30 cursor-not-allowed border-slate-800/30 bg-slate-900/20'
                    : 'cursor-pointer',
                  !isGhost &&
                    (isActive
                      ? 'border-slate-600 bg-slate-800/60'
                      : 'border-slate-800/50 bg-slate-900/40 hover:border-slate-700/70 hover:-translate-y-0.5')
                )}
              >
                {/* Tesla line top cuando active */}
                {isActive && !isGhost && (
                  <div
                    className="absolute top-0 left-0 right-0 h-[2px]"
                    style={{
                      background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
                      boxShadow: `0 0 12px ${color}60`,
                    }}
                  />
                )}

                {/* Count protagonista */}
                <span
                  className="text-4xl md:text-5xl font-extralight font-mono tabular-nums block leading-none"
                  style={{ color: isGhost ? '#475569' : color }}
                >
                  {count}
                </span>

                {/* Label del tipo */}
                <p
                  className={cn(
                    'text-xs font-light mt-2',
                    isGhost ? 'text-slate-700' : 'text-slate-300'
                  )}
                >
                  {TYPE_LABEL[type]}
                </p>

                {/* Descripción del sesgo */}
                <p
                  className={cn(
                    'text-[9px] uppercase tracking-wider mt-0.5',
                    isGhost ? 'text-slate-800' : 'text-slate-600'
                  )}
                >
                  {TYPE_BIAS_DESC[type]}
                </p>
              </button>
            )
          })}
        </div>

        {/* ─── SPLIT SCREEN (Master 40% · Detail 60%) ─── */}
        <AnimatePresence initial={false}>
          {activeType && activeManagers.length > 0 && (
            <motion.div
              key={`split-${activeType}`}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden"
            >
              <div className="mt-5 grid grid-cols-1 md:grid-cols-[40%_60%] gap-4">
                {/* MASTER — lista compacta */}
                <div className="rounded-xl border border-slate-800/40 bg-slate-950/30 p-3 max-h-[420px] overflow-y-auto">
                  <p className="text-[9px] uppercase tracking-widest text-slate-600 font-medium mb-3 px-1">
                    {TYPE_LABEL[activeType]} · {activeManagers.length} líder
                    {activeManagers.length !== 1 ? 'es' : ''}
                  </p>
                  <div className="space-y-1">
                    {activeManagers.map(m => {
                      const isSelected = selectedManagerId === m.managerId
                      const color = TYPE_COLOR[activeType]
                      return (
                        <button
                          key={m.managerId}
                          onClick={() => setSelectedManagerId(m.managerId)}
                          className={cn(
                            'w-full text-left px-3 py-2.5 rounded-lg transition-all',
                            isSelected
                              ? 'bg-slate-800/60 border border-slate-700/60'
                              : 'hover:bg-slate-800/30 border border-transparent'
                          )}
                        >
                          <div className="flex items-baseline justify-between gap-2">
                            <span
                              className={cn(
                                'text-xs font-light truncate',
                                isSelected ? 'text-white' : 'text-slate-300'
                              )}
                            >
                              {formatDisplayName(m.managerName)}
                            </span>
                            <span
                              className="text-xs font-mono tabular-nums flex-shrink-0"
                              style={{ color }}
                            >
                              {m.coherenceGap}%
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-600 mt-0.5">
                            {m.evaluatedCount} persona{m.evaluatedCount !== 1 ? 's' : ''}
                          </p>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* DETAIL — EvaluadorPatronG completo */}
                <div className="min-h-[420px]">
                  <AnimatePresence mode="wait">
                    {selectedManager && selectedNarrative ? (
                      <motion.div
                        key={selectedManager.managerId}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <EvaluadorPatronG
                          manager={selectedManager}
                          narrative={selectedNarrative}
                          compensationImpact={compensationImpact}
                          onClose={() => setSelectedManagerId(null)}
                        />
                      </motion.div>
                    ) : (
                      <div className="rounded-2xl border border-slate-800/30 bg-slate-900/20 p-8 text-center h-full flex flex-col items-center justify-center">
                        <p className="text-xs font-light text-slate-600">
                          Selecciona un líder de la lista para ver el detalle.
                        </p>
                      </div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
})
