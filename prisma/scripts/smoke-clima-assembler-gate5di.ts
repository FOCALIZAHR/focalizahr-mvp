// Smoke PURO (sin DB) — Gate 5D-i GROUP A: assembler + pipe al builder.
// Verifica: (1) mapeo driverAnalysis→drivers, (2) reactives filtrados por category,
// (3) businessCases passthrough, (4) pipe a buildClimaPlanDecisions no-vacío con
// reactivo bajo tier, (5) vacío con reactiveAnalysis vacío (Tipo 3 "sin datos").
// Correr: npx tsx prisma/scripts/smoke-clima-assembler-gate5di.ts

import {
  assembleClimaDecisionInputs,
  assembleDeptDecisionInput,
  type AssemblerRow,
} from '@/lib/services/clima/assembleClimaDecisionInputs';
import { buildClimaPlanDecisions } from '@/lib/services/clima/ClimaActionPlanBuilder';
import type {
  DriverImpact,
  ReactiveImpact,
  ClimaCorrelationFlags,
  PulseBusinessCase,
} from '@/lib/services/clima/PulseEngine';

let pass = 0;
let fail = 0;
function assert(cond: boolean, msg: string) {
  if (cond) {
    pass++;
    console.log(`  ✅ ${msg}`);
  } else {
    fail++;
    console.log(`  ❌ ${msg}`);
  }
}

// ── Builders mínimos con defaults (todos los campos requeridos por los tipos) ──
function driver(p: Partial<DriverImpact> & { driver: string }): DriverImpact {
  return {
    fav: 60,
    mean: 3.0,
    n: 30,
    carried: false,
    impact: 0.4,
    gap: -15,
    gapBasis: 'fixed_target',
    priority: 6,
    classification: 'focus_area',
    momentumDelta: null,
    momentumState: null,
    meanMomentumDelta: null,
    champion: null,
    ...p,
  };
}
function reactive(
  p: Partial<ReactiveImpact> & { reactive: string; category: string }
): ReactiveImpact {
  return {
    fav: 55,
    mean: 3.0,
    n: 30,
    impact: 0.4,
    impactSource: 'company',
    impactLevelDeptId: null,
    gap: -20,
    priority: 8,
    reactiveMomentumDelta: null,
    reactiveMomentumState: null,
    ...p,
  };
}
const BC: PulseBusinessCase = {
  type: 'liderazgo_gap',
  severity: 'alta',
  driver: 'liderazgo',
  triggerScore: 3.0,
  peopleAtRisk: 8,
  turnoverRiskPct: 18,
  potentialAnnualLossCLP: 144_000_000,
  recommendedInvestmentCLP: 10_000_000,
  estimatedROIPct: 120,
  paybackMonths: 3,
  salarySource: 'default_chile',
  confidence: 'media',
  assumptions: [],
};
function flags(businessCases: PulseBusinessCase[]): ClimaCorrelationFlags {
  return {
    version: 1,
    theatreDetected: null,
    theatre: { isaScore: null, engagementFav: null, evaluable: false },
    hotspot: {
      isHotspot: null,
      eiFav: null,
      p25CompanyEiFav: null,
      deptsInSample: 0,
      headcountAvg: null,
      turnoverRate: null,
      confidence: 'low',
    },
    climaTurnover: { pearsonR: null, nDepts: 0, evaluable: false },
    businessCases,
    computedAt: '2026-07-18T00:00:00.000Z',
  };
}

// ── S1: mapeo driverAnalysis→drivers + reactives filtrados por category ──
console.log('S1 · mapeo + filtrado de reactives por category');
const rowMixed: AssemblerRow = {
  departmentId: 'dep-1',
  departmentName: 'Ventas',
  driverAnalysis: [driver({ driver: 'liderazgo' }), driver({ driver: 'satisfaccion' })],
  reactiveAnalysis: [
    reactive({ reactive: 'feedback', category: 'liderazgo', mean: 3.0 }),
    reactive({ reactive: 'reconocimiento_jefe', category: 'liderazgo', mean: 3.2 }),
    reactive({ reactive: 'clima_general', category: 'satisfaccion', mean: 3.4 }),
  ],
  correlationFlags: flags([BC]),
};
const input = assembleDeptDecisionInput(rowMixed);
assert(input.drivers.length === 2, 'arma 2 drivers');
const lid = input.drivers.find((d) => d.category === 'liderazgo')!;
const sat = input.drivers.find((d) => d.category === 'satisfaccion')!;
assert(lid.reactives.length === 2, 'liderazgo recibe SUS 2 reactives');
assert(
  lid.reactives.every((r) => ['feedback', 'reconocimiento_jefe'].includes(r.reactive)),
  'liderazgo NO recibe reactives de otra dimensión'
);
assert(sat.reactives.length === 1 && sat.reactives[0].reactive === 'clima_general', 'satisfaccion recibe solo el suyo');
assert(lid.reactives[0].mean === 3.0 && lid.reactives[0].reactive === 'feedback', 'reshape {reactive,impact,gap,mean} correcto');
assert(input.businessCases.length === 1 && input.businessCases[0].type === 'liderazgo_gap', 'businessCases passthrough desde correlationFlags');

