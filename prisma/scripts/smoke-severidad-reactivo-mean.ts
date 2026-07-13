// prisma/scripts/smoke-severidad-reactivo-mean.ts
// Smoke PURO (sin DB — no toca producción) del gate Severidad/Trigger reactivo + mean.
// Cubre las 3 piezas construidas:
//   P1  momentum reactivo (reactiveMomentumDelta/State) vía computePulse.
//   P2  Cluster A: disparo/severidad por reactivo+mean (priorityMean, circular, sistémico, tier).
//   P3  fix 5C: meanMomentumDelta vs momentumDelta-fav → el veredicto se invierte.
// La lógica de decisión vive toda en funciones puras; el cableado de BD (2 campos en
// ClimaAggregationService) queda cubierto por tsc. Borrar al sellar.
//
// Uso: npx tsx prisma/scripts/smoke-severidad-reactivo-mean.ts

import {
  computePulse,
  calcDriverMomentum,
  MOMENTUM_GROWING_PP,
  MOMENTUM_DECLINING_PP,
  type PulseDeptInput,
} from '../../src/lib/services/clima/PulseEngine';
import { buildDeptClimaDecisions } from '../../src/lib/services/clima/ClimaActionPlanBuilder';
import { reactiveMeanTarget } from '../../src/lib/services/clima/climaThresholds';
import type { DriverScore } from '../../src/lib/services/clima/FavorabilityCalculator';
import type { ClimaDeptDecisionInput, ReactiveContextEntry } from '../../src/types/clima-planes';

let passed = 0;
let failed = 0;
function assert(cond: boolean, label: string) {
  if (cond) { passed++; console.log(`  ✅ ${label}`); }
  else { failed++; console.error(`  ❌ ${label}`); }
}

// Reactivo del contexto del builder. `fav` es solo para derivar el gap fav (referencia
// Dynamic Impact); no se almacena. `mean` es la base de la severidad de este gate.
const rc = (reactive: string, mean: number, fav: number, impact: number): ReactiveContextEntry => ({
  reactive, mean, gap: Math.round((fav - 75) * 10) / 10, impact,
});

