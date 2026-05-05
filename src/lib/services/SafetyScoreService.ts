// src/lib/services/SafetyScoreService.ts
// Ambiente Sano - Cálculo de Safety Score ponderado por departamento.
//
// Lee Response.normalizedScore (persistente, calculado al submit vía calculateNormalizedScore).
// NO duplica lógica de mapeo: el binario 5/1 de P2/P3/P5 vive en Question.responseValueMapping
// (ver prisma/seed-ambientes-sanos.ts).
//
// Privacy: departamentos con n < 5 respondentes no se calculan (van a `skipped`).
// Fórmula D4 del TASK_COMPLIANCE_AMBIENTE_SANO_IMPLEMENTATION.md.

import { prisma } from '@/lib/prisma';
import { Gender } from '@prisma/client';

const AMBIENTE_SANO_SLUG = 'pulso-ambientes-sanos';

const SAFETY_SCORE_WEIGHTS: Record<number, number> = {
  2: 0.25, // seguridad psicológica
  3: 0.2, // liderazgo/disenso
  4: 0.15, // microagresiones (inversa)
  5: 0.15, // equidad
  7: 0.2, // liderazgo/calidad
  8: 0.05, // agotamiento relacional (inversa)
};

const INVERSE_QUESTIONS = new Set([4, 8]);
const SAFETY_QUESTION_ORDERS = [2, 3, 4, 5, 7, 8];
const PRIVACY_THRESHOLD = 5;
const RISK_THRESHOLD = 3.0;
const CRITICAL_THRESHOLD = 2.5;

export type RiskLevel = 'safe' | 'risk' | 'critical';

export interface DepartmentSafetyScore {
  departmentId: string;
  departmentName: string;
  safetyScore: number;
  riskLevel: RiskLevel;
  respondentCount: number;
  dimensionScores: {
    P2_seguridad: number | null;
    P3_disenso: number | null;
    P4_microagresiones: number | null;
    P5_equidad: number | null;
    P7_liderazgo: number | null;
    P8_agotamiento: number | null;
  };
  genderBreakdown?: {
    male: { score: number; count: number } | null;
    female: { score: number; count: number } | null;
  };
}

export interface SafetyScoreSkip {
  departmentId: string;
  departmentName: string;
  respondentCount: number;
  reason: 'privacy_threshold_not_met';
}

export interface SafetyScoreResult {
  orgScore: number | null;
  departments: DepartmentSafetyScore[];
  skipped: SafetyScoreSkip[];
}

interface ResponseRow {
  normalizedScore: number;
  questionOrder: number;
  participantId: string;
  departmentId: string | null;
  gender: Gender | null;
}

function classifyRisk(score: number): RiskLevel {
  if (score < CRITICAL_THRESHOLD) return 'critical';
  if (score < RISK_THRESHOLD) return 'risk';
  return 'safe';
}

function averageByQuestion(rows: ResponseRow[]): Map<number, number> {
  const sums = new Map<number, { sum: number; count: number }>();
  for (const r of rows) {
    const bucket = sums.get(r.questionOrder) ?? { sum: 0, count: 0 };
    bucket.sum += r.normalizedScore;
    bucket.count += 1;
    sums.set(r.questionOrder, bucket);
  }
  const averages = new Map<number, number>();
  for (const [order, { sum, count }] of sums) {
    if (count === 0) continue;
    const avg = sum / count;
    averages.set(order, INVERSE_QUESTIONS.has(order) ? 6 - avg : avg);
  }
  return averages;
}

function computeWeightedScore(averages: Map<number, number>): number | null {
  let totalWeight = 0;
  let weightedSum = 0;
  for (const [order, weight] of Object.entries(SAFETY_SCORE_WEIGHTS)) {
    const avg = averages.get(Number(order));
    if (avg === undefined) continue;
    weightedSum += avg * weight;
    totalWeight += weight;
  }
  if (totalWeight === 0) return null;
  return weightedSum / totalWeight;
}

