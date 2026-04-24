// src/types/compliance.ts
// Tipos canónicos del pilar Compliance (Ambiente Sano) para consumo del
// frontend. Se re-exportan desde los servicios backend para evitar drift
// entre el shape real del API y el shape que el frontend asume.
//
// Regla: NUNCA duplicar una interface que ya existe en backend; re-exportar.
// Solo agregar aquí tipos que son puramente de presentación (UI state).

// ═══════════════════════════════════════════════════════════════════
// Re-exports backend (canónicos)
// ═══════════════════════════════════════════════════════════════════

export type {
  DepartmentSafetyScore,
  SafetyScoreSkip,
  RiskLevel,
} from '@/lib/services/SafetyScoreService';

export type {
  DepartmentConvergencia,
  ConvergenciaSignal,
  ConvergenciaLevel,
  ConvergenciaResult,
} from '@/lib/services/compliance/ConvergenciaEngine';

export type {
  PortadaNarrative,
  AnclaNarrative,
  DimensionNarrative,
  PatronNarrative,
  GenderAlertDetail,
  ConvergenciaNarrative,
  AlertaNarrative,
  CierreNarrative,
  ReportNarratives,
} from '@/lib/services/compliance/ComplianceNarrativeEngine';

export type {
  ComplianceAlertType,
  ComplianceSource,
  ComplianceSeverity,
} from '@/config/complianceAlertConfig';

export type {
  PatronAnalysisOutput,
  PatronDetectado,
  PatronNombre,
  OrigenPercibido,
  MetaAnalysisOutput,
  OrigenOrganizacional,
  ConfianzaAnalisis,
} from '@/lib/services/compliance/complianceTypes';

export type { ISARiskLevel } from '@/lib/services/compliance/ISAService';

export type {
  Intervention,
  TriggerType,
  TriggerInput,
  Recommendation,
  InterventionPlan,
  DimensionRiskLevel,
} from '@/lib/services/compliance/InterventionEngine';

// ═══════════════════════════════════════════════════════════════════
// Tipos de presentación (frontend-only)
// ═══════════════════════════════════════════════════════════════════

/** Secciones del Rail en orden canónico (9). */
export type ComplianceSectionId =
  | 'sintesis'
  | 'ancla'
  | 'heatmap'
  | 'dimensiones'
  | 'patrones'
  | 'convergencia'
  | 'simulador'
  | 'alertas'
  | 'cierre';

export type CompliancePageState =
  | 'loading'
  | 'empty'
  | 'active'
  | 'closed'
  | 'error';

export interface ComplianceCampaignSummary {
  id: string;
  name: string;
  status: string;
  startDate: string | Date;
  endDate: string | Date;
  completedAt: string | Date | null;
  totalInvited: number;
  totalResponded: number;
  hasCompletedAnalysis: boolean;
}

// ═══════════════════════════════════════════════════════════════════
// Plan actions — representa una acción registrada en el ciclo por el
// CEO, persistida en CompliancePlanAction (campaignId, triggerRef) unique.
// ═══════════════════════════════════════════════════════════════════

export interface CompliancePlanAction {
  id: string;
  campaignId: string;
  accountId: string;
  triggerType: 'dimension_low' | 'patron' | 'alert';
  triggerRef: string;
  triggerLabel: string;
  chosenOption: number; // 0 | 1 | 2
  optionLabel: string;
  interventionId: string;
  evidencia: string | null;
  plazo: string | null;
  registeredAt: string | Date;
  registeredBy: string;
}

export interface CompliancePlanActionsResponse {
  success: true;
  actions: CompliancePlanAction[];
}

// ═══════════════════════════════════════════════════════════════════
// Response shape del GET /api/compliance/report?type=executive
// (Espejo de lo que retorna el endpoint — NO re-derivar acá.)
// ═══════════════════════════════════════════════════════════════════

import type { ReportNarratives } from '@/lib/services/compliance/ComplianceNarrativeEngine';
import type {
  DepartmentSafetyScore,
  SafetyScoreSkip,
} from '@/lib/services/SafetyScoreService';
import type { DepartmentConvergencia } from '@/lib/services/compliance/ConvergenciaEngine';
import type { MetaAnalysisOutput } from '@/lib/services/compliance/complianceTypes';
import type {
  ComplianceAlertType,
  ComplianceSource,
  ComplianceSeverity,
} from '@/config/complianceAlertConfig';

/** Un depto enriquecido por el endpoint /report con ISA + delta vs ciclo anterior. */
export interface ComplianceReportDepartment extends DepartmentSafetyScore {
  isaScore: number | null;
  deltaVsAnterior: number | null;
}

export interface ComplianceReportAlert {
  id: string;
  alertType: ComplianceAlertType;
  severity: ComplianceSeverity;
  status: string;
  title: string;
  description: string;
  departmentId: string | null;
  departmentName: string | null;
  dueDate: string | Date | null;
  slaStatus: string | null;
  createdAt: string | Date;
}

export interface ComplianceReportResponse {
  success: true;
  type: 'executive';
  generatedAt: string;
  campaign: {
    id: string;
    name: string;
    startDate: string | Date;
    endDate: string | Date;
    completedAt: string | Date | null;
  };
  company: {
    name: string;
  };
  narratives: ReportNarratives;
  data: {
    orgSafetyScore: number | null;
    orgISA: number | null;
    departments: ComplianceReportDepartment[];
    skippedByPrivacy: SafetyScoreSkip[];
    metaAnalysis: MetaAnalysisOutput | null;
    convergencia: {
      activeSources: ComplianceSource[];
      departments: DepartmentConvergencia[];
      criticalByManager: Array<{ managerId: string; departmentIds: string[] }>;
    };
    alerts: ComplianceReportAlert[];
  };
  legalNotice: string;
}

export interface ComplianceCampaignsResponse {
  success: true;
  campaigns: ComplianceCampaignSummary[];
}
