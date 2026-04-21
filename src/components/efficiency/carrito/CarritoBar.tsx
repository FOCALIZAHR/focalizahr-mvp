// ════════════════════════════════════════════════════════════════════════════
// CARRITO BAR — Resumen compacto fixed bottom (ancla psicológica del CEO)
// src/components/efficiency/carrito/CarritoBar.tsx
// ════════════════════════════════════════════════════════════════════════════
// Versión minimalista sin emojis. Siempre visible con el mismo formato:
//   "{N} Decisiones · {X} FTEs · {monto}/mes"
// Tenue si vacío, cyan cuando hay decisiones. CTA "Ver Plan →" al lado.
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { ArrowRight, RotateCcw } from 'lucide-react'
import {
  calcularResumenCarrito,
  type DecisionItem,
} from '@/lib/services/efficiency/EfficiencyCalculator'
import { formatCLP } from '@/lib/services/efficiency/EfficiencyNarrativeEngine'
import { MisPlanesBtn } from '../MisPlanesBtn'

// ════════════════════════════════════════════════════════════════════════════
// PROPS
// ════════════════════════════════════════════════════════════════════════════

interface CarritoBarProps {
  decisiones: DecisionItem[]
  /**
   * Callback para vaciar el carrito. Si se omite, el botón de vaciar
   * NO se renderiza. Útil en vistas donde la acción "vaciar" no tiene
   * semántica clara (ej. plan documento persistido).
   */
  onClear?: () => void
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE
// ════════════════════════════════════════════════════════════════════════════

export function CarritoBar({ decisiones, onClear }: CarritoBarProps) {
  const resumen = useMemo(
    () => calcularResumenCarrito(decisiones),
    [decisiones]
  )
  const vacio = resumen.decisiones === 0

  const fteTxt = resumen.fteLiberados.toLocaleString('es-CL', {
    maximumFractionDigits: 1,
  })

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800/80"
      role="region"
      aria-label="Resumen del plan"
    >
      {/* Línea Tesla cyan → purple */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{
          background:
            'linear-gradient(90deg, transparent, #22D3EE 30%, #A78BFA 70%, transparent)',
          boxShadow: '0 -2px 16px rgba(34, 211, 238, 0.3)',
        }}
        aria-hidden
      />

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-3 flex items-center gap-4 md:gap-6">
        {/* Eyebrow branding del módulo — identidad del hub que antes vivía
            en el header sticky superior. Solo visible en desktop para no
            comprimir la fila en mobile. */}
        <span className="hidden md:inline text-[10px] uppercase tracking-[0.22em] text-slate-500 font-light flex-shrink-0">
          Efficiency Intelligence
        </span>

        {/* Texto puro: N Decisiones · X FTEs · $ */}
        <p
          className={`flex-1 text-xs md:text-sm font-light flex items-baseline gap-1.5 flex-wrap ${
            vacio ? 'text-slate-500' : 'text-slate-300'
          }`}
        >
          <span>
            <span
              className={
                vacio ? 'text-slate-500' : 'text-white font-medium'
              }
            >
              {resumen.decisiones}
            </span>{' '}
            {resumen.decisiones === 1 ? 'Decisión' : 'Decisiones'}
          </span>
          <span className="text-slate-700">·</span>
          <span>
            <span
              className={
                vacio ? 'text-slate-500' : 'text-cyan-300 font-medium'
              }
            >
              {fteTxt}
            </span>{' '}
            {resumen.fteLiberados === 1 ? 'FTE' : 'FTEs'}
          </span>
          <span className="text-slate-700">·</span>
          <span
            className={
              vacio ? 'text-slate-500' : 'text-emerald-300 font-medium'
            }
          >
            {formatCLP(resumen.ahorroMensual)}
            <span
              className={`ml-1 text-[10px] font-light ${
                vacio ? 'text-slate-600' : 'text-slate-500'
              }`}
            >
              /mes
            </span>
          </span>
          {!vacio && resumen.inversion > 0 && (
            <>
              <span className="text-slate-700">·</span>
              <span>
                <span className="text-amber-300 font-medium">
                  {formatCLP(resumen.inversion)}
                </span>
                <span className="ml-1 text-[10px] font-light text-slate-500">
                  inversión
                </span>
              </span>
            </>
          )}
          {!vacio && resumen.paybackMeses !== null && (
            <>
              <span className="text-slate-700">·</span>
              <span>
                <span className="text-purple-300 font-medium">
                  {resumen.paybackMeses}m
                </span>
                <span className="ml-1 text-[10px] font-light text-slate-500">
                  payback
                </span>
              </span>
            </>
          )}
        </p>

        {/* Acciones */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {onClear && !vacio && (
            <button
              onClick={onClear}
              className="inline-flex items-center gap-1.5 text-xs font-medium p-2 md:px-3 md:py-2 rounded-lg border border-slate-700 bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:border-slate-600 transition-colors"
              aria-label="Vaciar carrito"
              title="Vaciar carrito del hub"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
          {/* Mis planes — antes vivía en el header sticky, ahora junto al CTA */}
          <MisPlanesBtn />
          {vacio ? (
            <button
              disabled
              className="inline-flex items-center gap-2 text-xs font-light px-4 py-2 rounded-lg border border-slate-800 bg-transparent text-slate-600 cursor-not-allowed"
            >
              Ver Plan
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <Link
              href="/dashboard/efficiency/plan/nuevo"
              className="inline-flex items-center gap-2 text-xs font-medium px-4 py-2 rounded-lg border border-cyan-400/50 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-200 hover:text-white hover:border-cyan-300 hover:from-cyan-500/30 hover:to-purple-500/30 transition-all"
              style={{ boxShadow: '0 0 14px rgba(34, 211, 238, 0.25)' }}
            >
              Ver Plan
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
