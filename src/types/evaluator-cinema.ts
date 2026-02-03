// src/types/evaluator-cinema.ts
// Cinema Mode v5 types for the evaluator portal

import type { LucideIcon } from 'lucide-react'
import type { Insight } from '@/lib/utils/calculateInsights'

// ═══════════════════════════════════════════════════════════════════════
// DATOS DEL BACKEND (shape from /api/evaluator/assignments)
// ═══════════════════════════════════════════════════════════════════════

export interface EvaluatorAssignment {
  id: string
  status: string
  completedAt?: string
  dueDate?: string
  evaluationType: string

  evaluatee: {
    id: string
    fullName: string
    position: string | null
    departmentName: string
    tenure: string
  }

  avgScore: number | null
  participantToken: string | null
  surveyUrl: string | null
}

// ═══════════════════════════════════════════════════════════════════════
// TIPOS CINEMA MODE v5
// ═══════════════════════════════════════════════════════════════════════

export type EmployeeCardStatus = 'ready' | 'waiting' | 'in_progress' | 'completed'

export type CarouselTab = 'all' | 'pending' | 'completed'

export interface EmployeeCardData {
  id: string
  assignmentId: string
  fullName: string
  displayName: string
  displayNameFull: string
  position: string
  departmentName: string
  tenure: string
  status: EmployeeCardStatus
  participantToken: string | null
  evaluationType: string
  dueDate?: string
  completedAt?: string
  avgScore: number | null
}

export interface SelectedEmployee extends EmployeeCardData {
  insights: Insight[]
}

export interface CinemaStats {
  total: number
  completed: number
  pending: number
}

export interface CinemaCycle {
  id: string
  name: string
  description?: string | null
  startDate: string
  endDate: string
  daysRemaining: number
}

// ═══════════════════════════════════════════════════════════════════════
// PROPS DE COMPONENTES
// ═══════════════════════════════════════════════════════════════════════

export interface MissionControlProps {
  stats: CinemaStats
  cycle: CinemaCycle
  nextEmployee: { id: string; displayName: string } | null
  onStart: (employeeId: string) => void
}

export interface SpotlightCardProps {
  employee: SelectedEmployee
  onBack: () => void
  onEvaluate: (token: string) => void
  onViewSummary: (assignmentId: string) => void
}

export interface VictoryScreenProps {
  total: number
  onViewTeam: () => void
}

export interface RailProps {
  employees: EmployeeCardData[]
  selectedId: string | null
  isExpanded: boolean
  activeTab: CarouselTab
  onToggle: () => void
  onSelect: (id: string) => void
  onTabChange: (tab: CarouselTab) => void
}

export interface EmployeeRailCardProps {
  employee: EmployeeCardData
  isSelected: boolean
  onClick: () => void
}

export interface CinemaHeaderProps {
  cycle: CinemaCycle | null
}

export interface InsightCardProps {
  insight: Insight
}

// ═══════════════════════════════════════════════════════════════════════════
// CINEMA SUMMARY TYPES
// Tipos para la vista de resumen en modo Cinema
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Score de una competencia individual con breakdown por tipo evaluador
 */
export interface CompetencyScoreSummary {
  competencyCode: string
  competencyName: string
  overallAvgScore: number
  selfScore: number | null
  managerScore: number | null
  peerAvgScore: number | null
  upwardAvgScore: number | null
  selfVsOthersGap: number | null
}

/**
 * Análisis de brechas - fortalezas y áreas de desarrollo
 */
export interface GapAnalysisSummary {
  strengths: Array<{
    competencyCode: string
    competencyName: string
    avgScore: number
    highlight: string
  }>
  developmentAreas: Array<{
    competencyCode: string
    competencyName: string
    avgScore: number
    priority: 'ALTA' | 'MEDIA' | 'BAJA'
  }>
}

/**
 * Respuesta categorizada de una pregunta
 */
export interface CategorizedResponse {
  questionId: string
  questionText: string
  questionOrder: number
  responseType: 'rating_scale' | 'nps_scale' | 'text_open' | 'single_choice' | 'multiple_choice'
  rating: number | null
  textResponse: string | null
  choiceResponse: string[] | null
  normalizedScore: number | null
}

/**
 * Datos completos del Cinema Summary
 */
export interface CinemaSummaryData {
  assignmentId: string
  evaluationType: string
  completedAt: string

  evaluatee: {
    fullName: string
    position: string | null
    department: string
  }

  cycle: {
    name: string
    endDate: string
  }

  // Datos básicos (del API existente)
  averageScore: number | null
  totalQuestions: number
  categorizedResponses: Record<string, CategorizedResponse[]>

  // Datos enriquecidos (del PerformanceResultsService)
  competencyScores: CompetencyScoreSummary[] | null
  gapAnalysis: GapAnalysisSummary | null
  overallScore: number | null
}

/**
 * Props para el header del Cinema Summary
 */
export interface CinemaSummaryHeaderProps {
  evaluatee: {
    fullName: string
    position: string | null
    department: string
  }
  completedAt: string
  score: number | null
  gapAnalysis: GapAnalysisSummary | null
}

/**
 * Props para el card del carrusel de competencias
 */
export interface CompetencyCarouselCardProps {
  code: string
  name: string
  score: number
  questionCount: number
  isSelected: boolean
  onClick: () => void
}

/**
 * Props para el panel de detalle de competencia
 */
export interface CompetencyDetailPanelProps {
  responses: CategorizedResponse[]
  categoryName: string
  avgScore?: number | null
}
