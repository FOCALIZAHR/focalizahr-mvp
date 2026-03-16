'use client'

// Clonado de src/components/evaluator/cinema/CinemaHeader.tsx
// Misma estructura exacta, adaptado dominio

import type { TACCinemaStats } from '@/types/tac-cinema'

interface TACCinemaHeaderProps {
  stats: TACCinemaStats
}

export default function TACCinemaHeader({ stats }: TACCinemaHeaderProps) {
  return (
    <div className="h-14 flex items-center justify-between px-8 border-b border-white/5 flex-shrink-0">
      <div className="flex items-center gap-3">
        <span className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em]">
          FocalizaHR
        </span>
        <span className="text-slate-700">|</span>
        <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider">
          Talent Action Center
        </span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-[10px] text-slate-600 font-mono">
          {stats.totalGerencias} gerencia{stats.totalGerencias !== 1 ? 's' : ''} · {stats.totalPersonas} personas
        </span>
      </div>
    </div>
  )
}
