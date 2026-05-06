// src/lib/services/compliance/ConvergenciaEngine.ts
// Ambiente Sano - Cruce de señales entre 4 instrumentos por departamento.
//
// Arquitectura:
//   1. buildDepartmentConvergencia(input) — función pura: toma inputs y arma
//      el DepartmentConvergencia. Sin I/O. Usada cuando los datos ya están
//      en mano (caso Orchestrator al cerrar un DEPT job).
//   2. buildGlobalConvergencia(departments[]) — función pura: calcula
//      agregados cross-depto (activeSourcesGlobal, criticalByManager).
//   3. loadDepartmentExternalSignals(deptId, accountId, deptAccumulatedExo)
//      — carga las señales externas (Exit leadership, EXO, Pulso) para UN depto.
//   4. runConvergencia(campaignId, accountId) — wrapper full-campaign que
//      carga en bulk, compone y retorna ConvergenciaResult. Usado por el
//      endpoint manual POST /api/compliance/convergencia.
//
// Degradación elegante O4: si el account no tiene uno de los instrumentos,
// el nodo simplemente no aparece.

import { prisma } from '@/lib/prisma';
import type { ComplianceSource } from '@/config/complianceAlertConfig';
import type { PatronAnalysisOutput, PatronDetectado } from './complianceTypes';
import {
  PESO_BASE_ALERTA,
  ALERTAS_CRITICAS,
  ALERTA_CRITICA_PESO_MIN,
  BUMPABLE_ONBOARDING_TYPES,
  applyBumpIfApplicable,
  EXO_SIGNAL_THRESHOLDS,
  EIS_SIGNAL_THRESHOLDS,
  FALLA_CICLO_VIDA_ISA_MAX,
  normalizeExitAlertType,
  getHistoricalWeight,
  HISTORICAL_LOOKBACK_MONTHS,
} from '@/config/compliance/convergenciaWeights';

const AMBIENTE_SANO_SLUG = 'pulso-ambientes-sanos';
const PULSO_EXPRESS_SLUG = 'pulso-express';

// Umbrales legacy (signals.ambiente_sano sobre safetyScore 1-5)
const SAFETY_RISK = 3.0;
const SAFETY_CRITICAL = 2.5;
// Exit usa el SCORE PRINCIPAL del producto (EIS, escala 0-100), no una
// dimensión interna. Thresholds alineados con EIS_THRESHOLDS de
// src/types/exit.ts: NEUTRAL=60 (debajo = riesgo), PROBLEMATIC=40 (debajo = crítico).
const EXIT_EIS_RISK = 60;
const EXIT_EIS_CRITICAL = 40;
const EXO_RISK = 60;
const EXO_CRITICAL = 30;
const PULSO_CLIMA_RISK = 3.2;
const SILENCE_PATTERN_INTENSITY = 0.5;

// ═══════════════════════════════════════════════════════════════════
// MOTOR A v2 — Convergencia Interna (sin productos externos)
// Spec: .claude/tasks/SPEC_CONVERGENCIA_ENGINE_v2_FINAL.md
// ═══════════════════════════════════════════════════════════════════

// Thresholds ISA (escala 0-100)
const ISA_RISK = 50;          // A1 / A4 deptMinISA / riesgo_convergente
const ISA_OBSERVACION = 75;   // A5 (todo bien, nada lo es)
const ISA_MID_LOW = 50;
const ISA_MID_HIGH = 74;      // ISA 50-74 → casos múltiples requeridos

// Thresholds intensidad de patrones LLM (0-1)
const A1_SILENCIO_OR_MIEDO = 0.4;   // A1 silencio o miedo
const A1_HOSTILIDAD = 0.5;          // A1 hostilidad (más exigente)
const A2_ALGUN_PATRON = 0.3;        // A2 "algún patrón" — los 5 cuentan
const A5_SILENCIO = 0.5;            // A5 silencio activo con ISA alto
const C_SILENCIO_O_MIEDO_VERTICAL = 0.6; // liderazgo_toxico C: vertical + (silencio|miedo) > 0.6

// Thresholds dimensionScores (escala 1-5)
const DIM_CRITICA = 2.5;            // A2/A3/liderazgo_toxico — dimensión crítica
const DIM_LIDERAZGO_BAJA = 2.8;     // liderazgo_toxico D — borderline
const DIM_LIDERAZGO_MEDIA = 3.0;    // liderazgo_toxico E — más permisivo

// Threshold criticalByManager
const A4_DELTA_ISA_MIN = 30;
const A4_DELTA_ISA_CRITICA = 50;
const A4_DEPT_MIN_ISA = 50;

// Patrones LLM — los 5 que produce el motor LLM (complianceTypes.ts:4-9).
// A1/A5 usan los 3 nombrados; A2 considera los 5 ("cualquier patrón").
const PATRONES_TODOS = [
  'silencio_organizacional',
  'miedo_represalias',
  'hostilidad_normalizada',
  'favoritismo_implicito',
  'resignacion_aprendida',
] as const;

