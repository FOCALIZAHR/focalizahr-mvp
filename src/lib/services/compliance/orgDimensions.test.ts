// ═══════════════════════════════════════════════════════════════════
// orgDimensions — tests (node:test + node:assert/strict) · Gate 3 §1-2
// src/lib/services/compliance/orgDimensions.test.ts
// ═══════════════════════════════════════════════════════════════════
// Run: npx tsx --test src/lib/services/compliance/orgDimensions.test.ts
//
// Oráculos de fundación (3a):
//   A. dimFoco — doble filtro (gravedad → precedencia causal).
//   B. toDisplay100 — conversión 1–5 → 0–100 + espejo de classifyDimensionLevel.
// ═══════════════════════════════════════════════════════════════════

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  dimFoco,
  toDisplay100,
  DISPLAY_THRESHOLDS,
  type OrgDimension,
} from './orgDimensions';
import { classifyDimensionLevel } from '@/config/narratives/ComplianceNarrativeDictionary';
import type { ComplianceDimensionKey } from '@/config/narratives/ComplianceNarrativeDictionary';

/** Helper — arma un OrgDimension derivando el nivel del valor (como el motor). */
function dim(key: ComplianceDimensionKey, valor: number): OrgDimension {
  return { key, valor, level: classifyDimensionLevel(valor) };
}

// ═══════════════════════════════════════════════════════════════════
// A — dimFoco (doble filtro)
// ═══════════════════════════════════════════════════════════════════

test('A1. caso real — P2 (1.8) gana sobre P5 (1.4): ambas crítico, precedencia decide', () => {
  const dims = [
    dim('P2_seguridad', 1.8),
    dim('P5_equidad', 1.4),
    dim('P7_liderazgo', 3.2),
    dim('P3_disenso', 2.5),
    dim('P4_microagresiones', 4.1),
    dim('P8_agotamiento', 3.8),
  ];
  const foco = dimFoco(dims);
  assert.equal(foco?.key, 'P2_seguridad');
  assert.equal(foco?.valor, 1.8);
  assert.equal(foco?.level, 'critico');
});

test('A2. gravedad primero — P4 crítico (1.1) gana sobre P2 riesgo (2.9)', () => {
  const dims = [
    dim('P2_seguridad', 2.9), // riesgo (≥2.0, <3.0)
    dim('P4_microagresiones', 1.1), // crítico (<2.0)
  ];
  const foco = dimFoco(dims);
  assert.equal(foco?.key, 'P4_microagresiones');
  assert.equal(foco?.level, 'critico');
});

test('A3. mismo nivel (riesgo) — precedencia P7 > P5', () => {
  const dims = [dim('P5_equidad', 2.1), dim('P7_liderazgo', 2.8)];
  // Ambas riesgo; precedencia: P7 (índice 1) gana a P5 (índice 3).
  assert.equal(dimFoco(dims)?.key, 'P7_liderazgo');
});

test('A4. todas en sano → sin foco (null)', () => {
  const dims = [
    dim('P2_seguridad', 4.2),
    dim('P7_liderazgo', 4.5),
    dim('P4_microagresiones', 4.0),
  ];
  assert.equal(dimFoco(dims), null);
});

test('A5. una sola dim no-sana → es el foco', () => {
  const dims = [dim('P2_seguridad', 4.5), dim('P8_agotamiento', 2.7)];
  assert.equal(dimFoco(dims)?.key, 'P8_agotamiento');
});

// ═══════════════════════════════════════════════════════════════════
// B — toDisplay100 + espejo de classifyDimensionLevel
// ═══════════════════════════════════════════════════════════════════

test('B1. toDisplay100 — extremos y caso real', () => {
  assert.equal(toDisplay100(1.0), 0);
  assert.equal(toDisplay100(5.0), 100);
  assert.equal(toDisplay100(3.0), 50);
  assert.equal(toDisplay100(1.8), 20); // P2 del caso real
  assert.equal(toDisplay100(1.4), 10); // P5 del caso real
  assert.equal(toDisplay100(2.9), 48); // 47.5 → 48
});

test('B2. umbrales de display = espejo EXACTO de classifyDimensionLevel', () => {
  // Las fronteras 1-5 del clasificador mapean a los umbrales de display.
  assert.equal(toDisplay100(4.0), DISPLAY_THRESHOLDS.sano); // 75
  assert.equal(toDisplay100(3.0), DISPLAY_THRESHOLDS.atencion); // 50
  assert.equal(toDisplay100(2.0), DISPLAY_THRESHOLDS.riesgo); // 25
  // Y los niveles canónicos en esas fronteras:
  assert.equal(classifyDimensionLevel(4.0), 'sano');
  assert.equal(classifyDimensionLevel(3.0), 'atencion');
  assert.equal(classifyDimensionLevel(2.0), 'riesgo');
  assert.equal(classifyDimensionLevel(1.99), 'critico');
});
