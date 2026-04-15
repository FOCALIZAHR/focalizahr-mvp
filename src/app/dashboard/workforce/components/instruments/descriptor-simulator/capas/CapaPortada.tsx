'use client'

// ════════════════════════════════════════════════════════════════════════════
// CAPA PORTADA — Estado 1 del motor 2-estados
// capas/CapaPortada.tsx
// ════════════════════════════════════════════════════════════════════════════
// Ocupa el 100% del contenedor (h-[700px]). No scroll.
// Triángulo de la Verdad: 3 métricas + narrativa + CTA único "Abrir Quirófano"
// Al click → transición AnimatePresence al Estado 2 (Workspace).
// ════════════════════════════════════════════════════════════════════════════

import { memo } from 'react'
import { ArrowRight } from 'lucide-react'
import type { PortadaMetrics } from '../descriptor-simulator-utils'
import { formatCLP } from '../../_shared/format'

interface CapaPortadaProps {
  metrics: PortadaMetrics
  jobTitle: string
  onCTA: () => void
}

export default memo(function CapaPortada({
  metrics,
  jobTitle,
  onCTA,
}: CapaPortadaProps) {
  const {
    benchmarkPct,
    clientPct,
    gapPp,
    gapCostMonthly,
    variant,
    narrative,
    isBenchmarkMissing,
  } = metrics

  return (
    <div className="h-full flex flex-col items-center justify-center px-6 md:px-12 text-center relative">
      {/* Línea Tesla superior */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{
          background:
            'linear-gradient(90deg, transparent, #22D3EE, #A78BFA, transparent)',
          boxShadow: '0 0 20px #22D3EE',
        }}
      />

      {/* Contexto */}
      <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-3">
        Rediseño de Cargos · El Triángulo de la Verdad
      </p>

      <h2 className="text-2xl md:text-3xl font-extralight text-white tracking-tight mb-10 max-w-2xl">
        {jobTitle}
      </h2>

      {/* 3 métricas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-14 max-w-4xl w-full mb-10">
        <MetricColumn
          label="Benchmark Mercado"
          valueText={isBenchmarkMissing ? '—' : `${Math.round(benchmarkPct)}%`}
          valueClassName="text-slate-400 font-extralight"
          sublabel="Exposición teórica (Eloundou 2023)"
        />

        <MetricColumn
          label="Tu Empresa"
          valueText={`${Math.round(clientPct)}%`}
          valueClassName="text-white font-extralight"
          sublabel="Exposición de tu cargo"
        />

        <MetricColumn
          label="Gap de Inercia"
          valueText={
            isBenchmarkMissing
              ? '—'
              : variant === 'negative'
                ? `${formatCLP(gapCostMonthly)}/mes`
                : variant === 'positive'
                  ? `${Math.abs(Math.round(gapPp))}pp bajo`
                  : 'Alineado'
          }
          valueClassName={
            variant === 'negative'
              ? 'text-amber-400 font-light'
              : variant === 'positive'
                ? 'text-cyan-400 font-light'
                : 'text-slate-500 font-light'
          }
          sublabel={
            variant === 'negative'
              ? 'Tu costo'
              : variant === 'positive'
                ? 'Tu protección'
                : 'Tu estado'
          }
        />
      </div>

      {/* Narrativa 1 línea */}
      <div className="max-w-2xl mb-10">
        <div
          className="pl-4 py-1"
          style={{
            borderLeft: '2px solid transparent',
            borderImage: 'linear-gradient(to bottom, #22D3EE, #A78BFA) 1',
          }}
        >
          <p className="text-sm font-light text-slate-300 leading-relaxed text-left">
            {narrative}
          </p>
        </div>
      </div>

      {/* CTA único */}
      <button
        type="button"
        onClick={onCTA}
        className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-xs uppercase tracking-widest font-bold text-cyan-300 border border-cyan-400/50 bg-cyan-500/10 hover:bg-cyan-500/20 hover:border-cyan-400 transition-all shadow-[0_0_20px_rgba(34,211,238,0.18)]"
      >
        Abrir Quirófano
        <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </div>
  )
})

// ─────────────────────────────────────────────────────────────────────────────
// MetricColumn
// ─────────────────────────────────────────────────────────────────────────────

function MetricColumn({
  label,
  valueText,
  valueClassName,
  sublabel,
}: {
  label: string
  valueText: string
  valueClassName: string
  sublabel: string
}) {
  return (
    <div className="flex flex-col items-center text-center">
      <p className="text-[9px] uppercase tracking-widest text-slate-500 font-bold mb-3">
        {label}
      </p>
      <p
        className={`text-5xl md:text-6xl tabular-nums font-mono tracking-tight ${valueClassName}`}
      >
        {valueText}
      </p>
      <p className="text-[10px] text-slate-600 font-light mt-3 max-w-[180px]">
        {sublabel}
      </p>
    </div>
  )
}
