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
  scientificBasis?: {
    summary: string
    source: string
    insight?: string
  }
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

/**
 * Evidencia cruzada de CLIMA (EX Clima Gate 5B). Cuando una brecha se origina o
 * se corrobora con clima de equipo, viaja este contexto. Es ADITIVO: opcional en
 * todo el pipeline — sin él, el motor se comporta EXACTAMENTE como antes.
 */
export interface ClimaCrossEvidence {
  driver: string // dimensión de clima (taxonomía real: liderazgo, autonomia, …)
  teamFavorability: number // 0-100
  gap360?: number // brecha 360° que corrobora, si existe
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
  /** Evidencia cruzada de clima (Gate 5B). Opcional — ausencia = comportamiento legacy. */
  climaContext?: ClimaCrossEvidence
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
  /** Presente SOLO si el gap traía climaContext (Gate 5B). Ausente en el flujo 360 puro. */
  climaEvidence?: ClimaCrossEvidence
}
