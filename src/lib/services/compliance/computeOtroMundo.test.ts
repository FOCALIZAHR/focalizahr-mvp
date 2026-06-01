// ═══════════════════════════════════════════════════════════════════
// computeOtroMundo — tests de glue (node:test + node:assert/strict)
// src/lib/services/compliance/computeOtroMundo.test.ts
// ═══════════════════════════════════════════════════════════════════
// Run:
//   npx tsx --test src/lib/services/compliance/computeOtroMundo.test.ts
//
// Estos tests NO tocan Prisma. Inyectan los 3 loaders via `__deps`:
//   - loadCampaignUniverse  (mock de `computeDepartmentParticipation`)
//   - loadCompanyDeptos     (mock de la query company-scope)
//   - loadAlertasByDept     (mock de `loadAlertasByDeptBulk`)
//
// Cubren el wiring del orchestrator — setdiff, shape mapping, filtro de
// alertas, early exit. El filtro `pesoEfectivo >= umbral` NO se prueba acá
// porque vive en el motor puro `detectSilencioConVozExterna` (ver su test).
//
// Casos:
//   1. Setdiff elige correctamente los no-invitados
//   2. Shape mapping: SilencioCandidate.analyzed siempre 'not_invited' +
//      alertas pasadas tal cual del loader
//   3. No-invitado con alerta → produce candidato
//   4. Cero no-invitados → []
//   5. No-invitados sin alertas → []
//   6. Mixto: algunos no-invitados con alertas, otros sin → solo los con
// ═══════════════════════════════════════════════════════════════════

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { computeOtroMundo } from './CoverageAnalysisService';
import type { ComputeOtroMundoDeps } from './CoverageAnalysisService';

// ═══════════════════════════════════════════════════════════════════
// FACTORIES — mocks minimalistas para los 3 loaders
// ═══════════════════════════════════════════════════════════════════

type CampaignUniverseItem = {
  id: string;
  displayName: string;
  empleadosActivos: number;
};
type CompanyDeptoItem = { id: string; displayName: string };
type AlertaItem = {
  alertType: string;
  producto: 'exit' | 'onboarding';
  pesoEfectivo: number;
};

function mkDeps(opts: {
  campaignUniverse?: CampaignUniverseItem[];
  companyDeptos?: CompanyDeptoItem[];
  alertasByDept?: Map<string, AlertaItem[]>;
}): Partial<ComputeOtroMundoDeps> {
  return {
    loadCampaignUniverse: async () => ({
      universo: opts.campaignUniverse ?? [],
      // El orchestrator sólo lee `universo`; los otros campos pueden ir
      // vacíos en el mock sin perder cobertura del glue.
      cubiertosSet: new Set<string>(),
      partByDept: new Map(),
    }),
    loadCompanyDeptos: async () => opts.companyDeptos ?? [],
    loadAlertasByDept: async (_accountId, deptIds) => {
      // Devolver Map con solo los deptIds pedidos. Refleja el contrato real
      // de `loadAlertasByDeptBulk`: el caller pasa la lista filtrada y el
      // loader retorna entries inicializadas para todos.
      const out = new Map<string, AlertaItem[]>();
      const source = opts.alertasByDept ?? new Map<string, AlertaItem[]>();
      for (const id of deptIds) out.set(id, source.get(id) ?? []);
      return out;
    },
  };
}

const A = 'acc-1';
const C = 'camp-1';

// ═══════════════════════════════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════════════════════════════

test('1. setdiff elige los no-invitados correctos', async () => {
  // Company tiene 4 deptos; campaña incluye 2. Los otros 2 son OTRO MUNDO.
  // Solo uno de los no-invitados tiene alerta — el otro no produce candidato.
  const deps = mkDeps({
    campaignUniverse: [
      { id: 'd-in1', displayName: 'In 1', empleadosActivos: 10 },
      { id: 'd-in2', displayName: 'In 2', empleadosActivos: 10 },
    ],
    companyDeptos: [
      { id: 'd-in1', displayName: 'In 1' },
      { id: 'd-in2', displayName: 'In 2' },
      { id: 'd-out1', displayName: 'Out 1' },
      { id: 'd-out2', displayName: 'Out 2' },
    ],
    alertasByDept: new Map([
      [
        'd-out1',
        [{ alertType: 'ley_karin', producto: 'exit', pesoEfectivo: 3 }],
      ],
      // d-out2 no tiene alerta → no produce candidato (cae en case 5).
    ]),
  });

  const result = await computeOtroMundo(A, C, new Date(), deps);

  // Solo d-out1 entra (no-invitado con alerta). d-in1/d-in2 quedan fuera
  // por setdiff; d-out2 fuera por no tener alerta.
  assert.equal(result.length, 1);
  assert.equal(result[0].departmentId, 'd-out1');
});

