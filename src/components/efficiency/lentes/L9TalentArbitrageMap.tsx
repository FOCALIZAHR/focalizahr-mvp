// ════════════════════════════════════════════════════════════════════════════
// L9 Tab 2 — TALENT ARBITRAGE MAP
// src/components/efficiency/lentes/L9TalentArbitrageMap.tsx
// ════════════════════════════════════════════════════════════════════════════
// Scatter donde cada punto es una persona:
//   · Eje Y: retentionScore (0-120+)
//   · Eje X: mesesFiniquito (0-11) — años de servicio cap 11 (Chile)
//   · Tamaño: costoNominal CLP del finiquito
//
// 4 zonas (background bands sutiles):
//   Arriba-Izq → Agilidad Total  (score alto + tenure bajo) → cyan
//   Arriba-Der → Cimientos de Oro (score alto + tenure alto) → emerald
//   Abajo-Izq  → Ventana Decisión (score bajo + tenure bajo) → amber
//   Abajo-Der  → Talent Trap      (score bajo + tenure alto) → red
//
// VPP (Valor del Pasivo sobre Performance) = retentionScore / mesesFiniquito
// Filtro útil para el CEO: dónde está el "dinero muerto".
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { useMemo } from 'react'
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts'
import { AlertTriangle } from 'lucide-react'
import { formatCLP } from '@/lib/services/efficiency/EfficiencyNarrativeEngine'
import type { PersonL9, ZonaL9 } from './L9PasivoLaboral'

// ════════════════════════════════════════════════════════════════════════════
// CONFIG DE ZONAS
// ════════════════════════════════════════════════════════════════════════════

const SCORE_HIGH_THRESHOLD = 60
const TENURE_HIGH_THRESHOLD = 3
const SCORE_MAX = 120
const TENURE_MAX = 11

interface ZonaConfig {
  id: ZonaL9
  label: string
  descripcion: string
  color: string
  bgOpacity: number
}

const ZONAS: Record<ZonaL9, ZonaConfig> = {
  agilidad_total: {
    id: 'agilidad_total',
    label: 'Agilidad Total',
    descripcion: 'Motor de crecimiento. Baratos de retener, futuro de la empresa.',
    color: '#22D3EE',
    bgOpacity: 0.06,
  },
  cimientos_oro: {
    id: 'cimientos_oro',
    label: 'Cimientos de Oro',
    descripcion: 'Intocables. Pasivo alto pero valor lo justifica.',
    color: '#10B981',
    bgOpacity: 0.06,
  },
  ventana_decision: {
    id: 'ventana_decision',
    label: 'Ventana de Decisión',
    descripcion: 'Candidatos a salida antes de que su pasivo crezca.',
    color: '#F59E0B',
    bgOpacity: 0.08,
  },
  talent_trap: {
    id: 'talent_trap',
    label: 'Pasivo sin retorno',
    descripcion: 'No aporta pero despedirlo golpea el flujo de caja.',
    color: '#EF4444',
    bgOpacity: 0.10,
  },
}

/** Label visible exportado para reutilización en chips de la ficha rica. */
export const ZONA_LABEL: Record<ZonaL9, string> = {
  agilidad_total: 'Agilidad total',
  cimientos_oro: 'Cimientos de oro',
  ventana_decision: 'Ventana de decisión',
  talent_trap: 'Pasivo sin retorno',
}

/** Color por zona — para chips/badges fuera del scatter. */
export const ZONA_COLOR: Record<ZonaL9, string> = {
  agilidad_total: '#22D3EE',
  cimientos_oro: '#10B981',
  ventana_decision: '#F59E0B',
  talent_trap: '#EF4444',
}

// ════════════════════════════════════════════════════════════════════════════
// PROPS
// ════════════════════════════════════════════════════════════════════════════

