// ═══════════════════════════════════════════════════════════════════
// detectSilencioConVozExterna — tests (node:test + node:assert/strict)
// src/lib/services/compliance/detectSilencioConVozExterna.test.ts
// ═══════════════════════════════════════════════════════════════════
// Run:
//   npx tsx --test src/lib/services/compliance/detectSilencioConVozExterna.test.ts
//
// Regla anti-fitting: inputs sintéticos puros, NO derivados de cmob0e56
// ni de ninguna campaña real. Cubre la matriz completa del motor:
//
//   1. Input vacío                                       → []
//   2. con_isa nunca entra (ni en sub_threshold ni d)    → excluido siempre
//   3. sub_threshold sin señal externa                   → []
//   4. sub_threshold con señal bajo umbral               → []
//   5. sub_threshold sabor A (skipped_privacy) + señal   → 1 item, saborSub:'A'
//   6. sub_threshold sabor B (no_response) + señal       → 1 item, saborSub:'B'
//   7. no_invitado + señal                                → 1 item, saborSub:null
//   8. no_invitado consultado como sub_threshold          → []
//   9. sub_threshold consultado como no_invitado          → []
//  10. Mismo input → dos buckets target → dos colecciones disjuntas
//  11. signalsCount cuenta sólo señales ≥ umbral; pesoMaximo es el max
// ═══════════════════════════════════════════════════════════════════

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  detectSilencioConVozExterna,
  type SilencioCandidate,
} from './detectSilencioConVozExterna';
import type { CoverageAnalyzedStatus } from './CoverageAnalysisService';
import type { DepartmentRiskAlertItem } from '@/types/compliance';

// ═══════════════════════════════════════════════════════════════════
// FACTORIES
// ═══════════════════════════════════════════════════════════════════

function mkAlerta(
  opts: Partial<DepartmentRiskAlertItem> & { pesoEfectivo: number },
): DepartmentRiskAlertItem {
  return {
    alertType: opts.alertType ?? 'exit_risk',
    producto: opts.producto ?? 'exit',
    pesoEfectivo: opts.pesoEfectivo,
  };
}

function mkCandidato(
  opts: Partial<SilencioCandidate> & {
    departmentId: string;
    analyzed: CoverageAnalyzedStatus;
  },
): SilencioCandidate {
  return {
    departmentId: opts.departmentId,
    departmentName: opts.departmentName ?? `name-${opts.departmentId}`,
    analyzed: opts.analyzed,
    alertas: opts.alertas ?? [],
  };
}

// Umbral canónico del módulo (espejo de SILENCIO_PESO_MIN); no se importa
// para mantener al test independiente del estado del export y de cambios
// al valor — el motor recibe el umbral por parámetro.
const UMBRAL = 2.0;

// ═══════════════════════════════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════════════════════════════

test('1. input vacío → []', () => {
  assert.deepEqual(detectSilencioConVozExterna([], 'sub_threshold', UMBRAL), []);
  assert.deepEqual(detectSilencioConVozExterna([], 'no_invitado', UMBRAL), []);
});

test('2. con_isa excluido siempre (sub_threshold y no_invitado)', () => {
  const candidatos: SilencioCandidate[] = [
    mkCandidato({
      departmentId: 'd1',
      analyzed: 'completed',
      alertas: [mkAlerta({ pesoEfectivo: 3.0 })],
    }),
  ];
  assert.deepEqual(
    detectSilencioConVozExterna(candidatos, 'sub_threshold', UMBRAL),
    [],
  );
  assert.deepEqual(
    detectSilencioConVozExterna(candidatos, 'no_invitado', UMBRAL),
    [],
  );
});

test('3. sub_threshold sin señal externa → []', () => {
  const candidatos: SilencioCandidate[] = [
    mkCandidato({
      departmentId: 'd1',
      analyzed: 'skipped_privacy',
      alertas: [],
    }),
    mkCandidato({
      departmentId: 'd2',
      analyzed: 'no_response',
      alertas: [],
    }),
  ];
  assert.deepEqual(
    detectSilencioConVozExterna(candidatos, 'sub_threshold', UMBRAL),
    [],
  );
});

test('4. sub_threshold con señal bajo umbral → []', () => {
  const candidatos: SilencioCandidate[] = [
    mkCandidato({
      departmentId: 'd1',
      analyzed: 'skipped_privacy',
      alertas: [mkAlerta({ pesoEfectivo: 1.5 })],
    }),
  ];
  assert.deepEqual(
    detectSilencioConVozExterna(candidatos, 'sub_threshold', UMBRAL),
    [],
  );
});

test('5. sub_threshold sabor A (skipped_privacy) + señal ≥ umbral', () => {
  const candidatos: SilencioCandidate[] = [
    mkCandidato({
      departmentId: 'd1',
      departmentName: 'Operaciones',
      analyzed: 'skipped_privacy',
      alertas: [mkAlerta({ pesoEfectivo: 2.0 })],
    }),
  ];
  const result = detectSilencioConVozExterna(
    candidatos,
    'sub_threshold',
    UMBRAL,
  );
  assert.equal(result.length, 1);
  assert.equal(result[0].departmentId, 'd1');
  assert.equal(result[0].analyzed, 'skipped_privacy');
  assert.equal(result[0].saborSub, 'A');
  assert.equal(result[0].signalsCount, 1);
  assert.equal(result[0].pesoMaximo, 2.0);
});