test('2. shape mapping: analyzed=not_invited + alertas pass-through', async () => {
  const alertas: AlertaItem[] = [
    { alertType: 'toxic_exit_detected', producto: 'exit', pesoEfectivo: 3 },
    { alertType: 'ABANDONO_DIA_1', producto: 'onboarding', pesoEfectivo: 2 },
  ];
  const deps = mkDeps({
    campaignUniverse: [],
    companyDeptos: [{ id: 'd-1', displayName: 'Out depto' }],
    alertasByDept: new Map([['d-1', alertas]]),
  });

  const result = await computeOtroMundo(A, C, new Date(), deps);

  assert.equal(result.length, 1);
  assert.equal(result[0].departmentId, 'd-1');
  assert.equal(result[0].departmentName, 'Out depto');
  assert.equal(result[0].analyzed, 'not_invited');
  // El glue NO transforma alertas — las pasa tal cual del loader.
  assert.deepEqual(result[0].alertas, alertas);
});

test('3. no-invitado con alerta produce candidato', async () => {
  // Caso más simple — un depto fuera del universo de la campaña con
  // una sola alerta de bajo peso (el glue no filtra peso; el motor sí).
  const deps = mkDeps({
    campaignUniverse: [],
    companyDeptos: [{ id: 'd-1', displayName: 'Out' }],
    alertasByDept: new Map([
      [
        'd-1',
        [{ alertType: 'nps_critico', producto: 'exit', pesoEfectivo: 1 }],
      ],
    ]),
  });

  const result = await computeOtroMundo(A, C, new Date(), deps);
  assert.equal(result.length, 1);
  assert.equal(result[0].alertas[0].pesoEfectivo, 1);
});

test('4. cero no-invitados → [] (early exit, sin llamar loadAlertasByDept)', async () => {
  // Todos los deptos company están en la campaña → setdiff vacío.
  // Track de invocación del loader de alertas para verificar el early exit.
  let alertasCalls = 0;
  const deps: Partial<ComputeOtroMundoDeps> = {
    loadCampaignUniverse: async () => ({
      universo: [
        { id: 'd-1', displayName: 'In 1', empleadosActivos: 5 },
        { id: 'd-2', displayName: 'In 2', empleadosActivos: 5 },
      ],
      cubiertosSet: new Set<string>(),
      partByDept: new Map(),
    }),
    loadCompanyDeptos: async () => [
      { id: 'd-1', displayName: 'In 1' },
      { id: 'd-2', displayName: 'In 2' },
    ],
    loadAlertasByDept: async () => {
      alertasCalls++;
      return new Map();
    },
  };

  const result = await computeOtroMundo(A, C, new Date(), deps);
  assert.deepEqual(result, []);
  assert.equal(
    alertasCalls,
    0,
    'early exit: loadAlertasByDept no debe llamarse si no hay no-invitados',
  );
});

test('5. no-invitados sin alertas → []', async () => {
  const deps = mkDeps({
    campaignUniverse: [],
    companyDeptos: [
      { id: 'd-1', displayName: 'Out 1' },
      { id: 'd-2', displayName: 'Out 2' },
    ],
    alertasByDept: new Map(), // ningún depto tiene alertas cargadas
  });

  const result = await computeOtroMundo(A, C, new Date(), deps);
  assert.deepEqual(result, []);
});

test('6. mixto: solo no-invitados con ≥1 alerta entran al output', async () => {
  const deps = mkDeps({
    campaignUniverse: [
      { id: 'd-in', displayName: 'In', empleadosActivos: 10 },
    ],
    companyDeptos: [
      { id: 'd-in', displayName: 'In' },
      { id: 'd-out-empty', displayName: 'Out vacío' },
      { id: 'd-out-with', displayName: 'Out con alerta' },
      { id: 'd-out-multi', displayName: 'Out con varias' },
    ],
    alertasByDept: new Map([
      [
        'd-out-with',
        [{ alertType: 'ley_karin', producto: 'exit', pesoEfectivo: 3 }],
      ],
      [
        'd-out-multi',
        [
          { alertType: 'liderazgo_concentracion', producto: 'exit', pesoEfectivo: 2 },
          { alertType: 'RIESGO_FUGA', producto: 'onboarding', pesoEfectivo: 2 },
        ],
      ],
    ]),
  });

  const result = await computeOtroMundo(A, C, new Date(), deps);
  const ids = result.map((r) => r.departmentId).sort();
  assert.deepEqual(ids, ['d-out-multi', 'd-out-with']);
  const multi = result.find((r) => r.departmentId === 'd-out-multi')!;
  assert.equal(multi.alertas.length, 2);
});
