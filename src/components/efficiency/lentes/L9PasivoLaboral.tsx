// ════════════════════════════════════════════════════════════════════════════
// L9 — PASIVO LABORAL (costo completo de esperar — gatillo de acción HOY)
// src/components/efficiency/lentes/L9PasivoLaboral.tsx
// ════════════════════════════════════════════════════════════════════════════
// Patrón G:
//  · Portada   → $X costo de esperar (PROTAGONISTA de toda la UI)
//  · Evidencia → por persona, costo completo del período:
//    Finiquito en timing + Salario acumulado + Productividad reducida
//    → COSTO TOTAL DE ESPERAR vs actuar hoy = Diferencia real
//  · Interacción → selector timing (hoy / +3m / +6m)
//
// Alert aniversario ámbar: si el aniversario laboral cae en próximos 90 días,
// mostrar advertencia específica con el costo adicional de esperar.
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { useEffect, useMemo, useState } from 'react'
import { Calendar, Clock, AlertTriangle } from 'lucide-react'
import { LenteCard } from './LenteCard'
import type { LenteComponentProps } from './_LentePlaceholder'
import { formatCLP } from '@/lib/services/efficiency/EfficiencyNarrativeEngine'
import {
  decisionKey,
  type DecisionItem,
} from '@/lib/services/efficiency/EfficiencyCalculator'
import {
  calculateFiniquitoConTopeCustomUF,
  calculateMonthsUntilNextYear,
  UF_VALUE_CLP,
} from '@/lib/utils/TalentFinancialFormulas'

// ════════════════════════════════════════════════════════════════════════════
// TIPOS
// ════════════════════════════════════════════════════════════════════════════

interface PersonL9 {
  employeeId: string
  employeeName: string
  position: string
  departmentName: string
  salary: number
  tenureMonths: number
  finiquitoHoy: number
  finiquitoQ2: number
  finiquitoQ4: number
  costoEspera: number
}

interface L9Detalle {
  persons: PersonL9[]
  totalHoy: number
  totalQ2: number
  totalQ4: number
  costoEsperaTotal: number
  ahorroMensual: number
  paybackMeses: number | null
}

type Timing = 'hoy' | 'q1' | 'q2'

const TIMING_LABELS: Record<Timing, string> = {
  hoy: 'Actuar hoy',
  q1: 'En 3 meses',
  q2: 'En 6 meses',
}

const TIMING_MESES: Record<Timing, number> = {
  hoy: 0,
  q1: 3,
  q2: 6,
}

/** Productividad reducida: heurística 20% del salario mensual de prescindibles */
const PRODUCTIVIDAD_REDUCIDA_FACTOR = 0.2

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE
// ════════════════════════════════════════════════════════════════════════════

