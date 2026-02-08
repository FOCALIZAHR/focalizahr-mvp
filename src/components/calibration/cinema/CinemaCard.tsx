// ════════════════════════════════════════════════════════════════════════════
// CINEMA CARD - Tarjeta de empleado draggable
// src/components/calibration/cinema/CinemaCard.tsx
// ════════════════════════════════════════════════════════════════════════════
// Portado de maqueta CinemaNineBox.tsx + @dnd-kit useDraggable
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { memo } from 'react'
import { useDraggable } from '@dnd-kit/core'
import { cn } from '@/lib/utils'
import { GripVertical, AlertTriangle } from 'lucide-react'
import type { CinemaEmployee } from '../hooks/useCalibrationRoom'

// Paleta semántica por status
const STATUS_COLORS: Record<string, { line: string; text: string }> = {
  STARS: { line: 'bg-purple-500', text: 'text-purple-400' },
  HIGH: { line: 'bg-cyan-500', text: 'text-cyan-400' },
  CORE: { line: 'bg-emerald-500', text: 'text-emerald-400' },
  RISK: { line: 'bg-rose-500', text: 'text-rose-400' },
  NEUTRAL: { line: 'bg-slate-600', text: 'text-slate-400' },
}

interface CinemaCardProps {
  employee: CinemaEmployee
  isReadOnly: boolean
  onClick: (emp: CinemaEmployee) => void
}

export default memo(function CinemaCard({
  employee,
  isReadOnly,
  onClick
}: CinemaCardProps) {
  const style = STATUS_COLORS[employee.status] || STATUS_COLORS.NEUTRAL

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: employee.id,
    disabled: isReadOnly,
    data: { employee }
  })

  const dragStyle = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined

  return (
    <div
      ref={setNodeRef}
      style={dragStyle}
      {...listeners}
      {...attributes}
      onClick={() => onClick(employee)}
      className={cn(
        'group relative w-full p-3 rounded-lg border transition-all duration-200',
        'bg-[#111827] hover:bg-[#161e2e]',
        'hover:shadow-lg',
        employee.isPendingPotential
          ? 'border-amber-500/50 border-2 hover:border-amber-400/60'
          : 'border-slate-800 hover:border-slate-700',
        isReadOnly ? 'cursor-default' : 'cursor-grab active:cursor-grabbing',
        isDragging && 'opacity-30'
      )}
    >
      {/* Badge amber: sin potencial asignado */}
      {employee.isPendingPotential && (
        <div className="absolute -top-2 right-2 px-1.5 py-0.5 bg-amber-500/20 border border-amber-500/50 rounded text-[9px] font-bold text-amber-400 flex items-center gap-0.5 z-10">
          <AlertTriangle size={10} />
          <span>Sin potencial</span>
        </div>
      )}

      {/* Línea Tesla Vertical */}
      <div className={cn(
        'absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full transition-all duration-300',
        style.line,
        'opacity-60 group-hover:opacity-100'
      )} />

      <div className="flex items-center gap-3 pl-2">
        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-[#0B1120] border border-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-400 group-hover:text-white group-hover:border-slate-600 transition-colors relative">
          {employee.avatar}
          {/* Punto cyan si tiene cambios */}
          {employee.hasChanged && (
            <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-cyan-400 ring-2 ring-[#111827]" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h4 className="text-xs font-bold text-slate-200 truncate group-hover:text-white transition-colors">
            {employee.name}
          </h4>
          <p className="text-[10px] text-slate-500 truncate group-hover:text-slate-400">
            {employee.role}
          </p>
          {/* Score indicator con cambio */}
          {employee.hasChanged ? (
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-[9px] text-slate-600 line-through font-mono">
                {employee.calculatedScore.toFixed(1)}
              </span>
              <span className="text-[9px] text-cyan-400 font-mono font-bold">
                {employee.effectiveScore.toFixed(1)}
              </span>
            </div>
          ) : (
            <span className="text-[9px] text-slate-600 font-mono mt-0.5 block">
              {employee.effectiveScore.toFixed(1)}
            </span>
          )}
        </div>

        {/* Grip Handle */}
        {!isReadOnly && (
          <div className="text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity">
            <GripVertical size={14} />
          </div>
        )}
      </div>
    </div>
  )
})

// ════════════════════════════════════════════════════════════════════════════
// OVERLAY CARD - Versión visual pura para DragOverlay (sin hooks)
// ════════════════════════════════════════════════════════════════════════════

export function CinemaCardOverlay({ employee }: { employee: CinemaEmployee }) {
  const style = STATUS_COLORS[employee.status] || STATUS_COLORS.NEUTRAL

  return (
    <div className="relative w-64 p-3 rounded-lg border border-cyan-500/50 bg-[#111827] shadow-2xl shadow-cyan-500/10 cursor-grabbing">
      {/* Línea Tesla Vertical */}
      <div className={cn(
        'absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full',
        style.line
      )} />

      <div className="flex items-center gap-3 pl-2">
        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-[#0B1120] border border-slate-700 flex items-center justify-center text-[10px] font-bold text-white relative">
          {employee.avatar}
          {employee.hasChanged && (
            <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-cyan-400 ring-2 ring-[#111827]" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h4 className="text-xs font-bold text-white truncate">
            {employee.name}
          </h4>
          <p className="text-[10px] text-slate-400 truncate">
            {employee.role}
          </p>
          <span className="text-[9px] text-cyan-400 font-mono font-bold mt-0.5 block">
            {employee.effectiveScore.toFixed(1)}
          </span>
        </div>

        <GripVertical size={14} className="text-slate-500" />
      </div>
    </div>
  )
}
