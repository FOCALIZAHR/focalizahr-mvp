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

import { X, Inbox } from 'lucide-react'
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

  return (
    <aside
      aria-label="Acumuladores del plan"
      className="h-full flex flex-col rounded-xl bg-slate-900/40 backdrop-blur-xl border border-slate-800/60 overflow-hidden"
    >
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent px-5 py-6 pb-32 space-y-8">
        {/* ── SECCIÓN 1: EN ESTE LENTE ─────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] uppercase tracking-[0.15em] text-slate-500 font-medium">
              En este lente
            </p>
            {hayDelLente && (
              <button
                onClick={onClearLente}
                className="text-[10px] text-slate-500 hover:text-slate-300 transition-colors underline-offset-2 hover:underline"
              >
                limpiar
              </button>
            )}
          </div>
          <p className="text-xs text-slate-400 font-light mb-4 leading-tight">
            {tituloLenteActivo}
          </p>

          {hayDelLente ? (
            <>
              {/* Lista de decisiones de este lente */}
              <div className="space-y-2 mb-4">
                {decisionesDelLenteActivo.map(d => (
                  <DecisionRow
                    key={decisionKey(d)}
                    decision={d}
                    onRemove={() => onRemove(decisionKey(d))}
                  />
                ))}
              </div>

              {/* Mini-resumen del lente */}
              <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-800/60">
                <MiniStat
                  label="Decisiones"
                  value={String(resumenLente.decisiones)}
                />
                <MiniStat
                  label="Ahorro / mes"
                  value={formatCLP(resumenLente.ahorroMensual)}
                  color="text-emerald-300"
                />
              </div>
            </>
          ) : (
            <div className="py-6 text-center">
              <Inbox className="w-6 h-6 text-slate-700 mx-auto mb-2" />
              <p className="text-xs text-slate-500 font-light">
                Aún no hay decisiones desde este lente.
              </p>
            </div>
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

        {/* ── SECCIÓN 2: EN TODO EL PLAN ─────────────────────────── */}
        <section>
          <p className="text-[10px] uppercase tracking-[0.15em] text-slate-500 font-medium mb-4">
            En todo el plan
          </p>

          {resumenGlobal.decisiones > 0 ? (
            <div className="space-y-3">
              <BigStat
                label="Decisiones"
                value={String(resumenGlobal.decisiones)}
                color="text-white"
              />
              <BigStat
                label="FTE liberados"
                value={resumenGlobal.fteLiberados.toLocaleString('es-CL', {
                  maximumFractionDigits: 1,
                })}
                color="text-cyan-300"
              />
              <BigStat
                label="Ahorro / mes"
                value={formatCLP(resumenGlobal.ahorroMensual)}
                color="text-emerald-300"
                hint={`${formatCLP(resumenGlobal.ahorroAnual)} anual`}
              />
              <BigStat
                label="Inversión"
                value={formatCLP(resumenGlobal.inversion)}
                color="text-amber-300"
              />
              <BigStat
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
                hint={resumenGlobal.paybackMeses === null ? 'Sin breakeven' : undefined}
              />
            </div>
          ) : (
            <div className="py-6 text-center">
              <p className="text-xs text-slate-500 font-light">
                El plan se llena mientras exploras los lentes.
              </p>
            </div>
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
  return (
    <div className="group flex items-start justify-between gap-2 p-2 rounded-md bg-slate-900/60 border border-slate-800/50 hover:border-slate-700 transition-colors">
      <div className="min-w-0 flex-1">
        <p className="text-xs text-slate-200 font-light truncate" title={decision.nombre}>
          {decision.nombre}
        </p>
        <p className="text-[10px] text-slate-500 font-light truncate">
          {decision.gerencia}
        </p>
      </div>
      <button
        onClick={onRemove}
        className="flex-shrink-0 p-1 rounded text-slate-500 hover:text-red-300 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
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

function MiniStat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <p className="text-[9px] uppercase tracking-wider text-slate-500 font-light">
        {label}
      </p>
      <p className={`text-sm font-light mt-0.5 ${color ?? 'text-slate-200'}`}>{value}</p>
    </div>
  )
}

function BigStat({
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
    <div>
      <p className="text-[10px] uppercase tracking-widest text-slate-500 font-light">
        {label}
      </p>
      <p className={`text-xl font-light leading-tight mt-0.5 ${color ?? 'text-white'}`}>
        {value}
      </p>
      {hint && (
        <p className="text-[10px] text-slate-500 font-light mt-0.5">{hint}</p>
      )}
    </div>
  )
}
