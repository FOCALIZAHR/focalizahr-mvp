// prisma/scripts/smoke-pulse-engine.ts
// EX Clima Gate 3 — Smoke del PulseEngine: funciones puras contra fixtures
// sintéticos con resultados calculados A MANO (sin BD).
// Se BORRA al sellar el gate (regla de la casa — la evidencia vive en el commit).
//
// Uso: npx tsx prisma/scripts/smoke-pulse-engine.ts

import {
  type ClimaCorrelationFlags,
  type PulseDeptInput,
  buildBusinessCases,
  calcClimaTurnoverCorrelation,
  calcDriverMomentum,
  calcGapTransfer,
  calcRiskZone,
  classifyDriver,
  computePulse,
  detectHotspots,
  detectTheatre,
  percentile,
  rankMomentumMovers,
  turnoverRiskFromMean,
} from '../../src/lib/services/clima/PulseEngine';
import { GoalsDiagnosticService } from '../../src/lib/services/GoalsDiagnosticService';
import type { SalaryResult } from '../../src/lib/services/SalaryConfigService';
import type { ClimaResponseRow, DriverScore } from '../../src/lib/services/clima/FavorabilityCalculator';

let passed = 0;
let failed = 0;

function check(name: string, actual: unknown, expected: unknown) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a === e) {
    passed += 1;
    console.log(`  ✅ ${name}`);
  } else {
    failed += 1;
    console.log(`  ❌ ${name}\n     esperado: ${e}\n     actual:   ${a}`);
  }
}

// Helpers de fixtures ─────────────────────────────────────────────────────────

const measured = (fav: number | null, mean: number | null, n = 10): DriverScore => ({
  fav, mean, n, carried: false,
});
const carried = (fav: number | null, mean: number | null): DriverScore => ({
  fav, mean, n: 0, carried: true, sourceDate: '2026-Q1',
});

function deptInput(partial: Partial<PulseDeptInput> & { departmentId: string }): PulseDeptInput {
  return {
    driverScores: {},
    ei: { fav: null, mean: null, n: 0 },
    momentum: null,
    rows: [],
    prevDriverScores: null,
    turnoverRate: null,
    headcountAvg: null,
    isaScore: null,
    totalResponded: 0,
    participationRate: 0,
    ...partial,
  };
}

/** Dos filas rating_scale por participante: driver + engagement_index. */
function pairRows(
  deptId: string,
  ratings: [driverRating: number, eiRating: number][],
  driver = 'liderazgo'
): ClimaResponseRow[] {
  const rows: ClimaResponseRow[] = [];
  ratings.forEach(([dr, er], i) => {
    const base = {
      participantId: `${deptId}-p${i}`,
      questionTier: 'CORE',
      responseType: 'rating_scale',
      isBenchmarkable: true,
      departmentId: deptId,
      acotadoGroup: null,
    };
    rows.push({ ...base, rating: dr, questionCategory: driver });
    rows.push({ ...base, rating: er, questionCategory: 'engagement_index' });
  });
  return rows;
}

const SALARY: SalaryResult = {
  monthlySalary: 1_000_000,
  annualSalary: 12_000_000,
  source: 'empresa_promedio',
  confidence: 'medium',
  metadata: { accountId: 'acc-smoke', configuredByClient: true },
};

// S1 — Pearson reutilizado (GoalsDiagnosticService.calculatePearsonR) ─────────
console.log('\nS1 — Pearson (reuso GoalsDiagnosticService)');
check('r=1.00 con 5 pares perfectos',
  GoalsDiagnosticService.calculatePearsonR([1, 2, 3, 4, 5].map((v) => ({ x: v, y: v }))), 1);
check('r=0.80 caso intermedio a mano',
  GoalsDiagnosticService.calculatePearsonR([
    { x: 1, y: 2 }, { x: 2, y: 1 }, { x: 3, y: 4 }, { x: 4, y: 3 }, { x: 5, y: 5 },
  ]), 0.8);
