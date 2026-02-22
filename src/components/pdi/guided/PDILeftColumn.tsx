'use client'

// ════════════════════════════════════════════════════════════════════════════
// PDI LEFT COLUMN - Avatar + Role Fit Score
// src/components/pdi/guided/PDILeftColumn.tsx
// ════════════════════════════════════════════════════════════════════════════

import { memo } from 'react'
import { getInitials } from '@/lib/utils/formatName'
import type { RoleFitLevelConfig } from '@/config/performanceClassification'

interface PDILeftColumnProps {
  employeeName: string
  roleFitScore?: number | null
  roleFitConfig?: RoleFitLevelConfig | null
}

export default memo(function PDILeftColumn({
  employeeName,
  roleFitScore,
  roleFitConfig
}: PDILeftColumnProps) {

  const initials = getInitials(employeeName)

  return (
    <div className="w-full md:w-[25%] bg-slate-900/50 p-8 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-800">

      {/* Avatar */}
      <div className="relative mb-6">
        <div className="w-28 h-28 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-slate-800 to-slate-950 flex items-center justify-center text-2xl md:text-3xl font-bold text-slate-400 border border-slate-700 shadow-2xl">
          {initials}
        </div>
      </div>

      {/* Role Fit Score */}
      {roleFitScore != null && roleFitConfig && (
        <div className="text-center mb-4">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
            Role Fit
          </p>
          <div
            className="text-4xl font-bold mb-1"
            style={{ color: roleFitConfig.color }}
          >
            {roleFitScore}%
          </div>
          <div
            className="text-sm font-medium"
            style={{ color: roleFitConfig.color }}
          >
            {roleFitConfig.label}
          </div>
        </div>
      )}

      {/* Separator */}
      <div className="w-16 h-px bg-slate-700 mb-6" />

      {/* Name */}
      <h2 className="text-xl font-bold text-white text-center mb-1">
        {employeeName}
      </h2>

      {/* Role Fit Question */}
      {roleFitConfig?.question && (
        <p className="text-xs text-slate-500 text-center mt-4 italic">
          &ldquo;{roleFitConfig.question}&rdquo;
        </p>
      )}

    </div>
  )
})
