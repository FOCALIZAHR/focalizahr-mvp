// ════════════════════════════════════════════════════════════════════════════
// CINEMA HEADER - Header con info de sesión + Bonus Factor
// src/components/calibration/cinema/CinemaHeader.tsx
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { memo } from 'react'
import { cn } from '@/lib/utils'
import { LayoutGrid, X, DollarSign, Users, GitCompare } from 'lucide-react'

interface CinemaHeaderProps {
  session: any
  stats: {
    total: number
    adjustedCount: number
    bonusFactorDisplay: string
  }
  onClose: () => void
  onFinish: () => void
  onStart?: () => void
  isReadOnly: boolean
  userRole: string
}

export default memo(function CinemaHeader({
  session,
  stats,
  onClose,
  onFinish,
  onStart,
  isReadOnly,
  userRole
}: CinemaHeaderProps) {
  const statusConfig: Record<string, { label: string; color: string; pulse: boolean }> = {
    DRAFT: { label: 'Borrador', color: 'text-slate-400', pulse: false },
    IN_PROGRESS: { label: 'En Progreso', color: 'text-emerald-500', pulse: true },
    CLOSED: { label: 'Cerrada', color: 'text-amber-400', pulse: false },
    CANCELLED: { label: 'Cancelada', color: 'text-red-400', pulse: false },
  }

  const currentStatus = statusConfig[session?.status] || statusConfig.DRAFT

  return (
    <header className="h-16 bg-[#0B1120] border-b border-slate-800 flex items-center justify-between px-6 shrink-0 z-20 shadow-xl relative">
      {/* Tesla line top */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-slate-700 to-transparent opacity-50" />

      {/* Left: Title + Status */}
      <div className="flex items-center gap-4">
        <div className="w-9 h-9 bg-slate-800 rounded-lg flex items-center justify-center text-cyan-400 border border-slate-700 shadow-inner">
          <LayoutGrid size={18} />
        </div>
        <div>
          <h1 className="text-sm font-bold text-white tracking-wide uppercase truncate max-w-[300px]">
            {session?.name || 'Calibración'}
          </h1>
          <div className="flex items-center gap-2 mt-0.5">
            {currentStatus.pulse && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            )}
            <span className={cn('text-[10px] font-bold uppercase tracking-wider', currentStatus.color)}>
              {currentStatus.label}
            </span>
          </div>
        </div>
      </div>

      {/* Center: Stats Chips */}
      <div className="hidden md:flex items-center gap-3">
        {/* Total */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#111827] border border-slate-800 rounded-lg">
          <Users size={12} className="text-slate-500" />
          <span className="text-[10px] font-bold text-slate-400">{stats.total}</span>
          <span className="text-[10px] text-slate-600">personas</span>
        </div>

        {/* Ajustes */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#111827] border border-slate-800 rounded-lg">
          <GitCompare size={12} className="text-cyan-500" />
          <span className="text-[10px] font-bold text-cyan-400">{stats.adjustedCount}</span>
          <span className="text-[10px] text-slate-600">ajustes</span>
        </div>

        {/* Bonus Factor */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#111827] border border-slate-800 rounded-lg">
          <DollarSign size={12} className="text-emerald-500" />
          <span className="text-[10px] font-bold text-emerald-400">{stats.bonusFactorDisplay}</span>
          <span className="text-[10px] text-slate-600">bono prom.</span>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        {/* Start button (only DRAFT + FACILITATOR) */}
        {session?.status === 'DRAFT' && userRole === 'FACILITATOR' && onStart && (
          <button
            onClick={onStart}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all"
          >
            Iniciar
          </button>
        )}

        {/* Finish button (only IN_PROGRESS + FACILITATOR) */}
        {session?.status === 'IN_PROGRESS' && userRole === 'FACILITATOR' && (
          <button
            onClick={onFinish}
            className="bg-cyan-600 hover:bg-cyan-500 text-white px-5 py-2 rounded-lg text-xs font-black uppercase tracking-wider shadow-[0_0_15px_rgba(8,145,178,0.4)] transition-all"
          >
            Finalizar
          </button>
        )}

        {/* Close */}
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-all"
        >
          <X size={18} />
        </button>
      </div>
    </header>
  )
})