interface TalentArbitrageMapProps {
  scatter: PersonL9[]
  alertasProximidad: Array<{
    employeeId: string
    employeeName: string
    retentionScore: number
    daysToAnniversary: number
  }>
  /** 'full' (default) — versión Tab 2 standalone con stats arriba +
   *  banner alertas abajo. 'reduced' — variante para el Acto Hallazgo de
   *  L9 migrado a LenteLayout: scatter compacto + leyenda zonas, sin
   *  stats grid ni banner alertas (esos se manejan fuera). */
  variant?: 'full' | 'reduced'
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE
// ════════════════════════════════════════════════════════════════════════════

export function TalentArbitrageMap({
  scatter,
  alertasProximidad,
  variant = 'full',
}: TalentArbitrageMapProps) {
  const isReduced = variant === 'reduced'
  // Agrupar por zona para render + stats
  const byZona = useMemo(() => {
    const groups: Record<ZonaL9, PersonL9[]> = {
      agilidad_total: [],
      cimientos_oro: [],
      ventana_decision: [],
      talent_trap: [],
    }
    for (const p of scatter) {
      if (p.zona) groups[p.zona].push(p)
    }
    return groups
  }, [scatter])

  // Stats VPP agregadas
  const vppStats = useMemo(() => {
    const validos = scatter.filter(p => p.vpp !== null) as Array<PersonL9 & { vpp: number }>
    if (validos.length === 0) {
      return { avgVpp: 0, dineroMuerto: 0, eficiente: 0 }
    }
    const avgVpp =
      validos.reduce((s, p) => s + p.vpp, 0) / validos.length
    const dineroMuerto = validos.filter(p => p.vpp < 5).length
    const eficiente = validos.filter(p => p.vpp > 15).length
    return { avgVpp, dineroMuerto, eficiente }
  }, [scatter])

  if (scatter.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm text-slate-400 font-light">
          No hay suficientes datos de retentionScore para mapear el arbitraje.
        </p>
        <p className="text-xs text-slate-500 font-light mt-1">
          Se necesita performance rating con rolefit + metas + AAE por persona.
        </p>
      </div>
    )
  }

  return (
    <div>
      {/* Header: stats rápidas — solo variante full (Tab 2 legacy) */}
      {!isReduced && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          <StatChip
            label="Mapeados"
            value={String(scatter.length)}
            color="text-white"
          />
          <StatChip
            label="VPP promedio"
            value={vppStats.avgVpp.toFixed(1)}
            hint="valor / mes-finiquito"
            color="text-slate-200"
          />
          <StatChip
            label="Dinero muerto"
            value={String(vppStats.dineroMuerto)}
            hint="VPP < 5"
            color="text-red-300"
          />
          <StatChip
            label="Activos eficientes"
            value={String(vppStats.eficiente)}
            hint="VPP > 15"
            color="text-emerald-300"
          />
        </div>
      )}

      {/* Scatter chart — altura reducida en variant 'reduced' */}
      <div className={`relative ${isReduced ? 'h-[300px] md:h-[340px]' : 'h-[360px] md:h-[420px]'} mb-5 rounded-[20px] bg-[#0F172A]/90 backdrop-blur-2xl border border-slate-800 p-3`}>
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 16, right: 24, bottom: 28, left: 24 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#334155"
              strokeOpacity={0.3}
            />

            {/* 4 zonas de fondo */}
            <ReferenceArea
              x1={0}
              x2={TENURE_HIGH_THRESHOLD}
              y1={SCORE_HIGH_THRESHOLD}
              y2={SCORE_MAX}
              fill={ZONAS.agilidad_total.color}
              fillOpacity={ZONAS.agilidad_total.bgOpacity}
              stroke="none"
            />
            <ReferenceArea
              x1={TENURE_HIGH_THRESHOLD}
              x2={TENURE_MAX}
              y1={SCORE_HIGH_THRESHOLD}
              y2={SCORE_MAX}
              fill={ZONAS.cimientos_oro.color}
              fillOpacity={ZONAS.cimientos_oro.bgOpacity}
              stroke="none"
            />
            <ReferenceArea
              x1={0}
              x2={TENURE_HIGH_THRESHOLD}
              y1={0}
              y2={SCORE_HIGH_THRESHOLD}
              fill={ZONAS.ventana_decision.color}
              fillOpacity={ZONAS.ventana_decision.bgOpacity}
              stroke="none"
            />
            <ReferenceArea
              x1={TENURE_HIGH_THRESHOLD}
              x2={TENURE_MAX}
              y1={0}
              y2={SCORE_HIGH_THRESHOLD}
              fill={ZONAS.talent_trap.color}
              fillOpacity={ZONAS.talent_trap.bgOpacity}
              stroke="none"
            />

