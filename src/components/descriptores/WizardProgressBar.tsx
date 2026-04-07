'use client'

// ════════════════════════════════════════════════════════════════════════════
// WIZARD PROGRESS BAR — Sticky top con dots + nombre cargo + navegación
// ════════════════════════════════════════════════════════════════════════════

import { memo } from 'react'
import { ArrowLeft, Home, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

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
    <div className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-lg border-b border-slate-800/40 -mx-4 px-4 md:-mx-8 md:px-8 py-3">
      {/* Row 1: Nav + dots + home */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 transition-colors text-xs flex-shrink-0"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Volver
        </button>

        {/* Dots */}
        <div className="flex items-center gap-1.5">
          {ACTS.map((act, idx) => (
            <div key={act} className="flex items-center">
              {/* Dot */}
              <div
                className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-medium transition-all',
                  act < currentAct
                    ? 'bg-cyan-500/20 text-cyan-400'
                    : act === currentAct
                    ? 'bg-cyan-500/30 text-cyan-300 shadow-[0_0_8px_rgba(34,211,238,0.3)]'
                    : 'bg-slate-800/60 text-slate-600'
                )}
              >
                {act < currentAct ? <Check className="w-3 h-3" /> : act}
              </div>
              {/* Connector line */}
              {idx < ACTS.length - 1 && (
                <div
                  className={cn(
                    'w-6 h-px mx-0.5',
                    act < currentAct ? 'bg-cyan-500/40' : 'bg-slate-800'
                  )}
                />
              )}
            </div>
          ))}
        </div>

        <button
          onClick={onHome}
          className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 transition-colors text-xs flex-shrink-0"
        >
          <Home className="w-3.5 h-3.5" />
          Portada
        </button>
      </div>

      {/* Row 2: Job title + step indicator */}
      <div className="flex items-center justify-between mt-2">
        <p className="text-xs text-slate-400 font-light truncate">{jobTitle}</p>
        <p className="text-[10px] text-slate-600 flex-shrink-0">
          Paso {currentAct} de {totalActs}
        </p>
      </div>
    </div>
  )
})
