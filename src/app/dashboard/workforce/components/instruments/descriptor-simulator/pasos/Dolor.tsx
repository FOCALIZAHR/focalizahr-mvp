'use client'

// ════════════════════════════════════════════════════════════════════════════
// PASO 2 — EL DOLOR
// pasos/Dolor.tsx
// ════════════════════════════════════════════════════════════════════════════
// Traducir el gap de exposición a CLP perdidos. Que duela.
// Mismo minimalismo que Paso 1: número protagonista + narrativa + consecuencia.
// El número CLP tiene glow cyan (única diferencia visual con Paso 1).
//
// Visual:
//   - Línea Tesla superior
//   - Botón "Volver" sutil arriba izquierda (text-[11px])
//   - Número CLP 72px cyan con textShadow glow
//   - Narrativa McKinsey 1 línea
//   - Consecuencia con headcount + horas
//   - 1 CTA cyan
// ════════════════════════════════════════════════════════════════════════════

import { memo } from 'react'
import { ChevronLeft } from 'lucide-react'
import { formatCLPCompact, formatNumber } from '../../_shared/format'
import MoneyTooltip from '../atomos/MoneyTooltip'

interface DolorData {
  inerciaMensual: number    // CLP/mes en tareas automatizables × headcount
  headcount: number          // personas en este cargo
  horasMensuales: number     // horas/mes en zona de rescate (focalizaScore >= 0.5)
}

interface DolorProps {
  data: DolorData
  onNext: () => void
  onBack: () => void
}

export default memo(function Dolor({ data, onNext, onBack }: DolorProps) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center px-8 relative">
      {/* Línea Tesla superior */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{
          background:
            'linear-gradient(90deg, transparent, #22D3EE, #A78BFA, transparent)',
        }}
      />

      {/* Botón Volver — sutil, arriba izquierda */}
      <button
        type="button"
        onClick={onBack}
        className="absolute top-6 left-6 text-slate-500 hover:text-slate-400 text-[11px] flex items-center gap-1.5 transition-all"
      >
        <ChevronLeft className="w-3 h-3" />
        Volver
      </button>

      {/* Contexto */}
      <span className="text-[10px] uppercase tracking-widest text-slate-500 mb-6">
        Impacto Financiero
      </span>

      {/* Título con gradient en palabra clave */}
      <h1 className="text-2xl font-extralight text-white mb-10">
        Inercia{' '}
        <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-400 bg-clip-text text-transparent">
          Mensual
        </span>
      </h1>

      {/* NÚMERO PROTAGONISTA — CLP 72px cyan con glow */}
      <MoneyTooltip showIcon iconSize="md" iconColor="text-cyan-400" className="mb-6">
        <p
          className="text-[72px] font-extralight leading-none tabular-nums"
          style={{
            color: '#22D3EE',
            textShadow: '0 0 40px rgba(34, 211, 238, 0.3)',
          }}
        >
          ${formatCLPCompact(data.inerciaMensual)}
        </p>
      </MoneyTooltip>

      {/* Narrativa McKinsey — UNA línea */}
      <p className="text-base font-light text-slate-400 max-w-lg mb-4">
        Es el potencial de ahorro mensual en tareas delegables a IA.
      </p>

      {/* Consecuencia — headcount + horas */}
      <p className="text-sm text-slate-500 mb-16">
        <span className="tabular-nums">{data.headcount}</span>{' '}
        {data.headcount === 1 ? 'persona' : 'personas'}
        <span className="text-slate-700 mx-2">·</span>
        <span className="tabular-nums">
          {formatNumber(data.horasMensuales)}
        </span>{' '}
        horas/mes en zona de rescate
      </p>

      {/* CTA único */}
      <button
        type="button"
        onClick={onNext}
        className="bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-medium px-8 py-3 rounded-lg text-sm transition-all duration-200 shadow-lg shadow-cyan-500/25 hover:shadow-cyan-400/30"
      >
        Entrar a la Sala de Guerra →
      </button>
    </div>
  )
})