check('4 pares → null',
  GoalsDiagnosticService.calculatePearsonR([1, 2, 3, 4].map((v) => ({ x: v, y: v }))), null);

// S2 — ALG 1: cuadrantes de clasificación ─────────────────────────────────────
console.log('\nS2 — ALG 1 classifyDriver (cuadrantes)');
check('impact alto + gap grande → focus_area', classifyDriver(0.5, -20), 'focus_area');
check('impact alto + gap ≥0 → strength', classifyDriver(0.5, 5), 'strength');
check('impact bajo + gap grande → monitor', classifyDriver(0.1, -15), 'monitor');
check('impact null + gap grande → monitor', classifyDriver(null, -15), 'monitor');
check('impact bajo + gap chico → maintain', classifyDriver(0.1, 3), 'maintain');
check('impact alto + gap intermedio (-5) → maintain', classifyDriver(0.5, -5), 'maintain');
check('gap null → null', classifyDriver(0.5, null), null);

// S3 — ALG 3: momentum per-driver ─────────────────────────────────────────────
console.log('\nS3 — ALG 3 calcDriverMomentum');
check('delta -12 → crisis', calcDriverMomentum(measured(50, 3), measured(62, 3.5)),
  { momentumDelta: -12, momentumState: 'crisis' });
check('delta -7 → declining', calcDriverMomentum(measured(55, 3), measured(62, 3.5)),
  { momentumDelta: -7, momentumState: 'declining' });
check('delta +6 → growing', calcDriverMomentum(measured(68, 3.6), measured(62, 3.5)),
  { momentumDelta: 6, momentumState: 'growing' });
check('delta +2 → stable', calcDriverMomentum(measured(64, 3.5), measured(62, 3.5)),
  { momentumDelta: 2, momentumState: 'stable' });
check('current carried → null', calcDriverMomentum(carried(50, 3), measured(62, 3.5)),
  { momentumDelta: null, momentumState: null });
check('prev carried → null', calcDriverMomentum(measured(50, 3), carried(62, 3.5)),
  { momentumDelta: null, momentumState: null });
check('sin período previo → null', calcDriverMomentum(measured(50, 3), undefined),
  { momentumDelta: null, momentumState: null });
check('prev fav null (privacy) → null', calcDriverMomentum(measured(50, 3), measured(null, null)),
  { momentumDelta: null, momentumState: null });

// S4 — ALG 2: percentil + hotspot ─────────────────────────────────────────────
console.log('\nS4 — ALG 2 hotspot');
check('p25 de [40,45,50,55,60,65,70,80] = 48.8 (interpolación a mano)',
  percentile([40, 45, 50, 55, 60, 65, 70, 80], 0.25), 48.8);
const hotspotCtx = { p25: 48.8, deptsInSample: 8 };
check('eiFav 45 < p25 → hotspot true + confidence high (datos duros completos)',
  detectHotspots(
    deptInput({ departmentId: 'd1', ei: { fav: 45, mean: 2.8, n: 10 }, turnoverRate: 12, headcountAvg: 20 }),
    hotspotCtx
  ),
  { isHotspot: true, eiFav: 45, p25CompanyEiFav: 48.8, deptsInSample: 8, headcountAvg: 20, turnoverRate: 12, confidence: 'high' });
check('eiFav 50 ≥ p25 → false + confidence medium (falta turnover)',
  detectHotspots(
    deptInput({ departmentId: 'd2', ei: { fav: 50, mean: 3.1, n: 10 }, headcountAvg: 20 }),
    hotspotCtx
  ).isHotspot, false);
check('confidence low (sin turnover ni headcount)',
  detectHotspots(deptInput({ departmentId: 'd3', ei: { fav: 45, mean: 2.8, n: 10 } }), hotspotCtx).confidence,
  'low');
check('p25 null (<4 deptos) → isHotspot null',
  detectHotspots(
    deptInput({ departmentId: 'd4', ei: { fav: 45, mean: 2.8, n: 10 } }),
    { p25: null, deptsInSample: 3 }
  ).isHotspot, null);

