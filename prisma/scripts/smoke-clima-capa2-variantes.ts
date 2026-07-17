// ════════════════════════════════════════════════════════════════════════════
// SMOKE — Capa 2: variantes de intervención por reactivo × zona (93 celdas)
// prisma/scripts/smoke-clima-capa2-variantes.ts
// ════════════════════════════════════════════════════════════════════════════
// PURO (sin DB → no toca prod). Cubre:
//   S1 A-additive: las 32 celdas base y getSystemicIntervention intactas (string).
//   S2 Transposición: 93 variantes + muestra migrada, shape rico, invariante zona→target.
//   S3 Selección: getIntervention devuelve variante con palanca / base sin ella.
//   S4 Dispatcher: mapa cubre los 4 targets; ningún target de variante se escapa.
//   S5 Builder E2E: item con variante (esfuerzo/efectividad + target) vs base (string).
//
// Ejecutar: npx tsx prisma/scripts/smoke-clima-capa2-variantes.ts
// ════════════════════════════════════════════════════════════════════════════

import {
  CLIMA_INTERVENTION_DICTIONARY,
  CLIMA_INTERVENTION_VARIANTS,
  CLIMA_DRIVER_CATEGORIES,
  getIntervention,
  getSystemicIntervention,
} from '../../src/lib/services/clima/ClimaInterventionDictionary';
import { buildDeptClimaDecisions } from '../../src/lib/services/clima/ClimaActionPlanBuilder';
import { CLIMA_PRODUCT_DISPATCH } from '../../src/lib/services/clima/climaProductDispatcher';
import type {
  ClimaDeptDecisionInput,
  InterventionTarget,
  SuggestedProduct,
  Esfuerzo,
  Efectividad,
} from '../../src/types/clima-planes';
import type { RiskZone } from '../../src/lib/services/clima/climaThresholds';

let pass = 0;
let fail = 0;
function assert(cond: boolean, msg: string) {
  if (cond) {
    pass++;
    console.log(`  ✓ ${msg}`);
  } else {
    fail++;
    console.error(`  ✗ FALLÓ: ${msg}`);
  }
}

const P = 'PROVISIONAL — ';
const VALID_TARGETS: InterventionTarget[] = ['SIN_CTA', 'PDI_CLIMA', 'META_AREA', 'META_DURA'];
const VALID_ESFUERZO: Esfuerzo[] = ['BAJO', 'MEDIO', 'ALTO'];
const VALID_EFECTIVIDAD: Efectividad[] = ['ALTA', 'MEDIA_ALTA', 'MEDIA', 'BAJA', 'INCIERTA'];
const ZONES_VARIANTE: RiskZone[] = ['amarilla', 'naranja', 'roja'];
const ZONE_TO_TARGET: Record<string, InterventionTarget> = {
  amarilla: 'PDI_CLIMA',
  naranja: 'META_AREA',
  roja: 'META_DURA',
};

const EXPECTED_REACTIVES = new Set([
  'expectativas', 'reconocimiento', 'participacion', 'confianza', 'efectividad', 'resolucion', 'cuidado',
  'planificacion', 'acceso', 'relevancia', 'aplicacion', 'ascenso',
  'inversion', 'mentoria', 'nuevas_habilidades', 'desafios',
  'comunicacion_interna', 'colaboracion_interdepartamental', 'expresion_libre',
  'autonomia', 'ambiente_fisico', 'herramientas', 'cohesion_equipo', 'flexibilidad',
  'carga_trabajo', 'seguridad', 'preocupacion_empresa', 'energia', 'estres',
  'mejora', 'beneficios',
]);

function isSuggestedProduct(x: unknown): x is SuggestedProduct {
  return typeof x === 'object' && x !== null && 'target' in x;
}

