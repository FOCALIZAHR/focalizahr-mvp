// prisma/scripts/smoke-dynamic-impact-drivers.ts
// Smoke E2E del gate Dynamic Impact Drivers (nivel reactivo) — cubre las 3 piezas:
//   Pieza 1: reactiveScores persistido por depto (crudo por subcategory).
//   Pieza 2: reactiveAnalysis con impacto local (N≥25) + walk-up jerárquico
//            (empate → gana el ancestro MÁS CERCANO) + fallback compañía.
//   Pieza 3: getIntervention selecciona el reactivo-palanca (mayor |impact|×|gap|),
//            devuelve la variante si existe o el default; el builder propaga selectedReactive.
//   + Regresión A-additive: hierarchy es inerte para los algoritmos sellados de driver.
//
// Self-contained: siembra su propia cuenta/jerarquía/campaña, corre la agregación
// real, asserta, y limpia TODO por id exacto en $transaction (cascade de Account +
// borrado explícito de AuditLog que es SetNull). Borrar al sellar (evidencia = commit).
//
// Uso: npx tsx prisma/scripts/smoke-dynamic-impact-drivers.ts

import { prisma } from '../../src/lib/prisma';
import { ClimaAggregationService } from '../../src/lib/services/clima/ClimaAggregationService';
import {
  computePulse,
  type PulseDeptInput,
  type ReactiveImpact,
} from '../../src/lib/services/clima/PulseEngine';
import { getIntervention } from '../../src/lib/services/clima/ClimaInterventionDictionary';
import { buildDeptClimaDecisions } from '../../src/lib/services/clima/ClimaActionPlanBuilder';
import type { DriverScore } from '../../src/lib/services/clima/FavorabilityCalculator';
import type { ReactiveContextEntry } from '../../src/types/clima-planes';

const MARKER = `SMOKE_DYNAMIC_IMPACT_${Date.now()}`;

let passed = 0;
let failed = 0;
function assert(cond: boolean, label: string) {
  if (cond) {
    passed += 1;
    console.log(`  ✅ ${label}`);
  } else {
    failed += 1;
    console.error(`  ❌ ${label}`);
  }
}

const hash = (s: string) => s.split('').reduce((a, c) => a + c.charCodeAt(0), 0);

