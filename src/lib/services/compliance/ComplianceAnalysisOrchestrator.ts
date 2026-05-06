// src/lib/services/compliance/ComplianceAnalysisOrchestrator.ts
// Orquesta el flujo async de análisis LLM de Ambiente Sano.
//
// - initializeJobs(): crea un ComplianceAnalysis PENDING por depto (n>=5) y 1 ORG.
// - processNextPending(): toma un DEPARTMENT pending, ejecuta LLM, guarda resultado.
// - processOrgMetaIfReady(): si todos los DEPARTMENT están COMPLETED, ejecuta meta.
// - processBatch(): loop que drena PENDING hasta timeout o cola vacía.
//
// Lo usan el endpoint POST /api/compliance/analizar-patrones y el CRON.

import { prisma } from '@/lib/prisma';
import {
  calculateSafetyScoreForDepartment,
  calculateSafetyScores,
} from '@/lib/services/SafetyScoreService';
import { analyzeDepartmentPatterns } from './PatronesLLMService';
import { analyzeOrgMetaPatterns } from './MetaAnalisisLLMService';
import { detectTeatroCumplimiento } from './detectTeatroCumplimiento';
import {
  buildDepartmentConvergencia,
  buildGlobalConvergencia,
  loadDepartmentExternalSignals,
  detectCasosMotorA,
  applyA4ToDepartments,
} from './ConvergenciaEngine';
import type { DepartmentConvergencia } from './ConvergenciaEngine';
import {
  createAlertsFromConvergencia,
  type DeptAlertContext,
} from './ComplianceAlertService';
import { buildReportNarratives } from './ComplianceNarrativeEngine';
import { calculateISA } from './ISAService';
import type {
  MetaAnalysisDepartmentInput,
  PatronAnalysisOutput,
  ConfianzaAnalisis,
  MetaAnalysisOutput,
} from './complianceTypes';
import type { DepartmentSafetyScore } from '@/lib/services/SafetyScoreService';
import type { ComplianceAlertType } from '@/config/complianceAlertConfig';

// Shape del ComplianceAnalysis.resultPayload por scope (namespaces explícitos).
interface DepartmentResultPayload {
  patrones: PatronAnalysisOutput;
  safetyDetail: DepartmentSafetyScore;
  convergencia: DepartmentConvergencia;
  isa: number; // ISA del depto (0-100)
  textCount?: number; // Respuestas P1 válidas que entraron al LLM (post-trim).
  /**
   * Nombre del departamento padre (gerencia) al momento del cierre del job.
   * Optional para backward-compat: payloads pre-deploy de este campo no lo
   * tienen y `extractDeptParentName` cae a `null`.
   */
  parentDepartmentName?: string | null;
}

const AMBIENTE_SANO_SLUG = 'pulso-ambientes-sanos';
const PRIVACY_THRESHOLD = 5;
const P1_QUESTION_ORDER = 1;
const MAX_RETRIES = 3;

export interface InitializeResult {
  campaignId: string;
  departmentJobs: number;
  orgJob: boolean;
  skippedDepartments: number;
  alreadyInitialized: boolean;
}

/**
 * Crea los rows ComplianceAnalysis PENDING. Idempotente: si ya existen, no duplica.
 * Requiere que la campaña sea del tipo pulso-ambientes-sanos.
 */
export async function initializeComplianceJobs(
  campaignId: string,
  accountId: string
): Promise<InitializeResult> {
  const campaign = await prisma.campaign.findFirst({
    where: { id: campaignId, accountId },
    include: { campaignType: { select: { slug: true } } },
  });

  if (!campaign) throw new Error('Campaña no encontrada');
  if (campaign.campaignType.slug !== AMBIENTE_SANO_SLUG) {
    throw new Error(
      `ComplianceAnalysisOrchestrator solo aplica a "${AMBIENTE_SANO_SLUG}"`
    );
  }

  const existing = await prisma.complianceAnalysis.count({
    where: { campaignId },
  });
  if (existing > 0) {
    return {
      campaignId,
      departmentJobs: 0,
      orgJob: false,
      skippedDepartments: 0,
      alreadyInitialized: true,
    };
  }

  const scores = await calculateSafetyScores(campaignId, accountId);

  let departmentJobs = 0;
  for (const dept of scores.departments) {
    await prisma.complianceAnalysis.create({
      data: {
        campaignId,
        accountId,
        scope: 'DEPARTMENT',
        departmentId: dept.departmentId,
        status: 'PENDING',
        respondentCount: dept.respondentCount,
        safetyScore: dept.safetyScore,
      },
    });
    departmentJobs++;
  }

  await prisma.complianceAnalysis.create({
    data: {
      campaignId,
      accountId,
      scope: 'ORG',
      departmentId: null,
      status: 'PENDING',
      safetyScore: scores.orgScore,
    },
  });

  return {
    campaignId,
    departmentJobs,
    orgJob: true,
    skippedDepartments: scores.skipped.length,
    alreadyInitialized: false,
  };
}

