// src/components/succession/SuccessionCandidateCard.tsx
'use client'

import { memo } from 'react'
import { cn } from '@/lib/utils'
import { AlertTriangle } from 'lucide-react'

interface CandidateCardData {
  id?: string
  employeeId: string
  employeeName: string
  position?: string | null
  departmentName?: string | null
  currentRoleFit?: number
  roleFitScore?: number
  matchPercent: number
  readinessLevel: string
  readinessLabel?: string
  flightRisk?: string | null
  nineBoxPosition?: string | null
  hasPDI?: boolean
}

interface SuccessionCandidateCardProps {
  candidate: CandidateCardData
  onNominate?: () => void
  onViewPDI?: () => void
  isNominating?: boolean
}

const READINESS_STYLES: Record<string, { line: string; text: string }> = {
  READY_NOW:       { line: 'bg-emerald-500', text: 'text-emerald-400' },
  READY_1_2_YEARS: { line: 'bg-amber-500',  text: 'text-amber-400' },
  READY_3_PLUS:    { line: 'bg-rose-500',   text: 'text-rose-400' },
  NOT_VIABLE:      { line: 'bg-slate-600',  text: 'text-slate-400' },
}

const READINESS_LABELS: Record<string, string> = {
  READY_NOW: 'Listo ahora',
  READY_1_2_YEARS: '1-2 anos',
  READY_3_PLUS: '3+ anos',
  NOT_VIABLE: 'No viable',
}

export default memo(function SuccessionCandidateCard({
  candidate,
  onNominate,
  onViewPDI,
  isNominating,
}: SuccessionCandidateCardProps) {
  const style = READINESS_STYLES[candidate.readinessLevel] || READINESS_STYLES.NOT_VIABLE
  const roleFit = candidate.currentRoleFit ?? candidate.roleFitScore ?? 0
  const label = candidate.readinessLabel || READINESS_LABELS[candidate.readinessLevel] || candidate.readinessLevel

  // Initials for avatar
  const initials = candidate.employeeName
    .split(' ')
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase()

  return (
    <div className={cn(
      'group relative w-full p-3 rounded-lg border transition-all duration-200',
      'bg-[#111827] hover:bg-[#161e2e]',
      'border-slate-800 hover:border-slate-700',
      'hover:shadow-lg'
    )}>
      {/* Tesla line vertical */}
      <div className={cn(
        'absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full transition-all duration-300',
        style.line,
        'opacity-60 group-hover:opacity-100'
      )} />

      {/* Flight risk badge */}
      {candidate.flightRisk === 'HIGH' && (
        <div className="absolute -top-2 right-2 px-1.5 py-0.5 bg-rose-500/20 border border-rose-500/50 rounded text-[9px] font-bold text-rose-400 flex items-center gap-0.5 z-10">
          <AlertTriangle size={10} />
          <span>Riesgo fuga</span>
        </div>
      )}

      <div className="flex items-center gap-3 pl-2">
        {/* Avatar */}
        <div className="w-9 h-9 rounded-full bg-[#0B1120] border border-slate-700 flex items-center justify-center text-[11px] font-bold text-slate-400 group-hover:text-white group-hover:border-slate-600 transition-colors">
          {initials}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-slate-200 truncate group-hover:text-white transition-colors">
            {candidate.employeeName}
          </h4>
          <p className="text-[11px] text-slate-500 truncate group-hover:text-slate-400">
            {candidate.position || 'Sin cargo'}
            {candidate.departmentName ? ` \u00B7 ${candidate.departmentName}` : ''}
          </p>

          {/* Metrics row */}
          <div className="flex items-center gap-3 mt-1">
            <span className="text-[10px] text-slate-500 font-mono">
              Fit <span className="text-cyan-400 font-bold">{Math.round(roleFit)}%</span>
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              Match <span className="text-white font-bold">{Math.round(candidate.matchPercent)}%</span>
            </span>
            <span className={cn('text-[10px] font-medium', style.text)}>
              {label}
            </span>
          </div>
        </div>

        {/* CTA */}
        {onNominate && (
          <button
            onClick={(e) => { e.stopPropagation(); onNominate() }}
            disabled={isNominating}
            className="fhr-btn fhr-btn-primary text-xs px-3 py-1.5 flex-shrink-0"
          >
            {isNominating ? '...' : 'Nominar'}
          </button>
        )}
        {onViewPDI && candidate.hasPDI && (
          <button
            onClick={(e) => { e.stopPropagation(); onViewPDI() }}
            className="fhr-btn fhr-btn-secondary text-xs px-3 py-1.5 flex-shrink-0"
          >
            Ver PDI
          </button>
        )}
      </div>
    </div>
  )
})
