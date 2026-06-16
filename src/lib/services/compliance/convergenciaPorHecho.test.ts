// src/lib/services/compliance/convergenciaPorHecho.test.ts
// Oráculos del gate "convergencia por hecho, no por estado".
// Candado de la selección estado/fecha de `loadDepartmentExternalAlerts`.
// Run: npx tsx --test src/lib/services/compliance/convergenciaPorHecho.test.ts

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  resolveExternalAlertMode,
  buildExternalAlertModeWhere,
} from './ConvergenciaEngine';

const cutoffs = {
  factWindowCutoff: new Date('2025-06-16T00:00:00.000Z'), // 12m
  historicalCutoff: new Date('2025-12-16T00:00:00.000Z'), // 6m
};

// ════════════════════════════════════════════════════════════════════════════
// resolveExternalAlertMode — precedencia
// ════════════════════════════════════════════════════════════════════════════

test('modo default (sin opts) = fase2', () => {
  assert.equal(resolveExternalAlertMode(), 'fase2');
  assert.equal(resolveExternalAlertMode({}), 'fase2');
});

test('porHecho → modo porHecho', () => {
  assert.equal(resolveExternalAlertMode({ porHecho: true }), 'porHecho');
});

test('includeHistorical → modo historical', () => {
  assert.equal(resolveExternalAlertMode({ includeHistorical: true }), 'historical');
});

test('CANDADO precedencia: porHecho gana sobre includeHistorical', () => {
  assert.equal(
    resolveExternalAlertMode({ porHecho: true, includeHistorical: true }),
    'porHecho',
  );
});

// ════════════════════════════════════════════════════════════════════════════
// buildExternalAlertModeWhere — SELLO del gate
// ════════════════════════════════════════════════════════════════════════════

test('CANDADO porHecho: status-AGNÓSTICO (sin key status) + ventana 12m', () => {
  const where = buildExternalAlertModeWhere('porHecho', cutoffs);
  // (a) estado FUERA: no debe existir filtro por status.
  assert.equal('status' in where, false, 'porHecho NO debe filtrar por estado');
  assert.equal('OR' in where, false, 'porHecho NO usa OR de histórico');
  // (b) ventana 12m por createdAt.
  assert.deepEqual(where.createdAt, { gte: cutoffs.factWindowCutoff });
});

test('fase2 (default) intacto: solo activas, sin ventana de fecha', () => {
  const where = buildExternalAlertModeWhere('fase2', cutoffs);
  assert.deepEqual(where.status, { in: ['pending', 'acknowledged'] });
  assert.equal('createdAt' in where, false);
  assert.equal('OR' in where, false);
});

test('historical intacto: status all + OR con cutoff 6m', () => {
  const where = buildExternalAlertModeWhere('historical', cutoffs);
  assert.deepEqual(where.status, {
    in: ['pending', 'acknowledged', 'resolved', 'dismissed'],
  });
  assert.ok(Array.isArray(where.OR));
  const or = where.OR as Array<Record<string, unknown>>;
  assert.deepEqual(or[1], {
    status: { in: ['resolved', 'dismissed'] },
    resolvedAt: { gte: cutoffs.historicalCutoff },
  });
});
