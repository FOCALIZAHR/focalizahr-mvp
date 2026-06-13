// ═══════════════════════════════════════════════════════════════════
// CascadaNarrativeDictionary — oráculo del Ancla Científica · Gate 6 ítem 3
// src/lib/services/compliance/CascadaNarrativeDictionary.test.ts
// ═══════════════════════════════════════════════════════════════════
// Run: npx tsx --test src/lib/services/compliance/CascadaNarrativeDictionary.test.ts
// ═══════════════════════════════════════════════════════════════════

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { PREDICTOR_TOOLTIP } from './CascadaNarrativeDictionary';

test('PREDICTOR_TOOLTIP — verbatim (3 elementos: cálculo/fuente · negocio · umbrales)', () => {
  assert.equal(
    PREDICTOR_TOOLTIP,
    'La cultura tóxica predice rotación 10 veces mejor que la compensación. ' +
      'No es que la gente se va por sueldo: se va porque el ambiente la expulsa. ' +
      'Se considera señal fuerte cuando el ambiente queda bajo el nivel sano; ' +
      'bajo nivel crítico, es el predictor que manda sobre cualquier otro. ' +
      'Fuente: MIT Sloan Management Review, 2022. Muestra: 500 empresas, ' +
      '170 factores culturales analizados.',
  );
});

test('PREDICTOR_TOOLTIP — sin em-dash (regla global)', () => {
  assert.equal(PREDICTOR_TOOLTIP.includes('—'), false);
});
