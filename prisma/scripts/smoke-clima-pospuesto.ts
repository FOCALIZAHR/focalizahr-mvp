// ════════════════════════════════════════════════════════════════════════════
// SMOKE — EX Clima: 'pospuesto' (Ruta B1) NO genera ClimaActionLog
// prisma/scripts/smoke-clima-pospuesto.ts
// ════════════════════════════════════════════════════════════════════════════
// El invariante que sostiene la Ruta B1: el botón "No ahora" (ceoDecision:'pospuesto')
// cuenta como DECIDIDO para el gate, pero queda FUERA de la creación de logs/recordatorios
// —igual que 'rechazar'—. Eso lo decide isAccepted() en ClimaActionLogService: SOLO
// 'aceptar'/'modificar' generan log. Este smoke bloquea la regresión de que alguien meta
// 'pospuesto' en isAccepted (lo volveria medible sin el schema de Ruta B2 → dato mentiroso).
//
// Ejecutar: npx --no-install tsx prisma/scripts/smoke-clima-pospuesto.ts
// UNTRACKED — verificación puntual; borrar al sellar.
// ════════════════════════════════════════════════════════════════════════════

import { isAccepted } from '../../src/lib/services/clima/ClimaActionLogService';
import type { ClimaDecisionItem, CeoDecision } from '../../src/types/clima-planes';

let pass = 0;
let fail = 0;
function check(name: string, cond: boolean, detail?: string) {
  if (cond) { pass++; console.log(`  ✓ ${name}`); }
  else { fail++; console.log(`  ✗ ${name}${detail ? ` — ${detail}` : ''}`); }
}

// Solo importa ceoDecision para isAccepted; el resto del shape se rellena mínimo.
function withDecision(ceoDecision: CeoDecision | undefined): ClimaDecisionItem {
  return { ceoDecision } as ClimaDecisionItem;
}

console.log('════════════════════════════════════════════════════════════');
console.log("SMOKE · 'pospuesto' (Ruta B1) — isAccepted matrix");
console.log('════════════════════════════════════════════════════════════\n');

check("aceptar   → generan log (isAccepted=true)", isAccepted(withDecision('aceptar')) === true);
check("modificar → generan log (isAccepted=true)", isAccepted(withDecision('modificar')) === true);
check("rechazar  → sin log (isAccepted=false)", isAccepted(withDecision('rechazar')) === false);
check("pospuesto → sin log (isAccepted=false) [invariante B1]", isAccepted(withDecision('pospuesto')) === false);
check("undefined → sin log (isAccepted=false)", isAccepted(withDecision(undefined)) === false);

console.log('\n════════════════════════════════════════════════════════════');
console.log(`RESULTADO: ${pass} pass · ${fail} fail`);
console.log('════════════════════════════════════════════════════════════');
process.exit(fail === 0 ? 0 : 1);
