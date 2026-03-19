'use client'

// ════════════════════════════════════════════════════════════════════════════
// HEATMAP TAB — Grid Capa × Gerencia + Cell Drill-Down
// Extraído de RoleFitMatrix.tsx
// ════════════════════════════════════════════════════════════════════════════

import { memo, useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { Loader2, ArrowLeft } from 'lucide-react'
import { LAYER_ORDER, ACOTADO_LABELS } from '../Capacidades.constants'
import { getScoreColor, getScoreTextColor, getStatusColor, getGapBarColor } from '../Capacidades.utils'
import type { CapacidadesData, CellDrillDown } from '../Capacidades.types'

interface HeatmapTabProps {
  data: CapacidadesData
  cycleId?: string
}

export default memo(function HeatmapTab({ data, cycleId }: HeatmapTabProps) {
  const [selectedCell, setSelectedCell] = useState<{ layer: string; gerencia: string } | null>(null)
  const [drillDown, setDrillDown] = useState<CellDrillDown | null>(null)
  const [drillLoading, setDrillLoading] = useState(false)

  // Extract unique gerencias
  const gerenciaSet = new Set<string>()
  for (const gerencias of Object.values(data.matrix)) {
    for (const name of Object.keys(gerencias)) gerenciaSet.add(name)
  }
  const gerencias = Array.from(gerenciaSet).sort()
  const layers = LAYER_ORDER.filter(l => data.byLayer[l] !== undefined)

  const handleCellClick = useCallback(async (layer: string, gerencia: string) => {
    const isSelected = selectedCell?.layer === layer && selectedCell?.gerencia === gerencia
    if (isSelected) { setSelectedCell(null); setDrillDown(null); return }

    setSelectedCell({ layer, gerencia })
    setDrillDown(null)
    if (!cycleId) return

    setDrillLoading(true)
    try {
      const params = new URLSearchParams({ cycleId, layer, gerencia })
      const res = await fetch(`/api/executive-hub/capabilities?${params}`)
      const json = await res.json()
      if (json.success && json.data?.drillDown) setDrillDown(json.data.drillDown)
    } catch { /* fallback to local */ } finally { setDrillLoading(false) }
  }, [selectedCell, cycleId])

  const selectedFit = selectedCell
    ? data.matrix[selectedCell.layer]?.[selectedCell.gerencia]
    : null

  return (
    <div className="space-y-4">

      {/* Grid */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="text-[9px] text-slate-600 uppercase tracking-wider text-left p-1.5 w-24 font-medium">Capa</th>
              {gerencias.map(g => (
                <th key={g} className="text-[9px] text-slate-600 uppercase tracking-wider text-center p-1.5 font-medium max-w-[80px]">
                  <span className="block truncate" title={g}>{g}</span>
                </th>
              ))}
              <th className="text-[9px] text-slate-600 uppercase tracking-wider text-center p-1.5 w-14 font-medium">Avg</th>
            </tr>
          </thead>
          <tbody>
            {layers.map(layer => (
              <tr key={layer}>
                <td className="text-[10px] text-slate-400 font-medium p-1.5 whitespace-nowrap">
                  {ACOTADO_LABELS[layer] || layer}
                </td>
                {gerencias.map(gerencia => {
                  const fit = data.matrix[layer]?.[gerencia]
                  const isWorst = data.worstCell.layer === layer && data.worstCell.gerencia === gerencia
                  const isSelected = selectedCell?.layer === layer && selectedCell?.gerencia === gerencia

                  if (!fit) {
                    return (
                      <td key={gerencia} className="p-0.5">
                        <div className="h-10 rounded-md bg-slate-900/30 flex items-center justify-center">
                          <span className="text-[9px] text-slate-700">—</span>
                        </div>
                      </td>
                    )
                  }

                  return (
                    <td key={gerencia} className="p-0.5">
                      <button
                        onClick={() => handleCellClick(layer, gerencia)}
                        className={cn(
                          'w-full h-10 rounded-md border flex flex-col items-center justify-center transition-all cursor-pointer',
                          getScoreColor(fit.avgRoleFit),
                          isWorst && 'ring-1 ring-red-500/50',
                          isSelected && 'ring-2 ring-white/40 scale-105'
                        )}
                        title={`${ACOTADO_LABELS[layer] || layer} · ${gerencia}: ${fit.avgRoleFit}% (${fit.count})`}
                      >
                        <span className="text-xs font-bold font-mono">{fit.avgRoleFit}%</span>
                        <span className="text-[8px] text-slate-500">{fit.count}</span>
                      </button>
                    </td>
                  )
                })}
                <td className="p-0.5">
                  <div className="h-10 rounded-md flex items-center justify-center bg-slate-800/50">
                    <span className={cn('text-xs font-bold font-mono', getScoreTextColor(data.byLayer[layer]))}>
                      {data.byLayer[layer]}%
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-3 text-[9px]">
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-cyan-500/30" /> ≥90</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-purple-500/30" /> ≥75</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-amber-500/30" /> ≥60</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-red-500/30" /> &lt;60</span>
      </div>

      {/* Cell Drill-Down */}
      {selectedCell && (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-3 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button onClick={() => { setSelectedCell(null); setDrillDown(null) }} className="text-slate-500 hover:text-white transition-colors">
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs text-slate-400">
                {ACOTADO_LABELS[selectedCell.layer] || selectedCell.layer} · {selectedCell.gerencia}
              </span>
            </div>
            {(drillDown || selectedFit) && (
              <span className={cn('text-sm font-bold font-mono', getScoreTextColor(
                drillDown?.summary.avgRoleFit ?? selectedFit?.avgRoleFit ?? 0
              ))}>
                {drillDown?.summary.avgRoleFit ?? selectedFit?.avgRoleFit}%
              </span>
            )}
          </div>

          {drillLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-5 h-5 text-slate-600 animate-spin" />
            </div>
          ) : drillDown ? (
            <>
              <div className="grid grid-cols-4 gap-2">
                <MiniStat label="Personas" value={`${drillDown.summary.headcount}`} />
                <MiniStat label="Cargos" value={`${drillDown.summary.cargos}`} />
                <MiniStat label="Gap" value={`${drillDown.summary.gap > 0 ? '+' : ''}${drillDown.summary.gap}%`} />
                <MiniStat label="Estado" value={drillDown.summary.status} color={getStatusColor(drillDown.summary.status)} />
              </div>

              {drillDown.competencyGaps.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[9px] text-slate-600 uppercase tracking-wider font-medium">Brechas por Competencia</p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-[10px] border-collapse">
                      <thead>
                        <tr className="text-slate-600">
                          <th className="text-left p-1 font-medium">Competencia</th>
                          <th className="text-center p-1 font-medium w-12">Esp.</th>
                          <th className="text-center p-1 font-medium w-12">Act.</th>
                          <th className="text-center p-1 font-medium w-12">Gap</th>
                          <th className="text-right p-1 font-medium w-16">Afectados</th>
                        </tr>
                      </thead>
                      <tbody>
                        {drillDown.competencyGaps.slice(0, 8).map((g, i) => (
                          <tr key={i} className="border-t border-slate-800/50">
                            <td className="p-1 text-slate-400 truncate max-w-[140px]" title={g.competency}>{g.competency}</td>
                            <td className="p-1 text-center text-slate-500 font-mono">{g.expected}</td>
                            <td className="p-1 text-center text-white font-mono">{g.actual}</td>
                            <td className="p-1 text-center">
                              <span className={cn('font-mono font-bold', g.gap >= 0 ? 'text-emerald-400' : g.gap >= -0.5 ? 'text-amber-400' : 'text-red-400')}>
                                {g.gap > 0 ? '+' : ''}{g.gap}
                              </span>
                            </td>
                            <td className="p-1 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <div className="w-12 h-2 bg-slate-800/50 rounded-full overflow-hidden">
                                  <div className={cn('h-full rounded-full', getGapBarColor(g.gap))} style={{ width: `${Math.min(g.affectedPercent, 100)}%` }} />
                                </div>
                                <span className="text-slate-500 font-mono">{g.affectedPercent}%</span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {drillDown.topEmployees.length > 0 && (
                <div className="space-y-1">
                  <p className="text-[9px] text-slate-600 uppercase tracking-wider font-medium">Personas con Mayor Brecha</p>
                  {drillDown.topEmployees.map((emp, i) => (
                    <div key={i} className="flex items-center justify-between text-[10px] px-1">
                      <span className="text-slate-400 truncate">{emp.name}</span>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-slate-600">{emp.position}</span>
                        <span className={cn('font-mono font-bold', getScoreTextColor(emp.roleFitScore))}>{emp.roleFitScore}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : selectedFit ? (
            <>
              <div className="text-[10px] text-slate-500">{selectedFit.count} empleados evaluados</div>
              {selectedFit.topGaps.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[9px] text-slate-600 uppercase tracking-wider font-medium">Brechas principales</span>
                  {selectedFit.topGaps.map((g, i) => (
                    <div key={i} className="flex items-center justify-between text-[10px]">
                      <span className="text-slate-400">{g.competency}</span>
                      <span className="text-red-400 font-mono">{g.affectedCount} afectados</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : null}
        </div>
      )}
    </div>
  )
})

function MiniStat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="text-center px-2 py-1.5 rounded-md bg-slate-900/50">
      <p className={cn('text-xs font-bold font-mono', color || 'text-white')}>{value}</p>
      <p className="text-[8px] text-slate-600 uppercase tracking-wider">{label}</p>
    </div>
  )
}
