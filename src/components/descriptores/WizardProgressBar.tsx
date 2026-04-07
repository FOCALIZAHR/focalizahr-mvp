'use client'

// ════════════════════════════════════════════════════════════════════════════
// WIZARD PROGRESS BAR — Minimalista, transparente, integrado con el fondo
// Dots pequeños + líneas conectoras + nombre cargo
// ════════════════════════════════════════════════════════════════════════════

import { memo } from 'react'
import { ArrowLeft, Home } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDisplayName } from '@/lib/utils/formatName'

interface WizardProgressBarProps {
  jobTitle: string
  currentAct: number
  totalActs?: number
  onBack: () => void
  onHome: () => void
}

const ACTS = [1, 2, 3, 4]

export default memo(function WizardProgressBar({
  jobTitle,
  currentAct,
  totalActs = 4,
  onBack,
  onHome,
}: WizardProgressBarProps) {
  return (
    <div className="sticky top-0 z-50 -mx-4 px-4 md:-mx-8 md:px-8 py-4">
      {/* Row 1: Nav + dots + home */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-slate-600 hover:text-slate-400 transition-colors text-[11px] flex-shrink-0"
        >
          <ArrowLeft className="w-3 h-3" />
          <span className="hidden sm:inline">Volver</span>
        </button>

        {/* Dots — small, elegant */}
        <div className="flex items-center gap-0">
          {ACTS.map((act, idx) => (
            <div key={act} className="flex items-center">
              <div
                className={cn(
                  'w-2 h-2 rounded-full transition-all',
                  act < currentAct
                    ? 'bg-cyan-400/70'
                    : act === currentAct
                    ? 'bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.4)]'
                    : 'bg-slate-700/60'
                )}
              />
              {idx < ACTS.length - 1 && (
                <div
                  className={cn(
                    'w-8 h-px mx-1',
                    act < currentAct ? 'bg-cyan-500/30' : 'bg-slate-800/40'
                  )}
                />
              )}
            </div>
          ))}
        </div>

        <button
          onClick={onHome}
          className="flex items-center gap-1.5 text-slate-600 hover:text-slate-400 transition-colors text-[11px] flex-shrink-0"
        >
          <Home className="w-3 h-3" />
          <span className="hidden sm:inline">Portada</span>
        </button>
      </div>

      {/* Row 2: Job title + step */}
      <div className="flex items-center justify-between mt-2">
        <p className="text-[11px] text-slate-500 font-light truncate">
          {formatDisplayName(jobTitle, 'full')}
        </p>
        <p className="text-[10px] text-slate-600 flex-shrink-0 tabular-nums">
          {currentAct > 0 ? `${currentAct} / ${totalActs}` : 'Selección'}
        </p>
      </div>
    </div>
  )
})
