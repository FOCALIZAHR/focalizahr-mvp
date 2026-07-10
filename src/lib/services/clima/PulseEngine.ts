// src/lib/services/clima/PulseEngine.ts
// EX Clima Gate 3 — PulseEngine: 5 algoritmos + flag de teatro (MAESTRO §Gate 3).
// Cálculo 100% PURO (sin I/O): recibe insumos ya en memoria (los arma
// ClimaAggregationService en fase 4) y retorna el diagnóstico por depto que se
// persiste en DepartmentClimaInsight.{driverAnalysis, topFocusArea, topStrength,
// riskZone, correlationFlags}.
//
// ABSORBE RetentionEngine (decisión sellada jul-2026): PulseEngine es el ÚNICO
// writer persistido de cifras CLP de clima, vía SalaryConfigService (motor
// financiero único de la plataforma). RetentionEngine queda @deprecated
// (client-side, efímero) hasta que Cinema Mode (Gate 4) reemplace results page.
//
// ALG 1 Driver Analysis  — impact (Pearson driver×EI compañía) × |gap| (vs target)
// ALG 2 Hotspot          — eiFav < p25 compañía + headcount + turnover
// ALG 3 Momentum/driver  — delta fav vs período anterior (carried EXCLUIDO ambos lados)
// ALG 4 Gap Transfer     — depto campeón → rezagado por driver
// ALG 5 Clima×Rotación   — Pearson eiFav×turnoverRate entre deptos → business case CLP
// FLAG  theatreDetected  — ISA>70 (sano) + eiFav<50 (bajo) = sospecha de teatro
//
// Degradación explícita, NUNCA throw por datos faltantes: cada output no
// evaluable queda null con su contexto (evaluable/confidence) trazado.

import { GoalsDiagnosticService } from '@/lib/services/GoalsDiagnosticService';
import {
  SalaryConfigService,
  type SalaryResult,
} from '@/lib/services/SalaryConfigService';
import {
  type ClimaResponseRow,
  type DriverScore,
  type FavorabilityScore,
  filterRatingRows,
} from './FavorabilityCalculator';

// Constantes de dominio + calcRiskZone: FUENTE ÚNICA en ./climaThresholds
// (extraídas para que el motor client-side las comparta sin bundlear prisma).
// Se importan para uso interno y se RE-EXPORTAN para no romper importadores.
import {
  RISK_ZONE_THRESHOLDS,
  MOMENTUM_CRISIS_PP,
  MOMENTUM_DECLINING_PP,
  MOMENTUM_GROWING_PP,
  CLIMA_TARGET_FAVORABILITY,
  LEADERSHIP_DRIVER,
  calcRiskZone,
} from './climaThresholds';
import type { RiskZone } from './climaThresholds';

export {
  RISK_ZONE_THRESHOLDS,
  MOMENTUM_CRISIS_PP,
  MOMENTUM_DECLINING_PP,
  MOMENTUM_GROWING_PP,
  CLIMA_TARGET_FAVORABILITY,
  LEADERSHIP_DRIVER,
  calcRiskZone,
};
export type { RiskZone };

// ─────────────────────────────────────────────────────────────────────────────
// Constantes de dominio (decisiones Victor 2026-07-07 — editables por dev,
// NO configurables por cliente: comparabilidad del diagnóstico entre cuentas)
// ─────────────────────────────────────────────────────────────────────────────

/** Umbral de impact alto: |r| Pearson driver×EI (estándar effect size medio). */
export const IMPACT_HIGH_R = 0.3;
/** Gap que amerita foco: ≥10pp bajo el target (negativo = bajo target). */
export const GAP_FOCUS_PP = -10;

/** Mínimo de deptos con EI para que un percentil p25 sea significativo (ALG 2). */
export const MIN_DEPTS_FOR_PERCENTILE = 4;

/**
 * Teatro de cumplimiento (MAESTRO §Gate 3 — cortes SELLADOS en el maestro):
 * ISA > 70 (compliance "sano") + engagementFav < 50 (clima bajo) mismo depto.
 * El corte 50 es MÁS estricto que roja (60) a propósito: "teatro" acusa de
 * simular cumplimiento → exige umbral conservador; un depto puede estar en
 * roja sin sospecha de teatro.
 */
export const THEATRE_ISA_MIN = 70;
export const THEATRE_ENGAGEMENT_MAX_FAV = 50;

/** Umbrales de disparo de business cases (mean 1-5). Separados por caso. */
export const DRIVER_CRITICAL_MEAN = 2.5; // clima_critico: peor driver medido
export const EI_RISK_MEAN = 3.0; // retencion_riesgo: engagement mean
export const LEADERSHIP_GAP_MEAN = 3.0; // liderazgo_gap: driver liderazgo
// LEADERSHIP_DRIVER movido a ./climaThresholds (re-exportado arriba).

/**
 * Riesgo de rotación por mean del disparador — escala heredada de
 * RetentionEngine (fuente Gallup), preservada en la absorción.
 */
