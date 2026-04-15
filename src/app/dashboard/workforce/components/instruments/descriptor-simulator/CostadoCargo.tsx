'use client'

// ════════════════════════════════════════════════════════════════════════════
// COSTADO CARGO — Columna izquierda 30% del Layout 30/70
// CostadoCargo.tsx
// ════════════════════════════════════════════════════════════════════════════
// Compartido entre Página 5 (Dashboard) y Página 6 (Simulador).
//
// Estructura:
//   1. Header: CARGO + jobTitle
//   2. Barra exposición (rollupClientExposure × 100)
//   3. 3 cards por β:
//      - SOLO PERSONAS  (β=0)   → tareas que seguirán siendo tuyas
//      - PERSONAS + IA  (β=0.5) → tareas que pueden acelerarse
//      - DELEGABLE A IA (β=1.0) → tareas que la IA puede hacer sola
//
// Modo Página 5: cards informativas (clickables → entran a P6 con filtro)
// Modo Página 6: cards filtrantes (selected state activo)
// ════════════════════════════════════════════════════════════════════════════

import { memo } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { formatHours } from '../_shared/format'
import CostadoCargoSelector from './CostadoCargoSelector'
import {
  BLOCK_META,
  calcBlockStats,
  classifyTasks,
  getCargoMission,
  type BetaCategory,
  type ForensicTask,
} from './descriptor-simulator-utils'
import type { SimulatorDescriptorListItem } from '@/app/api/descriptors/simulator-list/route'

interface CostadoCargoProps {
  jobTitle: string
  exposurePct: number              // rollupClientExposure × 100 (0-100)
  tasks: ForensicTask[]
  costPerHour: number
  /** Headcount del cargo — para que getCargoMission calcule monto agregado */
  headcount: number
  /** Categoría seleccionada (modo P6 con filtro). null = ninguna (modo P5). */
  selectedCategory: BetaCategory | null
  onSelectCategory: (cat: BetaCategory) => void
  /** Si se pasan, muestra el selector de cargo Gerencia+Cargo arriba. */
  descriptors?: SimulatorDescriptorListItem[]
  selectedKey?: string | null
  onChangeCargo?: (key: string) => void
}

const CARD_PHRASE: Record<BetaCategory, { title: string; phrase: string }> = {
  soberania: {
    title: 'Solo Personas',
    phrase: 'Tareas que seguirán siendo tuyas',
  },
  aumentado: {
    title: 'Personas + IA',
    phrase: 'Tareas que pueden acelerarse',
  },
  rescate: {
    title: 'Delegable a IA',
    phrase: 'Tareas que la IA puede hacer sola',
  },
}

export default memo(function CostadoCargo({
  jobTitle,
  exposurePct,
  tasks,
  costPerHour,
  headcount,
  selectedCategory,
  onSelectCategory,
  descriptors,
  selectedKey,
  onChangeCargo,
}: CostadoCargoProps) {
  const showSelector =
    descriptors !== undefined && selectedKey !== undefined && onChangeCargo !== undefined
  const mission = getCargoMission(tasks, costPerHour, headcount)
  const grouped = classifyTasks(tasks)
  const stats = {
    soberania: calcBlockStats(grouped.soberania, costPerHour),
    aumentado: calcBlockStats(grouped.aumentado, costPerHour),
    rescate: calcBlockStats(grouped.rescate, costPerHour),
  }

  const exposureClamped = Math.max(0, Math.min(100, exposurePct))

  return (
    <div className="h-full flex flex-col px-4 py-4 overflow-hidden">
      {/* Selector de cargo compacto (solo si se provee) */}
      {showSelector && (
        <CostadoCargoSelector
          descriptors={descriptors!}
          selectedKey={selectedKey ?? null}
          onChange={onChangeCargo!}
        />
      )}

      {/* Header — CARGO (oculto cuando hay selector, redundante) */}
      {!showSelector && (
        <div className="shrink-0 mb-5">
          <p className="text-[9px] uppercase tracking-widest font-bold text-slate-500 mb-1">
            Cargo
          </p>
          <h3 className="text-sm font-light text-slate-200 leading-tight truncate">
            {jobTitle}
          </h3>
        </div>
      )}

      {/* TU POTENCIAL — narrativa dinámica desde getCargoMission */}
      <MissionBlock mission={mission} />

      {/* Headcount — contexto crítico del cargo (#5) */}
      <p className="shrink-0 -mt-3 mb-5 text-[11px] font-light text-slate-400">
        <span className="text-slate-200 font-medium tabular-nums">{Math.max(1, headcount)}</span>{' '}
        {headcount === 1 ? 'persona' : 'personas'} en este cargo
      </p>

      {/* Barra exposición */}
      <div className="shrink-0 mb-6">
        <div className="flex items-baseline justify-between mb-1.5">
          <p className="text-[9px] uppercase tracking-widest font-bold text-slate-500">
            Exposición IA
          </p>
          <p className="text-base font-mono font-bold tabular-nums text-cyan-300">
            {Math.round(exposureClamped)}%
          </p>
        </div>
        <div className="h-1.5 bg-slate-800/80 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${exposureClamped}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
      </div>

      {/* 3 cards por β */}
      <div className="flex-1 flex flex-col gap-2.5 overflow-y-auto min-h-0">
        {(['soberania', 'aumentado', 'rescate'] as BetaCategory[]).map(cat => (
          <BetaCard
            key={cat}
            cat={cat}
            count={stats[cat].taskCount}
            hours={stats[cat].totalHours}
            isSelected={selectedCategory === cat}
            onClick={() => onSelectCategory(cat)}
          />
        ))}
      </div>
    </div>
  )
})

