import {
  DevelopmentGapType,
  DevelopmentPriority,
  DevelopmentCategory
} from '@prisma/client'

// ════════════════════════════════════════════════════════════════════════════
// TIPOS PARA EL MOTOR DE SUGERENCIAS PDI
// ════════════════════════════════════════════════════════════════════════════

export type PerformanceTrack = 'EJECUTIVO' | 'MANAGER' | 'COLABORADOR'

export interface SuggestionGoal {
  title: string
  description: string
  action: string
  targetOutcome: string
  category: DevelopmentCategory
  priority: DevelopmentPriority
  suggestedResources: SuggestedResource[]
  estimatedWeeks?: number
}

export interface SuggestedResource {
  type: 'COURSE' | 'BOOK' | 'VIDEO' | 'PRACTICE' | 'MENTORING' | 'TEMPLATE'
  title: string
  provider?: string
  url?: string
  estimatedHours?: number
}

// Estrategias por tipo de gap
export interface GapStrategies {
  blindSpot: SuggestionGoal[]
  development: SuggestionGoal[]
  strength: SuggestionGoal[]
}

// Estrategias diferenciadas por track
export interface TrackStrategies {
  EJECUTIVO: GapStrategies
  MANAGER: GapStrategies
  COLABORADOR: GapStrategies
}

// Template completo de competencia
export interface CompetencyTemplate {
  code: string
  name: string
  keywords: string[]
  strategies: TrackStrategies
  coachingTips: {
    blindSpot: string[]
    development: string[]
    strength: string[]
  }
}

// Input del motor
export interface GapAnalysisInput {
  competencyCode: string
  competencyName: string
  selfScore: number
  managerScore: number
  peerAvgScore?: number
  gapType: DevelopmentGapType
  gapValue: number
}

// Output del motor
export interface GeneratedSuggestion {
  competencyCode: string
  competencyName: string
  gapType: DevelopmentGapType
  originalGap: number
  suggestion: SuggestionGoal
  coachingTip: string
  priority: DevelopmentPriority
}