export const TURNOVER_RISK_BY_MEAN: readonly { maxMean: number; risk: number }[] = [
  { maxMean: 2.0, risk: 0.6 },
  { maxMean: 2.5, risk: 0.45 },
  { maxMean: 3.0, risk: 0.3 },
  { maxMean: 3.5, risk: 0.2 },
] as const;
export const TURNOVER_RISK_FLOOR = 0.1;

/** Costos de programa por persona (CLP) y efectividades — heredados de
 *  RetentionEngine (fuentes HBR/McKinsey citadas ahí). */
export const CLIMA_PROGRAM_COST_PER_PERSON_CLP = 75_000;
export const RETENTION_PROGRAM_COST_PER_PERSON_CLP = 75_000;
export const LEADERSHIP_PROGRAM_COST_PER_PERSON_CLP = 100_000;
export const CLIMA_PROGRAM_EFFECTIVENESS = 0.6;
export const RETENTION_PROGRAM_EFFECTIVENESS = 0.6;
export const LEADERSHIP_PROGRAM_EFFECTIVENESS = 0.8;

/** Confianza del business case por participación (regla RetentionEngine). */
export const CONFIDENCE_HIGH_PARTICIPATION = 70;
export const CONFIDENCE_MEDIUM_PARTICIPATION = 50;

/** Top N por lado del ranking de movers (helper read-time para Gate 4). */
export const MOVERS_TOP_N = 3;

const round1 = (x: number) => Math.round(x * 10) / 10;

// ─────────────────────────────────────────────────────────────────────────────
// Tipos — contrato persistido (driverAnalysis / correlationFlags)
// ─────────────────────────────────────────────────────────────────────────────

// RiskZone movido a ./climaThresholds (re-exportado arriba como type).
export type DriverClassification = 'focus_area' | 'strength' | 'monitor' | 'maintain';
export type MomentumState = 'crisis' | 'declining' | 'stable' | 'growing';
export type PulseBusinessCaseType = 'clima_critico' | 'retencion_riesgo' | 'liderazgo_gap';
export type PulseConfidence = 'alta' | 'media' | 'baja';

/** Un elemento por driver presente en driverScores (medidos + carried). */
export interface DriverImpact {
  driver: string; // questionCategory real (satisfaccion, liderazgo, ...)
  fav: number | null;
  mean: number | null;
  n: number;
  carried: boolean;
  // ALG 1
  impact: number | null; // Pearson r driver×EI a nivel COMPAÑÍA; null si <5 pares
  gap: number | null; // fav − CLIMA_TARGET_FAVORABILITY (pp, con signo)
  gapBasis: 'fixed_target'; // Gate 6C migrará a 'market_benchmark'
  priority: number | null; // |impact| × |gap| (1 dec)
  classification: DriverClassification | null;
  // ALG 3
  momentumDelta: number | null; // pp vs período anterior; null si carried en
  momentumState: MomentumState | null; // cualquiera de los 2 lados o sin previo
  // ALG 4
  champion: {
    departmentId: string;
    fav: number;
    transferGapPp: number; // championFav − deptFav (1 dec)
  } | null; // null si este depto ES el campeón o <2 deptos midieron el driver
}

export interface PulseBusinessCase {
  type: PulseBusinessCaseType;
  severity: 'critica' | 'alta';
  driver: string | null; // clima_critico: driver disparador; liderazgo_gap: 'liderazgo'; retencion_riesgo: null (EI)
  triggerScore: number; // mean que cruzó el umbral
  peopleAtRisk: number;
  turnoverRiskPct: number; // 0-100
  potentialAnnualLossCLP: number;
  recommendedInvestmentCLP: number;
  estimatedROIPct: number | null;
  paybackMonths: number | null;
  salarySource: SalaryResult['source'];
  confidence: PulseConfidence;
  assumptions: string[]; // transparencia CFO-ready
}

export interface ClimaCorrelationFlags {
  version: 1; // Gate 6G agregará señales Fase 2A aquí
  theatreDetected: boolean | null; // null = ISA o EI no evaluable, NUNCA false
  theatre: {
    isaScore: number | null;
    engagementFav: number | null;
    evaluable: boolean;
  };
  hotspot: {
    isHotspot: boolean | null; // null = <MIN_DEPTS_FOR_PERCENTILE deptos con EI
    eiFav: number | null;
    p25CompanyEiFav: number | null;
    deptsInSample: number;
    headcountAvg: number | null;
    turnoverRate: number | null;
    confidence: 'high' | 'medium' | 'low'; // degradación por datos duros faltantes
  };
  climaTurnover: {
    // ALG 5 — escalar cross-dept duplicado en cada fila (self-contained)
    pearsonR: number | null; // eiFav × turnoverRate entre deptos; null si <5 pares
    nDepts: number;
    evaluable: boolean;
  };
  businessCases: PulseBusinessCase[];
  computedAt: string; // ISO
}