// S5 — ALG 4: gap transfer ────────────────────────────────────────────────────
console.log('\nS5 — ALG 4 calcGapTransfer');
const gtDepts = [
  deptInput({ departmentId: 'A', driverScores: { liderazgo: measured(80, 4.2), unico: measured(60, 3.4) } }),
  deptInput({ departmentId: 'B', driverScores: { liderazgo: measured(70, 3.8) } }),
  deptInput({ departmentId: 'C', driverScores: { liderazgo: measured(55, 3.1), soloCarried: carried(65, 3.5) } }),
];
const champions = calcGapTransfer(gtDepts);
check('champion de liderazgo = A con fav 80 (3 deptos midieron)',
  champions.get('liderazgo'), { departmentId: 'A', fav: 80, measuredDepts: 3 });
check('driver medido por 1 solo depto → no evaluable (ausente)',
  champions.has('unico'), false);
check('driver solo carried → no evaluable (ausente)',
  champions.has('soloCarried'), false);

// S6 — ALG 5: correlación clima × rotación ────────────────────────────────────
console.log('\nS6 — ALG 5 calcClimaTurnoverCorrelation');
// turnover = (100 − eiFav)/4 → relación lineal perfecta negativa → r = −1
const alg5Depts = [80, 70, 60, 50, 40].map((fav, i) =>
  deptInput({
    departmentId: `t${i}`,
    ei: { fav, mean: 3, n: 10 },
    turnoverRate: (100 - fav) / 4,
  })
);
check('5 deptos lineal perfecto → r=-1, evaluable',
  calcClimaTurnoverCorrelation(alg5Depts), { pearsonR: -1, nDepts: 5, evaluable: true });
check('3 deptos (<5 pares) → null, no evaluable',
  calcClimaTurnoverCorrelation(alg5Depts.slice(0, 3)), { pearsonR: null, nDepts: 3, evaluable: false });
check('turnoverRate null excluye al depto de los pares',
  calcClimaTurnoverCorrelation([
    ...alg5Depts.slice(0, 4),
    deptInput({ departmentId: 't-null', ei: { fav: 45, mean: 3, n: 10 } }),
  ]).nDepts, 4);

// S7 — FLAG theatreDetected ───────────────────────────────────────────────────
console.log('\nS7 — theatreDetected');
check('ISA 80 + eiFav 45 → true',
  detectTheatre(deptInput({ departmentId: 'x', isaScore: 80, ei: { fav: 45, mean: 2.8, n: 10 } })).theatreDetected,
  true);
check('ISA 80 + eiFav 60 → false',
  detectTheatre(deptInput({ departmentId: 'x', isaScore: 80, ei: { fav: 60, mean: 3.4, n: 10 } })).theatreDetected,
  false);
check('ISA null → null (no evaluable, nunca false)',
  detectTheatre(deptInput({ departmentId: 'x', ei: { fav: 45, mean: 2.8, n: 10 } })),
  { theatreDetected: null, theatre: { isaScore: null, engagementFav: 45, evaluable: false } });
check('eiFav null (privacy) → null',
  detectTheatre(deptInput({ departmentId: 'x', isaScore: 80 })).theatreDetected, null);

// S8 — Business cases (absorción RetentionEngine, cifras CLP a mano) ──────────
console.log('\nS8 — Business cases');
check('escala turnover risk: 1.9→0.60 · 2.3→0.45 · 2.5→0.30 · 2.8→0.30 · 3.2→0.20 · 4.0→0.10',
  [1.9, 2.3, 2.5, 2.8, 3.2, 4.0].map(turnoverRiskFromMean),
  [0.6, 0.45, 0.3, 0.3, 0.2, 0.1]);

