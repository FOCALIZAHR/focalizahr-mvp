'use client'

// Chart de presupuesto con 3 tabs:
//   Tab 1 "Mes a mes"  — barras apiladas + linea inercia + linea FTE (existente)
//   Tab 2 "Mochila"    — 3 lineas normalizadas al 100% de enero (dotacion vs costo)
//   Tab 3 "vs Inercia" — acumulado real vs acumulado sin actuar

import { useState, useMemo } from 'react'
import {
  Area,
  Bar,
  ComposedChart,
  Customized,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatCLP, formatNombre } from './format'
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

type TabKey = 'mensual' | 'mochila' | 'inercia'
const TABS: Array<{ key: TabKey; label: string }> = [
  { key: 'mensual', label: 'Mes a mes' },
  { key: 'mochila', label: 'Mochila' },
  { key: 'inercia', label: 'vs Inercia' },
]

const TICK_STYLE_AXIS = { fill: '#475569', fontSize: 10, fontWeight: 300 }
const TICK_STYLE_LABEL = { fill: '#64748B', fontSize: 10, fontWeight: 300 }

interface FiniquitoEntry { nombre: string; monto: number }

// ── Gradientes SVG compartidos ──────────────────────────────────────────
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
      <linearGradient id="aMochila" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#22D3EE" stopOpacity={0.08} />
        <stop offset="100%" stopColor="#22D3EE" stopOpacity={0.02} />
      </linearGradient>
      <linearGradient id="aFiniquito" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#A78BFA" stopOpacity={0.12} />
        <stop offset="100%" stopColor="#A78BFA" stopOpacity={0.03} />
      </linearGradient>
      <linearGradient id="aDelta" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#22D3EE" stopOpacity={0.12} />
        <stop offset="100%" stopColor="#22D3EE" stopOpacity={0.03} />
      </linearGradient>
    </defs>
  )
}

function GlowCursor({ x, y, width, height }: { x?: number; y?: number; width?: number; height?: number }) {
  if (!x || !width) return null
  return <rect x={x} y={y} width={width} height={height} fill="rgba(34,211,238,0.04)" rx={4} style={{ filter: 'blur(1px)' }} />
}

// ── Tooltip Shell (Tesla line top) ──────────────────────────────────────
function TooltipShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative overflow-hidden px-3.5 py-2.5 rounded-xl bg-[rgba(2,6,23,0.95)] border border-cyan-500/10 shadow-2xl backdrop-blur-xl max-w-[300px]">
      <div className="absolute top-0 left-0 right-0 h-[1px]" style={{ background: 'linear-gradient(90deg, transparent, rgba(34,211,238,0.4), transparent)' }} />
      {children}
    </div>
  )
}

// ── Tab 1 Tooltip ───────────────────────────────────────────────────────
interface MensualRow extends MesPresupuesto { mesCorto: string }

function MensualTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: MensualRow }> }) {
  if (!active || !payload?.length) return null
  const mes = payload[0].payload
  const delta = mes.costoEmpresa - mes.sinAccionesMes
  return (
    <TooltipShell>
      <p className="text-[10px] uppercase tracking-widest text-slate-500/40 mb-2 capitalize">
        {mes.mesNombre} · {mes.fteMes} personas
      </p>
      <p className="text-[12px] font-light text-slate-300 leading-relaxed mb-3">
        {'Costo total '}
        <span className="text-white font-medium">{formatCLP(mes.costoEmpresa)}</span>
        {mes.reajusteIPCMes > 0 && <> con <span style={{ color: COLOR.ipc }} className="font-normal">{formatCLP(mes.reajusteIPCMes)}</span> de IPC</>}
        {mes.meritoMes > 0 && <>{mes.reajusteIPCMes > 0 ? ' + ' : ' con '}<span style={{ color: COLOR.merito }} className="font-normal">{formatCLP(mes.meritoMes)}</span> de merito</>}
        {mes.finiquitosMes > 0 && <> y <span className="text-purple-400 font-normal">{formatCLP(mes.finiquitosMes)}</span> en finiquitos</>}
        .
      </p>
      <div className="space-y-1 text-xs font-light text-slate-300">
        <div className="flex justify-between gap-4">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: COLOR.base, boxShadow: `0 0 4px ${COLOR.base}50` }} />Base</span>
          <span className="tabular-nums text-slate-200">{formatCLP(mes.costoBaseMes)}</span>
        </div>
        {mes.reajusteIPCMes > 0 && (
          <div className="flex justify-between gap-4">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: COLOR.ipc, boxShadow: `0 0 4px ${COLOR.ipc}50` }} />IPC</span>
            <span className="tabular-nums" style={{ color: COLOR.ipc }}>+{formatCLP(mes.reajusteIPCMes)}</span>
          </div>
        )}
        {mes.meritoMes > 0 && (
          <div className="flex justify-between gap-4">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: COLOR.merito, boxShadow: `0 0 4px ${COLOR.merito}50` }} />Merito</span>
            <span className="tabular-nums" style={{ color: COLOR.merito }}>+{formatCLP(mes.meritoMes)}</span>
          </div>
        )}
        {mes.finiquitosMes > 0 && mes.finiquitosDetalle.map((f: FiniquitoEntry, i) => (
          <div key={i} className="flex justify-between gap-4">
            <span className="flex items-center gap-1.5 min-w-0"><span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: COLOR.finiquito, boxShadow: `0 0 4px ${COLOR.finiquito}50` }} /><span className="truncate">{formatNombre(f.nombre)}</span></span>
            <span className="tabular-nums text-purple-300 flex-shrink-0">+{formatCLP(f.monto)}</span>
          </div>
        ))}
        {mes.ahorroPostSalida > 0 && (
          <div className="flex justify-between gap-4">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: COLOR.ahorro, boxShadow: `0 0 4px ${COLOR.ahorro}50` }} />Ahorro</span>
            <span className="tabular-nums text-emerald-300">−{formatCLP(mes.ahorroPostSalida)}</span>
          </div>
        )}
      </div>
      <div className="mt-2 pt-2 border-t border-white/10 flex justify-between gap-4">
        <span className="text-[11px] text-slate-400 font-medium">Total</span>
        <span className="text-sm text-white font-medium tabular-nums">{formatCLP(mes.costoEmpresa)}</span>
      </div>
      <div className="flex justify-between gap-4 mt-1">
        <span className="flex items-center gap-1.5 text-[10px] text-cyan-400/60 font-light">
          <span className="inline-block w-2.5 border-t border-dashed border-cyan-400/50" />Si no haces nada
        </span>
        <span className="text-[11px] text-cyan-400/60 font-light tabular-nums">{formatCLP(mes.sinAccionesMes)}</span>
      </div>
      {delta > 0 && <p className="text-[10px] mt-0.5 font-light text-slate-400/80 italic">Este mes incluye finiquitos. El ahorro se activa desde el mes siguiente.</p>}
      {delta < 0 && <p className="text-[10px] mt-0.5 font-light text-emerald-400/80">{formatCLP(delta)} vs no hacer nada</p>}
    </TooltipShell>
  )
}

// ── Tab 1 Detail Panel ──────────────────────────────────────────────────
function MesDetailPanel({ mes, onClose }: { mes: MensualRow; onClose: () => void }) {
  const partes: string[] = []
  if (mes.finiquitosMes > 0 && mes.finiquitosDetalle.length > 0) {
    const nombres = mes.finiquitosDetalle.map((f: FiniquitoEntry) => `${formatNombre(f.nombre)} (${formatCLP(f.monto)})`).join(', ')
    partes.push(`En ${mes.mesNombre} pagas ${formatCLP(mes.finiquitosMes)} en finiquitos de ${mes.finiquitosDetalle.length} ${mes.finiquitosDetalle.length === 1 ? 'persona' : 'personas'}: ${nombres}.`)
  }
  if (mes.ahorroPostSalida > 0) partes.push(`El ahorro mensual acumulado a esta fecha es ${formatCLP(mes.ahorroPostSalida)}.`)
  if (mes.reajusteIPCMes > 0) partes.push(`El reajuste IPC suma ${formatCLP(mes.reajusteIPCMes)} sobre la base.`)
  if (mes.meritoMes > 0) partes.push(`Merito agrega ${formatCLP(mes.meritoMes)}.`)
  if (partes.length === 0) partes.push(`Mes sin eventos especiales. Costo empresa: ${formatCLP(mes.costoEmpresa)}.`)

  return (
    <div className="relative overflow-hidden mt-4 rounded-xl bg-slate-900/60 border border-slate-700/40 p-4">
      <div className="absolute top-0 left-0 right-0 h-[1px]" style={{ background: 'linear-gradient(90deg, transparent, rgba(34,211,238,0.3), transparent)' }} />
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-medium mb-2 capitalize">{mes.mesNombre} · {mes.fteMes} personas</p>
          <p className="text-sm text-slate-300 font-light leading-relaxed">{partes.join(' ')}</p>
        </div>
        <button type="button" onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors flex-shrink-0 mt-0.5" aria-label="Cerrar detalle">✕</button>
      </div>
    </div>
  )
}