// ─────────────────────────────────────────────────────────────────────────────
// Tipos de entrada/salida del motor
// ─────────────────────────────────────────────────────────────────────────────

/** Insumos por depto — TODOS ya en memoria en fase 4 de ClimaAggregationService
 *  (cero re-queries: driverScores post-carry, ei y rows vienen del cómputo Gate 2). */
export interface PulseDeptInput {
  departmentId: string;
  driverScores: Record<string, DriverScore>; // post carry-forward
  ei: FavorabilityScore;
  momentum: number | null; // escalar EI que persiste Gate 2 (NO se recalcula)
  rows: ClimaResponseRow[]; // crudo del depto — pares Pearson ALG 1
  prevDriverScores: Record<string, DriverScore> | null; // insight anterior (ALG 3)
  turnoverRate: number | null; // DepartmentMetric, en % (0-100); puede no estar cargada
  headcountAvg: number | null;
  isaScore: number | null; // ComplianceAnalysis scope DEPARTMENT
  totalResponded: number;
  participationRate: number; // 0-100
  // Cambio Gate 3 (ALG5 costeo con rotación real): conteo de salidas VOLUNTARIAS
  // del depto en ventana móvil de 12m desde campaign.endDate (rama b). null = sin
  // dato de Exit. Lo computa el caller (ClimaAggregationService fase 4b).
  voluntaryExits12mo: number | null;
  // Salario resuelto POR DEPARTAMENTO vía acotadoGroup dominante (getSalaryForAccount,
  // resuelto por el caller — el módulo queda puro). Antes era único de compañía.
  salary: SalaryResult;
}

export interface PulseCompanyInput {
  depts: PulseDeptInput[];
}

export interface PulseDeptOutput {
  driverAnalysis: DriverImpact[];
  topFocusArea: string | null;
  topStrength: string | null;
  riskZone: RiskZone | null;
  correlationFlags: ClimaCorrelationFlags;
}

// ─────────────────────────────────────────────────────────────────────────────
// Orquestador
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Computa los 5 algoritmos + flag para TODA la compañía en una pasada.
 * Puro e in-memory: el caller persiste el output y maneja errores de I/O.
 */
export function computePulse(input: PulseCompanyInput): Map<string, PulseDeptOutput> {
  const { depts } = input;

  // Cross-dept una sola vez
  const impactByDriver = calcCompanyDriverImpacts(depts);
  const championByDriver = calcGapTransfer(depts);
  const hotspotContext = buildHotspotContext(depts);
  const climaTurnover = calcClimaTurnoverCorrelation(depts);
  const computedAt = new Date().toISOString();

  const outputs = new Map<string, PulseDeptOutput>();

  for (const dept of depts) {
    const driverAnalysis = buildDriverAnalysis(dept, impactByDriver, championByDriver);
    const { topFocusArea, topStrength } = pickTopDrivers(driverAnalysis);

    const flags: ClimaCorrelationFlags = {
      version: 1,
      ...detectTheatre(dept),
      hotspot: detectHotspots(dept, hotspotContext),
      climaTurnover,
      businessCases: buildBusinessCases(dept),
      computedAt,
    };

    outputs.set(dept.departmentId, {
      driverAnalysis,
      topFocusArea,
      topStrength,
      riskZone: calcRiskZone(dept.ei.fav, dept.momentum),
      correlationFlags: flags,
    });
  }

  return outputs;
}

// riskZone: calcRiskZone movido a ./climaThresholds (re-exportado arriba). Se usa
// internamente (computePulse, calcOrgFavorability) vía el import.

// ─────────────────────────────────────────────────────────────────────────────
// ALG 1 — Driver Analysis (Impact × Gap)
// ─────────────────────────────────────────────────────────────────────────────

const ENGAGEMENT_CATEGORY = 'engagement_index';

/**
 * Impact por driver = Pearson r a nivel COMPAÑÍA con pares por PARTICIPANTE
 * (x = mean del participante en el driver, y = mean del participante en EI).
 * r por depto con n=8-20 sería estadísticamente inestable (y <5 pares → null
 * en deptos chicos); el estándar impact×gap usa impact organizacional + gap
 * local. Reutiliza GoalsDiagnosticService.calculatePearsonR (null si <5 pares).
 */
