'use client'

// ════════════════════════════════════════════════════════════════════════════
// STRATEGIC FOCUS TAB — Bloquean vs Impulsan tu estrategia
// Extraído de RoleFitMatrix.tsx StrategicFocusPanel
// ════════════════════════════════════════════════════════════════════════════

import { memo, useState } from 'react'
import { cn } from '@/lib/utils'
import { Target, ShieldAlert, Rocket, Minus } from 'lucide-react'
import type { StrategicFocusResult, AvailableFocus } from '../Capacidades.types'

interface StrategicFocusTabProps {
  foci: StrategicFocusResult[]
  availableFoci: AvailableFocus[]
}

export default memo(function StrategicFocusTab({ foci, availableFoci }: StrategicFocusTabProps) {
  const [selectedIdx, setSelectedIdx] = useState(0)
  const current = foci[selectedIdx]
  if (!current) return null

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="h-px w-8 bg-white/10" />
        <span className="text-[10px] text-slate-500 font-medium">Foco estratégico</span>
        <div className="h-px flex-1 bg-white/10" />
      </div>

      {/* Focus selector pills */}
      <div className="flex flex-wrap gap-1.5">
        {availableFoci.map((f, i) => (
          <button
            key={f.key}
            onClick={() => setSelectedIdx(i)}
            className={cn(
              'px-2.5 py-1 rounded-md text-[10px] font-medium transition-all border',
              selectedIdx === i
                ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400'
                : 'bg-slate-800/40 border-white/5 text-slate-500 hover:text-slate-300 hover:border-white/10'
            )}
            title={f.description}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Blockers */}
      {current.blockers.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-3 h-3 text-red-400/70" />
            <span className="text-[10px] text-red-400/80 font-medium">
              Bloquean tu meta · {current.blockers.length}
            </span>
          </div>
          {current.blockers.map((b, i) => (
            <div key={i} className="flex items-center justify-between px-3 py-1.5 rounded-md bg-red-500/5 border border-red-500/15">
              <span className="text-[10px] text-white truncate">{b.competencyName}</span>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-[10px] font-mono text-slate-500">{b.actual}/{b.expected}</span>
                <span className={cn('text-[10px] font-mono font-bold', b.gap >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                  {b.gap > 0 ? '+' : ''}{b.gap}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Enablers */}
      {current.enablers.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Rocket className="w-3 h-3 text-emerald-400/70" />
            <span className="text-[10px] text-emerald-400/80 font-medium">
              Impulsan tu meta · {current.enablers.length}
            </span>
          </div>
          {current.enablers.map((e, i) => (
            <div key={i} className="flex items-center justify-between px-3 py-1.5 rounded-md bg-emerald-500/5 border border-emerald-500/15">
              <span className="text-[10px] text-white truncate">{e.competencyName}</span>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-[10px] font-mono text-slate-500">{e.actual}/{e.expected}</span>
                <span className={cn('text-[10px] font-mono font-bold', e.gap >= 0 ? 'text-emerald-400' : 'text-amber-400')}>
                  {e.gap > 0 ? '+' : ''}{e.gap}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Neutral */}
      {current.neutral.length > 0 && (
        <div className="flex items-center gap-1.5">
          <Minus className="w-3 h-3 text-slate-600" />
          <span className="text-[9px] text-slate-600 uppercase tracking-wider">
            Neutro: {current.neutral.map(n => n.competencyName).join(', ')}
          </span>
        </div>
      )}
    </div>
  )
})