test('6. sub_threshold sabor B (no_response) + señal ≥ umbral', () => {
  const candidatos: SilencioCandidate[] = [
    mkCandidato({
      departmentId: 'd1',
      analyzed: 'no_response',
      alertas: [mkAlerta({ pesoEfectivo: 3.0 })],
    }),
  ];
  const result = detectSilencioConVozExterna(
    candidatos,
    'sub_threshold',
    UMBRAL,
  );
  assert.equal(result.length, 1);
  assert.equal(result[0].saborSub, 'B');
});

test('7. no_invitado + señal ≥ umbral → 1 item, saborSub:null', () => {
  const candidatos: SilencioCandidate[] = [
    mkCandidato({
      departmentId: 'd1',
      analyzed: 'not_invited',
      alertas: [mkAlerta({ pesoEfectivo: 2.5 })],
    }),
  ];
  const result = detectSilencioConVozExterna(candidatos, 'no_invitado', UMBRAL);
  assert.equal(result.length, 1);
  assert.equal(result[0].analyzed, 'not_invited');
  assert.equal(result[0].saborSub, null);
});

test('8. no_invitado consultado como sub_threshold → []', () => {
  const candidatos: SilencioCandidate[] = [
    mkCandidato({
      departmentId: 'd1',
      analyzed: 'not_invited',
      alertas: [mkAlerta({ pesoEfectivo: 3.0 })],
    }),
  ];
  assert.deepEqual(
    detectSilencioConVozExterna(candidatos, 'sub_threshold', UMBRAL),
    [],
  );
});

test('9. sub_threshold consultado como no_invitado → []', () => {
  const candidatos: SilencioCandidate[] = [
    mkCandidato({
      departmentId: 'd1',
      analyzed: 'skipped_privacy',
      alertas: [mkAlerta({ pesoEfectivo: 3.0 })],
    }),
    mkCandidato({
      departmentId: 'd2',
      analyzed: 'no_response',
      alertas: [mkAlerta({ pesoEfectivo: 3.0 })],
    }),
  ];
  assert.deepEqual(
    detectSilencioConVozExterna(candidatos, 'no_invitado', UMBRAL),
    [],
  );
});

test('10. mismo input → dos buckets → dos colecciones disjuntas', () => {
  const candidatos: SilencioCandidate[] = [
    mkCandidato({
      departmentId: 'd-completed',
      analyzed: 'completed',
      alertas: [mkAlerta({ pesoEfectivo: 3.0 })],
    }),
    mkCandidato({
      departmentId: 'd-privacy',
      analyzed: 'skipped_privacy',
      alertas: [mkAlerta({ pesoEfectivo: 2.5 })],
    }),
    mkCandidato({
      departmentId: 'd-noresp',
      analyzed: 'no_response',
      alertas: [mkAlerta({ pesoEfectivo: 2.0 })],
    }),
    mkCandidato({
      departmentId: 'd-noinv',
      analyzed: 'not_invited',
      alertas: [mkAlerta({ pesoEfectivo: 3.0 })],
    }),
  ];

  const sexta = detectSilencioConVozExterna(
    candidatos,
    'sub_threshold',
    UMBRAL,
  );
  const otro = detectSilencioConVozExterna(candidatos, 'no_invitado', UMBRAL);

  const sextaIds = sexta.map((x) => x.departmentId).sort();
  const otroIds = otro.map((x) => x.departmentId).sort();

  assert.deepEqual(sextaIds, ['d-noresp', 'd-privacy']);
  assert.deepEqual(otroIds, ['d-noinv']);

  // Disjuntos.
  const intersect = sextaIds.filter((id) => otroIds.includes(id));
  assert.deepEqual(intersect, []);
});

test('11. signalsCount cuenta sólo señales ≥ umbral; pesoMaximo es el max', () => {
  const candidatos: SilencioCandidate[] = [
    mkCandidato({
      departmentId: 'd1',
      analyzed: 'skipped_privacy',
      alertas: [
        mkAlerta({ pesoEfectivo: 0.5 }), // descartado
        mkAlerta({ pesoEfectivo: 2.0 }), // contado
        mkAlerta({ pesoEfectivo: 1.9 }), // descartado (estricto < umbral)
        mkAlerta({ pesoEfectivo: 3.0 }), // contado, max
      ],
    }),
  ];
  const result = detectSilencioConVozExterna(
    candidatos,
    'sub_threshold',
    UMBRAL,
  );
  assert.equal(result.length, 1);
  assert.equal(result[0].signalsCount, 2);
  assert.equal(result[0].pesoMaximo, 3.0);
});
