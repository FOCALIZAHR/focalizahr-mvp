// Smoke PURO (sin DB) — Gate 5D-i: groupLoteByReactive (sub-batches del lote por reactivo).
// Verifica: N reactivos → N grupos; misma dimensión distinto reactivo → grupos separados;
// mismo reactivo distinta zona → grupos separados; items preservados; orden preservado.
// Correr: npx tsx prisma/scripts/smoke-clima-lote-grouping-gate5di.ts

import { groupLoteByReactive } from '@/lib/services/clima/climaPlanRouting';
import type { ClimaDecisionItem, CeoDecision } from '@/types/clima-planes';
import type { RiskZone } from '@/lib/services/clima/climaThresholds';

let pass = 0;
let fail = 0;
function assert(cond: boolean, msg: string) {
  if (cond) { pass++; console.log(`  ✅ ${msg}`); }
  else { fail++; console.log(`  ❌ ${msg}`); }
}

function item(p: {
  dept: string;
  category: string;
  reactive: string | null;
  zone?: RiskZone;
  ceo?: CeoDecision;
}): ClimaDecisionItem {
  const zone: RiskZone = p.zone ?? 'amarilla';
  return {
    triggerRef: `clima:${p.dept}:${p.category}`,
    category: p.category,
    departmentId: p.dept,
    departmentName: p.dept,
    favorability: 60,
    gap: -15,
    impact: 0.4,
    templateRef: { id: `${p.category}:${zone}:${p.reactive ?? '∅'}`, version: 1 },
    intervention: {
      level: zone,
      levelLabel: 'Atención',
      narrative: 'x',
      steps: [],
      suggestedProduct: 'x',
      businessCase: null,
    },
    responsible: 'HRBP',
    deadline: '90 días',
    validationMetric: 'x',
    selectedReactive: p.reactive,
    isSystemic: false,
    ceoDecision: p.ceo,
  };
}

// S1 — 2 reactivos distintos → 2 grupos, con los items correctos.
console.log('S1 · N reactivos → N sub-batches');
const s1 = groupLoteByReactive([
  item({ dept: 'd1', category: 'liderazgo', reactive: 'feedback' }),
  item({ dept: 'd2', category: 'liderazgo', reactive: 'feedback' }),
  item({ dept: 'd3', category: 'satisfaccion', reactive: 'herramientas' }),
]);
assert(s1.length === 2, 'agrupa en 2 sub-batches');
const fb = s1.find((g) => g.reactive === 'feedback');
const hr = s1.find((g) => g.reactive === 'herramientas');
assert(fb?.items.length === 2, 'feedback junta sus 2 casos');
assert(hr?.items.length === 1, 'herramientas queda con 1');

// S2 — mismo reactivo, distinta zona → grupos separados (la clave incluye zona).
console.log('S2 · mismo reactivo, distinta zona → separados');
const s2 = groupLoteByReactive([
  item({ dept: 'd1', category: 'liderazgo', reactive: 'feedback', zone: 'amarilla' }),
  item({ dept: 'd2', category: 'liderazgo', reactive: 'feedback', zone: 'naranja' }),
]);
assert(s2.length === 2, 'misma dimensión+reactivo pero distinta zona → 2 grupos');

// S3 — orden de aparición preservado + items intactos.
console.log('S3 · orden e items preservados');
const s3 = groupLoteByReactive([
  item({ dept: 'd1', category: 'a', reactive: 'zeta' }),
  item({ dept: 'd2', category: 'a', reactive: 'alfa' }),
]);
assert(s3[0].reactive === 'zeta' && s3[1].reactive === 'alfa', 'orden de 1ª aparición respetado');
assert(s3[0].items[0].departmentId === 'd1', 'item original preservado en el grupo');

// S4 — reactive null → grupo defensivo, no rompe.
console.log('S4 · reactive null no rompe');
const s4 = groupLoteByReactive([item({ dept: 'd1', category: 'a', reactive: null })]);
assert(s4.length === 1 && s4[0].reactive === null, 'reactive null → 1 grupo con reactive null');

console.log(`\n${fail === 0 ? '✅' : '❌'} Smoke lote grouping: ${pass} pass / ${fail} fail`);
process.exitCode = fail === 0 ? 0 : 1;
