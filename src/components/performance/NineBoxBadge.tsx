// ════════════════════════════════════════════════════════════════════════════
// NINE BOX BADGE - Badge para posición 9-Box
// src/components/performance/NineBoxBadge.tsx
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { memo } from 'react'
import { cn } from '@/lib/utils'
import {
  getNineBoxPositionConfig,
  NineBoxPosition
} from '@/config/performanceClassification'

// ════════════════════════════════════════════════════════════════════════════
// MAPEO: 9-Box → Clase CSS FocalizaHR
// ════════════════════════════════════════════════════════════════════════════
const NINEBOX_TO_FHR_BADGE: Record<NineBoxPosition, string> = {
  [NineBoxPosition.STAR]:                   'fhr-badge-success',   // Estrella
  [NineBoxPosition.GROWTH_POTENTIAL]:       'fhr-badge-active',    // Alto Potencial
  [NineBoxPosition.POTENTIAL_GEM]:          'fhr-badge-cyan',      // Diamante en Bruto
  [NineBoxPosition.HIGH_PERFORMER]:         'fhr-badge-active',    // Alto Desempeño
  [NineBoxPosition.CORE_PLAYER]:            'fhr-badge-purple',    // Jugador Clave
  [NineBoxPosition.INCONSISTENT]:           'fhr-badge-warning',   // Inconsistente
  [NineBoxPosition.TRUSTED_PROFESSIONAL]:   'fhr-badge-purple',    // Profesional Confiable
  [NineBoxPosition.AVERAGE_PERFORMER]:      'fhr-badge-draft',     // Desempeño Promedio
  [NineBoxPosition.UNDERPERFORMER]:         'fhr-badge-error'      // Bajo Desempeño
}

// ════════════════════════════════════════════════════════════════════════════
// INTERFACE
// ════════════════════════════════════════════════════════════════════════════
interface NineBoxBadgeProps {
  /** Posición en la matriz 9-Box */
  position: NineBoxPosition
  /** Tamaño */
  size?: 'sm' | 'md' | 'lg'
  /** Mostrar label corto */
  showShortLabel?: boolean
  /** Mostrar label completo */
  showLabel?: boolean
  /** Clases adicionales */
  className?: string
}

const SIZE_CLASSES = {
  sm: 'px-2 py-0.5 text-xs gap-1',
  md: 'px-3 py-1 text-sm gap-1.5',
  lg: 'px-4 py-1.5 text-base gap-2'
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE
// ════════════════════════════════════════════════════════════════════════════
export default memo(function NineBoxBadge({
  position,
  size = 'md',
  showShortLabel = true,
  showLabel = true,
  className
}: NineBoxBadgeProps) {
  const config = getNineBoxPositionConfig(position)

  if (!config) {
    return null
  }

  const fhrBadgeClass = NINEBOX_TO_FHR_BADGE[position] || 'fhr-badge-default'

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
      {showShortLabel && <span>{config.labelShort}</span>}
      {showShortLabel && showLabel && <span className="opacity-60">•</span>}
      {showLabel && <span>{config.label}</span>}
    </span>
  )
})
