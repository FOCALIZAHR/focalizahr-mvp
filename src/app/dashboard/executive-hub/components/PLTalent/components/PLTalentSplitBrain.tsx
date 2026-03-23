'use client'

// ════════════════════════════════════════════════════════════════════════════
// SPLIT-BRAIN — 35% Datos Duros | 65% Oráculo Condicional
// ════════════════════════════════════════════════════════════════════════════

import { memo, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { TrendingDown, Users, Cog, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { formatCurrency } from '../PLTalent.utils'
import type { BrechaGerencia } from '../PLTalent.types'
import type { GerenciaImpact } from '@/config/narratives/BusinessImpactDictionary'

interface PLTalentSplitBrainProps {
  heroNumber: number
  monthlyGap: number
  totalPeople: number
  fteLoss: number
  ranking: BrechaGerencia[]
  salarySource: string
  selectedGerencia: string | null
  gerenciaImpact: GerenciaImpact | null
  onGerenciaSelect: (gerencia: string) => void
}

export default memo(function PLTalentSplitBrain({
  heroNumber,
  monthlyGap,
  totalPeople,
  fteLoss,
  ranking,
  salarySource,
  selectedGerencia,
  gerenciaImpact,
  onGerenciaSelect,
}: PLTalentSplitBrainProps) {

  const { withGap, healthy } = useMemo(() => {
    const withGap = ranking.filter(g => g.gapMonthly > 0).sort((a, b) => b.gapMonthly - a.gapMonthly)
    const healthy = ranking.filter(g => g.gapMonthly === 0)
    return { withGap, healthy }
  }, [ranking])

  const isEstimated = salarySource === 'default_chile'

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[35%_1fr] gap-4 md:gap-6">

      {/* ══════════════════════════════════════════════════════════════════
          HEMISFERIO IZQUIERDO: DATOS DUROS (35%)
      ══════════════════════════════════════════════════════════════════ */}
      <div className="space-y-4">

        {/* Hero Number */}
        <div className="relative p-5 md:p-6 bg-slate-800/50 rounded-2xl border border-slate-700/50 overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-red-500 to-transparent" />

          <div className="text-center">
            <p className="text-3xl md:text-5xl font-bold text-red-400 font-mono">
              {formatCurrency(heroNumber)}
            </p>
            <p className="text-slate-400 mt-1 text-sm">Pérdida Anualizada</p>

            {isEstimated && (
              <div className="mt-3 flex items-center justify-center gap-2 text-amber-400 text-xs">
                <AlertTriangle className="w-3 h-3" />
                <span>Basado en salarios estimados</span>
              </div>
            )}
          </div>

          {/* KPIs secundarios */}
          <div className="grid grid-cols-3 gap-3 mt-5 pt-4 border-t border-slate-700/50">
            <div className="text-center">
              <TrendingDown className="w-3.5 h-3.5 mx-auto text-slate-500 mb-1" />
              <p className="text-base md:text-lg font-semibold text-white">{formatCurrency(monthlyGap)}</p>
              <p className="text-[10px] text-slate-500">por mes</p>
            </div>
            <div className="text-center">
              <Users className="w-3.5 h-3.5 mx-auto text-slate-500 mb-1" />
              <p className="text-base md:text-lg font-semibold text-white">{totalPeople}</p>
              <p className="text-[10px] text-slate-500">personas</p>
            </div>
            <div className="text-center">
              <Cog className="w-3.5 h-3.5 mx-auto text-slate-500 mb-1" />
              <p className="text-base md:text-lg font-semibold text-white">{fteLoss.toFixed(1)}</p>
              <p className="text-[10px] text-slate-500">FTEs perdidos</p>
            </div>
          </div>
        </div>

        {/* Ranking de Gerencias */}
        <div className="p-4 bg-slate-800/30 rounded-xl border border-slate-700/30">
          <h3 className="text-sm font-medium text-slate-400 mb-3">Ranking por Pérdida</h3>

          <div className="space-y-2">
            {withGap.slice(0, 5).map((g, idx) => (
              <button
                key={g.gerenciaId}
                onClick={() => onGerenciaSelect(g.gerenciaName)}
                className={cn(
                  'w-full flex items-center justify-between p-3 rounded-lg transition-all',
                  'hover:bg-slate-700/50',
                  selectedGerencia === g.gerenciaName
                    ? 'bg-slate-700/70 border border-cyan-500/30'
                    : 'bg-slate-800/50'
                )}
              >
                <div className="flex items-center gap-3">
                  <span className={cn(
                    'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                    idx === 0 ? 'bg-red-500/20 text-red-400' :
                    idx === 1 ? 'bg-orange-500/20 text-orange-400' :
                    idx === 2 ? 'bg-amber-500/20 text-amber-400' :
                    'bg-slate-700 text-slate-400'
                  )}>
                    {idx + 1}
                  </span>
                  <span className="text-white text-sm text-left">{g.gerenciaName}</span>
                </div>
                <span className="text-red-400 font-mono text-sm flex-shrink-0 ml-2">
                  {formatCurrency(g.gapMonthly)}/mes
                </span>
              </button>
            ))}
          </div>

          {healthy.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-700/30">
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-sm">{healthy.length} gerencias operando sin brecha</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          HEMISFERIO DERECHO: ORÁCULO CONDICIONAL (65%)
      ══════════════════════════════════════════════════════════════════ */}
      <div className="relative p-5 md:p-6 bg-slate-800/30 rounded-2xl border border-slate-700/30 min-h-[300px] md:min-h-[400px]">

        {!selectedGerencia ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-slate-700/50 flex items-center justify-center mb-4">
              <TrendingDown className="w-8 h-8 text-slate-500" />
            </div>
            <p className="text-slate-400 text-sm">Selecciona una gerencia para ver el análisis de riesgo</p>
          </div>
        ) : !gerenciaImpact ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <p className="text-slate-400">{selectedGerencia} no tiene categoría de negocio mapeada.</p>
            <p className="text-slate-500 text-sm mt-2">Contacta al administrador para configurar el mapeo.</p>
          </div>
        ) : (
          <div>
            <div className="mb-6">
              <h2 className="text-xl md:text-2xl font-bold text-white">{selectedGerencia}</h2>
              <p className="text-cyan-400 font-medium mt-1">Meta: {gerenciaImpact.meta}</p>
              <p className="text-slate-400 text-sm mt-2">{gerenciaImpact.introNarrative}</p>
            </div>

            <div className="space-y-3">
              <p className="text-amber-400 text-sm font-medium">
                Operar con baja capacidad en esta área expone a:
              </p>

              {gerenciaImpact.risks.map((risk, idx) => (
                <div key={idx} className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/30">
                  <div className="flex items-start gap-3">
                    <span className="text-xl md:text-2xl flex-shrink-0">{risk.icon}</span>
                    <div>
                      <h4 className="font-medium text-white text-sm">{risk.label}</h4>
                      <p className="text-slate-400 text-xs md:text-sm mt-1 leading-relaxed">{risk.narrative}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
})