// ── S2: pipe al builder — reactivo bajo tier → decisiones no-vacías ──
console.log('S2 · pipe a buildClimaPlanDecisions (bajo tier → dispara)');
const decisiones = buildClimaPlanDecisions([input]);
assert(decisiones.length >= 1, 'genera ≥1 decisión (reactivo bajo tier dispara)');
assert(
  decisiones.every((d) => d.triggerRef.startsWith('clima:dep-1:')),
  'triggerRef estable clima:${dept}:${category}'
);

// ── S3: reactiveAnalysis vacío/null → 0 items (Tipo 3 "sin datos") ──
console.log('S3 · reactiveAnalysis vacío → sin decisiones (Tipo 3)');
const rowEmpty: AssemblerRow = {
  departmentId: 'dep-2',
  departmentName: 'Bodega',
  driverAnalysis: [driver({ driver: 'liderazgo' })],
  reactiveAnalysis: [],
  correlationFlags: flags([]),
};
const rowNull: AssemblerRow = {
  departmentId: 'dep-3',
  departmentName: 'Sin insight',
  driverAnalysis: null,
  reactiveAnalysis: null,
  correlationFlags: null,
};
const emptyOut = buildClimaPlanDecisions(assembleClimaDecisionInputs([rowEmpty, rowNull]));
assert(emptyOut.length === 0, 'reactiveAnalysis vacío/null → 0 decisiones (no error)');
assert(assembleDeptDecisionInput(rowNull).drivers.length === 0, 'driverAnalysis null → drivers:[] sin romper');
assert(assembleDeptDecisionInput(rowNull).businessCases.length === 0, 'correlationFlags null → businessCases:[]');

// ── S4: guardas de isSystemic (piso denominador ≥3 + numerador ≥2) ──
// Reproduce el escenario REAL de GATE4_LOBBY_DEMO: dimensiones de 1-2 reactivos
// medidos, 100% bajo tier, salían sistémicas por aritmética del denominador.
console.log('S4 · guardas isSystemic (measured≥3 Y belowTier≥2)');

function decideSingle(driverCat: string, reactives: ReactiveImpact[]) {
  const row: AssemblerRow = {
    departmentId: 'dep-x',
    driverAnalysis: [driver({ driver: driverCat })],
    reactiveAnalysis: reactives,
    correlationFlags: flags([]),
  };
  const out = buildClimaPlanDecisions([assembleDeptDecisionInput(row)]);
  return out.find((d) => d.category === driverCat) ?? null;
}

// S4a — 1 reactivo medido, 100% bajo tier (comunicacion=3.0). Antes: 1/1=100% sistémico.
const s4a = decideSingle('comunicacion', [
  reactive({ reactive: 'comunicacion', category: 'comunicacion', mean: 3.0, impact: 0.4 }),
]);
assert(s4a !== null, 'S4a dispara (reactivo bajo tier)');
assert(s4a?.isSystemic === false, 'S4a 1 reactivo 100% bajo tier → NO sistémico (individual)');

// S4b — 2 reactivos medidos, ambos bajo tier (satisfaccion). Antes: 2/2=100% sistémico.
const s4b = decideSingle('satisfaccion', [
  reactive({ reactive: 'equilibrio', category: 'satisfaccion', mean: 3.1, impact: 0.4 }),
  reactive({ reactive: 'satisfaccion', category: 'satisfaccion', mean: 3.1, impact: 0.4 }),
]);
assert(s4b !== null, 'S4b dispara');
assert(s4b?.isSystemic === false, 'S4b 2 reactivos 100% bajo tier → NO sistémico (individual)');

// S4c — control positivo: 3 reactivos, todos bajo tier (crisis real de liderazgo). Sigue sistémico.
const s4c = decideSingle('liderazgo', [
  reactive({ reactive: 'feedback', category: 'liderazgo', mean: 2.7, impact: 0.4 }),
  reactive({ reactive: 'desarrollo', category: 'liderazgo', mean: 2.7, impact: 0.4 }),
  reactive({ reactive: 'claridad', category: 'liderazgo', mean: 3.2, impact: 0.4 }),
]);
assert(s4c?.isSystemic === true, 'S4c 3 reactivos bajo tier (crisis real) → SIGUE sistémico');

// S4d — borde: 3 medidos, 2 bajo tier (ratio 67%, cumple ambas guardas) → sistémico.
const s4d = decideSingle('autonomia', [
  reactive({ reactive: 'colaboracion', category: 'autonomia', mean: 2.7, impact: 0.4 }),
  reactive({ reactive: 'condiciones', category: 'autonomia', mean: 3.1, impact: 0.4 }),
  reactive({ reactive: 'voz', category: 'autonomia', mean: 4.2, impact: 0.4 }),
]);
assert(s4d?.isSystemic === true, 'S4d 2/3 bajo tier (measured≥3, belowTier≥2, ratio≥0.5) → sistémico');

console.log(`\n${fail === 0 ? '✅' : '❌'} Smoke assembler: ${pass} pass / ${fail} fail`);
process.exitCode = fail === 0 ? 0 : 1;
