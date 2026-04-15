'use client'

// ════════════════════════════════════════════════════════════════════════════
// PASO 1 — LA REVELACIÓN
// pasos/Revelacion.tsx
// ════════════════════════════════════════════════════════════════════════════
// Mostrar el gap de exposición IA en 3 segundos.
// Ultra minimalista: contexto + título + número protagonista + comparativo + CTA.
// Cero contenedores internos. Cero badges. Solo texto flotando en aire.
//
// Visual:
//   - Línea Tesla superior (única decoración)
//   - Número 96px font-extralight white (protagonista)
//   - 1 CTA cyan con sombra
//   - mb-10/mb-16 — espacio negativo deliberado
// ════════════════════════════════════════════════════════════════════════════

import { memo } from 'react'

interface RevelacionData {
  benchmarkMercado: number  // %, ej: 59
  tuEmpresa: number          // %, ej: 43
  gap: number                // %, ej: 16 (delta absoluto)
}

interface RevelacionProps {
  data: RevelacionData
  onNext: () => void
}

export default memo(function Revelacion({ data, onNext }: RevelacionProps) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center px-8 relative">
      {/* Línea Tesla superior — única decoración */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{
          background:
            'linear-gradient(90deg, transparent, #22D3EE, #A78BFA, transparent)',
        }}
      />

      {/* Contexto */}
      <span className="text-[10px] uppercase tracking-widest text-slate-500 mb-6">
        Rediseño de Cargos · Inteligencia IA
      </span>

      {/* Título con gradient en palabra clave */}
      <h1 className="text-2xl font-extralight text-white mb-10">
        Potencial de{' '}
        <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-400 bg-clip-text text-transparent">
          Delegación IA
        </span>
      </h1>

      {/* NÚMERO PROTAGONISTA — 96px white extralight */}
      <p className="text-[96px] font-extralight text-white leading-none mb-6 tabular-nums">
        {Math.round(data.gap)}%
      </p>

      {/* Subtítulo comparativo */}
      <p className="text-lg font-light text-slate-400 mb-16">
        Mercado:{' '}
        <span className="text-white tabular-nums">
          {Math.round(data.benchmarkMercado)}%
        </span>
        <span className="text-slate-600 mx-4">|</span>
        Tu Empresa:{' '}
        <span className="text-cyan-400 tabular-nums">
          {Math.round(data.tuEmpresa)}%
        </span>
      </p>

      {/* CTA único — cyan con sombra, sin gradient */}
      <button
        type="button"
        onClick={onNext}
        className="bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-medium px-8 py-3 rounded-lg text-sm transition-all duration-200 shadow-lg shadow-cyan-500/25 hover:shadow-cyan-400/30"
      >
        Calcular Impacto Financiero →
      </button>
    </div>
  )
})
