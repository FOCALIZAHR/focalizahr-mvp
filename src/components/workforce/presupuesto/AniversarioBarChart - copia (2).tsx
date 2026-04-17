'use client'

// Grafico mensual apilado + linea de inercia + linea FTE + panel detalle.
//   cyan gradient    → costo base
//   slate gradient   → reajuste IPC
//   amber gradient   → merito (evento anual independiente)
//   purple gradient  → finiquitos
//   cyan→purple dash → linea de inercia "Sin acciones"
//   emerald solid    → linea FTE en eje Y derecho
// Click en barra → panel narrativo debajo del chart.

import { useState } from 'react'
import {
  Bar,
  ComposedChart,
  Customized,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatCLP } from './format'
import { formatNombre } from './format'
import type { MesPresupuesto } from './types'

interface AniversarioBarChartProps {
  meses: MesPresupuesto[]
  costoBaseOriginal: number
}

const COLOR = {
  base:      '#0891B2',
  baseDeep:  '#155E75',
  ipc:       '#94A3B8',
  ipcDeep:   '#475569',
  merito:    '#F59E0B',
  meritoDeep:'#B45309',
  finiquito: '#A78BFA',
  finDeep:   '#7C3AED',
  inercia:   'rgba(34,211,238,0.50)',
  ahorro:    '#10B981',
} as const

interface FiniquitoEntry {
  nombre: string
  monto: number
}

interface ChartRow extends MesPresupuesto {
  mesCorto: string
}

function ChartGradients() {
  return (
    <defs>
      <linearGradient id="gradBase" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={COLOR.base} stopOpacity={0.85} />
        <stop offset="100%" stopColor={COLOR.baseDeep} stopOpacity={0.55} />
      </linearGradient>
      <linearGradient id="gradIPC" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={COLOR.ipc} stopOpacity={0.7} />
        <stop offset="100%" stopColor={COLOR.ipcDeep} stopOpacity={0.4} />
      </linearGradient>
      <linearGradient id="gradMerito" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={COLOR.merito} stopOpacity={0.8} />
        <stop offset="100%" stopColor={COLOR.meritoDeep} stopOpacity={0.45} />
      </linearGradient>
      <linearGradient id="gradFin" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={COLOR.finiquito} stopOpacity={0.85} />
        <stop offset="100%" stopColor={COLOR.finDeep} stopOpacity={0.5} />
      </linearGradient>
      <linearGradient id="gradInercia" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#22D3EE" stopOpacity={0.25} />
        <stop offset="50%" stopColor="#22D3EE" stopOpacity={0.6} />
        <stop offset="100%" stopColor="#A78BFA" stopOpacity={0.4} />
      </linearGradient>
    </defs>
  )
}

