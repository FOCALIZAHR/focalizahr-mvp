'use client'

// Clonado de src/components/evaluator/cinema/Rail.tsx
// Misma estructura fixed bottom z-40, tabs + carrusel. 2 pills en vez de 4.

import { useMemo, useRef } from 'react'
import { motion } from 'framer-motion'
import { ChevronUp, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getPatternLabel, getQuadrantLabel } from '@/config/tacLabels'
import type { TACRailProps, TACRailPill, GerenciaCardData } from '@/types/tac-cinema'

const TAB_STYLES = {
  gerencias: {
    active: 'bg-cyan-400 text-slate-950 shadow-[0_2px_10px_rgba(34,211,238,0.3)]',
    inactive: 'bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-700'
  },
  personas: {
    active: 'bg-purple-400 text-slate-950 shadow-[0_2px_10px_rgba(167,139,250,0.3)]',
    inactive: 'bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-700'
  }
} as const

const TAB_LABELS: Record<TACRailPill, string> = {
  gerencias: 'Gerencias',
  personas: 'Personas'
}

const TAB_ORDER: TACRailPill[] = ['gerencias', 'personas']

const QUADRANT_CONFIG = [
  { key: 'FUGA_CEREBROS', color: 'text-red-400', border: 'border-red-500/30 hover:border-red-500/50' },
  { key: 'BURNOUT_RISK', color: 'text-orange-400', border: 'border-orange-500/30 hover:border-orange-500/50' },
  { key: 'MOTOR_EQUIPO', color: 'text-emerald-400', border: 'border-emerald-500/30 hover:border-emerald-500/50' },
  { key: 'BAJO_RENDIMIENTO', color: 'text-amber-400', border: 'border-amber-500/30 hover:border-amber-500/50' },
]

