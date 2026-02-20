'use client'

import { useMemo, useRef } from 'react'
import { motion } from 'framer-motion'
import { ChevronUp, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import EmployeeRailCard from './EmployeeRailCard'
import type { RailProps, CarouselTab } from '@/types/evaluator-cinema'

const TAB_STYLES = {
  sinED: {
    active: 'bg-amber-400 text-slate-950 shadow-[0_2px_10px_rgba(251,191,36,0.3)]',
    inactive: 'bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-700'
  },
  sinPT: {
    active: 'bg-cyan-400 text-slate-950 shadow-[0_2px_10px_rgba(34,211,238,0.3)]',
    inactive: 'bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-700'
  },
  sinPDI: {
    active: 'bg-purple-400 text-slate-950 shadow-[0_2px_10px_rgba(167,139,250,0.3)]',
    inactive: 'bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-700'
  },
  listos: {
    active: 'bg-emerald-400 text-slate-950 shadow-[0_2px_10px_rgba(16,185,129,0.3)]',
    inactive: 'bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-700'
  }
} as const

const TAB_LABELS: Record<CarouselTab, string> = {
  sinED: 'Sin ED',
  sinPT: 'Sin PT',
  sinPDI: 'Sin PDI',
  listos: 'Listos'
}

const TAB_ORDER: CarouselTab[] = ['sinED', 'sinPT', 'sinPDI', 'listos']

export default function Rail({
  employees,
  selectedId,
  isExpanded,
  activeTab,
  onToggle,
  onSelect,
  onTabChange
}: RailProps) {
  const selectedEmployee = employees.find(e => e.id === selectedId)
  const carouselRef = useRef<HTMLDivElement>(null)

  const filteredEmployees = useMemo(() => {
    switch (activeTab) {
      case 'sinED':
        return employees.filter(e => e.status !== 'completed')
      case 'sinPT':
        return employees.filter(e => e.status === 'completed' && !e.potentialScore)
      case 'sinPDI':
        return employees.filter(e =>
          e.status === 'completed' &&
          e.potentialScore !== null &&
          !e.hasPDI
        )
      case 'listos':
      default:
        return employees.filter(e =>
          e.status === 'completed' &&
          e.potentialScore !== null &&
          e.hasPDI
        )
    }
  }, [employees, activeTab])

  const counts = useMemo(() => ({
    sinED: employees.filter(e => e.status !== 'completed').length,
    sinPT: employees.filter(e => e.status === 'completed' && !e.potentialScore).length,
    sinPDI: employees.filter(e =>
      e.status === 'completed' && e.potentialScore !== null && !e.hasPDI
    ).length,
    listos: employees.filter(e =>
      e.status === 'completed' && e.potentialScore !== null && e.hasPDI
    ).length
  }), [employees])

  const scrollLeft = () => {
    carouselRef.current?.scrollBy({ left: -200, behavior: 'smooth' })
  }

  const scrollRight = () => {
    carouselRef.current?.scrollBy({ left: 200, behavior: 'smooth' })
  }

  return (
    <motion.div
      className="fixed bottom-0 left-0 right-0 z-40 bg-gradient-to-t from-[#0F172A] via-[#0F172A] to-transparent flex flex-col justify-end border-t border-white/5 backdrop-blur-xl"
      initial={false}
      animate={{
        height: isExpanded ? 320 : 50,
        backgroundColor: isExpanded ? 'rgba(15, 23, 42, 0.95)' : 'transparent',
        borderColor: isExpanded ? 'rgba(255,255,255,0.05)' : 'transparent'
      }}
      transition={{ type: 'spring', stiffness: 250, damping: 30 }}
    >

      {/* Toggle Bar - Siempre visible */}
      <div
        className="px-8 h-[50px] flex justify-between items-center cursor-pointer hover:bg-white/5 transition-colors flex-shrink-0"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3">
          <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
            Tu Equipo ({employees.length})
          </h3>
          <ChevronUp className={cn(
            'w-3 h-3 text-slate-600 transition-transform duration-300',
            isExpanded ? 'rotate-180' : 'rotate-0'
          )} />
        </div>

        {/* Mostrar nombre seleccionado cuando colapsado */}
        {!isExpanded && selectedId && selectedEmployee && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400 font-medium">Viendo a:</span>
            <span className="text-[10px] text-cyan-400 font-mono font-bold uppercase">
              {selectedEmployee.displayName}
            </span>
          </div>
        )}

        {/* CTA Button */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            onToggle()
          }}
          className="bg-cyan-400 hover:bg-cyan-300 text-slate-950 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all shadow-[0_2px_10px_rgba(34,211,238,0.3)]"
        >
          {isExpanded ? 'Ocultar' : 'Ver Equipo'}
        </button>
      </div>

      {/* Contenido expandible */}
      <div className={cn(
        'transition-opacity duration-200 flex-1 flex flex-col min-h-0',
        isExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'
      )}>

        {/* TABS DE FILTRO - 5 tabs multifase */}
        <div className="px-8 pb-4 flex gap-2 flex-shrink-0 overflow-x-auto [&::-webkit-scrollbar]:hidden">
          {TAB_ORDER.map((tab) => {
            const isActive = activeTab === tab
            const styles = TAB_STYLES[tab]
            const count = counts[tab]

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

        {/* CARRUSEL HORIZONTAL */}
        <div className="relative group">
          {/* Left arrow */}
          <button
            onClick={scrollLeft}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-slate-800/90 hover:bg-slate-700 rounded-full flex items-center justify-center border border-slate-700 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>

          <div
            ref={carouselRef}
            className="flex overflow-x-auto gap-3 px-8 pb-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] scroll-smooth"
            style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}
          >
            {filteredEmployees.map((employee) => (
              <EmployeeRailCard
                key={employee.id}
                employee={employee}
                isSelected={selectedId === employee.id}
                onClick={() => onSelect(employee.id)}
              />
            ))}
          </div>

          {/* Right arrow */}
          <button
            onClick={scrollRight}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-slate-800/90 hover:bg-slate-700 rounded-full flex items-center justify-center border border-slate-700 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronRight className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>
    </motion.div>
  )
}