console.log('\n═══ S1 · A-additive: base 32 + sistémica intactas ═══');
{
  assert(CLIMA_DRIVER_CATEGORIES.length === 8, 'CLIMA_DRIVER_CATEGORIES tiene 8 dimensiones');
  let baseCells = 0;
  let allString = true;
  let allProvisional = true;
  for (const cat of CLIMA_DRIVER_CATEGORIES) {
    const zones = CLIMA_INTERVENTION_DICTIONARY[cat];
    for (const z of ['verde', 'amarilla', 'naranja', 'roja'] as RiskZone[]) {
      const cell = zones[z];
      baseCells++;
      if (typeof cell.suggestedProduct !== 'string') allString = false;
      if (!cell.narrative.startsWith(P)) allProvisional = false;
    }
  }
  assert(baseCells === 32, `diccionario base = 32 celdas (8×4), obtenido ${baseCells}`);
  assert(allString, 'las 32 celdas base conservan suggestedProduct: string (sin tocar)');
  assert(allProvisional, 'las 32 narrativas base siguen con prefijo PROVISIONAL —');

  const sys = getSystemicIntervention('liderazgo', 3, 5);
  assert(typeof sys.suggestedProduct === 'string', 'getSystemicIntervention devuelve suggestedProduct string (base)');
  assert(sys.narrative.startsWith(P), 'narrativa sistémica sigue PROVISIONAL —');
}

console.log('\n═══ S2 · Transposición Capa 2: 93 + muestra migrada ═══');
{
  const dims = Object.keys(CLIMA_INTERVENTION_VARIANTS);
  assert(dims.length === 8, `las 8 dimensiones presentes en VARIANTS (${dims.length})`);

  let variantCells = 0;
  let allRich = true;
  let allProvisional = true;
  let allTwoSteps = true;
  let allTargetsValid = true;
  let allEnumsValid = true;
  let zoneTargetInvariant = true;
  const seenReactives = new Set<string>();

  for (const cat of Object.keys(CLIMA_INTERVENTION_VARIANTS)) {
    const byZone = CLIMA_INTERVENTION_VARIANTS[cat as keyof typeof CLIMA_INTERVENTION_VARIANTS]!;
    for (const z of ZONES_VARIANTE) {
      const byReactive = byZone[z];
      if (!byReactive) continue;
      for (const reactive of Object.keys(byReactive)) {
        const cell = byReactive[reactive];
        variantCells++;
        seenReactives.add(reactive);
        const sp = cell.suggestedProduct;
        if (!isSuggestedProduct(sp)) { allRich = false; continue; }
        if (!cell.narrative.startsWith(P)) allProvisional = false;
        if (cell.steps.length !== 2) allTwoSteps = false;
        if (!VALID_TARGETS.includes(sp.target)) allTargetsValid = false;
        if (!VALID_ESFUERZO.includes(cell.esfuerzo)) allEnumsValid = false;
        if (!VALID_EFECTIVIDAD.includes(cell.efectividad)) allEnumsValid = false;
        if (sp.target !== ZONE_TO_TARGET[z]) zoneTargetInvariant = false;
      }
    }
  }

  // 93 de Capa 2 + 1 muestra migrada (liderazgo.roja.carga_trabajo) = 94.
  assert(variantCells === 94, `total celdas variante = 94 (93 Capa 2 + muestra), obtenido ${variantCells}`);
  assert(allRich, 'toda variante tiene suggestedProduct objeto (shape rico)');
  assert(allProvisional, 'toda narrativa de variante sigue PROVISIONAL —');
  assert(allTwoSteps, 'toda variante tiene exactamente 2 steps');
  assert(allTargetsValid, 'todo target de variante ∈ InterventionTarget');
  assert(allEnumsValid, 'todo esfuerzo/efectividad ∈ enums válidos');
  assert(zoneTargetInvariant, 'invariante zona→target: amarilla=PDI_CLIMA, naranja=META_AREA, roja=META_DURA');

  let allExpected = true;
  for (const r of EXPECTED_REACTIVES) if (!seenReactives.has(r)) allExpected = false;
  assert(allExpected && seenReactives.size === EXPECTED_REACTIVES.size,
    `las 31 keys de reactivo esperadas presentes (obtenido ${seenReactives.size})`);

  // Muestra migrada + coexistencia sin colisión.
  const muestra = CLIMA_INTERVENTION_VARIANTS.liderazgo?.roja?.carga_trabajo;
  assert(!!muestra && isSuggestedProduct(muestra.suggestedProduct) &&
    muestra.suggestedProduct.target === 'META_DURA' && muestra.esfuerzo === 'ALTO',
    'muestra v3.18 liderazgo.roja.carga_trabajo migrada (META_DURA, esfuerzo ALTO)');
  const satCarga = CLIMA_INTERVENTION_VARIANTS.satisfaccion?.roja?.carga_trabajo;
  assert(!!satCarga && !!muestra && satCarga.narrative !== muestra.narrative,
    'coexistencia: satisfaccion.roja.carga_trabajo ≠ liderazgo.roja.carga_trabajo (sin colisión)');
}

