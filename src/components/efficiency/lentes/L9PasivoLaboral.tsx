// ════════════════════════════════════════════════════════════════════════════
// L9 — PASIVO LABORAL (liability organizacional + Talent Arbitrage Map)
// src/components/efficiency/lentes/L9PasivoLaboral.tsx
// ════════════════════════════════════════════════════════════════════════════
// 2 tabs:
//
//  Tab 1 — Pasivo Latente (default)
//    · Liability financiero de TODA la dotación con tenure ≥ 12 meses.
//    · Siempre existe. Siempre crece con el tiempo.
//    · Top-15 por costoEspera con timing selector (captura decisión).
//    · Alertas de Proximidad (score<40 + aniversario <45 días) si hay.
//
//  Tab 2 — Talent Arbitrage Map (scatter)
//    · Scatter retentionScore (Y) × mesesFiniquito (X) × costoNominal (size).
//    · 4 zonas: Agilidad Total, Cimientos Oro, Ventana Decisión, Talent Trap.
//    · VPP = retentionScore / mesesFiniquito — ratio para filtrar dinero muerto.
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { useEffect, useMemo, useState } from 'react'
import { Calendar, Clock, AlertTriangle, LayoutGrid, Target } from 'lucide-react'
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
import { TalentArbitrageMap } from './L9TalentArbitrageMap'

// ════════════════════════════════════════════════════════════════════════════
// TIPOS (coinciden con EfficiencyDataResolver case 'l9_pasivo')
// ════════════════════════════════════════════════════════════════════════════

export type ZonaL9 =
  | 'agilidad_total'
  | 'cimientos_oro'
  | 'ventana_decision'
  | 'talent_trap'

export interface PersonL9 {
  employeeId: string
  employeeName: string
  position: string
  departmentName: string
  salary: number
  tenureMonths: number
  mesesFiniquito: number
  finiquitoHoy: number
  finiquitoQ2: number
  finiquitoQ4: number
  costoEspera: number
  retentionScore: number | null
  exposureIA: number | null
  vpp: number | null
  zona: ZonaL9 | null
  focalizaScore: number | null
}

interface AlertaProximidad {
  employeeId: string
  employeeName: string
  position: string
  departmentName: string
  retentionScore: number
  daysToAnniversary: number
  salarioAdicional: number
}

interface L9Detalle {
  persons: PersonL9[]
  totalHoy: number
  totalQ2: number
  totalQ4: number
  costoEsperaTotal: number
  ahorroMensual: number
  paybackMeses: number | null
  totalElegibles: number
  scatter: PersonL9[]
  alertasProximidad: AlertaProximidad[]
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

const PRODUCTIVIDAD_REDUCIDA_FACTOR = 0.2

type Tab = 'pasivo_latente' | 'arbitrage_map'

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
  const [activeTab, setActiveTab] = useState<Tab>('pasivo_latente')
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

