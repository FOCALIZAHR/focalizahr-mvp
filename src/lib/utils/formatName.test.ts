// ═══════════════════════════════════════════════════════════════════
// formatDepartmentName — tests (node:test + node:assert/strict)
// src/lib/utils/formatName.test.ts
// ═══════════════════════════════════════════════════════════════════
// Run: npx tsx --test src/lib/utils/formatName.test.ts
//
// Candado del comportamiento nuevo (Gate 2c §6): preposiciones en mayúscula
// (idx>0) NO son acrónimos; acrónimos cortos reales se preservan; una
// preposición en PRIMERA posición se capitaliza (no se baja).
// ═══════════════════════════════════════════════════════════════════

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { formatDepartmentName } from './formatName';

test('preposición en mayúscula (idx>0) → minúscula, NO acrónimo', () => {
  // El caso del contrato §6.
  assert.equal(formatDepartmentName('GERENCIA DE PERSONAS'), 'Gerencia de Personas');
  assert.equal(formatDepartmentName('GERENCIA DE OPERACIONES'), 'Gerencia de Operaciones');
});

test('acrónimos cortos reales se preservan (TI, RRHH, DO)', () => {
  assert.equal(formatDepartmentName('Gerencia TI'), 'Gerencia TI');
  assert.equal(formatDepartmentName('RRHH Central'), 'RRHH Central');
  // "y" preposición en minúscula; "DO" acrónimo preservado.
  assert.equal(
    formatDepartmentName('Subgerencia de Cultura y DO'),
    'Subgerencia de Cultura y DO',
  );
});

test('preposición en PRIMERA posición se capitaliza (no se baja)', () => {
  // "de" primero → "De"; "la" en medio → "la".
  assert.equal(formatDepartmentName('de la costa'), 'De la Costa');
  assert.equal(formatDepartmentName('los andes'), 'Los Andes');
});

test('títulos normales — title case por palabra, preposiciones intermedias', () => {
  assert.equal(formatDepartmentName('Desarrollo Software'), 'Desarrollo Software');
  assert.equal(formatDepartmentName('gerencia de servicio'), 'Gerencia de Servicio');
});

test('borde — vacío / espacios', () => {
  assert.equal(formatDepartmentName(''), '');
  assert.equal(formatDepartmentName('   '), '');
});