/**
 * Procesa UN DEPARTMENT pending con llamada al LLM.
 * Retorna true si procesó uno, false si no hay DEPARTMENT pending.
 */
export async function processNextDepartmentJob(campaignId: string): Promise<boolean> {
  const job = await prisma.complianceAnalysis.findFirst({
    where: {
      campaignId,
      scope: 'DEPARTMENT',
      status: 'PENDING',
      retryCount: { lt: MAX_RETRIES },
    },
    orderBy: { createdAt: 'asc' },
  });

  if (!job || !job.departmentId) return false;

  await prisma.complianceAnalysis.update({
    where: { id: job.id },
    data: { status: 'RUNNING', startedAt: new Date() },
  });

  try {
    const department = await prisma.department.findUnique({
      where: { id: job.departmentId },
      select: { displayName: true },
    });

    const respuestas = await prisma.response.findMany({
      where: {
        question: { questionOrder: P1_QUESTION_ORDER },
        participant: { campaignId, departmentId: job.departmentId },
        textResponse: { not: null },
      },
      select: { textResponse: true },
    });

    const textos = respuestas
      .map((r) => r.textResponse)
      .filter((t): t is string => !!t && t.trim().length > 0);

    if (textos.length < PRIVACY_THRESHOLD) {
      await prisma.complianceAnalysis.update({
        where: { id: job.id },
        data: {
          status: 'FAILED',
          completedAt: new Date(),
          errorMessage: `Respuestas P1 por debajo del privacy threshold (${textos.length}<${PRIVACY_THRESHOLD})`,
        },
      });
      return true;
    }

    const llmResult = await analyzeDepartmentPatterns({
      departmentName: department?.displayName ?? 'Sin nombre',
      respondentCount: job.respondentCount ?? textos.length,
      respuestas: textos,
    });

    if (!llmResult.success) {
      const exhausted = job.retryCount + 1 >= MAX_RETRIES;
      await prisma.complianceAnalysis.update({
        where: { id: job.id },
        data: {
          status: exhausted ? 'FAILED' : 'PENDING',
          errorMessage: llmResult.error,
          retryCount: { increment: 1 },
          startedAt: null,
          completedAt: exhausted ? new Date() : null,
        },
      });
      return true;
    }

    const teatro = detectTeatroCumplimiento(job.safetyScore ?? 0, llmResult.data.patrones);

    // Calcular safetyDetail + convergencia para este depto.
    // Ambos se persisten junto al output del LLM en resultPayload namespaced.
    const safetyDetail = await calculateSafetyScoreForDepartment(
      campaignId,
      job.departmentId,
      job.accountId
    );
    if (!safetyDetail) {
      // Si quedó bajo threshold entre init y este momento (raro), marcamos FAILED.
      await prisma.complianceAnalysis.update({
        where: { id: job.id },
        data: {
          status: 'FAILED',
          completedAt: new Date(),
          errorMessage: 'SafetyScore bajo privacy threshold al cerrar el depto',
        },
      });
      return true;
    }

    const deptInfo = await prisma.department.findUnique({
      where: { id: job.departmentId },
      select: {
        id: true,
        displayName: true,
        parentId: true,
        accumulatedExoScore: true,
        parent: { select: { displayName: true } },
      },
    });

    const externalSignals = await loadDepartmentExternalSignals(
      job.departmentId,
      job.accountId,
      deptInfo?.accumulatedExoScore ?? null
    );

    // Primer pass: convergencia legacy + Motor A skipped (isaScore=null).
    // El ISA se computa abajo y necesita riskSignalsCount/activeSources del pass.
    // Después se recalcula Motor A con el ISA real.
    const convergenciaPreISA = buildDepartmentConvergencia({
      departmentId: job.departmentId,
      departmentName: deptInfo?.displayName ?? 'Sin nombre',
      managerId: deptInfo?.parentId ?? null,
      safetyScore: safetyDetail.safetyScore,
      patrones: llmResult.data.patrones,
      externalSignals,
      isaScore: null,
      dimensionScores: safetyDetail.dimensionScores,
      patronesOutput: llmResult.data,
      teatroCumplimiento: teatro,
    });

    // ISA — cálculo final que integra los 3 componentes (voz estructurada,
    // voz libre LLM, convergencia). Ver ISAService.ts para fórmula completa.
    const isaScore = calculateISA({
      safetyScore: safetyDetail.safetyScore,
      patrones: llmResult.data.patrones,
      confianzaLLM: llmResult.data.confianza_analisis,
      convergenciaSignals: convergenciaPreISA.riskSignalsCount,
      activeSources: convergenciaPreISA.activeSources.length,
      teatroCumplimiento: teatro,
    });

    // Motor A v2 — recalcular casos A1, A2, A3, A5 con ISA real. A4 (cross-dept)
    // se patchea cuando todos los DEPARTMENT jobs cierran (processOrgMetaIfReady).
    const convergencia: typeof convergenciaPreISA = {
      ...convergenciaPreISA,
      convergenciaInterna: detectCasosMotorA(
        isaScore,
        safetyDetail.dimensionScores,
        llmResult.data,
        teatro
      ),
    };

    const payload: DepartmentResultPayload = {
      patrones: llmResult.data,
      safetyDetail,
      convergencia,
      isa: isaScore,
      textCount: textos.length,
      parentDepartmentName: deptInfo?.parent?.displayName ?? null,
    };

    // ISA del ciclo anterior del MISMO depto — snapshot al cerrar.
    // Reemplaza el lookup runtime en /report (route.ts:166-189).
    const previousIsa = await loadPreviousDeptIsaScore(
      job.departmentId,
      job.accountId,
      campaignId
    );

    await prisma.complianceAnalysis.update({
      where: { id: job.id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        errorMessage: null,
        senalDominante: llmResult.data.senal_dominante,
        confianzaAnalisis: llmResult.data.confianza_analisis,
        alertaSesgoGenero: llmResult.data.alerta_sesgo_genero,
        teatroCumplimiento: teatro,
        isaScore,
        previousIsaScore: previousIsa,
        resultPayload: payload as unknown as object,
      },
    });

    return true;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await prisma.complianceAnalysis.update({
      where: { id: job.id },
      data: {
        status: job.retryCount + 1 >= MAX_RETRIES ? 'FAILED' : 'PENDING',
        errorMessage: msg,
        retryCount: { increment: 1 },
        startedAt: null,
        completedAt: job.retryCount + 1 >= MAX_RETRIES ? new Date() : null,
      },
    });
    return true;
  }
}

