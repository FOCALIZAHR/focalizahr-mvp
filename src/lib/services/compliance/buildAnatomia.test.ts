// ═══════════════════════════════════════════════════════════════════
// buildAnatomia — tests (node:test + node:assert/strict) · Gate 3b
// src/lib/services/compliance/buildAnatomia.test.ts
// ═══════════════════════════════════════════════════════════════════
// Run: npx tsx --test src/lib/services/compliance/buildAnatomia.test.ts
//
// Oráculos verbatim de las 4 formas (§4.1) + cierre (§4.6) + causa raíz (§5)
// + listado por gravedad/precedencia (§4.3) + caso real TODO BAJO (foco P2).
// ═══════════════════════════════════════════════════════════════════

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { buildAnatomia, buildAnatomiaModal } from './buildAnatomia';
import {
  classifyDimensionLevel,
  getDimensionNarrative,
} from '@/config/narratives/ComplianceNarrativeDictionary';
import type { ComplianceDimensionKey } from '@/config/narratives/ComplianceNarrativeDictionary';
import type { OrgDimension } from './orgDimensions';

function dim(key: ComplianceDimensionKey, valor: number): OrgDimension {
  return { key, valor, level: classifyDimensionLevel(valor) };
}

// ═══════════════════════════════════════════════════════════════════
// A — CASO REAL (TODO BAJO, foco P2)
// ═══════════════════════════════════════════════════════════════════

test('A1. caso real — forma TODO BAJO, foco P2, hero 0/6 ámbar', () => {
  const dims = [
    dim('P2_seguridad', 1.8), // 20 crítico
    dim('P5_equidad', 1.4), // 10 crítico
    dim('P3_disenso', 2.2), // 30 riesgo
    dim('P4_microagresiones', 2.6), // 40 riesgo
    dim('P8_agotamiento', 2.0), // 25 riesgo
    dim('P7_liderazgo', 3.0), // 50 atención
  ];
  const a = buildAnatomia(dims, 43)!;
  assert.equal(a.forma, 'TODO_BAJO');
  assert.equal(a.focoKey, 'P2_seguridad');
  assert.deepEqual(a.hero, { dimsEnSano: 0, total: 6, color: 'amber' });
  assert.equal(a.titular, 'No hay una grieta: el piso está parejo y bajo.');
  assert.deepEqual(a.parrafos, [
    'Ninguna condición sostiene al resto: todas caen por debajo de la línea. El problema no está localizado, es transversal.',
  ]);
  assert.deepEqual(a.focoParrafo, {
    pre: 'Aun así, una pesa más que las demás: ',
    foco: 'la seguridad para hablar',
    post: '.',
  });
  assert.equal(
    a.causaRaiz,
    'Esta es la hemorragia principal de la unidad: si el equipo siente que hablar es peligroso, las respuestas del resto de las dimensiones pueden estar maquilladas. El talento está gastando energía en protegerse, no en resolver problemas.',
  );
  assert.equal(
    a.cierre,
    'Cuando todo cede a la vez, perseguir el promedio es lo más fácil y lo más inútil.',
  );
  assert.equal(a.scaleLine, 'Escala 0–100 · un ambiente sano parte en 75');
  assert.equal(a.modalLink, 'Ver el detalle de las 6 dimensiones →');
});

test('A2. caso real — listado por gravedad + precedencia + display', () => {
  const dims = [
    dim('P2_seguridad', 1.8),
    dim('P5_equidad', 1.4),
    dim('P3_disenso', 2.2),
    dim('P4_microagresiones', 2.6),
    dim('P8_agotamiento', 2.0),
    dim('P7_liderazgo', 3.0),
  ];
  const a = buildAnatomia(dims, 43)!;
  // Grupos: crítico → riesgo → atención.
  assert.deepEqual(a.grupos.map((g) => g.kicker), ['EN CRÍTICO', 'EN RIESGO', 'EN ATENCIÓN']);
  // Crítico: P2 (prec 0) antes que P5 (prec 3).
  assert.deepEqual(
    a.grupos[0].items.map((i) => `${i.labelCEO} · ${i.display}`),
    ['Seguridad psicológica · 20', 'Equidad de reglas · 10'],
  );
  // Riesgo: P3 (prec 2) · P4 (prec 4) · P8 (prec 5).
  assert.deepEqual(
    a.grupos[1].items.map((i) => `${i.labelCEO} · ${i.display}`),
    ['Manejo del disenso · 30', 'Respeto cotidiano · 40', 'Sostenibilidad relacional · 25'],
  );
  assert.deepEqual(
    a.grupos[2].items.map((i) => `${i.labelCEO} · ${i.display}`),
    ['Calidad de liderazgo · 50'],
  );
});

// ═══════════════════════════════════════════════════════════════════
// B — OTRAS FORMAS
// ═══════════════════════════════════════════════════════════════════

