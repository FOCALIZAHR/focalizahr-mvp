// src/components/succession/SuccessionRail.tsx
'use client'

import { memo, useMemo, useRef, useState } from 'react'
import { ChevronUp, ChevronLeft, ChevronRight, Plus, Home } from 'lucide-react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { formatDisplayName } from '@/lib/utils/formatName'

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

interface RailPosition {
  id: string
  positionTitle: string
  benchStrength: string
  incumbentFlightRisk?: string | null
  topCandidate?: {
    employeeName: string
    readinessLevel: string
    matchPercent: number
  } | null
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

function PositionRailCard({ position, isSelected, onClick, activeTab }: {
  position: RailPosition
  isSelected: boolean
  onClick: () => void
  activeTab: FilterKey
}) {
  const [isHovered, setIsHovered] = useState(false)
  const teslaColor = getTeslaColor(position.benchStrength)

  // Initials from position title
  const initials = position.positionTitle
    .split(' ')
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase()

  // Contextual footer based on activeTab
  const footer = getCardFooter(position, activeTab)

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

        {/* Contextual footer: 1 line + 1 smart LED */}
        <div className="flex items-center gap-1.5 mt-3">
          <div
            className={cn('w-2 h-2 rounded-full flex-shrink-0', footer.dotColor)}
            title={footer.dotTitle}
          />
          <span className={cn('text-[10px] truncate', footer.textColor)}>
            {footer.text}
          </span>
        </div>
      </div>
    </motion.div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// CONTEXTUAL FOOTER (replaces 3-dot ProgressDots)
// ════════════════════════════════════════════════════════════════════════════

function getCardFooter(position: RailPosition, activeTab: FilterKey): {
  text: string
  textColor: string
  dotColor: string
  dotTitle: string
} {
  const risk = position.incumbentFlightRisk
  const top = position.topCandidate

  switch (activeTab) {
    case 'NONE':
      if (risk === 'HIGH' || risk === 'CRITICAL') {
        return {
          text: 'Titular en riesgo',
          textColor: 'text-slate-400',
          dotColor: 'bg-purple-400 ring-1 ring-purple-400/30',
          dotTitle: 'Titular en riesgo — requiere acción',
        }
      }
      return {
        text: 'Titular estable',
        textColor: 'text-slate-500',
        dotColor: 'bg-cyan-400 ring-1 ring-cyan-400/30',
        dotTitle: 'Titular estable',
      }

    case 'RISK':
      return {
        text: 'Listo en 1-2 años',
        textColor: 'text-slate-400',
        dotColor: 'bg-purple-400 ring-1 ring-purple-400/30',
        dotTitle: 'Sin sucesor disponible hoy',
      }

    case 'COVERED':
      if (top) {
        return {
          text: `${formatDisplayName(top.employeeName, 'short')} · ${Math.round(top.matchPercent)}%`,
          textColor: 'text-slate-300',
          dotColor: position.benchStrength === 'STRONG'
            ? 'bg-cyan-400 ring-1 ring-cyan-400/30'
            : 'bg-purple-400 ring-1 ring-purple-400/30',
          dotTitle: position.benchStrength === 'STRONG'
            ? 'Sucesor listo y cobertura resuelta'
            : 'Sucesor en desarrollo',
        }
      }
      return {
        text: 'Cobertura confirmada',
        textColor: 'text-slate-400',
        dotColor: 'bg-cyan-400 ring-1 ring-cyan-400/30',
        dotTitle: 'Cobertura confirmada',
      }

    default:
      return {
        text: '',
        textColor: 'text-slate-500',
        dotColor: 'bg-slate-600',
        dotTitle: '',
      }
  }
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
                activeTab={activeTab}
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
