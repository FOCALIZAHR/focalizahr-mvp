'use client'

import { memo, useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { Loader2, ArrowLeft, GraduationCap, Target, ShieldAlert, Rocket, Minus } from 'lucide-react'
import { TALENT_INTELLIGENCE_THRESHOLDS } from '@/config/performanceClassification'

const ROLE_FIT_HIGH = TALENT_INTELLIGENCE_THRESHOLDS.ROLE_FIT_HIGH

// Labels duplicados de PositionAdapter (server-only, no importable en client)
const ACOTADO_LABELS: Record<string, string> = {
  'alta_gerencia': 'Alta Gerencia',
  'mandos_medios': 'Mandos Medios',
  'profesionales': 'Profesionales',
  'base_operativa': 'Base Operativa',
  'sin_clasificar': 'Sin Clasificar'
}

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

interface LayerGerenciaFit {
  avgRoleFit: number
  count: number
  topGaps: Array<{ competency: string; gap: number; affectedCount: number }>
}

interface CompetencyGap {
  competency: string
  competencyCode: string
  expected: number
  actual: number
  gap: number
  affectedCount: number
  affectedPercent: number
}

interface FocusClassification {
  competencyCode: string
  competencyName: string
  impact: 'BLOQUEA' | 'IMPULSA' | 'NEUTRO'
  gap: number
  actual: number
  expected: number
  priority: number
}

interface StrategicFocusResult {
  focus: string
  focusLabel: string
  blockers: FocusClassification[]
  enablers: FocusClassification[]
  neutral: FocusClassification[]
}

interface AvailableFocus {
  key: string
  label: string
  description: string
}

interface CellDrillDown {
  summary: {
    avgRoleFit: number
    headcount: number
    cargos: number
    expectedFit: number
    gap: number
    status: string
  }
  competencyGaps: CompetencyGap[]
  topEmployees: Array<{ name: string; position: string; roleFitScore: number }>
}

interface RoleFitMatrixProps {
  data: {
    overall: number
    byLayer: Record<string, number>
    matrix: Record<string, Record<string, LayerGerenciaFit>>
    worstCell: { layer: string; gerencia: string; score: number }
    investmentPriorities: Array<{
      layer: string
      layerLabel: string
      gerencia: string
      avgRoleFit: number
      gap: number
      headcount: number
      topGaps: string[]
    }>
    strategicFocus?: StrategicFocusResult[]
    availableFoci?: AvailableFocus[]
  }
  cycleId?: string
}

// ════════════════════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════════════════════

const LAYER_ORDER = ['alta_gerencia', 'mandos_medios', 'profesionales', 'base_operativa', 'sin_clasificar']

function getScoreColor(score: number): string {
  if (score >= 90) return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
  if (score >= ROLE_FIT_HIGH) return 'bg-purple-500/20 text-purple-400 border-purple-500/30'
  if (score >= 60) return 'bg-amber-500/20 text-amber-400 border-amber-500/30'
  return 'bg-red-500/20 text-red-400 border-red-500/30'
}

function getScoreTextColor(score: number): string {
  if (score >= 90) return 'text-cyan-400'
  if (score >= ROLE_FIT_HIGH) return 'text-purple-400'
  if (score >= 60) return 'text-amber-400'
  return 'text-red-400'
}

function getStatusColor(status: string): string {
  if (status === 'SALUDABLE') return 'text-emerald-400'
  if (status === 'ATENCION') return 'text-amber-400'
  return 'text-red-400'
}

function getGapBarColor(gap: number): string {
  if (gap >= 0) return 'bg-emerald-500/50'
  if (gap >= -0.5) return 'bg-amber-500/40'
  return 'bg-red-500/50'
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ════════════════════════════════════════════════════════════════════════════

export const RoleFitMatrix = memo(function RoleFitMatrix({ data, cycleId }: RoleFitMatrixProps) {
  const [selectedCell, setSelectedCell] = useState<{ layer: string; gerencia: string } | null>(null)
  const [drillDown, setDrillDown] = useState<CellDrillDown | null>(null)
  const [drillLoading, setDrillLoading] = useState(false)
  const [selectedFocusIdx, setSelectedFocusIdx] = useState(0)

  // Extract unique gerencias (columns) across all layers
  const gerenciaSet = new Set<string>()
  for (const gerencias of Object.values(data.matrix)) {
    for (const name of Object.keys(gerencias)) {
      gerenciaSet.add(name)
    }
  }
  const gerencias = Array.from(gerenciaSet).sort()

  // Filter layers that have data, preserving order
  const layers = LAYER_ORDER.filter(l => data.byLayer[l] !== undefined)

  // Fetch drill-down from API
  const handleCellClick = useCallback(async (layer: string, gerencia: string) => {
    const isSelected = selectedCell?.layer === layer && selectedCell?.gerencia === gerencia
    if (isSelected) {
      setSelectedCell(null)
      setDrillDown(null)
      return
    }

    setSelectedCell({ layer, gerencia })
    setDrillDown(null)

    if (!cycleId) return

    setDrillLoading(true)
    try {
      const params = new URLSearchParams({ cycleId, layer, gerencia })
      const res = await fetch(`/api/executive-hub/capabilities?${params}`)
      const json = await res.json()
      if (json.success && json.data?.drillDown) {
        setDrillDown(json.data.drillDown)
      }
    } catch {
      // Silently fail — user sees local data from matrix
    } finally {
      setDrillLoading(false)
    }
  }, [selectedCell, cycleId])

  // Local cell detail (fallback if no API drill-down)
  const selectedFit = selectedCell
    ? data.matrix[selectedCell.layer]?.[selectedCell.gerencia]
    : null

  return (
    <div className="space-y-4">

      {/* ── Overall score ── */}
      <div className="text-center">
        <span className={cn('text-4xl font-bold font-mono', getScoreTextColor(data.overall))}>
          {data.overall}%
        </span>
        <p className="text-xs text-slate-500 mt-1">Role Fit Organizacional</p>
      </div>

      {/* ── Heatmap Grid ── */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="text-[9px] text-slate-600 uppercase tracking-wider text-left p-1.5 w-24 font-medium">
                Capa
              </th>
              {gerencias.map(g => (
                <th key={g} className="text-[9px] text-slate-600 uppercase tracking-wider text-center p-1.5 font-medium max-w-[80px]">
                  <span className="block truncate" title={g}>{g}</span>
                </th>
              ))}
              <th className="text-[9px] text-slate-600 uppercase tracking-wider text-center p-1.5 w-14 font-medium">
                Avg
              </th>
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

      {/* ── Legend ── */}
      <div className="flex items-center justify-center gap-3 text-[9px]">
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-cyan-500/30" /> ≥90</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-purple-500/30" /> ≥75</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-amber-500/30" /> ≥60</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-red-500/30" /> &lt;60</span>
      </div>

      {/* ── Cell Drill-Down (from API) ── */}
      {selectedCell && (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-3 space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setSelectedCell(null); setDrillDown(null) }}
                className="text-slate-500 hover:text-white transition-colors"
              >
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
              {/* Summary */}
              <div className="grid grid-cols-4 gap-2">
                <MiniStat label="Personas" value={`${drillDown.summary.headcount}`} />
                <MiniStat label="Cargos" value={`${drillDown.summary.cargos}`} />
                <MiniStat label="Gap" value={`${drillDown.summary.gap > 0 ? '+' : ''}${drillDown.summary.gap}%`} />
                <MiniStat
                  label="Estado"
                  value={drillDown.summary.status}
                  color={getStatusColor(drillDown.summary.status)}
                />
              </div>

              {/* Competency Gaps */}
              {drillDown.competencyGaps.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[9px] text-slate-600 uppercase tracking-wider font-medium">
                    Brechas por Competencia
                  </p>
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
                            <td className="p-1 text-slate-400 truncate max-w-[140px]" title={g.competency}>
                              {g.competency}
                            </td>
                            <td className="p-1 text-center text-slate-500 font-mono">{g.expected}</td>
                            <td className="p-1 text-center text-white font-mono">{g.actual}</td>
                            <td className="p-1 text-center">
                              <span className={cn(
                                'font-mono font-bold',
                                g.gap >= 0 ? 'text-emerald-400' : g.gap >= -0.5 ? 'text-amber-400' : 'text-red-400'
                              )}>
                                {g.gap > 0 ? '+' : ''}{g.gap}
                              </span>
                            </td>
                            <td className="p-1 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <div className="w-12 h-2 bg-slate-800/50 rounded-full overflow-hidden">
                                  <div
                                    className={cn('h-full rounded-full', getGapBarColor(g.gap))}
                                    style={{ width: `${Math.min(g.affectedPercent, 100)}%` }}
                                  />
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

              {/* Top Employees (ADMIN only) */}
              {drillDown.topEmployees.length > 0 && (
                <div className="space-y-1">
                  <p className="text-[9px] text-slate-600 uppercase tracking-wider font-medium">
                    Personas con Mayor Brecha
                  </p>
                  {drillDown.topEmployees.map((emp, i) => (
                    <div key={i} className="flex items-center justify-between text-[10px] px-1">
                      <span className="text-slate-400 truncate">{emp.name}</span>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-slate-600">{emp.position}</span>
                        <span className={cn('font-mono font-bold', getScoreTextColor(emp.roleFitScore))}>
                          {emp.roleFitScore}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : selectedFit ? (
            /* Fallback: local data from matrix */
            <>
              <div className="text-[10px] text-slate-500">
                {selectedFit.count} empleados evaluados
              </div>
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

      {/* ── Investment priorities L&D ── */}
      {data.investmentPriorities.length > 0 && (
        <div>
          <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <GraduationCap className="w-3 h-3" />
            Prioridades de Inversión L&D
          </p>
          <div className="space-y-2">
            {data.investmentPriorities.slice(0, 5).map((p, i) => (
              <div key={i} className="px-3 py-2 rounded-lg bg-slate-800/40 border border-white/5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-white font-medium">
                    {p.layerLabel} · {p.gerencia}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className={cn('text-xs font-mono font-bold', getScoreTextColor(p.avgRoleFit))}>
                      {p.avgRoleFit}%
                    </span>
                    <span className="text-[10px] text-slate-600">({p.headcount})</span>
                  </div>
                </div>
                {p.topGaps.length > 0 && (
                  <p className="text-[10px] text-slate-500">
                    Brechas: {p.topGaps.slice(0, 3).join(' · ')}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Strategic Focus BLOQUEA/IMPULSA ── */}
      {data.strategicFocus && data.strategicFocus.length > 0 && data.availableFoci && (
        <StrategicFocusPanel
          foci={data.strategicFocus}
          availableFoci={data.availableFoci}
          selectedIdx={selectedFocusIdx}
          onSelectFocus={setSelectedFocusIdx}
        />
      )}
    </div>
  )
})

// ════════════════════════════════════════════════════════════════════════════
// MINI STAT
// ════════════════════════════════════════════════════════════════════════════

function MiniStat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="text-center px-2 py-1.5 rounded-md bg-slate-900/50">
      <p className={cn('text-xs font-bold font-mono', color || 'text-white')}>{value}</p>
      <p className="text-[8px] text-slate-600 uppercase tracking-wider">{label}</p>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// STRATEGIC FOCUS PANEL
// ════════════════════════════════════════════════════════════════════════════

function StrategicFocusPanel({
  foci,
  availableFoci,
  selectedIdx,
  onSelectFocus
}: {
  foci: StrategicFocusResult[]
  availableFoci: AvailableFocus[]
  selectedIdx: number
  onSelectFocus: (idx: number) => void
}) {
  const current = foci[selectedIdx]
  if (!current) return null

  return (
    <div className="space-y-3">
      <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
        <Target className="w-3 h-3" />
        Foco Estratégico
      </p>

      {/* Focus selector pills */}
      <div className="flex flex-wrap gap-1.5">
        {availableFoci.map((f, i) => (
          <button
            key={f.key}
            onClick={() => onSelectFocus(i)}
            className={cn(
              'px-2.5 py-1 rounded-md text-[10px] font-medium transition-all border',
              selectedIdx === i
                ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400'
                : 'bg-slate-800/40 border-white/5 text-slate-500 hover:text-slate-300 hover:border-white/10'
            )}
            title={f.description}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Blockers */}
      {current.blockers.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5">
            <ShieldAlert className="w-3 h-3 text-red-400" />
            <span className="text-[9px] text-red-400 uppercase tracking-wider font-bold">
              Bloquea tu meta ({current.blockers.length})
            </span>
          </div>
          {current.blockers.map((b, i) => (
            <div
              key={i}
              className="flex items-center justify-between px-3 py-1.5 rounded-md bg-red-500/5 border border-red-500/15"
            >
              <div className="min-w-0 flex-1">
                <span className="text-[10px] text-white truncate block">{b.competencyName}</span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-[10px] font-mono text-slate-500">
                  {b.actual}/{b.expected}
                </span>
                <span className={cn(
                  'text-[10px] font-mono font-bold',
                  b.gap >= 0 ? 'text-emerald-400' : 'text-red-400'
                )}>
                  {b.gap > 0 ? '+' : ''}{b.gap}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Enablers */}
      {current.enablers.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5">
            <Rocket className="w-3 h-3 text-emerald-400" />
            <span className="text-[9px] text-emerald-400 uppercase tracking-wider font-bold">
              Impulsa tu meta ({current.enablers.length})
            </span>
          </div>
          {current.enablers.map((e, i) => (
            <div
              key={i}
              className="flex items-center justify-between px-3 py-1.5 rounded-md bg-emerald-500/5 border border-emerald-500/15"
            >
              <div className="min-w-0 flex-1">
                <span className="text-[10px] text-white truncate block">{e.competencyName}</span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-[10px] font-mono text-slate-500">
                  {e.actual}/{e.expected}
                </span>
                <span className={cn(
                  'text-[10px] font-mono font-bold',
                  e.gap >= 0 ? 'text-emerald-400' : 'text-amber-400'
                )}>
                  {e.gap > 0 ? '+' : ''}{e.gap}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Neutral (collapsed) */}
      {current.neutral.length > 0 && (
        <div className="flex items-center gap-1.5">
          <Minus className="w-3 h-3 text-slate-600" />
          <span className="text-[9px] text-slate-600 uppercase tracking-wider">
            Neutro: {current.neutral.map(n => n.competencyName).join(', ')}
          </span>
        </div>
      )}
    </div>
  )
}
