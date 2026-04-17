// ════════════════════════════════════════════════════════════════════════════
// L4 — CARGOS FANTASMA (pares de cargos con >70% overlap de tareas)
// src/components/efficiency/lentes/L4CargosFantasma.tsx
// ════════════════════════════════════════════════════════════════════════════
// Patrón G:
//  · Portada   → N pares detectados + $ mensual en redundancia
//  · Evidencia → cada par con overlap% + headcount + ahorro anual estimado
//  · Interacción → toggle "fusionar" por par
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { useEffect, useState } from 'react'
import { Check, Merge } from 'lucide-react'
import { LenteCard } from './LenteCard'
import type { LenteComponentProps } from './_LentePlaceholder'
import { formatCLP } from '@/lib/services/efficiency/EfficiencyNarrativeEngine'
import {
  decisionKey,
  type DecisionItem,
} from '@/lib/services/efficiency/EfficiencyCalculator'

// ════════════════════════════════════════════════════════════════════════════
// TIPOS
// ════════════════════════════════════════════════════════════════════════════

interface RedundantPair {
  socCodeA: string
  titleA: string
  socCodeB: string
  titleB: string
  overlapPercent: number
  departmentName: string
  headcountA: number
  headcountB: number
  estimatedSavings: number
}

interface L4Detalle {
  pairs: RedundantPair[]
  totalEstimatedSavings: number
  avgOverlap: number
  avgAutomation: number
}

function pairId(p: RedundantPair): string {
  return `${p.socCodeA}__${p.socCodeB}`
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE
// ════════════════════════════════════════════════════════════════════════════

export function L4CargosFantasma({
  lente,
  decisionesActuales,
  onUpsert,
  onRemove,
}: LenteComponentProps) {
  const detalle = lente.detalle as L4Detalle | null

  // Estado local: pares marcados para fusionar
  const [fusionados, setFusionados] = useState<Set<string>>(new Set())

  // Hidrata desde carrito
  useEffect(() => {
    const initial = new Set(decisionesActuales.map(d => d.id))
    setFusionados(prev => (prev.size === 0 ? initial : prev))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!lente.hayData || !detalle || detalle.pairs.length === 0) {
    return <LenteCard lente={lente} estado="vacio">{null}</LenteCard>
  }

  const handleToggle = (p: RedundantPair) => {
    const id = pairId(p)
    const isActive = fusionados.has(id)

    setFusionados(prev => {
      const next = new Set(prev)
      if (isActive) next.delete(id)
      else next.add(id)
      return next
    })

    if (isActive) {
      onRemove(decisionKey({ tipo: 'cargo', id }))
    } else {
      const item: DecisionItem = {
        id,
        lenteId: 'l4_fantasma',
        tipo: 'cargo',
        nombre: `${p.titleA} ↔ ${p.titleB}`,
        gerencia: p.departmentName,
        ahorroMes: Math.round(p.estimatedSavings / 12),
        finiquito: 0,
        fteEquivalente: 0,
        narrativa: `${lente.narrativa}\n\nFusión propuesta: ${p.titleA} ↔ ${p.titleB} — overlap ${Math.round(p.overlapPercent)}%.`,
        aprobado: false,
      }
      onUpsert(item)
    }
  }

  const pairsSorted = [...detalle.pairs].sort(
    (a, b) => b.estimatedSavings - a.estimatedSavings
  )

  return (
    <LenteCard lente={lente}>
      {/* ── Portada ─────────────────────────────────────────────── */}
      <LenteCard.Portada
        metricaProtagonista={String(detalle.pairs.length)}
        metricaLabel={`pares duplicados · ${formatCLP(detalle.totalEstimatedSavings / 12)} / mes en redundancia`}
      >
        {lente.narrativa}
      </LenteCard.Portada>

      {/* ── Evidencia + Interacción combinadas por par ─────────── */}
      <LenteCard.Evidencia titulo="Pares detectados — mismo trabajo, títulos distintos">
        <div className="space-y-3">
          {pairsSorted.map(p => {
            const id = pairId(p)
            const selected = fusionados.has(id)
            return (
              <div
                key={id}
                className={`p-4 rounded-lg border transition-colors ${
                  selected
                    ? 'bg-purple-500/5 border-purple-500/50'
                    : 'bg-slate-900/60 border-slate-800/60'
                }`}
                style={
                  selected
                    ? { boxShadow: '0 0 16px rgba(167, 139, 250, 0.2)' }
                    : undefined
                }
              >
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    {/* Pair */}
                    <p className="text-sm font-medium text-white leading-tight">
                      {p.titleA}{' '}
                      <span className="text-slate-500 mx-1">↔</span>{' '}
                      {p.titleB}
                    </p>
                    <p className="text-[11px] text-slate-500 font-light mt-1">
                      {p.departmentName}
                    </p>

                    {/* Stats */}
                    <div className="flex items-center gap-4 mt-3 text-xs text-slate-400 font-light flex-wrap">
                      <span>
                        Overlap{' '}
                        <span className="text-purple-300 font-medium">
                          {Math.round(p.overlapPercent)}%
                        </span>
                      </span>
                      <span>
                        Headcount{' '}
                        <span className="text-slate-200">
                          {p.headcountA} + {p.headcountB}
                        </span>
                      </span>
                      <span>
                        Ahorro anual{' '}
                        <span className="text-emerald-300 font-medium">
                          {formatCLP(p.estimatedSavings)}
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* Toggle fusionar */}
                  <button
                    onClick={() => handleToggle(p)}
                    className={`flex-shrink-0 inline-flex items-center gap-1.5 text-xs font-medium px-4 py-2 rounded-lg border transition-colors ${
                      selected
                        ? 'border-purple-400 bg-purple-500/20 text-purple-200 hover:bg-purple-500/30'
                        : 'border-slate-700 bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:border-slate-600'
                    }`}
                  >
                    {selected ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        Fusionar
                      </>
                    ) : (
                      <>
                        <Merge className="w-3.5 h-3.5" />
                        Proponer fusión
                      </>
                    )}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </LenteCard.Evidencia>
    </LenteCard>
  )
}