function GlowCursor({ x, y, width, height }: { x?: number; y?: number; width?: number; height?: number }) {
  if (!x || !width) return null
  return (
    <rect
      x={x}
      y={y}
      width={width}
      height={height}
      fill="rgba(34,211,238,0.04)"
      rx={4}
      style={{ filter: 'blur(1px)' }}
    />
  )
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ payload: ChartRow }>
}) {
  if (!active || !payload?.length) return null
  const mes = payload[0].payload
  const delta = mes.costoEmpresa - mes.sinAccionesMes
  const tieneAhorro = mes.ahorroPostSalida > 0
  const tieneFiniquito = mes.finiquitosMes > 0
  const tieneReajuste = mes.reajusteIPCMes > 0
  const tieneMerito = mes.meritoMes > 0

  return (
    <div className="relative overflow-hidden px-3 py-2.5 rounded-lg bg-slate-900/95 border border-white/10 shadow-xl backdrop-blur-sm max-w-[280px]">
      <div
        className="absolute top-0 left-0 right-0 h-[1px]"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(34,211,238,0.4), transparent)' }}
      />
      <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1.5 capitalize">
        {mes.mesNombre} · {mes.fteMes} personas
      </p>

      <p className="text-[12px] font-light text-slate-300 leading-relaxed mb-3">
        {'Costo total '}
        <span className="text-white font-medium">{formatCLP(mes.costoEmpresa)}</span>
        {tieneReajuste && (
          <>
            {', incluye '}
            <span style={{ color: COLOR.ipc }} className="font-normal">
              {formatCLP(mes.reajusteIPCMes)}
            </span>
            {' de IPC'}
          </>
        )}
        {tieneMerito && (
          <>
            {tieneReajuste ? ' + ' : ', incluye '}
            <span style={{ color: COLOR.merito }} className="font-normal">
              {formatCLP(mes.meritoMes)}
            </span>
            {' de merito'}
          </>
        )}
        {tieneFiniquito && (
          <>
            {' y '}
            <span className="text-purple-400 font-normal">
              {formatCLP(mes.finiquitosMes)}
            </span>
            {' en finiquitos'}
          </>
        )}
        {'.'}
      </p>

      <div className="space-y-1 text-xs font-light text-slate-300">
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: COLOR.base, boxShadow: `0 0 4px ${COLOR.base}50` }} />
            Base
          </span>
          <span className="tabular-nums text-slate-200">{formatCLP(mes.costoBaseMes)}</span>
        </div>

        {tieneReajuste && (
          <div className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: COLOR.ipc, boxShadow: `0 0 4px ${COLOR.ipc}50` }} />
              IPC
            </span>
            <span className="tabular-nums" style={{ color: COLOR.ipc }}>+{formatCLP(mes.reajusteIPCMes)}</span>
          </div>
        )}

        {tieneMerito && (
          <div className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: COLOR.merito, boxShadow: `0 0 4px ${COLOR.merito}50` }} />
              Merito
            </span>
            <span className="tabular-nums" style={{ color: COLOR.merito }}>+{formatCLP(mes.meritoMes)}</span>
          </div>
        )}

        {tieneFiniquito && mes.finiquitosDetalle.map((f: FiniquitoEntry, idx) => (
          <div key={idx} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 min-w-0">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: COLOR.finiquito, boxShadow: `0 0 4px ${COLOR.finiquito}50` }} />
              <span className="truncate">{formatNombre(f.nombre)}</span>
            </span>
            <span className="tabular-nums text-purple-300 flex-shrink-0">+{formatCLP(f.monto)}</span>
          </div>
        ))}

        {tieneAhorro && (
          <div className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: COLOR.ahorro, boxShadow: `0 0 4px ${COLOR.ahorro}50` }} />
              Ahorro activo
            </span>
            <span className="tabular-nums text-emerald-300">−{formatCLP(mes.ahorroPostSalida)}</span>
          </div>
        )}
      </div>

      <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between gap-4">
        <span className="text-[11px] text-slate-400 font-medium">Total</span>
        <span className="text-sm text-white font-medium tabular-nums">{formatCLP(mes.costoEmpresa)}</span>
      </div>

      <div className="flex items-center justify-between gap-4 mt-1">
        <span className="flex items-center gap-1.5 text-[10px] text-cyan-400/60 font-light">
          <span className="inline-block w-2.5 border-t border-dashed border-cyan-400/50" />
          Si no haces nada
        </span>
        <span className="text-[11px] text-cyan-400/60 font-light tabular-nums">
          {formatCLP(mes.sinAccionesMes)}
        </span>
      </div>

      {delta > 0 && (
        <p className="text-[10px] mt-0.5 font-light text-slate-400/80 italic">
          Este mes incluye finiquitos. El ahorro se activa desde el mes siguiente.
        </p>
      )}
      {delta < 0 && (
        <p className="text-[10px] mt-0.5 font-light text-emerald-400/80">
          {formatCLP(delta)} vs no hacer nada
        </p>
      )}
    </div>
  )
}

function MesDetailPanel({ mes, onClose }: { mes: ChartRow; onClose: () => void }) {
  const tieneFiniquito = mes.finiquitosMes > 0
  const tieneAhorro = mes.ahorroPostSalida > 0
  const tieneReajuste = mes.reajusteIPCMes > 0
  const tieneMerito = mes.meritoMes > 0

  const partes: string[] = []
  if (tieneFiniquito && mes.finiquitosDetalle.length > 0) {
    const nombres = mes.finiquitosDetalle
      .map((f: FiniquitoEntry) => `${formatNombre(f.nombre)} (${formatCLP(f.monto)})`)
      .join(', ')
    partes.push(
      `En ${mes.mesNombre} pagas ${formatCLP(mes.finiquitosMes)} en finiquitos de ${mes.finiquitosDetalle.length} ${mes.finiquitosDetalle.length === 1 ? 'persona' : 'personas'}: ${nombres}.`,
    )
  }
  if (tieneAhorro) {
    partes.push(`El ahorro mensual acumulado a esta fecha es ${formatCLP(mes.ahorroPostSalida)}.`)
  }
  if (tieneReajuste) {
    partes.push(`El reajuste IPC suma ${formatCLP(mes.reajusteIPCMes)} sobre la base.`)
  }
  if (tieneMerito) {
    partes.push(`Merito agrega ${formatCLP(mes.meritoMes)}.`)
  }
  if (partes.length === 0) {
    partes.push(`Mes sin eventos especiales. Costo empresa: ${formatCLP(mes.costoEmpresa)}.`)
  }

  return (
    <div className="relative overflow-hidden mt-4 rounded-xl bg-slate-900/60 border border-slate-700/40 p-4">
      <div
        className="absolute top-0 left-0 right-0 h-[1px]"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(34,211,238,0.3), transparent)' }}
      />
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-medium mb-2 capitalize">
            {mes.mesNombre} · {mes.fteMes} personas
          </p>
          <p className="text-sm text-slate-300 font-light leading-relaxed">
            {partes.join(' ')}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-slate-500 hover:text-slate-300 transition-colors flex-shrink-0 mt-0.5"
          aria-label="Cerrar detalle"
        >
          ✕
        </button>
      </div>
    </div>
  )
}

