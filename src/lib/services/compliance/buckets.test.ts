// ═══════════════════════════════════════════════════════════════════
// buckets — tests (node:test + node:assert/strict)
// src/lib/services/compliance/buckets.test.ts
// ═══════════════════════════════════════════════════════════════════
// Run:
//   npx tsx --test src/lib/services/compliance/buckets.test.ts
//
// Tests de la lógica canónica de "analyzed" del módulo Ambiente Sano:
//   - deriveAnalyzed: cada combo (status, invited, responded) → analyzed esperado.
//   - bucketFromAnalyzed: los 4 inputs → 3 buckets.
// ═══════════════════════════════════════════════════════════════════

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { deriveAnalyzed, bucketFromAnalyzed } from './buckets';

// ═══════════════════════════════════════════════════════════════════
// deriveAnalyzed — matriz completa de inputs
// ═══════════════════════════════════════════════════════════════════

test('deriveAnalyzed: status=COMPLETED gana sobre cualquier invited/responded', () => {
  assert.equal(
    deriveAnalyzed({ status: 'COMPLETED', invited: 10, responded: 8 }),
    'completed',
  );
  // Edge: status COMPLETED con invited 0 (incongruente pero defensive).
  assert.equal(
    deriveAnalyzed({ status: 'COMPLETED', invited: 0, responded: 0 }),
    'completed',
  );
});

test('deriveAnalyzed: invited===0 → not_invited (cuando no es COMPLETED)', () => {
  assert.equal(
    deriveAnalyzed({ status: null, invited: 0, responded: 0 }),
    'not_invited',
  );
  assert.equal(
    deriveAnalyzed({ status: undefined, invited: 0, responded: 0 }),
    'not_invited',
  );
  assert.equal(
    deriveAnalyzed({ status: 'FAILED', invited: 0, responded: 0 }),
    'not_invited',
  );
});

test('deriveAnalyzed: invited>0 y responded===0 → no_response', () => {
  assert.equal(
    deriveAnalyzed({ status: null, invited: 5, responded: 0 }),
    'no_response',
  );
  assert.equal(
    deriveAnalyzed({ status: 'PENDING', invited: 10, responded: 0 }),
    'no_response',
  );
  assert.equal(
    deriveAnalyzed({ status: 'RUNNING', invited: 3, responded: 0 }),
    'no_response',
  );
});

test('deriveAnalyzed: invited>0 y responded>0 sin COMPLETED → skipped_privacy', () => {
  // n<5 respondentes → análisis falla por privacy.
  assert.equal(
    deriveAnalyzed({ status: 'FAILED', invited: 8, responded: 4 }),
    'skipped_privacy',
  );
  // Cualquier status no-COMPLETED con respuestas activas.
  assert.equal(
    deriveAnalyzed({ status: 'PENDING', invited: 20, responded: 10 }),
    'skipped_privacy',
  );
  assert.equal(
    deriveAnalyzed({ status: null, invited: 50, responded: 25 }),
    'skipped_privacy',
  );
});

test('deriveAnalyzed: orden de las ramas — completed > not_invited > no_response > skipped_privacy', () => {
  // status COMPLETED con invited 0 → completed (no not_invited).
  assert.equal(
    deriveAnalyzed({ status: 'COMPLETED', invited: 0, responded: 0 }),
    'completed',
  );
  // invited 0 con responded > 0 (incongruente — defensive) → not_invited.
  assert.equal(
    deriveAnalyzed({ status: null, invited: 0, responded: 5 }),
    'not_invited',
  );
});

// ═══════════════════════════════════════════════════════════════════
// bucketFromAnalyzed — 4 → 3 mapping
// ═══════════════════════════════════════════════════════════════════

test('bucketFromAnalyzed: completed → con_isa', () => {
  assert.equal(bucketFromAnalyzed('completed'), 'con_isa');
});

test('bucketFromAnalyzed: not_invited → no_invitado', () => {
  assert.equal(bucketFromAnalyzed('not_invited'), 'no_invitado');
});

test('bucketFromAnalyzed: skipped_privacy y no_response → sub_threshold', () => {
  assert.equal(bucketFromAnalyzed('skipped_privacy'), 'sub_threshold');
  assert.equal(bucketFromAnalyzed('no_response'), 'sub_threshold');
});
