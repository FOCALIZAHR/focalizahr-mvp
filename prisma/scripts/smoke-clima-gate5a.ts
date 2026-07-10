// prisma/scripts/smoke-clima-gate5a.ts
// ════════════════════════════════════════════════════════════════════════════
// SMOKE Gate 5A — Generación REAL de decisiones de plan de clima.
//
// Prueba que ClimaActionPlanBuilder mapea correctamente un hallazgo con VARIAS
// dimensiones en DISTINTA severidad a sus ClimaDecisionItem, con la intervención
// del diccionario correcta por (dimensión × zona) y el business case CLP REAL de
// PulseEngine (vía buildBusinessCases → SalaryConfigService). NO es un test de
// que compila: ejercita el motor sellado y el builder end-to-end e imprime el
// output real para review de Victor.
//
// Correr:  npx tsx prisma/scripts/smoke-clima-gate5a.ts
// (se borra al sellar — evidencia queda en el commit)
// ════════════════════════════════════════════════════════════════════════════

import {
  buildBusinessCases,
  type PulseDeptInput,
  type PulseBusinessCase,
} from '../../src/lib/services/clima/PulseEngine';
import { buildDeptClimaDecisions } from '../../src/lib/services/clima/ClimaActionPlanBuilder';
import {
  CLIMA_INTERVENTION_DICTIONARY,
  CLIMA_DRIVER_CATEGORIES,
} from '../../src/lib/services/clima/ClimaInterventionDictionary';
import type { SalaryResult } from '../../src/lib/services/SalaryConfigService';
import type { RiskZone } from '../../src/lib/services/clima/climaThresholds';
import type { ClimaDriverForDecision } from '../../src/types/clima-planes';

let pass = 0;
let fail = 0;
function check(label: string, cond: boolean) {
  if (cond) {
    pass++;
    console.log(`  ✅ ${label}`);
  } else {
    fail++;
    console.log(`  ❌ ${label}`);
  }
}

const CLP = (n: number) => `$${Math.round(n).toLocaleString('es-CL')}`;

// ════════════════════════════════════════════════════════════════════════════
// S1 — Integridad del diccionario: 8 × 4 = 32 celdas, todas PROVISIONAL, sin vacíos
// ════════════════════════════════════════════════════════════════════════════
console.log('\n── S1 · Diccionario 8×4 = 32 celdas (PROVISIONAL, sin placeholder) ──');
const ZONES: RiskZone[] = ['verde', 'amarilla', 'naranja', 'roja'];
let cellCount = 0;
let allProvisional = true;
let allFilled = true;
for (const cat of CLIMA_DRIVER_CATEGORIES) {
  for (const zone of ZONES) {
    const cell = CLIMA_INTERVENTION_DICTIONARY[cat][zone];
    cellCount++;
    if (!cell.narrative.startsWith('PROVISIONAL — ')) allProvisional = false;
    if (
      cell.narrative.trim().length <= 'PROVISIONAL — '.length ||
      cell.steps.length === 0 ||
      cell.steps.some((s) => s.trim() === '') ||
      cell.suggestedProduct.trim() === ''
    ) {
      allFilled = false;
    }
  }
}
check(`32 celdas presentes (8 dimensiones × 4 zonas) — contadas: ${cellCount}`, cellCount === 32);
check('todas las narrativas marcadas "PROVISIONAL — "', allProvisional);
check('ninguna celda vacía (narrative/steps/suggestedProduct)', allFilled);

// ════════════════════════════════════════════════════════════════════════════
// S2 — Hallazgo real: 6 dimensiones en 4 severidades + verde + momentum-crisis
// ════════════════════════════════════════════════════════════════════════════
console.log('\n── S2 · Business cases REALES de PulseEngine (CLP vía SalaryConfigService) ──');

const salary: SalaryResult = {
  monthlySalary: 1_200_000,
  annualSalary: 14_400_000,
  source: 'default_chile',
  confidence: 'low',
  metadata: { accountId: 'SMOKE-5A', configuredByClient: false },
};

