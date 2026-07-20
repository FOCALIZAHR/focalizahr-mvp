// prisma/scripts/smoke-vitals-gateA.ts
// ════════════════════════════════════════════════════════════════════════════
// Smoke Gate A — portada Signos Vitales (SPEC_HOME_SIGNOS_VITALES_v1.1).
//
// FRENTE 1: función pura selectClimaLayers + selectHeadline, fixtures en
//           memoria, sin BD.
// FRENTE 2: contra la BD de prueba.
//   2a camino vacío real  — los deptos con pulso-express salen sin veredicto.
//   2b fixture de contrato — filas experiencia-full temporales, CON CLEANUP.
//   2c señales reales      — EXO / EIS / ISA sin fixture.
//   2d scope jerárquico    — AREA_MANAGER ve sólo lo suyo.
//   2e matriz RBAC         — hasPermission por rol.
//
// ÚNICA ESCRITURA AUTORIZADA DEL GATE: el fixture 2b, borrado por id exacto en
// $transaction dentro de finally. Si el cleanup falla, el script lo grita.
//
// Uso: npx tsx prisma/scripts/smoke-vitals-gateA.ts
// ════════════════════════════════════════════════════════════════════════════

import { prisma } from '../../src/lib/prisma';
import {
  getVitalSigns,
  selectClimaLayers,
  selectHeadline,
} from '../../src/lib/services/vitals/VitalSignsService';
import { hasPermission } from '../../src/lib/auth/permissions';
import { getChildDepartmentIds } from '../../src/lib/services/AuthorizationService';
import type { ClimaInsightRow, DepartmentVitalSigns } from '../../src/lib/services/vitals/types';

const ACCOUNT = 'cmfgedx7b00012413i92048wl';
const FIXTURE_PERIOD = 'TEST-VITALS-QA-2026';
const NOW = new Date('2026-07-20T00:00:00.000Z');

let passed = 0;
let failed = 0;

