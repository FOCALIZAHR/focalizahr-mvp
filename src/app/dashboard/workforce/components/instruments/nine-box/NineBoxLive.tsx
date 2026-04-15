'use client'

// ════════════════════════════════════════════════════════════════════════════
// NINE BOX LIVE — Instrumento #1 del Workforce Deck (v1.1 — upgrade Gemini)
// src/app/dashboard/workforce/components/instruments/nine-box/NineBoxLive.tsx
// ════════════════════════════════════════════════════════════════════════════
// Spec: Gemini CPO. Matriz 3×3 SVG con jittering + lasso libre + 2 sliders
// que definen el escenario (Exposicion Critica + Role Fit Minimo).
//
// Tono arbitrador: el HUD describe la cohorte (La Observacion) y proyecta
// el resultado financiero (La Decision de Valor) sin prescribir accion.
// ════════════════════════════════════════════════════════════════════════════

import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { WorkforceDiagnosticData } from '../../../types/workforce.types'
import type { RetentionEntry } from '@/lib/services/WorkforceIntelligenceService'
import NineBoxMatrix from './NineBoxMatrix'
import NineBoxPortada from './NineBoxPortada'
import {
  detectPattern,
  interpretEngagement,
  median,
  type PatternResult,
} from './nine-box-utils'
import { formatDisplayName } from '@/lib/utils/formatName'
import {
  PersonExposureNarrativeService,
  type PersonExposureNarrative,
} from '@/lib/services/PersonExposureNarrativeService'
import TeslaLine from '../_shared/TeslaLine'
import ConfidenceDot from '../_shared/ConfidenceDot'
import { useAnimatedNumber } from '../_shared/useAnimatedNumber'
import { formatCLP, formatTenureMonths } from '../_shared/format'

// ─────────────────────────────────────────────────────────────────────────────
// SLIDER — input range estilizado (Tailwind accent + track custom)
// ─────────────────────────────────────────────────────────────────────────────

interface ScenarioSliderProps {
  label: string
  value: number
  onChange: (next: number) => void
  min?: number
  max?: number
  step?: number
}

function ScenarioSlider({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 5,
}: ScenarioSliderProps) {
  return (
    <div className="flex flex-col gap-1.5 flex-1 min-w-[180px]">
      <div className="flex items-center justify-between">
        <label className="text-[9px] font-bold uppercase tracking-widest text-slate-500">
          {label}
        </label>
        <span className="text-[11px] font-mono font-bold text-cyan-400 tabular-nums">
          ≥ {value}%
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(parseInt(e.target.value, 10))}
        className="w-full h-1 bg-slate-800 rounded-full appearance-none cursor-pointer accent-cyan-400"
      />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// HUD STATS — sub-componentes de fila para "La Observacion" y "La Decision"
// ─────────────────────────────────────────────────────────────────────────────

function HudStat({
  label,
  value,
  accent = 'slate',
}: {
  label: string
  value: string
  accent?: 'slate' | 'cyan' | 'amber'
}) {
  const colorClass =
    accent === 'cyan'
      ? 'text-cyan-400'
      : accent === 'amber'
      ? 'text-amber-400'
      : 'text-white'
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-[10px] uppercase tracking-wider text-slate-500 font-light">
        {label}
      </span>
      <span className={cn('text-sm font-mono font-light tabular-nums', colorClass)}>
        {value}
      </span>
    </div>
  )
}

function HudSection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="border-t border-white/5 pt-5">
      <p className="text-[9px] uppercase tracking-widest text-cyan-400/80 font-bold mb-3">
        {title}
      </p>
      <div className="space-y-2.5">{children}</div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// OBSERVACION SECTION — pattern-aware. La sección "La Observación" cambia
// según el patrón dominante detectado en la cohorte.
//
// 4 patrones: zombie / fuga / inercia / default (composición)
// Tono arbitrador siempre — describe lo observado, no prescribe acción.
// ─────────────────────────────────────────────────────────────────────────────

