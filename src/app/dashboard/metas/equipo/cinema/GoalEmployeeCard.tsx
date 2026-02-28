// ════════════════════════════════════════════════════════════════════════════
// GOAL EMPLOYEE CARD - Card para Rail Cinema Mode (Estilo evaluaciones)
// src/app/dashboard/metas/equipo/cinema/GoalEmployeeCard.tsx
// 
// BASADO EN: src/components/evaluator/cinema/EmployeeRailCard.tsx
// SIN ICONOS - Solo avatares circulares con iniciales
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { useState, memo } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { TeamMember, AssignmentStatusType } from '@/hooks/useTeamGoals'

// ════════════════════════════════════════════════════════════════════════════
// UTILS
// ════════════════════════════════════════════════════════════════════════════

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map(n => n[0])
    .join('')
    .toUpperCase()
}

// Color de línea Tesla según estado (igual que evaluaciones)
function getTeslaColor(status: AssignmentStatusType): string {
  switch (status) {
    case 'EMPTY':
      return 'bg-amber-500'      // Sin metas = amber
    case 'INCOMPLETE':
      return 'bg-purple-500'     // Incompleta = purple
    case 'EXCEEDED':
      return 'bg-red-500'        // Excedida = red
    case 'READY':
      return 'bg-emerald-500'    // Completa = emerald
    default:
      return 'bg-slate-700'
  }
}

// ════════════════════════════════════════════════════════════════════════════
// TIPOS
// ════════════════════════════════════════════════════════════════════════════

interface GoalEmployeeCardProps {
  employee: TeamMember
  isSelected: boolean
  onClick: () => void
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE
// ════════════════════════════════════════════════════════════════════════════

export const GoalEmployeeCard = memo(function GoalEmployeeCard({
  employee,
  isSelected,
  onClick,
}: GoalEmployeeCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  const status = employee.assignmentStatus?.status || 'EMPTY'
  const totalWeight = employee.assignmentStatus?.totalWeight || 0
  const goalCount = employee.assignmentStatus?.goalCount || 0
  const teslaColor = getTeslaColor(status)

  return (
    <motion.div
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ y: -5 }}
      className={cn(
        'snap-start flex-shrink-0 w-[160px] h-[200px] rounded-xl cursor-pointer',
        'transition-all duration-300 relative group overflow-hidden border',
        isSelected
          ? 'bg-slate-800 border-cyan-500/50 shadow-[0_0_20px_-5px_rgba(34,211,238,0.15)]'
          : 'bg-slate-900/40 border-white/5 hover:bg-slate-800 hover:border-white/10'
      )}
    >
      {/* Línea Tesla TOP - Color dinámico según estado */}
      <div className={cn(
        'absolute top-0 left-0 right-0 h-[2px] transition-all duration-300',
        isSelected || isHovered ? teslaColor : 'bg-slate-700',
        isSelected ? 'opacity-100' : isHovered ? 'opacity-80' : 'opacity-30',
        (isSelected || isHovered) && 'shadow-[0_0_10px_currentColor]'
      )} />

      <div className="flex flex-col items-center justify-center h-full p-4">

        {/* Avatar circular con iniciales (igual que evaluaciones) */}
        <div className={cn(
          'w-14 h-14 rounded-full flex items-center justify-center',
          'text-sm font-bold border transition-all mb-3 shadow-lg',
          isSelected
            ? 'bg-gradient-to-br from-slate-700 to-slate-800 border-cyan-500/30 text-white'
            : 'bg-slate-800 border-slate-700/50 text-slate-500 group-hover:text-slate-300'
        )}>
          {getInitials(employee.fullName)}
        </div>

        {/* Info */}
        <div className="text-center w-full space-y-1">
          <h4 className={cn(
            'font-bold text-xs truncate transition-colors',
            isSelected ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
          )}>
            {employee.fullName}
          </h4>
          <p className="text-[9px] text-slate-600 truncate font-medium">
            {employee.position}
          </p>
        </div>

        {/* Status indicator (sin iconos, solo texto y barra) */}
        <div className="mt-3 w-full px-2">
          {/* Barra de peso */}
          <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden mb-1">
            <div 
              className={cn(
                'h-full rounded-full transition-all',
                status === 'EMPTY' && 'bg-amber-500',
                status === 'INCOMPLETE' && 'bg-purple-500',
                status === 'READY' && 'bg-emerald-500',
                status === 'EXCEEDED' && 'bg-red-500',
              )}
              style={{ width: `${Math.min(100, totalWeight)}%` }}
            />
          </div>
          
          {/* Labels */}
          <div className="flex items-center justify-between">
            <span className="text-[8px] text-slate-600 font-medium">
              {goalCount} {goalCount === 1 ? 'meta' : 'metas'}
            </span>
            <span className={cn(
              'text-[8px] font-bold',
              status === 'EMPTY' && 'text-amber-400',
              status === 'INCOMPLETE' && 'text-purple-400',
              status === 'READY' && 'text-emerald-400',
              status === 'EXCEEDED' && 'text-red-400',
            )}>
              {totalWeight}%
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  )
})

export default GoalEmployeeCard