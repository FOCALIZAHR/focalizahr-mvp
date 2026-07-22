// ════════════════════════════════════════════════════════════════════════════
// SMOKE — EX Clima Gate 5D-x: procedencia (templateRef) + clon defensivo
// prisma/scripts/smoke-clima-5dx-procedencia.ts
// ════════════════════════════════════════════════════════════════════════════
// Verifica las 2 piezas de GATE0_CAPA0_..._PROPUESTA.md §5D-x, PURO (sin BD):
//   1. templateRef estampado en cada item (id de celda + version del catálogo).
//   2. Fix de aliasing (§3): dos items de la MISMA celda no comparten el array
//      `steps` ni el objeto `suggestedProduct` por referencia — mutar uno no toca
//      al otro, y el diccionario en módulo queda intacto.
//
// Ejecutar: npx --no-install tsx prisma/scripts/smoke-clima-5dx-procedencia.ts
// UNTRACKED — verificación puntual; borrar al sellar 5D-x.
// ════════════════════════════════════════════════════════════════════════════

import { buildClimaPlanDecisions } from '../../src/lib/services/clima/ClimaActionPlanBuilder';
import type { ClimaDeptDecisionInput } from '../../src/types/clima-planes';

let pass = 0;
let fail = 0;
function check(name: string, cond: boolean, detail?: string) {
  if (cond) { pass++; console.log(`  ✓ ${name}`); }
  else { fail++; console.log(`  ✗ ${name}${detail ? ` — ${detail}` : ''}`); }
}

// Dos deptos con el MISMO driver/reactivo bajo su tier (mean 2.5 < target) → ambos
// resuelven a la MISMA celda del catálogo → mismo templateRef.id, distinta instancia.
const mkDept = (id: string): ClimaDeptDecisionInput => ({
  departmentId: id,
  departmentName: `Dept ${id}`,
  drivers: [
    {
      category: 'autonomia',
      fav: 60,
      gap: -15,
      impact: 0.5,
      momentumDelta: 0,
      classification: null,
      reactives: [{ reactive: 'colaboracion', impact: 0.5, gap: -15, mean: 2.5 }],
    },
  ],
  businessCases: [],
});

console.log('════════════════════════════════════════════════════════════');
console.log('SMOKE 5D-x · procedencia + clon defensivo');
console.log('════════════════════════════════════════════════════════════\n');

const items = buildClimaPlanDecisions([mkDept('depA'), mkDept('depB')]);

console.log('── (1) templateRef estampado ──');
check('se generaron 2 items (uno por depto)', items.length === 2, `n=${items.length}`);
for (const it of items) {
  check(
    `templateRef presente en ${it.departmentId}`,
    !!it.templateRef && typeof it.templateRef.id === 'string' && it.templateRef.id.length > 0,
    JSON.stringify(it.templateRef)
  );
  check(`version === 1 en ${it.departmentId}`, it.templateRef?.version === 1);
  // id derivado = ${category}:${level}:${selectedReactive ?? '∅'} (no sistémico acá)
  const expected = `${it.category}:${it.intervention.level}:${it.selectedReactive ?? '∅'}`;
  check(
    `id coincide con celda (${it.departmentId})`,
    it.templateRef.id === expected,
    `got=${it.templateRef.id} exp=${expected}`
  );
}
console.log(`    templateRef.id = ${items[0]?.templateRef.id}`);

console.log('\n── (2) clon defensivo (aliasing roto) ──');
const [a, b] = items;
check('misma celda → mismo templateRef.id', a.templateRef.id === b.templateRef.id);
check(
  'steps: instancias DISTINTAS (no comparten referencia)',
  a.intervention.steps !== b.intervention.steps
);
// suggestedProduct: si es objeto (variante), también debe ser instancia propia
if (typeof a.intervention.suggestedProduct === 'object') {
  check(
    'suggestedProduct (objeto): instancias distintas',
    a.intervention.suggestedProduct !== b.intervention.suggestedProduct
  );
}
// mutación aislada: tocar A no afecta B
const bLenBefore = b.intervention.steps.length;
a.intervention.steps.push('MUTACIÓN-SMOKE');
check(
  'mutar steps de A no afecta a B',
  b.intervention.steps.length === bLenBefore &&
    !b.intervention.steps.includes('MUTACIÓN-SMOKE')
);
// el diccionario en módulo quedó intacto: un build nuevo trae steps originales
const fresh = buildClimaPlanDecisions([mkDept('depC')]);
check(
  'diccionario intacto: build nuevo sin la mutación',
  !!fresh[0] && !fresh[0].intervention.steps.includes('MUTACIÓN-SMOKE'),
  `steps=${JSON.stringify(fresh[0]?.intervention.steps)}`
);

console.log('\n════════════════════════════════════════════════════════════');
console.log(`RESULTADO: ${pass} pass · ${fail} fail`);
console.log('════════════════════════════════════════════════════════════');
process.exit(fail === 0 ? 0 : 1);