            {/* Líneas divisorias */}
            <ReferenceLine
              x={TENURE_HIGH_THRESHOLD}
              stroke="#475569"
              strokeOpacity={0.4}
              strokeDasharray="2 2"
            />
            <ReferenceLine
              y={SCORE_HIGH_THRESHOLD}
              stroke="#475569"
              strokeOpacity={0.4}
              strokeDasharray="2 2"
            />

            <XAxis
              type="number"
              dataKey="mesesFiniquito"
              name="Meses finiquito"
              domain={[0, TENURE_MAX]}
              ticks={[0, 3, 6, 9, 11]}
              tick={{ fill: '#94A3B8', fontSize: 11 }}
              axisLine={{ stroke: '#334155' }}
              tickLine={{ stroke: '#334155' }}
              label={{
                value: 'Meses de finiquito (años de servicio)',
                position: 'insideBottom',
                offset: -10,
                style: { fill: '#64748B', fontSize: 10 },
              }}
            />
            <YAxis
              type="number"
              dataKey="retentionScore"
              name="Retention Score"
              domain={[0, SCORE_MAX]}
              ticks={[0, 30, 60, 90, 120]}
              tick={{ fill: '#94A3B8', fontSize: 11 }}
              axisLine={{ stroke: '#334155' }}
              tickLine={{ stroke: '#334155' }}
              label={{
                value: 'Retention Score',
                angle: -90,
                position: 'insideLeft',
                offset: 12,
                style: { fill: '#64748B', fontSize: 10 },
              }}
            />
            <ZAxis
              type="number"
              dataKey="finiquitoHoy"
              range={[60, 420]}
              name="Costo nominal"
            />
            <Tooltip
              cursor={{ strokeDasharray: '3 3', stroke: '#475569' }}
              content={<ScatterTooltip />}
            />

