'use client'

// ════════════════════════════════════════════════════════════════════════════
// TENURE SEGMENT BADGE — onboarding < 6m / real 6m-3a / cronico > 3a
// ════════════════════════════════════════════════════════════════════════════

import { memo } from 'react'
import type { TenureSegment } from '@/lib/services/TalentActionService'

const TENURE_CONFIG: Record<TenureSegment, { label: string; className: string }> = {
  onboarding: {
    label: 'Onboarding',
    className: 'bg-blue-500/10 text-blue-400 border-blue-500/20'
  },
  real: {
    label: 'Consolidado',
    className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
  },
  cronico: {
    label: 'Veterano',
    className: 'bg-purple-500/10 text-purple-400 border-purple-500/20'
  }
}

interface TenureSegmentBadgeProps {
  segment: TenureSegment
  months?: number
}

export default memo(function TenureSegmentBadge({ segment, months }: TenureSegmentBadgeProps) {
  const config = TENURE_CONFIG[segment]

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${config.className}`}>
      {config.label}
      {months !== undefined && (
        <span className="opacity-70">
          {months < 12 ? `${months}m` : `${Math.round(months / 12)}a`}
        </span>
      )}
    </span>
  )
})
