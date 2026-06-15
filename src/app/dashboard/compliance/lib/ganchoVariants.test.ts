// src/app/dashboard/compliance/lib/ganchoVariants.test.ts
// Oráculo del selector del Gancho — una celda por cada (diagnosticType, gap).
// Run: npx tsx --test src/app/dashboard/compliance/lib/ganchoVariants.test.ts

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  selectGanchoVariant,
  interpolateGancho,
  GANCHO_VARIANTS,
  GANCHO_GAP_DE_POCOS,
  ISA_PARCIAL_CAPTION,
  type GanchoVariantKey,
} from './ganchoVariants';
import { ISA_LABELS } from '@/lib/services/compliance/ISAService';

const ISA = 70; // orgISA presente (no-null) para las celdas no-generic

// ── Tipos de crisis → Crítico ────────────────────────────────────────────────
test('FUEGO_LEGAL → critico', () => {
  assert.equal(selectGanchoVariant('FUEGO_LEGAL', 10, ISA), 'critico');
});
test('CONCENTRACION_MANDO → critico', () => {
  assert.equal(selectGanchoVariant('CONCENTRACION_MANDO', 10, ISA), 'critico');
});
test('SISTEMICO_SIN_MANDO → critico', () => {
  assert.equal(selectGanchoVariant('SISTEMICO_SIN_MANDO', 10, ISA), 'critico');
});

// ── Silencio → Riesgo + silencio ─────────────────────────────────────────────
test('SILENCIO_SIN_VOZ → riesgo_silencio', () => {
  assert.equal(selectGanchoVariant('SILENCIO_SIN_VOZ', 60, ISA), 'riesgo_silencio');
});

// ── Atención (3 sabores por fuente) ──────────────────────────────────────────
test('CONTRADICCION_TEATRO → atencion_teatro', () => {
  assert.equal(selectGanchoVariant('CONTRADICCION_TEATRO', 10, ISA), 'atencion_teatro');
});
test('OBSERVACION_SIN_FOCO → atencion_observacion', () => {
  assert.equal(selectGanchoVariant('OBSERVACION_SIN_FOCO', 10, ISA), 'atencion_observacion');
});

// ── Tipos sanos: corte por coverageGap (umbral 30) ───────────────────────────
test('TODO_BIEN + gap<30 → sano_pleno', () => {
  assert.equal(selectGanchoVariant('TODO_BIEN', 29, 85), 'sano_pleno');
});
test('TODO_BIEN + gap===30 → sano_de_pocos (borde inclusivo)', () => {
  assert.equal(selectGanchoVariant('TODO_BIEN', GANCHO_GAP_DE_POCOS, 85), 'sano_de_pocos');
});
test('TODO_BIEN + gap>30 → sano_de_pocos', () => {
  assert.equal(selectGanchoVariant('TODO_BIEN', 45, 85), 'sano_de_pocos');
});
test('BIEN_CON_FOCOS + gap<30 → atencion_bien_focos', () => {
  assert.equal(selectGanchoVariant('BIEN_CON_FOCOS', 29, 85), 'atencion_bien_focos');
});
test('BIEN_CON_FOCOS + gap===30 → sano_de_pocos (borde inclusivo)', () => {
  assert.equal(selectGanchoVariant('BIEN_CON_FOCOS', GANCHO_GAP_DE_POCOS, 85), 'sano_de_pocos');
});

// ── GENERIC + orgISA null ────────────────────────────────────────────────────
test('GENERIC → generic', () => {
  assert.equal(selectGanchoVariant('GENERIC', 10, ISA), 'generic');
});
test('orgISA null → generic, sin importar el tipo', () => {
  assert.equal(selectGanchoVariant('SILENCIO_SIN_VOZ', 60, null), 'generic');
  assert.equal(selectGanchoVariant('TODO_BIEN', 10, null), 'generic');
  assert.equal(selectGanchoVariant('FUEGO_LEGAL', 10, null), 'generic');
});

// ── Interpolación {n} ────────────────────────────────────────────────────────
test('interpolateGancho reemplaza {n} por orgISA', () => {
  assert.equal(interpolateGancho('{n} de 100', 49), '49 de 100');
  assert.equal(interpolateGancho('Cerró en {n}, y...', 49), 'Cerró en 49, y...');
});
test('interpolateGancho no-op sobre string vacío', () => {
  assert.equal(interpolateGancho('', 49), '');
});

// ── Integridad de la copy ────────────────────────────────────────────────────
test('toda variante no-generic tiene titular + insight; ninguna usa {dimFoco}', () => {
  for (const key of Object.keys(GANCHO_VARIANTS) as GanchoVariantKey[]) {
    const v = GANCHO_VARIANTS[key];
    assert.ok(v.badgeLabel.length > 0, `${key} sin badgeLabel`);
    assert.ok(v.tone.startsWith('#'), `${key} tono inválido`);
    assert.ok(!v.titular.includes('{dimFoco}'), `${key} titular usa {dimFoco}`);
    assert.ok(!v.insight.includes('{dimFoco}'), `${key} insight usa {dimFoco}`);
    if (key !== 'generic') {
      assert.ok(v.titular.length > 0, `${key} sin titular`);
      assert.ok(v.insight.length > 0, `${key} sin insight`);
      assert.ok(v.titular.includes('{n}'), `${key} titular no incrusta {n}`);
    }
  }
});

test('GENERIC tiene copy de cobertura-por-área (no vacío, sin {n} ni {dimFoco})', () => {
  const g = GANCHO_VARIANTS.generic;
  assert.ok(g.titular.length > 0, 'generic sin titular de cobertura');
  assert.ok(g.insight.length > 0, 'generic sin insight de cobertura');
  assert.ok(!g.titular.includes('{n}'), 'generic no debe incrustar {n}');
  assert.ok(!g.titular.includes('{dimFoco}'));
});

test('CAPTION isaParcial: versión B (negocio), sin em-dash, nombra participación', () => {
  assert.ok(ISA_PARCIAL_CAPTION.length > 0, 'caption vacía');
  assert.ok(!ISA_PARCIAL_CAPTION.includes('—'), 'caption con em-dash');
  assert.ok(ISA_PARCIAL_CAPTION.includes('participación'), 'caption no nombra participación');
  assert.ok(ISA_PARCIAL_CAPTION.includes('5 respuestas'), 'caption no nombra el umbral');
});

// ── Fix de léxico ISA (HANDOFF §6): indicio != confirmado ────────────────────
test('ISA_LABELS.riesgo.descripcion no afirma "confirmados"', () => {
  assert.equal(ISA_LABELS.riesgo.descripcion, 'Señales que ameritan revisión.');
  assert.ok(!ISA_LABELS.riesgo.descripcion.toLowerCase().includes('confirmados'));
});
test('ISA_LABELS.critico.descripcion suaviza "convergencia"', () => {
  assert.equal(ISA_LABELS.critico.descripcion, 'Señales que convergen. Prioridad alta.');
});
