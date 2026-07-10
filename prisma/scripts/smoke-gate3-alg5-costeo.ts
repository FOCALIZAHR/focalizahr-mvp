// prisma/scripts/smoke-gate3-alg5-costeo.ts
// ════════════════════════════════════════════════════════════════════════════
// SMOKE corrección Gate 3 (ALG5) — costeo con rotación real + salario por
// acotadoGroup. Fixtures puros sobre buildBusinessCases (exported). Cubre:
//   (a) turnoverRate real · (b) salidas voluntarias 12m (≥1) · (c) fallback score
//   · salario por depto (2 salarios → 2 costos) · exclusión CORRECTA
//   liderazgo_gap↔clima_critico mismo driver · coexistencia clima_critico +
//   retencion_riesgo (NO excluidos, comportamiento correcto).
//
// Correr:  npx tsx prisma/scripts/smoke-gate3-alg5-costeo.ts
// ════════════════════════════════════════════════════════════════════════════

import { buildBusinessCases, type PulseDeptInput } from '../../src/lib/services/clima/PulseEngine';
import { LEADERSHIP_DRIVER } from '../../src/lib/services/clima/climaThresholds';
import type { DriverScore, FavorabilityScore } from '../../src/lib/services/clima/FavorabilityCalculator';
import type { SalaryResult } from '../../src/lib/services/SalaryConfigService';

let passed = 0;
let failed = 0;
function eq(name: string, actual: unknown, expected: unknown) {
  const ok = actual === expected;
  if (ok) { passed++; console.log(`  ✓ ${name}`); }
  else { failed++; console.log(`  ✗ ${name} — esperado ${JSON.stringify(expected)}, obtuve ${JSON.stringify(actual)}`); }
}
function ok(name: string, cond: boolean) { eq(name, cond, true); }

const dS = (mean: number, n = 10): DriverScore => ({ fav: mean * 20, mean, n, carried: false });
const mkSalary = (monthly: number): SalaryResult => ({
  monthlySalary: monthly, annualSalary: monthly * 12, source: 'empresa_nivel',
  confidence: 'high', metadata: { accountId: 'acc', configuredByClient: true },
});
const turnoverCost = (monthly: number) => monthly * 12 * 1.25; // multiplier default (sin acotadoGroup)

function mkDept(o: {
  drivers?: Record<string, DriverScore>;
  eiMean?: number | null;
  turnoverRate?: number | null;
  voluntaryExits12mo?: number | null;
  headcountAvg?: number | null;
  salary?: SalaryResult;
}): PulseDeptInput {
  const ei: FavorabilityScore = { fav: 60, mean: o.eiMean ?? 4.0, n: 10 };
  return {
    departmentId: 'd', driverScores: o.drivers ?? { satisfaccion: dS(2.0) },
    ei, momentum: null, rows: [], prevDriverScores: null,
    turnoverRate: o.turnoverRate ?? null, headcountAvg: o.headcountAvg ?? 50,
    isaScore: null, totalResponded: 10, participationRate: 80,
    voluntaryExits12mo: o.voluntaryExits12mo ?? null, salary: o.salary ?? mkSalary(1_000_000),
  };
}

const find = (cs: ReturnType<typeof buildBusinessCases>, t: string) => cs.find((c) => c.type === t);

// ── T1 · rama (a) tasa real cambia el número vs (c) score ────────────────────
console.log('\nT1 · rama (a) usa turnoverRate real (no el score)');
{
  const a = find(buildBusinessCases(mkDept({ turnoverRate: 20, headcountAvg: 50 })), 'clima_critico')!;
  const c = find(buildBusinessCases(mkDept({ turnoverRate: null, voluntaryExits12mo: 0, headcountAvg: 50 })), 'clima_critico')!;
  eq('(a) peopleAtRisk = ceil(50·0.20) = 10', a.peopleAtRisk, 10);
  eq('(a) costo = 10 · turnoverCost(1M)', a.potentialAnnualLossCLP, 10 * turnoverCost(1_000_000));
  ok('(a) assumption menciona tasa real', a.assumptions.some((s) => /tasa de rotación real/i.test(s)));
  eq('(c) peopleAtRisk = ceil(50·0.45) = 23 (score-derived)', c.peopleAtRisk, 23);
  ok('(a) ≠ (c) — el número cambió respecto al score', a.peopleAtRisk !== c.peopleAtRisk);
}

