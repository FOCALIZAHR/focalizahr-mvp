// ════════════════════════════════════════════════════════════════════════════
// LENTE FOOTER NAV — CTA grande al final del lente para avanzar
// src/components/efficiency/LenteFooterNav.tsx
// ════════════════════════════════════════════════════════════════════════════
// El CEO termina de leer el lente y encuentra el siguiente como CTA
// semántico, no como chevron invisible en el header.
//
// - Si hay siguiente lente en la familia: "Siguiente: {titulo} →"
// - Si es el último: ciclo al primero con la misma semántica
// - Además muestra link sutil hacia el anterior (si existe)
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { ArrowRight, ArrowLeft } from 'lucide-react'

interface LenteFooterNavProps {
  /** Índice 0-based del lente activo dentro de su familia */
  index: number
  /** Total de lentes en la familia */
  total: number
  /** Título del siguiente lente (para el CTA principal) */
  proximoTitulo: string
  /** Título del lente anterior (si existe) */
  anteriorTitulo?: string
  /** Color accent de la familia (para el glow del CTA) */
  accentColor: string
  onNext: () => void
  onPrev: () => void
}

export function LenteFooterNav({
  index,
  total,
  proximoTitulo,
  anteriorTitulo,
  accentColor,
  onNext,
  onPrev,
}: LenteFooterNavProps) {
  if (total < 2) return null

  return (
    <div className="mt-12 pt-6 border-t border-slate-800/50">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* Anterior (sutil, izquierda) */}
        {anteriorTitulo ? (
          <button
            onClick={onPrev}
            className="inline-flex items-center gap-2 text-xs text-slate-500 hover:text-slate-300 transition-colors font-light"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="text-[10px] uppercase tracking-widest">
              Anterior
            </span>
            <span className="text-slate-400">· {anteriorTitulo}</span>
          </button>
        ) : (
          <span />
        )}

        {/* Indicador de posición central */}
        <span className="text-[10px] uppercase tracking-widest text-slate-600 font-light order-first md:order-none w-full md:w-auto text-center">
          {index + 1} de {total}
        </span>

        {/* CTA principal: siguiente (derecha) */}
        <button
          onClick={onNext}
          className="inline-flex items-center gap-3 text-sm font-medium px-5 py-3 rounded-lg border transition-all group"
          style={{
            borderColor: `${accentColor}50`,
            background: `linear-gradient(135deg, ${accentColor}10, ${accentColor}20)`,
            color: accentColor,
            boxShadow: `0 0 18px ${accentColor}25`,
          }}
        >
          <span className="text-[10px] uppercase tracking-widest font-light text-slate-400">
            Siguiente
          </span>
          <span className="font-light text-white">{proximoTitulo}</span>
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>
    </div>
  )
}
