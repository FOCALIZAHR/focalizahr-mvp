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

import { ArrowRight, ArrowLeft, LayoutList } from 'lucide-react'

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
  /** Callback para volver al briefing (Nivel 2). Opcional para compat. */
  onBackToBriefing?: () => void
}

export function LenteFooterNav({
  index,
  total,
  proximoTitulo,
  anteriorTitulo,
  accentColor,
  onNext,
  onPrev,
  onBackToBriefing,
}: LenteFooterNavProps) {
  // Si solo hay un lente en la familia pero existe onBackToBriefing,
  // seguimos montando el footer para exponer el link de vuelta.
  if (total < 2 && !onBackToBriefing) return null

  return (
    <div className="mt-12 pt-6 border-t border-slate-800/50">
      {/* Link sutil "Volver al briefing" arriba del row principal */}
      {onBackToBriefing && (
        <button
          onClick={onBackToBriefing}
          className="mb-6 inline-flex items-center gap-2 text-[11px] text-slate-500 hover:text-slate-300 transition-colors font-light"
        >
          <LayoutList className="w-3.5 h-3.5" />
          <span className="uppercase tracking-widest">
            Volver al briefing
          </span>
        </button>
      )}

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
