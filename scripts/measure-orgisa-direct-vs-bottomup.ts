// scripts/measure-orgisa-direct-vs-bottomup.ts
// READ-ONLY. Mide para cmob0e56 el orgSafetyScore BOTTOM-UP (actual) vs DIRECTO
// (todas las respuestas en un pool) — el componente determinista del ISA
// (vozEstructurada). NO cambia ningún cálculo de producción. Solo mide.
// Run: npx tsx scripts/measure-orgisa-direct-vs-bottomup.ts

import { prisma } from '../src/lib/prisma';
import { calculateSafetyScores } from '../src/lib/services/SafetyScoreService';

const CAMPAIGN_ID = 'cmob0e56u0005f7g42l11urw0';
const SAFETY_QUESTION_ORDERS = [2, 3, 4, 5, 7, 8];
const INVERSE = new Set([4, 8]);

// Réplica fiel de averageByQuestion + computeAverageScore (SafetyScoreService).
function poolSafetyScore(
  rows: Array<{ normalizedScore: number; questionOrder: number }>,
): number | null {
  const sums = new Map<number, { sum: number; count: number }>();
  for (const r of rows) {
    const b = sums.get(r.questionOrder) ?? { sum: 0, count: 0 };
    b.sum += r.normalizedScore;
    b.count += 1;
    sums.set(r.questionOrder, b);
  }
  let total = 0;
  let dims = 0;
  for (const order of SAFETY_QUESTION_ORDERS) {
    const b = sums.get(order);
    if (!b || b.count === 0) continue;
    const avg = b.sum / b.count;
    total += INVERSE.has(order) ? 6 - avg : avg;
    dims += 1;
  }
  return dims === 0 ? null : total / dims;
}

async function main() {
  const campaign = await prisma.campaign.findUnique({
    where: { id: CAMPAIGN_ID },
    select: { accountId: true, name: true },
  });
  if (!campaign) throw new Error('Campaña no encontrada');

  // 1. BOTTOM-UP (método actual de producción).
  const safety = await calculateSafetyScores(CAMPAIGN_ID, campaign.accountId);

  // 2. DIRECTO: mismas filas, pero pooled (un solo grupo, sin gating por depto).
  const responses = await prisma.response.findMany({
    where: {
      normalizedScore: { not: null },
      participant: { campaignId: CAMPAIGN_ID },
      question: { questionOrder: { in: SAFETY_QUESTION_ORDERS } },
    },
    select: {
      normalizedScore: true,
      participantId: true,
      question: { select: { questionOrder: true } },
      participant: { select: { departmentId: true } },
    },
  });
  const rows = responses
    .filter((r) => r.normalizedScore !== null && r.participant.departmentId !== null)
    .map((r) => ({
      normalizedScore: r.normalizedScore as number,
      questionOrder: r.question.questionOrder,
    }));
  const uniqueParticipants = new Set(
    responses.filter((r) => r.participant.departmentId !== null).map((r) => r.participantId),
  ).size;

  const directSafety = poolSafetyScore(rows);
  const bottomUpSafety = safety.orgScore;

  const toISA = (s: number | null) => (s === null ? null : Math.round((s / 5) * 100));

  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`cmob0e56 (${campaign.name}) — SAFETY org: BOTTOM-UP vs DIRECTO`);
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('\nPor depto (bottom-up, gateado a 5):');
  for (const d of safety.departments) {
    console.log(`  ${d.departmentName}: safety=${d.safetyScore.toFixed(4)} (n=${d.respondentCount})`);
  }
  console.log(`  skipped (n<5): ${safety.skipped.length}`);

  console.log('\nSAFETY org-level (escala 1-5):');
  console.log(`  BOTTOM-UP (actual)  = ${bottomUpSafety?.toFixed(4) ?? 'null'}`);
  console.log(`  DIRECTO  (pooled)   = ${directSafety?.toFixed(4) ?? 'null'}  (n=${uniqueParticipants} pooled)`);
  const delta =
    bottomUpSafety !== null && directSafety !== null ? directSafety - bottomUpSafety : null;
  console.log(`  DELTA (directo - bottom-up) = ${delta?.toFixed(4) ?? 'n/a'}`);

  console.log('\nComponente ISA vozEstructurada (safety/5*100, 0-100):');
  console.log(`  BOTTOM-UP = ${toISA(bottomUpSafety)}`);
  console.log(`  DIRECTO   = ${toISA(directSafety)}`);
  const isaDelta =
    bottomUpSafety !== null && directSafety !== null
      ? (toISA(directSafety) as number) - (toISA(bottomUpSafety) as number)
      : null;
  console.log(`  DELTA en puntos ISA (solo vozEstructurada) = ${isaDelta ?? 'n/a'}`);
  console.log('\nNota: el orgISA completo (49) mezcla vozEstructurada + vozLibre(LLM) +');
  console.log('convergencia. Esto mide solo el componente determinista (el de mayor peso).');

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