export type ConvergenciaLevel =
  | 'sin_riesgo'
  | 'bajo'
  | 'medio'
  | 'convergente'
  | 'critico';

export interface ConvergenciaSignal {
  source: ComplianceSource;
  value: number | null;
  isRisk: boolean;
  isCritical: boolean;
  note?: string;
}

export type CasoMotorA = 'A1' | 'A2' | 'A3' | 'A4' | 'A5';

export type NivelConvergenciaInterna =
  | 'ninguna'
  | 'simple'
  | 'multiple'
  | 'critica';

/**
 * Sub-objeto Motor A v2 — convergencia interna self-confirmatoria.
 * Disponible per-dept desde el primer ciclo, sin requerir productos externos.
 * Spec: .claude/tasks/SPEC_CONVERGENCIA_ENGINE_v2_FINAL.md sec 2.
 */
export interface ConvergenciaInternaResult {
  casosActivos: CasoMotorA[];
  nivelConvergencia: NivelConvergenciaInterna;
  teatroDetectado: boolean;
  silencioDetectado: boolean;
  /** True si este dept está en algún grupo criticalByManager con delta ISA ≥ 30. */
  enCriticalByManagerGroup: boolean;
}

// ═══════════════════════════════════════════════════════════════════
// MOTOR B v2 — Convergencia Externa (Fase 2: Exit + Onboarding)
// ═══════════════════════════════════════════════════════════════════

/**
 * Alerta externa procesada por el motor — viene de ExitAlert o JourneyAlert
 * con peso base + factor de decaimiento.
 *
 * Fase 2: factorDecaimiento = 1.0 siempre (solo pending/acknowledged).
 * Fase 3: factorDecaimiento ∈ {1.0, 0.6, 0.3, 0.1} según antigüedad de
 * resolved/dismissed.
 */
export interface ExternalAlert {
  id: string;
  alertType: string;          // canónico (post normalización)
  producto: 'exit' | 'onboarding';
  pesoBase: number;           // 0 (desconocido) | 1 | 2 | 3
  factorDecaimiento: number;  // Fase 2: 1.0
  pesoEfectivo: number;       // pesoBase × factorDecaimiento
  status: string;
  resolvedAt: Date | null;
}

/**
 * Sub-objeto Motor B Fase 2 — convergencia externa con productos contratados.
 * Spec sec 3 + sec 5 Fase 2.
 */
export interface ConvergenciaExternaResult {
  exoSignal: 0 | 1 | 2;
  eisSignal: 0 | 1 | 2;
  pesoAlertas: number;          // suma de pesoEfectivo
  scoreTotal: number;           // exoSignal + eisSignal + pesoAlertas
  tieneAlertaCritica: boolean;  // alguna ALERTAS_CRITICAS con peso ≥ 0.9
  fallaCicloDeVida: boolean;    // ISA<50 AND (eisSignal≥2 OR exoSignal≥2)
  alertasConsideradas: ExternalAlert[];
}

export interface DepartmentConvergencia {
  departmentId: string;
  departmentName: string;
  managerId: string | null;

  signals: Partial<Record<ComplianceSource, ConvergenciaSignal>>;
  activeSources: ComplianceSource[];
  riskSignalsCount: number;
  hasCriticalSafety: boolean;

  level: ConvergenciaLevel;

  /** Pattern silencio_organizacional detectado por LLM. */
  silencioDetected: boolean;
  /** Deterioro sostenido del Clima Pulso en 3+ períodos. */
  deterioroPulso: boolean;
  /** Exits recientes con EXO bajo (señal ignorada). */
  senalIgnorada: boolean;

  /** Motor A v2 — casos A1-A5. Calculado per-dept (A4 se patchea cross-dept en applyA4ToDepartments). */
  convergenciaInterna: ConvergenciaInternaResult;

  /** Motor B Fase 2 — convergencia externa con Exit + Onboarding. */
  convergenciaExterna: ConvergenciaExternaResult;
}

/**
 * Grupo criticalByManager con métricas de delta ISA. Privacy: managerId solo
 * como key, nunca renderizar al user. El frontend lee solo departmentIds.
 */
export interface CriticalByManagerGroup {
  managerId: string;
  departmentIds: string[];
  deltaIsa: number;   // max - min, >= 30 para grupo válido
  minIsa: number;
  maxIsa: number;
}

export interface ConvergenciaGlobals {
  activeSourcesGlobal: ComplianceSource[];
  criticalByManager: CriticalByManagerGroup[];
}

export interface ConvergenciaResult extends ConvergenciaGlobals {
  campaignId: string;
  accountId: string;
  departments: DepartmentConvergencia[];
}

// ═══════════════════════════════════════════════════════════════════
// Fuentes externas por departamento
// ═══════════════════════════════════════════════════════════════════

