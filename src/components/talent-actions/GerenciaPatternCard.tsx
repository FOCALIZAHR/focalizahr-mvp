'use client'

// ════════════════════════════════════════════════════════════════════════════
// GERENCIA PATTERN CARD — Card por gerencia con patron + ICC + sucesores
// InsufficientDataGuard: si < 50% clasificados → card deshabilitada
// SIEMPRE muestra contexto de tamano (2 de 3 ≠ 2 de 40)
// ════════════════════════════════════════════════════════════════════════════

import { memo } from 'react'
import { ChevronRight, AlertTriangle, Users, Shield, Flag } from 'lucide-react'
import type { GerenciaMapItem } from '@/lib/services/TalentActionService'

interface GerenciaPatternCardProps {
  gerencia: GerenciaMapItem
  isFlagged?: boolean
  onClick: () => void
  severity?: 'red' | 'muted' | 'normal'
}

const PATTERN_CONFIG: Record<string, {
  label: string
  color: string
  bgAccent: string
  borderAccent: string
}> = {
  FRAGIL:         { label: 'Fragil',         color: 'text-amber-400',   bgAccent: 'bg-amber-400/5',   borderAccent: 'border-amber-500/20' },
  QUEMADA:        { label: 'Quemada',        color: 'text-orange-400',  bgAccent: 'bg-orange-400/5',  borderAccent: 'border-orange-500/20' },
  ESTANCADA:      { label: 'Estancada',      color: 'text-yellow-400',  bgAccent: 'bg-yellow-400/5',  borderAccent: 'border-yellow-500/20' },
  RIESGO_OCULTO:  { label: 'Riesgo Oculto',  color: 'text-purple-400',  bgAccent: 'bg-purple-400/5',  borderAccent: 'border-purple-500/20' },
  EN_TRANSICION:  { label: 'En Transicion',  color: 'text-blue-400',    bgAccent: 'bg-blue-400/5',    borderAccent: 'border-blue-500/20' },
  SALUDABLE:      { label: 'Modelo a Replicar', color: 'text-emerald-400', bgAccent: 'bg-emerald-400/5', borderAccent: 'border-emerald-500/20' }
}

const DEFAULT_CONFIG = { label: 'Sin clasificar', color: 'text-slate-400', bgAccent: 'bg-slate-400/5', borderAccent: 'border-slate-700' }

export default memo(function GerenciaPatternCard({ gerencia, isFlagged, onClick, severity = 'normal' }: GerenciaPatternCardProps) {

  const config = gerencia.pattern
    ? (PATTERN_CONFIG[gerencia.pattern] || DEFAULT_CONFIG)
    : DEFAULT_CONFIG

  // InsufficientDataGuard
  if (gerencia.dataInsufficient) {
    return (
      <div className="bg-slate-900/40 border border-slate-800/50 rounded-2xl p-4 opacity-60 cursor-default">
        <div className="flex items-start justify-between">
          <div>
            <h4 className="text-sm font-medium text-slate-400">
              {gerencia.gerenciaName}
            </h4>
            <div className="flex items-center gap-1.5 mt-2">
              <AlertTriangle className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-xs text-slate-500">
                Datos insuficientes
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-600">
              {gerencia.clasificadas} de {gerencia.totalPersonas} clasificados
            </span>
          </div>
        </div>
        <p className="text-[10px] text-slate-600 mt-2">
          Menos del 50% del equipo tiene matrices de talento calculadas. Completa la calibracion.
        </p>
      </div>
    )
  }

  // Estilos por severidad visual
  const severityClasses = severity === 'red'
    ? 'ring-1 ring-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.15)]'
    : severity === 'muted'
      ? 'opacity-60'
      : ''

  return (
    <button
      onClick={onClick}
      className={`w-full text-left ${config.bgAccent} border ${config.borderAccent} rounded-2xl p-4
        hover:border-cyan-500/30 transition-all duration-200 group ${severityClasses}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          {/* Nombre + patron */}
          <h4 className="text-sm font-medium text-white truncate">
            {gerencia.gerenciaName}
          </h4>
          <div className="flex items-center gap-2 mt-0.5">
            {gerencia.pattern && (
              <span className={`text-xs font-medium ${config.color}`}>
                {config.label}
              </span>
            )}
            {isFlagged && (
              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                <Flag className="w-2.5 h-2.5 text-amber-400" />
                <span className="text-[9px] text-amber-400 font-medium">En revision</span>
              </span>
            )}
          </div>
        </div>

        {/* ICC */}
        {gerencia.icc !== null && (
          <div className="text-right ml-3 shrink-0">
            <div className="text-lg font-bold text-cyan-400">
              {gerencia.icc}%
            </div>
            <div className="text-[10px] text-slate-500">ICC</div>
          </div>
        )}
      </div>

      {/* Metricas compactas */}
      <div className="flex items-center gap-3 mt-3 text-[11px] text-slate-400">
        {/* Contexto de tamano */}
        <span className="flex items-center gap-1">
          <Users className="w-3 h-3" />
          {gerencia.clasificadas} de {gerencia.totalPersonas}
        </span>

        {/* Sucesores */}
        {gerencia.sucesores.total > 0 && (
          <span className="flex items-center gap-1">
            <Shield className="w-3 h-3" />
            {gerencia.sucesores.enPlanFormal} de {gerencia.sucesores.total} con plan
          </span>
        )}

        {/* Fuga cerebros count */}
        {gerencia.riskDistribution.FUGA_CEREBROS > 0 && (
          <span className="text-amber-400/80">
            {gerencia.riskDistribution.FUGA_CEREBROS} en fuga
          </span>
        )}
      </div>

      {/* CTA sutil */}
      <div className="flex items-center gap-1 mt-3 text-xs text-slate-500 group-hover:text-cyan-400 transition-colors">
        <span>Ver diagnostico</span>
        <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
      </div>
    </button>
  )
})
