'use client'

import type { CinemaHeaderProps } from '@/types/evaluator-cinema'

export default function CinemaHeader({ cycle }: CinemaHeaderProps) {
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
      {cycle && (
        <span className="text-[10px] text-slate-600 font-mono">
          {cycle.daysRemaining} dias restantes
        </span>
      )}
    </div>
  )
}