export function L9PasivoLaboral({
  lente,
  decisionesActuales,
  onUpsert,
  onRemove,
}: LenteComponentProps) {
  const detalle = lente.detalle as L9Detalle | null

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
    return [...detalle.persons].sort((a, b) => b.costoEspera - a.costoEspera)
  }, [detalle])

  if (!lente.hayData || !detalle || personsSorted.length === 0) {
    return <LenteCard lente={lente} estado="vacio">{null}</LenteCard>
  }

  const handleTiming = (p: PersonL9, timing: Timing) => {
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

    const meses = TIMING_MESES[timing]
    const finiquitoTiming = calcularFiniquitoTiming(p, meses)
    const costoPeriodo = calcularCostoPeriodo(p, meses)

    const item: DecisionItem = {
      id: p.employeeId,
      lenteId: 'l9_pasivo',
      tipo: 'persona',
      nombre: `${p.employeeName} · ${timing}`,
      gerencia: p.departmentName,
      ahorroMes: p.salary,
      finiquito: finiquitoTiming,
      fteEquivalente: 1,
      narrativa: `${lente.narrativa}\n\nTiming elegido: ${TIMING_LABELS[timing]}. Finiquito ${formatCLP(finiquitoTiming)} · costo total del período ${formatCLP(costoPeriodo)}.`,
      aprobado: false,
    }
    onUpsert(item)
  }

  return (
    <LenteCard lente={lente}>
      {/* ── Portada: costoEspera es PROTAGONISTA de la UI ──────── */}
      <LenteCard.Portada
        metricaProtagonista={formatCLP(detalle.costoEsperaTotal)}
        metricaLabel="costo adicional de esperar 12 meses · vs actuar hoy"
      >
        {lente.narrativa}
      </LenteCard.Portada>

      {/* ── Evidencia + Interacción por persona ──────────────── */}
      <LenteCard.Evidencia titulo="Costo completo del período de espera · por persona">
        <div className="space-y-4">
          {personsSorted.map(p => {
            const selected = timingByPerson[p.employeeId] ?? null
            const mesesAniversario = calculateMonthsUntilNextYear(p.tenureMonths)
            const aniversarioProximo =
              mesesAniversario !== null && mesesAniversario <= 3

            const costoEspera6m = calcularCostoPeriodo(p, 6)
            const finiq6m = calcularFiniquitoTiming(p, 6)
            const salario6m = p.salary * 6
            const productividadReducida6m =
              p.salary * PRODUCTIVIDAD_REDUCIDA_FACTOR * 6
            const diferencia6m = costoEspera6m - p.finiquitoHoy

            return (
              <div
                key={p.employeeId}
                className="p-4 rounded-lg bg-slate-900/60 border border-slate-800/60"
              >
                {/* Header persona */}
                <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
                  <div>
                    <p className="text-sm font-medium text-white">
                      {p.employeeName}
                    </p>
                    <p className="text-xs text-slate-400 font-light mt-0.5">
                      {p.position} · {p.departmentName} ·{' '}
                      <span className="text-slate-500">
                        {Math.floor(p.tenureMonths / 12)}y{' '}
                        {p.tenureMonths % 12}m
                      </span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] uppercase tracking-widest text-slate-500">
                      Finiquito hoy
                    </p>
                    <p className="text-sm font-medium text-emerald-300">
                      {formatCLP(p.finiquitoHoy)}
                    </p>
                  </div>
                </div>

                {/* Alert aniversario */}
                {aniversarioProximo && (
                  <div
                    className="flex items-start gap-2 p-2.5 rounded-md mb-3"
                    style={{
                      background: 'rgba(245, 158, 11, 0.08)',
                      border: '1px solid rgba(245, 158, 11, 0.35)',
                    }}
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                    <p className="text-[11px] text-amber-200 font-light leading-snug">
                      <span className="font-medium">Aniversario en{' '}
                      {mesesAniversario} {mesesAniversario === 1 ? 'mes' : 'meses'}</span>
                      . Actuar antes evita aprox.{' '}
                      {formatCLP(p.salary)} adicional en indemnización.
                    </p>
                  </div>
                )}

                {/* Desglose costo esperar 6 meses */}
                <div className="space-y-1.5 mb-4 text-xs font-light">
                  <CostoRow
                    label="Finiquito en 6 meses"
                    value={formatCLP(finiq6m)}
                  />
                  <CostoRow
                    label="Salario acumulado (6 meses)"
                    value={formatCLP(salario6m)}
                  />
                  <CostoRow
                    label="Productividad reducida (estimado)"
                    value={formatCLP(productividadReducida6m)}
                  />
                  <div className="border-t border-slate-800/80 my-1" />
                  <CostoRow
                    label="Costo total esperar 6m"
                    value={formatCLP(costoEspera6m)}
                    bold
                    color="text-red-300"
                  />
                  <CostoRow
                    label="vs. actuar hoy"
                    value={formatCLP(p.finiquitoHoy)}
                    color="text-emerald-300"
                  />
                  <CostoRow
                    label="Diferencia real"
                    value={`+${formatCLP(diferencia6m)}`}
                    bold
                    color="text-amber-300"
                  />
                </div>

                {/* Interacción: timing */}
                <div className="flex items-center gap-2 flex-wrap pt-3 border-t border-slate-800/60">
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 mr-1 inline-flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Timing
                  </span>
                  {(['hoy', 'q1', 'q2'] as Timing[]).map(t => {
                    const isSelected = selected === t
                    const color =
                      t === 'hoy'
                        ? { border: 'border-emerald-400', bg: 'bg-emerald-500/20', text: 'text-emerald-200' }
                        : t === 'q1'
                        ? { border: 'border-amber-400', bg: 'bg-amber-500/20', text: 'text-amber-200' }
                        : { border: 'border-red-400', bg: 'bg-red-500/20', text: 'text-red-200' }
                    return (
                      <button
                        key={t}
                        onClick={() => handleTiming(p, t)}
                        className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md border transition-colors ${
                          isSelected
                            ? `${color.border} ${color.bg} ${color.text}`
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
// HELPERS DE CÁLCULO
// ════════════════════════════════════════════════════════════════════════════

function calcularFiniquitoTiming(p: PersonL9, meses: number): number {
  if (meses === 0) return p.finiquitoHoy
  return calculateFiniquitoConTopeCustomUF(
    p.salary,
    p.tenureMonths + meses,
    UF_VALUE_CLP
  )
}

function calcularCostoPeriodo(p: PersonL9, meses: number): number {
  if (meses === 0) return p.finiquitoHoy
  const finiquito = calcularFiniquitoTiming(p, meses)
  const salarioAcum = p.salary * meses
  const productividadReducida = p.salary * PRODUCTIVIDAD_REDUCIDA_FACTOR * meses
  return finiquito + salarioAcum + productividadReducida
}

// ════════════════════════════════════════════════════════════════════════════
// COSTO ROW
// ════════════════════════════════════════════════════════════════════════════

function CostoRow({
  label,
  value,
  bold,
  color,
}: {
  label: string
  value: string
  bold?: boolean
  color?: string
}) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className={`text-slate-400 ${bold ? 'font-medium' : ''}`}>
        {label}
      </span>
      <span
        className={`${color ?? 'text-slate-200'} ${bold ? 'font-medium' : ''}`}
      >
        {value}
      </span>
    </div>
  )
}
