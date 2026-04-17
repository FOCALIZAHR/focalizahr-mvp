// ════════════════════════════════════════════════════════════════════════════
// L5 — BRECHA DE PRODUCTIVIDAD (prescindibles por valor relativo, score<40)
// src/components/efficiency/lentes/L5BrechaProductividad.tsx
// ════════════════════════════════════════════════════════════════════════════
// Patrón G:
//  · Portada   → $X excedente mensual + N personas prescindibles
//  · Evidencia → radiografía por persona:
//                retentionScore desglosado + roleFit + metas + exposición
//                finiquito hoy / +6m / +12m (reloj de desvinculación)
//  · Interacción → selección persona + timing (hoy / +3m / +6m)
//
// Regla protección: isIncumbentOfCriticalPosition O mobilityQuadrant===SUCESOR_NATURAL
// → persona no aparece en la lista (el motor ya la excluye del tier 'prescindible').
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { useEffect, useMemo, useState } from 'react'
import { Calendar } from 'lucide-react'
import { LenteCard } from './LenteCard'
import type { LenteComponentProps } from './_LentePlaceholder'
import { formatCLP } from '@/lib/services/efficiency/EfficiencyNarrativeEngine'
import {
  decisionKey,
  type DecisionItem,
} from '@/lib/services/efficiency/EfficiencyCalculator'
import {
  calculateFiniquitoConTopeCustomUF,
  UF_VALUE_CLP,
} from '@/lib/utils/TalentFinancialFormulas'

// ════════════════════════════════════════════════════════════════════════════
// TIPOS
// ════════════════════════════════════════════════════════════════════════════

interface RetentionEntry {
  employeeId: string
  employeeName: string
  position: string
  departmentName: string
  retentionScore: number
  observedExposure: number
  roleFitScore: number
  isCriticalPosition: boolean
  tier: string
  acotadoGroup: string | null
  standardCategory: string | null
  metasCompliance: number | null
  salary: number
  finiquitoToday: number | null
  tenureMonths: number
  nineBoxPosition: string | null
  automationShare: number
  augmentationShare: number
  potentialEngagement: number | null
  focalizaScore: number | null
  riskQuadrant: string | null
  mobilityQuadrant: string | null
  potentialAbility: number | null
}

interface L5Detalle {
  persons: RetentionEntry[]
  affectedCount: number
  total: number
  gapOriginal?: number
  bySegment?: unknown
}

type Timing = 'hoy' | 'q1' | 'q2'  // hoy / +3m / +6m

