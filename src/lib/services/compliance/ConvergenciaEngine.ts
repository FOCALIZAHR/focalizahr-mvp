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

const AMBIENTE_SANO_SLUG = 'pulso-ambientes-sanos';
const PULSO_EXPRESS_SLUG = 'pulso-express';

// Umbrales
const SAFETY_RISK = 3.0;
const SAFETY_CRITICAL = 2.5;
const EXIT_LEADERSHIP_RISK = 2.5;
const EXO_RISK = 60;
const EXO_CRITICAL = 30;
const PULSO_CLIMA_RISK = 3.2;
const SILENCE_PATTERN_INTENSITY = 0.5;

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
}

export interface ConvergenciaGlobals {
  activeSourcesGlobal: ComplianceSource[];
  criticalByManager: Array<{
    managerId: string;
    departmentIds: string[];
  }>;
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
  /** avgLeadership del último DepartmentExitInsight del depto. */
  exitLead: number | null;
  /** Department.accumulatedExoScore (proxy EXO Day-30 agregado). */
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
  // 1. Exit leadership del último insight.
  const latestExit = await prisma.departmentExitInsight.findFirst({
    where: { accountId, departmentId },
    orderBy: { periodEnd: 'desc' },
    select: { avgLeadership: true },
  });

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
    exitLead: latestExit?.avgLeadership ?? null,
    exoScore: deptAccumulatedExo ?? null,
    pulsoHistory,
    senalIgnorada: !!recentLowExoExit,
  };
}

// ═══════════════════════════════════════════════════════════════════
// Función pura: arma DepartmentConvergencia desde inputs.
// ═══════════════════════════════════════════════════════════════════

export interface BuildDepartmentConvergenciaInput {
  departmentId: string;
  departmentName: string;
  managerId: string | null;
  safetyScore: number | null;
  patrones: PatronDetectado[];
  externalSignals: DepartmentExternalSignals;
}

export function buildDepartmentConvergencia(
  input: BuildDepartmentConvergenciaInput
): DepartmentConvergencia {
  const { departmentId, departmentName, managerId, safetyScore, patrones, externalSignals } =
    input;
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

  // Exit leadership.
  if (externalSignals.exitLead !== null) {
    signals.exit = {
      source: 'exit',
      value: externalSignals.exitLead,
      isRisk: externalSignals.exitLead < EXIT_LEADERSHIP_RISK,
      isCritical: false,
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
// Función pura: agregados cross-depto.
// ═══════════════════════════════════════════════════════════════════

export function buildGlobalConvergencia(
  departments: DepartmentConvergencia[]
): ConvergenciaGlobals {
  const byManager = new Map<string, string[]>();
  for (const d of departments) {
    if (!d.hasCriticalSafety || !d.managerId) continue;
    const arr = byManager.get(d.managerId) ?? [];
    arr.push(d.departmentId);
    byManager.set(d.managerId, arr);
  }
  const criticalByManager = Array.from(byManager.entries())
    .filter(([, ids]) => ids.length >= 2)
    .map(([managerId, departmentIds]) => ({ managerId, departmentIds }));

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

    departments.push(
      buildDepartmentConvergencia({
        departmentId: a.departmentId,
        departmentName: a.department.displayName,
        managerId: a.department.parentId,
        safetyScore: a.safetyScore,
        patrones,
        externalSignals: external,
      })
    );
  }

  const globals = buildGlobalConvergencia(departments);

  return {
    campaignId,
    accountId,
    departments,
    ...globals,
  };
}