export interface DepartmentExternalSignals {
  /**
   * Exit Intelligence Score (EIS) del depto, escala 0-100.
   * Fuente preferida: Department.accumulatedEISScore (gold cache 12 meses).
   * Fallback: avgEIS del DepartmentExitInsight más reciente si gold cache es null.
   */
  exitEIS: number | null;
  /** Department.accumulatedExoScore (proxy Onboarding Journey agregado). */
  exoScore: number | null;
  /** Últimos scores de clima de pulso-express (más reciente primero, hasta 3). */
  pulsoHistory: number[];
  /** Hay ExitRecord reciente con onboardingEXOScore bajo en este depto. */
  senalIgnorada: boolean;
}

export async function loadDepartmentExternalSignals(
  departmentId: string,
  accountId: string,
  deptAccumulatedExo: number | null | undefined
): Promise<DepartmentExternalSignals> {
  // 1. Exit Intelligence — leer EIS (score principal del producto, escala 0-100).
  //    Preferencia: gold cache rolling 12 meses en Department.accumulatedEISScore.
  //    Fallback: avgEIS del DepartmentExitInsight más reciente.
  const deptGold = await prisma.department.findUnique({
    where: { id: departmentId },
    select: { accumulatedEISScore: true },
  });
  let exitEIS: number | null = deptGold?.accumulatedEISScore ?? null;
  if (exitEIS === null) {
    const latestExit = await prisma.departmentExitInsight.findFirst({
      where: { accountId, departmentId },
      orderBy: { periodEnd: 'desc' },
      select: { avgEIS: true },
    });
    exitEIS = latestExit?.avgEIS ?? null;
  }

  // 2. Señal ignorada: exits recientes con EXO bajo en este depto.
  const recentCutoff = new Date();
  recentCutoff.setMonth(recentCutoff.getMonth() - 6);
  const recentLowExoExit = await prisma.exitRecord.findFirst({
    where: {
      accountId,
      departmentId,
      exitDate: { gte: recentCutoff },
      hadOnboarding: true,
      onboardingEXOScore: { not: null, lt: EXO_RISK },
    },
    select: { id: true },
  });

  // 3. Pulso Express histórico (últimos 3 períodos) — score del depto.
  const pulsoCampaigns = await prisma.campaign.findMany({
    where: {
      accountId,
      campaignType: { slug: PULSO_EXPRESS_SLUG },
      status: 'completed',
      campaignResults: { isNot: null },
    },
    orderBy: { endDate: 'desc' },
    take: 3,
    include: { campaignResults: { select: { departmentScores: true } } },
  });

  const pulsoHistory: number[] = [];
  for (const pc of pulsoCampaigns) {
    const deptScores = (pc.campaignResults?.departmentScores ?? {}) as Record<
      string,
      unknown
    >;
    const raw = deptScores[departmentId];
    if (typeof raw === 'number') pulsoHistory.push(raw);
  }

  return {
    exitEIS,
    exoScore: deptAccumulatedExo ?? null,
    pulsoHistory,
    senalIgnorada: !!recentLowExoExit,
  };
}

// ═══════════════════════════════════════════════════════════════════
// Función pura: arma DepartmentConvergencia desde inputs.
// ═══════════════════════════════════════════════════════════════════

/** Subconjunto de DepartmentSafetyScore.dimensionScores que el motor consume. */
export interface DimensionScoresInput {
  P2_seguridad: number | null;
  P3_disenso: number | null;
  P4_microagresiones: number | null;
  P5_equidad: number | null;
  P7_liderazgo: number | null;
  P8_agotamiento: number | null;
}

export interface BuildDepartmentConvergenciaInput {
  departmentId: string;
  departmentName: string;
  managerId: string | null;
  safetyScore: number | null;
  patrones: PatronDetectado[];
  externalSignals: DepartmentExternalSignals;
  // ─── Motor A v2 (Fase 1) ──────────────────────────────────────────────
  /** ISA 0-100 del dept en este ciclo. Si null, se skipean todos los casos A1-A5. */
  isaScore: number | null;
  /** Dimensiones P2-P8 (escala 1-5, P4/P8 ya invertidas). */
  dimensionScores: DimensionScoresInput;
  /** Output completo del LLM para este dept. Si null, casos LLM-dependientes se skipean. */
  patronesOutput: PatronAnalysisOutput | null;
  /** Flag teatro de cumplimiento detectado (detectTeatroCumplimiento). */
  teatroCumplimiento: boolean;
  /**
   * Alertas externas (Exit + Onboarding) pre-procesadas para este dept.
   * Cargadas vía `loadDepartmentExternalAlerts`. Pueden estar vacías si el
   * cliente no tiene productos externos contratados — Motor B degrada
   * elegantemente (scoreTotal = 0).
   */
  externalAlerts: ExternalAlert[];
}

