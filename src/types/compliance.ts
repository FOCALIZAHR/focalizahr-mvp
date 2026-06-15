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

import type { ISAResult } from '@/lib/services/compliance/ISAService';

export type {
  CoverageAnalysisResult,
  CoverageDeptItem,
  CoverageBranch,
  CoverageAnalyzedStatus,
  SilencioVozExternaItem as CoverageSilencioVozExternaItem,
  ParticipacionAnomalaItem as CoverageParticipacionAnomalaItem,
} from '@/lib/services/compliance/CoverageAnalysisService';
import type {
  CoverageAnalysisResult,
  CoverageAnalyzedStatus,
} from '@/lib/services/compliance/CoverageAnalysisService';

/** Item OTRO MUNDO — depto NO invitado a la campaña con señal externa
 *  activa de peso ≥ umbral. Re-export del shape del motor puro
 *  (`SilencioDetected` filtrado a `bucketTarget='no_invitado'`). El render
 *  ignora `saborSub` (siempre `null` para OTRO MUNDO). */
export type { SilencioDetected as OtroMundoItem } from '@/lib/services/compliance/detectSilencioConVozExterna';
import type { SilencioDetected as OtroMundoItem } from '@/lib/services/compliance/detectSilencioConVozExterna';

export type {
  DepartmentConvergencia,
  ConvergenciaSignal,
  ConvergenciaLevel,
  ConvergenciaResult,
} from '@/lib/services/compliance/ConvergenciaEngine';

export type {
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

import type { TriggerType } from '@/lib/services/compliance/InterventionEngine';

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

/** Secciones del Rail en orden canónico (10). */
export type ComplianceSectionId =
  | 'sintesis'
  | 'cascada'
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
  triggerType: TriggerType;
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
    /** Desglose del ISA org-level para el Acto Ancla. null en campañas legacy. */
    isaComponents: ISAResult['components'] | null;
    /** Suma de respuestas P1 (proyectiva) válidas que entraron al LLM por depto.
     *  `null` si el OrgPayload fue persistido antes del deploy de este campo. */
    totalTextResponses: number | null;
    /** Suma de respondentes al cuestionario cuantitativo a nivel org —
     *  mismo denominador que `orgSafetyScore`. Respeta privacy threshold n≥5.
     *  `null` si el OrgPayload fue persistido antes del deploy de este campo. */
    totalRespondents: number | null;
    /** P2 — Universo total de departamentos: todos los deptos del account
     *  con al menos una persona activa (independiente del threshold de
     *  privacidad). Es el denominador correcto del CHIP 1 ("Afecta X de Y
     *  áreas"). Para AREA_MANAGER se filtra por la jerarquía visible.
     *  Optional para defender payloads pre-deploy del campo (cae a
     *  `departments.length` en el frontend). */
    totalDeptosUniverso?: number;
    /** Análisis de cobertura/participación org-level — input del Acto 0 de
     *  la Cascada Ejecutiva. Computado en runtime (no persistido). */
    coverage: CoverageAnalysisResult;
    departments: ComplianceReportDepartment[];
    skippedByPrivacy: SafetyScoreSkip[];
    metaAnalysis: MetaAnalysisOutput | null;
    convergencia: {
      activeSources: ComplianceSource[];
      departments: DepartmentConvergencia[];
      criticalByManager: Array<{ managerId: string; departmentIds: string[] }>;
    };
    alerts: ComplianceReportAlert[];
    /** Sexta alerta — deptos del universo campaign-scope en bucket
     *  `sub_threshold` (analyzed ∈ {skipped_privacy, no_response}) con señal
     *  externa activa. Modelo post-cf0be7c (spec MODELO_SEXTA_OTRO_MUNDO §1):
     *  los `completed` ya tienen ISA visible (entran al análisis normal).
     *  Optional para defender payloads pre-deploy del campo. */
    silencioVozExterna?: SilencioVozExternaItem[];
    /** OTRO MUNDO — deptos NO invitados a la campaña con señal externa activa.
     *  Fuente paralela company-scope (`computeOtroMundo`) — el punto ciego que
     *  el universo campaign-scope no captura. RBAC: `AREA_MANAGER` recibe `[]`
     *  (gate por rol, patrón Beat 5). Runtime, no persistido. */
    otroMundo?: OtroMundoItem[];
    /** Score de riesgo por dept — todo el universo activo del account
     *  (con_isa + sub_threshold + no_invitado), no solo los con AS.
     *  Runtime, no persistido. Optional para defender payloads pre-deploy. */
    riskScores?: DepartmentRiskScore[];
    /** Semilla del hilo único Beat 1 ↔ Beat 6 — Gate 3+. Optional para
     *  defender payloads legacy. Cuando presente, el frontend nuevo lo
     *  consume; cuando ausente, cae a la lógica client-side legacy. */
    beat1Seed?: import('@/types/ambiente-cascada').Beat1Seed;
    /** Síntesis ejecutiva del Beat 6 — output del AmbienteSynthesisEngine.
     *  Gate 3+. `null` significa que el Engine corrió pero no aplica (caso
     *  patológico GENERIC con orgISA=null). Optional para legacy. */
    synthesis?: import('@/types/ambiente-cascada').AmbienteSynthesis | null;
  };
  legalNotice: string;
}

