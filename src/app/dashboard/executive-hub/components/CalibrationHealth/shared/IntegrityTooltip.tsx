'use client'

import { useState } from 'react'
import { Info } from 'lucide-react'
import { cn } from '@/lib/utils'

interface IntegrityTooltipProps {
  baseScore: number
  penalties: {
    bias: { type: string; points: number; reason: string } | null
    variance: { level: string; points: number; reason: string } | null
  }
  finalScore: number
}

const BIAS_LABELS: Record<string, string> = {
  'SEVERITY': 'Sesgo Severo',
  'LENIENCY': 'Sesgo Indulgente',
  'CENTRAL_TENDENCY': 'Tendencia Central'
}

export function IntegrityTooltip({ baseScore, penalties, finalScore }: IntegrityTooltipProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative inline-block">
      <button
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        className="ml-2 text-slate-400 hover:text-cyan-400 transition-colors"
      >
        <Info className="w-4 h-4" />
      </button>

      {open && (
        <div className={cn(
          "absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2",
          "w-72 bg-slate-900 border border-slate-700 rounded-xl p-4 shadow-2xl"
        )}>
          {/* Arrow */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
            <div className="w-2.5 h-2.5 bg-slate-900 border-r border-b border-slate-700 rotate-45" />
          </div>

          <div className="space-y-3">
            <div className="text-[10px] font-semibold text-cyan-400 uppercase tracking-wider">
              Fórmula de Integridad Focaliza®
            </div>

            <div className="space-y-2 text-xs">
              {/* Base */}
              <div className="flex justify-between">
                <span className="text-slate-400">Base (% evaluadores calibrados)</span>
                <span className="text-white font-mono font-medium">{baseScore}%</span>
              </div>

              {/* Penalización Sesgo */}
              {penalties.bias && (
                <div className="flex justify-between text-amber-400">
                  <span>− {BIAS_LABELS[penalties.bias.type] || penalties.bias.type}</span>
                  <span className="font-mono">-{penalties.bias.points}</span>
                </div>
              )}

              {/* Penalización Varianza */}
              {penalties.variance && (
                <div className="flex justify-between text-orange-400">
                  <span>− Varianza {penalties.variance.level}</span>
                  <span className="font-mono">-{penalties.variance.points}</span>
                </div>
              )}

              {/* Línea divisoria + resultado */}
              <div className="border-t border-slate-700 pt-2 flex justify-between">
                <span className="text-white font-semibold">Integridad Final</span>
                <span className="text-cyan-400 font-mono font-bold">{finalScore}%</span>
              </div>
            </div>

            <div className="text-[10px] text-slate-500 pt-2 border-t border-slate-800">
              Metodología propietaria que ajusta la confianza por sesgos
              organizacionales y consistencia entre evaluadores.
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