export function buildDepartmentConvergencia(
  input: BuildDepartmentConvergenciaInput
): DepartmentConvergencia {
  const {
    departmentId,
    departmentName,
    managerId,
    safetyScore,
    patrones,
    externalSignals,
    isaScore,
    dimensionScores,
    patronesOutput,
    teatroCumplimiento,
    externalAlerts,
  } = input;
  const signals: Partial<Record<ComplianceSource, ConvergenciaSignal>> = {};

  // Safety (ambiente_sano) — siempre presente para deptos con análisis.
  if (safetyScore !== null) {
    signals.ambiente_sano = {
      source: 'ambiente_sano',
      value: safetyScore,
      isRisk: safetyScore < SAFETY_RISK,
      isCritical: safetyScore < SAFETY_CRITICAL,
    };
  }

  // Exit Intelligence — score principal del producto (EIS, 0-100).
  if (externalSignals.exitEIS !== null) {
    signals.exit = {
      source: 'exit',
      value: externalSignals.exitEIS,
      isRisk: externalSignals.exitEIS < EXIT_EIS_RISK,
      isCritical: externalSignals.exitEIS < EXIT_EIS_CRITICAL,
    };
  }

  // EXO (proxy Department.accumulatedExoScore).
  if (externalSignals.exoScore !== null) {
    signals.onboarding = {
      source: 'onboarding',
      value: externalSignals.exoScore,
      isRisk: externalSignals.exoScore < EXO_RISK,
      isCritical: externalSignals.exoScore < EXO_CRITICAL,
    };
  }

  // Pulso clima + tendencia descendente.
  let deterioroPulso = false;
  const hist = externalSignals.pulsoHistory;
  if (hist.length >= 1) {
    const latest = hist[0];
    const trendingDown =
      hist.length >= 2 && hist[0] < hist[1] && (hist.length < 3 || hist[1] < hist[2]);
    deterioroPulso = hist.length >= 3 && hist[0] < hist[1] && hist[1] < hist[2];
    signals.pulso = {
      source: 'pulso',
      value: latest,
      isRisk: latest < PULSO_CLIMA_RISK && trendingDown,
      isCritical: false,
      note: trendingDown ? 'tendencia descendente' : undefined,
    };
  }

  // Silencio organizacional.
  const silencioDetected = patrones.some(
    (p) => p.nombre === 'silencio_organizacional' && p.intensidad >= SILENCE_PATTERN_INTENSITY
  );

  const activeSources = Object.keys(signals) as ComplianceSource[];
  const riskSignalsCount = activeSources.filter((s) => signals[s]?.isRisk).length;
  const hasCriticalSafety = !!signals.ambiente_sano?.isCritical;
  const level = levelFrom(riskSignalsCount, hasCriticalSafety, activeSources.length > 0);

  // Motor A v2 — detección de casos A1, A2, A3, A5 (A4 se patchea cross-dept).
  const convergenciaInterna = detectCasosMotorA(
    isaScore,
    dimensionScores,
    patronesOutput,
    teatroCumplimiento
  );

  // Motor B v2 — convergencia externa (EIS + EXO + alertas pre-cargadas).
  const convergenciaExterna = computeConvergenciaExterna(
    externalSignals.exoScore,
    externalSignals.exitEIS,
    externalAlerts,
    isaScore
  );

  return {
    departmentId,
    departmentName,
    managerId,
    signals,
    activeSources,
    riskSignalsCount,
    hasCriticalSafety,
    level,
    silencioDetected,
    deterioroPulso,
    senalIgnorada: externalSignals.senalIgnorada,
    convergenciaInterna,
    convergenciaExterna,
  };
}

function levelFrom(
  riskCount: number,
  criticalSafety: boolean,
  hasAnySignal: boolean
): ConvergenciaLevel {
  if (!hasAnySignal) return 'sin_riesgo';
  if (criticalSafety && riskCount >= 2) return 'critico';
  if (riskCount >= 3) return 'convergente';
  if (riskCount === 2) return 'medio';
  if (riskCount === 1) return 'bajo';
  return 'sin_riesgo';
}

// ═══════════════════════════════════════════════════════════════════
// MOTOR A v2 — Detección de casos A1-A5 (funciones puras)
// ═══════════════════════════════════════════════════════════════════

/**
 * Devuelve la intensidad del patrón LLM por nombre, o 0 si no está presente.
 * Permite expresiones como `findPatronIntensidad(p, 'silencio_organizacional') > 0.4`.
 */
function findPatronIntensidad(
  patrones: PatronDetectado[],
  nombre: PatronDetectado['nombre']
): number {
  const found = patrones.find((p) => p.nombre === nombre);
  return found?.intensidad ?? 0;
}

/**
 * Verifica si al menos un patrón LLM (de los 5 conocidos) tiene intensidad
 * sobre el threshold. Usado por A2 ("algún patrón > 0.3").
 */
function hayAlgunPatronSobre(
  patrones: PatronDetectado[],
  threshold: number
): boolean {
  return PATRONES_TODOS.some(
    (nombre) => findPatronIntensidad(patrones, nombre) > threshold
  );
}

/**
 * Verifica si alguna dimension P2-P8 está bajo el threshold.
 * Las nulls se ignoran (no cuentan como bajas).
 */
function hayAlgunaDimBajo(
  dims: DimensionScoresInput,
  threshold: number
): boolean {
  const values = [
    dims.P2_seguridad,
    dims.P3_disenso,
    dims.P4_microagresiones,
    dims.P5_equidad,
    dims.P7_liderazgo,
    dims.P8_agotamiento,
  ];
  return values.some((v) => v !== null && v < threshold);
}

