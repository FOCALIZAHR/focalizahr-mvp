// src/lib/services/compliance/opcionA-orgisa.test.ts
// Oráculos de Opción A (orgISA agregado directo, fallback-only).
// Run: npx tsx --test src/lib/services/compliance/opcionA-orgisa.test.ts

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveOrgIsa } from './ISAService';
import { computePooledOrgScore, type ResponseRow } from '../SafetyScoreService';

// ════════════════════════════════════════════════════════════════════════════
// CANDADO DEL 49 (obligatorio) — el bottom-up existente NUNCA se sobrescribe.
// ════════════════════════════════════════════════════════════════════════════
test('CANDADO: bottom-up no-null se usa tal cual (49 intacto, delta 0)', () => {
  const r = resolveOrgIsa({ bottomUpIsa: 49, orgSafetyScore: 2.25 });
  assert.equal(r.isa, 49);
  assert.equal(r.isaParcial, false);
});

// ════════════════════════════════════════════════════════════════════════════
// FALLBACK — ningún depto >=5 (bottom-up null) pero hay safety org → safety-only.
// ════════════════════════════════════════════════════════════════════════════
test('FALLBACK: bottom-up null + safety org → ISA safety-only + isaParcial', () => {
  // round(2.25/5*100) = 45
  const r = resolveOrgIsa({ bottomUpIsa: null, orgSafetyScore: 2.25 });
  assert.equal(r.isa, 45);
  assert.equal(r.isaParcial, true);
});

test('FALLBACK: sin bottom-up ni safety org → null (no inventa número)', () => {
  const r = resolveOrgIsa({ bottomUpIsa: null, orgSafetyScore: null });
  assert.equal(r.isa, null);
  assert.equal(r.isaParcial, false);
});

// ════════════════════════════════════════════════════════════════════════════
// POOLED — el agregado org se gatea por total >=5 (privacy), NO por depto.
// ════════════════════════════════════════════════════════════════════════════
function mkRows(participants: number): ResponseRow[] {
  const rows: ResponseRow[] = [];
  for (let p = 0; p < participants; p++) {
    for (const q of [2, 3, 4, 5, 7, 8]) {
      rows.push({
        normalizedScore: 3,
        questionOrder: q,
        participantId: `p${p}`,
        departmentId: `d${p % 4}`, // dispersos en 4 deptos: ninguno llega a 5
        gender: null,
      });
    }
  }
  return rows;
}

test('POOLED: <5 respondentes únicos → null (piso de privacidad org)', () => {
  assert.equal(computePooledOrgScore(mkRows(4)), null);
});

test('POOLED: >=5 respondentes únicos → score directo (aunque ningún depto >=5)', () => {
  const s = computePooledOrgScore(mkRows(6));
  // P4/P8 invertidas (6-3=3); las 6 dims promedian 3 → safety 3.
  assert.equal(s, 3);
});