// ── T2 · rama (b) conteo de salidas voluntarias (≥1, sin umbral) ─────────────
console.log('\nT2 · rama (b) salidas voluntarias 12m');
{
  const b = find(buildBusinessCases(mkDept({ turnoverRate: null, voluntaryExits12mo: 1, headcountAvg: 50 })), 'clima_critico')!;
  eq('(b) peopleAtRisk = conteo real = 1', b.peopleAtRisk, 1);
  ok('(b) assumption menciona 1 salida voluntaria registrada',
    b.assumptions.some((s) => /1 salida voluntaria registrada.*12 meses/i.test(s)));
}

// ── T3 · rama (c) fallback score (sin datos duros ni Exit) ───────────────────
console.log('\nT3 · rama (c) fallback score sin cambios');
{
  const c = find(buildBusinessCases(mkDept({ turnoverRate: null, voluntaryExits12mo: 0 })), 'clima_critico')!;
  eq('(c) peopleAtRisk = 23', c.peopleAtRisk, 23);
  ok('(c) assumption menciona score + Gallup', c.assumptions.some((s) => /score.*Gallup/i.test(s)));
}

// ── T4 · salario por acotadoGroup → costos distintos ─────────────────────────
console.log('\nT4 · salario por depto (2 grupos → 2 costos)');
{
  const alta = find(buildBusinessCases(mkDept({ turnoverRate: 20, headcountAvg: 50, salary: mkSalary(3_000_000) })), 'clima_critico')!;
  const base = find(buildBusinessCases(mkDept({ turnoverRate: 20, headcountAvg: 50, salary: mkSalary(1_000_000) })), 'clima_critico')!;
  eq('costo alta_gerencia = 10 · turnoverCost(3M)', alta.potentialAnnualLossCLP, 10 * turnoverCost(3_000_000));
  eq('costo base = 10 · turnoverCost(1M)', base.potentialAnnualLossCLP, 10 * turnoverCost(1_000_000));
  ok('costos DISTINTOS (ya no comparten promedio de empresa)', alta.potentialAnnualLossCLP !== base.potentialAnnualLossCLP);
}

// ── T5 · exclusión CORRECTA: liderazgo_gap ↔ clima_critico mismo driver ──────
console.log('\nT5 · liderazgo_gap ↔ clima_critico (nunca doble costo sobre liderazgo)');
{
  // 5a: liderazgo es el peor <2.5, sin otro <2.5 → liderazgo_gap, NO clima_critico.
  const only = buildBusinessCases(mkDept({ drivers: { [LEADERSHIP_DRIVER]: dS(2.0), satisfaccion: dS(3.2) }, eiMean: 4.0 }));
  ok('5a · emite liderazgo_gap', !!find(only, 'liderazgo_gap'));
  ok('5a · NO emite clima_critico (liderazgo excluido, no hay otro <2.5)', !find(only, 'clima_critico'));
  // 5b: liderazgo <2.5 + otro driver peor → clima_critico toma el SIGUIENTE, no liderazgo.
  const both = buildBusinessCases(mkDept({ drivers: { [LEADERSHIP_DRIVER]: dS(2.0), satisfaccion: dS(1.5) }, eiMean: 4.0 }));
  ok('5b · emite liderazgo_gap', !!find(both, 'liderazgo_gap'));
  eq('5b · clima_critico es del SIGUIENTE peor (satisfaccion), no liderazgo', find(both, 'clima_critico')?.driver, 'satisfaccion');
}

// ── T6 · clima_critico + retencion_riesgo COEXISTEN (no excluidos) ───────────
console.log('\nT6 · clima_critico + retencion_riesgo coexisten (correcto)');
{
  const cs = buildBusinessCases(mkDept({ drivers: { satisfaccion: dS(2.0), liderazgo: dS(4.0) }, eiMean: 2.5 }));
  ok('emite clima_critico (driver <2.5)', !!find(cs, 'clima_critico'));
  ok('emite retencion_riesgo (EI <3.0)', !!find(cs, 'retencion_riesgo'));
  ok('ambos coexisten — 2 costos, ejes ortogonales (NO exclusión)',
    !!find(cs, 'clima_critico') && !!find(cs, 'retencion_riesgo'));
}

console.log(`\n${'─'.repeat(60)}`);
console.log(`SMOKE Gate3 ALG5 costeo: ${passed} PASS · ${failed} FAIL`);
if (failed > 0) process.exit(1);
console.log('✅ Corrección Gate 3 (rotación real + salario por acotadoGroup) verde.\n');