  if (!lente.hayData || !detalle) {
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
      {/* ── Portada común a ambas pestañas ─────────────────────── */}
      <LenteCard.Portada
        metricaProtagonista={formatCLP(detalle.costoEsperaTotal)}
        metricaLabel={`costo adicional de esperar 12 meses · ${detalle.totalElegibles} personas con derecho a indemnización`}
      >
        {lente.narrativa}
      </LenteCard.Portada>

      {/* ── Tab switcher ──────────────────────────────────────── */}
      <div className="flex gap-2 mb-6 border-b border-slate-800/60">
        <TabButton
          label="Pasivo Latente"
          icon={Target}
          active={activeTab === 'pasivo_latente'}
          onClick={() => setActiveTab('pasivo_latente')}
          hint={`${detalle.persons.length} top por costo de espera`}
        />
        <TabButton
          label="Talent Arbitrage Map"
          icon={LayoutGrid}
          active={activeTab === 'arbitrage_map'}
          onClick={() => setActiveTab('arbitrage_map')}
          hint={`${detalle.scatter.length} mapeados · 4 zonas`}
        />
      </div>

      {/* ── Tab 1: Pasivo Latente ─────────────────────────────── */}
      {activeTab === 'pasivo_latente' && (
        <>
          {/* Alertas de Proximidad (killer feature) */}
          {detalle.alertasProximidad.length > 0 && (
            <div className="mb-5">
              <p className="text-[10px] uppercase tracking-widest text-amber-300 font-medium mb-2 flex items-center gap-1.5">
                <AlertTriangle className="w-3 h-3" />
                Alertas de Proximidad — aniversario en menos de 45 días
              </p>
              <div className="space-y-2">
                {detalle.alertasProximidad.map(a => (
                  <div
                    key={a.employeeId}
                    className="p-3 rounded-md"
                    style={{
                      background: 'rgba(245, 158, 11, 0.08)',
                      border: '1px solid rgba(245, 158, 11, 0.35)',
                    }}
                  >
                    <p className="text-xs text-amber-200 font-light leading-snug">
                      <span className="font-medium">{a.employeeName}</span>
                      <span className="text-slate-400"> · {a.position} · score {a.retentionScore}</span>
                    </p>
                    <p className="text-[11px] text-amber-200/80 font-light mt-1">
                      Cumple antigüedad en{' '}
                      <span className="font-medium">{a.daysToAnniversary} días</span>.
                      Ejecutar su salida hoy ahorra aprox.{' '}
                      <span className="font-medium">{formatCLP(a.salarioAdicional)}</span>{' '}
                      en indemnización adicional.
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <LenteCard.Evidencia titulo="Costo completo del período de espera · top 15 por costo de espera">
            <div className="space-y-4">
              {detalle.persons.map(p => (
                <PersonRow
                  key={p.employeeId}
                  p={p}
                  selected={timingByPerson[p.employeeId] ?? null}
                  onTiming={handleTiming}
                />
              ))}
            </div>
          </LenteCard.Evidencia>
        </>
      )}

      {/* ── Tab 2: Talent Arbitrage Map ────────────────────────── */}
      {activeTab === 'arbitrage_map' && (
        <TalentArbitrageMap
          scatter={detalle.scatter}
          alertasProximidad={detalle.alertasProximidad}
        />
      )}
    </LenteCard>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// TAB BUTTON
// ════════════════════════════════════════════════════════════════════════════

function TabButton({
  label,
  icon: Icon,
  active,
  onClick,
  hint,
}: {
  label: string
  icon: React.ComponentType<{ className?: string }>
  active: boolean
  onClick: () => void
  hint?: string
}) {
  return (
    <button
      onClick={onClick}
      className={`relative inline-flex items-center gap-2 text-xs font-medium px-4 py-2.5 transition-colors ${
        active
          ? 'text-white'
          : 'text-slate-500 hover:text-slate-300'
      }`}
    >
      <Icon className="w-3.5 h-3.5" />
      <span>{label}</span>
      {hint && (
        <span className="text-[10px] text-slate-600 font-light hidden md:inline">
          · {hint}
        </span>
      )}
      {active && (
        <span
          className="absolute bottom-0 left-0 right-0 h-[2px]"
          style={{
            background: 'linear-gradient(90deg, transparent, #F59E0B, transparent)',
          }}
          aria-hidden
        />
      )}
    </button>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// PERSON ROW (Tab 1)
// ════════════════════════════════════════════════════════════════════════════

function PersonRow({
  p,
  selected,
  onTiming,
}: {
  p: PersonL9
  selected: Timing | null
  onTiming: (p: PersonL9, t: Timing) => void
}) {
  const mesesAniversario = calculateMonthsUntilNextYear(p.tenureMonths)
  const aniversarioProximo =
    mesesAniversario !== null && mesesAniversario <= 3

  const costoEspera6m = calcularCostoPeriodo(p, 6)
  const finiq6m = calcularFiniquitoTiming(p, 6)
  const salario6m = p.salary * 6
  const productividadReducida6m = p.salary * PRODUCTIVIDAD_REDUCIDA_FACTOR * 6
  const diferencia6m = costoEspera6m - p.finiquitoHoy

  return (
    <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800/60">
      <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
        <div>
          <p className="text-sm font-medium text-white">{p.employeeName}</p>
          <p className="text-xs text-slate-400 font-light mt-0.5">
            {p.position} · {p.departmentName} ·{' '}
            <span className="text-slate-500">
              {Math.floor(p.tenureMonths / 12)}y {p.tenureMonths % 12}m
            </span>
            {p.retentionScore !== null && (
              <>
                {' · '}
                <span className="text-slate-500">score {Math.round(p.retentionScore)}</span>
              </>
            )}
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
            <span className="font-medium">
              Aniversario en {mesesAniversario}{' '}
              {mesesAniversario === 1 ? 'mes' : 'meses'}
            </span>
            . Actuar antes evita aprox. {formatCLP(p.salary)} adicional en
            indemnización.
          </p>
        </div>
      )}

      <div className="space-y-1.5 mb-4 text-xs font-light">
        <CostoRow label="Finiquito en 6 meses" value={formatCLP(finiq6m)} />
        <CostoRow label="Salario acumulado (6 meses)" value={formatCLP(salario6m)} />
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
              onClick={() => onTiming(p, t)}
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