function main() {
  console.log('\n🔬 Smoke Severidad/Trigger reactivo + mean (PURO)\n');

  // ── P2.a — priorityMean elige distinto que priority-fav (ceguera de fav) ──
  console.log('── P2.a: reactivo-palanca por priorityMean vs priority-fav ──');
  // estres: mean 2.9 (bajo tier 3.3) pero fav 78 (SANO por fav) → fav lo ignora, mean lo captura.
  // carga_trabajo: mean 3.0 (bajo tier 3.3), fav 40 (fav-gap -35) → fav lo priorizaría.
  const dimA: ClimaDeptDecisionInput = {
    departmentId: 'dA', departmentName: 'A',
    drivers: [{
      category: 'satisfaccion', fav: 55, gap: -20, impact: 0.5, momentumDelta: null, classification: 'focus_area',
      reactives: [
        rc('carga_trabajo', 3.0, 40, 0.5), // gapMean -0.3 · priorityMean 0.15 · priorityFav 17.5
        rc('estres', 2.9, 78, 0.6),         // gapMean -0.4 · priorityMean 0.24 · priorityFav 1.8
        rc('seguridad', 3.8, 80, 0.4),      // sobre tier
        rc('preocupacion_empresa', 3.7, 79, 0.4), // sobre tier
        rc('energia', 3.9, 82, 0.4),        // sobre tier
      ],
    }],
    businessCases: [],
  };
  const itemsA = buildDeptClimaDecisions(dimA);
  assert(itemsA.length === 1, `satisfaccion dispara 1 ítem (got ${itemsA.length})`);
  assert(itemsA[0]?.selectedReactive === 'estres',
    `palanca = estres por priorityMean 0.24 (fav habría elegido carga_trabajo por 17.5)`);
  assert(itemsA[0]?.isSystemic === false, `2/5 bajo tier → NO sistémico`);
  // estres gapMean -0.4 → naranja (< -0.3)
  assert(itemsA[0]?.intervention.level === 'naranja', `severidad naranja por gapMean -0.4 (got ${itemsA[0]?.intervention.level})`);

  // ── P2.b — sistémico ≥50% ──
  console.log('\n── P2.b: escalamiento sistémico ≥50% ──');
  const dimSys: ClimaDeptDecisionInput = {
    departmentId: 'dS', drivers: [{
      category: 'comunicacion', fav: 50, gap: -25, impact: 0.5, momentumDelta: null, classification: 'focus_area',
      reactives: [
        rc('comunicacion_interna', 3.2, 55, 0.5),
        rc('colaboracion_interdepartamental', 3.3, 58, 0.4),
        rc('expresion_libre', 3.4, 60, 0.3),
      ], // 3/3 bajo TIER_ESTANDAR 3.6 → sistémico
    }], businessCases: [],
  };
  const itemsSys = buildDeptClimaDecisions(dimSys);
  assert(itemsSys[0]?.isSystemic === true, `3/3 bajo tier → sistémico`);
  assert(!!itemsSys[0]?.intervention.narrative.includes('3 de 3 reactivos de comunicacion'),
    `narrativa sistémica interpola {n}/{total}/{categoría}`);
  assert(itemsSys[0]?.intervention.suggestedProduct === 'Revisar con RRHH', `producto sistémico`);

  // ── P2.c — exclusión circular + fallback tier ──
  console.log('\n── P2.c: circulares excluidos + fallback tier ──');
  const dimCirc: ClimaDeptDecisionInput = {
    departmentId: 'dC', drivers: [{
      category: 'satisfaccion', fav: 50, gap: -25, impact: 0.5, momentumDelta: null, classification: 'focus_area',
      reactives: [
        rc('retencion', 1.5, 20, 0.9),           // circular
        rc('recomendacion', 1.5, 20, 0.9),       // circular
        rc('orgullo', 1.5, 20, 0.9),             // circular
        rc('experiencia_general', 1.5, 20, 0.9), // circular (4º)
        rc('carga_trabajo', 3.0, 40, 0.5),       // único no-circular medido, bajo tier
      ],
    }], businessCases: [],
  };
  const itemsCirc = buildDeptClimaDecisions(dimCirc);
  assert(itemsCirc[0]?.selectedReactive === 'carga_trabajo',
    `palanca = carga_trabajo (los 4 circulares no compiten)`);
  assert(!!itemsCirc[0]?.intervention.narrative.includes('1 de 1'),
    `denominador = 1 (circulares NO cuentan para el ratio)`);
  assert(reactiveMeanTarget('beneficios') === 3.3, `beneficios → TIER_RECURSOS 3.3`);
  assert(reactiveMeanTarget('subcat_inexistente') === 3.6, `no listada → fallback TIER_ESTANDAR 3.6`);

  // ── P2.d — no dispara si ningún reactivo bajo su tier ──
  console.log('\n── P2.d: sin reactivo bajo tier → no dispara ──');
  const dimOk: ClimaDeptDecisionInput = {
    departmentId: 'dOk', drivers: [{
      category: 'liderazgo', fav: 80, gap: 5, impact: 0.3, momentumDelta: null, classification: 'strength',
      reactives: [rc('confianza', 4.0, 85, 0.5), rc('cuidado', 3.8, 80, 0.4)], // ambos sobre tier
    }], businessCases: [],
  };
  assert(buildDeptClimaDecisions(dimOk).length === 0, `dimensión sana (todo sobre tier) → 0 ítems`);

  // ── P1 — momentum reactivo (reactiveMomentumDelta/State) vía computePulse ──
  console.log('\n── P1: momentum reactivo (Δmean ≥0.2 declining / <0.2 stable) ──');
  const rs = (mean: number): DriverScore => ({ fav: 60, mean, n: 10, carried: false });
  const dept: PulseDeptInput = {
    departmentId: 'dM',
    driverScores: { satisfaccion: rs(3.0) },
    reactiveScores: { carga_trabajo: rs(3.0), seguridad: rs(3.5) },
    prevReactiveScores: { carga_trabajo: rs(3.4), seguridad: rs(3.45) }, // Δ carga -0.4 (declining) / seg +0.05 (stable)
    ei: { fav: 58, mean: 3.6, n: 10 },
    momentum: null, rows: [], prevDriverScores: null,
    turnoverRate: null, headcountAvg: 30, isaScore: null,
    totalResponded: 10, participationRate: 80, voluntaryExits12mo: null,
    salary: { monthlySalary: 1_000_000, annualSalary: 12_000_000, source: 'default_chile', confidence: 'low', metadata: { accountId: 'smoke', configuredByClient: false } },
  };
  const out = computePulse({ depts: [dept] }).get('dM');
  const ra = out?.reactiveAnalysis ?? [];
  const carga = ra.find((r) => r.reactive === 'carga_trabajo');
  const seg = ra.find((r) => r.reactive === 'seguridad');
  assert(carga?.reactiveMomentumDelta === -0.4, `carga_trabajo Δmean = -0.4 (got ${carga?.reactiveMomentumDelta})`);
  assert(carga?.reactiveMomentumState === 'declining', `Δ -0.4 ≤ -0.2 → declining`);
  assert(seg?.reactiveMomentumState === 'stable', `Δ 0.05 (<0.2) → stable (got ${seg?.reactiveMomentumState})`);

  // ── P3 — fix 5C: fav plano pero mean cae → el veredicto se invierte ──
  console.log('\n── P3: 5C — meanMomentumDelta invierte el veredicto vs momentumDelta-fav ──');
  const cur: DriverScore = { fav: 60, mean: 3.0, n: 10, carried: false };
  const prev: DriverScore = { fav: 60, mean: 3.4, n: 10, carried: false }; // fav igual, mean -0.4
  const mom = calcDriverMomentum(cur, prev);
  assert(mom.momentumDelta === 0, `momentumDelta-fav = 0 (fav no se movió)`);
  assert(mom.meanMomentumDelta === -10, `meanMomentumDelta = (3.0-3.4)×25 = -10 (got ${mom.meanMomentumDelta})`);
  // Réplica de classifyQuadrant (lado "vacío" → RIESGO_CRITICO si bajó): old vs new
  const droppedOld = (mom.momentumDelta ?? 0) <= MOMENTUM_DECLINING_PP; // -5
  const droppedNew = (mom.meanMomentumDelta ?? 0) <= MOMENTUM_DECLINING_PP;
  assert(droppedOld === false, `veredicto VIEJO (fav): no detecta caída → "plano"`);
  assert(droppedNew === true, `veredicto NUEVO (mean): detecta caída → RIESGO_CRITICO`);
  assert(MOMENTUM_GROWING_PP === 5 && MOMENTUM_DECLINING_PP === -5, `umbrales ±5 sellados reutilizados`);

  console.log(`\n${failed === 0 ? '✅ PASS' : '❌ FAIL'} — ${passed} ok · ${failed} fail\n`);
  if (failed > 0) process.exitCode = 1;
}

main();
