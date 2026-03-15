'use client'

// ════════════════════════════════════════════════════════════════════════════
// TAC LEFT COLUMN — Contexto fijo (25%)
// ICC organizacional, total colaboradores, patron dominante
// ════════════════════════════════════════════════════════════════════════════

import { memo } from 'react'
import { Activity, Users, TrendingUp, ArrowLeft } from 'lucide-react'
import type { GerenciaMapItem } from '@/lib/services/TalentActionService'

interface TACLeftColumnProps {
  orgStats: {
    totalPersonas: number
    totalClasificadas: number
    totalGerencias: number
    patronDominante: string | null
    iccOrganizacional: number | null
  }
  salarySource: string
  viewLevel: 'hub' | 'cover' | 'content'
  selectedGerencia: GerenciaMapItem | null
  onBackToHub: () => void
}

const PATTERN_LABELS: Record<string, { label: string; color: string }> = {
  FRAGIL:         { label: 'Fragil',         color: 'text-amber-400' },
  QUEMADA:        { label: 'Quemada',        color: 'text-orange-400' },
  ESTANCADA:      { label: 'Estancada',      color: 'text-yellow-400' },
  RIESGO_OCULTO:  { label: 'Riesgo Oculto',  color: 'text-purple-400' },
  EN_TRANSICION:  { label: 'En Transicion',  color: 'text-blue-400' },
  SALUDABLE:      { label: 'Saludable',      color: 'text-emerald-400' }
}

export default memo(function TACLeftColumn({
  orgStats,
  salarySource,
  viewLevel,
  selectedGerencia,
  onBackToHub
}: TACLeftColumnProps) {

  const patternInfo = orgStats.patronDominante
    ? PATTERN_LABELS[orgStats.patronDominante] || { label: orgStats.patronDominante, color: 'text-slate-400' }
    : null

  const coveragePercent = orgStats.totalPersonas > 0
    ? Math.round((orgStats.totalClasificadas / orgStats.totalPersonas) * 100)
    : 0

  return (
    <div className="w-full lg:w-[25%] bg-slate-900/50 p-6 lg:p-8 flex flex-col gap-6 border-b lg:border-b-0 lg:border-r border-slate-800">

      {/* Header */}
      <div className="text-center lg:text-left">
        <h2 className="text-lg font-light text-white tracking-tight">
          Talent Action Center
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Inteligencia organizacional
        </p>
      </div>

      {/* ICC Organizacional */}
      <div className="text-center lg:text-left">
        <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">
          ICC Organizacional
        </div>
        {orgStats.iccOrganizacional !== null ? (
          <div className="text-3xl font-bold text-cyan-400">
            {orgStats.iccOrganizacional}%
          </div>
        ) : (
          <div className="text-sm text-slate-500">Sin datos</div>
        )}
        <div className="text-[10px] text-slate-600 mt-1">
          Indice de Conocimiento Critico
        </div>
      </div>

      {/* Metricas compactas */}
      <div className="grid grid-cols-2 lg:grid-cols-1 gap-3">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-slate-500" />
          <div>
            <div className="text-sm font-medium text-white">{orgStats.totalPersonas}</div>
            <div className="text-[10px] text-slate-500">Colaboradores</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-slate-500" />
          <div>
            <div className="text-sm font-medium text-white">{coveragePercent}%</div>
            <div className="text-[10px] text-slate-500">Clasificados</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-slate-500" />
          <div>
            <div className="text-sm font-medium text-white">{orgStats.totalGerencias}</div>
            <div className="text-[10px] text-slate-500">Gerencias</div>
          </div>
        </div>
      </div>

      {/* Patron dominante */}
      {patternInfo && (
        <div className="pt-3 border-t border-slate-800">
          <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">
            Patron Dominante
          </div>
          <div className={`text-sm font-medium ${patternInfo.color}`}>
            {patternInfo.label}
          </div>
        </div>
      )}

      {/* Salary source indicator */}
      {salarySource === 'default_chile' && (
        <div className="mt-auto pt-3 border-t border-slate-800">
          <p className="text-[10px] text-amber-400/70">
            Usando salarios promedio Chile. Configura los salarios de tu empresa para mayor precision.
          </p>
        </div>
      )}

      {/* Gerencia seleccionada (en cover/content) */}
      {viewLevel !== 'hub' && selectedGerencia && (
        <div className="mt-auto pt-3 border-t border-slate-800">
          <button
            onClick={onBackToHub}
            className="flex items-center gap-2 text-xs text-slate-400 hover:text-cyan-400 transition-colors"
          >
            <ArrowLeft className="w-3 h-3" />
            Volver al mapa
          </button>
          <div className="mt-2 text-sm font-medium text-white">
            {selectedGerencia.gerenciaName}
          </div>
          {selectedGerencia.pattern && (
            <div className={`text-xs ${PATTERN_LABELS[selectedGerencia.pattern]?.color || 'text-slate-400'}`}>
              {PATTERN_LABELS[selectedGerencia.pattern]?.label || selectedGerencia.pattern}
            </div>
          )}
        </div>
      )}
    </div>
  )
})