/**
 * Si todos los DEPARTMENT están COMPLETED o FAILED, ejecuta el meta-análisis
 * ORG pending. Retorna true si procesó el ORG, false si aún faltan DEPARTMENTs
 * o si el ORG ya no está PENDING.
 */
export async function processOrgMetaIfReady(campaignId: string): Promise<boolean> {
  const orgJob = await prisma.complianceAnalysis.findFirst({
    where: {
      campaignId,
      scope: 'ORG',
      status: 'PENDING',
      retryCount: { lt: MAX_RETRIES },
    },
  });
  if (!orgJob) return false;

  // Excluir jobs que agotaron retries pero siguen en PENDING por bugs viejos.
  // Alineado con el filtro de processNextDepartmentJob para evitar deadlock.
  const pendingDeptCount = await prisma.complianceAnalysis.count({
    where: {
      campaignId,
      scope: 'DEPARTMENT',
      status: { in: ['PENDING', 'RUNNING'] },
      retryCount: { lt: MAX_RETRIES },
    },
  });
  if (pendingDeptCount > 0) return false;

  const completedDepts = await prisma.complianceAnalysis.findMany({
    where: {
      campaignId,
      scope: 'DEPARTMENT',
      status: 'COMPLETED',
    },
    include: { department: { select: { displayName: true } } },
  });

  await prisma.complianceAnalysis.update({
    where: { id: orgJob.id },
    data: { status: 'RUNNING', startedAt: new Date() },
  });

  try {
    const deptInputs: MetaAnalysisDepartmentInput[] = completedDepts
      .filter((d) => d.resultPayload !== null)
      .map((d) => {
        const patrones = extractDeptPatrones(d.resultPayload);
        return {
          departmentName: d.department?.displayName ?? 'Sin nombre',
          respondentCount: d.respondentCount ?? 0,
          safetyScore: d.safetyScore ?? 0,
          senalDominante: d.senalDominante ?? patrones?.senal_dominante ?? '',
          confianza: (d.confianzaAnalisis as ConfianzaAnalisis) ??
            patrones?.confianza_analisis ?? 'baja',
          patrones: patrones?.patrones ?? [],
          teatroCumplimiento: d.teatroCumplimiento ?? false,
        };
      });

    if (deptInputs.length === 0) {
      await prisma.complianceAnalysis.update({
        where: { id: orgJob.id },
        data: {
          status: 'FAILED',
          completedAt: new Date(),
          errorMessage: 'No hay departamentos COMPLETED para meta-análisis',
        },
      });
      return true;
    }

    const llmResult = await analyzeOrgMetaPatterns({
      orgSafetyScore: orgJob.safetyScore,
      departments: deptInputs,
    });

    if (!llmResult.success) {
      const exhausted = orgJob.retryCount + 1 >= MAX_RETRIES;
      await prisma.complianceAnalysis.update({
        where: { id: orgJob.id },
        data: {
          status: exhausted ? 'FAILED' : 'PENDING',
          errorMessage: llmResult.error,
          retryCount: { increment: 1 },
          startedAt: null,
          completedAt: exhausted ? new Date() : null,
        },
      });
      return true;
    }

    // Construir el ORG resultPayload namespaced.
    // Requiere: (a) meta LLM output; (b) convergencias por depto ya persistidas;
    // (c) globals (criticalByManager + activeSourcesGlobal); (d) snapshot global
    // (orgSafetyScore, skippedByPrivacy, previous); (e) narrativas.
    const deptConvergencias: DepartmentConvergencia[] = completedDepts
      .map((d) => {
        const c = extractDeptConvergencia(d.resultPayload);
        return c;
      })
      .filter((c): c is DepartmentConvergencia => c !== null);

    // Motor A v2 — para A4 cross-dept, buildGlobalConvergencia agrupa por
    // managerId con delta ISA. Construir el lookup id → isaScore desde los rows.
    const isaByDeptId = new Map<string, number>();
    for (const d of completedDepts) {
      if (d.departmentId && d.isaScore !== null) {
        isaByDeptId.set(d.departmentId, d.isaScore);
      }
    }

    const globals = buildGlobalConvergencia(deptConvergencias, isaByDeptId);

    // Patch A4 cross-dept: setea enCriticalByManagerGroup + 'A4' en convergenciaInterna
    // para deptos que entraron a un grupo de delta ISA >= 30.
    const deptConvergenciasConA4 = applyA4ToDepartments(
      deptConvergencias,
      globals.criticalByManager
    );

    // Agregados globales + delta previa.
    const { orgSafetyScore, skippedByPrivacy } = await computeOrgAggregates(
      campaignId,
      orgJob.accountId
    );
    const { previousOrgScore, previousCampaignLabel } = await loadPreviousOrgScore(
      campaignId,
      orgJob.accountId
    );

    // Construir contextos extendidos per-dept para el alert service v2.
    // Spec sec 4 — el service necesita dimensionScores, patronesOutput,
    // ISAs y origenVertical para evaluar las condiciones de cada alerta.
    // El spec usa "vertical" como abreviación; el tipo OrigenOrganizacional
    // del LLM define 'vertical_descendente'.
    const origenVertical =
      llmResult.data.origen_organizacional === 'vertical_descendente';

    // Alertas resolved/dismissed del ciclo anterior por dept (para senal_ignorada Fase 1).
    const previousCampaign = await prisma.campaign.findFirst({
      where: {
        accountId: orgJob.accountId,
        id: { not: campaignId },
        status: 'completed',
        campaignType: { slug: 'pulso-ambientes-sanos' },
      },
      orderBy: { endDate: 'desc' },
      select: { id: true },
    });

    const closedCountByDept = new Map<string, number>();
    if (previousCampaign) {
      const closedAlerts = await prisma.complianceAlert.findMany({
        where: {
          campaignId: previousCampaign.id,
          status: { in: ['resolved', 'dismissed'] },
        },
        select: { departmentId: true },
      });
      for (const a of closedAlerts) {
        if (!a.departmentId) continue;
        closedCountByDept.set(
          a.departmentId,
          (closedCountByDept.get(a.departmentId) ?? 0) + 1
        );
      }
    }

    const deptContexts = new Map<string, DeptAlertContext>();
    for (const d of completedDepts) {
      if (!d.departmentId) continue;
      const safetyDetail = extractDeptSafetyDetail(d.resultPayload);
      const patronesOutput = extractDeptPatrones(d.resultPayload);
      deptContexts.set(d.departmentId, {
        isaScore: d.isaScore,
        previousIsaScore: d.previousIsaScore,
        dimensionScores: safetyDetail?.dimensionScores ?? {
          P2_seguridad: null,
          P3_disenso: null,
          P4_microagresiones: null,
          P5_equidad: null,
          P7_liderazgo: null,
          P8_agotamiento: null,
        },
        patronesOutput,
        origenVertical,
        previousCycleAlertsClosed: closedCountByDept.get(d.departmentId) ?? 0,
      });
    }

    // Alerts actuales (antes de que se generen las nuevas por Convergencia).
    // Las narrativas necesitan la lista de alertas; las crearemos luego por
    // ConvergenciaAlertService — para las narrativas usamos un snapshot preliminar
    // de alertas ya existentes + las que se van a crear post-meta.
    // Decisión pragmática: crear alertas PRIMERO (idempotente), luego leer y
    // construir narrativas. Orden: alerts → narratives → save ORG.
    try {
      await createAlertsFromConvergencia(
        orgJob.accountId,
        {
          campaignId,
          accountId: orgJob.accountId,
          departments: deptConvergenciasConA4,
          ...globals,
        },
        deptContexts
      );
    } catch (convergErr) {
      console.error(
        '[ComplianceOrchestrator] Creación de alertas post-meta falló:',
        convergErr instanceof Error ? convergErr.message : convergErr
      );
    }

    const freshAlerts = await prisma.complianceAlert.findMany({
      where: { campaignId },
      include: { department: { select: { displayName: true } } },
    });

    const deptAnalysesForNarratives = completedDepts.map((d) => ({
      departmentName: d.department?.displayName ?? 'Sin nombre',
      parentDepartmentName: extractDeptParentName(d.resultPayload),
      payload: extractDeptPatrones(d.resultPayload),
      teatroCumplimiento: !!d.teatroCumplimiento,
    }));

    const safetyScoresForNarratives: DepartmentSafetyScore[] = completedDepts
      .map((d) => extractDeptSafetyDetail(d.resultPayload))
      .filter((s): s is DepartmentSafetyScore => s !== null);

    const narratives = buildReportNarratives({
      orgSafetyScore,
      scores: safetyScoresForNarratives,
      departmentAnalyses: deptAnalysesForNarratives,
      meta: llmResult.data,
      convergencias: deptConvergencias,
      activeSourcesGlobal: globals.activeSourcesGlobal,
      criticalByManager: globals.criticalByManager,
      alertas: freshAlerts.map((a) => ({
        alertType: a.alertType as ComplianceAlertType,
        title: a.title,
        departmentName: a.department?.displayName ?? null,
        severity: a.severity,
        signalsCount: a.signalsCount,
        teatroCumplimiento:
          completedDepts.find((d) => d.departmentId === a.departmentId)
            ?.teatroCumplimiento ?? false,
      })),
      previousOrgScore,
      previousCampaignLabel,
    });

    // orgISA: promedio ponderado de isaScore por depto (ponderado por
    // respondentCount). Sobre los DEPTs ya COMPLETED con resultPayload
    // namespaced que incluye .isa. Si ningún depto tiene ISA, quedará null.
    let orgISA: number | null = null;
    {
      let totalWeight = 0;
      let weightedSum = 0;
      for (const d of completedDepts) {
        const payload = d.resultPayload as Record<string, unknown> | null;
        const isa = payload && typeof payload.isa === 'number' ? (payload.isa as number) : null;
        const weight = d.respondentCount ?? 0;
        if (isa !== null && weight > 0) {
          weightedSum += isa * weight;
          totalWeight += weight;
        }
      }
      if (totalWeight > 0) orgISA = Math.round(weightedSum / totalWeight);
    }

    // Sumas org-level: text responses (denominador "voz libre") + respondents
    // (denominador safety, mismo que orgSafetyScore). Lectura defensiva: depts
    // persistidos antes del deploy de textCount cuentan 0.
    let totalTextResponses = 0;
    let totalRespondents = 0;
    for (const d of completedDepts) {
      const payload = d.resultPayload as Record<string, unknown> | null;
      const tc = payload && typeof payload.textCount === 'number' ? payload.textCount : 0;
      totalTextResponses += tc;

      const safetyDetail = extractDeptSafetyDetail(d.resultPayload);
      totalRespondents += safetyDetail?.respondentCount ?? 0;
    }

    const orgPayload = {
      meta: llmResult.data,
      global: {
        orgSafetyScore,
        orgISA,
        skippedByPrivacy,
        activeSourcesGlobal: globals.activeSourcesGlobal,
        criticalByManager: globals.criticalByManager,
        previousOrgScore,
        previousCampaignLabel,
        totalTextResponses,
        totalRespondents,
      },
      narratives,
    };

    await prisma.complianceAnalysis.update({
      where: { id: orgJob.id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        errorMessage: null,
        senalDominante: llmResult.data.patron_cultural_dominante,
        isaScore: orgISA,
        resultPayload: orgPayload as unknown as object,
      },
    });

    return true;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await prisma.complianceAnalysis.update({
      where: { id: orgJob.id },
      data: {
        status: orgJob.retryCount + 1 >= MAX_RETRIES ? 'FAILED' : 'PENDING',
        errorMessage: msg,
        retryCount: { increment: 1 },
        startedAt: null,
        completedAt: orgJob.retryCount + 1 >= MAX_RETRIES ? new Date() : null,
      },
    });
    return true;
  }
}

