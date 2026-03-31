'use client'

// ════════════════════════════════════════════════════════════════════════════
// P&L TALENT RADAR MODAL — Brecha por Familia de Cargo
// src/app/dashboard/executive-hub/components/PLTalent/components/PLTalentRadarModal.tsx
// ════════════════════════════════════════════════════════════════════════════
// Radar chart: 4 familias de cargo × RoleFit real vs benchmark 75%
// Datos: brecha.byCargoFamily (zero fetch adicional)
// Estilo: FocalizaHR Enterprise — dark, font-light, cyan/purple
// ════════════════════════════════════════════════════════════════════════════

import { memo, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar as RechartsRadar,
  Tooltip,
} from 'recharts'
import { formatCurrency } from '../PLTalent.utils'
import type { BrechaByCargoFamily } from '../PLTalent.types'

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

interface PLTalentRadarModalProps {
  isOpen: boolean
  onClose: () => void
  byCargoFamily: BrechaByCargoFamily[]
  totalPeople: number
}

// ════════════════════════════════════════════════════════════════════════════
// LABELS CORTOS PARA EJES
// ════════════════════════════════════════════════════════════════════════════

const SHORT_LABELS: Record<string, string> = {
  alta_gerencia: 'Alta Gerencia',
  mandos_medios: 'Mandos Medios',
  profesionales: 'Profesionales',
  base_operativa: 'Base Operativa',
}

// ════════════════════════════════════════════════════════════════════════════
// TOOLTIP
// ════════════════════════════════════════════════════════════════════════════

function RadarTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const data = payload[0]?.payload
  if (!data) return null
  return (
    <div className="bg-slate-950/90 backdrop-blur-xl border border-slate-700/50 px-4 py-3 rounded-xl shadow-2xl min-w-[180px]">
      <p className="text-sm font-medium text-white mb-2">{data.familia}</p>
      <div className="space-y-1 text-xs">
        <div className="flex justify-between">
          <span className="text-slate-400">RoleFit</span>
          <span className="font-mono font-medium text-cyan-400">{data.roleFit}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Personas</span>
          <span className="font-mono text-slate-300">{data.headcount} ({data.pctHeadcount}%)</span>
        </div>
        {data.gapMonthly > 0 && (
          <div className="flex justify-between">
            <span className="text-slate-400">Costo</span>
            <span className="font-mono text-purple-400">{formatCurrency(data.gapMonthly)}/mes</span>
          </div>
        )}
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ════════════════════════════════════════════════════════════════════════════

export default memo(function PLTalentRadarModal({
  isOpen,
  onClose,
  byCargoFamily,
  totalPeople,
}: PLTalentRadarModalProps) {

  const chartData = useMemo(() => {
    if (!byCargoFamily.length) return []
    return byCargoFamily.map(f => ({
      familia: SHORT_LABELS[f.acotadoGroup] || f.label,
      roleFit: f.avgRoleFit,
      benchmark: 75,
      headcount: f.headcount,
      pctHeadcount: totalPeople > 0 ? Math.round((f.headcount / totalPeople) * 100) : 0,
      gapMonthly: f.gapMonthly,
    }))
  }, [byCargoFamily])

  if (!isOpen || typeof document === 'undefined') return null

  return createPortal(
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={onClose} />

      {/* Modal — centrado en viewport visible */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-700/50 rounded-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto">
          <div className="fhr-top-line" />

          {/* Header — Patrón FocalizaHR */}
          <div className="text-center pt-8 pb-4 px-6 relative">
            <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-slate-800 rounded-lg transition-colors z-10">
              <X className="w-4 h-4 text-slate-400" />
            </button>

            <h1 className="text-2xl md:text-3xl font-extralight text-white tracking-tight">
              Concentración
            </h1>
            <h1 className="text-2xl md:text-3xl font-extralight tracking-tight bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
              Brecha
            </h1>

            <div className="flex items-center justify-center gap-3 my-5">
              <div className="h-px w-12 bg-white/20" />
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              <div className="h-px w-12 bg-white/20" />
            </div>
          </div>

          {/* Radar Chart */}
          <div className="px-6 pt-4">
            <div className="w-full h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
                  <PolarGrid stroke="#334155" strokeDasharray="4 4" />
                  <PolarAngleAxis
                    dataKey="familia"
                    tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 500 }}
                  />
                  <PolarRadiusAxis
                    domain={[0, 100]}
                    tick={false}
                    axisLine={false}
                  />

                  {/* Benchmark 75% */}
                  <RechartsRadar
                    name="Estándar mínimo"
                    dataKey="benchmark"
                    stroke="#475569"
                    fill="transparent"
                    strokeWidth={1}
                    strokeDasharray="6 4"
                    isAnimationActive={false}
                  />

                  {/* RoleFit real */}
                  <RechartsRadar
                    name="RoleFit real"
                    dataKey="roleFit"
                    stroke="#22D3EE"
                    fill="rgba(34, 211, 238, 0.15)"
                    fillOpacity={1}
                    strokeWidth={2}
                    isAnimationActive={false}
                    dot={{ r: 4, fill: '#22D3EE', strokeWidth: 0 }}
                  />

                  <Tooltip content={<RadarTooltip />} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Leyenda */}
            <div className="flex items-center justify-center gap-6 text-xs text-slate-500 mt-2 mb-4">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-cyan-400 rounded" />
                RoleFit real
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-slate-600 rounded border-dashed" style={{ borderTop: '1px dashed #475569', height: 0 }} />
                Estándar 75%
              </span>
            </div>
          </div>

          {/* Detalle por familia — compacto */}
          <div className="px-6 pb-6">
            <div>
              {byCargoFamily.map(f => {
                const pct = totalPeople > 0 ? Math.round((f.headcount / totalPeople) * 100) : 0
                const isBelowStandard = f.avgRoleFit < 75
                return (
                  <div key={f.acotadoGroup} className="flex items-center justify-between py-1.5 border-b border-slate-800/30 last:border-0">
                    <span className="text-xs font-light text-slate-400">
                      {f.label} · {f.headcount} ({pct}%)
                    </span>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className={`text-xs font-mono font-medium ${isBelowStandard ? 'text-amber-400' : 'text-cyan-400'}`}>
                        {f.avgRoleFit}%
                      </span>
                      {f.gapMonthly > 0 && (
                        <span className="text-xs text-purple-400 font-mono">
                          {formatCurrency(f.gapMonthly)}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body
  )
})
