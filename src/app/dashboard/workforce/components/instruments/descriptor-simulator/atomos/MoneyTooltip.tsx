'use client'

// ════════════════════════════════════════════════════════════════════════════
// MONEY TOOLTIP — disclaimer financiero estándar del módulo
// atomos/MoneyTooltip.tsx
// ════════════════════════════════════════════════════════════════════════════
// Envuelve cualquier número CLP del Simulador con un tooltip que aclara la base
// del cálculo. Aplicable a montos en cascada, sticky footer, velocímetro, etc.
//
// Texto canónico:
//   "Calculado sobre sueldo bruto. Costo empresa puede variar,
//    normalmente entre 30 a 40% más."
// ════════════════════════════════════════════════════════════════════════════

import { memo, type ReactNode } from 'react'
import { Info } from 'lucide-react'
import { cn } from '@/lib/utils'

export const MONEY_TOOLTIP_TEXT =
  'Calculado sobre sueldo bruto. Costo empresa puede variar, normalmente entre 30 a 40% más.'

interface MoneyTooltipProps {
  children: ReactNode
  /** Mostrar ícono info al lado del número. Default: false (solo title nativo). */
  showIcon?: boolean
  /** Tamaño del ícono — sm (10px) | md (12px) */
  iconSize?: 'sm' | 'md'
  className?: string
  /** Color del ícono — slate por defecto */
  iconColor?: string
}

export default memo(function MoneyTooltip({
  children,
  showIcon = false,
  iconSize = 'sm',
  className,
  iconColor = 'text-slate-500',
}: MoneyTooltipProps) {
  if (!showIcon) {
    return (
      <span title={MONEY_TOOLTIP_TEXT} className={cn('cursor-help', className)}>
        {children}
      </span>
    )
  }
  const sizeClass = iconSize === 'md' ? 'w-3 h-3' : 'w-2.5 h-2.5'
  return (
    <span
      title={MONEY_TOOLTIP_TEXT}
      className={cn('cursor-help inline-flex items-center gap-1', className)}
    >
      {children}
      <Info className={cn(sizeClass, iconColor, 'opacity-60 hover:opacity-100 transition-opacity')} />
    </span>
  )
})