export function calcCompanyDriverImpacts(
  depts: PulseDeptInput[]
): Map<string, number | null> {
  // Acumular por participante: mean EI + mean por driver (solo rating_scale)
  interface ParticipantAcc {
    eiSum: number;
    eiCount: number;
    byDriver: Map<string, { sum: number; count: number }>;
  }
  const byParticipant = new Map<string, ParticipantAcc>();

  for (const dept of depts) {
    for (const row of filterRatingRows(dept.rows)) {
      let acc = byParticipant.get(row.participantId);
      if (!acc) {
        acc = { eiSum: 0, eiCount: 0, byDriver: new Map() };
        byParticipant.set(row.participantId, acc);
      }
      if (row.questionCategory === ENGAGEMENT_CATEGORY) {
        acc.eiSum += row.rating;
        acc.eiCount += 1;
      } else {
        let d = acc.byDriver.get(row.questionCategory);
        if (!d) {
          d = { sum: 0, count: 0 };
          acc.byDriver.set(row.questionCategory, d);
        }
        d.sum += row.rating;
        d.count += 1;
      }
    }
  }

  // Pares {x: driverMean, y: eiMean} por driver
  const pairsByDriver = new Map<string, { x: number; y: number }[]>();
  for (const acc of byParticipant.values()) {
    if (acc.eiCount === 0) continue; // sin EI no hay outcome → participante fuera
    const eiMean = acc.eiSum / acc.eiCount;
    for (const [driver, d] of acc.byDriver) {
      const bucket = pairsByDriver.get(driver);
      const pair = { x: d.sum / d.count, y: eiMean };
      if (bucket) bucket.push(pair);
      else pairsByDriver.set(driver, [pair]);
    }
  }

  const impacts = new Map<string, number | null>();
  for (const [driver, pairs] of pairsByDriver) {
    impacts.set(driver, GoalsDiagnosticService.calculatePearsonR(pairs));
  }
  return impacts;
}

/** Clasificación del cuadrante impact × gap (constantes IMPACT_HIGH_R / GAP_FOCUS_PP). */
export function classifyDriver(
  impact: number | null,
  gap: number | null
): DriverClassification | null {
  if (gap === null) return null;
  const highImpact = impact !== null && impact >= IMPACT_HIGH_R;
  const bigGap = gap <= GAP_FOCUS_PP;
  if (highImpact && bigGap) return 'focus_area';
  if (highImpact && gap >= 0) return 'strength';
  if (bigGap) return 'monitor'; // impact bajo o no evaluable, pero gap grande
  return 'maintain';
}

// ─────────────────────────────────────────────────────────────────────────────
// ALG 3 — Momentum per-driver
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Delta fav vs período anterior, SOLO si el driver fue MEDIDO en ambos períodos
 * (carried === false y fav no null en los 2 lados — un carried nunca entra).
 */
export function calcDriverMomentum(
  current: DriverScore | undefined,
  prev: DriverScore | undefined
): { momentumDelta: number | null; momentumState: MomentumState | null } {
  if (
    !current || current.carried || current.fav === null ||
    !prev || prev.carried || prev.fav === null
  ) {
    return { momentumDelta: null, momentumState: null };
  }
  const delta = round1(current.fav - prev.fav);
  let state: MomentumState;
  if (delta <= MOMENTUM_CRISIS_PP) state = 'crisis';
  else if (delta <= MOMENTUM_DECLINING_PP) state = 'declining';
  else if (delta >= MOMENTUM_GROWING_PP) state = 'growing';
  else state = 'stable';
  return { momentumDelta: delta, momentumState: state };
}

// ─────────────────────────────────────────────────────────────────────────────
// ALG 4 — Dimension Gap Transfer
// ─────────────────────────────────────────────────────────────────────────────

interface ChampionInfo {
  departmentId: string;
  fav: number;
  measuredDepts: number;
}

/** Por driver: depto campeón = mayor fav MEDIDO (carried excluido). */
export function calcGapTransfer(depts: PulseDeptInput[]): Map<string, ChampionInfo> {
  const byDriver = new Map<string, ChampionInfo>();
  const measuredCount = new Map<string, number>();

  for (const dept of depts) {
    for (const [driver, score] of Object.entries(dept.driverScores)) {
      if (score.carried || score.fav === null) continue;
      measuredCount.set(driver, (measuredCount.get(driver) ?? 0) + 1);
      const current = byDriver.get(driver);
      if (!current || score.fav > current.fav) {
        byDriver.set(driver, {
          departmentId: dept.departmentId,
          fav: score.fav,
          measuredDepts: 0, // se completa abajo
        });
      }
    }
  }
  for (const [driver, info] of byDriver) {
    info.measuredDepts = measuredCount.get(driver) ?? 0;
    if (info.measuredDepts < 2) byDriver.delete(driver); // no evaluable
  }
  return byDriver;
}

// ─────────────────────────────────────────────────────────────────────────────
// Ensamblado de DriverImpact[] por depto (ALG 1 + 3 + 4)
// ─────────────────────────────────────────────────────────────────────────────

