// src/types/clima-planes.ts
// ════════════════════════════════════════════════════════════════════════════
// EX Clima Gate 5A — Contrato de datos de los Planes de Acción de Clima.
//
// Tipos PUROS (client-safe): sólo imports `type` — no bundlean prisma. Los
// consume el ClimaActionPlanBuilder (genera decisiones) y, en 5D, la UI Cinema
// Mode. Se persisten como `ActionPlan.decisiones` (Json) vía el endpoint genérico
// existente (moduleType='clima').
//
// Severidad = las 4 RiskZone ya selladas (Gate 3/4.5, calcRiskZone). NO se
// inventa una escala nueva: verde/amarilla/naranja/roja ⇄ Sano/Atención/Riesgo/
// Crítico (labels canónicos del contrato visual `N · Label`).
// ════════════════════════════════════════════════════════════════════════════

import type { RiskZone } from '@/lib/services/clima/climaThresholds';
import type {
  PulseBusinessCase,
  DriverClassification,
} from '@/lib/services/clima/PulseEngine';

/** Label canónico de banda por zona (contrato visual `N · Label`). */
export type ClimaSeverityLabel = 'Sano' | 'Atención' | 'Riesgo' | 'Crítico';

export const SEVERITY_LABEL_BY_ZONE: Record<RiskZone, ClimaSeverityLabel> = {
  verde: 'Sano',
  amarilla: 'Atención',
  naranja: 'Riesgo',
  roja: 'Crítico',
};

// ─────────────────────────────────────────────────────────────────────────────
// Diccionario de intervenciones — celda (dimensión × zona)
// CONTENIDO PROVISIONAL: lo escribe Victor/Studio IA. Code scaffoldea (Principio 4).
// ─────────────────────────────────────────────────────────────────────────────

export interface ClimaInterventionCell {
  /** Narrativa de la intervención sugerida. PROVISIONAL. */
  narrative: string;
  /** Pasos concretos sugeridos. PROVISIONAL. */
  steps: string[];
  /** Producto/CTA sugerido de la suite (PDI, Meta, Programa…). PROVISIONAL. */
  suggestedProduct: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Dynamic Impact Drivers — contexto de reactivos para seleccionar la variante de
// intervención (celda × reactivo-palanca). Lo arma el consumidor (5D) desde
// DepartmentClimaInsight.reactiveAnalysis, filtrado a la dimensión del driver.
// ─────────────────────────────────────────────────────────────────────────────

export interface ReactiveContextEntry {
  reactive: string; // subcategory (carga_trabajo, seguridad, ...)
  impact: number | null; // Pearson reactivo×EI (local o compañía)
  gap: number | null; // fav − target (pp, con signo) — referencia (Dynamic Impact)
  mean: number | null; // mean 1-5 del reactivo — base de gapMean/priorityMean (severidad mean)
}

// ─────────────────────────────────────────────────────────────────────────────
// ClimaDecisionItem — un ítem de decisión por dimensión-en-riesgo de un depto
// (shape MAESTRO 5A). Es el elemento de `ActionPlan.decisiones[]`.
// ─────────────────────────────────────────────────────────────────────────────

export interface ClimaDecisionIntervention {
  /** Severidad = zona de riesgo del driver. */
  level: RiskZone;
  levelLabel: ClimaSeverityLabel;
  narrative: string; // del diccionario (PROVISIONAL)
  steps: string[]; // del diccionario (PROVISIONAL)
  suggestedProduct: string; // del diccionario (PROVISIONAL)
  /**
   * Business case CLP/ROI de PulseEngine (Gate 3) SI disparó para este driver
   * (clima_critico / liderazgo_gap). null cuando no hay caso financiero para la
   * dimensión (p.ej. zona Atención sin gatillar umbral crítico) — NO se inventa.
   */
  businessCase: PulseBusinessCase | null;
}

export type CeoDecision = 'aceptar' | 'modificar' | 'rechazar';

export interface ClimaDecisionItem {
  /** Id estable de la decisión dentro del plan: `clima:${departmentId}:${category}`. */
  triggerRef: string;
  /** Driver/dimensión de la taxonomía real (satisfaccion, liderazgo, …). */
  category: string;
  departmentId: string;
  departmentName?: string;
  favorability: number | null; // fav del driver (0-100)
  gap: number | null; // fav − target (pp, con signo)
  impact: number | null; // Pearson driver×EI a nivel compañía (|r|), null si <5 pares
  intervention: ClimaDecisionIntervention;
  responsible: string; // 'CEO' | 'Gerente de Área' | 'HRBP'
  deadline: string; // '2 semanas' | '30 días' | '90 días' | 'Sostener'
  validationMetric: string; // "Favorabilidad de liderazgo > 75% en el próximo Seguimiento Focalizado"
  /**
   * Reactivo-palanca elegido (mayor priorityMean = |impact|×|gapMean|) dentro de la
   * dimensión. null = sin contexto de reactivos → intervención por defecto de la celda.
   */
  selectedReactive: string | null;
  /**
   * Escalamiento sistémico: ≥REACTIVE_SYSTEMIC_RATIO de los reactivos medidos no-circulares
   * de la dimensión están bajo su tier → patrón que cruza varios frentes (intervención de
   * dimensión, no reactivo puntual). La narrativa usa REACTIVE_SYSTEMIC_NARRATIVE.
   */
  isSystemic: boolean;
  ceoDecision?: CeoDecision; // decisión humana en 5D (undefined = pendiente)
  ceoNotes?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Input del builder — se deriva 1:1 de DepartmentClimaInsight (Gate 2/3):
//   drivers  ← driverAnalysis (DriverImpact[])
//   businessCases ← correlationFlags.businessCases (PulseBusinessCase[])
// Se declara mínimo y explícito para que el builder sea puro y testeable sin BD.
// ─────────────────────────────────────────────────────────────────────────────

export interface ClimaDriverForDecision {
  category: string;
  fav: number | null;
  gap: number | null;
  impact: number | null;
  momentumDelta: number | null; // modula la zona (crisis degrada 1 zona)
  classification: DriverClassification | null;
  /**
   * Dynamic Impact Drivers: reactivos de ESTA dimensión en el depto (de
   * reactiveAnalysis), para elegir el reactivo-palanca y su variante narrativa.
   * Vacío → intervención por defecto de la celda (backward compatible).
   */
  reactives: ReactiveContextEntry[];
}

export interface ClimaDeptDecisionInput {
  departmentId: string;
  departmentName?: string;
  drivers: ClimaDriverForDecision[];
  businessCases: PulseBusinessCase[];
}