// ─────────────────────────────────────────────────────────────────────────────
// MISSION BLOCK — bloque "Tu Potencial" calculado dinámicamente
// ─────────────────────────────────────────────────────────────────────────────

function MissionBlock({
  mission,
}: {
  mission: ReturnType<typeof getCargoMission>
}) {
  const accentClass =
    mission.accent === 'cyan'
      ? 'border-cyan-500/25 text-cyan-300'
      : mission.accent === 'purple'
        ? 'border-purple-500/25 text-purple-300'
        : 'border-slate-700/40 text-slate-400'

  return (
    <div
      className={cn(
        'shrink-0 mb-5 rounded-xl border bg-slate-900/40 backdrop-blur-md px-3 py-2.5',
        accentClass.split(' ')[0], // solo border color
      )}
    >
      <p
        className={cn(
          'text-[9px] uppercase tracking-widest font-bold mb-1',
          accentClass.split(' ')[1], // solo text color
        )}
      >
        {mission.title}
      </p>
      <p className="text-[11px] font-light text-slate-300 leading-relaxed">
        {mission.body}
      </p>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// BETA CARD — una de las 3 cubetas
// ─────────────────────────────────────────────────────────────────────────────

function BetaCard({
  cat,
  count,
  hours,
  isSelected,
  onClick,
}: {
  cat: BetaCategory
  count: number
  hours: number
  isSelected: boolean
  onClick: () => void
}) {
  const meta = BLOCK_META[cat]
  const copy = CARD_PHRASE[cat]
  const colorClasses =
    cat === 'soberania'
      ? 'border-slate-700/40 bg-slate-900/50 text-slate-300'
      : cat === 'aumentado'
        ? 'border-purple-500/15 bg-white/[0.03] text-purple-300'
        : 'border-cyan-500/20 bg-white/[0.04] text-cyan-300'

  const selectedRing =
    cat === 'soberania'
      ? 'ring-1 ring-slate-500/40'
      : cat === 'aumentado'
        ? 'ring-1 ring-purple-400/50'
        : 'ring-1 ring-cyan-400/60'

  const isEmpty = count === 0

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isEmpty}
      className={cn(
        'text-left rounded-lg border px-3 py-2.5 transition-all backdrop-blur-md',
        colorClasses,
        isSelected && selectedRing,
        isEmpty && 'opacity-40 cursor-not-allowed',
        !isEmpty && !isSelected && 'hover:border-opacity-60',
      )}
    >
      <div className="flex items-center justify-between mb-1">
        <p className="text-[9px] uppercase tracking-widest font-bold text-slate-400">
          {copy.title}
        </p>
        <span
          className="w-1 h-1 rounded-full flex-shrink-0"
          style={{ backgroundColor: meta.dotColor }}
        />
      </div>
      <p className="text-sm font-mono font-bold tabular-nums leading-none mb-1">
        {count} {count === 1 ? 'tarea' : 'tareas'}
        {!isEmpty && (
          <span className="text-[10px] text-slate-500 font-light ml-2">
            · {formatHours(hours)}/mes
          </span>
        )}
      </p>
      <p className="text-[9px] font-light text-slate-500 leading-tight">
        {copy.phrase}
      </p>
    </button>
  )
}
