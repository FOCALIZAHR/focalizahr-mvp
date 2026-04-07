'use client'

// ════════════════════════════════════════════════════════════════════════════
// CARGO RAIL CARD — Clonado de EmployeeRailCard, adaptado a descriptores
// w-[160px] h-[200px] con Tesla line por status, formatDisplayName
// ════════════════════════════════════════════════════════════════════════════

import { useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { formatDisplayName } from '@/lib/utils/formatName'
import { CheckCircle, FileText } from 'lucide-react'
import type { PositionWithStatus } from '@/lib/services/JobDescriptorService'

function getTeslaColor(status: string): string {
  if (status === 'CONFIRMED') return 'bg-emerald-500'
  if (status === 'DRAFT') return 'bg-cyan-500'
  return 'bg-amber-500' // NONE = pendiente
}

function getStatusLabel(status: string): string {
  if (status === 'CONFIRMED') return 'Confirmado'
  if (status === 'DRAFT') return 'Borrador'
  return 'Pendiente'
}

interface CargoRailCardProps {
  position: PositionWithStatus
  isSelected: boolean
  onClick: () => void
}

export default function CargoRailCard({ position, isSelected, onClick }: CargoRailCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const teslaColor = getTeslaColor(position.descriptorStatus)
  const isConfirmed = position.descriptorStatus === 'CONFIRMED'

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
      {/* Tesla line TOP */}
      <div className={cn(
        'absolute top-0 left-0 right-0 h-[2px] transition-all duration-300',
        isSelected || isHovered ? teslaColor : 'bg-slate-700',
        isSelected ? 'opacity-100' : isHovered ? 'opacity-80' : 'opacity-30',
        (isSelected || isHovered) && 'shadow-[0_0_10px_currentColor]'
      )} />

      <div className="flex flex-col items-center justify-center h-full p-4">
        {/* Icon */}
        <div className={cn(
          'w-14 h-14 rounded-full flex items-center justify-center',
          'text-sm font-bold border transition-all mb-3 shadow-lg',
          isSelected
            ? 'bg-gradient-to-br from-slate-700 to-slate-800 border-cyan-500/30 text-white'
            : 'bg-slate-800 border-slate-700/50 text-slate-500 group-hover:text-slate-300'
        )}>
          {isConfirmed
            ? <CheckCircle className="w-5 h-5 text-emerald-400" />
            : <FileText className="w-5 h-5" />
          }
        </div>

        {/* Info */}
        <div className="text-center w-full space-y-1">
          <h4 className={cn(
            'font-bold text-xs truncate transition-colors',
            isSelected ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
          )}>
            {formatDisplayName(position.jobTitle, 'full')}
          </h4>
          <p className="text-[9px] text-slate-600 truncate font-medium">
            {position.employeeCount} persona{position.employeeCount !== 1 ? 's' : ''}
          </p>
          {position.departmentNames[0] && (
            <p className="text-[8px] text-slate-700 truncate">
              {position.departmentNames[0]}
            </p>
          )}
        </div>

        {/* Status badge */}
        <div className="mt-3">
          <span className={cn(
            'text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border',
            isConfirmed
              ? 'text-emerald-400/70 border-emerald-500/20 bg-emerald-500/5'
              : 'text-slate-500 border-slate-700/40 bg-slate-800/30'
          )}>
            {getStatusLabel(position.descriptorStatus)}
          </span>
        </div>
      </div>
    </motion.div>
  )
}