function buildDimensionScores(
  averages: Map<number, number>
): DepartmentSafetyScore['dimensionScores'] {
  return {
    P2_seguridad: averages.get(2) ?? null,
    P3_disenso: averages.get(3) ?? null,
    P4_microagresiones: averages.get(4) ?? null,
    P5_equidad: averages.get(5) ?? null,
    P7_liderazgo: averages.get(7) ?? null,
    P8_agotamiento: averages.get(8) ?? null,
  };
}

function buildGenderBreakdown(
  rows: ResponseRow[]
): DepartmentSafetyScore['genderBreakdown'] | undefined {
  const byGender: Record<'MALE' | 'FEMALE', ResponseRow[]> = { MALE: [], FEMALE: [] };
  for (const r of rows) {
    if (r.gender === 'MALE' || r.gender === 'FEMALE') {
      byGender[r.gender].push(r);
    }
  }

  const build = (group: ResponseRow[]) => {
    const uniqueParticipants = new Set(group.map((r) => r.participantId));
    if (uniqueParticipants.size < PRIVACY_THRESHOLD) return null;
    const averages = averageByQuestion(group);
    const score = computeWeightedScore(averages);
    if (score === null) return null;
    return { score, count: uniqueParticipants.size };
  };

  const male = build(byGender.MALE);
  const female = build(byGender.FEMALE);

  if (!male && !female) return undefined;
  return { male, female };
}

// Helper interno: dado un bucket de responses filtradas, arma el
// DepartmentSafetyScore (o retorna null si bajo threshold).
function scoreFromRows(
  departmentId: string,
  departmentName: string,
  deptRows: ResponseRow[]
): DepartmentSafetyScore | { skip: true; respondentCount: number } {
  const respondentCount = new Set(deptRows.map((r) => r.participantId)).size;
  if (respondentCount < PRIVACY_THRESHOLD) {
    return { skip: true, respondentCount };
  }
  const averages = averageByQuestion(deptRows);
  const safetyScore = computeWeightedScore(averages);
  if (safetyScore === null) {
    return { skip: true, respondentCount };
  }
  return {
    departmentId,
    departmentName,
    safetyScore,
    riskLevel: classifyRisk(safetyScore),
    respondentCount,
    dimensionScores: buildDimensionScores(averages),
    genderBreakdown: buildGenderBreakdown(deptRows),
  };
}

/**
 * Calcula el DepartmentSafetyScore de UN solo departamento.
 * Retorna null si el depto está bajo el privacy threshold o no tiene respuestas.
 * Usado por el Orchestrator al cerrar un DEPARTMENT job.
 */
export async function calculateSafetyScoreForDepartment(
  campaignId: string,
  departmentId: string,
  accountId: string
): Promise<DepartmentSafetyScore | null> {
  const campaign = await prisma.campaign.findFirst({
    where: { id: campaignId, accountId },
    include: { campaignType: { select: { slug: true } } },
  });
  if (!campaign) throw new Error('Campaña no encontrada');
  if (campaign.campaignType.slug !== AMBIENTE_SANO_SLUG) {
    throw new Error(`SafetyScoreService solo aplica a campañas "${AMBIENTE_SANO_SLUG}"`);
  }

  const department = await prisma.department.findFirst({
    where: { id: departmentId, accountId },
    select: { id: true, displayName: true },
  });
  if (!department) return null;

  const responses = await prisma.response.findMany({
    where: {
      normalizedScore: { not: null },
      participant: { campaignId, departmentId },
      question: { questionOrder: { in: SAFETY_QUESTION_ORDERS } },
    },
    select: {
      normalizedScore: true,
      participantId: true,
      question: { select: { questionOrder: true } },
      participant: { select: { departmentId: true, gender: true } },
    },
  });

  const rows: ResponseRow[] = responses
    .filter(
      (r): r is typeof r & { normalizedScore: number } =>
        r.normalizedScore !== null && r.participant.departmentId !== null
    )
    .map((r) => ({
      normalizedScore: r.normalizedScore,
      questionOrder: r.question.questionOrder,
      participantId: r.participantId,
      departmentId: r.participant.departmentId,
      gender: r.participant.gender,
    }));

  const result = scoreFromRows(departmentId, department.displayName, rows);
  if ('skip' in result) return null;
  return result;
}

