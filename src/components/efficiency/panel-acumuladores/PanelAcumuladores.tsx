// ════════════════════════════════════════════════════════════════════════════
// PANEL ACUMULADORES — Panel derecho 30% con contexto del lente + plan global
// src/components/efficiency/panel-acumuladores/PanelAcumuladores.tsx
// ════════════════════════════════════════════════════════════════════════════
// Dos secciones:
//  · EN ESTE LENTE    → decisiones del lente activo + mini-resumen contextual
//  · EN TODO EL PLAN  → resumen global (N, FTE, ahorro, inversión, payback)
//
// No captura decisiones. Solo refleja el state. La captura va en los L*.
// Mantiene scroll interno con pb-32 para no tapar el CarritoBar fixed.
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { X } from 'lucide-react'
import {
  calcularResumenCarrito,
  type DecisionItem,
  type ResumenCarrito,
  decisionKey,
} from '@/lib/services/efficiency/EfficiencyCalculator'
import { formatCLP } from '@/lib/services/efficiency/EfficiencyNarrativeEngine'
import type { LenteId } from '@/lib/services/efficiency/EfficiencyNarrativeEngine'

// ════════════════════════════════════════════════════════════════════════════
// PROPS
// ════════════════════════════════════════════════════════════════════════════

interface PanelAcumuladoresProps {
  /** Título del lente activo (para el header de la sección "EN ESTE LENTE") */
  tituloLenteActivo: string
  /** Decisiones del lente activo (ya filtradas por el hook) */
  decisionesDelLenteActivo: DecisionItem[]
  /** Resumen global (todos los lentes) */
  resumenGlobal: ResumenCarrito
  /** Remove by key */
  onRemove: (key: string) => void
  /** Limpiar todas las decisiones del lente activo */
  onClearLente: () => void
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE
// ════════════════════════════════════════════════════════════════════════════

export function PanelAcumuladores({
  tituloLenteActivo,
  decisionesDelLenteActivo,
  resumenGlobal,
  onRemove,
  onClearLente,
}: PanelAcumuladoresProps) {
  const resumenLente = calcularResumenCarrito(decisionesDelLenteActivo)
  const hayDelLente = decisionesDelLenteActivo.length > 0

  const sinNadaEnPlan = !hayDelLente && resumenGlobal.decisiones === 0

  // Estado inicial elegante: sin bordes agresivos, centrado vertical
  if (sinNadaEnPlan) {
    return (
      <aside
        aria-label="Acumuladores del plan"
        className="h-full flex flex-col items-center justify-center px-6"
      >
        <p className="text-sm font-light text-slate-500 text-center max-w-[18ch] leading-relaxed">
          El plan espera tu primera decisión.
        </p>
      </aside>
    )
  }

  return (
    <aside
      aria-label="Acumuladores del plan"
      className="h-full flex flex-col rounded-xl bg-slate-900/30 backdrop-blur-xl border border-slate-800/40 overflow-hidden"
    >
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent px-5 py-6 pb-32 space-y-6">
        {/* ── SECCIÓN 1: decisiones del lente activo ──────────────
            Sin label duplicado: el título del lente ya está en el
            panel activo y en el rail. Mostrar solo la lista +
            mini-resumen del lente, o el empty state narrativo. */}
        <section>
          {hayDelLente ? (
            <>
              {/* Header sutil con contador + acción limpiar */}
              <div className="flex items-baseline justify-between mb-2.5">
                <p className="text-xs text-slate-400 font-light">
                  {decisionesDelLenteActivo.length}{' '}
                  {decisionesDelLenteActivo.length === 1
                    ? 'decisión en este lente'
                    : 'decisiones en este lente'}
                </p>
                <button
                  onClick={onClearLente}
                  className="text-[10px] text-slate-500 hover:text-slate-300 transition-colors underline-offset-2 hover:underline"
                >
                  limpiar
                </button>
              </div>

              <div className="space-y-1 mb-3">
                {decisionesDelLenteActivo.map(d => (
                  <DecisionRow
                    key={decisionKey(d)}
                    decision={d}
                    onRemove={() => onRemove(decisionKey(d))}
                  />
                ))}
              </div>

              {/* Mini-resumen del lente */}
              <div className="flex items-baseline justify-between pt-2 border-t border-slate-800/60">
                <span className="text-[10px] uppercase tracking-wider text-slate-500 font-light">
                  Subtotal lente
                </span>
                <span className="text-sm font-light text-emerald-300">
                  {formatCLP(resumenLente.ahorroMensual)}
                  <span className="text-[10px] text-slate-500 font-light ml-1">
                    /mes
                  </span>
                </span>
              </div>
            </>
          ) : (
            <p className="text-xs text-slate-500 font-light leading-relaxed">
              El plan espera tu primera decisión.
            </p>
          )}
        </section>

        {/* Divider decorativo */}
        <div
          className="h-px"
          style={{
            background:
              'linear-gradient(90deg, transparent, rgba(148, 163, 184, 0.15), transparent)',
          }}
          aria-hidden
        />

        {/* ── SECCIÓN 2: EN TODO EL PLAN (compacto) ──────────── */}
        <section>
          <p className="text-[10px] uppercase tracking-[0.15em] text-slate-500 font-medium mb-3">
            En todo el plan
          </p>

          {resumenGlobal.decisiones > 0 ? (
            <div className="space-y-1.5">
              <StatRow
                label="Decisiones"
                value={String(resumenGlobal.decisiones)}
              />
              <StatRow
                label="FTE liberados"
                value={resumenGlobal.fteLiberados.toLocaleString('es-CL', {
                  maximumFractionDigits: 1,
                })}
                color="text-cyan-300"
              />
              <StatRow
                label="Ahorro / mes"
                value={formatCLP(resumenGlobal.ahorroMensual)}
                color="text-emerald-300"
                hint={formatCLP(resumenGlobal.ahorroAnual) + ' anual'}
              />
              <StatRow
                label="Inversión"
                value={formatCLP(resumenGlobal.inversion)}
                color="text-amber-300"
              />
              <StatRow
                label="Payback"
                value={
                  resumenGlobal.paybackMeses === null
                    ? '∞'
                    : `${resumenGlobal.paybackMeses} ${
                        resumenGlobal.paybackMeses === 1 ? 'mes' : 'meses'
                      }`
                }
                color={
                  resumenGlobal.paybackMeses === null
                    ? 'text-slate-400'
                    : 'text-purple-300'
                }
                hint={
                  resumenGlobal.paybackMeses === null ? 'sin breakeven' : undefined
                }
              />
            </div>
          ) : (
            <p className="text-xs text-slate-500 font-light">
              El plan se llena mientras exploras los lentes.
            </p>
          )}
        </section>
      </div>
    </aside>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// DECISION ROW
// ════════════════════════════════════════════════════════════════════════════

function DecisionRow({
  decision,
  onRemove,
}: {
  decision: DecisionItem
  onRemove: () => void
}) {
  // Impacto relevante según tipo: persona → ahorro mes; cargo → ahorro;
  // area → ahorro. En todos los casos mostramos ahorroMes por uniformidad.
  const impacto = decision.ahorroMes > 0 ? formatCLP(decision.ahorroMes) : null

  return (
    <div className="group flex items-center justify-between gap-2 py-1 px-2 -mx-2 rounded-md hover:bg-slate-900/60 transition-colors">
      <div className="min-w-0 flex-1 flex items-baseline gap-1.5">
        <p
          className="text-xs text-slate-200 font-light truncate"
          title={`${decision.nombre} · ${decision.gerencia}`}
        >
          {decision.nombre}
        </p>
        {impacto && (
          <>
            <span className="text-slate-700 flex-shrink-0">·</span>
            <span className="text-[11px] text-emerald-300/90 font-light whitespace-nowrap flex-shrink-0">
              {impacto}
            </span>
          </>
        )}
      </div>
      <button
        onClick={onRemove}
        className="flex-shrink-0 p-0.5 rounded text-slate-600 hover:text-red-300 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
        aria-label="Quitar del plan"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// STAT HELPERS
// ════════════════════════════════════════════════════════════════════════════

/** Row compacta con label izquierda y valor a la derecha */
function StatRow({
  label,
  value,
  color,
  hint,
}: {
  label: string
  value: string
  color?: string
  hint?: string
}) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className="text-[11px] text-slate-400 font-light">{label}</span>
      <span className="text-right">
        <span className={`text-sm font-light ${color ?? 'text-white'}`}>
          {value}
        </span>
        {hint && (
          <span className="block text-[10px] text-slate-500 font-light leading-tight mt-0.5">
            {hint}
          </span>
        )}
      </span>
    </div>
  )
}
