'use client'

// ════════════════════════════════════════════════════════════════════════════
// PÁGINA 3 — TRANSICIÓN (4 variantes condicionales según exposición)
// pasos/Transicion.tsx
// ════════════════════════════════════════════════════════════════════════════
// Copy condicional por nivel de exposición empresa:
//
//   CASO A — Alta exposición (avg ≥ 50%) + hay Zona de Rescate:
//     Título dramático + cuerpo McKinsey 6 frases.
//   CASO B — Media (30-50%) + solo Potencial Aumentado dominante:
//     Tono más operativo, sin drama.
//   CASO C — Baja (<30%) + mayoría Soberanía Humana:
//     Tono validador del criterio humano.
//   CASO D — Sin datos suficientes:
//     Mensaje + sin CTA "Iniciar evaluación" (bloquea flujo).
// ════════════════════════════════════════════════════════════════════════════

import { memo } from 'react'
import { ChevronLeft, ArrowRight } from 'lucide-react'

export type TransicionVariant = 'A' | 'B' | 'C' | 'D'

interface TransicionProps {
  variant: TransicionVariant
  onNext: () => void
  onBack: () => void
}

interface VariantContent {
  title: React.ReactNode
  body: React.ReactNode
  showCTA: boolean
}

const VARIANT_CONTENT: Record<TransicionVariant, VariantContent> = {
  A: {
    title: (
      <>
        Pagas por criterio.{' '}
        <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-400 bg-clip-text text-transparent">
          Obtienes trabajo mecánico.
        </span>
      </>
    ),
    body: (
      <>
        El sistema cruzó las tareas de tu organización con la capacidad actual
        de la inteligencia artificial. Tienes nóminas altas atrapadas en
        ejecución manual. O la tecnología disponible está subutilizada. O la
        empresa está subsidiando ineficiencia a precio de mercado. El costo de
        esta inercia no es una proyección — es flujo de caja que ya estás
        pagando cada mes. La decisión es tuya.
      </>
    ),
    showCTA: true,
  },
  B: {
    title: (
      <>
        Tienes tareas que pueden{' '}
        <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-400 bg-clip-text text-transparent">
          acelerarse con IA.
        </span>
      </>
    ),
    body: (
      <>
        No es automatización total — es eficiencia con control humano.
      </>
    ),
    showCTA: true,
  },
  C: {
    title: (
      <>
        Tu organización opera con{' '}
        <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-400 bg-clip-text text-transparent">
          alto criterio humano.
        </span>
      </>
    ),
    body: (
      <>
        Hay oportunidades puntuales de asistencia IA. La decisión es tuya.
      </>
    ),
    showCTA: true,
  },
  D: {
    title: (
      <>
        Datos insuficientes para{' '}
        <span className="bg-gradient-to-r from-amber-400 to-amber-300 bg-clip-text text-transparent">
          evaluar exposición.
        </span>
      </>
    ),
    body: (
      <>
        Para diagnosticar potencial de delegación a IA, primero debes completar
        la clasificación de cargos de tu organización (Wizard de Descriptors).
        Vuelve cuando tengas al menos un cargo verificado.
      </>
    ),
    showCTA: false,
  },
}

export default memo(function Transicion({
  variant,
  onNext,
  onBack,
}: TransicionProps) {
  const content = VARIANT_CONTENT[variant]
  return (
    <div className="h-full flex flex-col items-center justify-center text-center px-8 relative overflow-y-auto">
      {/* Línea Tesla superior */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{
          background:
            'linear-gradient(90deg, transparent, #22D3EE, #A78BFA, transparent)',
        }}
      />

      {/* Botón Volver */}
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
        Simulador de Cargos · IA
      </span>

      {/* Título — más dramático en CASO A */}
      <h2
        className={
          variant === 'A'
            ? 'text-3xl md:text-4xl font-extralight text-white leading-tight max-w-2xl mb-8'
            : 'text-2xl md:text-3xl font-extralight text-white leading-tight max-w-xl mb-6'
        }
      >
        {content.title}
      </h2>

      {/* Cuerpo */}
      <p
        className={
          variant === 'A'
            ? 'text-base font-light text-slate-300 leading-relaxed max-w-2xl mb-12'
            : 'text-base font-light text-slate-400 leading-relaxed max-w-xl mb-12'
        }
      >
        {content.body}
      </p>

      {/* CTA condicional */}
      {content.showCTA && (
        <button
          type="button"
          onClick={onNext}
          className="inline-flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-medium px-8 py-3 rounded-lg text-sm transition-all duration-200 shadow-lg shadow-cyan-500/25 hover:shadow-cyan-400/30"
        >
          Iniciar evaluación
          <ArrowRight className="w-4 h-4" />
        </button>
      )}
    </div>
  )
})
