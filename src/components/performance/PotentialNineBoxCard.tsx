// ════════════════════════════════════════════════════════════════════════════
// POTENTIAL & 9-BOX CARD - FocalizaHR Premium Design
// src/components/performance/PotentialNineBoxCard.tsx
// ════════════════════════════════════════════════════════════════════════════
// Filosofía de Diseño:
// - Muestra Potencial + Posición 9-Box de forma compacta
// - Misma altura que PerformanceScoreCard para consistencia visual
// - Línea Tesla superior dinámica según nivel de potencial
// - Glassmorphism y diseño premium FocalizaHR
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { memo } from 'react'
import { TrendingUp, Star } from 'lucide-react'
import { NINE_BOX_POSITIONS, type NineBoxPosition } from '@/config/performanceClassification'

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

export interface PotentialNineBoxCardProps {
  /** Score de potencial en escala 1-5 */
  potentialScore: number | null
  /** Nivel de potencial: "high" | "medium" | "low" */
  potentialLevel: string | null
  /** Posición en matriz 9-Box */
  nineBoxPosition: string | null
  /** Mostrar línea Tesla superior */
  showTeslaLine?: boolean
  /** Clase CSS adicional */
  className?: string
}

// ════════════════════════════════════════════════════════════════════════════
// HELPER: Obtener color dinámico según nivel de potencial
// ════════════════════════════════════════════════════════════════════════════

function getPotentialColor(level: string | null): string {
  if (!level) return '#64748B' // slate-500 (default)
  
  switch (level.toLowerCase()) {
    case 'high':
      return '#22D3EE' // cyan-400 (FocalizaHR primary)
    case 'medium':
      return '#A78BFA' // purple-400 (FocalizaHR secondary)
    case 'low':
      return '#F59E0B' // amber-500
    default:
      return '#64748B'
  }
}

function getPotentialLabel(level: string | null): string {
  if (!level) return 'No asignado'
  
  switch (level.toLowerCase()) {
    case 'high':
      return 'Alto'
    case 'medium':
      return 'Medio'
    case 'low':
      return 'Bajo'
    default:
      return level
  }
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ════════════════════════════════════════════════════════════════════════════

export const PotentialNineBoxCard = memo(function PotentialNineBoxCard({
  potentialScore,
  potentialLevel,
  nineBoxPosition,
  showTeslaLine = true,
  className = ''
}: PotentialNineBoxCardProps) {
  
  // Si no hay datos de potencial, no mostrar el card
  if (!potentialScore && !potentialLevel) {
    return null
  }

  const potentialColor = getPotentialColor(potentialLevel)
  const potentialLabelText = getPotentialLabel(potentialLevel)
  
  // Obtener configuración de posición 9-Box si existe
  const nineBoxConfig = nineBoxPosition 
    ? NINE_BOX_POSITIONS[nineBoxPosition as NineBoxPosition]
    : null

  return (
    <div
      className={`relative rounded-xl border bg-slate-800/30 backdrop-blur-md ${className}`}
      style={{ borderColor: `${potentialColor}33` }} // 20% opacity
    >
      {/* Línea Tesla dinámica superior */}
      {showTeslaLine && (
        <div
          className="absolute top-0 left-0 right-0 h-px rounded-t-xl"
          style={{
            background: `linear-gradient(90deg, transparent 10%, ${potentialColor} 50%, transparent 90%)`,
            boxShadow: `0 0 8px ${potentialColor}80`
          }}
        />
      )}

      <div className="p-3 sm:p-4 space-y-2.5 sm:space-y-3">
        
        {/* SECCIÓN 1: Potencial Score + Level */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <TrendingUp 
              className="w-3.5 h-3.5 sm:w-4 sm:h-4"
              style={{ color: potentialColor }}
            />
            <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Potencial
            </span>
          </div>
          
          <div className="text-right">
            <div className="flex items-baseline gap-1 sm:gap-1.5">
              <span 
                className="text-xl sm:text-2xl font-bold tabular-nums"
                style={{ color: potentialColor }}
              >
                {potentialScore?.toFixed(1) || '--'}
              </span>
              <span className="text-[10px] sm:text-xs text-slate-500 font-medium">/5.0</span>
            </div>
            <span 
              className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide"
              style={{ color: potentialColor }}
            >
              {potentialLabelText}
            </span>
          </div>
        </div>

        {/* DIVISOR */}
        <div className="h-px bg-gradient-to-r from-transparent via-slate-700/50 to-transparent" />

        {/* SECCIÓN 2: Posición 9-Box */}
        {nineBoxConfig ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Star 
                className="w-3.5 h-3.5 sm:w-4 sm:h-4"
                style={{ color: nineBoxConfig.color }}
              />
              <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-500">
                9-Box
              </span>
            </div>
            
            <div className="text-right">
              <span 
                className="text-xs sm:text-sm font-bold uppercase tracking-wide"
                style={{ color: nineBoxConfig.color }}
              >
                {nineBoxConfig.labelShort}
              </span>
              <p className="text-[9px] sm:text-[10px] text-slate-400 mt-0.5">
                {nineBoxConfig.label}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-600" />
              <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-500">
                9-Box
              </span>
            </div>
            
            <div className="text-right">
              <span className="text-xs sm:text-sm font-medium text-slate-600">
                Pendiente
              </span>
              <p className="text-[9px] sm:text-[10px] text-slate-500 mt-0.5">
                Se calcula con desempeño
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
})

export default PotentialNineBoxCard