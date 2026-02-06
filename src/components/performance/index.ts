// ════════════════════════════════════════════════════════════════════════════
// PERFORMANCE COMPONENTS - Barrel Exports
// src/components/performance/index.ts
// ════════════════════════════════════════════════════════════════════════════

// Core components
export { default as PerformanceBadge } from './PerformanceBadge'
export { default as PerformanceScoreCard } from './PerformanceScoreCard'
export { default as PerformanceResultCard } from './PerformanceResultCard'

// 9-Box components
export { default as NineBoxBadge } from './NineBoxBadge'
export { default as NineBoxGrid } from './NineBoxGrid'
export { default as NineBoxDrawer } from './NineBoxDrawer'

// Summary components
export { default as TeamCalibrationHUD } from './TeamCalibrationHUD'
export { default as ManagementAlertsHUD } from './ManagementAlertsHUD'
export { default as EvaluationReviewModal } from './EvaluationReviewModal'

// Potential assignment
export { default as RatingRow } from './RatingRow'
export { default as DistributionGauge } from './DistributionGauge'

// Type exports
export type { Employee9Box, GridCell, NineBoxGridProps } from './NineBoxGrid'
export type { RatingData, RatingRowProps } from './RatingRow'
