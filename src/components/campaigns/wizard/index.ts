// Campaign Wizard Components - Paso 3B (Employee-Based)

// ════════════════════════════════════════════════════════════════════════════
// TIPOS: ManualOverride para auditoría de cambios manuales
// ════════════════════════════════════════════════════════════════════════════

export interface ManualOverride {
  excluded: boolean           // true = Excluir, false = Forzar inclusión
  updatedBy: string           // Nombre del Admin que hizo el cambio
  updatedAt: Date             // Timestamp del cambio
  originalStatus: 'eligible' | 'excluded_by_criteria'  // Estado original antes del override
}

export type ManualOverrides = Record<string, ManualOverride>

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTS
// ════════════════════════════════════════════════════════════════════════════

export { default as ParticipantCriteriaSelector } from './ParticipantCriteriaSelector'
export type { InclusionCriteria, Department } from './ParticipantCriteriaSelector'
export { DEFAULT_CRITERIA } from './ParticipantCriteriaSelector'

export { default as ParticipantEligibilityPreview } from './ParticipantEligibilityPreview'
export { calculateEligibility } from './ParticipantEligibilityPreview'
export type { EligibilityResult } from './ParticipantEligibilityPreview'

export { default as ParticipantManualAdjustment } from './ParticipantManualAdjustment'

export { default as EmployeeEligibilityRow } from './EmployeeEligibilityRow'
export { calculateTenureMonths } from './EmployeeEligibilityRow'
export type { EligibleEmployee, EligibilityStatus } from './EmployeeEligibilityRow'
