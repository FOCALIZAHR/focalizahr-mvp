'use client'

// ════════════════════════════════════════════════════════════════════════════
// PNL LIVE TRACKER — sidebar con 3 odómetros animados
// src/app/dashboard/workforce/components/instruments/descriptor-simulator/PnLLiveTracker.tsx
// ════════════════════════════════════════════════════════════════════════════
// 3 indicadores con efecto odómetro (useAnimatedNumber):
//   1. Capacidad liberada (h/mes)
//   2. Rescate de EBITDA (CLP/mes)
//   3. Nueva exposición (%)
//
// Tono arbitrador: descriptivo, no prescriptivo.
// ════════════════════════════════════════════════════════════════════════════

import { memo } from 'react'
import { useAnimatedNumber } from '../_shared/useAnimatedNumber'
import { formatCLP } from '../_shared/format'
import type { SimulationResult } from './descriptor-simulator-utils'

interface PnLLiveTrackerProps {
  simulation: SimulationResult
  baselineExposurePct: number
}

const PnLLiveTracker = memo(function PnLLiveTracker({
  simulation,
  baselineExposurePct,
}: PnLLiveTrackerProps) {
  const animCapacidad = useAnimatedNumber(simulation.capacidadLiberada)
  const animRescate = useAnimatedNumber(simulation.rescateMensual)
  const animExposicion = useAnimatedNumber(simulation.nuevaExposicionPct)

  const reduccionPp = Math.max(0, baselineExposurePct - simulation.nuevaExposicionPct)
  const animReduccion = useAnimatedNumber(reduccionPp)

  return (
    <div className="flex flex-col gap-6">
      {/* ── Capacidad liberada ─────────────────────────────────── */}
      <div>
        <p className="text-[9px] uppercase tracking-widest text-slate-500 font-bold">
          Capacidad liberada
        </p>
        <p className="text-4xl font-extralight text-white tabular-nums mt-1 font-mono">
          {Math.round(animCapacidad)}{' '}
          <span className="text-lg text-slate-500 font-light">h / mes</span>
        </p>
        <p className="text-[11px] font-light text-slate-500 mt-1">
          horas que dejan de ser trabajo humano bajo este escenario
        </p>
      </div>

      {/* ── Rescate de EBITDA ──────────────────────────────────── */}
      <div className="border-t border-white/5 pt-5">
        <p className="text-[9px] uppercase tracking-widest text-cyan-400/80 font-bold">
          Rescate de EBITDA
        </p>
        <p className="text-4xl font-extralight text-cyan-300 tabular-nums mt-1 font-mono">
          {formatCLP(animRescate)}
        </p>
        <p className="text-[11px] font-light text-slate-500 mt-1">
          masa salarial recuperada al mes
        </p>
      </div>

      {/* ── Nueva exposición ──────────────────────────────────── */}
      <div className="border-t border-white/5 pt-5">
        <p className="text-[9px] uppercase tracking-widest text-slate-500 font-bold">
          Nueva exposición
        </p>
        <div className="flex items-baseline gap-3 mt-1">
          <p className="text-4xl font-extralight text-white tabular-nums font-mono">
            {Math.round(animExposicion)}%
          </p>
          {reduccionPp > 0 && (
            <p className="text-xs font-mono text-cyan-400 tabular-nums">
              −{Math.round(animReduccion)} pp
            </p>
          )}
        </div>
        <p className="text-[11px] font-light text-slate-500 mt-1">
          recálculo sobre las tareas que siguen siendo humanas
        </p>
      </div>

      {/* ── Distribución ──────────────────────────────────────── */}
      <div className="border-t border-white/5 pt-5">
        <p className="text-[9px] uppercase tracking-widest text-slate-500 font-bold mb-2">
          Distribución del rediseño
        </p>
        <div className="space-y-1.5 text-[10px] font-mono">
          <div className="flex justify-between">
            <span className="text-slate-500">Humano</span>
            <span className="text-slate-300 tabular-nums">{simulation.totalHuman}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Aumentado</span>
            <span className="text-amber-300 tabular-nums">{simulation.totalAugmented}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Automatizado</span>
            <span className="text-cyan-300 tabular-nums">{simulation.totalAutomated}</span>
          </div>
        </div>
      </div>
    </div>
  )
})

export default PnLLiveTracker