// ── Tab 2 Tooltip ───────────────────────────────────────────────────────
interface MochilaRow {
  mesCorto: string; mesNombre: string; ftePct: number; sinFinPct: number; conFinPct: number
  fte: number; sinFin: number; conFin: number; baseFte: number
}

function MochilaTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: MochilaRow }> }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  const fteDrop = d.baseFte - d.fte
  const fteDropPct = d.baseFte > 0 ? Math.round((fteDrop / d.baseFte) * 100) : 0
  const costChange = d.sinFinPct - 100
  const costDir = costChange >= 0 ? 'subio' : 'bajo'
  const costAbs = Math.abs(costChange)

  return (
    <TooltipShell>
      <p className="text-[10px] uppercase tracking-widest text-slate-500/40 mb-2">{d.mesCorto}</p>
      <p className="text-[12px] font-light text-slate-300 leading-relaxed mb-2">
        <span className="text-white/50 font-normal">{d.fte} personas</span>
        {fteDrop > 0 && <span className="text-slate-500"> — {fteDrop} menos que enero (−{fteDropPct}%)</span>}.
      </p>
      <div className="pt-2 border-t border-slate-700/15 grid grid-cols-[1fr_auto] gap-x-4 gap-y-1.5 text-[11px]">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-0.5 rounded-sm bg-cyan-400 opacity-70" />
          <span className="text-slate-500 font-light">Sin finiquitos</span>
        </div>
        <span className="text-right text-cyan-400 font-normal tabular-nums">
          {formatCLP(d.sinFin)} <span className="text-slate-500/35 font-light">({d.sinFinPct}%)</span>
        </span>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-0.5 rounded-sm bg-purple-400 opacity-70" />
          <span className="text-slate-500 font-light">Con finiquitos</span>
        </div>
        <span className="text-right text-purple-400 font-normal tabular-nums">
          {formatCLP(d.conFin)} <span className="text-slate-500/35 font-light">({d.conFinPct}%)</span>
        </span>
      </div>
      <p className="text-[11px] font-light text-slate-500/45 leading-snug mt-2">
        La dotacion bajo {fteDropPct}%, pero el costo recurrente {costDir} {costAbs}%.
        {costChange > 0 && ' La diferencia es IPC y merito acumulado.'}
      </p>
    </TooltipShell>
  )
}

// ── Tab 3 Tooltip ───────────────────────────────────────────────────────
interface InerciaRow { mesCorto: string; accReal: number; accSin: number; delta: number }

function InerciaTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: InerciaRow }> }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <TooltipShell>
      <p className="text-[10px] uppercase tracking-widest text-slate-500/40 mb-2">A {d.mesCorto}</p>
      <p className="text-[12px] font-light text-slate-300 leading-relaxed mb-2">
        Sin actuar: <span className="text-slate-500 line-through decoration-cyan-400/20">{formatCLP(d.accSin)}</span>.
        {' '}Con tus decisiones: <span className="text-white font-medium">{formatCLP(d.accReal)}</span>.
      </p>
      <div className="mt-2 pt-2 border-t border-cyan-500/10 flex justify-between items-center">
        <span className="text-[11px] text-cyan-400/50 font-light">Valor de actuar</span>
        <span className="text-base text-cyan-400 font-normal tabular-nums">{formatCLP(d.delta)}</span>
      </div>
    </TooltipShell>
  )
}