/**
 * Mapea casosActivos[] a nivel de convergencia interna.
 * Spec sec 2 — A2 o A5 fuerzan 'critica' independiente del count.
 * Reusado por detectCasosMotorA y applyA4ToDepartments (al patchear A4).
 */
function computeNivelConvergencia(
  casosActivos: CasoMotorA[]
): NivelConvergenciaInterna {
  if (casosActivos.includes('A2') || casosActivos.includes('A5')) return 'critica';
  if (casosActivos.length >= 3) return 'critica';
  if (casosActivos.length === 2) return 'multiple';
  if (casosActivos.length === 1) return 'simple';
  return 'ninguna';
}

/**
 * Detecta los casos A1, A2, A3, A5 per-dept (los que dependen solo de data
 * del dept). A4 queda false provisional — se patchea en applyA4ToDepartments.
 *
 * Skipea todo (retorna 'ninguna') si isaScore o patronesOutput son null —
 * indica falla upstream, no inventar comportamiento.
 */
export function detectCasosMotorA(
  isaScore: number | null,
  dimensionScores: DimensionScoresInput,
  patronesOutput: PatronAnalysisOutput | null,
  teatroCumplimiento: boolean
): ConvergenciaInternaResult {
  const empty: ConvergenciaInternaResult = {
    casosActivos: [],
    nivelConvergencia: 'ninguna',
    teatroDetectado: false,
    silencioDetectado: false,
    enCriticalByManagerGroup: false,
  };

  if (isaScore === null) return empty;

  const patrones = patronesOutput?.patrones ?? [];
  const silencioInt = findPatronIntensidad(patrones, 'silencio_organizacional');
  const miedoInt = findPatronIntensidad(patrones, 'miedo_represalias');
  const hostilidadInt = findPatronIntensidad(patrones, 'hostilidad_normalizada');
  const sesgoGenero = patronesOutput?.alerta_sesgo_genero === true;

  const casosActivos: CasoMotorA[] = [];

  // A1 — números y texto coinciden
  if (
    isaScore < ISA_RISK &&
    (silencioInt > A1_SILENCIO_OR_MIEDO ||
      miedoInt > A1_SILENCIO_OR_MIEDO ||
      hostilidadInt > A1_HOSTILIDAD)
  ) {
    casosActivos.push('A1');
  }

  // A2 — teatro + (alguna dim < 2.5 OR algún patrón > 0.3)
  if (
    teatroCumplimiento &&
    (hayAlgunaDimBajo(dimensionScores, DIM_CRITICA) ||
      hayAlgunPatronSobre(patrones, A2_ALGUN_PATRON))
  ) {
    casosActivos.push('A2');
  }

  // A3 — sesgo género + p2_seguridad < 2.5
  if (
    sesgoGenero &&
    dimensionScores.P2_seguridad !== null &&
    dimensionScores.P2_seguridad < DIM_CRITICA
  ) {
    casosActivos.push('A3');
  }

  // A5 — todo bien, nada lo es (ISA alto + teatro + silencio activo)
  if (
    isaScore >= ISA_OBSERVACION &&
    teatroCumplimiento &&
    silencioInt > A5_SILENCIO
  ) {
    casosActivos.push('A5');
  }

  return {
    casosActivos,
    nivelConvergencia: computeNivelConvergencia(casosActivos),
    teatroDetectado: teatroCumplimiento,
    silencioDetectado: silencioInt > A1_SILENCIO_OR_MIEDO,
    enCriticalByManagerGroup: false, // se patchea en applyA4ToDepartments
  };
}

/**
 * Recalcula `criticalByManager` con delta ISA.
 *
 * Reglas:
 *   - Solo deptos con managerId no-null e isaScore no-null entran al cómputo.
 *   - Por managerId con >= 2 deptos: calcula minIsa, maxIsa, deltaIsa.
 *   - Filtra: deltaIsa >= 30 AND minIsa < 50 → grupo válido.
 *
 * Privacy: managerId solo como key. departmentIds[] es lo único renderizable.
 */
function buildCriticalByManagerWithDelta(
  departments: DepartmentConvergencia[],
  isaByDeptId: Map<string, number>
): CriticalByManagerGroup[] {
  // Agrupa deptos por managerId con isaScore disponible.
  const byManager = new Map<string, Array<{ deptId: string; isa: number }>>();
  for (const d of departments) {
    if (!d.managerId) continue;
    const isa = isaByDeptId.get(d.departmentId);
    if (isa === undefined || isa === null) continue;
    const arr = byManager.get(d.managerId) ?? [];
    arr.push({ deptId: d.departmentId, isa });
    byManager.set(d.managerId, arr);
  }

  const groups: CriticalByManagerGroup[] = [];
  for (const [managerId, deptList] of byManager) {
    if (deptList.length < 2) continue;
    const isas = deptList.map((d) => d.isa);
    const minIsa = Math.min(...isas);
    const maxIsa = Math.max(...isas);
    const deltaIsa = maxIsa - minIsa;
    if (deltaIsa < A4_DELTA_ISA_MIN) continue;
    if (minIsa >= A4_DEPT_MIN_ISA) continue;
    groups.push({
      managerId,
      departmentIds: deptList.map((d) => d.deptId),
      deltaIsa,
      minIsa,
      maxIsa,
    });
  }
  return groups;
}