/**
 * Drena pendientes hasta `deadline` (timestamp ms) o cola vacía.
 * Procesa DEPARTMENT jobs primero, luego el ORG cuando ya no hay pendientes.
 */
export async function processBatch(
  campaignId: string,
  deadlineMs: number
): Promise<{ processed: number }> {
  let processed = 0;

  while (Date.now() < deadlineMs) {
    const didDept = await processNextDepartmentJob(campaignId);
    if (didDept) {
      processed++;
      continue;
    }

    const didOrg = await processOrgMetaIfReady(campaignId);
    if (didOrg) {
      processed++;
      continue;
    }

    break;
  }

  return { processed };
}

// ═══════════════════════════════════════════════════════════════════
// Helpers internos: extraen subpayloads con back-compat a estructura
// plana (pre-namespaces) para soportar campañas ya ejecutadas.
// ═══════════════════════════════════════════════════════════════════

function isNamespacedDept(payload: unknown): payload is { patrones: PatronAnalysisOutput; safetyDetail: DepartmentSafetyScore; convergencia: DepartmentConvergencia } {
  return (
    !!payload &&
    typeof payload === 'object' &&
    'safetyDetail' in payload
  );
}

function extractDeptPatrones(payload: unknown): PatronAnalysisOutput | null {
  if (!payload || typeof payload !== 'object') return null;
  if (isNamespacedDept(payload)) return payload.patrones ?? null;
  return payload as PatronAnalysisOutput;
}

