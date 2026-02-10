// ════════════════════════════════════════════════════════════════════════════
// RATING ROW - Fila de empleado con score de desempeño + estado potencial
// src/components/performance/RatingRow.tsx
// ════════════════════════════════════════════════════════════════════════════
// Click en la fila → abre modal AAE para evaluar potencial
// El potencial se asigna vía AAEPotentialRenderer, NO con botones 1-5
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { memo } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import {
  TrendingUp, ChevronRight, Check, Building2
} from 'lucide-react'
import { getPerformanceClassification } from '@/config/performanceClassification'

// ════════════════════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════════════════════

function getInitials(fullName: string): string {
  const parts = fullName.trim().split(' ').filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function getPotentialColor(score: number | null): string {
  if (!score) return '#64748b' // slate
  if (score >= 4.0) return '#10B981' // emerald (high)
  if (score >= 3.0) return '#F59E0B' // amber (medium)
  return '#EF4444' // red (low)
}

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

export interface RatingData {
  id: string
  employeeId: string
  employeeName: string
  employeePosition?: string | null
  departmentName?: string | null
  calculatedScore: number
  finalScore?: number | null
  potentialScore?: number | null
  potentialLevel?: string | null
  nineBoxPosition?: string | null
  potentialNotes?: string | null
}

export interface RatingRowProps {
  rating: RatingData
  onToggleExpand?: () => void
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════

export default memo(function RatingRow({
  rating,
  onToggleExpand
}: RatingRowProps) {
  const effectiveScore = rating.finalScore ?? rating.calculatedScore
  const perfClassification = getPerformanceClassification(effectiveScore)
  const hasPotential = rating.potentialScore != null
  const potentialColor = getPotentialColor(rating.potentialScore ?? null)

  return (
    <motion.div
      layout
      onClick={onToggleExpand}
      className={cn(
        'group relative p-4 rounded-xl transition-all duration-200',
        onToggleExpand ? 'cursor-pointer' : 'cursor-default',
        'bg-slate-800/30 hover:bg-slate-800/50',
        'border border-slate-700/30 hover:border-slate-600/50'
      )}
    >
      {/* Linea Tesla sutil en hover */}
      <div
        className="absolute top-0 left-0 right-0 h-[1px] opacity-0 group-hover:opacity-100 transition-opacity"
        style={{
          background: `linear-gradient(90deg, transparent, ${perfClassification.color}40, transparent)`
        }}
      />

      <div className="flex items-center gap-4">
        {/* AVATAR - Estilo SpotlightCard */}
        <div className="relative flex-shrink-0">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-semibold border-2"
            style={{
              background: `linear-gradient(135deg, ${perfClassification.color}20, ${perfClassification.color}10)`,
              borderColor: `${perfClassification.color}40`,
              color: perfClassification.color
            }}
          >
            {getInitials(rating.employeeName)}
          </div>

          {/* Indicador de potencial evaluado */}
          {hasPotential && (
            <div
              className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center border-2 border-slate-900"
              style={{ backgroundColor: potentialColor }}
            >
              <Check className="w-3 h-3 text-white" />
            </div>
          )}
        </div>

        {/* INFO EMPLEADO */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-slate-200 truncate">
              {rating.employeeName}
            </span>
            {rating.nineBoxPosition && (
              <span className="px-1.5 py-0.5 text-[10px] rounded bg-cyan-500/20 text-cyan-400">
                {rating.nineBoxPosition}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
            {rating.employeePosition && (
              <span className="truncate">{rating.employeePosition}</span>
            )}
            {rating.departmentName && (
              <span className="flex items-center gap-1">
                <Building2 className="w-3 h-3" />
                {rating.departmentName}
              </span>
            )}
          </div>
        </div>

        {/* SCORE PERFORMANCE */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900/50">
          <TrendingUp className="w-4 h-4 text-slate-500" />
          <div className="text-right">
            <div
              className="text-lg font-semibold tabular-nums"
              style={{ color: perfClassification.color }}
            >
              {effectiveScore.toFixed(1)}
            </div>
            <div
              className="text-[10px]"
              style={{ color: `${perfClassification.color}80` }}
            >
              {effectiveScore > 0 ? perfClassification.label : 'Sin evaluar'}
            </div>
          </div>
        </div>

        {/* ESTADO POTENCIAL */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900/50 min-w-[80px]">
          {hasPotential ? (
            <div className="text-right w-full">
              <div
                className="text-lg font-semibold tabular-nums"
                style={{ color: potentialColor }}
              >
                {rating.potentialScore!.toFixed(1)}
              </div>
              <div className="text-[10px] text-emerald-400/80">
                Potencial
              </div>
            </div>
          ) : (
            <div className="text-right w-full">
              <div className="text-sm font-medium text-amber-400">
                Pendiente
              </div>
              <div className="text-[10px] text-slate-500">
                Sin evaluar
              </div>
            </div>
          )}
        </div>

        {/* CHEVRON */}
        <div className="p-2 rounded-lg text-slate-500 group-hover:text-slate-300 transition-colors">
          <ChevronRight className="w-4 h-4" />
        </div>
      </div>
    </motion.div>
  )
})