// ═══════════════════════════════════════════════════════════════════
// MOTOR B v2 — Helpers puros (señales EIS/EXO + score externo)
// ═══════════════════════════════════════════════════════════════════

/**
 * EXO signal (0/1/2 puntos) según rangos del spec sec 3.1.
 *   ≥70 → 0 puntos (sano)
 *   50-69 → 1 punto (riesgo)
 *   <50 → 2 puntos (crítico)
 *   null → 0 (sin datos = sin señal)
 */
function computeExoSignal(exoScore: number | null): 0 | 1 | 2 {
  if (exoScore === null) return 0;
  if (exoScore >= EXO_SIGNAL_THRESHOLDS.RISK) return 0;
  if (exoScore >= EXO_SIGNAL_THRESHOLDS.CRITICAL) return 1;
  return 2;
}

/**
 * EIS signal (0/1/2 puntos) según rangos del spec sec 3.1.
 *   ≥60 → 0 puntos (sano)
 *   40-59 → 1 punto (riesgo)
 *   <40 → 2 puntos (crítico)
 *   null → 0 (sin datos = sin señal)
 */
function computeEisSignal(eisScore: number | null): 0 | 1 | 2 {
  if (eisScore === null) return 0;
  if (eisScore >= EIS_SIGNAL_THRESHOLDS.RISK) return 0;
  if (eisScore >= EIS_SIGNAL_THRESHOLDS.CRITICAL) return 1;
  return 2;
}

/**
 * Computa la convergencia externa per-dept agregando señales de score
 * continuo + pesos de alertas externas. Spec sec 3.
 *
 * Exportada para reuso en ComplianceAlertService.buildAlertContextsFromDb.
 */
export function computeConvergenciaExterna(
  exoScore: number | null,
  eisScore: number | null,
  externalAlerts: ExternalAlert[],
  isaScore: number | null
): ConvergenciaExternaResult {
  const exoSignal = computeExoSignal(exoScore);
  const eisSignal = computeEisSignal(eisScore);

  const pesoAlertas = externalAlerts.reduce((sum, a) => sum + a.pesoEfectivo, 0);
  const scoreTotal = exoSignal + eisSignal + pesoAlertas;

  const tieneAlertaCritica = externalAlerts.some(
    (a) =>
      ALERTAS_CRITICAS.includes(a.alertType) &&
      a.pesoEfectivo >= ALERTA_CRITICA_PESO_MIN
  );

  const fallaCicloDeVida =
    isaScore !== null &&
    isaScore < FALLA_CICLO_VIDA_ISA_MAX &&
    (eisSignal >= 2 || exoSignal >= 2);

  return {
    exoSignal,
    eisSignal,
    pesoAlertas,
    scoreTotal,
    tieneAlertaCritica,
    fallaCicloDeVida,
    alertasConsideradas: externalAlerts,
  };
}

// ═══════════════════════════════════════════════════════════════════
// MOTOR B v2 — Helpers async (carga alertas + bump 90d)
// ═══════════════════════════════════════════════════════════════════

/**
 * Cuenta alertas Onboarding del depto en últimos 90 días por tipo bumpable.
 * Spec sec 3.3: ABANDONO_DIA_1 (2→3) y BIENVENIDA_FALLIDA (1→2) si count ≥ 2.
 *
 * Cuenta TODAS las alertas del período (pending/ack/resolved/dismissed) —
 * decisión literal del spec: la idea del bump es captar patrones repetitivos
 * aunque algunas se hayan cerrado.
 */
async function loadBumpableCounts90Days(
  departmentId: string,
  accountId: string
): Promise<Record<string, number>> {
  const cutoff = new Date(Date.now() - 90 * 24 * 3600 * 1000);
  const counts: Record<string, number> = {};
  for (const t of BUMPABLE_ONBOARDING_TYPES) counts[t] = 0;

  const rows = await prisma.journeyAlert.findMany({
    where: {
      accountId,
      alertType: { in: BUMPABLE_ONBOARDING_TYPES as unknown as string[] },
      createdAt: { gte: cutoff },
      journey: { departmentId },
    },
    select: { alertType: true },
  });

  for (const r of rows) {
    counts[r.alertType] = (counts[r.alertType] ?? 0) + 1;
  }
  return counts;
}

/**
 * Carga alertas externas para un dept.
 * Exit (ExitAlert.departmentId directo) + Onboarding (JourneyAlert via journey.departmentId).
 *
 * Aplica normalización de aliases Exit + bump 90d para tipos onboarding.
 *
 * Modo Fase 2 (default `includeHistorical: false`):
 *   - Solo carga status pending|acknowledged.
 *   - factorDecaimiento = 1.0 siempre.
 *
 * Modo Fase 3 (`includeHistorical: true`):
 *   - Carga también resolved|dismissed con `resolvedAt >= now - HISTORICAL_LOOKBACK_MONTHS`.
 *   - factorDecaimiento computado por `getHistoricalWeight(status, resolvedAt)`:
 *     1.0 (active) / 0.6 (<3m) / 0.3 (3-6m) / 0.1 (>6m).
 *   - pesoEfectivo = pesoBase × factorDecaimiento.
 */
