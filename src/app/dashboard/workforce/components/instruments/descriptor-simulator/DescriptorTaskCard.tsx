'use client'

// ════════════════════════════════════════════════════════════════════════════
// DESCRIPTOR TASK CARD — slider de horas + toggle 3 estados + badge rescate
// src/app/dashboard/workforce/components/instruments/descriptor-simulator/DescriptorTaskCard.tsx
// ════════════════════════════════════════════════════════════════════════════
// Card individual por tarea del descriptor.
// Animación framer-motion: opacidad reducida cuando state === 'automated'.
// Tono arbitrador: badge solo muestra "rescate" cuando el CEO automatiza/aumenta.
// ════════════════════════════════════════════════════════════════════════════

import { memo } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import {
  HORAS_MAX_TAREA,
  STATE_ACTIVE_CLASS,
  STATE_LABEL,
  betaHeatmap,
  taskFinancialLine,
  type EditableTask,
  type TaskState,
} from './descriptor-simulator-utils'
import { formatCLP } from '../_shared/format'

interface DescriptorTaskCardProps {
  task: EditableTask
  valorHora: number
  onChangeHours: (taskId: string, hours: number) => void
  onChangeState: (taskId: string, state: TaskState) => void
}

const STATE_ORDER: TaskState[] = ['human', 'augmented', 'automated']

const ACCENT_TEXT: Record<'slate' | 'amber' | 'cyan', string> = {
  slate: 'text-slate-300',
  amber: 'text-amber-300',
  cyan: 'text-cyan-300',
}

export default memo(function DescriptorTaskCard({
  task,
  valorHora,
  onChangeHours,
  onChangeState,
}: DescriptorTaskCardProps) {
  const isAutomated = task.state === 'automated'
  const heatmap = betaHeatmap(task.betaScore)
  const financialLine = taskFinancialLine(task, valorHora)
  const dominioPct =
    task.betaScore !== null ? Math.round(task.betaScore * 100) : null

  return (
    <motion.div
      animate={{ opacity: isAutomated ? 0.6 : 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="fhr-card p-4 relative overflow-hidden"
    >
      {/* Header — descripción + hint O*NET */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <p className="text-sm font-light text-slate-300 leading-snug flex-1">
          {task.description}
        </p>
        {task.isAutomatedHint && (
          <span className="text-[9px] uppercase tracking-widest text-amber-400/60 font-bold flex-shrink-0">
            O*NET hint
          </span>
        )}
      </div>

      {/* Heatmap bar — semáforo de riesgo por betaScore */}
      <div
        className="h-[2px] w-full rounded-full mb-1.5"
        style={{
          backgroundColor: heatmap.bgColor,
          boxShadow: heatmap.glow,
        }}
        aria-label={
          heatmap.level === 'critical'
            ? 'Exposición crítica'
            : heatmap.level === 'medium'
            ? 'Exposición media'
            : 'Core humano'
        }
      />

      {/* Dominio IA — texto explícito del betaScore */}
      <div className="flex items-baseline justify-between mb-4">
        <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500">
          Dominio IA
        </span>
        <span
          className={cn(
            'text-[11px] font-mono font-bold tabular-nums',
            heatmap.level === 'critical'
              ? 'text-red-400'
              : heatmap.level === 'medium'
              ? 'text-amber-400'
              : 'text-cyan-400',
          )}
        >
          {dominioPct !== null ? `${dominioPct}%` : '—'}
        </span>
      </div>

      {/* Slider de horas — con label contextual */}
      <div className="mb-3">
        <div className="flex items-baseline justify-between mb-1.5">
          <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500">
            Horas/mes dedicadas
          </span>
          <span className="text-xs font-mono font-bold text-cyan-400 tabular-nums">
            {task.hours}h
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={HORAS_MAX_TAREA}
          step={1}
          value={task.hours}
          onChange={e => onChangeHours(task.taskId, parseInt(e.target.value, 10))}
          className="w-full h-1 bg-slate-800 rounded-full appearance-none cursor-pointer accent-cyan-400"
          aria-label={`Horas mensuales asignadas a ${task.description}`}
        />
      </div>

      {/* Toggle 3 estados */}
      <div
        className="grid grid-cols-3 gap-1 text-[10px] uppercase tracking-widest font-bold"
        role="radiogroup"
      >
        {STATE_ORDER.map(s => {
          const active = task.state === s
          return (
            <button
              key={s}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChangeState(task.taskId, s)}
              className={cn(
                'py-1.5 rounded transition-all',
                active
                  ? STATE_ACTIVE_CLASS[s]
                  : 'text-slate-500 border border-slate-700/40 hover:border-slate-600/60 hover:text-slate-400',
              )}
            >
              {STATE_LABEL[s]}
            </button>
          )
        })}
      </div>

      {/* Financial line — siempre visible, contextual al estado */}
      <motion.div
        key={task.state}
        initial={{ opacity: 0, y: -3 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="mt-3 pt-3 border-t border-white/5 flex items-baseline justify-between gap-2 text-[10px] font-mono"
      >
        <span className="uppercase tracking-wider text-slate-500 truncate">
          {financialLine.label}
          {financialLine.detail && (
            <span className="ml-1.5 normal-case tracking-normal text-slate-600">
              ({financialLine.detail})
            </span>
          )}
        </span>
        <span
          className={cn(
            'tabular-nums font-bold whitespace-nowrap',
            ACCENT_TEXT[financialLine.accent],
          )}
        >
          {formatCLP(financialLine.amount)} / mes
        </span>
      </motion.div>
    </motion.div>
  )
})