console.log('\n═══ S3 · getIntervention: variante vs base default ═══');
{
  // Con palanca que tiene variante → celda rica.
  const sel1 = getIntervention('liderazgo', 'amarilla', [], 'expectativas');
  assert(!!sel1 && isSuggestedProduct(sel1.cell.suggestedProduct) &&
    sel1.cell.suggestedProduct.target === 'PDI_CLIMA' && sel1.selectedReactive === 'expectativas',
    'getIntervention(liderazgo, amarilla, expectativas) → variante rica PDI_CLIMA');

  // Sin palanca (leverOverride null) → base default (string).
  const sel2 = getIntervention('liderazgo', 'amarilla', [], null);
  assert(!!sel2 && typeof sel2.cell.suggestedProduct === 'string' && sel2.selectedReactive === null,
    'getIntervention(liderazgo, amarilla, null) → base default (string)');

  // Palanca sin variante para esa dim/zona → base default.
  const sel3 = getIntervention('compensaciones', 'amarilla', [], 'reactivo_inexistente');
  assert(!!sel3 && typeof sel3.cell.suggestedProduct === 'string',
    'getIntervention con reactivo sin variante → base default (no rompe)');

  // Categoría fuera de la taxonomía → null.
  const sel4 = getIntervention('no_es_dimension', 'roja', [], null);
  assert(sel4 === null, 'getIntervention(categoría no-dimensión) → null');
}

console.log('\n═══ S4 · Dispatcher declarativo ═══');
{
  const keys = Object.keys(CLIMA_PRODUCT_DISPATCH);
  assert(keys.length === 4 && VALID_TARGETS.every((t) => keys.includes(t)),
    'CLIMA_PRODUCT_DISPATCH cubre los 4 InterventionTarget');

  // Ningún target usado por una variante se escapa del dispatcher.
  let allDispatched = true;
  for (const cat of Object.keys(CLIMA_INTERVENTION_VARIANTS)) {
    const byZone = CLIMA_INTERVENTION_VARIANTS[cat as keyof typeof CLIMA_INTERVENTION_VARIANTS]!;
    for (const z of ZONES_VARIANTE) {
      const byReactive = byZone[z];
      if (!byReactive) continue;
      for (const reactive of Object.keys(byReactive)) {
        const sp = byReactive[reactive].suggestedProduct;
        if (isSuggestedProduct(sp) && !CLIMA_PRODUCT_DISPATCH[sp.target]) allDispatched = false;
      }
    }
  }
  assert(allDispatched, 'todo target de variante resuelve en el dispatcher');

  assert(CLIMA_PRODUCT_DISPATCH.PDI_CLIMA.endpoint === '/api/clima/pdi-suggestion' &&
    CLIMA_PRODUCT_DISPATCH.PDI_CLIMA.kind === 'pdi' && !CLIMA_PRODUCT_DISPATCH.PDI_CLIMA.pending,
    'PDI_CLIMA → /api/clima/pdi-suggestion (VIVO, sin pending)');
  assert(!!CLIMA_PRODUCT_DISPATCH.META_AREA.pending && !!CLIMA_PRODUCT_DISPATCH.META_DURA.pending,
    'META_AREA/META_DURA marcados pending (bloqueo orden: 5D Tab 2)');
  assert(CLIMA_PRODUCT_DISPATCH.SIN_CTA.endpoint === null && CLIMA_PRODUCT_DISPATCH.SIN_CTA.kind === 'none',
    'SIN_CTA → sin acción (endpoint null)');
}

