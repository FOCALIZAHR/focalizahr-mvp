'use client'

// ════════════════════════════════════════════════════════════════════════════
// SUMMARY LEFT COLUMN - Avatar + Score + Potential + Info
// src/components/performance/summary/SummaryLeftColumn.tsx
// ════════════════════════════════════════════════════════════════════════════

import { memo } from 'react'
import { getInitials } from '@/lib/utils/formatName'
import { getPerformanceClassification } from '@/config/performanceClassification'

interface SummaryLeftColumnProps {
  evaluatee: {
    fullName: string
    position: string | null
    department: string
  }
  score: number | null
  potentialLevel?: string | null
  potentialScore?: number | null
}

export default memo(function SummaryLeftColumn({
  evaluatee,
  score,
  potentialLevel
}: SummaryLeftColumnProps) {

  const initials = getInitials(evaluatee.fullName)
  const classification = score ? getPerformanceClassification(score) : null

  return (
    <div className="w-full md:w-[25%] bg-slate-900/50 p-8 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-800">

      {/* Avatar */}
      <div className="relative mb-6">
        <div className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-gradient-to-br from-slate-800 to-slate-950 flex items-center justify-center text-2xl md:text-3xl font-bold text-slate-400 border border-slate-700 shadow-2xl">
          {initials}
        </div>

        {/* Badge completada */}
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30">
          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
            Completada
          </span>
        </div>
      </div>

      {/* Score grande */}
      {score != null && classification && (
        <div className="text-center mb-4">
          <div
            className="text-4xl font-bold mb-1"
            style={{ color: classification.color }}
          >
            {score.toFixed(1)}
          </div>
          <div
            className="text-sm font-medium"
            style={{ color: classification.color }}
          >
            {classification.label}
          </div>
        </div>
      )}

      {/* Potencial */}
      {potentialLevel && (
        <div className="flex items-center gap-2 mb-6">
          <div className="w-2 h-2 rounded-full bg-purple-400" />
          <span className="text-sm text-purple-400 font-medium">
            {potentialLevel} Potencial
          </span>
        </div>
      )}

      {/* Separador */}
      <div className="w-16 h-px bg-slate-700 mb-6" />

      {/* Nombre */}
      <h2 className="text-xl font-bold text-white text-center mb-1">
        {evaluatee.fullName}
      </h2>
      <p className="text-sm text-slate-400 text-center mb-1">
        {evaluatee.position || 'Sin cargo'}
      </p>
      <p className="text-xs text-slate-600 text-center uppercase tracking-wider">
        {evaluatee.department}
      </p>

    </div>
  )
})