test('B1. DESPAREJO (plural) — másAlta + 2 bajas + foco + orgISA', () => {
  const dims = [
    dim('P7_liderazgo', 4.3), // sana (másAlta)
    dim('P3_disenso', 4.1), // sana
    dim('P2_seguridad', 1.8), // crítico (foco)
    dim('P5_equidad', 1.4), // crítico
    dim('P4_microagresiones', 3.2), // atención
    dim('P8_agotamiento', 3.5), // atención
  ];
  const a = buildAnatomia(dims, 52)!;
  assert.equal(a.forma, 'DESPAREJO');
  assert.equal(a.focoKey, 'P2_seguridad');
  assert.equal(a.titular, 'El número no se mueve parejo.');
  assert.deepEqual(a.parrafos, [
    'Lo que mejor se sostiene es la calidad del liderazgo. No es un punto fuerte, pero es el piso desde donde se construye.',
    'Lo que más lo arrastra son la equidad de reglas y la seguridad para hablar, las dos que más caen por debajo de la línea. El 52 es bajo, sobre todo, por ellas.',
  ]);
  assert.deepEqual(a.focoParrafo, {
    pre: 'Y por debajo de todo, una condición define el resto: ',
    foco: 'la seguridad para hablar',
    post: '.',
  });
  assert.equal(a.cierre, 'Perseguir el promedio no mueve nada. Mover la condición que manda, sí.');
});

test('B2. DESPAREJO singular — una sola bajo umbral = el foco', () => {
  const dims = [
    dim('P7_liderazgo', 4.3),
    dim('P3_disenso', 4.1),
    dim('P4_microagresiones', 4.0),
    dim('P8_agotamiento', 1.6), // única bajo umbral (crítico) = foco
  ];
  const a = buildAnatomia(dims, 60)!;
  assert.equal(a.forma, 'DESPAREJO_SINGULAR');
  assert.equal(a.focoKey, 'P8_agotamiento');
  assert.deepEqual(a.parrafos, [
    'Lo que mejor se sostiene es la calidad del liderazgo. No es un punto fuerte, pero es el piso desde donde se construye.',
  ]);
  assert.deepEqual(a.focoParrafo, {
    pre: 'Lo que lo arrastra es ',
    foco: 'el desgaste de convivir',
    post: ', la única por debajo de la línea. El 60 es bajo, sobre todo, por ella.',
  });
});

test('B3. TODO SANO — sin foco, sin causa raíz', () => {
  const dims = [
    dim('P2_seguridad', 4.2),
    dim('P7_liderazgo', 4.5),
    dim('P3_disenso', 4.1),
  ];
  const a = buildAnatomia(dims, 88)!;
  assert.equal(a.forma, 'TODO_SANO');
  assert.equal(a.focoKey, null);
  assert.equal(a.focoParrafo, null);
  assert.equal(a.causaRaiz, null);
  assert.deepEqual(a.hero, { dimsEnSano: 3, total: 3, color: 'cyan' });
  assert.equal(a.titular, 'El ambiente es sólido en todo el tablero.');
  assert.equal(a.cierre, 'Lo que hoy está sano no manda factura. La manda el día que se descuida.');
});

test('B4. vacío → null', () => {
  assert.equal(buildAnatomia([], 0), null);
});

// ═══════════════════════════════════════════════════════════════════
// C — MODAL §6 (buildAnatomiaModal)
// ═══════════════════════════════════════════════════════════════════

test('C1. modal — header + escala una vez + agrupado por nivel/precedencia', () => {
  const dims = [
    dim('P2_seguridad', 1.8),
    dim('P5_equidad', 1.4),
    dim('P3_disenso', 2.2),
    dim('P4_microagresiones', 2.6),
    dim('P8_agotamiento', 2.0),
    dim('P7_liderazgo', 3.0),
  ];
  const m = buildAnatomiaModal(dims)!;
  assert.equal(m.header, 'Las seis dimensiones');
  assert.equal(
    m.scaleLine,
    'Escala de 0 a 100 · sano desde 75 · ordenadas por gravedad y precedencia',
  );
  assert.deepEqual(m.grupos.map((g) => g.kicker), ['EN CRÍTICO', 'EN RIESGO', 'EN ATENCIÓN']);
  // Crítico: P2 (prec 0) antes que P5 (prec 3).
  assert.deepEqual(m.grupos[0].dims.map((d) => d.key), ['P2_seguridad', 'P5_equidad']);
});

test('C2. modal — línea por dimensión: CEO · display de 100 — label en minúscula', () => {
  const m = buildAnatomiaModal([dim('P2_seguridad', 1.8)])!;
  const p2 = m.grupos[0].dims[0];
  assert.equal(p2.labelCEO, 'Seguridad psicológica');
  assert.equal(p2.display, 20);
  assert.equal(p2.labelLower, 'lo que el equipo cree que pasaría si habla');
});

test('C3. modal — headline + body VERBATIM del motor (separados)', () => {
  const m = buildAnatomiaModal([dim('P2_seguridad', 1.8)])!;
  const expected = getDimensionNarrative('P2_seguridad', 'critico');
  assert.equal(m.grupos[0].dims[0].headline, expected.headline);
  assert.equal(m.grupos[0].dims[0].body, expected.body);
});
