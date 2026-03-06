'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

interface SuccessionCinemaHeaderProps {
  stats: {
    totalPositions: number
    coveredPositions: number
    totalCandidates: number
  }
}

export default function SuccessionCinemaHeader({ stats }: SuccessionCinemaHeaderProps) {
  return (
    <div className="h-14 flex items-center justify-between px-8 border-b border-white/5 flex-shrink-0">
      <div className="flex items-center gap-3">
        <span className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em]">
          FocalizaHR
        </span>
        <span className="text-slate-700">|</span>
        <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider">
          Pipeline de Sucesion
        </span>
      </div>
      <div className="flex items-center gap-3">
        <span className="px-3 py-1 rounded-full text-[10px] font-mono text-slate-400 bg-slate-800/60 border border-slate-700/40">
          {stats.totalPositions} posiciones · {stats.totalCandidates} candidatos
        </span>
        <Link href="/dashboard">
          <button className="px-3 py-1.5 rounded-lg text-xs font-medium bg-purple-500/20 text-purple-400 border border-purple-500/30 hover:bg-purple-500/30 transition-colors flex items-center gap-1.5">
            <ArrowLeft className="w-3.5 h-3.5" />
            Dashboard
          </button>
        </Link>
      </div>
    </div>
  )
}
