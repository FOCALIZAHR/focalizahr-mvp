'use client'

// ============================================================================
// TrackGroupCard - Collapsible card per performance track
// Groups employees by EJECUTIVO / MANAGER / COLABORADOR
// ============================================================================

import { memo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ChevronUp, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ClassificationEmployee, PerformanceTrack } from '@/types/job-classification'

// ══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ══════════════════════════════════════════════════════════════════════════

const TRACK_CONFIG: Record<PerformanceTrack, {
  label: string
  color: string
  bgColor: string
  borderColor: string
  dotColor: string
}> = {
  EJECUTIVO: {
    label: 'Ejecutivo',
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
    dotColor: 'bg-red-400'
  },
  MANAGER: {
    label: 'Manager',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    dotColor: 'bg-amber-400'
  },
  COLABORADOR: {
    label: 'Colaborador',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
    dotColor: 'bg-emerald-400'
  }
}

const INITIAL_VISIBLE = 3

// ══════════════════════════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════════════════════════

export interface TrackGroupCardProps {
  track: PerformanceTrack
  employees: ClassificationEmployee[]
  defaultExpanded?: boolean
  onEmployeeClick?: (employee: ClassificationEmployee) => void
}

// ══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ══════════════════════════════════════════════════════════════════════════

export const TrackGroupCard = memo(function TrackGroupCard({
  track,
  employees,
  defaultExpanded = false,
  onEmployeeClick
}: TrackGroupCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  const [showAll, setShowAll] = useState(false)

  const config = TRACK_CONFIG[track]
  const visibleEmployees = showAll ? employees : employees.slice(0, INITIAL_VISIBLE)
  const hasMore = employees.length > INITIAL_VISIBLE
  const remainingCount = employees.length - INITIAL_VISIBLE

  return (
    <div className={cn(
      'rounded-xl border overflow-hidden transition-all duration-200',
      config.borderColor,
      isExpanded ? config.bgColor : 'bg-slate-800/40'
    )}>
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className={cn('w-3 h-3 rounded-full', config.dotColor)} />
          <span className={cn('font-semibold', config.color)}>
            {config.label}
          </span>
          <span className="text-slate-500">
            ({employees.length})
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-slate-500" />
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          )}
        </div>
      </button>

      {/* Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-2">
              {visibleEmployees.map((employee, index) => (
                <motion.div
                  key={employee.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => onEmployeeClick?.(employee)}
                  className={cn(
                    'p-3 rounded-lg bg-slate-800/60 border border-slate-700/50',
                    'flex items-center justify-between',
                    onEmployeeClick && 'cursor-pointer hover:border-slate-600 transition-colors'
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white truncate">
                      {employee.fullName}
                    </p>
                    <p className="text-sm text-slate-400 truncate">
                      {employee.position}
                      {employee.departmentName && (
                        <span className="text-slate-500"> &bull; {employee.departmentName}</span>
                      )}
                    </p>
                  </div>

                  {employee.confidence >= 0.95 && (
                    <span className="text-emerald-400 text-xs font-medium px-2 py-1 bg-emerald-500/10 rounded shrink-0 ml-2">
                      95%+
                    </span>
                  )}
                </motion.div>
              ))}

              {/* Show more */}
              {hasMore && !showAll && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowAll(true)
                  }}
                  className="w-full py-2 text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  Ver {remainingCount} m&aacute;s...
                </button>
              )}

              {showAll && hasMore && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowAll(false)
                  }}
                  className="w-full py-2 text-sm text-slate-500 hover:text-slate-400 transition-colors"
                >
                  Mostrar menos
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
})

export default TrackGroupCard
