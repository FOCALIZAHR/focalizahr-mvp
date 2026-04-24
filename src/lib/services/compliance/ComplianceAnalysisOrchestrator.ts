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
import { calculateSafetyScores } from '@/lib/services/SafetyScoreService';
import { analyzeDepartmentPatterns } from './PatronesLLMService';
import { analyzeOrgMetaPatterns } from './MetaAnalisisLLMService';
import { detectTeatroCumplimiento } from './detectTeatroCumplimiento';
import { runConvergencia } from './ConvergenciaEngine';
import { createAlertsFromConvergencia } from './ComplianceAlertService';
import type {
  MetaAnalysisDepartmentInput,
  PatronAnalysisOutput,
  ConfianzaAnalisis,
} from './complianceTypes';

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
        resultPayload: llmResult.data as unknown as object,
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
        const payload = d.resultPayload as unknown as PatronAnalysisOutput;
        return {
          departmentName: d.department?.displayName ?? 'Sin nombre',
          respondentCount: d.respondentCount ?? 0,
          safetyScore: d.safetyScore ?? 0,
          senalDominante: d.senalDominante ?? payload.senal_dominante,
          confianza: (d.confianzaAnalisis as ConfianzaAnalisis) ?? payload.confianza_analisis,
          patrones: payload.patrones ?? [],
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

    await prisma.complianceAnalysis.update({
      where: { id: orgJob.id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        errorMessage: null,
        senalDominante: llmResult.data.patron_cultural_dominante,
        resultPayload: llmResult.data as unknown as object,
      },
    });

    // Auto-trigger: Convergencia + Alertas. No bloquea; si falla se loguea y el
    // ORG queda COMPLETED de todos modos (el usuario puede re-disparar manual).
    try {
      const convergencia = await runConvergencia(campaignId, orgJob.accountId);
      await createAlertsFromConvergencia(orgJob.accountId, convergencia);
    } catch (convergErr) {
      console.error(
        '[ComplianceOrchestrator] Convergencia post-meta falló:',
        convergErr instanceof Error ? convergErr.message : convergErr
      );
    }

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
