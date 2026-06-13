// ═══════════════════════════════════════════════════════════════════
// buildElNombre — tests (node:test + node:assert/strict) · Gate 5
// src/lib/services/compliance/buildElNombre.test.ts
// ═══════════════════════════════════════════════════════════════════
// Run: npx tsx --test src/lib/services/compliance/buildElNombre.test.ts
//
// Oráculos: tres llaves (legal > tamaño > ISA), narrativa CASO 1 verbatim del
// motor, postura, cierre (número en letras), factorización (gerencia), guards.
// Caso real cmob0e56: assert de NO-emisión.
// ═══════════════════════════════════════════════════════════════════

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { buildElNombre } from './buildElNombre';
import { buildCriticalByManagerNarrative } from './ComplianceNarrativeEngine';
import type { CriticalByManagerGroup } from './ConvergenciaEngine';
import type { ComplianceReportResponse } from '@/types/compliance';

interface DeptSpec {
  id: string;
  name: string;
  isa?: number | null;
  gerenciaId?: string | null;
  gerenciaName?: string | null;
  denuncias?: number | null;
  karin?: boolean;
}

function mkGroup(managerId: string, departmentIds: string[]): CriticalByManagerGroup {
  return { managerId, departmentIds, deltaIsa: 40, minIsa: 30, maxIsa: 70 };
}

function mkData(groups: CriticalByManagerGroup[], depts: DeptSpec[]): ComplianceReportResponse {
  const departments = depts.map((d) => ({
    departmentId: d.id,
    departmentName: d.name,
    isaScore: d.isa === undefined ? 50 : d.isa,
  }));
  const riskScores = depts.map((d) => ({
    departmentId: d.id,
    departmentName: d.name,
    score: 0,
    bucket: 'con_isa',
    drivers: { confiabilidad: 0, voz_externa: 0, piso_denuncia: 0 },
    reason: 'suma',
    inputs: { participacion: null, pesoAlertas: 0, denuncias_12m: d.denuncias ?? null },
    alertas: d.karin ? [{ alertType: 'ley_karin', producto: 'exit', pesoEfectivo: 3 }] : [],
    parentGerenciaId: d.gerenciaId ?? null,
    parentGerenciaName: d.gerenciaName ?? null,
  }));
  return {
    success: true,
    type: 'executive',
    company: { name: 'Test', country: 'CL' },
    narratives: {},
    data: {
      departments,
      riskScores,
      convergencia: { criticalByManager: groups },
    },
  } as unknown as ComplianceReportResponse;
}

// ═══════════════════════════════════════════════════════════════════
// A — TRES LLAVES
// ═══════════════════════════════════════════════════════════════════

test('A1. llave 1 (legal) gana sobre tamaño — rama legal chica vs grande sin señal', () => {
  const acto = buildElNombre(
    mkData(
      [mkGroup('gA', ['a1', 'a2']), mkGroup('gB', ['b1', 'b2', 'b3'])],
      [
        { id: 'a1', name: 'Ventas Norte', isa: 30, denuncias: 1 }, // rama A = legal (denuncia)
        { id: 'a2', name: 'Ventas Sur', isa: 70 },
        { id: 'b1', name: 'Soporte', isa: 35 },
        { id: 'b2', name: 'Logística', isa: 40 },
        { id: 'b3', name: 'Bodega', isa: 45 },
      ],
    ),
  )!;
  // Protagonista = rama A (legal), aunque B es más grande.
  assert.equal(acto.n, 2);
  assert.ok(acto.narrativa.destacado.includes('Ventas Norte y Ventas Sur'));
});

test('A2. sin señales → gana más áreas (llave 2)', () => {
  const acto = buildElNombre(
    mkData(
      [mkGroup('gA', ['a1', 'a2']), mkGroup('gB', ['b1', 'b2', 'b3'])],
      [
        { id: 'a1', name: 'Ventas Norte', isa: 30 },
        { id: 'a2', name: 'Ventas Sur', isa: 70 },
        { id: 'b1', name: 'Soporte', isa: 35 },
        { id: 'b2', name: 'Logística', isa: 40 },
        { id: 'b3', name: 'Bodega', isa: 45 },
      ],
    ),
  )!;
  assert.equal(acto.n, 3); // rama B (3 áreas)
});

test('A3. empate legal+tamaño → peor ISA promedio (llave 3)', () => {
  const acto = buildElNombre(
    mkData(
      [mkGroup('gA', ['a1', 'a2']), mkGroup('gB', ['b1', 'b2'])],
      [
        { id: 'a1', name: 'Ventas Norte', isa: 20 }, // avg A = 30
        { id: 'a2', name: 'Ventas Sur', isa: 40 },
        { id: 'b1', name: 'Soporte', isa: 40 }, // avg B = 45
        { id: 'b2', name: 'Logística', isa: 50 },
      ],
    ),
  )!;
  // avg A (30) < avg B (45) → protagonista A.
  assert.ok(acto.narrativa.destacado.includes('Ventas Norte y Ventas Sur'));
});

