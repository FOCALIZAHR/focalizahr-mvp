'use client'

// ════════════════════════════════════════════════════════════════════════════
// ANTHROPIC EQUALIZER — 5 micro-barras de las dimensiones Anthropic
// src/app/dashboard/workforce/components/instruments/descriptor-simulator/atomos/AnthropicEqualizer.tsx
// ════════════════════════════════════════════════════════════════════════════
// Visualización granular del "CÓMO" la IA participa en la tarea.
// Solo se renderiza si la tarea tiene anthropicData !== null.
// Hover sobre cualquier barra muestra tooltip con narrativa humana.
//
// Las 5 dimensiones (orden canónico):
//   D — Reemplazo (directive)
//   F — Adaptación (feedbackLoop)
//   I — Iteración (taskIteration)
//   V — Verificación (validation)
//   L — Aprendizaje (learning)
// ════════════════════════════════════════════════════════════════════════════

import { memo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ANTHROPIC_DIMENSIONS,
  ANTHROPIC_DIMENSION_ORDER,
  type AnthropicDimensionKey,
} from '@/config/anthropicDimensions'
import type { AnthropicDimensionData } from '@/app/api/descriptors/[id]/simulator/route'

interface AnthropicEqualizerProps {
  data: AnthropicDimensionData | null
}

const BAR_MAX_HEIGHT = 20  // px
const BAR_WIDTH = 3        // px
const BAR_GAP = 2          // px

export default memo(function AnthropicEqualizer({ data }: AnthropicEqualizerProps) {
  const [hoveredKey, setHoveredKey] = useState<AnthropicDimensionKey | null>(null)

  // Si no hay dato, ocupa espacio con placeholder invisible para preservar layout
  if (!data) {
    return (
      <div
        style={{
          width: 5 * BAR_WIDTH + 4 * BAR_GAP,
          height: BAR_MAX_HEIGHT,
        }}
        aria-hidden="true"
      />
    )
  }

  return (
    <div
      className="relative inline-flex items-end"
      style={{ gap: `${BAR_GAP}px`, height: BAR_MAX_HEIGHT }}
      role="img"
      aria-label="Dimensiones Anthropic"
    >
      {ANTHROPIC_DIMENSION_ORDER.map(key => {
        const value = data[key]
        const height = Math.max(2, Math.round(value * BAR_MAX_HEIGHT)) // min 2px para visibilidad
        const config = ANTHROPIC_DIMENSIONS[key]
        const isHovered = hoveredKey === key

        return (
          <div
            key={key}
            className="relative cursor-help"
            onMouseEnter={() => setHoveredKey(key)}
            onMouseLeave={() => setHoveredKey(null)}
            style={{ width: BAR_WIDTH, height: BAR_MAX_HEIGHT }}
            aria-label={config.narrative}
          >
            <div
              className="absolute bottom-0 left-0 right-0 rounded-sm transition-all"
              style={{
                height: `${height}px`,
                backgroundColor: isHovered
                  ? '#A78BFA'
                  : 'rgba(167, 139, 250, 0.55)',
              }}
            />
            <AnimatePresence>
              {isHovered && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  transition={{ duration: 0.15 }}
                  className="absolute -top-10 left-1/2 -translate-x-1/2 z-50 px-2.5 py-1 rounded-md bg-slate-900/95 border border-purple-400/20 shadow-xl whitespace-nowrap pointer-events-none"
                >
                  <span className="text-[10px] text-purple-300 font-light">
                    {config.narrative}{' '}
                    <span className="text-purple-200 font-mono font-bold ml-1">
                      {Math.round(value * 100)}%
                    </span>
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}
    </div>
  )
})
