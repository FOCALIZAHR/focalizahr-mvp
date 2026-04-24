// src/lib/services/compliance/ConvergenciaEngine.ts
// Ambiente Sano - Cruce de señales entre 4 instrumentos por departamento.
//
// Degradación elegante (O4): si el account no tiene uno de los instrumentos
// (Exit, Onboarding, Pulso), el depto funciona con las señales que sí existan.
// El engine no falla; solo reporta qué fuentes están activas.
//
// Reglas del TASK_COMPLIANCE_AMBIENTE_SANO_IMPLEMENTATION (Fase 3):
//   Safety < 3.0 = riesgo | < 2.5 = crítico
//   Exit Liderazgo < 2.5 = riesgo
//   EXO Onboarding < 60 = riesgo | < 30 = crítico
//   Clima Pulso < 3.2 Y tendencia descendente = riesgo
//
// Nivel de convergencia por departamento:
//   - 1 señal bajo umbral → 'bajo' (monitoreo)
//   - 2 señales → 'medio' (alerta informativa)
//   - 3+ señales → 'convergente' (alerta 72h)
//   - Safety < 2.5 + cualquier otra → 'critico' (alerta 24h)
//
// Este engine NO escribe alertas. Devuelve el análisis; ComplianceAlertService
// decide qué persistir.

import { prisma } from '@/lib/prisma';
import type { ComplianceSource } from '@/config/complianceAlertConfig';
import type { PatronAnalysisOutput } from './complianceTypes';

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

  /** Pattern silencio_organizacional detectado por LLM (del ComplianceAnalysis). */
  silencioDetected: boolean;
  /** Deterioro sostenido del Clima Pulso en 3+ períodos. */
  deterioroPulso: boolean;
  /** Exits recientes con EXO bajo (señal ignorada). */
  senalIgnorada: boolean;
}

