// ════════════════════════════════════════════════════════════════════════════
// WORKFORCE PLANNING — Types
// src/app/dashboard/workforce/types/workforce.types.ts
// ════════════════════════════════════════════════════════════════════════════

import type {
  OrganizationDiagnostic,
  TalentZombieResult,
  AugmentedFlightRiskResult,
  RedundancyResult,
  AdoptionRiskResult,
  SeniorityCompressionResult,
  InertiaCostResult,
  LiberatedFTEsResult,
  SeveranceLiabilityResult,
  RetentionPriorityResult,
  Alert,
} from '@/lib/services/WorkforceIntelligenceService'

import type {
  OrganizationExposureResult,
} from '@/lib/services/AIExposureService'

// ════════════════════════════════════════════════════════════════════════════
// VIEW & NAVIGATION
// ════════════════════════════════════════════════════════════════════════════

export type CascadeStep = 'portada' | 'ancla' | 'acto1' | 'acto2' | 'acto3' | 'acto4' | 'sintesis'

export type WorkforceView = 'lobby' | 'cascada' | 'estructura' | 'benchmarks' | 'simulador'

// ════════════════════════════════════════════════════════════════════════════
// DIAGNOSTIC DATA — mirrors /api/workforce/diagnostic response
// ════════════════════════════════════════════════════════════════════════════

export interface WorkforceDiagnosticData {
  // 9 detecciones (OrganizationDiagnostic)
  zombies: TalentZombieResult
  flightRisk: AugmentedFlightRiskResult
  redundancy: RedundancyResult
  adoptionRisk: AdoptionRiskResult
  seniorityCompression: SeniorityCompressionResult
  inertiaCost: InertiaCostResult
  liberatedFTEs: LiberatedFTEsResult
  severanceLiability: SeveranceLiabilityResult
  retentionPriority: RetentionPriorityResult
  topAlerts: Alert[]
  netROI: number
  paybackMonths: number
  totalEmployees: number
  enrichedCount: number
  confidence: 'high' | 'medium' | 'low'

  // Exposicion organizacional (OrganizationExposureResult)
  exposure: OrganizationExposureResult

  // Campos computados para cascada
  orgAutomationShare: number
  orgAugmentationShare: number
  zonaCriticaCount: number
  headcountExpuestos: number
}

// Re-export types that cascade components will need
export type {
  OrganizationDiagnostic,
  TalentZombieResult,
  AugmentedFlightRiskResult,
  RedundancyResult,
  AdoptionRiskResult,
  SeniorityCompressionResult,
  InertiaCostResult,
  LiberatedFTEsResult,
  SeveranceLiabilityResult,
  RetentionPriorityResult,
  Alert,
  OrganizationExposureResult,
}
