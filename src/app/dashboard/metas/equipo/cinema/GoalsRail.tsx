// ════════════════════════════════════════════════════════════════════════════
// GOALS RAIL - Carrusel colapsable
// src/app/dashboard/metas/equipo/cinema/GoalsRail.tsx
// 
// BASADO EN: src/components/evaluator/cinema/Rail.tsx
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { memo, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronUp, ChevronLeft, ChevronRight, Target } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PrimaryButton, GhostButton } from '@/components/ui/PremiumButton'
import { GoalEmployeeCard } from './GoalEmployeeCard'
import type { TeamMember } from '@/hooks/useTeamGoals'

// ════════════════════════════════════════════════════════════════════════════
// TIPOS
// ════════════════════════════════════════════════════════════════════════════

// SIN "todos" - solo estados que requieren acción
export type GoalsRailTab = 'sinMetas' | 'incompletas' | 'completas'

interface StatusCounts {
  all: number
  empty: number
  incomplete: number
  ready: number
  exceeded: number
  noGoalsRequired: number
}

interface GoalsRailProps {
  employees: TeamMember[]
  selectedId: string | null
  isExpanded: boolean
  activeTab: GoalsRailTab
  statusCounts: StatusCounts
  onToggle: () => void
  onSelect: (id: string) => void
  onTabChange: (tab: GoalsRailTab) => void
  onBulkAssign: () => void  // NUEVO: para botón en Rail
}

// ════════════════════════════════════════════════════════════════════════════
// TAB STYLES (sin "todos" - secuencial por prioridad)
// ════════════════════════════════════════════════════════════════════════════

const TAB_STYLES = {
  sinMetas: {
    active: 'bg-amber-400 text-slate-950 shadow-[0_2px_10px_rgba(251,191,36,0.3)]',
    inactive: 'bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-700'
  },
  incompletas: {
    active: 'bg-purple-400 text-slate-950 shadow-[0_2px_10px_rgba(167,139,250,0.3)]',
    inactive: 'bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-700'
  },
  completas: {
    active: 'bg-emerald-400 text-slate-950 shadow-[0_2px_10px_rgba(16,185,129,0.3)]',
    inactive: 'bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-700'
  }
} as const

const TAB_LABELS: Record<GoalsRailTab, string> = {
  sinMetas: 'Sin Metas',
  incompletas: 'Incompletas',
  completas: 'Listas'
}

// Orden secuencial por prioridad de acción
const TAB_ORDER: GoalsRailTab[] = ['sinMetas', 'incompletas', 'completas']

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE
// ════════════════════════════════════════════════════════════════════════════

