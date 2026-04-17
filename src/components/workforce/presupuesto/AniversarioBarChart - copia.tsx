'use client'

// Grafico mensual apilado + linea de inercia "Sin acciones".
//   cyan-900  → costo base (masa + delta movimientos − ahorro). Profundo, confiable.
//   slate-600 → reajuste IPC + merito. Mecanico, inevitable.
//   purple    → finiquitos. Deliberado, spike de inversion del CEO.
//   cyan-400 @60% dashed → linea de inercia. Fantasma luminoso de lo que costaria no actuar.
// La distancia entre barras y linea = valor de las decisiones del CEO.

import {
  Bar,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatCLP } from './format'
import type { MesPresupuesto } from './types'

interface AniversarioBarChartProps {
  meses: MesPresupuesto[]
  costoBaseOriginal: number
}

// Paleta FocalizaHR — Cyan Profundo + Linea Luminosa.
const COLOR_BASE = '#155E75'                // cyan-900 — gasto controlado
const COLOR_IPC = '#475569'                 // slate-600 — fuerza externa
const COLOR_FINIQUITO = '#A78BFA'           // purple — decision deliberada
const COLOR_INERCIA = 'rgba(34,211,238,0.6)' // cyan-400 @60% — fantasma de inercia
const COLOR_AHORRO = '#10B981'              // success — solo en tooltip

interface FiniquitoEntry {
  nombre: string
  monto: number
}

interface ChartRow extends MesPresupuesto {
  mesCorto: string
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

  return (
    <div className="px-3 py-2.5 rounded-lg bg-slate-900/95 border border-white/10 shadow-xl backdrop-blur-sm max-w-[280px]">
      <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1.5 capitalize">
        {mes.mesNombre}
      </p>

      <div className="space-y-1 text-xs font-light text-slate-300">
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-sm" style={{ background: COLOR_BASE }} />
            Base
          </span>
          <span className="tabular-nums text-slate-200">
            {formatCLP(mes.costoBaseMes)}
          </span>
        </div>

        {tieneReajuste && (
          <div className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-sm" style={{ background: COLOR_IPC }} />
              Reajuste IPC + merito
            </span>
            <span className="tabular-nums text-slate-300">
              +{formatCLP(mes.reajusteIPCMes)}
            </span>
          </div>
        )}

        {tieneFiniquito &&
          mes.finiquitosDetalle.length > 0 &&
          mes.finiquitosDetalle.map((f: FiniquitoEntry, idx) => (
            <div key={idx} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 min-w-0">
                <span
                  className="w-2 h-2 rounded-sm flex-shrink-0"
                  style={{ background: COLOR_FINIQUITO }}
                />
                <span className="truncate">Finiquito {f.nombre}</span>
              </span>
              <span className="tabular-nums text-purple-300 flex-shrink-0">
                +{formatCLP(f.monto)}
              </span>
            </div>
          ))}

        {tieneAhorro && (
          <div className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-sm" style={{ background: COLOR_AHORRO }} />
              Ahorro activo
            </span>
            <span className="tabular-nums text-emerald-300">
              −{formatCLP(mes.ahorroPostSalida)}
            </span>
          </div>
        )}
      </div>

      <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between gap-4">
        <span className="text-[11px] text-slate-400 font-medium">Total</span>
        <span className="text-sm text-white font-medium tabular-nums">
          {formatCLP(mes.costoEmpresa)}
        </span>
      </div>

      <div className="flex items-center justify-between gap-4 mt-1">
        <span className="text-[10px] text-slate-500 font-light">Sin acciones</span>
        <span className="text-[11px] text-slate-400 font-light tabular-nums">
          {formatCLP(mes.sinAccionesMes)}
        </span>
      </div>

      {delta !== 0 && (
        <p
          className={
            'text-[10px] mt-1 font-light ' +
            (delta > 0 ? 'text-purple-300/80' : 'text-emerald-400/80')
          }
        >
          {delta > 0 ? '+' : ''}
          {formatCLP(delta)} vs sin acciones
        </p>
      )}
    </div>
  )
}

export default function AniversarioBarChart({
  meses,
}: AniversarioBarChartProps) {
  const data: ChartRow[] = meses.map(m => ({
    ...m,
    mesCorto: m.mesNombre.slice(0, 3),
  }))

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={260}>
        <ComposedChart
          data={data}
          margin={{ top: 12, right: 12, left: -20, bottom: 0 }}
        >
          <XAxis
            dataKey="mesCorto"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#64748B', fontSize: 10, fontWeight: 300 }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#475569', fontSize: 10, fontWeight: 300 }}
            tickFormatter={formatCLP}
            width={60}
          />
          <Tooltip
            cursor={{ fill: 'rgba(148,163,184,0.04)' }}
            content={<CustomTooltip />}
          />
          <Bar
            dataKey="costoBaseMes"
            stackId="a"
            fill={COLOR_BASE}
            radius={[0, 0, 0, 0]}
          />
          <Bar
            dataKey="reajusteIPCMes"
            stackId="a"
            fill={COLOR_IPC}
            radius={[0, 0, 0, 0]}
          />
          <Bar
            dataKey="finiquitosMes"
            stackId="a"
            fill={COLOR_FINIQUITO}
            radius={[4, 4, 0, 0]}
          />
          <Line
            type="monotone"
            dataKey="sinAccionesMes"
            stroke={COLOR_INERCIA}
            strokeWidth={1.5}
            strokeDasharray="4 4"
            dot={false}
            activeDot={false}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>

      {/* Leyenda */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4 text-[11px] text-slate-400 font-light">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-sm" style={{ background: COLOR_BASE }} />
          Base mensual
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-sm" style={{ background: COLOR_IPC }} />
          Reajuste IPC
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-sm" style={{ background: COLOR_FINIQUITO }} />
          Finiquitos
        </div>
        <div className="flex items-center gap-2">
          <span
            className="w-3 h-0 border-t-2 border-dashed border-cyan-400/60"
          />
          Sin acciones
        </div>
      </div>
    </div>
  )
}
