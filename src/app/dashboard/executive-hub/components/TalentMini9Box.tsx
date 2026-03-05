'use client'

import { memo } from 'react'
import { cn } from '@/lib/utils'
import { Dna, AlertTriangle } from 'lucide-react'

// ════════════════════════════════════════════════════════════════════════════
// NINE BOX LABELS (matching NineBoxPosition enum)
// ════════════════════════════════════════════════════════════════════════════

const NINE_BOX_GRID = [
  // Row 1 (top): High Potential
  { key: 'growth_potential', label: 'Potencial', row: 0, col: 0, color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  { key: 'future_star', label: 'Futura Estrella', row: 0, col: 1, color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  { key: 'star', label: 'Estrella', row: 0, col: 2, color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
  // Row 2 (mid): Medium Potential
  { key: 'inconsistent', label: 'Inconsistente', row: 1, col: 0, color: 'bg-red-500/10 text-red-400 border-red-500/20' },
  { key: 'core_player', label: 'Core Player', row: 1, col: 1, color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  { key: 'high_performer', label: 'High Performer', row: 1, col: 2, color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  // Row 3 (bottom): Low Potential
  { key: 'risk', label: 'Riesgo', row: 2, col: 0, color: 'bg-red-500/20 text-red-400 border-red-500/30' },
  { key: 'effective', label: 'Efectivo', row: 2, col: 1, color: 'bg-slate-500/20 text-slate-400 border-slate-500/30' },
  { key: 'solid_contributor', label: 'Sólido', row: 2, col: 2, color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
]

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

interface TalentMini9BoxProps {
  onSelectGerencia?: (gerencia: string) => void
  data: {
    nineBox: {
      total: number
      summary: Array<{ position: string; count: number; percent: number }>
    }
    distribution: {
      total: number
      distribution: Array<{ level: string; calculatedCount: number; calculatedPercent: number }>
    }
    starConcentration?: {
      totalStars: number
      concentration: Array<{ gerencia: string; starsCount: number; starsPercent: number }>
      concentrationRisk: boolean
      riskMessage: string | null
    }
    orgDNA?: {
      topStrength: { competency: string; avgTarget: number } | null
      topDevelopment: { competency: string; avgTarget: number } | null
      insight: string | null
    }
  }
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ════════════════════════════════════════════════════════════════════════════

export const TalentMini9Box = memo(function TalentMini9Box({ data, onSelectGerencia }: TalentMini9BoxProps) {
  const { summary } = data.nineBox
  const countMap: Record<string, number> = {}
  summary.forEach(s => { countMap[s.position] = s.count })

  return (
    <div className="space-y-5">

      {/* ── 9-Box Grid ── */}
      <div>
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-[9px] text-slate-600 uppercase tracking-wider">Bajo Desempeño →</span>
          <span className="text-[9px] text-slate-600 uppercase tracking-wider">→ Alto Desempeño</span>
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          {NINE_BOX_GRID.map(cell => {
            const count = countMap[cell.key] || 0
            return (
              <div
                key={cell.key}
                className={cn(
                  'rounded-lg border p-2 text-center min-h-[52px] flex flex-col items-center justify-center',
                  count > 0 ? cell.color : 'bg-slate-900/30 border-slate-800/30 text-slate-700'
                )}
              >
                <span className="text-lg font-bold">{count}</span>
                <span className="text-[8px] uppercase tracking-wider font-medium leading-tight">
                  {cell.label}
                </span>
              </div>
            )
          })}
        </div>

        <div className="flex items-center justify-between mt-2 px-1">
          <span className="text-[9px] text-slate-600 uppercase tracking-wider">↑ Alto Potencial</span>
          <span className="text-[9px] text-slate-600 uppercase tracking-wider">Bajo Potencial ↓</span>
        </div>

        <p className="text-center text-xs text-slate-500 mt-2">
          {data.nineBox.total} empleados evaluados
        </p>
      </div>

      {/* ── ADN Organizacional ── */}
      {data.orgDNA && (data.orgDNA.topStrength || data.orgDNA.topDevelopment) && (
        <div className="space-y-2">
          <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
            <Dna className="w-3 h-3" />
            ADN Organizacional
          </p>

          <div className="grid grid-cols-2 gap-2">
            {data.orgDNA.topStrength && (
              <div className="px-3 py-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                <p className="text-[9px] text-emerald-400 uppercase tracking-wider font-bold mb-1">Fortaleza</p>
                <p className="text-xs text-white font-medium leading-tight">{data.orgDNA.topStrength.competency}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">{data.orgDNA.topStrength.avgTarget}/5</p>
              </div>
            )}
            {data.orgDNA.topDevelopment && (
              <div className="px-3 py-2.5 rounded-lg bg-amber-500/5 border border-amber-500/20">
                <p className="text-[9px] text-amber-400 uppercase tracking-wider font-bold mb-1">Desarrollo</p>
                <p className="text-xs text-white font-medium leading-tight">{data.orgDNA.topDevelopment.competency}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">{data.orgDNA.topDevelopment.avgTarget}/5</p>
              </div>
            )}
          </div>

          {data.orgDNA.insight && (
            <p className="text-[10px] text-slate-500 italic px-1">
              {data.orgDNA.insight}
            </p>
          )}
        </div>
      )}

      {/* ── Concentración de Estrellas por Gerencia ── */}
      {data.starConcentration && data.starConcentration.totalStars > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
            Estrellas por Gerencia ({data.starConcentration.totalStars})
          </p>

          {/* Risk alert */}
          {data.starConcentration.concentrationRisk && data.starConcentration.riskMessage && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/5 border border-amber-500/20">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
              <span className="text-[10px] text-amber-300">{data.starConcentration.riskMessage}</span>
            </div>
          )}

          {/* Horizontal bars */}
          <div className="space-y-1.5">
            {data.starConcentration.concentration.slice(0, 6).map(item => (
              <div key={item.gerencia} className="flex items-center gap-2">
                <button
                  className="text-[10px] text-slate-400 hover:text-cyan-400 w-24 truncate flex-shrink-0 text-left transition-colors"
                  title={`Filtrar por ${item.gerencia}`}
                  onClick={() => onSelectGerencia?.(item.gerencia)}
                >
                  {item.gerencia}
                </button>
                <div className="flex-1 h-4 bg-slate-800/50 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all',
                      item.starsPercent > 40 ? 'bg-amber-500/60' : 'bg-cyan-500/40'
                    )}
                    style={{ width: `${Math.max(item.starsPercent, 3)}%` }}
                  />
                </div>
                <span className="text-[10px] font-mono text-slate-400 w-10 text-right flex-shrink-0">
                  {item.starsPercent}%
                </span>
                <span className="text-[10px] text-slate-600 w-4 text-right flex-shrink-0">
                  {item.starsCount}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
})