console.log('\n═══ S5 · Builder E2E: variante vs base fallback ═══');
{
  // Case A: palanca con variante (impact ≥ 0.20) → item con target + esfuerzo/efectividad.
  const inputA: ClimaDeptDecisionInput = {
    departmentId: 'D1',
    departmentName: 'Área A',
    businessCases: [],
    drivers: [{
      category: 'liderazgo', fav: 60, gap: -15, impact: 0.5, momentumDelta: null, classification: null,
      reactives: [
        { reactive: 'expectativas', impact: 0.5, gap: -10, mean: 3.4 }, // gapMean -0.2 → amarilla, palanca
        { reactive: 'confianza', impact: 0.5, gap: 0, mean: 4.0 },       // sobre tier
        { reactive: 'cuidado', impact: 0.5, gap: 0, mean: 4.0 },         // sobre tier → no sistémico
      ],
    }],
  };
  const itemsA = buildDeptClimaDecisions(inputA);
  const a = itemsA[0];
  assert(itemsA.length === 1 && !!a, 'Case A: builder produce 1 ítem');
  assert(a && isSuggestedProduct(a.intervention.suggestedProduct) &&
    a.intervention.suggestedProduct.target === 'PDI_CLIMA',
    'Case A: intervention.suggestedProduct objeto target PDI_CLIMA');
  assert(a && a.intervention.esfuerzo === 'BAJO' && a.intervention.efectividad === 'ALTA',
    'Case A: esfuerzo/efectividad de la variante propagados al ítem');
  assert(a && a.selectedReactive === 'expectativas', 'Case A: selectedReactive = expectativas');
  assert(a && a.intervention.level === 'amarilla', 'Case A: severidad amarilla (gapMean −0.2)');

  // Case B: palanca bajo el piso de impacto (0.1 < 0.20) → narrativeLever null → base default.
  const inputB: ClimaDeptDecisionInput = {
    departmentId: 'D2',
    departmentName: 'Área B',
    businessCases: [],
    drivers: [{
      category: 'liderazgo', fav: 60, gap: -15, impact: 0.5, momentumDelta: null, classification: null,
      reactives: [
        { reactive: 'expectativas', impact: 0.1, gap: -10, mean: 3.4 }, // bajo el piso → no narra palanca
        { reactive: 'confianza', impact: 0.5, gap: 0, mean: 4.0 },
        { reactive: 'cuidado', impact: 0.5, gap: 0, mean: 4.0 },
      ],
    }],
  };
  const itemsB = buildDeptClimaDecisions(inputB);
  const b = itemsB[0];
  assert(itemsB.length === 1 && !!b, 'Case B: builder produce 1 ítem');
  assert(b && typeof b.intervention.suggestedProduct === 'string',
    'Case B: base fallback → suggestedProduct string');
  assert(b && b.intervention.esfuerzo === undefined && b.intervention.efectividad === undefined,
    'Case B: sin esfuerzo/efectividad (celda base)');
  assert(b && b.selectedReactive === null, 'Case B: selectedReactive null (palanca bajo piso)');
}

console.log(`\n═══ RESULTADO: ${pass}/${pass + fail} ═══`);
if (fail > 0) process.exit(1);