async function main() {
  console.log(`\n🔬 Smoke Dynamic Impact Drivers — marker ${MARKER}\n`);

  // ── Banco real experiencia-full (preguntas con subcategory pobladas) ──
  const ct = await prisma.campaignType.findFirst({ where: { slug: 'experiencia-full' } });
  if (!ct) throw new Error('No existe CampaignType experiencia-full en la BD');
  const questions = await prisma.question.findMany({
    where: { campaignTypeId: ct.id },
    select: { id: true, category: true, subcategory: true, responseType: true },
  });
  const eiRating = questions.filter(
    (q) => q.category === 'engagement_index' && q.responseType === 'rating_scale'
  );
  const driverRating = questions.filter(
    (q) => q.responseType === 'rating_scale' && q.category !== 'engagement_index' && q.subcategory
  );
  console.log(`Banco: ${eiRating.length} EI rating · ${driverRating.length} reactivos (con subcategory)`);
  if (eiRating.length === 0 || driverRating.length < 3) {
    throw new Error('Banco insuficiente para el smoke (falta EI rating o reactivos)');
  }

  // ── Siembra: cuenta + jerarquía ──
  //   HOLDING ─ G1 ─ {A(10), B(10), C(10)}  → G1-subárbol=30 ≥25
  //          └ H(26 directo)                 → H local directo
  //   ISO(6, parentId=null, aislado)         → sin ancestro ≥25 → fallback compañía
  //   Caso empate: A sube A(<25)→G1(≥25); HOLDING también ≥25 pero G1 es más cercano.
  const account = await prisma.account.create({
    data: {
      companyName: MARKER,
      adminEmail: `${MARKER}@smoke.local`,
      adminName: 'Smoke Admin',
      passwordHash: 'x',
    },
  });
  const accountId = account.id;

  const mkDept = (displayName: string, parentId: string | null) =>
    prisma.department.create({ data: { accountId, displayName, parentId } });

  const holding = await mkDept('HOLDING', null);
  const g1 = await mkDept('G1', holding.id);
  const deptA = await mkDept('A', g1.id);
  const deptB = await mkDept('B', g1.id);
  const deptC = await mkDept('C', g1.id);
  const deptH = await mkDept('H', holding.id);
  const deptISO = await mkDept('ISO', null);

  const seedPlan: { dept: { id: string }; count: number }[] = [
    { dept: deptA, count: 10 },
    { dept: deptB, count: 10 },
    { dept: deptC, count: 10 },
    { dept: deptH, count: 26 },
    { dept: deptISO, count: 6 },
  ];

  const campaign = await prisma.campaign.create({
    data: {
      accountId,
      campaignTypeId: ct.id,
      name: MARKER,
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-03-31'),
      status: 'completed',
    },
  });

  // Participantes + respuestas (deterministas → Pearson computable, favs variados)
  let pIdx = 0;
  for (const { dept, count } of seedPlan) {
    for (let i = 0; i < count; i++) {
      const participant = await prisma.participant.create({
        data: {
          campaignId: campaign.id,
          uniqueToken: `${MARKER}-p${pIdx}`,
          nationalId: `${10000000 + pIdx}-0`,
          departmentId: dept.id,
          acotadoGroup: 'profesionales',
          hasResponded: true,
        },
      });
      const responses: { participantId: string; questionId: string; rating: number }[] = [];
      for (const q of eiRating) {
        responses.push({ participantId: participant.id, questionId: q.id, rating: 3 + (pIdx % 3) });
      }
      for (const q of driverRating) {
        const seed = hash(q.subcategory ?? q.category);
        responses.push({
          participantId: participant.id,
          questionId: q.id,
          rating: 2 + ((pIdx + seed) % 4), // 2..5, varía por reactivo y participante
        });
      }
      await prisma.response.createMany({ data: responses });
      pIdx += 1;
    }
  }
  console.log(`Sembrados ${pIdx} participantes en 5 deptos.\n`);

  // ── Correr la agregación real (Piezas 1 + 2) ──
  const result = await ClimaAggregationService.processClimaResults(campaign.id);
  console.log(`Agregación: status=${result.status} insights=${result.insightsGenerados}`);
  if (result.deptosFallidos.length > 0) {
    for (const f of result.deptosFallidos) console.log(`   fallo ${f.departmentId}: ${f.error.slice(0, 120)}`);
  }

  const insights = await prisma.departmentClimaInsight.findMany({
    where: { campaignId: campaign.id },
    select: { departmentId: true, reactiveScores: true, reactiveAnalysis: true, driverScores: true },
  });
  const byDept = new Map(insights.map((i) => [i.departmentId, i]));

  console.log('\n── Pieza 1: reactiveScores persistido ──');
  assert(insights.length === 5, `5 insights generados (got ${insights.length})`);
  for (const [id, name] of [
    [deptA.id, 'A'], [deptH.id, 'H'], [deptISO.id, 'ISO'],
  ] as const) {
    const rs = byDept.get(id)?.reactiveScores as Record<string, DriverScore> | null;
    assert(!!rs && Object.keys(rs).length >= 3, `${name}: reactiveScores presente (${rs ? Object.keys(rs).length : 0} reactivos)`);
    const anyFav = rs && Object.values(rs).some((s) => s.fav !== null);
    assert(!!anyFav, `${name}: al menos un reactivo con fav no-null (n≥threshold)`);
  }

  console.log('\n── Pieza 2: reactiveAnalysis — local / walk-up / compañía ──');
  const raOf = (id: string) => (byDept.get(id)?.reactiveAnalysis as ReactiveImpact[] | null) ?? [];

  const raH = raOf(deptH.id);
  assert(raH.length > 0, `H: reactiveAnalysis presente (${raH.length})`);
  assert(raH.every((r) => r.impactSource === 'local'), 'H: todos los reactivos con impactSource=local (N≥25 directo)');
  assert(raH.every((r) => r.impactLevelDeptId === deptH.id), 'H: impactLevelDeptId = H (nivel propio)');

  const raA = raOf(deptA.id);
  assert(raA.length > 0, `A: reactiveAnalysis presente (${raA.length})`);
  assert(raA.every((r) => r.impactSource === 'local'), 'A: impactSource=local vía walk-up (A<25 → G1=30)');
  assert(
    raA.every((r) => r.impactLevelDeptId === g1.id),
    'A: EMPATE resuelto por cercanía — impactLevelDeptId = G1, NO el HOLDING (ambos ≥25)'
  );

  const raISO = raOf(deptISO.id);
  assert(raISO.length > 0, `ISO: reactiveAnalysis presente (${raISO.length})`);
  assert(raISO.every((r) => r.impactSource === 'company'), 'ISO: impactSource=company (ningún ancestro ≥25)');
  assert(raISO.every((r) => r.impactLevelDeptId === null), 'ISO: impactLevelDeptId=null (fallback compañía)');

  // priority = |impact|×|gap| coherente donde ambos existen
  const someWithPriority = raA.find((r) => r.impact !== null && r.gap !== null);
  if (someWithPriority) {
    const expected = Math.round(Math.abs(someWithPriority.impact!) * Math.abs(someWithPriority.gap!) * 10) / 10;
    assert(someWithPriority.priority === expected, `A: priority = |impact|×|gap| (${expected})`);
  }

  console.log('\n── Pieza 3: getIntervention selecciona el reactivo-palanca ──');
  // ctx: 'carga_trabajo' tiene mayor |impact|×|gap| (0.4×30=12) que 'otro' (0.5×20=10)
  const ctx: ReactiveContextEntry[] = [
    { reactive: 'otro', impact: 0.5, gap: -20 },
    { reactive: 'carga_trabajo', impact: 0.4, gap: -30 },
  ];
  const selLid = getIntervention('liderazgo', 'roja', ctx);
  assert(selLid?.selectedReactive === 'carga_trabajo', 'selecciona el reactivo de mayor |impact|×|gap| (carga_trabajo)');
  assert(!!selLid && selLid.cell.narrative.includes('sobrecarga'), 'liderazgo/roja + carga_trabajo → devuelve la VARIANTE de muestra');

  const selSat = getIntervention('satisfaccion', 'roja', ctx);
  assert(selSat?.selectedReactive === 'carga_trabajo', 'satisfaccion/roja: selecciona reactivo-palanca igual');
  assert(!!selSat && selSat.cell.narrative.includes('Satisfacción') && !selSat.cell.narrative.includes('sobrecarga'),
    'satisfaccion/roja sin variante → cae al DEFAULT de la celda');

  const selEmpty = getIntervention('liderazgo', 'roja', []);
  assert(selEmpty?.selectedReactive === null, 'contexto vacío → selectedReactive=null (default, backward compatible)');

  const selNoCtx = getIntervention('liderazgo', 'roja');
  assert(!!selNoCtx && selNoCtx.selectedReactive === null && !selNoCtx.cell.narrative.includes('sobrecarga'),
    'sin reactiveContext → default (retrocompatible con el caller viejo)');

  // buildDeptClimaDecisions propaga selectedReactive
  const decisions = buildDeptClimaDecisions({
    departmentId: 'dx',
    drivers: [
      { category: 'liderazgo', fav: 40, gap: -35, impact: 0.4, momentumDelta: null, classification: 'focus_area', reactives: ctx },
    ],
    businessCases: [],
  });
  assert(decisions.length === 1 && decisions[0].selectedReactive === 'carga_trabajo',
    'buildDeptClimaDecisions propaga selectedReactive al item');

  console.log('\n── Regresión A-additive: hierarchy inerte para algoritmos sellados ──');
  const dS = (fav: number, mean: number): DriverScore => ({ fav, mean, n: 12, carried: false });
  const mkPulseDept = (departmentId: string): PulseDeptInput => ({
    departmentId,
    driverScores: { liderazgo: dS(55, 3.2), satisfaccion: dS(70, 3.9) },
    reactiveScores: {},
    ei: { fav: 58, mean: 3.6, n: 12 },
    momentum: null,
    rows: [],
    prevDriverScores: null,
    turnoverRate: null,
    headcountAvg: 30,
    isaScore: null,
    totalResponded: 12,
    participationRate: 80,
    voluntaryExits12mo: null,
    salary: {
      monthlySalary: 1_000_000,
      annualSalary: 12_000_000,
      source: 'default_chile',
      confidence: 'low',
      metadata: { accountId: 'smoke', configuredByClient: false },
    },
  });
  const dumbDepts = [mkPulseDept('p1'), mkPulseDept('p2')];
  const withoutH = computePulse({ depts: dumbDepts });
  const withH = computePulse({ depts: dumbDepts, hierarchy: [{ id: 'p1', parentId: null }, { id: 'p2', parentId: null }] });
  const sameDriverAnalysis =
    JSON.stringify(withoutH.get('p1')?.driverAnalysis) === JSON.stringify(withH.get('p1')?.driverAnalysis) &&
    withoutH.get('p1')?.riskZone === withH.get('p1')?.riskZone;
  assert(sameDriverAnalysis, 'driverAnalysis + riskZone idénticos con/sin hierarchy (feature no toca lo sellado)');

  // ── Cleanup por id exacto en $transaction (dry-run + cascade Account) ──
  console.log('\n── Cleanup ──');
  const auditCount = await prisma.auditLog.count({ where: { accountId } });
  console.log(`  dry-run: account ${accountId} (cascade: 7 deptos, 1 campaña, ${pIdx} participantes, insights, NPS) + ${auditCount} auditLogs`);
  await prisma.$transaction([
    prisma.auditLog.deleteMany({ where: { accountId } }), // SetNull → borrar explícito
    prisma.account.delete({ where: { id: accountId } }),  // cascade: todo lo demás
  ]);
  const leftover = await prisma.account.count({ where: { id: accountId } });
  assert(leftover === 0, 'cleanup completo (cuenta y cascade eliminados)');

  console.log(`\n${failed === 0 ? '✅ PASS' : '❌ FAIL'} — ${passed} ok · ${failed} fail\n`);
  if (failed > 0) process.exitCode = 1;
}

main()
  .catch((e) => {
    console.error('❌ Error fatal:', e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