function check(name: string, condition: boolean, detail?: string) {
  if (condition) {
    passed += 1;
    console.log(`  PASS  ${name}`);
  } else {
    failed += 1;
    console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

function row(over: Partial<ClimaInsightRow>): ClimaInsightRow {
  return {
    departmentId: 'D1',
    productType: 'experiencia-full',
    isFollowUp: false,
    period: '2026-Q1',
    periodEnd: new Date('2026-03-31'),
    engagementFavorability: 70,
    riskZone: 'amarilla',
    momentum: null,
    correlationFlags: null,
    topFocusArea: null,
    driverScores: null,
    totalResponded: 10,
    ...over,
  };
}

// ════════════════════════════════════════════════════════════════════════════
// FRENTE 1 — función pura
// ════════════════════════════════════════════════════════════════════════════
function frente1() {
  console.log('\n=== FRENTE 1 — función pura (sin BD) ===');

  // 1.1 Lista mixta: pulso-express NUNCA produce veredicto.
  const mixta = selectClimaLayers(
    [
      row({ productType: 'pulso-express', periodEnd: new Date('2026-06-30'),
            engagementFavorability: 43.5, riskZone: 'roja', period: '2026-Q2' }),
      row({ productType: 'experiencia-full', periodEnd: new Date('2026-03-31'),
            engagementFavorability: 80, riskZone: 'verde' }),
    ],
    NOW
  );
  check('1.1 mixta → veredicto de la full, pulso ignorado',
    mixta.status === 'con_veredicto' && mixta.verdict?.favorability === 80
      && mixta.verdict?.riskZone === 'verde',
    `status=${mixta.status} fav=${mixta.verdict?.favorability}`);

  // 1.2 Sólo pulso-express → sin veredicto (NO se inventa zona).
  const soloPulso = selectClimaLayers(
    [row({ productType: 'pulso-express', engagementFavorability: 43.5, riskZone: 'roja' })],
    NOW
  );
  check('1.2 sólo pulso → sin_veredicto y zona null',
    soloPulso.status === 'sin_veredicto' && soloPulso.verdict === null,
    `status=${soloPulso.status}`);

  // 1.3 Full antigua + follow-up nuevo → veredicto de la full + delta.
  const conSeguimiento = selectClimaLayers(
    [
      row({ periodEnd: new Date('2026-01-31'), engagementFavorability: 55, riskZone: 'roja',
            topFocusArea: 'liderazgo',
            driverScores: { liderazgo: { fav: 50, mean: 3.0, n: 10, carried: false } } }),
      row({ isFollowUp: true, period: '2026-Q2', periodEnd: new Date('2026-06-30'),
            driverScores: { liderazgo: { fav: 68, mean: 3.8, n: 9, carried: false } } }),
    ],
    NOW
  );
  check('1.3 full + follow-up → zona de la full, no la pisa el seguimiento',
    conSeguimiento.verdict?.riskZone === 'roja' && conSeguimiento.verdict?.favorability === 55,
    `zona=${conSeguimiento.verdict?.riskZone}`);
  check('1.3b delta = 68 − 50 = 18 sobre la dimensión intervenida',
    conSeguimiento.followUp?.delta === 18 && conSeguimiento.followUp?.dimension === 'liderazgo',
    `delta=${conSeguimiento.followUp?.delta} dim=${conSeguimiento.followUp?.dimension}`);

  // 1.4 Sólo follow-up, sin medición completa → NO se inventa zona.
  const soloFollow = selectClimaLayers(
    [row({ isFollowUp: true, riskZone: 'verde', engagementFavorability: 90 })],
    NOW
  );
  check('1.4 sólo seguimiento → solo_seguimiento, verdict null, zona NO inventada',
    soloFollow.status === 'solo_seguimiento' && soloFollow.verdict === null
      && soloFollow.followUp !== null,
    `status=${soloFollow.status} verdict=${soloFollow.verdict}`);

  // 1.5 Sin filas.
  const vacio = selectClimaLayers([], NOW);
  check('1.5 sin filas → sin_veredicto, todo null',
    vacio.status === 'sin_veredicto' && vacio.verdict === null && vacio.followUp === null);

  // 1.6 Follow-up ANTERIOR al veredicto no cuenta como respuesta al tratamiento.
  const followViejo = selectClimaLayers(
    [
      row({ periodEnd: new Date('2026-06-30'), riskZone: 'verde' }),
      row({ isFollowUp: true, periodEnd: new Date('2026-01-31') }),
    ],
    NOW
  );
  check('1.6 follow-up anterior al veredicto → followUp null',
    followViejo.status === 'con_veredicto' && followViejo.followUp === null,
    `followUp=${JSON.stringify(followViejo.followUp)}`);

  // 1.7 Dimensión no medida en el follow-up → delta null, jamás 0.
  const dimFaltante = selectClimaLayers(
    [
      row({ periodEnd: new Date('2026-01-31'), topFocusArea: 'liderazgo',
            driverScores: { liderazgo: { fav: 50, mean: 3, n: 10, carried: false } } }),
      row({ isFollowUp: true, periodEnd: new Date('2026-06-30'),
            driverScores: { reconocimiento: { fav: 60, mean: 3.5, n: 8, carried: false } } }),
    ],
    NOW
  );
  check('1.7 dimensión no medida → delta null (null ≠ 0)',
    dimFaltante.followUp?.delta === null
      && dimFaltante.followUp?.deltaUnavailableReason === 'dimension_no_medida',
    `delta=${dimFaltante.followUp?.delta}`);

  // 1.8 Headline: mayor severidad, desempate por menor favorabilidad.
  const deptos = [
    { departmentId: 'A', departmentName: 'A', clima: { status: 'con_veredicto',
      verdict: { riskZone: 'roja', favorability: 48 }, followUp: null } },
    { departmentId: 'B', departmentName: 'B', clima: { status: 'con_veredicto',
      verdict: { riskZone: 'roja', favorability: 43 }, followUp: null } },
    { departmentId: 'C', departmentName: 'C', clima: { status: 'con_veredicto',
      verdict: { riskZone: 'verde', favorability: 85 }, followUp: null } },
  ] as unknown as DepartmentVitalSigns[];
  const head = selectHeadline(deptos);
  check('1.8 headline = roja con menor favorabilidad (B)',
    head?.departmentId === 'B', `head=${head?.departmentId}`);

  check('1.9 headline null si nadie tiene veredicto',
    selectHeadline([]) === null);
}

// ════════════════════════════════════════════════════════════════════════════
// FRENTE 2 — BD de prueba
// ════════════════════════════════════════════════════════════════════════════
async function frente2() {
  const fixtureIds: string[] = [];

  try {
    // ── 2a. Camino vacío real ────────────────────────────────────────────
    console.log('\n=== FRENTE 2a — camino vacío real (pre-fixture) ===');
    const before = await getVitalSigns({ accountId: ACCOUNT, departmentIds: null, now: NOW });

    check('2a.1 ningún depto tiene veredicto (sólo hay pulso-express en BD)',
      before.coverage.withClimaVerdict === 0,
      `withClimaVerdict=${before.coverage.withClimaVerdict}`);
    check('2a.2 zoneDistribution.sinVeredicto == totalDepartments',
      before.zoneDistribution.sinVeredicto === before.coverage.totalDepartments,
      `${before.zoneDistribution.sinVeredicto}/${before.coverage.totalDepartments}`);
    check('2a.3 headline null con razón explícita',
      before.headline === null && before.headlineUnavailableReason === 'sin_veredictos');

    // Ninguna favorabilidad de pulso-express se filtró al output.
    const pulsoFavs = [80, 46.4, 76.3, 70.3, 66.3, 57.6, 61.8, 43.5, 80.3, 90, 40, 60];
    const leaked = before.departments.filter(
      (d) => d.clima.verdict?.favorability != null
        && pulsoFavs.includes(d.clima.verdict.favorability)
    );
    check('2a.4 ninguna favorabilidad de pulso-express se coló como veredicto',
      leaked.length === 0, `filtradas=${leaked.map((d) => d.departmentName).join(', ')}`);

    console.log(`  info  ${before.coverage.totalDepartments} deptos activos en la cuenta`);

    // ── 2c. Señales reales sin fixture ───────────────────────────────────
    console.log('\n=== FRENTE 2c — señales reales (EXO / EIS / ISA) ===');
    check('2c.1 EXO poblado en algunos deptos', before.coverage.withExo > 0,
      `withExo=${before.coverage.withExo}`);
    check('2c.2 EIS poblado en algunos deptos', before.coverage.withEis > 0,
      `withEis=${before.coverage.withEis}`);
    check('2c.3 ISA poblado sólo desde filas COMPLETED', before.coverage.withIsa > 0,
      `withIsa=${before.coverage.withIsa}`);
    console.log(`  info  EXO ${before.coverage.withExo} · EIS ${before.coverage.withEis} · ISA ${before.coverage.withIsa}`);

    const failedIsaCount = await prisma.complianceAnalysis.count({
      where: { accountId: ACCOUNT, status: 'FAILED' },
    });
    const withIsaScore = before.departments.filter((d) => d.ambiente.isaScore !== null);
    check('2c.4 filas FAILED excluidas (ninguna aporta isaScore)',
      withIsaScore.every((d) => d.ambiente.isaScore !== null),
      `filas FAILED en BD=${failedIsaCount}`);
    check('2c.5 delta ISA null cuando falta previousIsaScore (null ≠ 0)',
      withIsaScore.every((d) => d.ambiente.previousIsaScore !== null || d.ambiente.delta === null));

    // ── 2b. Fixture de contrato ──────────────────────────────────────────
    console.log('\n=== FRENTE 2b — fixture de contrato (escritura temporal) ===');

    // 3 deptos reales SIN insights de clima previos (aislamiento del fixture).
    const targets = await prisma.department.findMany({
      where: { accountId: ACCOUNT, isActive: true,
               displayName: { in: ['Desarrollo Web', 'Marketing', 'Seguridad'] } },
      select: { id: true, displayName: true },
    });
    if (targets.length < 3) {
      throw new Error(`Se esperaban 3 deptos objetivo, se encontraron ${targets.length}`);
    }
    const [dA, dB, dC] = targets;

    const base = {
      accountId: ACCOUNT,
      period: FIXTURE_PERIOD,
      periodStart: new Date('2026-04-01'),
      periodEnd: new Date('2026-06-30'),
      productType: 'experiencia-full',
      totalInvited: 12,
      totalResponded: 10,
      participationRate: 83.3,
    };

    const created = await prisma.$transaction([
      // A: veredicto rojo (será el hallazgo del día).
      prisma.departmentClimaInsight.create({
        data: { ...base, departmentId: dA.id, isFollowUp: false,
                engagementFavorability: 42, riskZone: 'roja', momentum: -8,
                topFocusArea: 'liderazgo',
                driverScores: { liderazgo: { fav: 40, mean: 2.8, n: 10, carried: false } } },
      }),
      // B: veredicto verde.
      prisma.departmentClimaInsight.create({
        data: { ...base, departmentId: dB.id, isFollowUp: false,
                engagementFavorability: 82, riskZone: 'verde' },
      }),
      // C: veredicto naranja + seguimiento posterior (ejercita la capa 2).
      prisma.departmentClimaInsight.create({
        data: { ...base, departmentId: dC.id, isFollowUp: false,
                engagementFavorability: 61, riskZone: 'naranja',
                topFocusArea: 'reconocimiento',
                driverScores: { reconocimiento: { fav: 55, mean: 3.1, n: 10, carried: false } } },
      }),
      prisma.departmentClimaInsight.create({
        data: { ...base, departmentId: dC.id, isFollowUp: true,
                period: `${FIXTURE_PERIOD}-FU`,
                periodStart: new Date('2026-07-01'), periodEnd: new Date('2026-07-15'),
                engagementFavorability: 70, riskZone: 'verde',
                driverScores: { reconocimiento: { fav: 72, mean: 3.9, n: 9, carried: false } } },
      }),
    ]);
    fixtureIds.push(...created.map((c) => c.id));
    console.log(`  info  ${fixtureIds.length} filas de fixture insertadas`);

    const after = await getVitalSigns({ accountId: ACCOUNT, departmentIds: null, now: NOW });
    const byId = new Map(after.departments.map((d) => [d.departmentId, d]));
    const rA = byId.get(dA.id)!;
    const rB = byId.get(dB.id)!;
    const rC = byId.get(dC.id)!;

    check('2b.1 A lee veredicto rojo con la favorabilidad del fixture',
      rA.clima.status === 'con_veredicto' && rA.clima.verdict?.riskZone === 'roja'
        && rA.clima.verdict?.favorability === 42,
      `zona=${rA.clima.verdict?.riskZone} fav=${rA.clima.verdict?.favorability}`);
    check('2b.2 B lee veredicto verde',
      rB.clima.verdict?.riskZone === 'verde', `zona=${rB.clima.verdict?.riskZone}`);
    check('2b.3 C conserva la zona de la medición completa (naranja), el seguimiento no la pisa',
      rC.clima.verdict?.riskZone === 'naranja', `zona=${rC.clima.verdict?.riskZone}`);
    check('2b.4 C expone el seguimiento con delta 72 − 55 = 17',
      rC.clima.followUp?.delta === 17 && rC.clima.followUp?.dimension === 'reconocimiento',
      `delta=${rC.clima.followUp?.delta}`);
    check('2b.5 monthsAgo crudo presente en el veredicto',
      typeof rA.clima.verdict?.monthsAgo === 'number',
      `monthsAgo=${rA.clima.verdict?.monthsAgo}`);
    check('2b.6 zoneDistribution refleja el fixture (1 roja, 1 naranja, 1 verde)',
      after.zoneDistribution.roja === 1 && after.zoneDistribution.naranja === 1
        && after.zoneDistribution.verde === 1,
      JSON.stringify(after.zoneDistribution));
    check('2b.7 headline = el depto rojo',
      after.headline?.departmentId === dA.id, `head=${after.headline?.departmentName}`);
    check('2b.8 coverage.withClimaVerdict === 3',
      after.coverage.withClimaVerdict === 3, `=${after.coverage.withClimaVerdict}`);

    // ── 2d. Scope jerárquico ─────────────────────────────────────────────
    console.log('\n=== FRENTE 2d — scope jerárquico AREA_MANAGER ===');
    const am = await prisma.user.findFirst({
      where: { accountId: ACCOUNT, role: 'AREA_MANAGER', departmentId: { not: null } },
      select: { email: true, departmentId: true },
    });
    if (am?.departmentId) {
      const children = await getChildDepartmentIds(am.departmentId);
      const scoped = await getVitalSigns({
        accountId: ACCOUNT, departmentIds: [am.departmentId, ...children], now: NOW,
      });
      check('2d.1 scope = area', scoped.scope === 'area');
      check('2d.2 ve estrictamente menos deptos que la organización',
        scoped.coverage.totalDepartments < after.coverage.totalDepartments,
        `${scoped.coverage.totalDepartments} vs ${after.coverage.totalDepartments}`);
      const allowed = new Set([am.departmentId, ...children]);
      check('2d.3 todo depto devuelto está dentro de su territorio',
        scoped.departments.every((d) => allowed.has(d.departmentId)));
      console.log(`  info  ${am.email}: ${scoped.coverage.totalDepartments} deptos visibles`);
    } else {
      console.log('  skip  no hay AREA_MANAGER con departmentId en la cuenta');
    }

    // Scope vacío → resultado vacío, jamás toda la cuenta.
    const empty = await getVitalSigns({ accountId: ACCOUNT, departmentIds: [], now: NOW });
    check('2d.4 scope vacío → 0 deptos (nunca fallback a toda la cuenta)',
      empty.departments.length === 0 && empty.coverage.totalDepartments === 0);

    // ── 2e. Matriz RBAC ──────────────────────────────────────────────────
    console.log('\n=== FRENTE 2e — matriz RBAC vitals:view ===');
    const allow = ['FOCALIZAHR_ADMIN', 'ACCOUNT_OWNER', 'HR_ADMIN', 'HR_MANAGER', 'CEO', 'AREA_MANAGER'];
    const deny = ['HR_OPERATOR', 'EVALUATOR', 'VIEWER', 'CLIENT'];
    for (const r of allow) {
      check(`2e allow ${r}`, hasPermission(r, 'vitals:view'));
    }
    for (const r of deny) {
      check(`2e deny  ${r}`, !hasPermission(r, 'vitals:view'));
    }
    check('2e deny rol null', !hasPermission(null, 'vitals:view'));

  } finally {
    // ── CLEANUP OBLIGATORIO — por id exacto, en transacción ──────────────
    console.log('\n=== CLEANUP ===');
    if (fixtureIds.length === 0) {
      console.log('  info  no había fixture que borrar');
    } else {
      try {
        const [del] = await prisma.$transaction([
          prisma.departmentClimaInsight.deleteMany({ where: { id: { in: fixtureIds } } }),
        ]);
        const leftovers = await prisma.departmentClimaInsight.count({
          where: { id: { in: fixtureIds } },
        });
        if (del.count === fixtureIds.length && leftovers === 0) {
          console.log(`  OK    ${del.count}/${fixtureIds.length} filas de fixture borradas, 0 residuo`);
        } else {
          failed += 1;
          console.log(`  ALERTA CLEANUP INCOMPLETO: borradas=${del.count}/${fixtureIds.length}, residuo=${leftovers}`);
          console.log(`  IDs a borrar a mano: ${fixtureIds.join(', ')}`);
        }
      } catch (e) {
        failed += 1;
        console.log(`  ALERTA CLEANUP FALLÓ: ${e instanceof Error ? e.message : String(e)}`);
        console.log(`  IDs a borrar a mano: ${fixtureIds.join(', ')}`);
      }
    }
  }
}

async function main() {
  console.log('SMOKE GATE A — Signos Vitales');
  frente1();
  await frente2();
  console.log(`\n──────────────────────────────────\nRESULTADO: ${passed} PASS · ${failed} FAIL`);
  if (failed > 0) process.exitCode = 1;
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
