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
  reactiveImpactCorrelation,
  reactiveImpactsForRows,
  MOMENTUM_GROWING_PP,
  MOMENTUM_DECLINING_PP,
  type PulseDeptInput,
} from '../../src/lib/services/clima/PulseEngine';
import { buildDeptClimaDecisions } from '../../src/lib/services/clima/ClimaActionPlanBuilder';
import { reactiveMeanTarget } from '../../src/lib/services/clima/climaThresholds';
import type { DriverScore, ClimaResponseRow } from '../../src/lib/services/clima/FavorabilityCalculator';
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

  // ── P2.e — piso de impacto: un reactivo ruidoso NO gana como palanca aunque su mean sea peor ──
  console.log('\n── P2.e: REACTIVE_MIN_IMPACT excluye ruido de la palanca ──');
  const dimFloor: ClimaDeptDecisionInput = {
    departmentId: 'dF', drivers: [{
      category: 'satisfaccion', fav: 50, gap: -25, impact: 0.5, momentumDelta: null, classification: 'focus_area',
      reactives: [
        // ruido: impact 0.15 (< 0.20) + mean pésimo 1.5 → SIN piso ganaría (0.15×1.8=0.27); CON piso no compite
        rc('carga_trabajo', 1.5, 20, 0.15),
        rc('estres', 3.1, 78, 0.5),          // significativo: priorityMean 0.5×0.2=0.10
        rc('seguridad', 3.8, 80, 0.4),
        rc('energia', 3.9, 82, 0.4),
        rc('preocupacion_empresa', 3.7, 79, 0.4),
      ],
    }], businessCases: [],
  };
  const itemsFloor = buildDeptClimaDecisions(dimFloor);
  assert(itemsFloor[0]?.selectedReactive === 'estres',
    `palanca = estres; carga_trabajo (impact 0.15 < piso) NO gana pese a su mean 1.5`);
  assert(itemsFloor[0]?.isSystemic === false, `2/5 bajo tier → NO sistémico`);

  // ── P2.f — ningún reactivo supera el piso → dispara igual pero SIN palanca (celda default) ──
  console.log('\n── P2.f: ningún reactivo significativo → default sin selectedReactive ──');
  const dimAllNoise: ClimaDeptDecisionInput = {
    departmentId: 'dN', drivers: [{
      category: 'satisfaccion', fav: 55, gap: -20, impact: 0.5, momentumDelta: null, classification: 'focus_area',
      reactives: [
        rc('carga_trabajo', 3.0, 40, 0.10),  // bajo tier pero impact < piso
        rc('estres', 3.1, 45, 0.05),         // bajo tier pero impact < piso
        rc('seguridad', 3.8, 80, 0.4),
        rc('energia', 3.9, 82, 0.4),
        rc('preocupacion_empresa', 3.7, 79, 0.4),
      ],
    }], businessCases: [],
  };
  const itemsNoise = buildDeptClimaDecisions(dimAllNoise);
  assert(itemsNoise.length === 1, `dispara igual (la dimensión tiene reactivos bajo su tier)`);
  assert(itemsNoise[0]?.selectedReactive === null, `sin reactivo significativo → selectedReactive null`);
  assert(itemsNoise[0]?.isSystemic === false && !!itemsNoise[0]?.intervention.narrative.includes('Satisfacción'),
    `celda DEFAULT de dimensión (narrativa satisfaccion base, no variante)`);

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

  // ── P4 — reactiveImpactCorrelation (Kendall's Tau-c) unit ──
  console.log('\n── P4: reactiveImpactCorrelation (Tau-c) unit ──');
  const perfPos = Array.from({ length: 30 }, (_, i) => ({ x: (i % 5) + 1, y: (i % 5) + 1 }));
  const perfNeg = Array.from({ length: 30 }, (_, i) => ({ x: (i % 5) + 1, y: 5 - (i % 5) }));
  assert(reactiveImpactCorrelation(perfPos) === 1, `concordancia perfecta (x=y) → Tau-c = 1.0`);
  assert(reactiveImpactCorrelation(perfNeg) === -1, `discordancia perfecta → Tau-c = -1.0`);
  assert(reactiveImpactCorrelation(perfPos.slice(0, 10)) === null, `n=10 < REACTIVE_LOCAL_MIN_N(25) → null`);
  assert(reactiveImpactCorrelation(Array.from({ length: 30 }, () => ({ x: 3, y: 4 }))) === 0, `sin variación → 0`);

  // ── P5 — wiring: reactiveImpactsForRows usa Tau-c (:483) sobre filas reales ──
  console.log('\n── P5: reactiveImpactsForRows → Tau-c (swap del :483) ──');
  const mkRow = (pid: string, cat: string, sub: string | null, rating: number): ClimaResponseRow => ({
    rating, participantId: pid, questionCategory: cat,
    questionTier: cat === 'engagement_index' ? 'ENGAGEMENT_INDEX' : 'CORE',
    responseType: 'rating_scale', isBenchmarkable: true, departmentId: 'd1', acotadoGroup: null, subcategory: sub,
  });
  const rows: ClimaResponseRow[] = [];
  for (let i = 0; i < 26; i++) { const v = (i % 5) + 1; rows.push(mkRow(`p${i}`, 'engagement_index', null, v)); rows.push(mkRow(`p${i}`, 'satisfaccion', 'carga_trabajo', v)); }
  const impacts = reactiveImpactsForRows(rows);
  assert(impacts.get('carga_trabajo') === 1, `carga_trabajo (reactivo×EI perfecto, n=26) → Tau-c 1.0`);
  const fewRows = rows.slice(0, 10 * 2); // 10 participantes < 25
  assert(reactiveImpactsForRows(fewRows).get('carga_trabajo') === null, `n=10 pares < 25 → impact null`);

  // ── P6 — flips reales Pearson→Tau-c (valores del análisis empírico sobre los 36 insights) ──
  console.log('\n── P6: la palanca cambia Pearson vs Tau-c (3 casos reales) ──');
  const palancaOf = (dim: ClimaDeptDecisionInput) => buildDeptClimaDecisions(dim)[0]?.selectedReactive ?? null;
  const dimOf = (category: string, reactives: ReactiveContextEntry[]): ClimaDeptDecisionInput => ({
    departmentId: 'dx', drivers: [{ category, fav: 50, gap: -25, impact: 0.3, momentumDelta: null, classification: 'focus_area', reactives }], businessCases: [],
  });
  const above = [rc('a1', 3.8, 80, 0.4), rc('a2', 3.9, 82, 0.4), rc('a3', 3.7, 79, 0.4)]; // sobre tier (3.6)

  // Flip 1 — crecimiento: utilizacion(P0.30/T0.22, gap-0.2) vs oportunidades(P0.17/T0.22, gap-0.5)
  const crecP = dimOf('crecimiento', [rc('utilizacion', 3.4, 40, 0.30), rc('oportunidades', 3.1, 40, 0.17), ...above]);
  const crecT = dimOf('crecimiento', [rc('utilizacion', 3.4, 40, 0.22), rc('oportunidades', 3.1, 40, 0.22), ...above]);
  assert(palancaOf(crecP) === 'utilizacion', `crecimiento Pearson → utilizacion (oportunidades 0.17 < piso)`);
  assert(palancaOf(crecT) === 'oportunidades', `crecimiento Tau-c → oportunidades (ambos 0.22, mayor gap)`);

  // Flip 2 — liderazgo: feedback(P0.30/T0.22, gap-0.6) vs desarrollo(P0.31/T0.32, gap-0.5)
  const lidP = dimOf('liderazgo', [rc('feedback', 3.0, 40, 0.30), rc('desarrollo', 3.1, 40, 0.31), ...above]);
  const lidT = dimOf('liderazgo', [rc('feedback', 3.0, 40, 0.22), rc('desarrollo', 3.1, 40, 0.32), ...above]);
  assert(palancaOf(lidP) === 'feedback', `liderazgo Pearson → feedback (0.18 > 0.155)`);
  assert(palancaOf(lidT) === 'desarrollo', `liderazgo Tau-c → desarrollo (0.16 > 0.132)`);

  // Flip 3 — autonomia borderline: colaboracion(P0.16/T0.21, gap-0.2), único bajo tier
  const autP = dimOf('autonomia', [rc('colaboracion', 3.4, 40, 0.16), rc('a1', 3.8, 80, 0.4), rc('a2', 3.9, 82, 0.4)]);
  const autT = dimOf('autonomia', [rc('colaboracion', 3.4, 40, 0.21), rc('a1', 3.8, 80, 0.4), rc('a2', 3.9, 82, 0.4)]);
  assert(palancaOf(autP) === null, `autonomia Pearson → ninguna (colaboracion 0.16 < piso → celda default)`);
  assert(palancaOf(autT) === 'colaboracion', `autonomia Tau-c → colaboracion (0.21 cruza el piso 0.20)`);

  console.log(`\n${failed === 0 ? '✅ PASS' : '❌ FAIL'} — ${passed} ok · ${failed} fail\n`);
  if (failed > 0) process.exitCode = 1;
}

main();
