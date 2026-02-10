'use client'

import Link from 'next/link'
import { BarChart3 } from 'lucide-react'
import type { CinemaHeaderProps } from '@/types/evaluator-cinema'

export default function CinemaHeader({ cycle, cycleId }: CinemaHeaderProps) {
  return (
    <div className="h-14 flex items-center justify-between px-8 border-b border-white/5 flex-shrink-0">
      <div className="flex items-center gap-3">
        <span className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em]">
          FocalizaHR
        </span>
        {cycle && (
          <>
            <span className="text-slate-700">|</span>
            <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider">
              {cycle.name}
            </span>
          </>
        )}
      </div>
      <div className="flex items-center gap-3">
        {cycleId && (
          <Link href={`/dashboard/performance/cycles/${cycleId}/ratings`}>
            <button className="px-3 py-1.5 rounded-lg text-xs font-medium bg-purple-500/20 text-purple-400 border border-purple-500/30 hover:bg-purple-500/30 transition-colors flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5" />
              Ver Resumen
            </button>
          </Link>
        )}
        {cycle && (
          <span className="text-[10px] text-slate-600 font-mono">
            {cycle.daysRemaining} dias restantes
          </span>
        )}
      </div>
    </div>
  )
}