// Depto A: los 3 casos disparan. headcountAvg 20, salario 1M → turnoverCost 15M (×1.25)
const bcDeptA = deptInput({
  departmentId: 'bcA',
  driverScores: { comunicacion: measured(30, 2.3), liderazgo: measured(45, 2.8) },
  ei: { fav: 48, mean: 2.9, n: 12 },
  headcountAvg: 20,
  totalResponded: 12,
  participationRate: 80,
});
const casesA = bcDeptA && buildBusinessCases(bcDeptA, SALARY);
check('deptA dispara los 3 tipos (orden liderazgo→clima→retención)',
  casesA.map((c) => c.type), ['liderazgo_gap', 'clima_critico', 'retencion_riesgo']);
const lidA = casesA.find((c) => c.type === 'liderazgo_gap')!;
check('liderazgo_gap: 6 personas (ceil(20×0.30)), pérdida 90M, inversión 2M, ROI 3500%, payback 1m, severidad alta',
  {
    peopleAtRisk: lidA.peopleAtRisk, loss: lidA.potentialAnnualLossCLP,
    inv: lidA.recommendedInvestmentCLP, roi: lidA.estimatedROIPct,
    payback: lidA.paybackMonths, sev: lidA.severity, conf: lidA.confidence,
  },
  { peopleAtRisk: 6, loss: 90_000_000, inv: 2_000_000, roi: 3500, payback: 1, sev: 'alta', conf: 'alta' });
const climA = casesA.find((c) => c.type === 'clima_critico')!;
check('clima_critico: driver comunicacion, 9 personas (ceil(20×0.45)), pérdida 135M, inversión 1.5M, ROI 5300%, severidad critica',
  {
    driver: climA.driver, peopleAtRisk: climA.peopleAtRisk, loss: climA.potentialAnnualLossCLP,
    inv: climA.recommendedInvestmentCLP, roi: climA.estimatedROIPct, sev: climA.severity,
  },
  { driver: 'comunicacion', peopleAtRisk: 9, loss: 135_000_000, inv: 1_500_000, roi: 5300, sev: 'critica' });
const retA = casesA.find((c) => c.type === 'retencion_riesgo')!;
check('retencion_riesgo: driver null (EI), 6 personas, pérdida 90M, ROI 3500%',
  { driver: retA.driver, peopleAtRisk: retA.peopleAtRisk, loss: retA.potentialAnnualLossCLP, roi: retA.estimatedROIPct },
  { driver: null, peopleAtRisk: 6, loss: 90_000_000, roi: 3500 });
check('salarySource trazado en el case', retA.salarySource, 'empresa_promedio');

// Exclusión mutua: liderazgo peor Y <2.5 → clima_critico toma el 2º peor
const bcDeptB = deptInput({
  departmentId: 'bcB',
  driverScores: {
    liderazgo: measured(25, 2.2),
    desarrollo: measured(30, 2.4),
    satisfaccion: measured(70, 3.5),
  },
  ei: { fav: 70, mean: 3.5, n: 12 },
  headcountAvg: 10,
  participationRate: 60,
});
const casesB = buildBusinessCases(bcDeptB, SALARY);
check('exclusión mutua: liderazgo_gap (liderazgo) + clima_critico con el 2º peor (desarrollo) — sin doble CLP',
  casesB.map((c) => ({ type: c.type, driver: c.driver })),
  [{ type: 'liderazgo_gap', driver: 'liderazgo' }, { type: 'clima_critico', driver: 'desarrollo' }]);
check('confidence media con participación 60%', casesB[0].confidence, 'media');

// Liderazgo único <2.5 → clima_critico NO se emite (no hay otro driver crítico)
const casesC = buildBusinessCases(
  deptInput({
    departmentId: 'bcC',
    driverScores: { liderazgo: measured(25, 2.2), satisfaccion: measured(70, 3.5) },
    ei: { fav: 70, mean: 3.5, n: 12 },
    headcountAvg: 10,
    participationRate: 40,
  }),
  SALARY
);
check('liderazgo único crítico → SOLO liderazgo_gap (clima_critico no se emite)',
  casesC.map((c) => c.type), ['liderazgo_gap']);