/** Item de la sexta alerta para la banda dedicada en `ActoCobertura`. */
export interface SilencioVozExternaItem {
  departmentId: string | null;
  departmentName: string | null;
  /** Narrativa ejecutiva ya interpolada con el nombre del depto. */
  narrativa: string;
  /** Cantidad de señales externas de peso medio o superior que la dispararon. */
  signalsCount: number;
  /** Estado del depto frente al análisis AS (4-way). Habilita el sub-split
   *  A/B en render sin re-llamar al motor en cliente:
   *   - `skipped_privacy` → sabor A (invitado, alguien respondió pero n<5)
   *   - `no_response`     → sabor B (invitado, cero respuestas)
   *   - otros valores son defensive — la sexta solo dispara para sub_threshold.
   *  `null` si el JOIN con coverage.deptosCobertura no encuentra el depto
   *  (defensive — no debería ocurrir post Paso 4). */
  analyzed: CoverageAnalyzedStatus | null;
}

// ════════════════════════════════════════════════════════════════════════════
// Score de riesgo por departamento (Paso 2 — runtime, no persistido).
// Diseño cerrado en .claude/tasks/SCORE_RIESGO_DEPARTAMENTO_DISENO_CERRADO.md.
// ════════════════════════════════════════════════════════════════════════════

/** Item de alerta externa expuesto en la descomposición del riesgo.
 *  Es el origen de `pesoAlertas`; el render usa esto para narrar el desglose. */
export interface DepartmentRiskAlertItem {
  alertType: string;
  producto: 'exit' | 'onboarding';
  pesoEfectivo: number;
}

/** Bucket del dept para la lectura del score:
 *  - `con_isa`: tiene ComplianceAnalysis COMPLETED (≥5 respondieron).
 *  - `sub_threshold`: invitado pero <5 respondieron (`skipped_privacy` o `no_response`).
 *  - `no_invitado`: no entró al universo de la campaña — el driver confiabilidad NO aplica. */
export type DepartmentRiskBucket = 'con_isa' | 'sub_threshold' | 'no_invitado';

/** Por qué el `score` vale lo que vale:
 *  - `suma`: `score = inferido` (la suma de drivers gana).
 *  - `piso_aplicado`: `score = piso_denuncia` (la inferencia daba menos, la denuncia decide). */
export type DepartmentRiskReason = 'suma' | 'piso_aplicado';

/** Score de riesgo por dept con descomposición auditable.
 *  El render NUNCA muestra el `score` sin nombrar los `drivers` que lo componen. */
export interface DepartmentRiskScore {
  departmentId: string;
  departmentName: string;
  /** 0-100, redondeado. */
  score: number;
  bucket: DepartmentRiskBucket;
  drivers: {
    /** C = 50·s². `0` si el driver no aplica (no invitado). */
    confiabilidad: number;
    /** A = 50·pesoAlertas/(pesoAlertas+3). */
    voz_externa: number;
    /** `75` si denuncias_12m ≥ 1; `0` si no. Nunca anónimo en la explicación. */
    piso_denuncia: number;
  };
  reason: DepartmentRiskReason;
  inputs: {
    /** 0-100, o `null` si el dept no fue invitado. */
    participacion: number | null;
    /** Σ pesoEfectivo de alertas activas. Siempre ≥ 0. */
    pesoAlertas: number;
    /** Σ issueCount en ventana 12m. `null` ≠ `0`:
     *  null = sin métrica cargada (frontend no debe leer "sin denuncias");
     *  0 = cargada, sin denuncias. */
    denuncias_12m: number | null;
  };
  /** Origen de `pesoAlertas` — para narrar el desglose en el render. */
  alertas: DepartmentRiskAlertItem[];
  /** Gerencia (level 2) que contiene este dept. Semántica del 3-estado:
   *  - campo ausente (undefined) → payload pre-deploy, frontend no debe asumir.
   *  - poblado con `null` → el dept ES gerencia (level 2), o es holding (level 1),
   *    o no resolvió ancestro level 2 dentro del set visible (RBAC).
   *  - poblado con valor → dept hijo, agrupable bajo esa gerencia.
   *  Filtrado por `visibleDeptIds`: nunca expone una gerencia fuera del scope
   *  del caller (privacy hardened para AREA_MANAGER). */
  parentGerenciaId?: string | null;
  /** Display name de la gerencia ancestro. Espejo de parentGerenciaId. */
  parentGerenciaName?: string | null;
}

export interface ComplianceCampaignsResponse {
  success: true;
  campaigns: ComplianceCampaignSummary[];
}
