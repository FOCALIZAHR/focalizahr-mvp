// Smoke PURO (sin DB) — GATE_SYSTEMIC_8_NARRATIVAS_FALLBACK.
// Verifica: (1) las 8 dimensiones resuelven narrativa ESPECÍFICA (no la genérica antigua),
// (2) category desconocida cae al fallback sin lanzar ni retornar undefined,
// (3) reconocimiento/compensaciones no pueden disparar el camino sistémico hoy
//     (1 solo reactivo en el banco < piso de 3 medidos),
// (4) el resto del flujo intacto: sistémico siempre rutea a individual, shape del
//     item sin esfuerzo/efectividad, narrativa interpolada sin placeholders sueltos.
// Correr: npx tsx prisma/scripts/smoke-clima-systemic-narrativas.ts

import { getSystemicIntervention, CLIMA_DRIVER_CATEGORIES } from '@/lib/services/clima/ClimaInterventionDictionary';
import { buildDeptClimaDecisions } from '@/lib/services/clima/ClimaActionPlanBuilder';
import { classifyDecisionBlock } from '@/lib/services/clima/climaPlanRouting';
import { REACTIVE_SYSTEMIC_MIN_MEASURED } from '@/lib/services/clima/climaThresholds';
import type { ClimaDeptDecisionInput, ReactiveContextEntry } from '@/types/clima-planes';

/** Driver mínimo para el builder (momentumDelta/classification no participan del gate). */
function driver(category: string, reactives: ReactiveContextEntry[]) {
  return {
    category,
    fav: 45,
    gap: -30,
    impact: 0.6,
    momentumDelta: null,
    classification: null,
    reactives,
  };
}

let pass = 0;
let fail = 0;
function assert(cond: boolean, label: string) {
  if (cond) {
    pass++;
    console.log(`  ✅ ${label}`);
  } else {
    fail++;
    console.log(`  ❌ ${label}`);
  }
}

const GENERIC_MARKER = 'Este no es un problema puntual';

// ── S1: las 8 dimensiones resuelven narrativa específica ────────────────────
console.log('\nS1 · 8 narrativas específicas (ninguna cae al genérico)');
const narratives = new Set<string>();
for (const cat of CLIMA_DRIVER_CATEGORIES) {
  const cell = getSystemicIntervention(cat, 3, 5);
  const ok =
    !cell.narrative.includes(GENERIC_MARKER) &&
    cell.narrative.startsWith('PROVISIONAL — ') &&
    cell.steps.length === 2 &&
    typeof cell.suggestedProduct === 'object' &&
    cell.suggestedProduct.target === 'SIN_CTA' &&
    cell.suggestedProduct.label.length > 0;
  assert(ok, `${cat} → narrativa propia + suggestedProduct objeto SIN_CTA`);
  narratives.add(cell.narrative);
}
assert(narratives.size === 8, 'las 8 narrativas son distintas entre sí');

// ── S2: interpolación — sin placeholders sueltos, con los números reales ────
console.log('\nS2 · interpolación {n}/{total}');
for (const cat of CLIMA_DRIVER_CATEGORIES) {
  const cell = getSystemicIntervention(cat, 4, 7);
  const ok =
    !cell.narrative.includes('{n}') &&
    !cell.narrative.includes('{total}') &&
    cell.narrative.includes('4') &&
    cell.narrative.includes('7');
  assert(ok, `${cat} → interpola 4/7 y no deja placeholders`);
}

// ── S3: fallback ante category desconocida ─────────────────────────────────
console.log('\nS3 · fallback (category fuera de las 8)');
let fallbackCell: ReturnType<typeof getSystemicIntervention> | null = null;
let threw = false;
try {
  fallbackCell = getSystemicIntervention('dimension_futura_test', 2, 4);
} catch {
  threw = true;
}
assert(!threw, 'no lanza excepción');
assert(fallbackCell != null, 'no retorna undefined/null');
assert(fallbackCell!.narrative.includes(GENERIC_MARKER), 'usa el texto genérico conservado');
assert(
  fallbackCell!.narrative.includes('2 de 4 reactivos de dimension_futura_test'),
  'interpola {n}/{total}/{category} en el fallback'
);
assert(
  typeof fallbackCell!.suggestedProduct === 'object' &&
    fallbackCell!.suggestedProduct.target === 'SIN_CTA' &&
    fallbackCell!.suggestedProduct.label === 'Revisar con RRHH',
  'fallback migrado al shape objeto con SIN_CTA'
);
assert(fallbackCell!.steps.length === 2, 'fallback conserva sus 2 steps');