export async function loadDepartmentExternalAlerts(
  departmentId: string,
  accountId: string,
  opts?: { includeHistorical?: boolean }
): Promise<ExternalAlert[]> {
  const out: ExternalAlert[] = [];
  const includeHistorical = opts?.includeHistorical === true;
  const now = new Date();

  // Cutoff para histórico — 6 meses atrás. Antigüedad mayor cae a factor 0.1.
  const historicalCutoff = new Date(now);
  historicalCutoff.setMonth(historicalCutoff.getMonth() - HISTORICAL_LOOKBACK_MONTHS);

  const statusFilter = includeHistorical
    ? { in: ['pending', 'acknowledged', 'resolved', 'dismissed'] }
    : { in: ['pending', 'acknowledged'] };

  // Exit alerts — departmentId directo.
  const exitAlerts = await prisma.exitAlert.findMany({
    where: {
      accountId,
      departmentId,
      status: statusFilter,
      ...(includeHistorical
        ? {
            OR: [
              { status: { in: ['pending', 'acknowledged'] } },
              {
                status: { in: ['resolved', 'dismissed'] },
                resolvedAt: { gte: historicalCutoff },
              },
            ],
          }
        : {}),
    },
    select: { id: true, alertType: true, status: true, resolvedAt: true },
  });
  for (const a of exitAlerts) {
    const canonical = normalizeExitAlertType(a.alertType);
    const pesoBase = PESO_BASE_ALERTA[canonical] ?? 0;
    const factorDecaimiento = includeHistorical
      ? getHistoricalWeight(a.status, a.resolvedAt, now)
      : 1.0;
    out.push({
      id: a.id,
      alertType: canonical,
      producto: 'exit',
      pesoBase,
      factorDecaimiento,
      pesoEfectivo: pesoBase * factorDecaimiento,
      status: a.status,
      resolvedAt: a.resolvedAt,
    });
  }

  // Onboarding alerts — via journey.departmentId.
  const journeyAlerts = await prisma.journeyAlert.findMany({
    where: {
      accountId,
      status: statusFilter,
      journey: { departmentId },
      ...(includeHistorical
        ? {
            OR: [
              { status: { in: ['pending', 'acknowledged'] } },
              {
                status: { in: ['resolved', 'dismissed'] },
                resolvedAt: { gte: historicalCutoff },
              },
            ],
          }
        : {}),
    },
    select: { id: true, alertType: true, status: true, resolvedAt: true },
  });

  // Bump counts solo si hay journeyAlerts bumpables (evita query si no aplica).
  const hasBumpables = journeyAlerts.some((a) =>
    (BUMPABLE_ONBOARDING_TYPES as ReadonlyArray<string>).includes(a.alertType)
  );
  const bumpCounts = hasBumpables
    ? await loadBumpableCounts90Days(departmentId, accountId)
    : {};

  for (const a of journeyAlerts) {
    const baseRaw = PESO_BASE_ALERTA[a.alertType] ?? 0;
    const pesoBase = applyBumpIfApplicable(
      a.alertType,
      baseRaw,
      bumpCounts[a.alertType] ?? 0
    );
    const factorDecaimiento = includeHistorical
      ? getHistoricalWeight(a.status, a.resolvedAt, now)
      : 1.0;
    out.push({
      id: a.id,
      alertType: a.alertType,
      producto: 'onboarding',
      pesoBase,
      factorDecaimiento,
      pesoEfectivo: pesoBase * factorDecaimiento,
      status: a.status,
      resolvedAt: a.resolvedAt,
    });
  }

  return out;
}

/**
 * Patch cross-dept del Caso A4 después de buildGlobalConvergencia.
 * Para cada dept en algún grupo criticalByManager:
 *   - convergenciaInterna.enCriticalByManagerGroup = true
 *   - convergenciaInterna.casosActivos += 'A4' (si no estaba ya)
 *   - convergenciaInterna.nivelConvergencia recalculado
 *
 * Devuelve nuevo array (inmutable). El caller debe usar el return.
 */
export function applyA4ToDepartments(
  departments: DepartmentConvergencia[],
  criticalByManager: CriticalByManagerGroup[]
): DepartmentConvergencia[] {
  const inGroup = new Set<string>();
  for (const g of criticalByManager) {
    for (const id of g.departmentIds) inGroup.add(id);
  }
  if (inGroup.size === 0) return departments;

  return departments.map((d) => {
    if (!inGroup.has(d.departmentId)) return d;
    const yaActivo = d.convergenciaInterna.casosActivos.includes('A4');
    const casos = yaActivo
      ? d.convergenciaInterna.casosActivos
      : [...d.convergenciaInterna.casosActivos, 'A4' as CasoMotorA];
    return {
      ...d,
      convergenciaInterna: {
        ...d.convergenciaInterna,
        casosActivos: casos,
        nivelConvergencia: computeNivelConvergencia(casos),
        enCriticalByManagerGroup: true,
      },
    };
  });
}