export default function TACRail({
  gerencias,
  stats,
  selectedId,
  isExpanded,
  activePill,
  onToggle,
  onSelect,
  onPillChange,
  onOpenQuadrantDetail
}: TACRailProps) {
  const selectedGerencia = gerencias.find(g => g.id === selectedId)
  const carouselRef = useRef<HTMLDivElement>(null)

  const counts = useMemo(() => ({
    gerencias: gerencias.length,
    personas: stats.totalPersonas
  }), [gerencias, stats])

  // Quadrant counts for personas pill
  const quadrantCounts = useMemo(() => {
    let fuga = 0, burnout = 0, motor = 0, bajo = 0
    for (const g of gerencias) {
      fuga += g.fugaCount
      burnout += g.burnoutCount
      motor += g.motorCount
      bajo += g.bajoRendimientoCount
    }
    return { FUGA_CEREBROS: fuga, BURNOUT_RISK: burnout, MOTOR_EQUIPO: motor, BAJO_RENDIMIENTO: bajo }
  }, [gerencias])

  const scrollLeft = () => {
    carouselRef.current?.scrollBy({ left: -200, behavior: 'smooth' })
  }

  const scrollRight = () => {
    carouselRef.current?.scrollBy({ left: 200, behavior: 'smooth' })
  }

  return (
    <motion.div
      className="fixed bottom-0 left-0 right-0 z-[60] bg-gradient-to-t from-[#0F172A] via-[#0F172A] to-transparent flex flex-col justify-end border-t border-white/5 backdrop-blur-xl"
      initial={false}
      animate={{
        height: isExpanded ? 320 : 50,
        backgroundColor: isExpanded ? 'rgba(15, 23, 42, 0.95)' : 'transparent',
        borderColor: isExpanded ? 'rgba(255,255,255,0.05)' : 'transparent'
      }}
      transition={{ type: 'spring', stiffness: 250, damping: 30 }}
    >

      {/* Toggle Bar - Siempre visible — copia exacta layout del evaluator */}
      <div
        className="px-8 h-[50px] flex justify-between items-center cursor-pointer hover:bg-white/5 transition-colors flex-shrink-0"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3">
          <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
            Organizacion ({gerencias.length})
          </h3>
          <ChevronUp className={cn(
            'w-3 h-3 text-slate-600 transition-transform duration-300',
            isExpanded ? 'rotate-180' : 'rotate-0'
          )} />
        </div>

        {/* Mostrar nombre seleccionado cuando colapsado — copia exacta patron */}
        {!isExpanded && selectedId && selectedGerencia && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400 font-medium">Viendo:</span>
            <span className="text-[10px] text-cyan-400 font-mono font-bold uppercase">
              {selectedGerencia.displayName}
            </span>
          </div>
        )}

        {/* CTA Button — copia exacta CSS */}
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

      {/* Contenido expandible — copia exacta opacity transition */}
      <div className={cn(
        'transition-opacity duration-200 flex-1 flex flex-col min-h-0',
        isExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'
      )}>

        {/* TABS DE FILTRO — copia exacta styling */}
        <div className="px-8 pb-4 flex gap-2 flex-shrink-0 overflow-x-auto [&::-webkit-scrollbar]:hidden">
          {TAB_ORDER.map((tab) => {
            const isActive = activePill === tab
            const styles = TAB_STYLES[tab]
            const count = counts[tab]

            return (
              <button
                key={tab}
                onClick={(e) => {
                  e.stopPropagation()
                  onPillChange(tab)
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

        {/* CARRUSEL HORIZONTAL — copia exacta scroll arrows */}
        <div className="relative group">
          {/* Left arrow — copia exacta */}
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
            {/* Pill Gerencias: cards de gerencia */}
            {activePill === 'gerencias' && gerencias.map((g) => (
              <GerenciaRailCard
                key={g.id}
                gerencia={g}
                isSelected={selectedId === g.id}
                onClick={() => onSelect(g.id)}
              />
            ))}

            {/* Pill Personas: cards por cuadrante */}
            {activePill === 'personas' && QUADRANT_CONFIG.map((q) => {
              const count = quadrantCounts[q.key as keyof typeof quadrantCounts] || 0
              if (count === 0) return null
              return (
                <motion.div
                  key={q.key}
                  onClick={() => onOpenQuadrantDetail(q.key)}
                  whileHover={{ y: -5 }}
                  className={cn(
                    'snap-start flex-shrink-0 w-[160px] h-[200px] rounded-xl cursor-pointer',
                    'transition-all duration-300 relative group/card overflow-hidden border',
                    'bg-slate-900/40 hover:bg-slate-800',
                    q.border
                  )}
                >
                  {/* Tesla line top */}
                  <div className="absolute top-0 left-0 right-0 h-[2px] bg-slate-700 opacity-30 group-hover/card:opacity-80 transition-all" />

                  <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                    <span className={cn("text-4xl font-black font-mono", q.color)}>
                      {count}
                    </span>
                    <h4 className="font-bold text-xs text-slate-400 mt-2">
                      {getQuadrantLabel(q.key)}
                    </h4>
                    <p className="text-[9px] text-slate-600 mt-1">
                      personas
                    </p>
                  </div>
                </motion.div>
              )
            })}
          </div>

          {/* Right arrow — copia exacta */}
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

// GerenciaRailCard — clon de EmployeeRailCard, misma estructura visual
function GerenciaRailCard({ gerencia, isSelected, onClick }: { gerencia: GerenciaCardData; isSelected: boolean; onClick: () => void }) {
  return (
    <motion.div
      onClick={onClick}
      whileHover={{ y: -5 }}
      className={cn(
        'snap-start flex-shrink-0 w-[160px] h-[200px] rounded-xl cursor-pointer',
        'transition-all duration-300 relative group/card overflow-hidden border',
        isSelected
          ? 'bg-slate-800 border-cyan-500/50 shadow-[0_0_20px_-5px_rgba(34,211,238,0.15)]'
          : 'bg-slate-900/40 border-white/5 hover:bg-slate-800 hover:border-white/10'
      )}
    >
      {/* Tesla line TOP — copia exacta patron EmployeeRailCard */}
      <div className={cn(
        'absolute top-0 left-0 right-0 h-[2px] transition-all duration-300',
        isSelected ? 'bg-cyan-500 opacity-100 shadow-[0_0_10px_currentColor]' : 'bg-slate-700 opacity-30'
      )} />

      <div className="flex flex-col items-center justify-center h-full p-4">
        {/* Avatar */}
        <div className={cn(
          'w-14 h-14 rounded-full flex items-center justify-center',
          'text-sm font-bold border transition-all mb-3 shadow-lg',
          isSelected
            ? 'bg-gradient-to-br from-slate-700 to-slate-800 border-cyan-500/30 text-white'
            : 'bg-slate-800 border-slate-700/50 text-slate-500 group-hover/card:text-slate-300'
        )}>
          {gerencia.displayName.charAt(0).toUpperCase()}
        </div>

        {/* Info */}
        <div className="text-center w-full space-y-1">
          <h4 className={cn(
            'font-bold text-xs truncate transition-colors',
            isSelected ? 'text-white' : 'text-slate-400 group-hover/card:text-slate-200'
          )}>
            {gerencia.displayName}
          </h4>
          <p className="text-[9px] text-slate-600 truncate font-medium">
            {gerencia.totalPersonas} personas · ICC {gerencia.icc ?? 0}%
          </p>
        </div>

        {/* Status indicator */}
        <div className="mt-3 flex items-center gap-1.5">
          {gerencia.requiresAction && (
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          )}
          <span className="text-[9px] text-slate-600">
            {getPatternLabel(gerencia.pattern)}
          </span>
        </div>
      </div>
    </motion.div>
  )
}