export async function calculateSafetyScores(
  campaignId: string,
  accountId: string
): Promise<SafetyScoreResult> {
  const campaign = await prisma.campaign.findFirst({
    where: { id: campaignId, accountId },
    include: { campaignType: { select: { slug: true } } },
  });

  if (!campaign) {
    throw new Error('Campaña no encontrada');
  }

  if (campaign.campaignType.slug !== AMBIENTE_SANO_SLUG) {
    throw new Error(
      `SafetyScoreService solo aplica a campañas "${AMBIENTE_SANO_SLUG}"`
    );
  }

  const responses = await prisma.response.findMany({
    where: {
      normalizedScore: { not: null },
      participant: { campaignId },
      question: { questionOrder: { in: SAFETY_QUESTION_ORDERS } },
    },
    select: {
      normalizedScore: true,
      participantId: true,
      question: { select: { questionOrder: true } },
      participant: {
        select: {
          departmentId: true,
          gender: true,
        },
      },
    },
  });

  const rows: ResponseRow[] = responses
    .filter(
      (r): r is typeof r & { normalizedScore: number } =>
        r.normalizedScore !== null && r.participant.departmentId !== null
    )
    .map((r) => ({
      normalizedScore: r.normalizedScore,
      questionOrder: r.question.questionOrder,
      participantId: r.participantId,
      departmentId: r.participant.departmentId,
      gender: r.participant.gender,
    }));

  const byDept = new Map<string, ResponseRow[]>();
  for (const row of rows) {
    if (!row.departmentId) continue;
    const bucket = byDept.get(row.departmentId) ?? [];
    bucket.push(row);
    byDept.set(row.departmentId, bucket);
  }

  const deptIds = Array.from(byDept.keys());
  const departments = deptIds.length
    ? await prisma.department.findMany({
        where: { id: { in: deptIds }, accountId },
        select: { id: true, displayName: true },
      })
    : [];
  const deptNames = new Map(departments.map((d) => [d.id, d.displayName]));

  const result: DepartmentSafetyScore[] = [];
  const skipped: SafetyScoreSkip[] = [];

  for (const [departmentId, deptRows] of byDept) {
    const departmentName = deptNames.get(departmentId) ?? 'Sin nombre';
    const respondentCount = new Set(deptRows.map((r) => r.participantId)).size;

    if (respondentCount < PRIVACY_THRESHOLD) {
      skipped.push({
        departmentId,
        departmentName,
        respondentCount,
        reason: 'privacy_threshold_not_met',
      });
      continue;
    }

    const averages = averageByQuestion(deptRows);
    const safetyScore = computeWeightedScore(averages);
    if (safetyScore === null) continue;

    result.push({
      departmentId,
      departmentName,
      safetyScore,
      riskLevel: classifyRisk(safetyScore),
      respondentCount,
      dimensionScores: buildDimensionScores(averages),
      genderBreakdown: buildGenderBreakdown(deptRows),
    });
  }

  let orgScore: number | null = null;
  if (result.length > 0) {
    const totalRespondents = result.reduce((acc, d) => acc + d.respondentCount, 0);
    const weightedSum = result.reduce(
      (acc, d) => acc + d.safetyScore * d.respondentCount,
      0
    );
    orgScore = totalRespondents > 0 ? weightedSum / totalRespondents : null;
  }

  return { orgScore, departments: result, skipped };
}
