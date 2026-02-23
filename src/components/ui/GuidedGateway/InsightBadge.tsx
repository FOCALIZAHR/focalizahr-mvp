// src/components/ui/GuidedGateway/InsightBadge.tsx

'use client'

import { memo } from 'react'
import { Target } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { GuidedGatewayInsight } from './types'

// ════════════════════════════════════════════════════════════════════════════
// CONFIGURACIÓN DE COLORES
// ════════════════════════════════════════════════════════════════════════════

const COLOR_CLASSES = {
  cyan: {
    container: 'bg-cyan-500/10 border-cyan-500/30',
    text: 'text-cyan-400',
    icon: 'text-cyan-400'
  },
  purple: {
    container: 'bg-purple-500/10 border-purple-500/30',
    text: 'text-purple-400',
    icon: 'text-purple-400'
  },
  green: {
    container: 'bg-emerald-500/10 border-emerald-500/30',
    text: 'text-emerald-400',
    icon: 'text-emerald-400'
  },
  amber: {
    container: 'bg-amber-500/10 border-amber-500/30',
    text: 'text-amber-400',
    icon: 'text-amber-400'
  },
  red: {
    container: 'bg-red-500/10 border-red-500/30',
    text: 'text-red-400',
    icon: 'text-red-400'
  }
} as const

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE
// ════════════════════════════════════════════════════════════════════════════

interface InsightBadgeProps extends GuidedGatewayInsight {
  className?: string
}

/**
 * Badge para mostrar métricas destacadas en GuidedGateway
 * 
 * @example
 * ```tsx
 * <InsightBadge 
 *   label="Role Fit" 
 *   value="78%" 
 *   color="cyan" 
 * />
 * ```
 */
export default memo(function InsightBadge({
  label,
  value,
  icon: Icon = Target,
  color = 'cyan',
  className
}: InsightBadgeProps) {
  const colors = COLOR_CLASSES[color]

  return (
    <div
      className={cn(
        'inline-flex items-center gap-3 px-5 py-3 rounded-2xl border',
        'backdrop-blur-sm transition-all duration-300',
        colors.container,
        className
      )}
    >
      <Icon className={cn('w-5 h-5', colors.icon)} />
      <div className="flex flex-col items-start">
        <span className={cn(
          'text-[10px] uppercase tracking-wider font-medium opacity-70',
          colors.text
        )}>
          {label}
        </span>
        <span className={cn('text-xl font-bold leading-none', colors.text)}>
          {value}
        </span>
      </div>
    </div>
  )
})