// mean 1-5 (dispara business cases) + fav 0-100 (define zona) coherentes a mano.
const dept: PulseDeptInput = {
  departmentId: 'dept-ventas',
  driverScores: {
    liderazgo: { fav: 45, mean: 2.2, n: 20, carried: false }, // roja + liderazgo_gap
    reconocimiento: { fav: 52, mean: 2.3, n: 20, carried: false }, // roja + clima_critico
    autonomia: { fav: 62, mean: 3.4, n: 20, carried: false }, // naranja, sin caso
    comunicacion: { fav: 68, mean: 3.6, n: 20, carried: false }, // amarilla, sin caso
    desarrollo: { fav: 70, mean: 3.5, n: 20, carried: false }, // amarilla→naranja por momentum
    satisfaccion: { fav: 82, mean: 4.3, n: 20, carried: false }, // verde → NO genera ítem
  },
  ei: { fav: 66, mean: 3.5, n: 20 }, // >3.0 → retencion_riesgo NO dispara
  momentum: null,
  rows: [],
  prevDriverScores: null,
  turnoverRate: 18, // % real → peopleAtRisk = ceil(40 × 0.18) = 8
  headcountAvg: 40,
  isaScore: null,
  totalResponded: 20,
  participationRate: 80,
  voluntaryExits12mo: null,
  salary,
};

const businessCases: PulseBusinessCase[] = buildBusinessCases(dept);
const bcLiderazgo = businessCases.find((b) => b.type === 'liderazgo_gap');
const bcReconocimiento = businessCases.find((b) => b.type === 'clima_critico');

check('PulseEngine disparó liderazgo_gap (driver=liderazgo)', bcLiderazgo?.driver === 'liderazgo');
check('PulseEngine disparó clima_critico (driver=reconocimiento)', bcReconocimiento?.driver === 'reconocimiento');
check('NO disparó retencion_riesgo (EI mean 3.5 > 3.0)', !businessCases.some((b) => b.type === 'retencion_riesgo'));
check('CLP real liderazgo_gap > 0', (bcLiderazgo?.potentialAnnualLossCLP ?? 0) > 0);
check('peopleAtRisk = ceil(40 × 0.18) = 8 (rotación real)', bcLiderazgo?.peopleAtRisk === 8);

// ════════════════════════════════════════════════════════════════════════════
// S3 — Builder: mapeo dimensión × severidad → ClimaDecisionItem
// ════════════════════════════════════════════════════════════════════════════
console.log('\n── S3 · ClimaActionPlanBuilder: dimensión × severidad → decisión ──');

const drivers: ClimaDriverForDecision[] = [
  { category: 'liderazgo', fav: 45, gap: -30, impact: 0.45, momentumDelta: null, classification: 'focus_area' },
  { category: 'reconocimiento', fav: 52, gap: -23, impact: 0.30, momentumDelta: null, classification: 'focus_area' },
  { category: 'autonomia', fav: 62, gap: -13, impact: 0.18, momentumDelta: null, classification: 'focus_area' },
  { category: 'comunicacion', fav: 68, gap: -7, impact: 0.12, momentumDelta: null, classification: 'monitor' },
  { category: 'desarrollo', fav: 70, gap: -5, impact: 0.15, momentumDelta: -12, classification: 'monitor' }, // crisis
  { category: 'satisfaccion', fav: 82, gap: 7, impact: 0.10, momentumDelta: null, classification: 'strength' },
];

const decisions = buildDeptClimaDecisions({
  departmentId: dept.departmentId,
  departmentName: 'Ventas',
  drivers,
  businessCases,
});

const byCat = (c: string) => decisions.find((d) => d.category === c);

check('5 decisiones generadas (satisfaccion=verde excluida)', decisions.length === 5);
check('satisfaccion (verde/Sano) NO genera decisión', !byCat('satisfaccion'));

