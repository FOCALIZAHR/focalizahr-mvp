'use client'

// ════════════════════════════════════════════════════════════════════════════
// DESCRIPTORES HEADER — Clonado de CinemaHeader, adaptado
// Barra superior 56px con logo + "Volver al dashboard"
// ════════════════════════════════════════════════════════════════════════════

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

interface DescriptoresHeaderProps {
  totalPositions: number
  confirmed: number
}

export default function DescriptoresHeader({ totalPositions, confirmed }: DescriptoresHeaderProps) {
  return (
    <div className="h-14 flex items-center justify-between px-8 border-b border-white/5 flex-shrink-0">
      <div className="flex items-center gap-3">
        <span className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em]">
          FocalizaHR
        </span>
        <span className="text-slate-700">|</span>
        <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider">
          Descriptores
        </span>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-[10px] text-slate-600 font-mono">
          {confirmed}/{totalPositions} confirmados
        </span>
        <Link href="/dashboard">
          <button className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800/60 text-slate-400 border border-slate-700/50 hover:text-white hover:border-slate-600 transition-colors flex items-center gap-1.5">
            <ArrowLeft className="w-3.5 h-3.5" />
            Dashboard
          </button>
        </Link>
      </div>
    </div>
  )
}
