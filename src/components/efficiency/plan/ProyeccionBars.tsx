// ════════════════════════════════════════════════════════════════════════════
// PROYECCIÓN BARS — Flujo acumulado en horizonte 3/6/12/24/36 meses
// src/components/efficiency/plan/ProyeccionBars.tsx
// ════════════════════════════════════════════════════════════════════════════
// Cada barra = ahorroMes × mes - inversión (flujo neto acumulado).
//   · neto < 0  → rojo   (aún no se recuperó la inversión)
//   · neto > 0  → verde  (flujo positivo)
//   · payback   → label amber en el primer horizonte que cruza 0
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { useMemo } from 'react'
import {
  calcularProyecciones,
  type ResumenCarrito,
} from '@/lib/services/efficiency/EfficiencyCalculator'
import { formatCLP } from '@/lib/services/efficiency/EfficiencyNarrativeEngine'

// ════════════════════════════════════════════════════════════════════════════
// PROPS
// ════════════════════════════════════════════════════════════════════════════

interface ProyeccionBarsProps {
  resumen: ResumenCarrito
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE
// ════════════════════════════════════════════════════════════════════════════

export function ProyeccionBars({ resumen }: ProyeccionBarsProps) {
  const proyecciones = useMemo(
    () => calcularProyecciones(resumen.ahorroMensual, resumen.inversion),
    [resumen.ahorroMensual, resumen.inversion]
  )

  // Escala común: el valor absoluto más grande define el 100% de ancho
  const maxAbs = useMemo(
    () => Math.max(1, ...proyecciones.map(p => Math.abs(p.neto))),
    [proyecciones]
  )

  return (
    <section>
      <div className="flex items-baseline justify-between mb-4">
        <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500 font-medium">
          Proyección del flujo neto acumulado
        </p>
        <p className="text-[10px] text-slate-500 font-light">
          horizonte 3 · 6 · 12 · 24 · 36 meses
        </p>
      </div>

      <div className="space-y-2.5">
        {proyecciones.map(p => {
          const isPositive = p.neto >= 0
          const color = isPositive ? '#10B981' : '#EF4444'
          const colorBg = isPositive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)'
          const width = (Math.abs(p.neto) / maxAbs) * 100

          return (
            <div
              key={p.mes}
              className="grid grid-cols-[56px_1fr_auto] items-center gap-3"
            >
              {/* Label mes */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-400 font-light tabular-nums">
                  mes {p.mes}
                </span>
                {p.esPayback && (
                  <span
                    className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded text-amber-300 border border-amber-500/40 bg-amber-500/10"
                    title="Mes en que el plan se paga solo"
                  >
                    payback
                  </span>
                )}
              </div>

              {/* Barra */}
              <div
                className="relative h-6 rounded-md overflow-hidden border border-slate-800/60"
                style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)' }}
              >
                <div
                  className="absolute inset-y-0 left-0 rounded-md transition-all duration-500"
                  style={{
                    width: `${Math.max(width, 2)}%`,
                    background: `linear-gradient(90deg, ${colorBg}, ${color}40)`,
                    borderRight: `2px solid ${color}`,
                    boxShadow: `0 0 8px ${color}40`,
                  }}
                />
              </div>

              {/* Valor */}
              <span
                className="text-xs font-medium tabular-nums whitespace-nowrap w-24 text-right"
                style={{ color }}
              >
                {isPositive ? '+' : '−'}
                {formatCLP(Math.abs(p.neto))}
              </span>
            </div>
          )
        })}
      </div>

      {/* Footer info */}
      <p className="text-[10px] text-slate-500 font-light mt-3 leading-relaxed">
        Flujo = ahorro mensual × mes − inversión. El color del mes muestra si
        la decisión ya se pagó sola.
      </p>
    </section>
  )
}
