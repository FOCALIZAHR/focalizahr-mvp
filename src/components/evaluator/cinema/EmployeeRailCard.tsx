'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { getInitials } from '@/lib/utils/formatName'
import ProgressDots from './ProgressDots'
import type { EmployeeRailCardProps } from '@/types/evaluator-cinema'

// Colores de linea Tesla segun estado
function getTeslaColor(hasED: boolean, hasPT: boolean, hasPDI: boolean): string {
  if (!hasED) return 'bg-amber-500'      // Sin ED = amber
  if (!hasPT) return 'bg-cyan-500'       // Sin PT = cyan
  if (!hasPDI) return 'bg-purple-500'    // Sin PDI = purple
  return 'bg-emerald-500'                 // Completo = emerald
}

export default function EmployeeRailCard({
  employee,
  isSelected,
  onClick
}: EmployeeRailCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  const hasED = employee.status === 'completed'
  const hasPT = employee.potentialScore !== null
  const hasPDI = employee.hasPDI ?? false
  const teslaColor = getTeslaColor(hasED, hasPT, hasPDI)

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
      {/* Linea Tesla TOP - Color dinamico segun estado */}
      <div className={cn(
        'absolute top-0 left-0 right-0 h-[2px] transition-all duration-300',
        isSelected || isHovered ? teslaColor : 'bg-slate-700',
        isSelected ? 'opacity-100' : isHovered ? 'opacity-80' : 'opacity-30',
        (isSelected || isHovered) && 'shadow-[0_0_10px_currentColor]'
      )} />

      <div className="flex flex-col items-center justify-center h-full p-4">

        {/* Avatar */}
        <div className={cn(
          'w-14 h-14 rounded-full flex items-center justify-center',
          'text-sm font-bold border transition-all mb-3 shadow-lg',
          isSelected
            ? 'bg-gradient-to-br from-slate-700 to-slate-800 border-cyan-500/30 text-white'
            : 'bg-slate-800 border-slate-700/50 text-slate-500 group-hover:text-slate-300'
        )}>
          {getInitials(employee.displayName)}
        </div>

        {/* Info */}
        <div className="text-center w-full space-y-1">
          <h4 className={cn(
            'font-bold text-xs truncate transition-colors',
            isSelected ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
          )}>
            {employee.displayName}
          </h4>
          <p className="text-[9px] text-slate-600 truncate font-medium">
            {employee.position}
          </p>
        </div>

        {/* Progress Dots (reemplaza StatusDot) */}
        <div className="mt-3">
          <ProgressDots
            hasED={hasED}
            hasPT={hasPT}
            hasPDI={hasPDI}
            edScore={employee.avgScore}
            edLevel={employee.status === 'completed' ? 'Completado' : undefined}
            ptScore={employee.potentialScore}
            ptLevel={employee.potentialLevel}
          />
        </div>
      </div>
    </motion.div>
  )
}