function buildDriverAnalysis(
  dept: PulseDeptInput,
  impactByDriver: Map<string, number | null>,
  championByDriver: Map<string, ChampionInfo>
): DriverImpact[] {
  const analysis: DriverImpact[] = [];

  for (const [driver, score] of Object.entries(dept.driverScores)) {
    const fav = score.fav;
    // fav null (privacy) → fila con shape completo, todo no-evaluable
    const impact = fav !== null ? (impactByDriver.get(driver) ?? null) : null;
    const gap = fav !== null ? round1(fav - CLIMA_TARGET_FAVORABILITY) : null;
    const priority =
      impact !== null && gap !== null ? round1(Math.abs(impact) * Math.abs(gap)) : null;

    const champion = championByDriver.get(driver);
    const championOut =
      fav !== null && champion && champion.departmentId !== dept.departmentId
        ? {
            departmentId: champion.departmentId,
            fav: champion.fav,
            transferGapPp: round1(champion.fav - fav),
          }
        : null;

    analysis.push({
      driver,
      fav,
      mean: score.mean,
      n: score.n,
      carried: score.carried,
      impact,
      gap,
      gapBasis: 'fixed_target',
      priority,
      classification: fav !== null ? classifyDriver(impact, gap) : null,
      ...calcDriverMomentum(score, dept.prevDriverScores?.[driver]),
      champion: championOut,
    });
  }

  return analysis;
}

/**
 * topFocusArea = mayor priority entre focus_area; topStrength = mayor priority
 * entre strength. Drivers carried EXCLUIDOS de ambos: son dato stale de otra
 * medición — se muestran en el análisis pero no lideran el diagnóstico fresco.
 */
function pickTopDrivers(analysis: DriverImpact[]): {
  topFocusArea: string | null;
  topStrength: string | null;
} {
  const pick = (classification: DriverClassification): string | null => {
    const candidates = analysis.filter(
      (d) => !d.carried && d.classification === classification && d.priority !== null
    );
    if (candidates.length === 0) return null;
    candidates.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
    return candidates[0].driver;
  };
  return { topFocusArea: pick('focus_area'), topStrength: pick('strength') };
}

// ─────────────────────────────────────────────────────────────────────────────
// ALG 2 — Hotspot Detection
// ─────────────────────────────────────────────────────────────────────────────

interface HotspotContext {
  p25: number | null; // null si <MIN_DEPTS_FOR_PERCENTILE deptos con EI
  deptsInSample: number;
}

function buildHotspotContext(depts: PulseDeptInput[]): HotspotContext {
  const favs = depts
    .map((d) => d.ei.fav)
    .filter((f): f is number => f !== null)
    .sort((a, b) => a - b);
  if (favs.length < MIN_DEPTS_FOR_PERCENTILE) {
    return { p25: null, deptsInSample: favs.length };
  }
  return { p25: percentile(favs, 0.25), deptsInSample: favs.length };
}

/** Percentil por interpolación lineal sobre array YA ordenado ascendente. */
export function percentile(sortedAsc: number[], p: number): number {
  const idx = p * (sortedAsc.length - 1);
  const lower = Math.floor(idx);
  const upper = Math.ceil(idx);
  if (lower === upper) return round1(sortedAsc[lower]);
  const frac = idx - lower;
  return round1(sortedAsc[lower] + frac * (sortedAsc[upper] - sortedAsc[lower]));
}

