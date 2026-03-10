'use client'

import { motion } from 'framer-motion'
import { formatDisplayName, getInitials } from '@/lib/utils/formatName'
import { GhostButton } from '@/components/ui/PremiumButton'

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

interface SuccessionCandidateRowProps {
  candidate: {
    employeeId: string
    employeeName: string
    position: string | null
    departmentName: string | null
    roleFitScore: number
    readinessLevel: string
    readinessLabel: string
    isNominated?: boolean
    nominatedId?: string
    gaps?: any[]
    potentialAspiration?: number
    nineBoxPosition?: string | null
    flightRisk?: string | null
    gapsCriticalCount?: number
    hireDate?: string | null
    matchPercent?: number
    riskQuadrant?: string | null
    mobilityQuadrant?: string | null
    developmentPlan?: { id: string; status: string } | null
  }
  rank: number
  index: number
  variant?: 'nominated' | 'suggestion'
  onCandidateClick: (candidate: any) => void
  onDominoClick?: () => void
  onViewPDI?: () => void
}

// ════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ════════════════════════════════════════════════════════════════════════════

const READINESS_LABEL: Record<string, string> = {
  READY_NOW:       'Listo ahora',
  READY_1_2_YEARS: '1-2 años',
  READY_3_PLUS:    '3+ años',
  NOT_VIABLE:      'En desarrollo',
}

const NINE_BOX_TOP = ['STAR', 'HIGH_PERFORMER', 'GROWTH_POTENTIAL']

interface Badge { label: string; color: string }

function deriveBadges(candidate: SuccessionCandidateRowProps['candidate']): Badge[] {
  const badges: Badge[] = []
  const fit = candidate.roleFitScore ?? 0
  const aspiration = candidate.potentialAspiration

  if (fit >= 75 && aspiration === 3) {
    badges.push({ label: 'Sucesor Natural', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' })
  }
  if (candidate.nineBoxPosition && NINE_BOX_TOP.includes(candidate.nineBoxPosition)) {
    badges.push({ label: 'Top Performer', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' })
  }
  if ((candidate.gapsCriticalCount ?? 0) === 0) {
    badges.push({ label: 'Sin Gaps Críticos', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' })
  }
  if (candidate.flightRisk === 'HIGH') {
    badges.push({ label: 'Riesgo Fuga', color: 'bg-rose-500/20 text-rose-400 border-rose-500/30' })
  }
  return badges.slice(0, 3)
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ════════════════════════════════════════════════════════════════════════════

export default function SuccessionCandidateRow({
  candidate,
  rank,
  index,
  variant = 'nominated',
  onCandidateClick,
  onDominoClick,
  onViewPDI,
}: SuccessionCandidateRowProps) {
  const displayName = formatDisplayName(candidate.employeeName || '', 'short')
  const initials = getInitials(displayName)
  const readinessText = READINESS_LABEL[candidate.readinessLevel] || candidate.readinessLevel
  const hasActions = !!onViewPDI || !!onDominoClick
  const isSuggestion = variant === 'suggestion'
  const badges = isSuggestion ? deriveBadges(candidate) : []

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.3 }}
      className={`relative bg-slate-800/40 border border-slate-700/30 rounded-xl hover:scale-[1.01] transition-all duration-200 cursor-pointer overflow-hidden ${isSuggestion ? 'hover:border-purple-500/30' : 'hover:border-cyan-500/30'}`}
      onClick={() => onCandidateClick(candidate)}
    >
      {/* Tesla line */}
      <div
        className="absolute top-0 inset-x-0 h-[2px]"
        style={{
          background: isSuggestion
            ? 'linear-gradient(90deg, transparent, #A78BFA, transparent)'
            : 'linear-gradient(90deg, transparent, #22D3EE, transparent)',
          boxShadow: isSuggestion ? 'none' : '0 0 12px rgba(34,211,238,0.5)',
        }}
      />

      {/* Watermark rank */}
      <div className={`absolute -bottom-4 -right-2 text-[120px] font-black leading-none select-none pointer-events-none z-0 opacity-[0.06] ${isSuggestion ? 'text-purple-400' : 'text-cyan-400'}`}>
        {rank}
      </div>

      <div className="relative z-10 p-4">
        {/* Row 1: Avatar + Info + Readiness */}
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className={`w-10 h-10 rounded-full bg-slate-700/80 border border-slate-600/50 flex items-center justify-center flex-shrink-0 ring-1 ${isSuggestion ? 'ring-purple-500/20' : 'ring-cyan-500/20'}`}>
            <span className={`font-bold text-sm ${isSuggestion ? 'text-purple-400' : 'text-cyan-400'}`}>{initials}</span>
          </div>

          {/* Name + position */}
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm truncate">{displayName}</p>
            <p className="text-slate-400 text-xs truncate">
              {[candidate.position, candidate.departmentName].filter(Boolean).join(' · ')}
            </p>
            {/* Badges — only for suggestions */}
            {badges.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {badges.map(b => (
                  <span
                    key={b.label}
                    className={`text-[10px] px-2 py-0.5 rounded-full border ${b.color}`}
                  >
                    {b.label}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Readiness + Fit + Match */}
          <div className="flex-shrink-0 text-right">
            <p className="text-slate-300 text-xs">
              {readinessText}
            </p>
            <p className="text-slate-500 text-[10px]">
              Fit {Math.round(candidate.roleFitScore)}%
              {isSuggestion && candidate.matchPercent != null && (
                <span> · Match {Math.round(candidate.matchPercent)}%</span>
              )}
            </p>
          </div>
        </div>

        {/* Row 2: Action buttons — only if applicable */}
        {hasActions && (
          <div className="flex items-center gap-2 mt-3 pl-[52px]">
            {onViewPDI && (
              <GhostButton
                size="sm"
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation()
                  onViewPDI()
                }}
              >
                Ver PDI
              </GhostButton>
            )}
            {onDominoClick && (
              <GhostButton
                size="sm"
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation()
                  onDominoClick()
                }}
              >
                Efecto dominó
              </GhostButton>
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
}