// ── S4: reconocimiento/compensaciones no alcanzan el piso hoy ──────────────
// Banco real (experiencia-full, verificado contra BD): reconocimiento = 1 reactivo
// (`mejora`), compensaciones = 1 (`beneficios`). measured=1 < 3 → nunca sistémico.
console.log('\nS4 · reconocimiento/compensaciones inalcanzables con el banco actual');
const BANK_REACTIVES: Record<string, string[]> = {
  reconocimiento: ['mejora'],
  compensaciones: ['beneficios'],
};
for (const [cat, reactives] of Object.entries(BANK_REACTIVES)) {
  assert(
    reactives.length < REACTIVE_SYSTEMIC_MIN_MEASURED,
    `${cat}: ${reactives.length} reactivo(s) < piso ${REACTIVE_SYSTEMIC_MIN_MEASURED} → no puede ser sistémico`
  );
  // Prueba de extremo a extremo: todos sus reactivos hundidos → igual NO sale sistémico.
  const input: ClimaDeptDecisionInput = {
    departmentId: `dept-${cat}`,
    departmentName: `Depto ${cat}`,
    drivers: [
      driver(
        cat,
        reactives.map((r) => ({ reactive: r, impact: 0.5, gap: -35, mean: 1.5 }))
      ),
    ],
    businessCases: [],
  };
  const items = buildDeptClimaDecisions(input);
  assert(
    items.length > 0 && items.every((i) => i.isSystemic === false),
    `${cat}: con su reactivo hundido dispara ítem pero isSystemic=false`
  );
}

// ── S5: flujo intacto — sistémico rutea a individual, sin esfuerzo/efectividad ──
console.log('\nS5 · flujo intacto para las 6 dimensiones que sí pueden disparar hoy');
const systemicInput: ClimaDeptDecisionInput = {
  departmentId: 'dept-lid',
  departmentName: 'Operaciones',
  drivers: [
    driver('liderazgo', [
      { reactive: 'confianza', impact: 0.5, gap: -30, mean: 2.0 },
      { reactive: 'expectativas', impact: 0.4, gap: -25, mean: 2.2 },
      { reactive: 'cuidado', impact: 0.3, gap: -20, mean: 2.4 },
    ]),
  ],
  businessCases: [],
};
const sysItems = buildDeptClimaDecisions(systemicInput);
assert(sysItems.length === 1, 'genera 1 ítem');
const it = sysItems[0];
assert(it.isSystemic === true, 'isSystemic=true (3/3 bajo tier)');
assert(!it.intervention.narrative.includes(GENERIC_MARKER), 'usa la narrativa específica de liderazgo');
assert(it.intervention.narrative.includes('3 de las 3'), 'interpola los conteos reales del caso');
assert(classifyDecisionBlock(it) === 'sistemico', 'rutea a bloque sistémico (individual)');
assert(
  it.intervention.esfuerzo === undefined && it.intervention.efectividad === undefined,
  'no aporta esfuerzo/efectividad (no participan del ruteo sistémico)'
);
assert(
  typeof it.intervention.suggestedProduct === 'object' &&
    it.intervention.suggestedProduct.label === 'Programa de coaching continuo',
  'suggestedProduct fluye como objeto hasta el ítem'
);

// Contraste: caso NO sistémico sigue yendo por getIntervention (Capa 2) sin cambios.
const puntualInput: ClimaDeptDecisionInput = {
  departmentId: 'dept-lid2',
  departmentName: 'Comercial',
  drivers: [
    driver('liderazgo', [
      { reactive: 'confianza', impact: 0.5, gap: -10, mean: 3.4 },
      { reactive: 'expectativas', impact: 0.4, gap: 5, mean: 4.0 },
      { reactive: 'cuidado', impact: 0.3, gap: 5, mean: 4.1 },
    ]),
  ],
  businessCases: [],
};
const puntual = buildDeptClimaDecisions(puntualInput);
assert(puntual.length === 1 && puntual[0].isSystemic === false, 'caso puntual sigue NO sistémico (1/3)');
assert(
  !puntual[0].intervention.narrative.includes(GENERIC_MARKER),
  'caso puntual no toca la rama sistémica'
);

console.log(`\n${'═'.repeat(60)}\nRESULTADO: ${pass} pass · ${fail} fail\n`);
process.exit(fail === 0 ? 0 : 1);