export default function AniversarioBarChart({
  meses,
}: AniversarioBarChartProps) {
  const [selectedMes, setSelectedMes] = useState<number | null>(null)

  const data: ChartRow[] = meses.map(m => ({
    ...m,
    mesCorto: m.mesNombre.slice(0, 3),
  }))

  const selectedData = selectedMes !== null ? data.find(d => d.mes === selectedMes) : null

  const handleBarClick = (barData: ChartRow | undefined) => {
    if (!barData) return
    setSelectedMes(prev => (prev === barData.mes ? null : barData.mes))
  }

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart
          data={data}
          margin={{ top: 12, right: 50, left: -20, bottom: 0 }}
          onClick={(e) => {
            if (e?.activePayload?.[0]?.payload) {
              handleBarClick(e.activePayload[0].payload as ChartRow)
            }
          }}
        >
          <Customized component={ChartGradients} />
          <XAxis
            dataKey="mesCorto"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#64748B', fontSize: 10, fontWeight: 300 }}
          />
          <YAxis
            yAxisId="cost"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#475569', fontSize: 10, fontWeight: 300 }}
            tickFormatter={formatCLP}
            width={60}
          />
          <YAxis
            yAxisId="fte"
            orientation="right"
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 9, fontWeight: 300 }}
            width={36}
            domain={['dataMin - 5', 'dataMax + 5']}
          />
          <Tooltip
            cursor={<GlowCursor />}
            content={<CustomTooltip />}
            wrapperStyle={{ outline: 'none' }}
          />
          <Bar
            yAxisId="cost"
            dataKey="costoBaseMes"
            stackId="a"
            fill="url(#gradBase)"
            radius={[0, 0, 0, 0]}
            style={{ cursor: 'pointer' }}
          />
          <Bar
            yAxisId="cost"
            dataKey="reajusteIPCMes"
            stackId="a"
            fill="url(#gradIPC)"
            radius={[0, 0, 0, 0]}
            style={{ cursor: 'pointer' }}
          />
          <Bar
            yAxisId="cost"
            dataKey="meritoMes"
            stackId="a"
            fill="url(#gradMerito)"
            radius={[0, 0, 0, 0]}
            style={{ cursor: 'pointer' }}
          />
          <Bar
            yAxisId="cost"
            dataKey="finiquitosMes"
            stackId="a"
            fill="url(#gradFin)"
            radius={[4, 4, 0, 0]}
            style={{ cursor: 'pointer' }}
          />
          <Line
            yAxisId="cost"
            type="monotone"
            dataKey="sinAccionesMes"
            stroke="url(#gradInercia)"
            strokeWidth={1.5}
            strokeDasharray="6 4"
            dot={false}
            activeDot={{
              r: 3,
              fill: '#22D3EE',
              stroke: 'rgba(34,211,238,0.3)',
              strokeWidth: 4,
            }}
            isAnimationActive={true}
            animationDuration={1200}
            animationEasing="ease-out"
          />
          <Line
            yAxisId="fte"
            type="stepAfter"
            dataKey="fteMes"
            stroke="#ffffff"
            strokeOpacity={0.75}
            strokeWidth={2}
            dot={false}
            activeDot={{
              r: 3,
              fill: '#ffffff',
              opacity: 0.9,
            }}
            isAnimationActive={true}
            animationDuration={1000}
          />
        </ComposedChart>
      </ResponsiveContainer>

      {/* Leyenda */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mt-4 text-[11px] text-slate-400 font-light">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: COLOR.base, boxShadow: `0 0 6px ${COLOR.base}50` }} />
          Base
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: COLOR.ipc, boxShadow: `0 0 6px ${COLOR.ipc}50` }} />
          IPC
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: COLOR.merito, boxShadow: `0 0 6px ${COLOR.merito}50` }} />
          Merito
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: COLOR.finiquito, boxShadow: `0 0 6px ${COLOR.finiquito}50` }} />
          Finiquitos
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] tracking-widest text-cyan-400/50 font-light leading-none">- -</span>
          Si no haces nada
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: 'rgba(255,255,255,0.3)' }} />
          FTE
        </div>
      </div>

      {/* Panel detalle por mes (click en barra) */}
      {selectedData && (
        <MesDetailPanel
          mes={selectedData}
          onClose={() => setSelectedMes(null)}
        />
      )}
    </div>
  )
}