const TIMING_LABELS: Record<Timing, string> = {
  hoy: 'Actuar hoy',
  q1: 'En 3 meses',
  q2: 'En 6 meses',
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE
// ════════════════════════════════════════════════════════════════════════════

export function L5BrechaProductividad({
  lente,
  decisionesActuales,
  onUpsert,
  onRemove,
  gerenciasExcluidas,
}: LenteComponentProps) {
  const detalle = lente.detalle as L5Detalle | null

  // Estado local: timing elegido por persona (null = no seleccionada)
  const [timingByPerson, setTimingByPerson] = useState<Record<string, Timing | null>>({})

  useEffect(() => {
    const initial: Record<string, Timing | null> = {}
    for (const d of decisionesActuales) {
      const match = d.nombre.match(/· (hoy|q1|q2)$/)
      if (match) initial[d.id] = match[1] as Timing
    }
    setTimingByPerson(prev => (Object.keys(prev).length === 0 ? initial : prev))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const personsSorted = useMemo(() => {
    if (!detalle?.persons) return []
    return [...detalle.persons]
      .filter(p => !gerenciasExcluidas.has(p.departmentName)) // filtro suave por nombre
      .sort((a, b) => a.retentionScore - b.retentionScore) // peor score primero
  }, [detalle, gerenciasExcluidas])

  if (!lente.hayData || !detalle || personsSorted.length === 0) {
    return <LenteCard lente={lente} estado="vacio">{null}</LenteCard>
  }

  const handleTiming = (p: RetentionEntry, timing: Timing) => {
    const current = timingByPerson[p.employeeId]
    const isToggleOff = current === timing

    setTimingByPerson(prev => ({
      ...prev,
      [p.employeeId]: isToggleOff ? null : timing,
    }))

    if (isToggleOff) {
      onRemove(decisionKey({ tipo: 'persona', id: p.employeeId }))
      return
    }

    const tenureDelta = timing === 'hoy' ? 0 : timing === 'q1' ? 3 : 6
    const finiquitoEnTiming = calculateFiniquitoConTopeCustomUF(
      p.salary,
      p.tenureMonths + tenureDelta,
      UF_VALUE_CLP
    )

    const item: DecisionItem = {
      id: p.employeeId,
      lenteId: 'l5_brecha',
      tipo: 'persona',
      nombre: `${p.employeeName} · ${timing}`,
      gerencia: p.departmentName,
      ahorroMes: p.salary,
      finiquito: finiquitoEnTiming,
      fteEquivalente: 1,
      narrativa: `${lente.narrativa}\n\nDecisión: transición ${TIMING_LABELS[timing].toLowerCase()} · retentionScore ${Math.round(p.retentionScore)} · finiquito ${formatCLP(finiquitoEnTiming)}.`,
      aprobado: false,
    }
    onUpsert(item)
  }

  return (
    <LenteCard lente={lente}>
      {/* ── Portada ─────────────────────────────────────────────── */}
      <LenteCard.Portada
        metricaProtagonista={formatCLP(detalle.total)}
        metricaLabel={`salario mensual sin rendimiento equivalente · ${detalle.affectedCount} personas`}
      >
        {lente.narrativa}
      </LenteCard.Portada>

      {/* ── Evidencia + Interacción combinadas (radiografía por persona) ── */}
      <LenteCard.Evidencia titulo="Radiografía por persona — el sistema cruzó metas, role fit y adaptabilidad">
        <div className="space-y-4">
          {personsSorted.map(p => {
            const selected = timingByPerson[p.employeeId] ?? null
            const metas = p.metasCompliance ?? 0
            const roleFit = p.roleFitScore
            // Adaptabilidad aproximada desde potentialAbility (1-3 → 33/66/99)
            const adaptabilidad =
              p.potentialAbility !== null ? p.potentialAbility * 33.33 : 0

            // Finiquitos progresivos (cálculo frontend — funciones puras)
            const finiquitoHoy =
              p.finiquitoToday ??
              calculateFiniquitoConTopeCustomUF(
                p.salary,
                p.tenureMonths,
                UF_VALUE_CLP
              )
            const finiquitoQ1 = calculateFiniquitoConTopeCustomUF(
              p.salary,
              p.tenureMonths + 3,
              UF_VALUE_CLP
            )
            const finiquitoQ2 = calculateFiniquitoConTopeCustomUF(
              p.salary,
              p.tenureMonths + 6,
              UF_VALUE_CLP
            )
            const finiquitoQ4 = calculateFiniquitoConTopeCustomUF(
              p.salary,
              p.tenureMonths + 12,
              UF_VALUE_CLP
            )
            const costoEspera12 = finiquitoQ4 - finiquitoHoy

            return (
              <div
                key={p.employeeId}
                className="p-4 rounded-lg bg-slate-900/60 border border-slate-800/60"
              >
                {/* Header persona */}
                <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
                  <div>
                    <p className="text-sm font-medium text-white">
                      {p.employeeName}
                    </p>
                    <p className="text-xs text-slate-400 font-light mt-0.5">
                      {p.position} · {p.departmentName}
                    </p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className="text-[9px] uppercase tracking-widest text-slate-500">
                      Retention Score
                    </p>
                    <p className="text-xl font-light text-red-300 leading-tight">
                      {Math.round(p.retentionScore)}
                    </p>
                  </div>
                </div>

                {/* Desglose retentionScore (visual, con peso) */}
                <div className="space-y-1.5 mb-4">
                  <ScoreBar
                    label="Metas"
                    value={metas}
                    peso={0.4}
                    color="#22D3EE"
                  />
                  <ScoreBar
                    label="Role Fit"
                    value={roleFit}
                    peso={0.3}
                    color="#A78BFA"
                  />
                  <ScoreBar
                    label="Adaptabilidad"
                    value={adaptabilidad}
                    peso={0.3}
                    color="#F59E0B"
                  />
                </div>

                {/* Finiquito reloj */}
                <div className="grid grid-cols-4 gap-2 pt-3 border-t border-slate-800/60 mb-4">
                  <FiniquitoCell label="Hoy" value={finiquitoHoy} highlight />
                  <FiniquitoCell label="+3m" value={finiquitoQ1} />
                  <FiniquitoCell label="+6m" value={finiquitoQ2} />
                  <FiniquitoCell
                    label="+12m"
                    value={finiquitoQ4}
                    delta={costoEspera12}
                  />
                </div>

                {/* Interacción: timing */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 mr-1">
                    Timing
                  </span>
                  {(['hoy', 'q1', 'q2'] as Timing[]).map(t => {
                    const isSelected = selected === t
                    return (
                      <button
                        key={t}
                        onClick={() => handleTiming(p, t)}
                        className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md border transition-colors ${
                          isSelected
                            ? 'border-amber-400 bg-amber-500/20 text-amber-200'
                            : 'border-slate-700 bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:border-slate-600'
                        }`}
                      >
                        <Calendar className="w-3 h-3" />
                        {TIMING_LABELS[t]}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </LenteCard.Evidencia>
    </LenteCard>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// SCORE BAR — visual con peso y valor
// ════════════════════════════════════════════════════════════════════════════

function ScoreBar({
  label,
  value,
  peso,
  color,
}: {
  label: string
  value: number
  peso: number
  color: string
}) {
  const pct = Math.max(0, Math.min(100, value))
  return (
    <div className="flex items-center gap-3">
      <span className="text-[11px] text-slate-400 font-light w-24 flex-shrink-0">
        {label}
      </span>
      <div className="flex-1 h-1.5 rounded-full bg-slate-800 overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{
            width: `${pct}%`,
            background: color,
          }}
        />
      </div>
      <span className="text-[11px] font-light text-slate-300 w-20 text-right flex-shrink-0">
        {Math.round(pct)}% <span className="text-slate-500">× {peso}</span>
      </span>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// FINIQUITO CELL
// ════════════════════════════════════════════════════════════════════════════

function FiniquitoCell({
  label,
  value,
  highlight,
  delta,
}: {
  label: string
  value: number
  highlight?: boolean
  delta?: number
}) {
  return (
    <div
      className={`p-2 rounded-md ${
        highlight
          ? 'bg-emerald-500/10 border border-emerald-500/30'
          : 'bg-slate-900/50 border border-slate-800/50'
      }`}
    >
      <p className="text-[9px] uppercase tracking-wider text-slate-500">
        {label}
      </p>
      <p
        className={`text-xs font-medium mt-0.5 ${
          highlight ? 'text-emerald-300' : 'text-slate-200'
        }`}
      >
        {formatCLP(value)}
      </p>
      {delta !== undefined && delta > 0 && (
        <p className="text-[9px] text-red-300 font-light mt-0.5">
          ▲ {formatCLP(delta)}
        </p>
      )}
    </div>
  )
}
