// ════════════════════════════════════════════════════════════════════════════
// PERFORMANCE SCORE CARD - Card Premium con Línea Tesla
// src/components/performance/PerformanceScoreCard.tsx
// ════════════════════════════════════════════════════════════════════════════
// FILOSOFÍA: Card premium FocalizaHR con glassmorphism + línea Tesla
// PATRÓN: Apple 70% + Tesla 20% + Institucional 10%
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { memo } from 'react'
import { cn } from '@/lib/utils'
import {
  getPerformanceClassification,
  type PerformanceRatingConfigData
} from '@/config/performanceClassification'
import PerformanceBadge from './PerformanceBadge'

// ════════════════════════════════════════════════════════════════════════════
// INTERFACE
// ════════════════════════════════════════════════════════════════════════════
interface PerformanceScoreCardProps {
  /** Score numérico 1.0 - 5.0 */
  score: number
  /** Config personalizada del cliente (opcional) */
  config?: PerformanceRatingConfigData
  /** Título opcional */
  title?: string
  /** Mostrar descripción del nivel */
  showDescription?: boolean
  /** Mostrar barra de progreso */
  showProgressBar?: boolean
  /** Mostrar línea Tesla (signature FocalizaHR) */
  showTeslaLine?: boolean
  /** Tamaño */
  size?: 'sm' | 'md' | 'lg'
  /** Clases adicionales */
  className?: string
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE
// ════════════════════════════════════════════════════════════════════════════
export default memo(function PerformanceScoreCard({
  score,
  config,
  title = 'Score de Desempeño',
  showDescription = false,
  showProgressBar = true,
  showTeslaLine = true,
  size = 'md',
  className
}: PerformanceScoreCardProps) {
  const classification = getPerformanceClassification(score, config)
  const progressPercent = (score / 5) * 100

  // Tamaños responsive (mobile-first)
  const sizeStyles = {
    sm: {
      padding: 'p-4',
      score: 'text-3xl',
      title: 'text-xs',
      bar: 'h-1.5'
    },
    md: {
      padding: 'p-5 md:p-6',
      score: 'text-4xl md:text-5xl',
      title: 'text-sm',
      bar: 'h-2'
    },
    lg: {
      padding: 'p-6 md:p-8',
      score: 'text-5xl md:text-6xl',
      title: 'text-base',
      bar: 'h-3'
    }
  }

  const styles = sizeStyles[size]

  return (
    <div
      className={cn(
        // Clase base FocalizaHR con glassmorphism
        'fhr-card relative overflow-hidden',
        styles.padding,
        className
      )}
    >
      {/* ════════════════════════════════════════════════════════════════════
          LÍNEA TESLA - Signature Element FocalizaHR
          ════════════════════════════════════════════════════════════════════ */}
      {showTeslaLine && (
        <div
          className="absolute top-0 left-0 right-0 h-[2px]"
          style={{
            background: `linear-gradient(90deg, transparent, ${classification.color}, transparent)`
          }}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <span className={cn('text-slate-400 font-medium', styles.title)}>
          {title}
        </span>
        <PerformanceBadge
          score={score}
          config={config}
          size="sm"
          showScore={false}
        />
      </div>

      {/* Score Principal - PROTAGONISTA */}
      <div className="flex items-baseline gap-3 mb-4">
        <span
          className={cn('font-bold tracking-tight', styles.score)}
          style={{ color: classification.color }}
        >
          {score.toFixed(1)}
        </span>
        <span className="text-slate-500 text-lg">/5.0</span>
      </div>

      {/* Clasificación */}
      <div
        className="text-lg font-semibold mb-3"
        style={{ color: classification.color }}
      >
        {classification.label}
      </div>

      {/* Progress Bar - Visual de contexto */}
      {showProgressBar && (
        <div className="mb-4">
          <div className={cn(
            'w-full bg-slate-700/50 rounded-full overflow-hidden',
            styles.bar
          )}>
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${progressPercent}%`,
                background: `linear-gradient(90deg, ${classification.color}80, ${classification.color})`
              }}
            />
          </div>
          {/* Marcadores de referencia */}
          <div className="flex justify-between mt-1 text-[10px] text-slate-500">
            <span>1.0</span>
            <span>2.5</span>
            <span>4.0</span>
            <span>5.0</span>
          </div>
        </div>
      )}

      {/* Descripción - Progressive Disclosure */}
      {showDescription && classification.description && (
        <p className="text-xs text-slate-400 leading-relaxed">
          {classification.description}
        </p>
      )}
    </div>
  )
})