// ═══════════════════════════════════════════════════════════════════
// Función pura: agregados cross-depto.
// ═══════════════════════════════════════════════════════════════════

/**
 * Agregados cross-depto. La detección de criticalByManager ahora usa delta ISA
 * (spec v2 caso A4) en vez de hasCriticalSafety. Requiere el mapping isa-by-id
 * para evaluar delta dentro de cada grupo.
 */
export function buildGlobalConvergencia(
  departments: DepartmentConvergencia[],
  isaByDeptId: Map<string, number>
): ConvergenciaGlobals {
  const criticalByManager = buildCriticalByManagerWithDelta(departments, isaByDeptId);

  const activeSourcesGlobal = Array.from(
    new Set(departments.flatMap((d) => d.activeSources))
  ) as ComplianceSource[];

  return { activeSourcesGlobal, criticalByManager };
}

// ═══════════════════════════════════════════════════════════════════
// Wrapper full-campaign: compone todo desde la DB.
// Usado por POST /api/compliance/convergencia (re-ejecución manual).
// El flujo del Orchestrator NO lo usa — persiste per-DEPT al cerrar.
// ═══════════════════════════════════════════════════════════════════

export async function runConvergencia(
  campaignId: string,
  accountId: string
): Promise<ConvergenciaResult> {
  const campaign = await prisma.campaign.findFirst({
    where: { id: campaignId, accountId },
    include: { campaignType: { select: { slug: true } } },
  });
  if (!campaign) throw new Error('Campaña no encontrada');
  if (campaign.campaignType.slug !== AMBIENTE_SANO_SLUG) {
    throw new Error(`ConvergenciaEngine solo aplica a "${AMBIENTE_SANO_SLUG}"`);
  }

  const analyses = await prisma.complianceAnalysis.findMany({
    where: {
      campaignId,
      scope: 'DEPARTMENT',
      status: 'COMPLETED',
    },
    include: {
      department: {
        select: { id: true, displayName: true, parentId: true, accumulatedExoScore: true },
      },
    },
  });

  if (analyses.length === 0) {
    return {
      campaignId,
      accountId,
      activeSourcesGlobal: [],
      departments: [],
      criticalByManager: [],
    };
  }

  const departments: DepartmentConvergencia[] = [];
  const isaByDeptId = new Map<string, number>();

  for (const a of analyses) {
    if (!a.departmentId || !a.department) continue;
    const external = await loadDepartmentExternalSignals(
      a.departmentId,
      accountId,
      a.department.accumulatedExoScore
    );
    // Estructura nueva (namespaced): resultPayload = { patrones: PatronAnalysisOutput, safetyDetail, convergencia }.
    // Estructura vieja (plana): resultPayload = PatronAnalysisOutput directamente.
    const rawPayload = a.resultPayload as Record<string, unknown> | null;
    const isNamespaced = !!rawPayload && 'safetyDetail' in rawPayload;
    const patronesLLM = isNamespaced
      ? ((rawPayload as { patrones?: PatronAnalysisOutput }).patrones ?? null)
      : (rawPayload as PatronAnalysisOutput | null);
    const patrones = patronesLLM?.patrones ?? [];

    // Motor A v2 — extraer isaScore + dimensionScores del payload namespaced.
    const safetyDetail = isNamespaced
      ? ((rawPayload as { safetyDetail?: { dimensionScores?: DimensionScoresInput } })
          .safetyDetail ?? null)
      : null;
    const dimensionScores: DimensionScoresInput = safetyDetail?.dimensionScores ?? {
      P2_seguridad: null,
      P3_disenso: null,
      P4_microagresiones: null,
      P5_equidad: null,
      P7_liderazgo: null,
      P8_agotamiento: null,
    };

    if (a.isaScore !== null) {
      isaByDeptId.set(a.departmentId, a.isaScore);
    }

    // Motor B Fase 2 — alertas externas pending/acknowledged per dept.
    const externalAlerts = await loadDepartmentExternalAlerts(
      a.departmentId,
      accountId
    );

    departments.push(
      buildDepartmentConvergencia({
        departmentId: a.departmentId,
        departmentName: a.department.displayName,
        managerId: a.department.parentId,
        safetyScore: a.safetyScore,
        patrones,
        externalSignals: external,
        isaScore: a.isaScore,
        dimensionScores,
        patronesOutput: patronesLLM,
        teatroCumplimiento: !!a.teatroCumplimiento,
        externalAlerts,
      })
    );
  }

  const globals = buildGlobalConvergencia(departments, isaByDeptId);

  // Patch A4 cross-dept antes de retornar.
  const departmentsWithA4 = applyA4ToDepartments(departments, globals.criticalByManager);

  return {
    campaignId,
    accountId,
    departments: departmentsWithA4,
    ...globals,
  };
}
