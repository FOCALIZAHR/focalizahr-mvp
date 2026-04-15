'use client'

// ════════════════════════════════════════════════════════════════════════════
// CAPA ANCLA — "El Gran Divisor"
// src/app/dashboard/workforce/components/instruments/descriptor-simulator/capas/CapaAncla.tsx
// ════════════════════════════════════════════════════════════════════════════
// 3 bloques cubeta con identidad visual distinta:
//   1. Soberanía Humana (beta=0) — slate, sin glow
//   2. Potencial Aumentado (beta=0.5) — glassmorphism + Tesla purple
//   3. Zona de Rescate (beta=1.0) — glassmorphism + Tesla cyan + dot pulsante
//
// Cada bloque muestra: # tareas | horas/mes | costo CLP + micro-narrativa.
// ════════════════════════════════════════════════════════════════════════════

import { memo } from 'react'
import { motion } from 'framer-motion'
import TeslaLine from '../../_shared/TeslaLine'
import { formatCLP, formatHours } from '../../_shared/format'
import {
  BLOCK_META,
  calcBlockStats,
  classifyTasks,
  type BetaCategory,
  type BlockMeta,
  type BlockStats,
  type ForensicTask,
} from '../descriptor-simulator-utils'

interface CapaAnclaProps {
  tasks: ForensicTask[]
  costPerHour: number
}

export default memo(function CapaAncla({ tasks, costPerHour }: CapaAnclaProps) {
  const grouped = classifyTasks(tasks)

  const blocks: Array<{ cat: BetaCategory; stats: BlockStats; meta: BlockMeta }> = [
    {
      cat: 'soberania',
      stats: calcBlockStats(grouped.soberania, costPerHour),
      meta: BLOCK_META.soberania,
    },
    {
      cat: 'aumentado',
      stats: calcBlockStats(grouped.aumentado, costPerHour),
      meta: BLOCK_META.aumentado,
    },
    {
      cat: 'rescate',
      stats: calcBlockStats(grouped.rescate, costPerHour),
      meta: BLOCK_META.rescate,
    },
  ]

  return (
    <section>
      <p className="text-[9px] uppercase tracking-widest text-slate-500 font-bold mb-3">
        El Gran Divisor
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        {blocks.map((b, i) => (
          <BlockCard key={b.cat} meta={b.meta} stats={b.stats} index={i} />
        ))}
      </div>
    </section>
  )
})

// ─────────────────────────────────────────────────────────────────────────────
// BlockCard — una cubeta (Soberanía / Aumentado / Rescate)
// ─────────────────────────────────────────────────────────────────────────────

function BlockCard({
  meta,
  stats,
  index,
}: {
  meta: BlockMeta
  stats: BlockStats
  index: number
}) {
  const hasTesla = meta.teslaColor !== undefined
  const isRescate = meta.key === 'rescate'

  // Fondo distinto por bloque
  const containerClass =
    meta.key === 'soberania'
      ? 'bg-slate-900/70 border-white/5'
      : meta.key === 'aumentado'
      ? 'bg-white/[0.04] border-purple-500/10 backdrop-blur-md'
      : 'bg-white/[0.04] border-cyan-500/20 backdrop-blur-md'

  // KPI color
  const kpiColor =
    meta.key === 'soberania'
      ? 'text-slate-300'
      : meta.key === 'aumentado'
      ? 'text-purple-300'
      : 'text-cyan-300'

  // Suprimimos `index` en la versión compacta (no hay stagger animado)
  void index

  return (
    <div
      className={`relative overflow-hidden rounded-xl border p-3 ${containerClass}`}
    >
      {hasTesla && <TeslaLine />}

      {/* Header con dot */}
      <div className="flex items-center gap-1.5 mb-2">
        <div
          className="w-1 h-1 rounded-full relative"
          style={{ backgroundColor: meta.dotColor }}
        >
          {isRescate && (
            <motion.span
              className="absolute inset-0 rounded-full"
              style={{ backgroundColor: meta.dotColor }}
              animate={{ opacity: [0.4, 0, 0.4], scale: [1, 2, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
          )}
        </div>
        <p className="text-[8px] uppercase tracking-widest font-bold text-slate-400 truncate">
          {meta.title}
        </p>
      </div>

      {/* Stats: # tareas · horas */}
      <p className="text-[10px] font-mono text-slate-500 tabular-nums mb-1.5">
        <span className="text-slate-200 font-bold">{stats.taskCount}</span>{' '}
        {stats.taskCount === 1 ? 'tarea' : 'tareas'}
        <span className="text-slate-700 mx-1">·</span>
        <span className="text-slate-200 font-bold">
          {formatHours(stats.totalHours)}
        </span>
      </p>

      {/* KPI principal (costo CLP compacto) */}
      <div>
        <p className="text-[8px] uppercase tracking-widest text-slate-500 font-bold mb-0.5 truncate">
          {meta.kpiLabel}
        </p>
        <p className={`text-base font-mono tabular-nums ${kpiColor}`}>
          {formatCLP(stats.totalCost)}
          <span className="text-[9px] text-slate-600 font-light ml-1">/mes</span>
        </p>
      </div>
    </div>
  )
}
