// ════════════════════════════════════════════════════════════════════════════
// LENTE NAVEGACIÓN — Paginación prev/next dentro de una familia
// src/components/efficiency/LenteNavegacion.tsx
// ════════════════════════════════════════════════════════════════════════════
// Barra sutil superior del panel activo: indica posición del lente dentro
// de su familia y permite avanzar/retroceder. Solo se renderiza cuando hay
// más de un lente en la familia.
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'

interface LenteNavegacionProps {
  /** Índice 0-based del lente activo dentro de su familia */
  index: number
  /** Total de lentes en la familia activa */
  total: number
  tituloLenteActivo: string
  onPrev: () => void
  onNext: () => void
}

export function LenteNavegacion({
  index,
  total,
  tituloLenteActivo,
  onPrev,
  onNext,
}: LenteNavegacionProps) {
  if (total < 2) return null

  return (
    <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800/40">
      <p className="text-[10px] uppercase tracking-widest text-slate-500 font-light">
        L{index + 1} de {total} · {tituloLenteActivo}
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={onPrev}
          className="p-1.5 rounded-md text-slate-500 hover:text-cyan-300 hover:bg-slate-800/50 transition-colors"
          aria-label="Lente anterior"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onNext}
          className="p-1.5 rounded-md text-slate-500 hover:text-cyan-300 hover:bg-slate-800/50 transition-colors"
          aria-label="Siguiente lente"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
