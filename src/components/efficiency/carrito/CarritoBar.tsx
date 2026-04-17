// ════════════════════════════════════════════════════════════════════════════
// CARRITO BAR — Resumen compacto fixed bottom (ancla psicológica del CEO)
// src/components/efficiency/carrito/CarritoBar.tsx
// ════════════════════════════════════════════════════════════════════════════
// Versión simplificada: las métricas detalladas viven en PanelAcumuladores.
// Esta barra es un resumen compacto siempre visible con CTA "Ver Plan →".
//
// - position: fixed; bottom: 0 — NUNCA desaparece
// - z-40 para no pisar modales (z-45+)
// - Tesla line superior cyan → purple
// - Estado vacío: mensaje guía + CTA deshabilitado
// - Estado con decisiones: resumen 1 línea + CTA habilitado
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { ArrowRight, RotateCcw, ShoppingBag } from 'lucide-react'
import {
  calcularResumenCarrito,
  type DecisionItem,
} from '@/lib/services/efficiency/EfficiencyCalculator'
import { formatCLP } from '@/lib/services/efficiency/EfficiencyNarrativeEngine'

// ════════════════════════════════════════════════════════════════════════════
// PROPS
// ════════════════════════════════════════════════════════════════════════════

interface CarritoBarProps {
  decisiones: DecisionItem[]
  onClear: () => void
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
        {vacio ? (
          <>
            <ShoppingBag className="w-4 h-4 text-slate-600 flex-shrink-0" />
            <p className="flex-1 text-xs md:text-sm text-slate-400 font-light">
              Agrega decisiones desde los lentes para construir tu{' '}
              <span className="text-cyan-300">Plan de Eficiencia</span>.
            </p>
            <button
              disabled
              className="flex-shrink-0 inline-flex items-center gap-2 text-xs font-medium px-4 py-2 rounded-lg border border-slate-700 bg-slate-800/50 text-slate-500 cursor-not-allowed"
            >
              Ver Plan
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </>
        ) : (
          <>
            {/* Icono + N decisiones */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="w-7 h-7 rounded-full bg-cyan-500/15 border border-cyan-500/40 flex items-center justify-center">
                <span className="text-[11px] font-medium text-cyan-300">
                  {resumen.decisiones}
                </span>
              </div>
              <span className="text-xs text-slate-400 font-light hidden md:inline">
                {resumen.decisiones === 1 ? 'decisión' : 'decisiones'}
              </span>
            </div>

            {/* Separador vertical */}
            <div className="hidden md:block w-px h-6 bg-slate-800" aria-hidden />

            {/* Métricas compactas inline */}
            <div className="flex-1 flex items-baseline gap-4 md:gap-6 overflow-x-auto scrollbar-hide">
              <InlineStat
                label="FTE"
                value={resumen.fteLiberados.toLocaleString('es-CL', {
                  maximumFractionDigits: 1,
                })}
                color="text-cyan-300"
              />
              <InlineStat
                label="Ahorro/mes"
                value={formatCLP(resumen.ahorroMensual)}
                color="text-emerald-300"
              />
              <InlineStat
                label="Inversión"
                value={formatCLP(resumen.inversion)}
                color="text-amber-300"
              />
              <InlineStat
                label="Payback"
                value={
                  resumen.paybackMeses === null
                    ? '∞'
                    : `${resumen.paybackMeses}m`
                }
                color={
                  resumen.paybackMeses === null
                    ? 'text-slate-400'
                    : 'text-purple-300'
                }
              />
            </div>

            {/* Acciones */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={onClear}
                className="inline-flex items-center gap-1.5 text-xs font-medium p-2 md:px-3 md:py-2 rounded-lg border border-slate-700 bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:border-slate-600 transition-colors"
                aria-label="Vaciar carrito"
                title="Vaciar plan"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <Link
                href="/dashboard/efficiency/plan/nuevo"
                className="inline-flex items-center gap-2 text-xs font-medium px-4 py-2 rounded-lg border border-cyan-400/50 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-200 hover:text-white hover:border-cyan-300 hover:from-cyan-500/30 hover:to-purple-500/30 transition-all"
                style={{ boxShadow: '0 0 14px rgba(34, 211, 238, 0.25)' }}
              >
                Ver Plan
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// INLINE STAT
// ════════════════════════════════════════════════════════════════════════════

function InlineStat({
  label,
  value,
  color,
}: {
  label: string
  value: string
  color: string
}) {
  return (
    <div className="flex items-baseline gap-1.5 whitespace-nowrap">
      <span className="text-[10px] uppercase tracking-wider text-slate-500 font-light">
        {label}
      </span>
      <span className={`text-sm font-light ${color}`}>{value}</span>
    </div>
  )
}
