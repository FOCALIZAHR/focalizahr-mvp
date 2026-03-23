'use client'

// ════════════════════════════════════════════════════════════════════════════
// LEADERSHIP ALERT — Motor 3 multiplicador de liderazgo
// ════════════════════════════════════════════════════════════════════════════

import { memo } from 'react'
import { AlertTriangle, Users, Zap } from 'lucide-react'
import type { LeadershipImpact } from '@/config/narratives/LeadershipRiskDictionary'

interface PLTalentLeadershipAlertProps {
  leadersAtRisk: number
  totalDirectReports: number
  leadershipRisk: LeadershipImpact
}

export default memo(function PLTalentLeadershipAlert({
  leadersAtRisk,
  totalDirectReports,
  leadershipRisk,
}: PLTalentLeadershipAlertProps) {

  if (leadersAtRisk === 0) return null

  return (
    <div className="relative p-4 md:p-6 bg-gradient-to-r from-red-500/10 via-orange-500/10 to-red-500/10 rounded-2xl border border-red-500/30 overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-red-500 to-transparent" />

      {/* Header */}
      <div className="flex items-start gap-3 md:gap-4">
        <div className="p-2 md:p-3 bg-red-500/20 rounded-xl flex-shrink-0">
          <Zap className="w-5 h-5 md:w-6 md:h-6 text-red-400" />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-base md:text-lg font-bold text-white flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 md:w-5 md:h-5 text-red-400 flex-shrink-0" />
            MULTIPLICADOR DE LIDERAZGO
          </h3>

          <p className="text-slate-300 mt-2 text-sm flex flex-wrap items-center gap-2 md:gap-4">
            <span className="flex items-center gap-1">
              <Users className="w-4 h-4 text-red-400" />
              <strong className="text-white">{leadersAtRisk}</strong> jefaturas con Role Fit &lt; 75%
            </span>
            <span className="text-slate-500">→</span>
            <span>afectan a <strong className="text-white">{totalDirectReports}</strong> personas</span>
          </p>
        </div>
      </div>

      {/* CEO Message */}
      <div className="mt-4 p-3 md:p-4 bg-slate-900/50 rounded-xl">
        <p className="text-slate-300 italic text-sm">&ldquo;{leadershipRisk.ceoMessage}&rdquo;</p>
      </div>

      {/* Tax Items */}
      <div className="mt-4">
        <p className="text-slate-400 text-xs mb-2">{leadershipRisk.taxNarrative}</p>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {leadershipRisk.taxItems.map((item, idx) => (
            <li key={idx} className="flex items-center gap-2 text-slate-300 text-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
})