export const GoalsRail = memo(function GoalsRail({
  employees,
  selectedId,
  isExpanded,
  activeTab,
  statusCounts,
  onToggle,
  onSelect,
  onTabChange,
  onBulkAssign,
}: GoalsRailProps) {
  const selectedEmployee = employees.find(e => e.id === selectedId)
  const carouselRef = useRef<HTMLDivElement>(null)

  // Filtrar según tab (sin caso 'todos')
  const filteredEmployees = useMemo(() => {
    const relevant = employees.filter(e => e.hasGoalsConfigured)
    
    switch (activeTab) {
      case 'sinMetas':
        return relevant.filter(e => e.assignmentStatus?.status === 'EMPTY')
      case 'incompletas':
        return relevant.filter(e => 
          e.assignmentStatus?.status === 'INCOMPLETE' || 
          e.assignmentStatus?.status === 'EXCEEDED'
        )
      case 'completas':
        return relevant.filter(e => e.assignmentStatus?.status === 'READY')
      default:
        return relevant.filter(e => e.assignmentStatus?.status === 'EMPTY')
    }
  }, [employees, activeTab])

  // Conteos para tabs (sin 'todos')
  const tabCounts: Record<GoalsRailTab, number> = {
    sinMetas: statusCounts.empty,
    incompletas: statusCounts.incomplete + statusCounts.exceeded,
    completas: statusCounts.ready
  }

  // Total que necesita asignación
  const needsAssignment = statusCounts.empty + statusCounts.incomplete

  // Scroll handlers
  const scrollCarousel = (direction: 'left' | 'right') => {
    if (!carouselRef.current) return
    const scrollAmount = direction === 'left' ? -340 : 340
    carouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' })
  }

  return (
    <motion.div
      initial={false}
      animate={{ height: isExpanded ? 320 : 56 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className={cn(
        "fixed bottom-0 left-0 right-0 z-30",
        "bg-slate-950/95 backdrop-blur-lg border-t border-slate-800/50"
      )}
    >
      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* COLLAPSED BAR */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <div 
        className="h-14 px-4 flex items-center justify-between cursor-pointer"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Tu Equipo ({statusCounts.all - statusCounts.noGoalsRequired})
          </span>
          {selectedEmployee && !isExpanded && (
            <>
              <span className="text-slate-700">·</span>
              <span className="text-sm text-slate-300">
                {selectedEmployee.fullName}
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          {/* Botón Asignar Metas - siempre visible si hay pendientes */}
          {needsAssignment > 0 && !isExpanded && (
            <PrimaryButton
              icon={Target}
              size="sm"
              onClick={() => onBulkAssign()}
            >
              Asignar Metas
            </PrimaryButton>
          )}

          <GhostButton
            size="sm"
            onClick={onToggle}
          >
            {isExpanded ? 'Ocultar' : 'Ver Equipo'}
          </GhostButton>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* EXPANDED CONTENT */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="px-4 pb-4"
          >
            {/* TABS + BOTÓN ASIGNAR */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden">
                {TAB_ORDER.map(tab => {
                  const count = tabCounts[tab]
                  if (count === 0) return null

                  const isActive = activeTab === tab
                  const styles = TAB_STYLES[tab]

                  return (
                    <button
                      key={tab}
                      onClick={(e) => {
                        e.stopPropagation()
                        onTabChange(tab)
                      }}
                      className={cn(
                        'px-4 py-2 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all whitespace-nowrap',
                        isActive ? styles.active : styles.inactive
                      )}
                    >
                      {TAB_LABELS[tab]} {count}
                    </button>
                  )
                })}
              </div>

              {/* BOTÓN ASIGNAR METAS - visible cuando rail expandido */}
              {needsAssignment > 0 && (
                <div onClick={(e) => e.stopPropagation()}>
                  <PrimaryButton
                    icon={Target}
                    size="sm"
                    onClick={() => onBulkAssign()}
                  >
                    Asignar Metas ({needsAssignment})
                  </PrimaryButton>
                </div>
              )}
            </div>

            {/* CAROUSEL */}
            <div className="relative group">
              {/* Flecha izquierda */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  scrollCarousel('left')
                }}
                className={cn(
                  "absolute left-0 top-1/2 -translate-y-1/2 z-10",
                  "w-10 h-10 rounded-full bg-slate-800/90 border border-slate-700",
                  "flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700",
                  "opacity-0 group-hover:opacity-100 transition-opacity"
                )}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              {/* Scroll container */}
              <div
                ref={carouselRef}
                className="flex gap-3 overflow-x-auto scrollbar-hide snap-x snap-mandatory py-2 px-1"
              >
                {filteredEmployees.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center py-8">
                    <p className="text-slate-500 text-sm">
                      No hay colaboradores en esta categoría
                    </p>
                  </div>
                ) : (
                  filteredEmployees.map(employee => (
                    <GoalEmployeeCard
                      key={employee.id}
                      employee={employee}
                      isSelected={employee.id === selectedId}
                      onClick={() => onSelect(employee.id)}
                    />
                  ))
                )}
              </div>

              {/* Flecha derecha */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  scrollCarousel('right')
                }}
                className={cn(
                  "absolute right-0 top-1/2 -translate-y-1/2 z-10",
                  "w-10 h-10 rounded-full bg-slate-800/90 border border-slate-700",
                  "flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700",
                  "opacity-0 group-hover:opacity-100 transition-opacity"
                )}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
})

export default GoalsRail