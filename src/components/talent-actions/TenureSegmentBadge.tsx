'use client'

// ════════════════════════════════════════════════════════════════════════════
// TENURE SEGMENT BADGE — onboarding < 6m / real 6m-3a / cronico > 3a
// ════════════════════════════════════════════════════════════════════════════

import { memo, useState } from 'react'
import type { TenureSegment } from '@/lib/services/TalentActionService'

const TENURE_CONFIG: Record<TenureSegment, { label: string; className: string }> = {
  onboarding: {
    label: 'Nuevo ingreso',
    className: 'bg-blue-500/10 text-blue-400 border-blue-500/20'
  },
  real: {
    label: 'En desarrollo-Pleno',
    className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
  },
  cronico: {
    label: 'Senior',
    className: 'bg-purple-500/10 text-purple-400 border-purple-500/20'
  }
}

function formatTenureTooltip(months: number): string {
  if (months < 1) return 'Menos de 1 mes en la organización'
  if (months < 12) return `${months} ${months === 1 ? 'mes' : 'meses'} en la organización`
  const years = Math.round(months / 12)
  return `${years} ${years === 1 ? 'año' : 'años'} en la organización`
}

interface TenureSegmentBadgeProps {
  segment: TenureSegment
  months?: number
}

export default memo(function TenureSegmentBadge({ segment, months }: TenureSegmentBadgeProps) {
  const config = TENURE_CONFIG[segment]
  const [showTooltip, setShowTooltip] = useState(false)

  return (
    <span
      className={`relative inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${config.className}`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {config.label}
      {months !== undefined && (
        <span className="opacity-70">
          {months < 12 ? `${months}m` : `${Math.round(months / 12)}a`}
        </span>
      )}

      {/* Tooltip */}
      {showTooltip && months !== undefined && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700/50 text-[10px] text-slate-300 whitespace-nowrap pointer-events-none z-50">
          {formatTenureTooltip(months)}
        </span>
      )}
    </span>
  )
})
