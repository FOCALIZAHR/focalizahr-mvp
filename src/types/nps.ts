// ====================================================================
// FOCALIZAHR NPS - TYPESCRIPT TYPES
// src/types/nps.ts
// Sistema NPS Transversal - Diciembre 2025
// ====================================================================

/**
 * Resultado del cálculo de NPS
 */
export interface NPSCalculation {
  npsScore: number;          // -100 a +100
  promoters: number;         // Cantidad 9-10
  passives: number;          // Cantidad 7-8
  detractors: number;        // Cantidad 0-6
  totalResponses: number;
  promotersPct: number;      // 0-100
  passivesPct: number;       // 0-100
  detractorsPct: number;     // 0-100
}

/**
 * Tipos de producto soportados para NPS
 */
export type NPSProductType = 'onboarding' | 'exit' | 'pulso' | 'experiencia';

/**
 * Tipos de período soportados
 */
export type NPSPeriodType = 'monthly' | 'quarterly' | 'yearly';

/**
 * Insight de NPS (coincide con modelo Prisma)
 */
export interface NPSInsight {
  id: string;
  accountId: string;
  departmentId: string | null;
  productType: NPSProductType;
  period: string;
  periodType: NPSPeriodType;
  periodStart: Date;
  periodEnd: Date;
  npsScore: number;
  promoters: number;
  passives: number;
  detractors: number;
  totalResponses: number;
  promotersPct: number;
  passivesPct: number;
  detractorsPct: number;
  previousScore: number | null;
  scoreDelta: number | null;
  calculatedAt: Date;
}

/**
 * NPS con información de departamento (para queries con include)
 */
export interface NPSInsightWithDepartment extends NPSInsight {
  department?: {
    id: string;
    displayName: string;
    standardCategory: string | null;
    level: number;
    parentId: string | null;
  } | null;
}

/**
 * Respuesta API NPS
 */
export interface NPSApiResponse {
  data: NPSInsightWithDepartment[];
  meta: {
    total: number;
    period: string;
    product: string;
    groupBy?: string;
  };
  success: boolean;
  error?: string;
}

/**
 * Parámetros de consulta API NPS
 */
export interface NPSQueryParams {
  product?: NPSProductType | 'all';
  period?: string; // "YYYY-MM" o "latest"
  groupBy?: 'gerencia' | 'department' | 'product';
  history?: boolean;
}

/**
 * Ranking NPS por gerencia
 */
export interface NPSGerenciaRanking {
  departmentId: string;
  displayName: string;
  npsScore: number;
  totalResponses: number;
  scoreDelta: number | null;
  rank: number;
}

/**
 * NPS Journey (comparación cross-producto)
 */
export interface NPSJourneyComparison {
  onboarding: number | null;
  pulso: number | null;
  experiencia: number | null;
  exit: number | null;
  journeyDelta: number | null; // onboarding - exit
}

/**
 * Trend NPS mensual
 */
export interface NPSTrendPoint {
  period: string;
  npsScore: number;
  scoreDelta: number | null;
  totalResponses: number;
}

/**
 * NPS ponderado global
 */
export interface NPSWeightedGlobal {
  weightedScore: number;
  weights: {
    onboarding: number;
    pulso: number;
    experiencia: number;
    exit: number;
  };
  scores: {
    onboarding: number | null;
    pulso: number | null;
    experiencia: number | null;
    exit: number | null;
  };
}