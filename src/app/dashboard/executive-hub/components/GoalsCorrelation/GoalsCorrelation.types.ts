// ════════════════════════════════════════════════════════════════════════════
// GOALS CORRELATION — Types V2
// src/app/dashboard/executive-hub/components/GoalsCorrelation/GoalsCorrelation.types.ts
// ════════════════════════════════════════════════════════════════════════════

import type {
  GoalsCorrelationDataV2,
  GoalsSegment,
  SubFinding,
  GerenciaGoalsStatsV2,
  CalibrationCross,
  SegmentId,
  CorrelationPoint,
  GerenciaGoalsStats,
  NarrativeEmployee,
  ResolvedBadge,
  NarrativeBadges,
  ManagerGoalsStats,
} from '@/lib/services/GoalsDiagnosticService'

// Re-export for convenience
export type {
  GoalsCorrelationDataV2,
  GoalsSegment,
  SubFinding,
  GerenciaGoalsStatsV2,
  CalibrationCross,
  SegmentId,
  CorrelationPoint,
  GerenciaGoalsStats,
  NarrativeEmployee,
  ResolvedBadge,
  NarrativeBadges,
  ManagerGoalsStats,
}

export interface GoalsCorrelationPropsV2 {
  data: GoalsCorrelationDataV2
}

export interface PortadaNarrative {
  statusBadge?: { label: string; showCheck?: boolean }
  prefix?: string
  highlight: string
  suffix: string
  ctaLabel: string
  ctaVariant: 'cyan' | 'purple' | 'amber' | 'red'
  coachingTip: string
}
