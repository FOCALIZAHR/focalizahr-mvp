// ════════════════════════════════════════════════════════════════════════════
// METRICAS RESUMEN — 4 cards con las cifras que el directorio va a leer primero
// src/components/efficiency/plan/MetricasResumen.tsx
// ════════════════════════════════════════════════════════════════════════════
// Cada card = una pieza del Business Case:
//   · FTE liberados    — capacidad que se recupera
//   · Ahorro / mes     — flujo recurrente
//   · Inversión        — costo one-time (finiquitos, reskill, etc.)
//   · Payback          — meses hasta que el plan se paga solo
//     null → "∞ Sin Breakeven" (guard división por cero del TASK)
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { Users, TrendingUp, Banknote, Clock } from 'lucide-react'
import type { ResumenCarrito } from '@/lib/services/efficiency/EfficiencyCalculator'
import { formatCLP } from '@/lib/services/efficiency/EfficiencyNarrativeEngine'

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE
// ════════════════════════════════════════════════════════════════════════════

interface MetricasResumenProps {
  resumen: ResumenCarrito
}

export function MetricasResumen({ resumen }: MetricasResumenProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
      <MetricCard
        icon={Users}
        label="FTE liberados"
        value={resumen.fteLiberados.toLocaleString('es-CL', {
          maximumFractionDigits: 1,
        })}
        accent="#22D3EE"
        hint="capacidad recuperada"
      />
      <MetricCard
        icon={TrendingUp}
        label="Ahorro / mes"
        value={formatCLP(resumen.ahorroMensual)}
        accent="#10B981"
        hint={`${formatCLP(resumen.ahorroAnual)} anual`}
      />
      <MetricCard
        icon={Banknote}
        label="Inversión"
        value={formatCLP(resumen.inversion)}
        accent="#F59E0B"
        hint="costo one-time"
      />
      <MetricCard
        icon={Clock}
        label="Payback"
        value={
          resumen.paybackMeses === null
            ? '∞'
            : `${resumen.paybackMeses} ${
                resumen.paybackMeses === 1 ? 'mes' : 'meses'
              }`
        }
        accent={resumen.paybackMeses === null ? '#64748B' : '#A78BFA'}
        hint={
          resumen.paybackMeses === null
            ? 'Sin Breakeven'
            : 'hasta recuperar inversión'
        }
      />
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// METRIC CARD (glassmorphism + Tesla line + hero number)
// ════════════════════════════════════════════════════════════════════════════

function MetricCard({
  icon: Icon,
  label,
  value,
  accent,
  hint,
}: {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
  label: string
  value: string
  accent: string
  hint?: string
}) {
  return (
    <div
      className="relative rounded-xl bg-slate-900/60 backdrop-blur-xl border border-slate-800/60 p-4 md:p-5 overflow-hidden"
      style={{ boxShadow: `0 0 24px ${accent}15` }}
    >
      {/* Tesla line */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{
          background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
        }}
        aria-hidden
      />

      <div className="flex items-start gap-2 mb-3">
        <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: accent }} />
        <p className="text-[10px] uppercase tracking-widest text-slate-500 font-medium leading-tight">
          {label}
        </p>
      </div>

      <p
        className="font-extralight text-white leading-none"
        style={{ fontSize: 'clamp(24px, 3vw, 34px)', letterSpacing: '-0.02em' }}
      >
        {value}
      </p>

      {hint && (
        <p className="text-[10px] text-slate-500 font-light mt-1.5">{hint}</p>
      )}
    </div>
  )
}