check('confidence baja con participación 40%', casesC[0].confidence, 'baja');
check('sin headcountAvg → base totalResponded (12): ceil(12×0.45)=6 personas',
  buildBusinessCases(
    deptInput({
      departmentId: 'bcD',
      driverScores: { comunicacion: measured(30, 2.3) },
      ei: { fav: 70, mean: 3.5, n: 12 },
      totalResponded: 12,
      participationRate: 80,
    }),
    SALARY
  )[0].peopleAtRisk, 6);
check('driver carried NO dispara business case',
  buildBusinessCases(
    deptInput({
      departmentId: 'bcE',
      driverScores: { comunicacion: carried(30, 2.3) },
      ei: { fav: 70, mean: 3.5, n: 12 },
      participationRate: 80,
    }),
    SALARY
  ), []);

// S9 — riskZone (cortes Victor 2026-07-07: 75/65/60 + modulación crisis) ──────
console.log('\nS9 — riskZone');
check('80 → verde', calcRiskZone(80, null), 'verde');
check('75 → verde (borde)', calcRiskZone(75, null), 'verde');
check('70 → amarilla', calcRiskZone(70, null), 'amarilla');
check('62 → naranja', calcRiskZone(62, null), 'naranja');
check('55 → roja', calcRiskZone(55, null), 'roja');
check('78 con momentum -12 → amarilla (crisis degrada UNA zona)', calcRiskZone(78, -12), 'amarilla');
check('62 con momentum -15 → roja', calcRiskZone(62, -15), 'roja');
check('55 con momentum -20 → roja (ya es la peor)', calcRiskZone(55, -20), 'roja');
check('76 con momentum -9 → verde (no llega a crisis, no modula)', calcRiskZone(76, -9), 'verde');
check('fav null (privacy) → null', calcRiskZone(null, -20), null);

// S10 — computePulse end-to-end (ensamblado completo) ─────────────────────────
console.log('\nS10 — computePulse end-to-end');
// 6 participantes con liderazgo=EI idénticos → r=1.00 a nivel compañía
const ratingsPerfect: [number, number][] = [[1, 1], [2, 2], [3, 3], [4, 4], [5, 5], [5, 5]];
const deptX = deptInput({
  departmentId: 'X',
  driverScores: {
    liderazgo: measured(50, 3.0, 6),
    desarrollo: carried(40, 2.4), // carried: analizado pero nunca lidera el diagnóstico
  },
  ei: { fav: 60, mean: 3.2, n: 6 },
  momentum: null,
  rows: pairRows('X', ratingsPerfect.slice(0, 3)),
  isaScore: 80,
  totalResponded: 6,
  participationRate: 75,
});
const deptY = deptInput({
  departmentId: 'Y',
  driverScores: { liderazgo: measured(85, 4.4, 6) },
  ei: { fav: 80, mean: 4.1, n: 6 },
  rows: pairRows('Y', ratingsPerfect.slice(3)),
  totalResponded: 6,
  participationRate: 90,
});
const deptZ = deptInput({
  departmentId: 'Z', // bajo privacy threshold: todo null
  driverScores: { liderazgo: measured(null, null, 2) },
  ei: { fav: null, mean: null, n: 2 },
  totalResponded: 2,
  participationRate: 40,
});
const pulse = computePulse({ depts: [deptX, deptY, deptZ], salary: SALARY });
const outX = pulse.get('X')!;
const outY = pulse.get('Y')!;
const outZ = pulse.get('Z')!;

const lidX = outX.driverAnalysis.find((d) => d.driver === 'liderazgo')!;
check('X.liderazgo: impact 1 (compañía), gap -25, priority 25, focus_area, champion Y (+35pp)',
  {
    impact: lidX.impact, gap: lidX.gap, priority: lidX.priority,
    cls: lidX.classification, champion: lidX.champion, gapBasis: lidX.gapBasis,
  },
  {
    impact: 1, gap: -25, priority: 25, cls: 'focus_area',
    champion: { departmentId: 'Y', fav: 85, transferGapPp: 35 }, gapBasis: 'fixed_target',
  });
