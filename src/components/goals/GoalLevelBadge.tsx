// ════════════════════════════════════════════════════════════════════════════
// GOAL LEVEL BADGE - Badge de nivel de meta
// src/components/goals/GoalLevelBadge.tsx
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { memo } from 'react'
import { Building2, Users, User } from 'lucide-react'
import { cn } from '@/lib/utils'

// ════════════════════════════════════════════════════════════════════════════
// TIPOS
// ════════════════════════════════════════════════════════════════════════════

type GoalLevel = 'COMPANY' | 'AREA' | 'INDIVIDUAL'

interface GoalLevelBadgeProps {
  level: GoalLevel
  className?: string
}

// ════════════════════════════════════════════════════════════════════════════
// CONFIGURACIÓN
// ════════════════════════════════════════════════════════════════════════════

const LEVEL_CONFIG: Record<GoalLevel, {
  label: string
  icon: typeof Building2
  badgeClass: string
}> = {
  COMPANY: {
    label: 'Empresa',
    icon: Building2,
    badgeClass: 'fhr-badge fhr-badge-active',
  },
  AREA: {
    label: 'Área',
    icon: Users,
    badgeClass: 'fhr-badge fhr-badge-warning',
  },
  INDIVIDUAL: {
    label: 'Individual',
    icon: User,
    badgeClass: 'fhr-badge fhr-badge-success',
  },
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE
// ════════════════════════════════════════════════════════════════════════════

export default memo(function GoalLevelBadge({
  level,
  className = '',
}: GoalLevelBadgeProps) {
  const config = LEVEL_CONFIG[level] || LEVEL_CONFIG.INDIVIDUAL
  const Icon = config.icon

  return (
    <span className={cn(config.badgeClass, className)}>
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  )
})
