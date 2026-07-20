// src/lib/services/vitals/types.ts
// ════════════════════════════════════════════════════════════════════════════
// Contrato de la portada "Signos Vitales" (SPEC_HOME_SIGNOS_VITALES_v1.1).
//
// Regla transversal null ≠ 0: toda señal ausente viaja como null explícito.
// Jamás 0, jamás 'verde' por defecto. El gauge no miente con ceros.
// ════════════════════════════════════════════════════════════════════════════

import type { RiskZone } from '@/lib/services/clima/climaThresholds';
import type { ClimaDriverScore } from '@/types/clima';

/**
 * Flags de correlación, pass-through opaco.
 *
 * En clima el tipo se llama ClimaCorrelationFlags pero NO está exportado desde
 * '@/types/clima'. No se exporta desde acá para no editar ese archivo (lo está
 * modificando otra sesión). Gate A sólo transporta el objeto; quien lo
 * interprete es Gate B.
 */
export type VitalsCorrelationFlags = Record<string, unknown>;
import type { VITALS_VERDICT_PRODUCT_TYPE } from '@/lib/constants/vitalsThresholds';

export type VitalsScope = 'organization' | 'area';

/**
 * Estado de la señal de clima de un departamento.
 * - con_veredicto:    hay medición completa → hay zona.
 * - solo_seguimiento: hay follow-up pero NUNCA hubo medición completa. No se
 *                     inventa zona desde un seguimiento.
 * - sin_veredicto:    no hay ninguna fila de medición completa.
 */
export type ClimaVerdictStatus = 'con_veredicto' | 'solo_seguimiento' | 'sin_veredicto';

/** Fila cruda que consume la función pura (subset de DepartmentClimaInsight). */
export interface ClimaInsightRow {
  departmentId: string;
  productType: string;
  isFollowUp: boolean;
  period: string;
  periodEnd: Date;
  engagementFavorability: number | null;
  riskZone: string | null;
  momentum: number | null;
  correlationFlags: unknown;
  topFocusArea: string | null;
  driverScores: unknown;
  totalResponded: number;
}

/**
 * CAPA 1 — VEREDICTO. Única fuente de la zona.
 * riskZone se lee del campo persistido; NUNCA se recalcula acá.
 */
export interface ClimaVerdict {
  favorability: number | null;
  riskZone: RiskZone | null;
  momentum: number | null;
  correlationFlags: VitalsCorrelationFlags | null;
  topFocusArea: string | null;
  period: string;
  measuredAt: string;
  /** Antigüedad cruda de la medición. Sin clasificar: Gate B decide si es "vieja". */
  monthsAgo: number;
  respondents: number;
  productType: typeof VITALS_VERDICT_PRODUCT_TYPE;
}

/**
 * CAPA 2 — RESPUESTA AL TRATAMIENTO. Señal separada del veredicto.
 * Nunca recalcula ni pisa la zona: solo informa si la dimensión intervenida
 * se movió después de la medición completa.
 */
export interface ClimaFollowUp {
  measuredAt: string;
  period: string;
  /** Dimensión intervenida = topFocusArea del veredicto. */
  dimension: string | null;
  /** fav(follow-up) − fav(veredicto) en esa dimensión. null si no computable. */
  delta: number | null;
  deltaUnavailableReason:
    | 'sin_dimension_intervenida'
    | 'dimension_no_medida'
    | null;
}

export interface DepartmentVitalSigns {
  departmentId: string;
  departmentName: string;
  clima: {
    status: ClimaVerdictStatus;
    verdict: ClimaVerdict | null;
    followUp: ClimaFollowUp | null;
  };
  onboarding: { exoScore: number | null };
  exit: { eisScore: number | null };
  ambiente: {
    isaScore: number | null;
    previousIsaScore: number | null;
    /** isaScore − previousIsaScore. null si falta cualquiera de los dos. */
    delta: number | null;
  };
}

export interface VitalSignsHeadline {
  departmentId: string;
  departmentName: string;
  riskZone: RiskZone;
  favorability: number | null;
}

export interface VitalSignsSummary {
  scope: VitalsScope;
  departments: DepartmentVitalSigns[];
  /** Conteo por zona + los que aún no tienen veredicto. */
  zoneDistribution: Record<RiskZone, number> & { sinVeredicto: number };
  /**
   * Hallazgo del día. v1: SOLO clima (severidad de zona, desempate por menor
   * favorabilidad). No mezcla ISA/EXO/EIS: una fórmula de criticidad
   * cross-señal es el ISD que la spec §3 difirió a v2.
   */
  headline: VitalSignsHeadline | null;
  headlineUnavailableReason: 'sin_veredictos' | null;
  coverage: {
    totalDepartments: number;
    withClimaVerdict: number;
    withExo: number;
    withEis: number;
    withIsa: number;
  };
}

/** Resultado de la selección de capas — expuesto para el test unitario puro. */
export interface ClimaLayers {
  status: ClimaVerdictStatus;
  verdict: ClimaVerdict | null;
  followUp: ClimaFollowUp | null;
}

export type { ClimaDriverScore };
