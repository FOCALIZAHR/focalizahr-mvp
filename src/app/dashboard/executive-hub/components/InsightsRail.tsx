'use client'

// ════════════════════════════════════════════════════════════════════════════
// INSIGHTS RAIL - Fixed bottom, collapsible, Netflix scroll
// Patrón clonado de evaluator/cinema/Rail.tsx
// src/app/dashboard/executive-hub/components/InsightsRail.tsx
// ════════════════════════════════════════════════════════════════════════════

import { memo, useRef } from 'react'
import { motion } from 'framer-motion'
import { ChevronUp, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { InsightCard } from './InsightCard'
import type { InsightType, SummaryData } from '@/hooks/useExecutiveHubData'

const INSIGHT_ORDER: InsightType[] = ['alertas', 'talento', 'calibracion', 'capacidades', 'sucesion', 'pl-talento', 'metas', 'exposicion-ia']

interface InsightsRailProps {
  summary: SummaryData
  activeInsight: InsightType | null
  isExpanded: boolean
  onToggle: () => void
  onSelect: (type: InsightType) => void
}

function getPulsingCard(summary: SummaryData): InsightType | null {
  if (summary.alertas.critical > 0) return 'alertas'
  if (summary.calibracion.confidence < 60) return 'calibracion'
  if (summary.capacidades.roleFit < 60) return 'capacidades'
  return null
}

export const InsightsRail = memo(function InsightsRail({
  summary,
  activeInsight,
  isExpanded,
  onToggle,
  onSelect
}: InsightsRailProps) {
  const pulsingCard = getPulsingCard(summary)
  const carouselRef = useRef<HTMLDivElement>(null)

  const scrollLeft = () => {
    carouselRef.current?.scrollBy({ left: -200, behavior: 'smooth' })
  }

  const scrollRight = () => {
    carouselRef.current?.scrollBy({ left: 200, behavior: 'smooth' })
  }

  return (
    <motion.div
      className="fixed bottom-0 left-0 right-0 z-40 flex flex-col justify-end border-t border-slate-800 backdrop-blur-2xl"
      initial={false}
      animate={{
        height: isExpanded ? 240 : 50,
        backgroundColor: isExpanded ? 'rgba(15, 23, 42, 0.90)' : 'rgba(15, 23, 42, 0.70)',
        borderColor: isExpanded ? 'rgba(30, 41, 59, 1)' : 'rgba(30, 41, 59, 0.5)'
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
            Tu Inteligencia Ejecutiva
          </h3>
          <ChevronUp className={cn(
            'w-3 h-3 text-slate-600 transition-transform duration-300',
            isExpanded ? 'rotate-180' : 'rotate-0'
          )} />
        </div>

        {/* Pulse indicator when collapsed */}
        {!isExpanded && pulsingCard && (
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
            </span>
            <span className="text-[10px] text-red-400 font-medium">Requiere atención</span>
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
          {isExpanded ? 'Ocultar' : 'Ver Insights'}
        </button>
      </div>

      {/* Expandable content */}
      <div className={cn(
        'transition-opacity duration-200 flex-1 flex flex-col min-h-0',
        isExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'
      )}>

        {/* CARRUSEL HORIZONTAL - Netflix style */}
        <div className="relative group flex-1 flex items-center">
          {/* Left arrow */}
          <button
            onClick={scrollLeft}
            className="absolute left-2 z-10 w-10 h-10 bg-slate-800/90 hover:bg-slate-700 rounded-full flex items-center justify-center border border-slate-700 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>

          <div
            ref={carouselRef}
            className="flex overflow-x-auto gap-4 px-8 py-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] scroll-smooth"
            style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}
          >
            {INSIGHT_ORDER.map((type) => (
              <div key={type} style={{ scrollSnapAlign: 'start' }}>
                <InsightCard
                  type={type}
                  summary={summary}
                  isActive={activeInsight === type}
                  onClick={() => onSelect(type)}
                />
              </div>
            ))}
          </div>

          {/* Right arrow */}
          <button
            onClick={scrollRight}
            className="absolute right-2 z-10 w-10 h-10 bg-slate-800/90 hover:bg-slate-700 rounded-full flex items-center justify-center border border-slate-700 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronRight className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>
    </motion.div>
  )
})