export function detectHotspots(
  dept: PulseDeptInput,
  context: HotspotContext
): ClimaCorrelationFlags['hotspot'] {
  const eiFav = dept.ei.fav;
  const isHotspot =
    context.p25 === null || eiFav === null ? null : eiFav < context.p25;

  // Confianza degradada por datos duros faltantes (DepartmentMetric manual)
  const missing =
    (dept.turnoverRate === null ? 1 : 0) + (dept.headcountAvg === null ? 1 : 0);
  const confidence = missing === 0 ? 'high' : missing === 1 ? 'medium' : 'low';

  return {
    isHotspot,
    eiFav,
    p25CompanyEiFav: context.p25,
    deptsInSample: context.deptsInSample,
    headcountAvg: dept.headcountAvg,
    turnoverRate: dept.turnoverRate,
    confidence,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// ALG 5 — Correlación Clima × Rotación
// ─────────────────────────────────────────────────────────────────────────────

/** Pearson {x: eiFav, y: turnoverRate} entre deptos. Null si <5 pares válidos. */
export function calcClimaTurnoverCorrelation(
  depts: PulseDeptInput[]
): ClimaCorrelationFlags['climaTurnover'] {
  const pairs = depts
    .filter((d) => d.ei.fav !== null && d.turnoverRate !== null)
    .map((d) => ({ x: d.ei.fav as number, y: d.turnoverRate as number }));
  const pearsonR = GoalsDiagnosticService.calculatePearsonR(pairs);
  return { pearsonR, nDepts: pairs.length, evaluable: pearsonR !== null };
}

// ─────────────────────────────────────────────────────────────────────────────
// FLAG — theatreDetected (teatro de cumplimiento)
// ─────────────────────────────────────────────────────────────────────────────

export function detectTheatre(dept: PulseDeptInput): {
  theatreDetected: boolean | null;
  theatre: ClimaCorrelationFlags['theatre'];
} {
  const eiFav = dept.ei.fav;
  const evaluable = dept.isaScore !== null && eiFav !== null;
  return {
    theatreDetected: evaluable
      ? dept.isaScore! > THEATRE_ISA_MIN && eiFav! < THEATRE_ENGAGEMENT_MAX_FAV
      : null,
    theatre: { isaScore: dept.isaScore, engagementFav: eiFav, evaluable },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Business cases (absorción RetentionEngine — metodología CLP preservada)
// ─────────────────────────────────────────────────────────────────────────────

/** Riesgo de rotación por mean del disparador (escala Gallup heredada). */
export function turnoverRiskFromMean(mean: number): number {
  for (const band of TURNOVER_RISK_BY_MEAN) {
    if (mean < band.maxMean) return band.risk;
  }
  return TURNOVER_RISK_FLOOR;
}

/**
 * Los 3 business cases de RetentionEngine, mapeados a la taxonomía REAL
 * (decisión Victor 2026-07-07):
 * - clima_critico: PEOR driver MEDIDO con mean < 2.5 (generaliza el legacy
 *   'ambiente_crítico' — la categoría 'ambiente' no existe en la BD real).
 * - retencion_riesgo: engagement mean < 3.0 (el EI es el "overall" del producto).
 * - liderazgo_gap: driver 'liderazgo' con mean < 3.0.
 * MUTUAMENTE EXCLUYENTES sobre el mismo driver: si liderazgo disparó
 * liderazgo_gap y además es el peor <2.5, clima_critico toma el SIGUIENTE
 * peor <2.5 (si no hay otro, no se emite) — nunca doble costo CLP.
 */
export function buildBusinessCases(dept: PulseDeptInput): PulseBusinessCase[] {
  const cases: PulseBusinessCase[] = [];

  const measured = Object.entries(dept.driverScores)
    .filter(([, s]) => !s.carried && s.mean !== null)
    .map(([driver, s]) => ({ driver, mean: s.mean as number }));

  // liderazgo_gap primero (define la exclusión de clima_critico)
  const leadership = measured.find((d) => d.driver === LEADERSHIP_DRIVER);
  const leadershipFired = !!leadership && leadership.mean < LEADERSHIP_GAP_MEAN;
  if (leadership && leadershipFired) {
    cases.push(
      buildCase('liderazgo_gap', LEADERSHIP_DRIVER, leadership.mean, dept)
    );
  }

  // clima_critico: peor driver medido < 2.5, excluyendo liderazgo si ya disparó
  const critical = measured
    .filter((d) => d.mean < DRIVER_CRITICAL_MEAN)
    .filter((d) => !(leadershipFired && d.driver === LEADERSHIP_DRIVER))
    .sort((a, b) => a.mean - b.mean)[0];
  if (critical) {
    cases.push(buildCase('clima_critico', critical.driver, critical.mean, dept));
  }

  // retencion_riesgo: engagement mean bajo umbral
  if (dept.ei.mean !== null && dept.ei.mean < EI_RISK_MEAN) {
    cases.push(buildCase('retencion_riesgo', null, dept.ei.mean, dept));
  }

  return cases;
}

const PROGRAM_BY_TYPE: Record<
  PulseBusinessCaseType,
  { costPerPersonCLP: number; effectiveness: number }
> = {
  clima_critico: {
    costPerPersonCLP: CLIMA_PROGRAM_COST_PER_PERSON_CLP,
    effectiveness: CLIMA_PROGRAM_EFFECTIVENESS,
  },
  retencion_riesgo: {
    costPerPersonCLP: RETENTION_PROGRAM_COST_PER_PERSON_CLP,
    effectiveness: RETENTION_PROGRAM_EFFECTIVENESS,
  },
  liderazgo_gap: {
    costPerPersonCLP: LEADERSHIP_PROGRAM_COST_PER_PERSON_CLP,
    effectiveness: LEADERSHIP_PROGRAM_EFFECTIVENESS,
  },
};

function buildCase(
  type: PulseBusinessCaseType,
  driver: string | null,
  triggerScore: number,
  dept: PulseDeptInput
): PulseBusinessCase {
  const salary = dept.salary; // resuelto por acotadoGroup en el caller (Cambio 2)
  const base = dept.headcountAvg !== null ? Math.round(dept.headcountAvg) : dept.totalResponded;

  // Cambio 1 — jerarquía de rotación real para peopleAtRisk / % / supuesto:
  //   (a) tasa de rotación real (DepartmentMetric, %) → (b) conteo de salidas
  //   voluntarias 12m (Exit, ≥1, sin umbral) → (c) fallback score-derived (Gallup).
  let peopleAtRisk: number;
  let riskPct: number;
  let turnoverAssumption: string;
  if (dept.turnoverRate !== null) {
    const rate = dept.turnoverRate / 100; // turnoverRate viene en % (0-100)
    peopleAtRisk = Math.ceil(base * rate);
    riskPct = Math.round(rate * 100);
    turnoverAssumption =
      `Riesgo de rotación ${riskPct}% por la tasa de rotación real registrada del departamento (DepartmentMetric)`;
  } else if (dept.voluntaryExits12mo !== null && dept.voluntaryExits12mo > 0) {
    const n = dept.voluntaryExits12mo;
    peopleAtRisk = n;
    riskPct = base > 0 ? Math.round((n / base) * 100) : 100;
    turnoverAssumption =
      `Basado en ${n} ${n === 1 ? 'salida voluntaria registrada' : 'salidas voluntarias registradas'}` +
      ` en Exit Intelligence durante los últimos 12 meses para este departamento.`;
  } else {
    const risk = turnoverRiskFromMean(triggerScore);
    peopleAtRisk = Math.ceil(base * risk);
    riskPct = Math.round(risk * 100);
    turnoverAssumption =
      `Riesgo de rotación ${riskPct}% por score ${triggerScore} (escala heredada de RetentionEngine, fuente Gallup)`;
  }

  // ÚNICA fuente de cifras CLP de la plataforma: SalaryConfigService
  const { turnoverCost, multiplier } = SalaryConfigService.calculateTurnoverCost(
    salary.monthlySalary
  );
  const potentialAnnualLossCLP = peopleAtRisk * turnoverCost;

  const program = PROGRAM_BY_TYPE[type];
  const recommendedInvestmentCLP = base * program.costPerPersonCLP;
  const estimatedSavingsCLP = potentialAnnualLossCLP * program.effectiveness;
  const estimatedROIPct =
    recommendedInvestmentCLP > 0
      ? Math.round(
          ((estimatedSavingsCLP - recommendedInvestmentCLP) / recommendedInvestmentCLP) * 100
        )
      : null;
  const paybackMonths =
    estimatedSavingsCLP > 0
      ? Math.ceil(recommendedInvestmentCLP / (estimatedSavingsCLP / 12))
      : null;

  const confidence: PulseConfidence =
    dept.participationRate >= CONFIDENCE_HIGH_PARTICIPATION
      ? 'alta'
      : dept.participationRate >= CONFIDENCE_MEDIUM_PARTICIPATION
        ? 'media'
        : 'baja';

  return {
    type,
    severity: triggerScore < DRIVER_CRITICAL_MEAN ? 'critica' : 'alta',
    driver,
    triggerScore,
    peopleAtRisk,
    turnoverRiskPct: riskPct,
    potentialAnnualLossCLP,
    recommendedInvestmentCLP,
    estimatedROIPct,
    paybackMonths,
    salarySource: salary.source,
    confidence,
    assumptions: [
      `Base de personas: ${dept.headcountAvg !== null ? `headcountAvg ${base} (DepartmentMetric)` : `${base} respondentes (sin headcountAvg cargado)`}`,
      `Salario mensual $${salary.monthlySalary.toLocaleString('es-CL')} CLP (fuente: ${salary.source})`,
      `Costo de rotación ${multiplier}× salario anual (SalaryConfigService)`,
      turnoverAssumption,
      `Efectividad de programa ${Math.round(program.effectiveness * 100)}% (fuente HBR/McKinsey, heredada de RetentionEngine)`,
    ],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Funciones READ-TIME (Gate 4 las consume al leer los insights — nada de esto
// se persiste; la fuente de verdad es el dato per-dept)
// ─────────────────────────────────────────────────────────────────────────────

export interface MomentumMoverRow {
  departmentId: string;
  departmentName?: string;
  momentum: number | null; // el escalar EI persistido por Gate 2
  engagementFavorability?: number | null;
}

/**
 * Ranking "mayor caída / mayor mejora" por depto (nota Victor 2026-07-07,
 * patrón TopMoversPanel de Torre de Control). Opera sobre el momentum ya
 * persistido — el panel visual es Gate 4.
 */
export function rankMomentumMovers(
  rows: MomentumMoverRow[],
  topN: number = MOVERS_TOP_N
): { gainers: MomentumMoverRow[]; decliners: MomentumMoverRow[] } {
  const withMomentum = rows.filter((r) => r.momentum !== null);
  return {
    gainers: withMomentum
      .filter((r) => (r.momentum as number) > 0)
      .sort((a, b) => (b.momentum as number) - (a.momentum as number))
      .slice(0, topN),
    decliners: withMomentum
      .filter((r) => (r.momentum as number) < 0)
      .sort((a, b) => (a.momentum as number) - (b.momentum as number))
      .slice(0, topN),
  };
}

export interface CompanyBusinessCaseTotal {
  type: PulseBusinessCaseType;
  deptCount: number;
  peopleAtRisk: number;
  potentialAnnualLossCLP: number;
  recommendedInvestmentCLP: number;
}

/** Totales compañía por tipo de business case, derivados de los flags per-dept. */
export function buildCompanyBusinessCases(
  flagsList: (ClimaCorrelationFlags | null)[]
): CompanyBusinessCaseTotal[] {
  const totals = new Map<PulseBusinessCaseType, CompanyBusinessCaseTotal>();
  for (const flags of flagsList) {
    for (const bc of flags?.businessCases ?? []) {
      let total = totals.get(bc.type);
      if (!total) {
        total = {
          type: bc.type,
          deptCount: 0,
          peopleAtRisk: 0,
          potentialAnnualLossCLP: 0,
          recommendedInvestmentCLP: 0,
        };
        totals.set(bc.type, total);
      }
      total.deptCount += 1;
      total.peopleAtRisk += bc.peopleAtRisk;
      total.potentialAnnualLossCLP += bc.potentialAnnualLossCLP;
      total.recommendedInvestmentCLP += bc.recommendedInvestmentCLP;
    }
  }
  return Array.from(totals.values());
}

export interface CompanyPulseRow {
  departmentId: string;
  riskZone: string | null;
  correlationFlags: ClimaCorrelationFlags | null;
}

export interface CompanyPulseSummary {
  deptCount: number;
  zoneCounts: Record<RiskZone, number>;
  hotspotDepartmentIds: string[];
  theatreDepartmentIds: string[];
  climaTurnover: ClimaCorrelationFlags['climaTurnover'] | null;
  businessCaseTotals: CompanyBusinessCaseTotal[];
}

/** Vista compañía derivada al leer DepartmentClimaInsight[] (API Gate 4). */
export function aggregateCompanyPulse(rows: CompanyPulseRow[]): CompanyPulseSummary {
  const zoneCounts: Record<RiskZone, number> = {
    verde: 0,
    amarilla: 0,
    naranja: 0,
    roja: 0,
  };
  const hotspotDepartmentIds: string[] = [];
  const theatreDepartmentIds: string[] = [];
  let climaTurnover: ClimaCorrelationFlags['climaTurnover'] | null = null;

  for (const row of rows) {
    if (row.riskZone && row.riskZone in zoneCounts) {
      zoneCounts[row.riskZone as RiskZone] += 1;
    }
    if (row.correlationFlags?.hotspot?.isHotspot === true) {
      hotspotDepartmentIds.push(row.departmentId);
    }
    if (row.correlationFlags?.theatreDetected === true) {
      theatreDepartmentIds.push(row.departmentId);
    }
    if (!climaTurnover && row.correlationFlags?.climaTurnover) {
      climaTurnover = row.correlationFlags.climaTurnover; // escalar duplicado per-dept
    }
  }

  return {
    deptCount: rows.length,
    zoneCounts,
    hotspotDepartmentIds,
    theatreDepartmentIds,
    climaTurnover,
    businessCaseTotals: buildCompanyBusinessCases(rows.map((r) => r.correlationFlags)),
  };
}

export interface OrgFavorabilityRow {
  engagementFavorability: number | null;
  totalInvited: number;
}

export interface OrgFavorabilityResult {
  favorability: number | null; // 0-100, ponderado por headcount; null si sin base
  riskZone: RiskZone | null; // derivada con umbrales sellados (sin modulación momentum)
}

/**
 * Favorability de compañía (o del scope visible de un AREA_MANAGER) para el
 * EngagementGauge del Lobby — derivada read-time al leer DepartmentClimaInsight[].
 * Ponderada por headcount, NO promedio simple: un depto de 5 personas no puede
 * pesar igual que uno de 300 en el número que ve el CEO.
 *
 * // totalInvited se usa como proxy de headcount al momento de medición, no
 * // headcount exacto en tiempo real. Aproximación aceptada — NO es deuda
 * // técnica pendiente de resolver con un join a Employee/Department.
 *
 * Degradación explícita: solo ponderan deptos con engagementFavorability medida;
 * si Σ(totalInvited de esos deptos) === 0 → favorability null (nunca NaN),
 * riskZone null. Mismo patrón de degradación que Gate 2/3.
 * riskZone sin modulación por momentum (es un agregado de compañía, no un delta).
 */
export function calcOrgFavorability(rows: OrgFavorabilityRow[]): OrgFavorabilityResult {
  let weightedSum = 0;
  let weightTotal = 0;
  for (const row of rows) {
    if (row.engagementFavorability === null) continue;
    const weight = row.totalInvited;
    if (weight <= 0) continue;
    weightedSum += row.engagementFavorability * weight;
    weightTotal += weight;
  }
  if (weightTotal === 0) {
    return { favorability: null, riskZone: null };
  }
  const favorability = round1(weightedSum / weightTotal);
  return { favorability, riskZone: calcRiskZone(favorability, null) };
}

/**
 * Momentum organizacional para el footer del gauge — delta de orgFavorability
 * actual vs. la campaña de clima anterior. Hermana de calcOrgFavorability.
 * El caller resuelve la campaña anterior SAME-TIPO (mismo slug — unificado con
 * el momentum per-depto sellado) y su orgFavorability con la MISMA función,
 * respetando el scope RBAC en ambas.
 * null si falta cualquiera de las dos (→ el footer cae a gap vs objetivo).
 */
export function calcOrgMomentum(
  current: number | null,
  previous: number | null
): number | null {
  if (current === null || previous === null) return null;
  return round1(current - previous);
}
