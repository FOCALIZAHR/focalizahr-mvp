// ============================================================================
// JOB CLASSIFICATION - Type Definitions
// src/types/job-classification.ts
// ============================================================================

export type PerformanceTrack = 'COLABORADOR' | 'MANAGER' | 'EJECUTIVO'

export type StandardJobLevel =
  | 'gerente_director'
  | 'subgerente_subdirector'
  | 'jefe'
  | 'supervisor_coordinador'
  | 'profesional_analista'
  | 'asistente_otros'
  | 'operativo_auxiliar'

/**
 * Represents a position group in the classification draft.
 * Each entry corresponds to a unique position title and may
 * affect multiple employees with that same position.
 */
export interface ClassificationEmployee {
  id: string
  fullName: string
  position: string
  departmentName: string | null
  directReportsCount: number

  // Current classification (from Employee table)
  currentTrack: PerformanceTrack | null
  currentJobLevel: string | null

  // Draft classification (pending, not persisted until confirm)
  draftTrack: PerformanceTrack | null
  draftJobLevel: string | null

  // Suggestions from PositionAdapter
  suggestedTrack: PerformanceTrack
  suggestedJobLevel: string | null
  confidence: number
  anomalyType: 'NONE' | 'NO_MATCH' | 'CONFLICT' | null
  isReviewed: boolean

  // Position group metadata
  employeeCount: number
  employeeIds: string[]
}

/**
 * Draft stored in localStorage. Contains all unclassified position groups
 * plus API metadata needed for summary computation.
 */
export interface ClassificationDraft {
  accountId: string
  createdAt: string
  updatedAt: string
  employees: ClassificationEmployee[]

  // API snapshot for summary calculation
  apiTotalEmployees: number
  apiClassified: number
  apiByTrack: {
    ejecutivo: number
    manager: number
    colaborador: number
  }
  apiAnomalies: number
}

/**
 * Computed summary combining API baseline data + draft state.
 */
export interface ClassificationSummaryData {
  total: number
  classified: number
  pending: number
  byTrack: {
    EJECUTIVO: number
    MANAGER: number
    COLABORADOR: number
  }
  anomalies: number
  classificationRate: number
}

export interface UseClassificationDraftReturn {
  // State
  draft: ClassificationDraft | null
  summary: ClassificationSummaryData
  isLoading: boolean
  error: string | null
  isDirty: boolean

  // Actions
  approveAll: () => void
  approveByTrack: (track: PerformanceTrack) => void
  updateClassification: (employeeId: string, track: PerformanceTrack, jobLevel: string) => void
  resetEmployee: (employeeId: string) => void

  // Persistence (API calls ONLY here)
  handleContinue: () => Promise<boolean>
  handleCancel: () => void

  // Helpers
  getEmployee: (employeeId: string) => ClassificationEmployee | undefined
  getPendingEmployees: () => ClassificationEmployee[]
  getClassifiedEmployees: () => ClassificationEmployee[]
}
