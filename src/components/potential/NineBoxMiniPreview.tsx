'use client'

// ════════════════════════════════════════════════════════════════════════════
// NINE BOX MINI PREVIEW - Vista previa de posición 9-Box
// src/components/potential/NineBoxMiniPreview.tsx
// ════════════════════════════════════════════════════════════════════════════
// Muestra una mini matriz 9-Box con el punto animado en la posición calculada
// Usa los helpers de performanceClassification para calcular posición
// ════════════════════════════════════════════════════════════════════════════

import { memo, useMemo } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

import {
  scoreToNineBoxLevel,
  calculate9BoxPosition,
  getNineBoxPositionConfig,
  type NineBoxPosition
} from '@/config/performanceClassification'
import type { NineBoxMiniPreviewProps } from '@/types/potential'

// ════════════════════════════════════════════════════════════════════════════
// GRID LAYOUT - 3x3 matrix positions
// ════════════════════════════════════════════════════════════════════════════

// Mapeo de level combinations a posición visual en grid (row, col)
// Row: 0=top (high potential), 2=bottom (low potential)
// Col: 0=left (low performance), 2=right (high performance)
const LEVEL_TO_GRID: Record<string, { row: number; col: number }> = {
  'low-high': { row: 0, col: 0 },      // POTENTIAL_GEM
  'medium-high': { row: 0, col: 1 },   // GROWTH_POTENTIAL
  'high-high': { row: 0, col: 2 },     // STAR
  
  'low-medium': { row: 1, col: 0 },    // INCONSISTENT
  'medium-medium': { row: 1, col: 1 }, // CORE_PLAYER
  'high-medium': { row: 1, col: 2 },   // HIGH_PERFORMER
  
  'low-low': { row: 2, col: 0 },       // UNDERPERFORMER
  'medium-low': { row: 2, col: 1 },    // AVERAGE_PERFORMER
  'high-low': { row: 2, col: 2 }       // TRUSTED_PROFESSIONAL
}

// Labels para ejes
const PERFORMANCE_LABELS = ['Bajo', 'Medio', 'Alto']
const POTENTIAL_LABELS = ['Alto', 'Medio', 'Bajo']

// ════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ════════════════════════════════════════════════════════════════════════════

export default memo(function NineBoxMiniPreview({
  performanceScore,
  potentialScore
}: NineBoxMiniPreviewProps) {
  // Calcular posición si hay score de potencial
  const position = useMemo(() => {
    if (potentialScore === null) return null

    const performanceLevel = scoreToNineBoxLevel(performanceScore)
    const potentialLevel = scoreToNineBoxLevel(potentialScore)
    const nineBoxPosition = calculate9BoxPosition(performanceLevel, potentialLevel)
    const config = getNineBoxPositionConfig(nineBoxPosition)
    const gridPos = LEVEL_TO_GRID[`${performanceLevel}-${potentialLevel}`]

    return {
      nineBoxPosition,
      config,
      gridPos,
      performanceLevel,
      potentialLevel
    }
  }, [performanceScore, potentialScore])

  if (!position) return null

  return (
    <div className="flex items-center gap-4 p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
      {/* Mini Grid 9-Box */}
      <div className="relative">
        {/* Labels eje Y (Potencial) */}
        <div className="absolute -left-1 top-0 bottom-0 flex flex-col justify-between text-[6px] text-slate-600 -translate-x-full pr-1">
          {POTENTIAL_LABELS.map((label, i) => (
            <span key={i} className="leading-none">{label[0]}</span>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-3 gap-0.5 w-[54px] h-[54px]">
          {[0, 1, 2].map((row) =>
            [0, 1, 2].map((col) => {
              const isCurrentPosition =
                position.gridPos.row === row && position.gridPos.col === col

              return (
                <div
                  key={`${row}-${col}`}
                  className={cn(
                    "w-[16px] h-[16px] rounded-sm transition-all duration-300",
                    isCurrentPosition
                      ? "bg-opacity-30"
                      : "bg-slate-700/30"
                  )}
                  style={{
                    backgroundColor: isCurrentPosition
                      ? `${position.config.color}40`
                      : undefined
                  }}
                >
                  {isCurrentPosition && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{
                        type: 'spring',
                        stiffness: 400,
                        damping: 20
                      }}
                      className="w-full h-full flex items-center justify-center"
                    >
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{
                          backgroundColor: position.config.color,
                          boxShadow: `0 0 8px ${position.config.color}`
                        }}
                      />
                    </motion.div>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* Labels eje X (Desempeño) */}
        <div className="absolute -bottom-1 left-0 right-0 flex justify-between text-[6px] text-slate-600 translate-y-full pt-0.5">
          {PERFORMANCE_LABELS.map((label, i) => (
            <span key={i} className="leading-none">{label[0]}</span>
          ))}
        </div>
      </div>

      {/* Info de posición */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <div
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{
              backgroundColor: position.config.color,
              boxShadow: `0 0 6px ${position.config.color}50`
            }}
          />
          <span
            className="text-sm font-bold truncate"
            style={{ color: position.config.color }}
          >
            {position.config.label}
          </span>
        </div>
        <p className="text-[10px] text-slate-500 leading-tight line-clamp-2">
          {position.config.description}
        </p>
      </div>
    </div>
  )
})