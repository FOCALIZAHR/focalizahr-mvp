// ════════════════════════════════════════════════════════════════════════════
// PERFORMANCE RESULT CARD - FocalizaHR Premium Design
// src/components/performance/PerformanceResultCard.tsx
// ════════════════════════════════════════════════════════════════════════════
// Filosofía de Diseño:
// - Clasificación = PROTAGONISTA (insight)
// - Score = Contexto (dato de respaldo)
// - Línea Tesla = Color dinámico según clasificación
// - Barra de progreso = Visual aid inmediato
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { memo } from 'react'
import { getPerformanceClassification } from '@/config/performanceClassification'

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

export interface PerformanceResultCardProps {
  /** Score promedio en escala 0-100 (normalizedScore del API) */
  score: number
  /** Mostrar card compacta o expandida */
  variant?: 'compact' | 'expanded'
  /** Clase CSS adicional */
  className?: string
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ════════════════════════════════════════════════════════════════════════════

export const PerformanceResultCard = memo(function PerformanceResultCard({
  score,
  variant = 'compact',
  className = ''
}: PerformanceResultCardProps) {
  // Convertir 0-100 → 1-5
  const scoreOn5 = score / 20
  const classification = getPerformanceClassification(scoreOn5)
  const barWidth = (scoreOn5 / 5) * 100

  // ══════════════════════════════════════════════════════════════════════════
  // VARIANT: COMPACT (para uso en headers, sidebars)
  // ══════════════════════════════════════════════════════════════════════════
  if (variant === 'compact') {
    return (
      <div
        className={`relative rounded-xl border bg-slate-800/60 ${className}`}
        style={{ borderColor: `${classification.color}4D` }}
      >
        {/* Línea Tesla dinámica */}
        <div
          className="absolute top-0 left-0 right-0 h-px rounded-t-xl"
          style={{
            background: `linear-gradient(90deg, transparent 10%, ${classification.color} 50%, transparent 90%)`
          }}
        />

        <div className="p-4">
          {/* Label */}
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: `${classification.color}33` }} />
            Resultado
          </p>

          {/* Score HERO + Clasificación */}
          <div className="text-center mb-2">
            <div className="text-2xl font-light text-white tabular-nums">
              {scoreOn5.toFixed(1)}
            </div>
            <div
              className="text-xs font-medium mt-0.5"
              style={{ color: classification.color }}
            >
              {classification.label}
            </div>
          </div>

          {/* Barra */}
          <div className="h-1.5 bg-slate-700/50 rounded-full overflow-hidden mb-1.5">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${barWidth}%`,
                background: `linear-gradient(90deg, ${classification.color}80, ${classification.color})`
              }}
            />
          </div>

          <div className="text-[10px] text-slate-500 text-center">
            Escala 1-5
          </div>
        </div>
      </div>
    )
  }

  // ══════════════════════════════════════════════════════════════════════════
  // VARIANT: EXPANDED (para uso en cards standalone)
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className={`relative fhr-card p-5 ${className}`}>
      {/* Línea Tesla dinámica */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background: `linear-gradient(90deg, transparent 10%, ${classification.color} 50%, transparent 90%)`
        }}
      />

      {/* Label */}
      <p className="text-xs uppercase tracking-wider text-slate-500 mb-3">
        Resultado
      </p>

      {/* Clasificación - PROTAGONISTA */}
      <p
        className="text-lg font-medium mb-4"
        style={{ color: classification.color }}
      >
        {classification.label}
      </p>

      {/* Barra + Nota */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2.5 bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${barWidth}%`,
              background: `linear-gradient(90deg, ${classification.color}80, ${classification.color})`
            }}
          />
        </div>
        <span className="text-base text-slate-300 font-medium tabular-nums">
          {scoreOn5.toFixed(1)}
        </span>
      </div>

      {/* Escala de referencia */}
      <div className="flex justify-between mt-2 text-xs text-slate-600">
        <span>0</span>
        <span>5</span>
      </div>
    </div>
  )
})

export default PerformanceResultCard
