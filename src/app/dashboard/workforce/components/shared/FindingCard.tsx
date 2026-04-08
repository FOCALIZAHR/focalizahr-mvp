'use client'

// ════════════════════════════════════════════════════════════════════════════
// FINDING CARD — Card de hallazgo individual
// Usado en CascadeActo3Hallazgos para cada uno de los 5 hallazgos
// src/app/dashboard/workforce/components/shared/FindingCard.tsx
// ════════════════════════════════════════════════════════════════════════════

import type { ReactNode } from 'react'

export interface FindingCardProps {
  number: number
  headline: string
  narrative: string
  consequence: string
  children?: ReactNode
}

export default function FindingCard({
  number,
  headline,
  narrative,
  consequence,
  children,
}: FindingCardProps) {
  return (
    <div className="bg-slate-900/60 backdrop-blur-sm border border-slate-800/40 rounded-xl p-5 md:p-6 border-l-2 border-l-amber-500/50">
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <span className="flex-shrink-0 w-7 h-7 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-xs font-bold text-amber-400">
          {number}
        </span>
        <h3 className="text-base md:text-lg font-bold text-white leading-tight">
          {headline}
        </h3>
      </div>

      {/* Narrative */}
      <p className="text-sm text-slate-400 font-light leading-relaxed mb-4">
        {narrative}
      </p>

      {/* Content slot (table/list) */}
      {children && (
        <div className="mb-4 overflow-x-auto">
          {children}
        </div>
      )}

      {/* Consequence */}
      <p className="text-sm text-slate-300 italic font-light">
        {consequence}
      </p>
    </div>
  )
}