function ObservacionSection({
  stats,
  pattern,
}: {
  stats: CohortStats
  pattern: PatternResult
}) {
  // ── ZOMBIE: roleFit > 75 + exposure > 50 ─────────────────────────────
  if (pattern.key === 'zombie') {
    return (
      <HudSection title="La Observación">
        <p className="text-[10px] uppercase tracking-widest text-amber-400 font-bold mb-2">
          Patrón · Talento atrapado
        </p>
        <p className="text-[11px] font-light text-slate-300 leading-relaxed mb-3">
          <span className="text-cyan-400 font-medium">{pattern.matchedCount}</span>{' '}
          de{' '}
          <span className="text-cyan-400 font-medium">{pattern.cohortSize}</span>{' '}
          personas dominan su cargo en zona automatizable. La inversión en su
          competencia se diluye en tareas que la IA ya ejecuta.
        </p>
        <HudStat
          label="Role fit promedio"
          value={`${Math.round(stats.avgRoleFit)}%`}
        />
        <HudStat
          label="Exposición promedio"
          value={`${Math.round(stats.avgExposurePct)}%`}
        />
        <HudStat
          label="Antigüedad promedio"
          value={formatTenureMonths(stats.avgTenureMonths)}
        />
      </HudSection>
    )
  }

  // ── FUGA: engagement >= 4 + augmentation > 0.5 ───────────────────────
  if (pattern.key === 'fuga') {
    return (
      <HudSection title="La Observación">
        <p className="text-[10px] uppercase tracking-widest text-amber-400 font-bold mb-2">
          Patrón · Perfil de mercado
        </p>
        <p className="text-[11px] font-light text-slate-300 leading-relaxed mb-3">
          <span className="text-cyan-400 font-medium">{pattern.matchedCount}</span>{' '}
          de{' '}
          <span className="text-cyan-400 font-medium">{pattern.cohortSize}</span>{' '}
          combinan alto compromiso con cargos potenciados por IA. Es el perfil
          que el mercado caza activamente.
        </p>
        <HudStat
          label="Augmentación promedio"
          value={`${Math.round(stats.avgAugmentationPct)}%`}
        />
        <HudStat
          label="Compromiso promedio"
          value={`${stats.avgEngagement.toFixed(1)} / 5`}
        />
        <HudStat
          label="Antigüedad promedio"
          value={formatTenureMonths(stats.avgTenureMonths)}
        />
      </HudSection>
    )
  }

  // ── INERCIA: exposure > 0.5 + salary > mediana ───────────────────────
  if (pattern.key === 'inercia') {
    return (
      <HudSection title="La Observación">
        <p className="text-[10px] uppercase tracking-widest text-amber-400 font-bold mb-2">
          Patrón · Inercia salarial
        </p>
        <p className="text-[11px] font-light text-slate-300 leading-relaxed mb-3">
          <span className="text-cyan-400 font-medium">{pattern.matchedCount}</span>{' '}
          de{' '}
          <span className="text-cyan-400 font-medium">{pattern.cohortSize}</span>{' '}
          concentran salarios sobre la mediana en roles automatizables. La
          estructura paga premium por tareas en zona IA.
        </p>
        <HudStat
          label="Salario promedio"
          value={`${formatCLP(stats.avgSalary)} / mes`}
        />
        <HudStat
          label="Mediana org"
          value={`${formatCLP(pattern.salaryMedianRef)} / mes`}
        />
        <HudStat
          label="Exposición promedio"
          value={`${Math.round(stats.avgExposurePct)}%`}
        />
      </HudSection>
    )
  }

  // ── DEFAULT: composición sin patrón dominante ────────────────────────
  return (
    <HudSection title="La Observación">
      <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2">
        Composición de la cohorte
      </p>
      <HudStat
        label="Exposición promedio"
        value={`${Math.round(stats.avgExposurePct)}%`}
      />
      <HudStat
        label="Dominio del cargo"
        value={`${Math.round(stats.avgRoleFit)}%`}
      />
      <HudStat
        label="Antigüedad promedio"
        value={formatTenureMonths(stats.avgTenureMonths)}
      />
      {/* Tier breakdown — solo en default */}
      {(stats.tierBreakdown.intocable > 0 ||
        stats.tierBreakdown.valioso > 0 ||
        stats.tierBreakdown.neutro > 0 ||
        stats.tierBreakdown.prescindible > 0) && (
        <div className="pt-1 mt-1">
          <p className="text-[10px] uppercase tracking-wider text-slate-500 font-light mb-1.5">
            Distribución por tier
          </p>
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] font-mono text-slate-400">
            {stats.tierBreakdown.intocable > 0 && (
              <span>
                <span className="text-cyan-400">
                  {stats.tierBreakdown.intocable}
                </span>{' '}
                intocable
              </span>
            )}
            {stats.tierBreakdown.valioso > 0 && (
              <span>
                <span className="text-cyan-400">
                  {stats.tierBreakdown.valioso}
                </span>{' '}
                valioso
              </span>
            )}
            {stats.tierBreakdown.neutro > 0 && (
              <span>
                <span className="text-slate-300">
                  {stats.tierBreakdown.neutro}
                </span>{' '}
                neutro
              </span>
            )}
            {stats.tierBreakdown.prescindible > 0 && (
              <span>
                <span className="text-amber-400">
                  {stats.tierBreakdown.prescindible}
                </span>{' '}
                prescindible
              </span>
            )}
          </div>
        </div>
      )}
    </HudSection>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// COHORT VIEW — vista por defecto del HUD (cuando NO hay hover)
// ─────────────────────────────────────────────────────────────────────────────

function CohortView({
  stats,
  pattern,
  hasCohort,
  animatedCount,
  animatedSalary,
  animatedFiniquito,
  animatedPayback,
}: {
  stats: CohortStats
  pattern: PatternResult
  hasCohort: boolean
  animatedCount: number
  animatedSalary: number
  animatedFiniquito: number
  animatedPayback: number
}) {
  return (
    <>
      {/* Cohorte */}
      <div>
        <p className="text-[9px] uppercase tracking-widest text-slate-500 font-bold">
          Cohorte del escenario
        </p>
        <p className="text-6xl font-extralight text-white tabular-nums mt-1 font-mono">
          {Math.round(animatedCount)}
        </p>
        <p className="text-xs font-light text-slate-400 mt-1">
          {hasCohort
            ? `${stats.count === 1 ? 'persona' : 'personas'} dentro del escenario`
            : 'Sin coincidencias bajo este escenario'}
        </p>
      </div>

      {hasCohort && (
        <>
          <ObservacionSection stats={stats} pattern={pattern} />

          <HudSection title="La Decisión de Valor">
            <HudStat
              label="Masa salarial"
              value={`${formatCLP(animatedSalary)} / mes`}
              accent="amber"
            />
            <HudStat
              label="Costo de transición"
              value={formatCLP(animatedFiniquito)}
              accent="amber"
            />
            <HudStat
              label="Recuperación"
              value={`${animatedPayback.toFixed(1)} meses`}
              accent="cyan"
            />

            <p className="text-[11px] italic font-light text-slate-400 leading-relaxed pt-3 border-t border-white/5 mt-3">
              Bajo este escenario, el ahorro de masa salarial recupera
              el costo de transición en{' '}
              <span className="text-cyan-400 font-medium not-italic">
                {stats.paybackMonths.toFixed(1)} meses
              </span>
              .
            </p>
          </HudSection>
        </>
      )}
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PERSON VIEW — vista del HUD durante hover sobre un dot
// Reemplaza temporalmente la vista de cohorte. Vuelve a CohortView al salir.
// ─────────────────────────────────────────────────────────────────────────────

function PersonView({
  person,
  isPinned,
}: {
  person: RetentionEntry
  isPinned: boolean
}) {
  // Narrativa per-persona — motor PROPIO del módulo Workforce Planning.
  // Cruza focalizaScore × roleFit × engagement → 6 casos consolidados.
  // Reemplaza TalentNarrativeService (que era de Sucesión y no conocía exposición IA).
  const narrative: PersonExposureNarrative = PersonExposureNarrativeService.build({
    focalizaScore: person.focalizaScore,
    roleFit: person.roleFitScore,
    engagement: person.potentialEngagement,
    employeeName: formatDisplayName(person.employeeName),
  })
  const engagementLabel = interpretEngagement(person.potentialEngagement)

  // Color del bloque narrativa por accent semántico del servicio
  const accentClass =
    narrative.accent === 'amber'
      ? 'border-amber-500/30 bg-amber-500/[0.05]'
      : narrative.accent === 'cyan'
        ? 'border-cyan-500/25 bg-cyan-500/[0.04]'
        : 'border-slate-700/40 bg-slate-800/30'

  return (
    <div>
      {/* Header — nombre + cargo + departamento */}
      <div className="flex items-center justify-between gap-2">
        <p className="text-[9px] uppercase tracking-widest text-cyan-400/80 font-bold">
          {isPinned ? 'Persona · fijada' : 'Persona'}
        </p>
        {isPinned && (
          <span className="text-[9px] text-slate-500 italic">
            Click para soltar
          </span>
        )}
      </div>
      <p className="text-xl font-light text-white mt-1 leading-tight">
        {formatDisplayName(person.employeeName)}
      </p>
      <p className="text-sm font-light text-slate-300 mt-1 truncate">
        {person.position}
      </p>
      <p className="text-xs font-light text-slate-500 mt-0.5 truncate">
        {person.departmentName}
      </p>

      {/* ── TRIAJE NARRATIVO ─────────────────────────────────────────
          Headline (contradicción/riesgo) + context (lectura ejecutiva)
          + exposureLens (qué implica la exposición específicamente)
          + urgencyLevel (consecuencia al negocio).
          Va ARRIBA de los datos. Interpretación primero, números después. */}
      <div className={`mt-5 rounded-lg border ${accentClass} px-3 py-3`}>
        <p className="text-xs font-medium text-white leading-snug mb-2">
          {narrative.headline}
        </p>
        <p className="text-[11px] font-light text-slate-300 leading-relaxed">
          {narrative.context}
        </p>
        <p className="text-[10.5px] font-light text-purple-300/90 leading-relaxed mt-2 pt-2 border-t border-white/5">
          {narrative.exposureLens}
        </p>
        <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mt-2 pt-2 border-t border-white/5">
          {narrative.urgencyLevel}
        </p>
      </div>

      {/* ── DATOS DE RESPALDO — labels humanos, sin jerga ───────────── */}
      <div className="mt-5 pt-5 border-t border-white/5">
        <p className="text-[9px] uppercase tracking-widest text-slate-500 font-bold mb-3">
          Datos
        </p>
        <div className="space-y-2">
          <HudStat
            label="Dominio del cargo"
            value={`${Math.round(person.roleFitScore)}%`}
            accent={person.roleFitScore >= 75 ? 'cyan' : 'slate'}
          />
          {engagementLabel && (
            <HudStat
              label="Compromiso"
              value={engagementLabel}
              accent={
                engagementLabel === 'Crítico'
                  ? 'amber'
                  : engagementLabel === 'Alto'
                    ? 'cyan'
                    : 'slate'  // 'Estable' (NEUTRAL Test Ácido) — sin urgencia
              }
            />
          )}
          <HudStat
            label="Antigüedad"
            value={formatTenureMonths(person.tenureMonths)}
          />
        </div>
      </div>

      {/* ── FINANCIERO ──────────────────────────────────────────────── */}
      <div className="mt-5 pt-5 border-t border-white/5">
        <p className="text-[9px] uppercase tracking-widest text-slate-500 font-bold mb-3">
          Financiero
        </p>
        <div className="space-y-2">
          <HudStat
            label="Salario"
            value={`${formatCLP(person.salary)} / mes`}
            accent="amber"
          />
          {person.finiquitoToday !== null && (
            <HudStat
              label="Finiquito hoy"
              value={formatCLP(person.finiquitoToday)}
              accent="amber"
            />
          )}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// FINANCIAL HUD — panel lateral con Observacion + Decision de Valor
// ─────────────────────────────────────────────────────────────────────────────

interface CohortStats {
  count: number
  avgExposurePct: number
  avgRoleFit: number
  avgTenureMonths: number
  avgAugmentationPct: number
  avgEngagement: number  // 0-5
  avgSalary: number
  tierBreakdown: Record<RetentionEntry['tier'], number>
  sumSalary: number
  sumFiniquito: number
  paybackMonths: number
}

interface FinancialHUDProps {
  stats: CohortStats
  pattern: PatternResult
  /** Persona mostrada: pinned (sticky) > hovered. Null = vista cohorte. */
  displayedPerson: RetentionEntry | null
  /** Si la persona está pinned (click-toggle), se muestra hint para soltar */
  isPinned: boolean
}

const FinancialHUD = memo(function FinancialHUD({
  stats,
  pattern,
  displayedPerson,
  isPinned,
}: FinancialHUDProps) {
  const animatedCount = useAnimatedNumber(stats.count, 300)
  const animatedSalary = useAnimatedNumber(stats.sumSalary)
  const animatedFiniquito = useAnimatedNumber(stats.sumFiniquito)
  const animatedPayback = useAnimatedNumber(stats.paybackMonths)

  const hasCohort = stats.count > 0

  return (
    <aside className="w-full md:w-[340px] flex-shrink-0 fhr-card relative overflow-hidden flex flex-col p-0">
      <TeslaLine />
      <div className="flex flex-col gap-6 p-6 overflow-y-auto">
        {/* ─────────────────────────────────────────────────────────────
            CONMUTACIÓN: persona (hover/pinned) vs cohorte (default)
            - Hover: muestra persona, debounced 150ms al salir
            - Click: pin → persona sticky hasta nuevo click
            ───────────────────────────────────────────────────────────── */}
        {displayedPerson ? (
          <PersonView person={displayedPerson} isPinned={isPinned} />
        ) : (
          <CohortView
            stats={stats}
            pattern={pattern}
            hasCohort={hasCohort}
            animatedCount={animatedCount}
            animatedSalary={animatedSalary}
            animatedFiniquito={animatedFiniquito}
            animatedPayback={animatedPayback}
          />
        )}
      </div>
    </aside>
  )
})

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

interface NineBoxLiveProps {
  data: WorkforceDiagnosticData
}

export default function NineBoxLive({ data }: NineBoxLiveProps) {
  // ── Motor 2 estados: portada → matrix (Patrón G) ─────────────────────
  const [view, setView] = useState<'portada' | 'matrix'>('portada')

  // ── 1. Filtrar gente con nineBoxPosition no-null ─────────────────────
  const people = useMemo(
    () =>
      data.retentionPriority.ranking.filter(
        r => r.nineBoxPosition !== null && r.nineBoxPosition !== undefined,
      ),
    [data.retentionPriority.ranking],
  )

  // ── 2. Estado del escenario (sliders) ────────────────────────────────
  const [exposureMin, setExposureMin] = useState<number>(0)   // 0-100
  const [roleFitMin, setRoleFitMin] = useState<number>(0)     // 0-100

  // ── 3. Estado de interacción ─────────────────────────────────────────
  const [lassoSelectedIds, setLassoSelectedIds] = useState<Set<string>>(new Set())
  const [hoveredPerson, setHoveredPerson] = useState<RetentionEntry | null>(null)
  // Pinned: persona fijada con click. Override del hover — el HUD muestra
  // siempre la pinned cuando existe. Click otra vez → unpin.
  const [pinnedPersonId, setPinnedPersonId] = useState<string | null>(null)

  // ── 4. Eligibles bajo el escenario ───────────────────────────────────
  // Filtro por focalizaScore (canónico Eloundou). Si la persona no tiene
  // focalizaScore (cargo sin clasificar O*NET) → se incluye SOLO si el
  // umbral es 0; al filtrar por exposición específica, no aplica.
  const eligibleIds = useMemo(() => {
    const ids = new Set<string>()
    const expoThreshold = exposureMin / 100
    for (const p of people) {
      const focaliza = p.focalizaScore
      const passesExposure =
        expoThreshold === 0
          ? true
          : focaliza !== null && focaliza >= expoThreshold
      if (passesExposure && p.roleFitScore >= roleFitMin) {
        ids.add(p.employeeId)
      }
    }
    return ids
  }, [people, exposureMin, roleFitMin])

  // ── 5. Cohorte del HUD: lasso ∩ eligibles, o todos los eligibles ─────
  const cohortIds = useMemo(() => {
    if (lassoSelectedIds.size === 0) return eligibleIds
    const intersection = new Set<string>()
    for (const id of lassoSelectedIds) {
      if (eligibleIds.has(id)) intersection.add(id)
    }
    return intersection
  }, [lassoSelectedIds, eligibleIds])

  // ── 6. Stats agregados de la cohorte ─────────────────────────────────
  const stats = useMemo<CohortStats>(() => {
    const cohort = people.filter(p => cohortIds.has(p.employeeId))
    const count = cohort.length

    if (count === 0) {
      return {
        count: 0,
        avgExposurePct: 0,
        avgRoleFit: 0,
        avgTenureMonths: 0,
        avgAugmentationPct: 0,
        avgEngagement: 0,
        avgSalary: 0,
        tierBreakdown: { intocable: 0, valioso: 0, neutro: 0, prescindible: 0 },
        sumSalary: 0,
        sumFiniquito: 0,
        paybackMonths: 0,
      }
    }

    // Promedio focalizaScore (Eloundou canónico). Excluye nulls — si un cargo
    // no está clasificado en O*NET, no contribuye al promedio. Si TODOS son
    // null, queda 0 (caso degenerado, raro).
    const focalizaValues = cohort
      .map(p => p.focalizaScore)
      .filter((v): v is number => v !== null)
    const sumExposure = focalizaValues.reduce((s, v) => s + v, 0)
    const focalizaCount = focalizaValues.length
    const sumRoleFit = cohort.reduce((s, p) => s + p.roleFitScore, 0)
    const sumTenure = cohort.reduce((s, p) => s + p.tenureMonths, 0)
    const sumSalary = cohort.reduce((s, p) => s + p.salary, 0)
    const sumFiniquito = cohort.reduce(
      (s, p) => s + (p.finiquitoToday ?? 0),
      0,
    )
    const sumAugmentation = cohort.reduce((s, p) => s + p.augmentationShare, 0)
    // Engagement puede ser null — promediar solo los que existen
    const engagementValues = cohort
      .map(p => p.potentialEngagement)
      .filter((v): v is number => v !== null)
    const avgEngagement =
      engagementValues.length > 0
        ? engagementValues.reduce((s, v) => s + v, 0) / engagementValues.length
        : 0

    const tierBreakdown: CohortStats['tierBreakdown'] = {
      intocable: 0,
      valioso: 0,
      neutro: 0,
      prescindible: 0,
    }
    for (const p of cohort) {
      tierBreakdown[p.tier] += 1
    }

    return {
      count,
      avgExposurePct: focalizaCount > 0 ? (sumExposure / focalizaCount) * 100 : 0,
      avgRoleFit: sumRoleFit / count,
      avgTenureMonths: sumTenure / count,
      avgAugmentationPct: (sumAugmentation / count) * 100,
      avgEngagement,
      avgSalary: sumSalary / count,
      tierBreakdown,
      sumSalary,
      sumFiniquito,
      paybackMonths: sumSalary > 0 ? sumFiniquito / sumSalary : 0,
    }
  }, [people, cohortIds])

  // ── 6.b Mediana salarial de la organización (referencia para INERCIA) ─
  const salaryMedianRef = useMemo(
    () => median(people.map(p => p.salary)),
    [people],
  )

  // ── 6.c Patrón dominante de la cohorte ───────────────────────────────
  const pattern = useMemo<PatternResult>(() => {
    const cohort = people.filter(p => cohortIds.has(p.employeeId))
    return detectPattern(cohort, salaryMedianRef)
  }, [people, cohortIds, salaryMedianRef])

  // ── 7. Handlers ──────────────────────────────────────────────────────
  // Click sobre dot: toggle pin. Si la persona ya estaba pinned → unpin
  // (vuelve a vista cohorte). Si no → pin (override hover).
  const handleDotClick = useCallback((personId: string) => {
    setPinnedPersonId(prev => (prev === personId ? null : personId))
  }, [])

  // Persona efectivamente mostrada en el HUD: pinned (si existe) > hovered
  const displayedPerson = useMemo<RetentionEntry | null>(() => {
    if (pinnedPersonId) {
      return people.find(p => p.employeeId === pinnedPersonId) ?? null
    }
    return hoveredPerson
  }, [pinnedPersonId, hoveredPerson, people])

  const handleLassoSelect = useCallback((ids: string[]) => {
    setLassoSelectedIds(new Set(ids))
  }, [])

  // ── Tap-outside (Apple pattern): click en SVG vacío desfija pin ──────
  const handleEmptyClick = useCallback(() => {
    setPinnedPersonId(null)
  }, [])

  // ── Escape global desfija pin (universal Apple/Tesla pattern) ────────
  useEffect(() => {
    if (!pinnedPersonId) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPinnedPersonId(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [pinnedPersonId])

  // ─────────────────────────────────────────────────────────────────────
  // EMPTY STATE
  // ─────────────────────────────────────────────────────────────────────

  if (people.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-8">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-light text-white mb-3">
            9-Box × Exposición IA
          </h1>
          <p className="text-sm font-light text-slate-400">
            No hay personas con clasificación 9-Box todavía. Activa el módulo
            de Performance para desbloquear el triaje de talento.
          </p>
        </div>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────
  // RENDER — motor 2 estados Patrón G (portada → matrix)
  // ─────────────────────────────────────────────────────────────────────

  // NOTA layout: el orchestrator usa `flex items-center justify-center`
  // (centra al child con su altura natural). Por eso NO usamos `absolute
  // inset-0` aquí — el wrapper colapsaría a 0 y no se vería nada.
  // En su lugar: render condicional inline. La portada tiene min-h propia
  // y la matrix tiene su layout flex que ocupa h-full naturalmente.
  return (
    <div className="w-full h-full">
      <AnimatePresence mode="wait">
        {view === 'portada' ? (
          <motion.div
            key="portada"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
            className="w-full h-full"
          >
            <NineBoxPortada
              people={people}
              onContinue={() => setView('matrix')}
            />
          </motion.div>
        ) : (
          <motion.div
            key="matrix"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="w-full h-full"
          >
            <MatrixView
              data={data}
              people={people}
              exposureMin={exposureMin}
              setExposureMin={setExposureMin}
              roleFitMin={roleFitMin}
              setRoleFitMin={setRoleFitMin}
              eligibleIds={eligibleIds}
              lassoSelectedIds={lassoSelectedIds}
              hoveredPerson={hoveredPerson}
              setHoveredPerson={setHoveredPerson}
              displayedPerson={displayedPerson}
              pinnedPersonId={pinnedPersonId}
              stats={stats}
              pattern={pattern}
              handleDotClick={handleDotClick}
              handleLassoSelect={handleLassoSelect}
              handleEmptyClick={handleEmptyClick}
              onBack={() => setView('portada')}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
// MATRIX VIEW — vista interactiva (Estado 2 del motor)
// Encapsula el contenido previo del componente para mantener separación
// limpia entre estado portada y estado matrix.
// ═════════════════════════════════════════════════════════════════════════════

interface MatrixViewProps {
  data: WorkforceDiagnosticData
  people: RetentionEntry[]
  exposureMin: number
  setExposureMin: (n: number) => void
  roleFitMin: number
  setRoleFitMin: (n: number) => void
  eligibleIds: Set<string>
  lassoSelectedIds: Set<string>
  hoveredPerson: RetentionEntry | null
  setHoveredPerson: (p: RetentionEntry | null) => void
  /** Persona mostrada en HUD: pinnedPersonId (si existe) > hoveredPerson */
  displayedPerson: RetentionEntry | null
  /** Para resaltar visualmente el dot pinned en la matriz */
  pinnedPersonId: string | null
  stats: CohortStats
  pattern: PatternResult
  handleDotClick: (id: string) => void
  handleLassoSelect: (ids: string[]) => void
  handleEmptyClick: () => void
  onBack: () => void
}

function MatrixView({
  data,
  people,
  exposureMin,
  setExposureMin,
  roleFitMin,
  setRoleFitMin,
  eligibleIds,
  lassoSelectedIds,
  hoveredPerson,
  setHoveredPerson,
  displayedPerson,
  pinnedPersonId,
  stats,
  pattern,
  handleDotClick,
  handleLassoSelect,
  handleEmptyClick,
  onBack,
}: MatrixViewProps) {
  return (
    <div className="w-full h-full flex flex-col gap-4 p-4 md:p-6 lg:p-8">
      {/* ── Header (mobile-first) ──────────────────────────────────── */}
      <header className="flex-shrink-0 flex flex-col gap-4">
        {/* Top row: título + controles. Mobile = stack; ≥md = row */}
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between md:gap-4">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">
              Instrumento · Triaje de talento
            </p>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-extralight text-white mt-1.5 tracking-tight">
              9-Box <span className="fhr-title-gradient">× Exposición IA</span>
            </h1>
            <p className="text-xs sm:text-sm font-light text-slate-400 mt-2 leading-relaxed">
              Tu mapa de talento × exposición a IA.
            </p>
          </div>
          {/* Controles: en móvil arriba a la derecha de su propia fila, en md a la derecha */}
          <div className="flex items-center gap-3 self-start md:self-auto md:flex-shrink-0">
            <button
              type="button"
              onClick={onBack}
              className="text-[10px] uppercase tracking-widest text-slate-500 hover:text-cyan-400 font-bold transition-colors whitespace-nowrap"
              aria-label="Volver a portada"
            >
              ← Resumen
            </button>
            <ConfidenceDot confidence={data.retentionPriority.confidence} />
          </div>
        </div>

        {/* ── Sliders del escenario ──────────────────────────────── */}
        <div className="flex flex-col md:flex-row gap-4 md:gap-8 items-stretch md:items-center">
          <ScenarioSlider
            label="Exposición crítica"
            value={exposureMin}
            onChange={setExposureMin}
          />
          <ScenarioSlider
            label="Role fit mínimo"
            value={roleFitMin}
            onChange={setRoleFitMin}
          />
        </div>

        {/* ── Leyenda + contador (wrap-friendly) ─────────────────── */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:flex-wrap sm:gap-x-6 sm:gap-y-2 text-[10px] font-mono uppercase tracking-wider text-slate-500">
          <div className="flex items-center flex-wrap gap-x-4 gap-y-1.5">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-cyan-400" />
              <span>Exposición &lt; 40%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              <span>40 – 70%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <span>&gt; 70%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full border-2 border-amber-500" />
              <span>Patrón urgente</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full border-2 border-cyan-400" />
              <span>Patrón estratégico</span>
            </div>
          </div>
          <div className="text-slate-600 sm:ml-auto">
            {eligibleIds.size} de {people.length}{' '}
            {people.length === 1 ? 'persona' : 'personas'} en el escenario
          </div>
        </div>
      </header>

      {/* ── Cuerpo: Matrix arriba/izquierda + HUD abajo/derecha ─── */}
      <div className="flex-1 flex flex-col md:flex-row gap-4 min-h-0">
        <div className="flex-1 fhr-card p-4 md:p-6 min-h-[400px] md:min-h-0 overflow-hidden relative">
          <TeslaLine />
          <NineBoxMatrix
            people={people}
            selectedIds={lassoSelectedIds}
            eligibleIds={eligibleIds}
            onLassoSelect={handleLassoSelect}
            onDotClick={handleDotClick}
            onDotHover={setHoveredPerson}
            onEmptyClick={handleEmptyClick}
          />
        </div>

        <FinancialHUD
          stats={stats}
          pattern={pattern}
          displayedPerson={displayedPerson}
          isPinned={pinnedPersonId !== null && displayedPerson !== null && displayedPerson.employeeId === pinnedPersonId}
        />
      </div>
    </div>
  )
}
