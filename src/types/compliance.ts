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
import type {
  ConfianzaAnalisis,
  MetaAnalysisOutput,
  OrigenPercibido,
  PatronNombre,
} from '@/lib/services/compliance/complianceTypes';
import type {
  ComplianceAlertType,
  ComplianceSource,
  ComplianceSeverity,
} from '@/config/complianceAlertConfig';

// ─────────────────────────────────────────────────────────────────────
// Patrones por depto — slice de PatronAnalysisOutput expuesta al frontend
// ─────────────────────────────────────────────────────────────────────

/**
 * Patrón dominante por depto — slice renderable de
 * `PatronAnalysisOutput.patrones[0]` (mayor intensidad).
 *
 * `null` si el depto no tiene patrones detectados — el campo `senal_dominante`
 * en `ComplianceReportDepartmentPatrones` diferencia entre los dos casos:
 *   - 'ambiente_sano'        → ambiente sano confirmado
 *   - 'datos_insuficientes'  → no concluyente (confianza='insuficiente_data')
 */
export interface ComplianceReportPatronDominante {
  nombre: PatronNombre;
  /** Label canónico desde `PATRON_LABELS` del engine (single source of truth). */
  nombreLegible: string;
  intensidad: number;
  /** 4 valores depto-level (sin 'mixto'; ese solo aplica a org-level). */
  origen_percibido: OrigenPercibido;
  /** Max 3 fragmentos, max 8 palabras c/u, identificadores → [CENSURADO]. */
  fragmentos: string[];
}

/**
 * Slice de `PatronAnalysisOutput` por depto expuesta al frontend para
 * SectionPatrones ("La Voz"). Optional en `ComplianceReportDepartment` — campañas
 * legacy sin análisis LLM completado simplemente no traen este campo, y el
 * frontend cae al agregado cross-depto en `narratives.artefacto2_patrones[]`.
 */
export interface ComplianceReportDepartmentPatrones {
  /** Patrón dominante por nombre. Casos especiales: 'ambiente_sano',
   *  'datos_insuficientes'. Cualquier otro valor coincide con un PatronNombre. */
  senal_dominante: string;
  confianza_analisis: ConfianzaAnalisis;
  patron_dominante: ComplianceReportPatronDominante | null;
}

/** Un depto enriquecido por el endpoint /report con ISA + delta vs ciclo anterior. */
export interface ComplianceReportDepartment extends DepartmentSafetyScore {
  isaScore: number | null;
  deltaVsAnterior: number | null;
  /**
   * Optional — slice del PatronAnalysisOutput LLM por depto.
   * Ausente en campañas legacy o sin análisis LLM completado. Frontend debe
   * leer defensivamente con `dept.patrones?.patron_dominante`.
   */
  patrones?: ComplianceReportDepartmentPatrones;
  /**
   * Flag per-dept: el dept tiene métricas numéricas altas (safetyScore ≥ 4.0)
   * pero el LLM detectó al menos un patrón de intensidad ≥ 0.6 — los números
   * dicen una cosa, las respuestas proyectivas dicen otra. Detectado por
   * `detectTeatroCumplimiento()`. Optional: campañas legacy pueden no traerlo.
   */
  teatroCumplimiento?: boolean;
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
    country?: string;
  };
  narratives: ReportNarratives;
  data: {
    orgSafetyScore: number | null;
    orgISA: number | null;
    /** Suma de respuestas P1 (proyectiva) válidas que entraron al LLM por depto.
     *  `null` si el OrgPayload fue persistido antes del deploy de este campo. */
    totalTextResponses: number | null;
    /** Suma de respondentes al cuestionario cuantitativo a nivel org —
     *  mismo denominador que `orgSafetyScore`. Respeta privacy threshold n≥5.
     *  `null` si el OrgPayload fue persistido antes del deploy de este campo. */
    totalRespondents: number | null;
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
