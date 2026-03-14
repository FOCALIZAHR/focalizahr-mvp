// src/components/succession/SuccessionRail.tsx
'use client'

import { memo, useMemo, useRef, useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { ChevronUp, ChevronLeft, ChevronRight, Check, Clock, Plus, Home } from 'lucide-react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

interface RailPosition {
  id: string
  positionTitle: string
  benchStrength: string
  _count: { candidates: number }
}

interface SuccessionRailProps {
  positions: RailPosition[]
  selectedPositionId?: string | null
  isExpanded: boolean
  activeTab: FilterKey
  totalCandidates?: number
  onToggle: () => void
  onPositionClick: (positionId: string) => void
  onTabChange: (tab: FilterKey) => void
  onCreatePosition?: () => void
}

// ════════════════════════════════════════════════════════════════════════════
// FILTER TABS (cloned from evaluator Rail TAB_STYLES)
// ════════════════════════════════════════════════════════════════════════════

type FilterKey = 'NONE' | 'RISK' | 'COVERED'

const TAB_STYLES: Record<FilterKey, { active: string; inactive: string }> = {
  NONE: {
    active: 'bg-rose-400 text-slate-950 shadow-[0_2px_10px_rgba(251,113,133,0.3)]',
    inactive: 'bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-700'
  },
  RISK: {
    active: 'bg-amber-400 text-slate-950 shadow-[0_2px_10px_rgba(251,191,36,0.3)]',
    inactive: 'bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-700'
  },
  COVERED: {
    active: 'bg-emerald-400 text-slate-950 shadow-[0_2px_10px_rgba(16,185,129,0.3)]',
    inactive: 'bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-700'
  },
}

const TAB_LABELS: Record<FilterKey, string> = {
  NONE: 'Sin Cobertura',
  RISK: 'En Riesgo',
  COVERED: 'Cubiertas',
}

const TAB_ORDER: FilterKey[] = ['NONE', 'RISK', 'COVERED']

export function getDefaultTab(positions: { benchStrength: string }[]): FilterKey {
  if (positions.some(p => p.benchStrength === 'NONE')) return 'NONE'
  if (positions.some(p => p.benchStrength === 'WEAK')) return 'RISK'
  return 'COVERED'
}

// ════════════════════════════════════════════════════════════════════════════
// POSITION RAIL CARD (cloned from EmployeeRailCard)
// ════════════════════════════════════════════════════════════════════════════

function getTeslaColor(benchStrength: string): string {
  switch (benchStrength) {
    case 'STRONG': return 'bg-emerald-500'
    case 'MODERATE': return 'bg-cyan-500'
    case 'WEAK': return 'bg-amber-500'
    case 'NONE': return 'bg-rose-500'
    default: return 'bg-slate-600'
  }
}

function PositionRailCard({ position, isSelected, onClick }: {
  position: RailPosition
  isSelected: boolean
  onClick: () => void
}) {
  const [isHovered, setIsHovered] = useState(false)
  const teslaColor = getTeslaColor(position.benchStrength)

  const hasCandidates = position._count.candidates > 0
  const hasReadyNow = position.benchStrength === 'STRONG'
  const isCovered = position.benchStrength === 'STRONG' || position.benchStrength === 'MODERATE'

  // Initials from position title
  const initials = position.positionTitle
    .split(' ')
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase()

  return (
    <motion.div
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ y: -5 }}
      className={cn(
        'snap-start flex-shrink-0 w-[130px] sm:w-[160px] h-[180px] sm:h-[200px] rounded-xl cursor-pointer',
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

      <div className="flex flex-col items-center justify-center h-full p-3 sm:p-4">
        {/* Avatar */}
        <div className={cn(
          'w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center',
          'text-sm font-bold border transition-all mb-2 sm:mb-3 shadow-lg',
          isSelected
            ? 'bg-gradient-to-br from-slate-700 to-slate-800 border-cyan-500/30 text-white'
            : 'bg-slate-800 border-slate-700/50 text-slate-500 group-hover:text-slate-300'
        )}>
          {initials}
        </div>

        {/* Info */}
        <div className="text-center w-full space-y-1">
          <h4 className={cn(
            'font-bold text-xs truncate transition-colors',
            isSelected ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
          )}>
            {position.positionTitle}
          </h4>
          <p className="text-[10px] text-slate-600 truncate font-medium">
            {position._count.candidates} candidato{position._count.candidates !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Progress Dots (3 dots like evaluator) */}
        <PositionProgressDots
          hasCandidates={hasCandidates}
          hasReadyNow={hasReadyNow}
          isCovered={isCovered}
        />
      </div>
    </motion.div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// PROGRESS DOTS (cloned from evaluator ProgressDots)
// ════════════════════════════════════════════════════════════════════════════

function PositionProgressDots({ hasCandidates, hasReadyNow, isCovered }: {
  hasCandidates: boolean
  hasReadyNow: boolean
  isCovered: boolean
}) {
  const [showTooltip, setShowTooltip] = useState(false)
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })
  const [mounted, setMounted] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => { setMounted(true) }, [])

  const handleMouseEnter = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      setTooltipPos({
        x: rect.left + rect.width / 2,
        y: rect.top - 12
      })
    }
    setShowTooltip(true)
  }

  const dots = [
    {
      key: 'CAND',
      label: 'Candidatos',
      done: hasCandidates,
      color: hasCandidates ? 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.6)]' : 'bg-slate-700',
      value: hasCandidates ? 'Tiene candidatos' : 'Sin candidatos',
    },
    {
      key: 'READY',
      label: 'Ready Now',
      done: hasReadyNow,
      color: hasReadyNow ? 'bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 'bg-slate-700',
      value: hasReadyNow ? 'Tiene READY_NOW' : 'Sin READY_NOW',
    },
    {
      key: 'COV',
      label: 'Cobertura',
      done: isCovered,
      color: isCovered ? 'bg-purple-400 shadow-[0_0_8px_rgba(167,139,250,0.6)]' : 'bg-slate-700',
      value: isCovered ? 'Cubierta' : 'Sin cobertura',
    },
  ]

  return (
    <>
      <div
        ref={containerRef}
        className="relative cursor-pointer select-none mt-3"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <div className="flex items-center justify-center gap-1.5">
          {dots.map(dot => (
            <div key={dot.key} className={cn('w-2 h-2 rounded-full transition-all duration-300', dot.color)} />
          ))}
        </div>
        <div className="flex items-center justify-center gap-2 mt-1">
          {dots.map(dot => (
            <span key={dot.key} className="text-[8px] text-slate-600 font-medium">{dot.key}</span>
          ))}
        </div>
      </div>

      {/* Tooltip with portal */}
      {mounted && createPortal(
        <div
          style={{
            position: 'fixed',
            left: tooltipPos.x,
            top: tooltipPos.y,
            transform: 'translate(-50%, -100%)',
            zIndex: 99999,
            pointerEvents: 'none',
            opacity: showTooltip ? 1 : 0,
            transition: 'opacity 0.2s ease-out',
          }}
        >
          <div className="relative bg-slate-950 border border-slate-800 rounded-xl p-3 shadow-2xl w-56">
            <div className="absolute inset-x-0 top-0 h-[2px] rounded-t-xl bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent" />
            <div className="flex items-center gap-2 mb-1 border-b border-slate-800 pb-1">
              <span className="text-[10px] font-bold text-slate-300 uppercase">
                Estado de Posicion
              </span>
            </div>
            <div className="space-y-2 mt-2">
              {dots.map(dot => (
                <div key={dot.key} className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    {dot.done ? (
                      <Check className="w-3.5 h-3.5 text-cyan-400" />
                    ) : (
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                    )}
                    <span className={cn(
                      'text-[10px] text-slate-400 leading-relaxed',
                      dot.done && 'text-slate-300'
                    )}>
                      {dot.label}
                    </span>
                  </div>
                  <span className={cn(
                    'text-[10px] font-medium',
                    dot.done ? 'text-cyan-400' : 'text-slate-600'
                  )}>
                    {dot.value}
                  </span>
                </div>
              ))}
            </div>
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-950" />
          </div>
        </div>,
        document.body
      )}
    </>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ════════════════════════════════════════════════════════════════════════════

export { type FilterKey }

export const SuccessionRail = memo(function SuccessionRail({
  positions,
  selectedPositionId,
  isExpanded,
  activeTab,
  totalCandidates,
  onToggle,
  onPositionClick,
  onTabChange,
  onCreatePosition,
}: SuccessionRailProps) {
  const router = useRouter()
  const selectedPosition = positions.find(p => p.id === selectedPositionId)
  const carouselRef = useRef<HTMLDivElement>(null)

  const filteredPositions = useMemo(() => {
    switch (activeTab) {
      case 'NONE':
        return positions.filter(p => p.benchStrength === 'NONE')
      case 'RISK':
        return positions.filter(p => p.benchStrength === 'WEAK' || p.benchStrength === 'NONE')
      case 'COVERED':
        return positions.filter(p => p.benchStrength === 'STRONG' || p.benchStrength === 'MODERATE')
      default:
        return positions
    }
  }, [positions, activeTab])

  const counts = useMemo(() => ({
    NONE: positions.filter(p => p.benchStrength === 'NONE').length,
    RISK: positions.filter(p => p.benchStrength === 'WEAK' || p.benchStrength === 'NONE').length,
    COVERED: positions.filter(p => p.benchStrength === 'STRONG' || p.benchStrength === 'MODERATE').length,
  }), [positions])

  // Responsive height: shorter on mobile
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640
  const expandedHeight = isMobile ? 280 : 320

  const scrollLeft = () => carouselRef.current?.scrollBy({ left: -200, behavior: 'smooth' })
  const scrollRight = () => carouselRef.current?.scrollBy({ left: 200, behavior: 'smooth' })

  return (
    <motion.div
      className="fixed bottom-0 left-0 right-0 z-40 bg-gradient-to-t from-[#0F172A] via-[#0F172A] to-transparent flex flex-col justify-end border-t border-white/5 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]"
      initial={false}
      animate={{
        height: isExpanded ? expandedHeight : 50,
        backgroundColor: isExpanded ? 'rgba(15, 23, 42, 0.95)' : 'transparent',
        borderColor: isExpanded ? 'rgba(255,255,255,0.05)' : 'transparent'
      }}
      transition={{ type: 'spring', stiffness: 250, damping: 30 }}
    >
      {/* Toggle Bar */}
      <div
        className="px-4 sm:px-8 h-[50px] flex justify-between items-center cursor-pointer hover:bg-white/5 transition-colors flex-shrink-0"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3">
          <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
            Roles Criticos ({positions.length})
          </h3>
          <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">
            {positions.length} posiciones · {totalCandidates ?? 0} candidatos
          </span>
          <ChevronUp className={cn(
            'w-3 h-3 text-slate-600 transition-transform duration-300',
            isExpanded ? 'rotate-180' : 'rotate-0'
          )} />
        </div>

        {/* Show selected when collapsed */}
        {!isExpanded && selectedPositionId && selectedPosition && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400 font-medium">Viendo:</span>
            <span className="text-[10px] text-cyan-400 font-mono font-bold uppercase">
              {selectedPosition.positionTitle}
            </span>
          </div>
        )}

        <div className="flex items-center gap-1 sm:gap-2">
          {/* Dashboard link */}
          <button
            onClick={(e) => { e.stopPropagation(); router.push('/dashboard/succession') }}
            className="flex items-center gap-1 text-slate-500 hover:text-slate-300 px-1.5 sm:px-2 py-1.5 rounded-lg text-[10px] font-medium transition-colors"
          >
            <Home className="w-3 h-3" />
            <span className="hidden sm:inline">Inicio</span>
          </button>

          {/* Nueva Posicion */}
          {onCreatePosition && (
            <button
              onClick={(e) => { e.stopPropagation(); onCreatePosition() }}
              className="hidden sm:flex items-center gap-1 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all border border-slate-700 hover:border-slate-600"
            >
              <Plus className="w-3 h-3" />
              Nueva Posicion
            </button>
          )}
          {onCreatePosition && (
            <button
              onClick={(e) => { e.stopPropagation(); onCreatePosition() }}
              className="sm:hidden flex items-center justify-center w-8 h-8 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-full border border-slate-700"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          )}

          {/* CTA Button */}
          <button
            onClick={(e) => { e.stopPropagation(); onToggle() }}
            className="bg-cyan-400 hover:bg-cyan-300 text-slate-950 px-3 sm:px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all shadow-[0_2px_10px_rgba(34,211,238,0.3)]"
          >
            {isExpanded ? 'Ocultar' : 'Ver Roles'}
          </button>
        </div>
      </div>

      {/* Expandable content */}
      <div className={cn(
        'transition-opacity duration-200 flex-1 flex flex-col min-h-0',
        isExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'
      )}>
        {/* Filter tabs */}
        <div className="px-4 sm:px-8 pb-4 flex gap-2 flex-shrink-0 overflow-x-auto [&::-webkit-scrollbar]:hidden">
          {TAB_ORDER.map(tab => {
            const isActive = activeTab === tab
            const styles = TAB_STYLES[tab]
            const count = counts[tab]
            return (
              <button
                key={tab}
                onClick={(e) => { e.stopPropagation(); onTabChange(tab) }}
                className={cn(
                  'px-3 sm:px-4 py-2 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all flex-shrink-0',
                  isActive ? styles.active : styles.inactive
                )}
              >
                {TAB_LABELS[tab]} {count}
              </button>
            )
          })}
        </div>

        {/* Carousel */}
        <div className="relative group">
          <button
            onClick={scrollLeft}
            className="absolute left-1 sm:left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 sm:w-10 sm:h-10 bg-slate-800/90 hover:bg-slate-700 rounded-full flex items-center justify-center border border-slate-700 shadow-lg opacity-70 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </button>

          <div
            ref={carouselRef}
            className="flex overflow-x-auto gap-3 px-4 sm:px-8 pb-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] scroll-smooth"
            style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}
          >
            {filteredPositions.map(pos => (
              <PositionRailCard
                key={pos.id}
                position={pos}
                isSelected={selectedPositionId === pos.id}
                onClick={() => onPositionClick(pos.id)}
              />
            ))}
          </div>

          <button
            onClick={scrollRight}
            className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 sm:w-10 sm:h-10 bg-slate-800/90 hover:bg-slate-700 rounded-full flex items-center justify-center border border-slate-700 shadow-lg opacity-70 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
          >
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </button>
        </div>
      </div>
    </motion.div>
  )
})