            {/* Un Scatter por zona (color propio) */}
            {(Object.keys(byZona) as ZonaL9[]).map(z => (
              <Scatter
                key={z}
                name={ZONAS[z].label}
                data={byZona[z]}
                fill={ZONAS[z].color}
                fillOpacity={0.7}
                stroke={ZONAS[z].color}
                strokeWidth={1}
              />
            ))}
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* Legend + counts por zona */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
        {(Object.keys(ZONAS) as ZonaL9[]).map(z => {
          const zona = ZONAS[z]
          const count = byZona[z].length
          const totalCosto = byZona[z].reduce((s, p) => s + p.finiquitoHoy, 0)
          return (
            <div
              key={z}
              className="p-3 rounded-md border"
              style={{
                background: `${zona.color}10`,
                borderColor: `${zona.color}40`,
              }}
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: zona.color }}
                  />
                  <span
                    className="text-xs font-medium"
                    style={{ color: zona.color }}
                  >
                    {zona.label}
                  </span>
                </div>
                <span className="text-[11px] font-medium text-slate-200">
                  {count} {count === 1 ? 'persona' : 'personas'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-light leading-snug">
                {zona.descripcion}
              </p>
              {count > 0 && (
                <p className="text-[10px] text-slate-500 font-light mt-1">
                  Pasivo acumulado: {formatCLP(totalCosto)}
                </p>
              )}
            </div>
          )
        })}
      </div>

      {/* Alerta Proximidad — solo variante full. En 'reduced' el banner
          se renderiza fuera (en el Quirófano de L9 LenteLayout). */}
      {!isReduced && alertasProximidad.length > 0 && (
        <div
          className="p-3 rounded-md"
          style={{
            background: 'rgba(245, 158, 11, 0.08)',
            border: '1px solid rgba(245, 158, 11, 0.35)',
          }}
        >
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-xs text-amber-200 font-medium">
                {alertasProximidad.length}{' '}
                {alertasProximidad.length === 1 ? 'persona' : 'personas'} con
                score {'<'} 40 y aniversario en los próximos 45 días
              </p>
              <p className="text-[11px] text-amber-200/80 font-light leading-snug mt-1">
                Acción antes del aniversario evita un sueldo adicional de
                indemnización por cada caso. En Chile, el finiquito salta por
                escalones de un mes por cada año cumplido.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// STAT CHIP
// ════════════════════════════════════════════════════════════════════════════

function StatChip({
  label,
  value,
  hint,
  color,
}: {
  label: string
  value: string
  hint?: string
  color: string
}) {
  return (
    <div className="p-3 rounded-md bg-slate-900/60 border border-slate-800/60">
      <p className="text-[9px] uppercase tracking-widest text-slate-500 font-light">
        {label}
      </p>
      <p className={`text-lg font-light mt-0.5 ${color}`}>{value}</p>
      {hint && (
        <p className="text-[10px] text-slate-500 font-light mt-0.5">{hint}</p>
      )}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// TOOLTIP CUSTOM
// ════════════════════════════════════════════════════════════════════════════

interface TooltipPayload {
  payload: PersonL9
}

function ScatterTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: TooltipPayload[]
}) {
  if (!active || !payload || payload.length === 0) return null
  const p = payload[0].payload
  if (!p) return null

  const zona = p.zona ? ZONAS[p.zona] : null

  return (
    <div className="bg-slate-950/95 backdrop-blur-xl border border-slate-700 rounded-md p-3 shadow-xl min-w-[220px]">
      <div className="flex items-center justify-between gap-2 mb-2">
        <p className="text-sm font-medium text-white truncate">
          {p.employeeName}
        </p>
        {zona && (
          <span
            className="text-[10px] font-medium px-1.5 py-0.5 rounded"
            style={{
              color: zona.color,
              backgroundColor: `${zona.color}15`,
              borderWidth: 1,
              borderColor: `${zona.color}40`,
              borderStyle: 'solid',
            }}
          >
            {zona.label}
          </span>
        )}
      </div>
      <p className="text-[11px] text-slate-400 font-light mb-2">
        {p.position} · {p.departmentName}
      </p>
      <div className="space-y-1 text-[11px]">
        <TooltipRow
          label="Retention score"
          value={p.retentionScore !== null ? Math.round(p.retentionScore).toString() : '—'}
        />
        <TooltipRow
          label="Meses finiquito"
          value={`${p.mesesFiniquito}`}
          hint={`tenure ${Math.floor(p.tenureMonths / 12)}y ${p.tenureMonths % 12}m`}
        />
        <TooltipRow
          label="Finiquito hoy"
          value={formatCLP(p.finiquitoHoy)}
        />
        <TooltipRow
          label="Costo de esperar 12m"
          value={formatCLP(p.costoEspera)}
          emphasis="amber"
        />
        {p.vpp !== null && (
          <TooltipRow
            label="VPP"
            value={p.vpp.toFixed(1)}
            hint={
              p.vpp < 5 ? 'dinero muerto' : p.vpp > 15 ? 'activo eficiente' : ''
            }
            emphasis={p.vpp < 5 ? 'red' : p.vpp > 15 ? 'emerald' : undefined}
          />
        )}
        {p.exposureIA !== null && (
          <TooltipRow
            label="Exposición IA"
            value={`${Math.round(p.exposureIA * 100)}%`}
          />
        )}
      </div>
    </div>
  )
}

function TooltipRow({
  label,
  value,
  hint,
  emphasis,
}: {
  label: string
  value: string
  hint?: string
  emphasis?: 'red' | 'amber' | 'emerald'
}) {
  const color =
    emphasis === 'red'
      ? 'text-red-300'
      : emphasis === 'amber'
      ? 'text-amber-300'
      : emphasis === 'emerald'
      ? 'text-emerald-300'
      : 'text-slate-200'
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-slate-500 font-light">{label}</span>
      <span className={`font-medium ${color}`}>
        {value}
        {hint && (
          <span className="text-slate-600 font-light ml-1 text-[10px]">
            · {hint}
          </span>
        )}
      </span>
    </div>
  )
}
