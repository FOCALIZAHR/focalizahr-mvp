// ════════════════════════════════════════════════════════════════════════════
// CINEMA GRID - Matriz 9-Box con @dnd-kit droppable
// src/components/calibration/cinema/CinemaGrid.tsx
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { memo } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { cn } from '@/lib/utils'
import { TrendingUp, Target } from 'lucide-react'
import CinemaCard from './CinemaCard'
import type { CinemaEmployee } from '../hooks/useCalibrationRoom'

// ════════════════════════════════════════════════════════════════════════════
// GRID BOXES CONFIG
// ════════════════════════════════════════════════════════════════════════════

const GRID_BOXES = [
  // Row 1 (High Potential) - top row
  { id: 'q7', title: 'Diamante en Bruto', status: 'HIGH', label: 'Alto Potencial / Bajo Desempeño' },
  { id: 'q8', title: 'Alto Potencial', status: 'HIGH', label: 'Alto Potencial / Medio Desempeño' },
  { id: 'q9', title: 'ESTRELLAS', status: 'STARS', label: 'Top Talent', highlight: true },
  // Row 2 (Med Potential)
  { id: 'q4', title: 'Inconsistente', status: 'NEUTRAL', label: 'Medio Potencial / Bajo Desempeño' },
  { id: 'q5', title: 'Core', status: 'CORE', label: 'El motor de la empresa' },
  { id: 'q6', title: 'Alto Desempeño', status: 'HIGH', label: 'Medio Potencial / Alto Desempeño' },
  // Row 3 (Low Potential) - bottom row
  { id: 'q1', title: 'Riesgo', status: 'RISK', label: 'Bajo Potencial / Bajo Desempeño', danger: true },
  { id: 'q2', title: 'Efectivo', status: 'NEUTRAL', label: 'Bajo Potencial / Medio Desempeño' },
  { id: 'q3', title: 'Experto', status: 'CORE', label: 'Especialista Técnico' },
]

interface CinemaGridProps {
  employees: CinemaEmployee[]
  isReadOnly: boolean
  onCardClick: (emp: CinemaEmployee) => void
}

export default memo(function CinemaGrid({
  employees,
  isReadOnly,
  onCardClick
}: CinemaGridProps) {
  return (
    <div className="relative flex-1 flex flex-col h-full">
      {/* Axis labels */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 -rotate-90 text-[9px] font-bold tracking-[0.3em] text-slate-600 flex items-center gap-2 pointer-events-none select-none">
        <TrendingUp size={10} /> POTENCIAL
      </div>
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-[9px] font-bold tracking-[0.3em] text-slate-600 flex items-center gap-2 pointer-events-none select-none">
        <Target size={10} /> DESEMPEÑO
      </div>

      {/* 3x3 Grid */}
      <div className="flex-1 ml-6 mb-4 grid grid-cols-3 grid-rows-3 gap-3">
        {GRID_BOXES.map((box) => (
          <DroppableBox
            key={box.id}
            box={box}
            employees={employees.filter(e => e.quadrant === box.id)}
            isReadOnly={isReadOnly}
            onCardClick={onCardClick}
          />
        ))}
      </div>
    </div>
  )
})

// ════════════════════════════════════════════════════════════════════════════
// DROPPABLE BOX
// ════════════════════════════════════════════════════════════════════════════

interface DroppableBoxProps {
  box: typeof GRID_BOXES[number]
  employees: CinemaEmployee[]
  isReadOnly: boolean
  onCardClick: (emp: CinemaEmployee) => void
}

function DroppableBox({ box, employees, isReadOnly, onCardClick }: DroppableBoxProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: box.id
  })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'relative rounded-xl border flex flex-col p-2 transition-all duration-300',
        'bg-[#0B1120]/60 backdrop-blur-sm',
        box.highlight ? 'border-purple-500/30 bg-purple-900/5' :
        box.danger ? 'border-rose-500/30 bg-rose-900/5' : 'border-slate-800',
        isOver && !isReadOnly && 'border-cyan-500/50 bg-cyan-900/10 ring-1 ring-cyan-500/30'
      )}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-2 px-1">
        <div>
          <span className={cn(
            'text-[10px] font-bold uppercase tracking-wider block',
            box.highlight ? 'text-purple-400' :
            box.danger ? 'text-rose-400' : 'text-slate-400'
          )}>
            {box.title}
          </span>
          <span className="text-[8px] text-slate-600 font-medium truncate max-w-[120px] block">
            {box.label}
          </span>
        </div>
        <span className="text-[9px] font-mono bg-[#111827] text-slate-500 px-1.5 py-0.5 rounded border border-slate-800">
          {employees.length}
        </span>
      </div>

      {/* Cards */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
        {employees.map(emp => (
          <CinemaCard
            key={emp.id}
            employee={emp}
            isReadOnly={isReadOnly}
            onClick={onCardClick}
          />
        ))}
        {employees.length === 0 && (
          <div className={cn(
            'h-full min-h-[60px] flex items-center justify-center transition-opacity',
            isOver ? 'opacity-100' : 'opacity-40'
          )}>
            <div className="border border-dashed border-slate-800 rounded px-3 py-2 text-[9px] text-slate-700 uppercase">
              Vacío
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