// ── COMPONENTE PRINCIPAL ────────────────────────────────────────────────
export default function AniversarioBarChart({ meses }: AniversarioBarChartProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('mensual')
  const [selectedMes, setSelectedMes] = useState<number | null>(null)

  const mensualData: MensualRow[] = useMemo(
    () => meses.map(m => ({ ...m, mesCorto: m.mesNombre.slice(0, 3) })),
    [meses],
  )

  const mochilaData: MochilaRow[] = useMemo(() => {
    if (meses.length === 0) return []
    const m0 = meses[0]
    const baseFte = m0.fteMes || 1
    const baseSinFin = m0.costoBaseMes + m0.reajusteIPCMes + m0.meritoMes || 1
    const baseConFin = baseSinFin + m0.finiquitosMes || 1
    return meses.map(m => {
      const sinFin = m.costoBaseMes + m.reajusteIPCMes + m.meritoMes
      const conFin = sinFin + m.finiquitosMes
      return {
        mesCorto: m.mesNombre.slice(0, 3),
        mesNombre: m.mesNombre,
        ftePct: Math.round((m.fteMes / baseFte) * 100),
        sinFinPct: Math.round((sinFin / baseSinFin) * 100),
        conFinPct: Math.round((conFin / baseConFin) * 100),
        fte: m.fteMes,
        sinFin,
        conFin,
        baseFte,
      }
    })
  }, [meses])

  const inerciaData: InerciaRow[] = useMemo(() => {
    const acc: InerciaRow[] = []
    let accReal = 0
    let accSin = 0
    for (const m of meses) {
      accReal += m.costoEmpresa
      accSin += m.sinAccionesMes
      acc.push({
        mesCorto: m.mesNombre.slice(0, 3),
        accReal: Math.round(accReal),
        accSin: Math.round(accSin),
        delta: Math.round(accSin - accReal),
      })
    }
    return acc
  }, [meses])

  const totalAhorro = inerciaData.length > 0 ? inerciaData[inerciaData.length - 1].delta : 0
  const lastMochila = mochilaData.length > 0 ? mochilaData[mochilaData.length - 1] : null

  const selectedData = selectedMes !== null ? mensualData.find(d => d.mes === selectedMes) : null

  return (
    <div className="w-full">
      {/* Tab pills */}
      <div className="flex gap-1 mb-5 flex-wrap">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => { setActiveTab(key); setSelectedMes(null) }}
            className={`px-4 py-1.5 rounded-lg text-xs transition-all duration-200 ${
              activeTab === key
                ? 'bg-cyan-500/[0.08] border border-cyan-500/25 text-cyan-400 font-normal'
                : 'bg-transparent border border-slate-700/20 text-slate-500 font-light hover:text-slate-400'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ═══ TAB 1: MES A MES ═══ */}
      {activeTab === 'mensual' && (
        <>
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart
              data={mensualData}
              margin={{ top: 12, right: 50, left: -20, bottom: 0 }}
              onClick={e => {
                if (e?.activePayload?.[0]?.payload) {
                  const p = e.activePayload[0].payload as MensualRow
                  setSelectedMes(prev => (prev === p.mes ? null : p.mes))
                }
              }}
            >
              <Customized component={ChartGradients} />
              <XAxis dataKey="mesCorto" axisLine={false} tickLine={false} tick={TICK_STYLE_LABEL} />
              <YAxis yAxisId="cost" axisLine={false} tickLine={false} tick={TICK_STYLE_AXIS} tickFormatter={formatCLP} width={60} />
              <YAxis yAxisId="fte" orientation="right" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 9, fontWeight: 300 }} width={36} domain={['dataMin - 5', 'dataMax + 5']} />
              <Tooltip cursor={<GlowCursor />} content={<MensualTooltip />} wrapperStyle={{ outline: 'none' }} />
              <Bar yAxisId="cost" dataKey="costoBaseMes" stackId="a" fill="url(#gradBase)" radius={[0, 0, 0, 0]} style={{ cursor: 'pointer' }} />
              <Bar yAxisId="cost" dataKey="reajusteIPCMes" stackId="a" fill="url(#gradIPC)" radius={[0, 0, 0, 0]} style={{ cursor: 'pointer' }} />
              <Bar yAxisId="cost" dataKey="meritoMes" stackId="a" fill="url(#gradMerito)" radius={[0, 0, 0, 0]} style={{ cursor: 'pointer' }} />
              <Bar yAxisId="cost" dataKey="finiquitosMes" stackId="a" fill="url(#gradFin)" radius={[4, 4, 0, 0]} style={{ cursor: 'pointer' }} />
              <Line yAxisId="cost" type="monotone" dataKey="sinAccionesMes" stroke="url(#gradInercia)" strokeWidth={1.5} strokeDasharray="6 4" dot={false} activeDot={{ r: 3, fill: '#22D3EE', stroke: 'rgba(34,211,238,0.3)', strokeWidth: 4 }} isAnimationActive animationDuration={1200} animationEasing="ease-out" />
              <Line yAxisId="fte" type="stepAfter" dataKey="fteMes" stroke="#ffffff" strokeOpacity={0.75} strokeWidth={2} dot={false} activeDot={{ r: 3, fill: '#ffffff', opacity: 0.9 }} isAnimationActive animationDuration={1000} />
            </ComposedChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mt-4 text-[11px] text-slate-400 font-light">
            <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full" style={{ background: COLOR.base, boxShadow: `0 0 6px ${COLOR.base}50` }} />Base</div>
            <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full" style={{ background: COLOR.ipc, boxShadow: `0 0 6px ${COLOR.ipc}50` }} />IPC</div>
            <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full" style={{ background: COLOR.merito, boxShadow: `0 0 6px ${COLOR.merito}50` }} />Merito</div>
            <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full" style={{ background: COLOR.finiquito, boxShadow: `0 0 6px ${COLOR.finiquito}50` }} />Finiquitos</div>
            <div className="flex items-center gap-2"><span className="text-[9px] tracking-widest text-cyan-400/50 font-light leading-none">- -</span>Si no haces nada</div>
            <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.3)' }} />FTE</div>
          </div>
          {selectedData && <MesDetailPanel mes={selectedData} onClose={() => setSelectedMes(null)} />}
        </>
      )}

      {/* ═══ TAB 2: MOCHILA ═══ */}
      {activeTab === 'mochila' && (
        <>
          <p className="text-[13px] font-light text-slate-500 mb-4 leading-relaxed">
            Si costo y dotacion fueran proporcionales, las tres lineas irian juntas.
          </p>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={mochilaData} margin={{ top: 12, right: 16, left: -8, bottom: 0 }}>
              <Customized component={ChartGradients} />
              <XAxis dataKey="mesCorto" axisLine={false} tickLine={false} tick={TICK_STYLE_LABEL} />
              <YAxis axisLine={false} tickLine={false} tick={TICK_STYLE_AXIS} tickFormatter={v => `${v}%`} width={42} domain={[55, 120]} />
              <Tooltip cursor={<GlowCursor />} content={<MochilaTooltip />} wrapperStyle={{ outline: 'none' }} />
              <ReferenceLine y={100} stroke="rgba(71,85,105,0.2)" strokeDasharray="3 3" label={{ value: 'enero', position: 'right', fill: 'rgba(71,85,105,0.3)', fontSize: 9 }} />
              <Area type="monotone" dataKey="sinFinPct" fill="url(#aMochila)" stroke="none" />
              <Area type="monotone" dataKey="conFinPct" fill="url(#aFiniquito)" stroke="none" />
              <Line type="stepAfter" dataKey="ftePct" stroke="rgba(255,255,255,0.5)" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: 'rgba(255,255,255,0.7)', stroke: 'rgba(255,255,255,0.2)', strokeWidth: 4 }} />
              <Line type="monotone" dataKey="sinFinPct" stroke="#22D3EE" strokeWidth={2} strokeOpacity={0.7} dot={false} activeDot={{ r: 4, fill: '#22D3EE', stroke: 'rgba(34,211,238,0.3)', strokeWidth: 4 }} />
              <Line type="monotone" dataKey="conFinPct" stroke="#A78BFA" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#A78BFA', stroke: 'rgba(167,139,250,0.3)', strokeWidth: 4 }} />
            </ComposedChart>
          </ResponsiveContainer>
          <div className="flex gap-5 mt-3 flex-wrap text-[11px] text-slate-500 font-light">
            <div className="flex items-center gap-1.5"><span className="w-3.5 h-0 border-t-2 border-white/50" />Dotacion (% vs enero)</div>
            <div className="flex items-center gap-1.5"><span className="w-3.5 h-0 border-t-2 border-cyan-400/70" />Costo sin finiquitos</div>
            <div className="flex items-center gap-1.5"><span className="w-3.5 h-0 border-t-2 border-purple-400" />Costo con finiquitos</div>
          </div>
          {lastMochila && (() => {
            const fteDrop = lastMochila.baseFte - lastMochila.fte
            const fteDropPct = lastMochila.baseFte > 0 ? Math.round((fteDrop / lastMochila.baseFte) * 100) : 0
            const costChange = lastMochila.sinFinPct - 100
            return (
              <div className="mt-4 p-3.5 rounded-xl bg-slate-950/50 border border-slate-700/[0.15]">
                <p className="text-xs font-light text-slate-500 leading-relaxed">
                  Sacaste <span className="text-white/60 font-normal">{fteDrop} personas (−{fteDropPct}%)</span>
                  {' '}pero el costo recurrente{' '}
                  <span className="text-cyan-400 font-normal">{costChange >= 0 ? `subio ${costChange}%` : `bajo solo ${Math.abs(costChange)}%`}</span>
                  {' '}por IPC y merito acumulado.
                  {' '}Sumando finiquitos, el costo total esta en{' '}
                  <span className="text-purple-400 font-normal">{lastMochila.conFinPct}%</span>
                  {' '}de lo que pagabas en enero con{' '}
                  <span className="text-white/40">{lastMochila.ftePct}%</span>
                  {' '}de la gente.
                </p>
              </div>
            )
          })()}
        </>
      )}

      {/* ═══ TAB 3: VS INERCIA ═══ */}
      {activeTab === 'inercia' && (
        <>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={inerciaData} margin={{ top: 12, right: 16, left: -8, bottom: 0 }}>
              <Customized component={ChartGradients} />
              <XAxis dataKey="mesCorto" axisLine={false} tickLine={false} tick={TICK_STYLE_LABEL} />
              <YAxis axisLine={false} tickLine={false} tick={TICK_STYLE_AXIS} tickFormatter={formatCLP} width={55} />
              <Tooltip cursor={<GlowCursor />} content={<InerciaTooltip />} wrapperStyle={{ outline: 'none' }} />
              <Area type="monotone" dataKey="accSin" fill="url(#aDelta)" stroke="none" />
              <Area type="monotone" dataKey="accReal" fill="rgba(15,23,42,0.95)" stroke="none" />
              <Line type="monotone" dataKey="accSin" stroke="rgba(34,211,238,0.4)" strokeWidth={1.5} strokeDasharray="6 4" dot={false} activeDot={{ r: 3, fill: 'rgba(34,211,238,0.5)', stroke: 'rgba(34,211,238,0.2)', strokeWidth: 4 }} />
              <Line type="monotone" dataKey="accReal" stroke="rgba(255,255,255,0.6)" strokeWidth={2} dot={false} activeDot={{ r: 3, fill: '#fff', stroke: 'rgba(255,255,255,0.2)', strokeWidth: 4 }} />
            </ComposedChart>
          </ResponsiveContainer>
          <div className="flex gap-5 mt-3 text-[11px] text-slate-500 font-light">
            <div className="flex items-center gap-1.5"><span className="w-3.5 h-0 border-t-2 border-white/50" />Con tus decisiones</div>
            <div className="flex items-center gap-1.5"><span className="w-3.5 h-0 border-t-[1.5px] border-dashed border-cyan-400/40" />Si no haces nada</div>
          </div>
          <div className="mt-4 p-4 rounded-xl bg-slate-950/50 border border-slate-700/[0.15] flex justify-between items-center flex-wrap gap-3">
            <div>
              <p className="text-[11px] text-slate-500 font-light mb-1">Valor de actuar (acumulado 12 meses)</p>
              <p className="text-xs font-light text-slate-500">La distancia entre ambas lineas es dinero que ahorraste.</p>
            </div>
            <span className="text-[32px] font-extralight text-cyan-400 tabular-nums tracking-tight">
              {formatCLP(totalAhorro)}
            </span>
          </div>
        </>
      )}
    </div>
  )
}
