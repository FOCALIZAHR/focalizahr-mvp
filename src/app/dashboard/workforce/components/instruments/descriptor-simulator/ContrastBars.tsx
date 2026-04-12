'use client'

// ════════════════════════════════════════════════════════════════════════════
// CONTRAST BARS — antes (baseline) vs después (simulado)
// src/app/dashboard/workforce/components/instruments/descriptor-simulator/ContrastBars.tsx
// ════════════════════════════════════════════════════════════════════════════
// Visual de la reducción de exposición. Cero libs.
// La barra "después" anima width con CSS transition.
// ════════════════════════════════════════════════════════════════════════════

import { memo } from 'react'

interface ContrastBarsProps {
  baselineExposurePct: number
  newExposurePct: number
}

const ContrastBars = memo(function ContrastBars({
  baselineExposurePct,
  newExposurePct,
}: ContrastBarsProps) {
  const baseClamped = Math.max(0, Math.min(100, baselineExposurePct))
  const newClamped = Math.max(0, Math.min(100, newExposurePct))

  return (
    <div className="space-y-3">
      <p className="text-[9px] uppercase tracking-widest text-slate-500 font-bold">
        Contraste de exposición
      </p>

      {/* Barra ANTES */}
      <div>
        <div className="flex justify-between text-[10px] uppercase tracking-wider mb-1">
          <span className="text-slate-500 font-bold">Antes del rediseño</span>
          <span className="text-slate-400 font-mono tabular-nums">
            {Math.round(baseClamped)}%
          </span>
        </div>
        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-amber-500/60"
            style={{ width: `${baseClamped}%` }}
          />
        </div>
      </div>

      {/* Barra DESPUÉS */}
      <div>
        <div className="flex justify-between text-[10px] uppercase tracking-wider mb-1">
          <span className="text-cyan-400 font-bold">Después del rediseño</span>
          <span className="text-cyan-400 font-mono tabular-nums">
            {Math.round(newClamped)}%
          </span>
        </div>
        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-cyan-400 transition-all duration-500 ease-out"
            style={{
              width: `${newClamped}%`,
              boxShadow: '0 0 8px rgba(34, 211, 238, 0.4)',
            }}
          />
        </div>
      </div>
    </div>
  )
})

export default ContrastBars