check('liderazgo → zona roja (Crítico)', byCat('liderazgo')?.intervention.level === 'roja');
check('liderazgo → businessCase liderazgo_gap adjunto (CLP real)', byCat('liderazgo')?.intervention.businessCase?.type === 'liderazgo_gap');
check('reconocimiento → zona roja (Crítico)', byCat('reconocimiento')?.intervention.level === 'roja');
check('reconocimiento → businessCase clima_critico adjunto', byCat('reconocimiento')?.intervention.businessCase?.type === 'clima_critico');
check('autonomia → zona naranja (Riesgo), sin businessCase', byCat('autonomia')?.intervention.level === 'naranja' && byCat('autonomia')?.intervention.businessCase === null);
check('comunicacion → zona amarilla (Atención), sin businessCase', byCat('comunicacion')?.intervention.level === 'amarilla' && byCat('comunicacion')?.intervention.businessCase === null);
check('desarrollo → amarilla degradada a naranja por momentum crisis (−12pp)', byCat('desarrollo')?.intervention.level === 'naranja');

// Mapeo a la CELDA correcta del diccionario (dimensión × zona)
check('liderazgo usa la celda liderazgo.roja del diccionario', byCat('liderazgo')?.intervention.narrative === CLIMA_INTERVENTION_DICTIONARY.liderazgo.roja.narrative);
check('comunicacion usa la celda comunicacion.amarilla del diccionario', byCat('comunicacion')?.intervention.narrative === CLIMA_INTERVENTION_DICTIONARY.comunicacion.amarilla.narrative);

// Responsable/plazo por severidad
check('liderazgo (roja) → responsable CEO / plazo 2 semanas', byCat('liderazgo')?.responsible === 'CEO' && byCat('liderazgo')?.deadline === '2 semanas');
check('autonomia (naranja) → responsable Gerente de Área / plazo 30 días', byCat('autonomia')?.responsible === 'Gerente de Área' && byCat('autonomia')?.deadline === '30 días');
check('comunicacion (amarilla) → responsable HRBP / plazo 90 días', byCat('comunicacion')?.responsible === 'HRBP' && byCat('comunicacion')?.deadline === '90 días');

// Orden por severidad (roja → naranja → amarilla)
const rank: Record<RiskZone, number> = { roja: 3, naranja: 2, amarilla: 1, verde: 0 };
let ordered = true;
for (let i = 1; i < decisions.length; i++) {
  if (rank[decisions[i].intervention.level] > rank[decisions[i - 1].intervention.level]) ordered = false;
}
check('decisiones ordenadas por severidad desc', ordered);
check('triggerRef estable (clima:dept:category)', byCat('liderazgo')?.triggerRef === 'clima:dept-ventas:liderazgo');

// ════════════════════════════════════════════════════════════════════════════
// OUTPUT REAL — para review de Victor
// ════════════════════════════════════════════════════════════════════════════
console.log('\n════════════════════════════════════════════════════════════════');
console.log('OUTPUT REAL — decisiones generadas (depto Ventas)');
console.log('════════════════════════════════════════════════════════════════');
for (const d of decisions) {
  const bc = d.intervention.businessCase;
  console.log(
    `\n• ${d.category.toUpperCase()}  ·  ${d.intervention.levelLabel} (${d.intervention.level})  ·  fav ${d.favorability}%  ·  gap ${d.gap}pp`
  );
  console.log(`    responsable: ${d.responsible}  |  plazo: ${d.deadline}`);
  console.log(`    intervención: ${d.intervention.narrative}`);
  console.log(`    pasos: ${d.intervention.steps.join(' · ')}`);
  console.log(`    producto sugerido: ${d.intervention.suggestedProduct}`);
  console.log(`    métrica de validación: ${d.validationMetric}`);
  if (bc) {
    console.log(
      `    💰 business case (${bc.type}): pérdida potencial ${CLP(bc.potentialAnnualLossCLP)}/año` +
        ` · inversión ${CLP(bc.recommendedInvestmentCLP)} · ROI ${bc.estimatedROIPct ?? '—'}%` +
        ` · ${bc.peopleAtRisk} personas en riesgo`
    );
  } else {
    console.log(`    (sin business case financiero — dimensión sin gatillo crítico)`);
  }
}

// ════════════════════════════════════════════════════════════════════════════
console.log('\n════════════════════════════════════════════════════════════════');
console.log(`RESULTADO: ${pass} PASS · ${fail} FAIL`);
console.log('════════════════════════════════════════════════════════════════');
if (fail > 0) process.exit(1);
