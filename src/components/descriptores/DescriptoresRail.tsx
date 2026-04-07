'use client'

// ════════════════════════════════════════════════════════════════════════════
// DESCRIPTORES RAIL — Clonado de Rail.tsx, adaptado a descriptores
// fixed bottom-0, colapsable 50px ↔ 320px, tabs Pendientes/Confirmados
// ════════════════════════════════════════════════════════════════════════════

import { useMemo, useRef } from 'react'
import { motion } from 'framer-motion'
import { ChevronUp, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDisplayName } from '@/lib/utils/formatName'
import CargoRailCard from './CargoRailCard'
import type { PositionWithStatus } from '@/lib/services/JobDescriptorService'

type DescriptorTab = 'pendientes' | 'confirmados'

const TAB_STYLES = {
  pendientes: {
    active: 'bg-amber-400 text-slate-950 shadow-[0_2px_10px_rgba(251,191,36,0.3)]',
    inactive: 'bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-700',
  },
  confirmados: {
    active: 'bg-emerald-400 text-slate-950 shadow-[0_2px_10px_rgba(16,185,129,0.3)]',
    inactive: 'bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-700',
  },
} as const

const TAB_LABELS: Record<DescriptorTab, string> = {
  pendientes: 'Pendientes',
  confirmados: 'Confirmados',
}

const TAB_ORDER: DescriptorTab[] = ['pendientes', 'confirmados']

interface DescriptoresRailProps {
  positions: PositionWithStatus[]
  selectedJobTitle: string | null
  isExpanded: boolean
  activeTab: DescriptorTab
  onToggle: () => void
  onSelect: (jobTitle: string) => void
  onTabChange: (tab: DescriptorTab) => void
}

export default function DescriptoresRail({
  positions,
  selectedJobTitle,
  isExpanded,
  activeTab,
  onToggle,
  onSelect,
  onTabChange,
}: DescriptoresRailProps) {
  const selectedPosition = positions.find(p => p.jobTitle === selectedJobTitle)
  const carouselRef = useRef<HTMLDivElement>(null)

  const filteredPositions = useMemo(() => {
    switch (activeTab) {
      case 'pendientes':
        return positions
          .filter(p => p.descriptorStatus === 'NONE' || p.descriptorStatus === 'DRAFT')
          .sort((a, b) => b.employeeCount - a.employeeCount)
      case 'confirmados':
        return positions
          .filter(p => p.descriptorStatus === 'CONFIRMED')
          .sort((a, b) => b.employeeCount - a.employeeCount)
      default:
        return positions
    }
  }, [positions, activeTab])

  const counts = useMemo(() => ({
    pendientes: positions.filter(p => p.descriptorStatus === 'NONE' || p.descriptorStatus === 'DRAFT').length,
    confirmados: positions.filter(p => p.descriptorStatus === 'CONFIRMED').length,
  }), [positions])

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
        borderColor: isExpanded ? 'rgba(255,255,255,0.05)' : 'transparent',
      }}
      transition={{ type: 'spring', stiffness: 250, damping: 30 }}
    >
      {/* Toggle Bar — siempre visible */}
      <div
        className="px-8 h-[50px] flex justify-between items-center cursor-pointer hover:bg-white/5 transition-colors flex-shrink-0"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3">
          <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
            Cargos ({positions.length})
          </h3>
          <ChevronUp className={cn(
            'w-3 h-3 text-slate-600 transition-transform duration-300',
            isExpanded ? 'rotate-180' : 'rotate-0'
          )} />
        </div>

        {/* Nombre seleccionado cuando colapsado */}
        {!isExpanded && selectedJobTitle && selectedPosition && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400 font-medium">Viendo:</span>
            <span className="text-[10px] text-cyan-400 font-mono font-bold uppercase">
              {formatDisplayName(selectedPosition.jobTitle, 'full')}
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
          {isExpanded ? 'Ocultar' : 'Ver Cargos'}
        </button>
      </div>

      {/* Contenido expandible */}
      <div className={cn(
        'transition-opacity duration-200 flex-1 flex flex-col min-h-0',
        isExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'
      )}>
        {/* TABS */}
        <div className="px-8 pb-4 flex gap-2 flex-shrink-0 overflow-x-auto [&::-webkit-scrollbar]:hidden">
          {TAB_ORDER.map(tab => {
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
            {filteredPositions.map(pos => (
              <CargoRailCard
                key={pos.jobTitle}
                position={pos}
                isSelected={selectedJobTitle === pos.jobTitle}
                onClick={() => onSelect(pos.jobTitle)}
              />
            ))}
            {filteredPositions.length === 0 && (
              <p className="text-xs text-slate-600 font-light py-8 mx-auto">
                No hay cargos en esta categoría.
              </p>
            )}
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
