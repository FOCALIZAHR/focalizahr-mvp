// src/lib/services/SafetyScoreService.ts
// Ambiente Sano - Cálculo de Safety Score por departamento (escala 1-5).
//
// Lee Response.normalizedScore (persistente, calculado al submit vía calculateNormalizedScore).
// NO duplica lógica de mapeo: el binario 5/1 de P2/P3/P5 vive en Question.responseValueMapping
// (ver prisma/seed-ambientes-sanos.ts).
//
// Privacy: departamentos con n < 5 respondentes no se calculan (van a `skipped`).
//
// ─────────────────────────────────────────────────────────────────────────────
// FÓRMULA (refactor 2026-05-05)
// ─────────────────────────────────────────────────────────────────────────────
// safetyScore = Σ(avg_invertido_por_pregunta) / N        (escala 1-5)
//   donde N = nº de dimensiones presentes (esperado 6, ver SAFETY_QUESTION_ORDERS).
//
// Antes (≤ 2026-05-04) la fórmula usaba pesos arbitrarios por pregunta. Se eliminó
// para tratar las 6 dimensiones del instrumento como pares — el espíritu del
// instrumento (P2-P8) es que cada dimensión es una lente independiente del mismo
// fenómeno, no un input ponderable.
//
// ─────────────────────────────────────────────────────────────────────────────
// PREGUNTAS QUE ENTRAN AL CÁLCULO
// ─────────────────────────────────────────────────────────────────────────────
//   P2 - seguridad psicológica
//   P3 - disenso (qué pasa al expresar desacuerdo)
//   P4 - microagresiones (INVERTIDA: 6 - avg)
//   P5 - equidad (asignación de tareas)
//   P7 - calidad del liderazgo directo
//   P8 - agotamiento relacional (INVERTIDA: 6 - avg)
//
// Por qué P1 NO entra: es texto abierto (responseType='text_open'). Se procesa
// por LLM en `PatronesLLMService`, no por promedio numérico.
//
// Por qué P6 NO entra: es branching question UX-only. Define el wording de P7
// ("Para tu desarrollo y bienestar, ¿qué es MÁS importante que tu líder fomente?
// → feedback claro / autonomía"), pero no tiene `responseValueMapping` en el seed
// y por tanto no produce `normalizedScore`. La brecha analítica P6→P7
// (necesidad declarada vs experiencia recibida) NO se computa hoy — es deuda
// funcional reconocida, no bug.
//
// ─────────────────────────────────────────────────────────────────────────────
// INVERSIÓN P4 / P8 — IMPORTANTE PARA CONSUMERS
// ─────────────────────────────────────────────────────────────────────────────
// Los valores expuestos en `dimensionScores.P4_microagresiones` y
// `dimensionScores.P8_agotamiento` YA VIENEN INVERTIDOS vía `6 - avg`.
//
// Lectura correcta:
//   • 5.0 = óptimo (cero microagresiones percibidas / cero agotamiento relacional)
//   • 1.0 = peor (alta frecuencia de microagresiones / agotamiento extremo)
//
// NO leer estos campos como "frecuencia bruta del fenómeno". Si alguien necesita
// el avg crudo (no invertido), debe consultar Response.normalizedScore directo.
// Esta inversión está aquí para que P4/P8 sumen consistentemente al rollup
// (todas las dimensiones suben con el bienestar).

import { prisma } from '@/lib/prisma';
import { Gender } from '@prisma/client';

const AMBIENTE_SANO_SLUG = 'pulso-ambientes-sanos';

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

/**
 * Promedio simple de las dimensiones presentes (escala 1-5).
 *
 * Renormalización dinámica: si falta una dimensión (todos los respondentes
 * la omitieron o hubo un bug de submit), el divisor cae a N<6. Se emite
 * console.warn para hacer visible la pérdida de fidelidad — no es bloqueante,
 * pero un score calculado sobre <6 dimensiones tiene menor cobertura del
 * instrumento y puede ser menos representativo.
 */
function computeAverageScore(averages: Map<number, number>): number | null {
  let sum = 0;
  let count = 0;
  for (const order of SAFETY_QUESTION_ORDERS) {
    const avg = averages.get(order);
    if (avg === undefined) continue;
    sum += avg;
    count += 1;
  }
  if (count === 0) return null;
  if (count < SAFETY_QUESTION_ORDERS.length) {
    console.warn(
      `[SafetyScoreService] Renormalización: solo ${count}/${SAFETY_QUESTION_ORDERS.length} dimensiones presentes`
    );
  }
  return sum / count;
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
    const score = computeAverageScore(averages);
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
  const safetyScore = computeAverageScore(averages);
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
    const safetyScore = computeAverageScore(averages);
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
