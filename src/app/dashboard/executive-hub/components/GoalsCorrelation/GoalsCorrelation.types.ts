// ════════════════════════════════════════════════════════════════════════════
// GOALS CORRELATION — Types
// src/app/dashboard/executive-hub/components/GoalsCorrelation/GoalsCorrelation.types.ts
// ════════════════════════════════════════════════════════════════════════════

import type {
  // V1 (deprecated — kept for compilation during migration)
  GoalsCorrelationData,
  GoalsNarratives,
  // V2
  GoalsCorrelationDataV2,
  GoalsSegment,
  SubFinding,
  GerenciaGoalsStatsV2,
  CalibrationCross,
  SegmentId,
  // Shared
  CorrelationPoint,
  GerenciaGoalsStats,
  NarrativeEmployee,
  ResolvedBadge,
  NarrativeBadges,
} from '@/lib/services/GoalsDiagnosticService'

// Re-export for convenience
export type {
  // V1 deprecated
  GoalsCorrelationData,
  GoalsNarratives,
  // V2
  GoalsCorrelationDataV2,
  GoalsSegment,
  SubFinding,
  GerenciaGoalsStatsV2,
  CalibrationCross,
  SegmentId,
  // Shared
  CorrelationPoint,
  GerenciaGoalsStats,
  NarrativeEmployee,
  ResolvedBadge,
  NarrativeBadges,
}

/** @deprecated Use GoalsCorrelationPropsV2 */
export interface GoalsCorrelationProps {
  data: GoalsCorrelationData
}

export interface GoalsCorrelationPropsV2 {
  data: GoalsCorrelationDataV2
}

export type TabKeyV2 = 'entregaron' | 'no_entregaron' | 'organizacional' | 'analisis'

/** @deprecated */
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