function extractDeptSafetyDetail(payload: unknown): DepartmentSafetyScore | null {
  if (isNamespacedDept(payload)) return payload.safetyDetail;
  return null;
}

function extractDeptConvergencia(payload: unknown): DepartmentConvergencia | null {
  if (isNamespacedDept(payload)) return payload.convergencia;
  return null;
}

/**
 * Lee `parentDepartmentName` defensivamente. Payloads legacy (pre-deploy del
 * campo) no lo traen → null. Frontend cae al render sin gerencia.
 */
function extractDeptParentName(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') return null;
  const obj = payload as Record<string, unknown>;
  const value = obj.parentDepartmentName;
  return typeof value === 'string' ? value : null;
}

// Calcula orgSafetyScore y skippedByPrivacy agregando los DEPARTMENT rows
// COMPLETED con safetyDetail + rows que habrían quedado bajo threshold.
// Para conocer los deptos skipped (que NO tienen ComplianceAnalysis row),
// consultamos calculateSafetyScores del campaign (costo asumido en el
// cierre una sola vez).
async function computeOrgAggregates(
  campaignId: string,
  accountId: string
): Promise<{
  orgSafetyScore: number | null;
  skippedByPrivacy: Array<{ departmentId: string; departmentName: string; respondentCount: number; reason: 'privacy_threshold_not_met' }>;
}> {
  const safety = await calculateSafetyScores(campaignId, accountId);
  return {
    orgSafetyScore: safety.orgScore,
    skippedByPrivacy: safety.skipped,
  };
}

