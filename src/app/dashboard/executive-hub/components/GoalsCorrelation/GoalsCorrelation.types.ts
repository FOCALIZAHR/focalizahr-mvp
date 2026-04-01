// ════════════════════════════════════════════════════════════════════════════
// GOALS CORRELATION — Types
// src/app/dashboard/executive-hub/components/GoalsCorrelation/GoalsCorrelation.types.ts
// ════════════════════════════════════════════════════════════════════════════

import type {
  GoalsCorrelationData,
  GoalsNarratives,
  CorrelationPoint,
  GerenciaGoalsStats,
  NarrativeEmployee,
} from '@/lib/services/GoalsDiagnosticService'

// Re-export for convenience
export type {
  GoalsCorrelationData,
  GoalsNarratives,
  CorrelationPoint,
  GerenciaGoalsStats,
  NarrativeEmployee,
}

export interface GoalsCorrelationProps {
  data: GoalsCorrelationData
}

export type TabKey = 'narrativas' | 'analisis' | 'gerencias'

export interface PortadaNarrative {
  statusBadge?: { label: string; showCheck?: boolean }
  prefix?: string
  highlight: string
  suffix: string
  ctaLabel: string
  ctaVariant: 'cyan' | 'purple' | 'amber' | 'red'
  coachingTip: string
}
