// ════════════════════════════════════════════════════════════════════════════
// POTENTIAL TYPES - Sistema AAE (Aspiración, Ability, Engagement)
// src/types/potential.ts
// ════════════════════════════════════════════════════════════════════════════

import type { LucideIcon } from 'lucide-react'

// ════════════════════════════════════════════════════════════════════════════
// FACTOR LEVELS
// ════════════════════════════════════════════════════════════════════════════

export type FactorLevel = 1 | 2 | 3

export type FactorKey = 'aspiration' | 'ability' | 'engagement'

// ════════════════════════════════════════════════════════════════════════════
// POTENTIAL FACTORS (Estado del evaluador)
// ════════════════════════════════════════════════════════════════════════════

export interface PotentialFactors {
  aspiration: FactorLevel | null
  ability: FactorLevel | null
  engagement: FactorLevel | null
}

// ════════════════════════════════════════════════════════════════════════════
// LEVEL CONTENT (Contenido de cada nivel)
// ════════════════════════════════════════════════════════════════════════════

export interface LevelContent {
  value: FactorLevel
  label: string
  shortDescription: string
  indicators: string[]
}

// ════════════════════════════════════════════════════════════════════════════
// FACTOR CONTENT (Contenido completo de un factor)
// ════════════════════════════════════════════════════════════════════════════

export interface FactorContent {
  key: FactorKey
  name: string
  question: string
  icon: LucideIcon
  color: string
  colorGlow: string
  levels: LevelContent[]
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENT PROPS
// ════════════════════════════════════════════════════════════════════════════

export interface AAEPotentialRendererProps {
  /** ID del rating para guardar */
  ratingId: string
  /** Nombre del empleado para mostrar */
  employeeName: string
  /** Score de desempeño (1-5) para calcular 9-Box */
  performanceScore: number
  /** Factores existentes si ya fueron evaluados */
  existingFactors?: PotentialFactors
  /** Notas existentes */
  existingNotes?: string
  /** Callback al guardar */
  onSave: (factors: PotentialFactors, notes: string) => Promise<void>
  /** Callback al cancelar */
  onCancel: () => void
}

export interface TrinityCardsProps {
  factors: PotentialFactors
  activeFactor: FactorKey | null
  onFactorSelect: (factor: FactorKey) => void
}

export interface FactorEvaluatorProps {
  factor: FactorContent
  selectedLevel: FactorLevel | null
  onLevelSelect: (level: FactorLevel) => void
  onNext: () => void
  onPrev: () => void
  canGoNext: boolean
  canGoPrev: boolean
  isLastFactor: boolean
}

export interface NineBoxMiniPreviewProps {
  performanceScore: number
  potentialScore: number | null
}

// ════════════════════════════════════════════════════════════════════════════
// API TYPES
// ════════════════════════════════════════════════════════════════════════════

export interface SavePotentialRequest {
  aspiration: FactorLevel
  ability: FactorLevel
  engagement: FactorLevel
  notes?: string
}

export interface SavePotentialResponse {
  success: boolean
  data?: {
    potentialScore: number
    potentialLevel: 'high' | 'medium' | 'low'
    nineBoxPosition: string
  }
  error?: string
}

// ════════════════════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════════════════════

/**
 * Verifica si todos los factores están completos
 */
export function areFactorsComplete(factors: PotentialFactors): boolean {
  return (
    factors.aspiration !== null &&
    factors.ability !== null &&
    factors.engagement !== null
  )
}

/**
 * Calcula el score de potencial basado en los 3 factores
 * Fórmula: 1 + ((avg - 1) * 2) → Mapea 1-3 a 1-5
 */
export function calculatePotentialScore(factors: PotentialFactors): number | null {
  if (!areFactorsComplete(factors)) return null
  
  const avg = (factors.aspiration! + factors.ability! + factors.engagement!) / 3
  const score = 1 + ((avg - 1) * 2)
  
  return Math.round(score * 10) / 10 // 1 decimal
}

/**
 * Cuenta factores completados
 */
export function countCompletedFactors(factors: PotentialFactors): number {
  let count = 0
  if (factors.aspiration !== null) count++
  if (factors.ability !== null) count++
  if (factors.engagement !== null) count++
  return count
}