async function loadPreviousOrgScore(
  campaignId: string,
  accountId: string
): Promise<{ previousOrgScore: number | null; previousCampaignLabel: string | null }> {
  const currentCampaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    select: { endDate: true },
  });
  if (!currentCampaign) {
    return { previousOrgScore: null, previousCampaignLabel: null };
  }
  const previousCampaign = await prisma.campaign.findFirst({
    where: {
      accountId,
      id: { not: campaignId },
      status: 'completed',
      campaignType: { slug: 'pulso-ambientes-sanos' },
      endDate: { lt: currentCampaign.endDate },
    },
    orderBy: { endDate: 'desc' },
    select: { id: true, endDate: true },
  });
  if (!previousCampaign) {
    return { previousOrgScore: null, previousCampaignLabel: null };
  }
  const prevOrg = await prisma.complianceAnalysis.findFirst({
    where: {
      campaignId: previousCampaign.id,
      scope: 'ORG',
      status: 'COMPLETED',
    },
    select: { safetyScore: true },
  });
  const d = new Date(previousCampaign.endDate);
  const sem = d.getMonth() + 1 <= 6 ? 1 : 2;
  return {
    previousOrgScore: prevOrg?.safetyScore ?? null,
    previousCampaignLabel: `Semestre ${sem} ${d.getFullYear()}`,
  };
}