const desX = outX.driverAnalysis.find((d) => d.driver === 'desarrollo')!;
check('X.desarrollo (carried): impact null, gap -35, monitor, momentum null',
  { carried: desX.carried, impact: desX.impact, gap: desX.gap, cls: desX.classification, mom: desX.momentumState },
  { carried: true, impact: null, gap: -35, cls: 'monitor', mom: null });
check('X: topFocusArea=liderazgo (carried EXCLUIDO pese a gap mayor), topStrength null',
  { focus: outX.topFocusArea, strength: outX.topStrength },
  { focus: 'liderazgo', strength: null });
check('X: riskZone naranja (eiFav 60)', outX.riskZone, 'naranja');
check('X: theatre false (ISA 80, eiFav 60 no es <50)', outX.correlationFlags.theatreDetected, false);
check('X: hotspot null (solo 2 deptos con EI < mínimo 4)',
  outX.correlationFlags.hotspot.isHotspot, null);
check('X: climaTurnover no evaluable (sin turnoverRate)',
  outX.correlationFlags.climaTurnover, { pearsonR: null, nDepts: 0, evaluable: false });
check('X: sin business cases (liderazgo mean 3.0 no es <3.0, EI 3.2 sano, carried excluido)',
  outX.correlationFlags.businessCases, []);

const lidY = outY.driverAnalysis.find((d) => d.driver === 'liderazgo')!;
check('Y.liderazgo: gap +10, strength, champion null (Y ES el campeón)',
  { gap: lidY.gap, cls: lidY.classification, champion: lidY.champion },
  { gap: 10, cls: 'strength', champion: null });
check('Y: topStrength=liderazgo, riskZone verde',
  { strength: outY.topStrength, zone: outY.riskZone }, { strength: 'liderazgo', zone: 'verde' });
check('Y: theatre null (sin ISA)', outY.correlationFlags.theatreDetected, null);

const lidZ = outZ.driverAnalysis.find((d) => d.driver === 'liderazgo')!;
check('Z (privacy): fila completa con todo null + riskZone null',
  {
    fav: lidZ.fav, impact: lidZ.impact, gap: lidZ.gap, priority: lidZ.priority,
    cls: lidZ.classification, champion: lidZ.champion, zone: outZ.riskZone,
    focus: outZ.topFocusArea,
  },
  { fav: null, impact: null, gap: null, priority: null, cls: null, champion: null, zone: null, focus: null });
check('flags con version 1 y computedAt ISO',
  outX.correlationFlags.version === 1 && !Number.isNaN(Date.parse(outX.correlationFlags.computedAt)), true);

// Read-time: rankMomentumMovers (nota Victor — patrón TopMoversPanel)
console.log('\nS11 — read-time rankMomentumMovers');
check('gainers/decliners ordenados, null y ceros excluidos',
  rankMomentumMovers([
    { departmentId: 'a', momentum: 8 },
    { departmentId: 'b', momentum: -12 },
    { departmentId: 'c', momentum: null },
    { departmentId: 'd', momentum: 3 },
    { departmentId: 'e', momentum: -4 },
    { departmentId: 'f', momentum: 0 },
  ]),
  {
    gainers: [{ departmentId: 'a', momentum: 8 }, { departmentId: 'd', momentum: 3 }],
    decliners: [{ departmentId: 'b', momentum: -12 }, { departmentId: 'e', momentum: -4 }],
  });

// Resumen ─────────────────────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(60)}`);
console.log(failed === 0 ? `✅ SMOKE PASS ${passed}/${passed}` : `❌ SMOKE FAIL — ${failed} fallidos de ${passed + failed}`);
process.exit(failed === 0 ? 0 : 1);
