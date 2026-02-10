// ════════════════════════════════════════════════════════════════════════════
// POTENTIAL COMPONENTS - Barrel Export
// src/components/potential/index.ts
// ════════════════════════════════════════════════════════════════════════════

// Main component
export { default as AAEPotentialRenderer } from './AAEPotentialRenderer'

// Sub-components
export { default as TrinityCards } from './TrinityCards'
export { default as FactorEvaluator } from './FactorEvaluator'
export { default as NineBoxMiniPreview } from './NineBoxMiniPreview'

// Re-export types
export type {
  FactorLevel,
  FactorKey,
  PotentialFactors,
  AAEPotentialRendererProps,
  TrinityCardsProps,
  FactorEvaluatorProps,
  NineBoxMiniPreviewProps,
  SavePotentialRequest,
  SavePotentialResponse
} from '@/types/potential'

// Re-export helpers
export {
  areFactorsComplete,
  calculatePotentialScore,
  countCompletedFactors
} from '@/types/potential'

// Re-export content
export {
  AAE_FACTORS,
  FACTORS_ORDER,
  FACTOR_COLORS,
  getNextFactor,
  getPrevFactor,
  getLevelContent
} from '@/lib/potential-content'