export interface ConvergenciaResult {
  campaignId: string;
  accountId: string;
  activeSourcesGlobal: ComplianceSource[];
  departments: DepartmentConvergencia[];
  /** Agrupa departamentos en Safety crítico por su manager común (para liderazgo_toxico). */
  criticalByManager: Array<{
    managerId: string;
    departmentIds: string[];
  }>;
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

export async function runConvergencia(
  campaignId: string,
  accountId: string
): Promise<ConvergenciaResult> {
  // Validar campaña Ambiente Sano
  const campaign = await prisma.campaign.findFirst({
    where: { id: campaignId, accountId },
    include: { campaignType: { select: { slug: true } } },
  });
  if (!campaign) throw new Error('Campaña no encontrada');
  if (campaign.campaignType.slug !== AMBIENTE_SANO_SLUG) {
    throw new Error(
      `ConvergenciaEngine solo aplica a "${AMBIENTE_SANO_SLUG}"`
    );
  }

  // 1. Safety Score y patrones LLM desde ComplianceAnalysis DEPARTMENT COMPLETED.
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

  const departmentIds = analyses
    .map((a) => a.departmentId)
    .filter((id): id is string => id !== null);

  // 2. Exit leadership: avgLeadership último DepartmentExitInsight por depto.
  const latestExitInsights = await prisma.departmentExitInsight.findMany({
    where: { accountId, departmentId: { in: departmentIds } },
    orderBy: { periodEnd: 'desc' },
  });
  const exitByDept = new Map<string, number | null>();
  for (const insight of latestExitInsights) {
    if (!exitByDept.has(insight.departmentId)) {
      exitByDept.set(insight.departmentId, insight.avgLeadership);
    }
  }

  // 3. Señal ignorada: ExitRecords recientes con EXO bajo en el depto.
  const recentCutoff = new Date();
  recentCutoff.setMonth(recentCutoff.getMonth() - 6);
  const recentExitsWithLowExo = await prisma.exitRecord.findMany({
    where: {
      accountId,
      departmentId: { in: departmentIds },
      exitDate: { gte: recentCutoff },
      hadOnboarding: true,
      onboardingEXOScore: { not: null, lt: EXO_RISK },
    },
    select: { departmentId: true },
  });
  const senalIgnoradaDepts = new Set(recentExitsWithLowExo.map((e) => e.departmentId));

  // 4. Pulso Express: últimos 3 CampaignResult del account.
  const pulsoCampaigns = await prisma.campaign.findMany({
    where: {
      accountId,
      campaignType: { slug: PULSO_EXPRESS_SLUG },
      status: 'completed',
      campaignResults: { isNot: null },
    },
    orderBy: { endDate: 'desc' },
    take: 3,
    include: { campaignResults: true },
  });

  // Extraer score de clima por depto y período.
  // `departmentScores` es JSON: { [departmentId]: scoreNumber }
  const pulsoHistoryByDept = new Map<string, number[]>();
  for (const pc of pulsoCampaigns) {
    const deptScores = (pc.campaignResults?.departmentScores ?? {}) as Record<
      string,
      unknown
    >;
    for (const deptId of departmentIds) {
      const raw = deptScores[deptId];
      const num = typeof raw === 'number' ? raw : null;
      if (num === null) continue;
      const arr = pulsoHistoryByDept.get(deptId) ?? [];
      arr.push(num);
      pulsoHistoryByDept.set(deptId, arr);
    }
  }

  // 5. Construir resultado por departamento.
  const departments: DepartmentConvergencia[] = analyses.map((a) => {
    if (!a.departmentId || !a.department) {
      throw new Error(`ComplianceAnalysis ${a.id} sin departmentId`);
    }
    const departmentId = a.departmentId;
    const departmentName = a.department.displayName;
    const managerId = a.department.parentId;

    const signals: Partial<Record<ComplianceSource, ConvergenciaSignal>> = {};

    // Safety (ambiente_sano) — siempre presente para deptos con análisis COMPLETED.
    const safety = a.safetyScore;
    if (safety !== null) {
      signals.ambiente_sano = {
        source: 'ambiente_sano',
        value: safety,
        isRisk: safety < SAFETY_RISK,
        isCritical: safety < SAFETY_CRITICAL,
      };
    }

    // Exit leadership (degradación: null si no hay DepartmentExitInsight).
    const exitLead = exitByDept.get(departmentId) ?? null;
    if (exitLead !== null) {
      signals.exit = {
        source: 'exit',
        value: exitLead,
        isRisk: exitLead < EXIT_LEADERSHIP_RISK,
        isCritical: false,
      };
    }

    // EXO (Department.accumulatedExoScore como proxy de EXO Day-30 agregado).
    const exo = a.department.accumulatedExoScore;
    if (exo !== null && exo !== undefined) {
      signals.onboarding = {
        source: 'onboarding',
        value: exo,
        isRisk: exo < EXO_RISK,
        isCritical: exo < EXO_CRITICAL,
      };
    }

    // Pulso clima + tendencia descendente.
    const hist = pulsoHistoryByDept.get(departmentId) ?? [];
    let deterioroPulso = false;
    if (hist.length >= 1) {
      const latest = hist[0];
      const trendingDown =
        hist.length >= 2 &&
        hist[0] < hist[1] &&
        (hist.length < 3 || hist[1] < hist[2]);
      deterioroPulso = hist.length >= 3 && hist[0] < hist[1] && hist[1] < hist[2];
      signals.pulso = {
        source: 'pulso',
        value: latest,
        isRisk: latest < PULSO_CLIMA_RISK && trendingDown,
        isCritical: false,
        note: trendingDown ? 'tendencia descendente' : undefined,
      };
    }

    // Silencio organizacional: pattern desde payload LLM.
    let silencioDetected = false;
    const payload = a.resultPayload as PatronAnalysisOutput | null;
    if (payload?.patrones) {
      silencioDetected = payload.patrones.some(
        (p) =>
          p.nombre === 'silencio_organizacional' &&
          p.intensidad >= SILENCE_PATTERN_INTENSITY
      );
    }

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
      senalIgnorada: senalIgnoradaDepts.has(departmentId),
    };
  });

  // 6. Agrupar críticos por manager (para liderazgo_toxico).
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

  // 7. Fuentes activas globales (union de todas las departamentales).
  const activeSourcesGlobal = Array.from(
    new Set(departments.flatMap((d) => d.activeSources))
  );

  return {
    campaignId,
    accountId,
    activeSourcesGlobal,
    departments,
    criticalByManager,
  };
}
