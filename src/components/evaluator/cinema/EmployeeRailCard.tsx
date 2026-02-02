'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { getInitials } from '@/lib/utils/formatName'
import { StatusDot } from './StatusDot'
import type { EmployeeRailCardProps } from '@/types/evaluator-cinema'

export default function EmployeeRailCard({
  employee,
  isSelected,
  onClick
}: EmployeeRailCardProps) {
  return (
    <motion.div
      onClick={onClick}
      whileHover={{ y: -5 }}
      className={cn(
        'snap-start flex-shrink-0 w-[160px] h-[200px] rounded-xl cursor-pointer',
        'transition-all duration-300 relative group overflow-hidden border',
        isSelected
          ? 'bg-slate-800 border-cyan-500/50 shadow-[0_0_20px_-5px_rgba(34,211,238,0.15)]'
          : 'bg-slate-900/40 border-white/5 hover:bg-slate-800 hover:border-white/10'
      )}
    >
      {/* Linea Tesla Mini */}
      <div className={cn(
        'absolute top-0 left-0 right-0 h-[2px] transition-all duration-300',
        isSelected
          ? 'bg-cyan-400 opacity-100'
          : 'bg-cyan-400 opacity-0 group-hover:opacity-50'
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

        {/* Status Indicator */}
        <div className="mt-3">
          <StatusDot status={employee.status} />
        </div>
      </div>
    </motion.div>
  )
}
