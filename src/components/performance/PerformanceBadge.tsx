// ════════════════════════════════════════════════════════════════════════════
// PERFORMANCE BADGE - Filosofía FocalizaHR
// src/components/performance/PerformanceBadge.tsx
// ════════════════════════════════════════════════════════════════════════════
// REGLA: Usar clases .fhr-badge-* existentes, NO Tailwind directo
// FILOSOFÍA: DATOS → INSIGHT → ACCIÓN (score + significado)
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { memo } from 'react'
import { cn } from '@/lib/utils'
import {
  getPerformanceClassification,
  PerformanceLevel,
  type PerformanceRatingConfigData
} from '@/config/performanceClassification'

// ════════════════════════════════════════════════════════════════════════════
// MAPEO: Nivel → Clase CSS FocalizaHR existente
// ════════════════════════════════════════════════════════════════════════════
const LEVEL_TO_FHR_BADGE: Record<string, string> = {
  [PerformanceLevel.EXCEPTIONAL]:       'fhr-badge-success',   // Verde esmeralda
  [PerformanceLevel.EXCEEDS]:           'fhr-badge-active',    // Cyan
  [PerformanceLevel.MEETS]:             'fhr-badge-purple',    // Purple
  [PerformanceLevel.DEVELOPING]:        'fhr-badge-warning',   // Amarillo
  [PerformanceLevel.NEEDS_IMPROVEMENT]: 'fhr-badge-error'      // Rojo
}

// ════════════════════════════════════════════════════════════════════════════
// TAMAÑOS - Mobile-First
// ════════════════════════════════════════════════════════════════════════════
const SIZE_CLASSES = {
  xs: 'px-1.5 py-0.5 text-[10px] gap-1',
  sm: 'px-2 py-0.5 text-xs gap-1',
  md: 'px-3 py-1 text-sm gap-1.5',
  lg: 'px-4 py-1.5 text-base gap-2'
}

// ════════════════════════════════════════════════════════════════════════════
// INTERFACE
// ════════════════════════════════════════════════════════════════════════════
interface PerformanceBadgeProps {
  /** Score numérico 1.0 - 5.0 */
  score: number
  /** Config personalizada del cliente (opcional) */
  config?: PerformanceRatingConfigData
  /** Tamaño del badge */
  size?: 'xs' | 'sm' | 'md' | 'lg'
  /** Mostrar score numérico */
  showScore?: boolean
  /** Mostrar label de clasificación */
  showLabel?: boolean
  /** Variante visual */
  variant?: 'badge' | 'outline' | 'minimal'
  /** Clases adicionales */
  className?: string
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE
// ════════════════════════════════════════════════════════════════════════════
export default memo(function PerformanceBadge({
  score,
  config,
  size = 'md',
  showScore = true,
  showLabel = true,
  variant = 'badge',
  className
}: PerformanceBadgeProps) {
  // Obtener clasificación desde config centralizada (TASK 02)
  const classification = getPerformanceClassification(score, config)

  // Obtener clase FocalizaHR correspondiente
  const fhrBadgeClass = LEVEL_TO_FHR_BADGE[classification.level] || 'fhr-badge-default'

  // Variante MINIMAL: solo texto coloreado, sin fondo
  if (variant === 'minimal') {
    return (
      <span
        className={cn(
          'inline-flex items-center font-medium',
          SIZE_CLASSES[size],
          classification.textClass,
          className
        )}
      >
        {showScore && <span className="font-semibold">{score.toFixed(1)}</span>}
        {showScore && showLabel && <span className="opacity-60">•</span>}
        {showLabel && <span>{size === 'xs' ? classification.labelShort : classification.label}</span>}
      </span>
    )
  }

  // Variante OUTLINE: borde sin fondo
  if (variant === 'outline') {
    return (
      <span
        className={cn(
          'inline-flex items-center rounded-full font-medium',
          'bg-transparent border-2',
          classification.borderClass,
          classification.textClass,
          SIZE_CLASSES[size],
          className
        )}
      >
        {showScore && <span className="font-semibold">{score.toFixed(1)}</span>}
        {showScore && showLabel && <span className="opacity-60">•</span>}
        {showLabel && <span>{size === 'xs' ? classification.labelShort : classification.label}</span>}
      </span>
    )
  }

  // Variante BADGE (default): usa clases .fhr-badge-* corporativas
  return (
    <span
      className={cn(
        'fhr-badge',
        fhrBadgeClass,
        'inline-flex items-center rounded-full font-medium',
        SIZE_CLASSES[size],
        className
      )}
    >
      {showScore && <span className="font-semibold">{score.toFixed(1)}</span>}
      {showScore && showLabel && <span className="opacity-60">•</span>}
      {showLabel && <span>{size === 'xs' ? classification.labelShort : classification.label}</span>}
    </span>
  )
})