// ═══════════════════════════════════════════════════════════════════
// B — NARRATIVA + POSTURA + CIERRE
// ═══════════════════════════════════════════════════════════════════

test('B1. narrativa CASO 1 VERBATIM del motor (destacado + resto)', () => {
  const data = mkData(
    [mkGroup('gA', ['a1', 'a2'])],
    [
      { id: 'a1', name: 'Ventas Norte', isa: 30 },
      { id: 'a2', name: 'Ventas Sur', isa: 70 },
    ],
  );
  const acto = buildElNombre(data)!;
  const expected = buildCriticalByManagerNarrative(
    [mkGroup('gA', ['a1', 'a2'])],
    new Map([['a1', 'Ventas Norte'], ['a2', 'Ventas Sur']]),
  )!;
  // El destacado + ". " + resto reconstruye el verbatim del motor.
  assert.equal(`${acto.narrativa.destacado}. ${acto.narrativa.resto}`, expected);
  assert.equal(
    acto.narrativa.destacado,
    '2 áreas críticas dependen de la misma línea de mando: Ventas Norte y Ventas Sur',
  );
  // Em-dash barrido: dos puntos, no guión.
  assert.ok(acto.narrativa.resto.startsWith('El problema no es geográfico: es jerárquico.'));
});

test('B2. postura + cierre (número en letras)', () => {
  const acto = buildElNombre(
    mkData(
      [mkGroup('gA', ['a1', 'a2', 'a3'])],
      [
        { id: 'a1', name: 'A1', isa: 30 },
        { id: 'a2', name: 'A2', isa: 70 },
        { id: 'a3', name: 'A3', isa: 40 },
      ],
    ),
  )!;
  assert.equal(
    acto.postura,
    'Este informe no nombra personas: señala la estructura. El dato dice dónde converge el problema. Quién ocupa esa rama hoy, y desde cuándo, es la conversación que sigue.',
  );
  assert.equal(acto.cierre, 'Tres equipos distintos no inventan el mismo problema por separado.');
});

// ═══════════════════════════════════════════════════════════════════
// C — FACTORIZACIÓN + GUARDS
// ═══════════════════════════════════════════════════════════════════

test('C1. multi-rama → factorización nombra GERENCIA + modal', () => {
  const acto = buildElNombre(
    mkData(
      [mkGroup('gA', ['a1', 'a2']), mkGroup('gB', ['b1', 'b2', 'b3'])],
      [
        { id: 'a1', name: 'Ventas Norte', isa: 30, denuncias: 1, gerenciaId: 'gA', gerenciaName: 'Gerencia Comercial' },
        { id: 'a2', name: 'Ventas Sur', isa: 70, gerenciaId: 'gA', gerenciaName: 'Gerencia Comercial' },
        { id: 'b1', name: 'Soporte', isa: 35, gerenciaId: 'gB', gerenciaName: 'Gerencia de Operaciones' },
        { id: 'b2', name: 'Logística', isa: 40, gerenciaId: 'gB', gerenciaName: 'Gerencia de Operaciones' },
        { id: 'b3', name: 'Bodega', isa: 45, gerenciaId: 'gB', gerenciaName: 'Gerencia de Operaciones' },
      ],
    ),
  )!;
  // Protagonista = A (legal). Otra rama = B → factorización la nombra como gerencia.
  assert.equal(
    acto.factorizacion!.texto,
    'Y otra línea de mando muestra el mismo patrón: Gerencia de Operaciones',
  );
  assert.equal(acto.factorizacion!.link, 'Ver el detalle →');
  assert.deepEqual(acto.factorizacion!.modal, [
    { gerencia: 'Gerencia de Operaciones', deptNames: ['Soporte', 'Logística', 'Bodega'] },
  ]);
});

test('C2. una sola rama → factorización null', () => {
  const acto = buildElNombre(
    mkData([mkGroup('gA', ['a1', 'a2'])], [
      { id: 'a1', name: 'A1', isa: 30 },
      { id: 'a2', name: 'A2', isa: 70 },
    ]),
  )!;
  assert.equal(acto.factorizacion, null);
});

test('C3. cmob0e56 — NO emite (criticalByManager vacío: TI y Equipos Médicos no comparten padre)', () => {
  assert.equal(buildElNombre(mkData([], [])), null);
});

test('C4. grupo con <2 sub-deptos resueltos → se descarta (sin emisión)', () => {
  const acto = buildElNombre(
    mkData([mkGroup('gA', ['a1', 'x-no-existe'])], [{ id: 'a1', name: 'A1', isa: 30 }]),
  );
  assert.equal(acto, null);
});
