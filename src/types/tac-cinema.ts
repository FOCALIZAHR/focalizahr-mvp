// src/types/tac-cinema.ts
// Cinema Mode TAC types — clonado de evaluator-cinema.ts

import type { GerenciaMapItem, GerenciaPattern } from '@/lib/services/TalentActionService'

// ═══════════════════════════════════════════════════════════════════════
// DATOS CARD (equivalente a EmployeeCardData)
// ═══════════════════════════════════════════════════════════════════════

export interface GerenciaCardData {
  id: string
  displayName: string
  pattern: GerenciaPattern | null
  totalPersonas: number
  clasificadas: number
  icc: number | null
  fugaCount: number
  burnoutCount: number
  motorCount: number
  bajoRendimientoCount: number
  plTotal: number
  requiresAction: boolean
  dataInsufficient: boolean
  sucesoresTotal: number
  sucesoresEnPlan: number
}

// ═══════════════════════════════════════════════════════════════════════
// SELECTED (equivalente a SelectedEmployee)
// ═══════════════════════════════════════════════════════════════════════

export interface SelectedGerencia extends GerenciaCardData {
  full: GerenciaMapItem
}

// ═══════════════════════════════════════════════════════════════════════
// STATS (equivalente a CinemaStats)
// ═══════════════════════════════════════════════════════════════════════

export interface TACCinemaStats {
  totalGerencias: number
  totalPersonas: number
  totalClasificadas: number
  iccOrganizacional: number | null
  gerenciasEnRiesgo: number
  personasEnFuga: number
  plTotal: number
  patronDominante: string | null
}

// ═══════════════════════════════════════════════════════════════════════
// RAIL (equivalente a CarouselTab)
// ═══════════════════════════════════════════════════════════════════════

export type TACRailPill = 'gerencias' | 'personas'

// ═══════════════════════════════════════════════════════════════════════
// PROPS DE COMPONENTES (equivalentes)
// ═══════════════════════════════════════════════════════════════════════

export interface TACMissionControlProps {
  stats: TACCinemaStats
  nextGerencia: { id: string; displayName: string } | null
  onStart: (gerenciaId: string) => void
}

export interface TACSpotlightCardProps {
  gerencia: SelectedGerencia
  onBack: () => void
  onOpenDetail: (quadrant?: string) => void
  onCloseDetail?: () => void
  activeQuadrant?: string
}

export interface TACRailProps {
  gerencias: GerenciaCardData[]
  stats: TACCinemaStats
  selectedId: string | null
  isExpanded: boolean
  activePill: TACRailPill
  onToggle: () => void
  onSelect: (id: string) => void
  onPillChange: (pill: TACRailPill) => void
  onOpenQuadrantDetail: (quadrant: string) => void
  flaggedGerencias?: Set<string>
}

export interface GerenciaRailCardProps {
  gerencia: GerenciaCardData
  isSelected: boolean
  onClick: () => void
}

export interface TACDetailModalProps {
  isOpen: boolean
  onClose: () => void
  gerencia: SelectedGerencia | null
  expandedQuadrant?: string
}
