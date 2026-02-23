// src/components/ui/GuidedGateway/types.ts

import { LucideIcon } from 'lucide-react'

/**
 * Configuración del badge de insight/métrica
 * Usado por InsightBadge (standalone)
 */
export interface GuidedGatewayInsight {
  /** Etiqueta del insight (ej: "Role Fit") */
  label: string
  /** Valor a mostrar (ej: "78%" o número) */
  value: string | number
  /** Icono opcional (default: Target) */
  icon?: LucideIcon
  /** Color del badge */
  color?: 'cyan' | 'purple' | 'green' | 'amber' | 'red'
}

// Re-export v2 props
export type { GuidedGatewayProps } from './index'
