// src/types/clima.ts
// Tipos frontend de EX Clima (Gate 4 — Cinema Mode).
// Derivados del modelo Prisma `DepartmentClimaInsight` (schema.prisma:1595) +
// tipos ya exportados por PulseEngine. NO redefinir lo que PulseEngine exporta.

import type {
  DriverImpact,
  ClimaCorrelationFlags,
  CompanyPulseSummary,
  CompanyBusinessCaseTotal,
  RiskZone,
} from '@/lib/services/clima/PulseEngine';

export type { RiskZone } from '@/lib/services/clima/PulseEngine';

export type ClimaProductType = 'pulso-express' | 'experiencia-full';

/** Scope autoritativo de la respuesta — lo setea la API según el filtrado RBAC. */
export type ClimaScope = 'organization' | 'area';

// ═══════════════════════════════════════════════════════════════════════════
// Listado de campañas (GET /api/clima/campaigns) — molde ComplianceCampaignSummary
// ═══════════════════════════════════════════════════════════════════════════

export interface ClimaCampaignSummary {
  id: string;
  name: string;
  status: string;
  startDate: string;
  endDate: string;
  completedAt: string | null;
  totalInvited: number;
  totalResponded: number;
  productType: ClimaProductType | null;
  /** ¿Existe agregación de clima disponible para esta campaña? */
  hasCompletedAnalysis: boolean;
}

export interface ClimaCampaignsResponse {
  success: boolean;
  campaigns: ClimaCampaignSummary[];
  error?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// Resultados (GET /api/clima/results?campaignId=...)
// ═══════════════════════════════════════════════════════════════════════════

/** Score por driver persistido en DepartmentClimaInsight.driverScores. */
export interface ClimaDriverScore {
  fav: number | null; // % favorable (0-100)
  mean: number | null; // media 1-5
  n: number; // respondentes; 0 si carried
  carried: boolean; // carry-forward desde la última medición completa
  sourceDate?: string; // período de origen si carried (ej. "2026-Q1")
}

/** Score por nivel de cargo (acotadoGroup) con privacy threshold por celda. */
export interface ClimaAcotadoGroupScore {
  fav: number | null;
  mean: number | null;
  n: number;
}

/** Subset renderizable de una fila DepartmentClimaInsight. */
export interface ClimaDepartmentInsight {
  departmentId: string;
  departmentName: string;

  engagementFavorability: number | null; // % EI (0-100)
  engagementMean: number | null; // media EI (1-5)

  driverScores: Record<string, ClimaDriverScore> | null;
  customDriverScores: Record<string, ClimaDriverScore> | null;

  // Diagnóstico Gate 3
  driverAnalysis: DriverImpact[] | null;
  topFocusArea: string | null;
  topStrength: string | null;
  riskZone: RiskZone | null;
  momentum: number | null; // delta EI vs anterior (solo drivers medidos)
  correlationFlags: ClimaCorrelationFlags | null;

  // eNPS
  npsScore: number | null;
  promotersPct: number | null;
  detractorsPct: number | null;

  acotadoGroupScores: Record<string, ClimaAcotadoGroupScore> | null;

  // Participación
  totalInvited: number;
  totalResponded: number;
  participationRate: number;

  // Snapshots datos duros (al momento de la medición)
  turnoverRateAtMeasurement: number | null;
  absenteeismRateAtMeasurement: number | null;
  overtimeRateAtMeasurement: number | null;
  incidentCountAtMeasurement: number | null;
}

/** Gold cache clima por depto (Department, rolling 12m). */
export interface ClimaGoldCacheEntry {
  departmentId: string;
  accumulatedClimaFavorability: number | null;
  accumulatedClimaMean: number | null;
  accumulatedClimaRiskZone: string | null;
  accumulatedClimaLastUpdated: string | null;
}

/** Ranking mayor caída / mejora (rankMomentumMovers). */
export interface ClimaMomentumMover {
  departmentId: string;
  departmentName?: string;
  momentum: number | null;
  engagementFavorability?: number | null;
}

export interface ClimaResultsResponse {
  success: boolean;
  scope: ClimaScope;
  campaign: {
    id: string;
    name: string;
    productType: ClimaProductType | null;
    startDate: string;
    endDate: string;
    completedAt: string | null;
    period: string; // "YYYY-Qn"
  };
  company: { name: string; country: string | null };
  departments: ClimaDepartmentInsight[];
  companyPulse: CompanyPulseSummary;
  /** Favorability de compañía (o del scope visible) ponderada por headcount. */
  orgFavorability: number | null;
  orgRiskZone: RiskZone | null;
  /** Delta de orgFavorability vs la campaña clima anterior SAME-TIPO (scope RBAC).
   *  null si no hay anterior del mismo tipo → el footer cae a gap vs objetivo. */
  orgMomentum: number | null;
  businessCaseTotals: CompanyBusinessCaseTotal[];
  momentumMovers: { gainers: ClimaMomentumMover[]; decliners: ClimaMomentumMover[] };
  goldCacheByDept: ClimaGoldCacheEntry[];
  error?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// Cinema Mode — estado de navegación (molde useEvaluatorCinemaMode)
// ═══════════════════════════════════════════════════════════════════════════

/** Capítulos analíticos de compañía (Cover→Content), accesibles desde el Lobby. */
export type ClimaChapter = 'heatmap' | 'impact' | 'correlacion';

/** Filtro de departamentos del Rail por zona de riesgo. */
export type ClimaRailFilter = 'todos' | RiskZone;

export interface ClimaCinemaStats {
  deptCount: number;
  zoneCounts: Record<RiskZone, number>;
}

export interface ClimaNextDepartment {
  departmentId: string;
  departmentName: string;
  riskZone: RiskZone | null;
}