/**
 * ISA del ciclo anterior del MISMO departamento. Mismo patrón que
 * loadPreviousOrgScore() pero a nivel depto.
 *
 * Persiste como snapshot en ComplianceAnalysis.previousIsaScore al cerrar
 * el row DEPARTMENT — reemplaza el lookup runtime en /report (route.ts).
 *
 * Estrategia:
 *   1. Resolver endDate del ciclo actual.
 *   2. Buscar el ComplianceAnalysis DEPARTMENT más reciente del MISMO
 *      (accountId, departmentId) en una campaña Ambiente Sano cerrada con
 *      endDate < ciclo actual.
 *   3. Retornar su isaScore (o null si no hay historial).
 */
async function loadPreviousDeptIsaScore(
  departmentId: string,
  accountId: string,
  currentCampaignId: string
): Promise<number | null> {
  const currentCampaign = await prisma.campaign.findUnique({
    where: { id: currentCampaignId },
    select: { endDate: true },
  });
  if (!currentCampaign) return null;

  const previous = await prisma.complianceAnalysis.findFirst({
    where: {
      accountId,
      departmentId,
      scope: 'DEPARTMENT',
      status: 'COMPLETED',
      campaign: {
        status: 'completed',
        endDate: { lt: currentCampaign.endDate },
        campaignType: { slug: 'pulso-ambientes-sanos' },
      },
    },
    orderBy: { campaign: { endDate: 'desc' } },
    select: { isaScore: true },
  });

  return previous?.isaScore ?? null;
}
