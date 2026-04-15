'use client'

// ════════════════════════════════════════════════════════════════════════════
// PANEL ACUMULADORES — zona A del Panel de Control (top, siempre visible)
// paneles/PanelAcumuladores.tsx
// ════════════════════════════════════════════════════════════════════════════
// 3 métricas reactivas al simulador. Se actualizan EN VIVO cuando el CEO
// mueve un slider en el Lienzo 70%.
//
//   - Horas: original tachado → nueva en cyan
//   - Rescate CLP: número grande en emerald × headcount
//   - Nueva exposición: % original → % nueva en purple
//
// shrink-0 + border-b → NUNCA se oculta con scroll. Es la zona fija
// donde el CEO ve el impacto de cada toque.
// ════════════════════════════════════════════════════════════════════════════

import { memo } from 'react'
import { useAnimatedNumber } from '../../_shared/useAnimatedNumber'
import { formatCLP, formatHours } from '../../_shared/format'
import type { LiveSimulation } from '../descriptor-simulator-utils'

interface PanelAcumuladoresProps {
  simulation: LiveSimulation
  baselineExposurePct: number
  headcount: number
}

export default memo(function PanelAcumuladores({
  simulation,
  baselineExposurePct,
  headcount,
}: PanelAcumuladoresProps) {
  const animCurrent = useAnimatedNumber(simulation.currentHours, 300)
  const animRescate = useAnimatedNumber(simulation.rescateCLPTotal, 400)
  const animNewExp = useAnimatedNumber(simulation.newExposurePct, 300)

  const hasMultiple = headcount > 1

  return (
    <div className="p-5 border-b border-slate-700/30 shrink-0 space-y-4">
      <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">
        Impacto simulado
      </p>

      {/* ── Horas: original tachado → nueva en cyan ─────────────── */}
      <div>
        <p className="text-[9px] uppercase tracking-wider text-slate-500 font-light mb-1">
          Horas / mes
        </p>
        <p className="font-mono text-sm tabular-nums">
          <span className="line-through text-slate-600 text-xs">
            {formatHours(simulation.originalHours)}
          </span>
          <span className="text-slate-600 mx-1.5">→</span>
          <span className="text-cyan-300 font-medium">
            {formatHours(animCurrent)}
          </span>
        </p>
      </div>

      {/* ── Rescate CLP: número grande ─────────────────────────── */}
      <div>
        <p className="text-[9px] uppercase tracking-wider text-emerald-400/80 font-bold mb-1">
          Rescate EBITDA
        </p>
        <p className="text-2xl font-extralight text-emerald-300 tabular-nums font-mono leading-tight">
          {formatCLP(animRescate)}
        </p>
        <p className="text-[10px] text-slate-500 font-light mt-0.5">
          CLP / mes
          {hasMultiple && simulation.rescateCLP > 0 && (
            <span className="text-slate-600"> · × {headcount} ocupantes</span>
          )}
        </p>
      </div>

      {/* ── Nueva exposición: % original → nueva en purple ─────── */}
      <div>
        <p className="text-[9px] uppercase tracking-wider text-slate-500 font-light mb-1">
          Exposición a IA
        </p>
        <p className="font-mono text-sm tabular-nums">
          <span className="line-through text-slate-600 text-xs">
            {Math.round(baselineExposurePct)}%
          </span>
          <span className="text-slate-600 mx-1.5">→</span>
          <span className="text-purple-300 font-medium">
            {Math.round(animNewExp)}%
          </span>
        </p>
      </div>
    </div>
  )
})
