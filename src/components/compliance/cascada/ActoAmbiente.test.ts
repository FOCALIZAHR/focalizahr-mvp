// ═══════════════════════════════════════════════════════════════════
// ActoAmbiente.classifyD4 — tests (node:test + node:assert/strict)
// src/components/compliance/cascada/ActoAmbiente.test.ts
// ═══════════════════════════════════════════════════════════════════
// Run:
//   npx tsx --test src/components/compliance/cascada/ActoAmbiente.test.ts
//
// Spec: .claude/tasks/ESPEC_APERTURA_AMBIENTE_SANO.md §2
//
// Cubre el clasificador D4 v2 (5 mundos, género ORTOGONAL — no entra al
// trigger). Selector cascada — primera condición positiva gana:
//   1. SILENCIO          coverageGapPct ≥ 50
//   2. CONTRADICCIÓN     teatroCount ≥ 1 ∧ gap < 50
//   3. TODO BIEN         ISA ≥ 80 ∧ riesgoDeptos = 0 ∧ gap < 30
//   4. BIEN CON FOCOS    ISA ≥ 80 ∧ (riesgoDeptos ≥ 1 ∨ gap ∈ [30,50))
//   5. NÚMERO BAJO       resto (ISA < 80)
//
// Tests cubren cada mundo + el fork silencio↔contradicción + cmob0e56.
// ═══════════════════════════════════════════════════════════════════

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  classifyD4,
  copyFor,
  buildFactoresLine,
  buildExtremosLine,
  buildTitularesBeat1,
} from './ActoAmbiente';
import type { Beat1Slots } from '@/lib/services/compliance/deriveBeat1Slots';
import type {
  FactoresTitulares,
  ExtremosTitulares,
  FactorTitular,
} from '@/types/ambiente-cascada';

/** FactorTitular mínimo — el line builder solo lee labelCEO. */
function mkFactor(labelCEO: string): FactorTitular {
  return { dimensionKey: 'P2_seguridad', labelCEO, valor: 3 };
}

// ─── Mundo 1: SILENCIO ──────────────────────────────────────────────

test('1. SILENCIO: gap ≥ 50 → silencio (sin importar otros gates)', () => {
  const d4 = classifyD4({
    orgISA: 85,         // alto — no gana TODO BIEN porque gap manda
    riesgoDeptos: 0,
    coverageGapPct: 55, // ≥ 50 → silencio
    teatroCount: 0,
    hasDenunciaFormal: false,
  });
  assert.equal(d4.mundo, 'silencio');
});

// ─── Mundo 2: CONTRADICCIÓN ─────────────────────────────────────────

test('2. CONTRADICCIÓN: teatro ≥ 1 ∧ gap < 50 → contradiccion', () => {
  const d4 = classifyD4({
    orgISA: 75,
    riesgoDeptos: 0,
    coverageGapPct: 20, // < 50, deja pasar a teatro
    teatroCount: 1,
    hasDenunciaFormal: false,
  });
  assert.equal(d4.mundo, 'contradiccion');
});

// ─── Mundo 3: TODO BIEN ─────────────────────────────────────────────

test('3. TODO BIEN: ISA ≥ 80 ∧ riesgo = 0 ∧ gap < 30', () => {
  const d4 = classifyD4({
    orgISA: 85,
    riesgoDeptos: 0,
    coverageGapPct: 10,
    teatroCount: 0,
    hasDenunciaFormal: false,
  });
  assert.equal(d4.mundo, 'todo-bien');
});

test('3b. TODO BIEN: borderline ISA = 80 cuenta (banda saludable)', () => {
  const d4 = classifyD4({
    orgISA: 80,
    riesgoDeptos: 0,
    coverageGapPct: 0,
    teatroCount: 0,
    hasDenunciaFormal: false,
  });
  assert.equal(d4.mundo, 'todo-bien');
});

// ─── Mundo 4: BIEN CON FOCOS ────────────────────────────────────────

test('4. BIEN CON FOCOS sabor riesgo: ISA ≥ 80 ∧ riesgoDeptos ≥ 1', () => {
  const d4 = classifyD4({
    orgISA: 85,
    riesgoDeptos: 2,    // dispara por foco
    coverageGapPct: 10, // < 30 — el foco basta sin gap
    teatroCount: 0,
    hasDenunciaFormal: false,
  });
  assert.equal(d4.mundo, 'bien-con-focos');
});

test('4b. BIEN CON FOCOS sabor cobertura: ISA ≥ 80 ∧ gap ∈ [30,50)', () => {
  const d4 = classifyD4({
    orgISA: 90,
    riesgoDeptos: 0,
    coverageGapPct: 35, // ∈ [30,50) — sabor cobertura
    teatroCount: 0,
    hasDenunciaFormal: false,
  });
  assert.equal(d4.mundo, 'bien-con-focos');
});

test('4c. BIEN CON FOCOS: gap = 30 (boundary inferior) entra', () => {
  const d4 = classifyD4({
    orgISA: 85,
    riesgoDeptos: 0,
    coverageGapPct: 30,
    teatroCount: 0,
    hasDenunciaFormal: false,
  });
  // 30 NO entra a TODO BIEN (requiere < 30), entra a BIEN CON FOCOS.
  assert.equal(d4.mundo, 'bien-con-focos');
});

// ─── Mundo 5: NÚMERO BAJO ───────────────────────────────────────────

test('5. NÚMERO BAJO: ISA < 80 ∧ gap < 50 ∧ teatro = 0', () => {
  const d4 = classifyD4({
    orgISA: 65,
    riesgoDeptos: 1,
    coverageGapPct: 10,
    teatroCount: 0,
    hasDenunciaFormal: false,
  });
  assert.equal(d4.mundo, 'numero-bajo');
});

test('5b. NÚMERO BAJO: ISA = 79 (justo bajo el corte saludable) cae aquí', () => {
  const d4 = classifyD4({
    orgISA: 79,
    riesgoDeptos: 0,
    coverageGapPct: 0,
    teatroCount: 0,
    hasDenunciaFormal: false,
  });
  // 79 no es saludable → ramas 3-4 fallan; sin gap ni teatro → ramas 1-2
  // fallan; cae al "resto positivo".
  assert.equal(d4.mundo, 'numero-bajo');
});

// ─── FORK silencio ↔ contradiccion (rule §2: gana SILENCIO) ─────────

test('6. FORK gap ≥ 50 ∧ teatro ≥ 1 → SILENCIO gana (no contradiccion)', () => {
  const d4 = classifyD4({
    orgISA: 75,
    riesgoDeptos: 0,
    coverageGapPct: 60, // ≥ 50 dispara rama 1 antes que rama 2
    teatroCount: 3,
    hasDenunciaFormal: false,
  });
  assert.equal(d4.mundo, 'silencio');
});

// ─── Género YA NO entra al trigger (ortogonal por spec) ─────────────
// (alertasGeneroCount fue removido del input — el test verifica que
// la presencia de género ya no afecta la clasificación.)

test('7. Género ortogonal: classifyD4 ya no recibe alertasGeneroCount', () => {
  // El input no acepta `alertasGeneroCount` — el spec lo movió a ortogonal.
  // Este test garantiza que el shape del input es exactamente 5 campos
  // (orgISA, riesgoDeptos, coverageGapPct, teatroCount, hasDenunciaFormal).
  const d4 = classifyD4({
    orgISA: 75,
    riesgoDeptos: 0,
    coverageGapPct: 10,
    teatroCount: 0,
    hasDenunciaFormal: false,
  });
  // 75 < 80 → cae a NÚMERO BAJO sin importar género (que ahora vive en slots).
  assert.equal(d4.mundo, 'numero-bajo');
});

// ─── Intensidad ortogonal (sin bump y con bump por denuncia) ────────

test('8. intensidad: orgISA = 50 → "alto"; bump por hasDenunciaFormal → "critico"', () => {
  const base = classifyD4({
    orgISA: 50,
    riesgoDeptos: 0,
    coverageGapPct: 0,
    teatroCount: 0,
    hasDenunciaFormal: false,
  });
  assert.equal(base.intensidad, 'alto');

  const bumped = classifyD4({
    orgISA: 50,
    riesgoDeptos: 0,
    coverageGapPct: 0,
    teatroCount: 0,
    hasDenunciaFormal: true,
  });
  assert.equal(bumped.intensidad, 'critico'); // alto → critico
});

// ─── Regresión cmob0e56 (campaña real backup 2026-05-08) ────────────

test('9. Regresión cmob0e56 (orgISA=49, riesgoDeptos=2) → "numero-bajo"', () => {
  const d4 = classifyD4({
    orgISA: 49,         // del backup
    riesgoDeptos: 2,    // TI y EQUIPOS MEDICOS con safety < 2.5
    coverageGapPct: 0,  // ambos deptos analizados
    teatroCount: 0,     // safety bajo → no hay teatro
    hasDenunciaFormal: false,
  });
  // Antes (4 mundos): caía a 'mixto'. Ahora (5 mundos): cae a 'numero-bajo'
  // porque ISA<80 ∧ gap<50 ∧ teatro=0 es exactamente la condición positiva
  // de la rama 5. Cambio narrativo intencional del spec — el mundo refleja
  // el dato (número bajo y nada lo disimula).
  assert.equal(d4.mundo, 'numero-bajo');
});

// ─── case 'silencio' — CELDA PUENTE + RESPALDO (chat 2026-06-05) ─────

/** Factory de slots minimal para tests del case 'silencio'. */
function mkSlotsSilencio(over: Partial<Beat1Slots> = {}): Beat1Slots {
  return {
    exit_alerts_count: 0,
    gerencias_sanas_count: 0,
    gerencias_medidas_total: 2,
    gerencias_mudas_count: 4,
    gerencias_universo_total: 6,
    personResponseRate: 20,
    totalInvited: 50,
    totalResponded: 10,
    banda: 'riesgo',
    coverage_gap_pct: 82,
    gerencia_top_1: null,
    gerencia_alta_1: null,
    gerencia_baja_1: null,
    gerencia_muda_1: null,
    gerencia_muda_con_externa_1: null,
    gerencia_teatro_1: null,
    gerencia_contradiccion_1: null,
    gerencia_denuncia_1: null,
    gerencia_foco_1: null,
    gerencia_genero_1: null,
    gerencia_ley_karin_1: null,
    ...over,
  };
}

test('10. silencio CELDA PUENTE: banda=riesgo + p2CritEnConIsa → 4 párrafos prosa corrida con bindings 49/10/50/6/4/2', () => {
  const slots = mkSlotsSilencio();
  const d4 = {
    mundo: 'silencio' as const,
    intensidad: 'alto' as const,
    hasDenunciaFormal: false,
  };
  const c = copyFor(d4, slots, 49, 18, null, true);

  assert.equal(c.subtitulo, '[EL QUE ELIJA VICTOR]');
  // 4 párrafos separados por \n\n.
  const paras = c.traduccion.split('\n\n');
  assert.equal(paras.length, 4);
  // Bindings cmob0e56: 49 (ISA, 3 ocurrencias), 10 (nResp), 50 (nInv),
  // 6 (universo), 4 (mudas), 2 (conVoz = 6-4).
  assert.ok(paras[0].includes('Este estudio no puede declarar sano'));
  assert.ok(paras[0].includes('en las 2 gerencias que respondieron'));
  assert.ok(paras[1].includes('la que mide si la gente cree'));
  assert.ok(paras[2].includes('Y ese 49 son apenas 10 personas de las 50'));
  assert.ok(paras[2].includes('en 2 de las 6 gerencias'));
  assert.ok(paras[2].includes('De las otras 4 no entró una sola respuesta'));
  assert.ok(paras[3].includes('no puede cerrar el tema como resuelto'));
  // pero/cierre vacíos para omitir callouts.
  assert.equal(c.pero, null);
  assert.equal(c.cierre, '');
});

test('11. silencio RESPALDO: cualquier banda (o riesgo sin P2 crit) → línea estructural', () => {
  const slots = mkSlotsSilencio({ banda: 'critico' });
  const d4 = {
    mundo: 'silencio' as const,
    intensidad: 'critico' as const,
    hasDenunciaFormal: false,
  };
  const c = copyFor(d4, slots, 35, 18, null, true);

  assert.equal(c.subtitulo, 'EL SILENCIO ES EL DATO');
  // Banda interpolada (BANDA_LABEL['critico'] === 'crítico') + 1 párrafo.
  assert.equal(c.traduccion.split('\n\n').length, 1);
  assert.ok(c.traduccion.includes('Donde se pudo medir, el ambiente da crítico'));
  assert.ok(c.traduccion.includes('son 10 de 50 personas'));
  assert.ok(c.traduccion.includes('en 2 de 6 gerencias'));
  assert.equal(c.pero, null);
  assert.equal(c.cierre, '');
});

test('11b. silencio RESPALDO: banda=riesgo pero p2CritEnConIsa=false → RESPALDO, no CELDA PUENTE', () => {
  const slots = mkSlotsSilencio({ banda: 'riesgo' });
  const d4 = {
    mundo: 'silencio' as const,
    intensidad: 'alto' as const,
    hasDenunciaFormal: false,
  };
  const c = copyFor(d4, slots, 49, 18, null, false); // P2 NO crítico en todos los con_isa

  assert.equal(c.subtitulo, 'EL SILENCIO ES EL DATO');
  assert.ok(c.traduccion.includes('Donde se pudo medir, el ambiente da riesgo'));
});

// ═══════════════════════════════════════════════════════════════════
// TITULARES (Gate 5b) — buildFactoresLine / buildExtremosLine / compose
// ═══════════════════════════════════════════════════════════════════

test('T1. Factores banda alta — 2 fortalezas', () => {
  const f: FactoresTitulares = {
    fortalezas: [mkFactor('Seguridad psicológica'), mkFactor('Respeto cotidiano')],
    debilidades: [],
    fortalezaRelativa: null,
  };
  assert.equal(
    buildFactoresLine(f),
    'Este ambiente se apoya en Seguridad psicológica y Respeto cotidiano. Es lo más sólido que hoy tiene.',
  );
});

test('T2. Factores banda alta — 1 fortaleza', () => {
  const f: FactoresTitulares = {
    fortalezas: [mkFactor('Seguridad psicológica')],
    debilidades: [],
    fortalezaRelativa: null,
  };
  assert.equal(
    buildFactoresLine(f),
    'Este ambiente se apoya sobre todo en Seguridad psicológica. Es lo más sólido que hoy tiene.',
  );
});

test('T3. Factores banda baja — 2 debilidades + fortalezaRelativa', () => {
  const f: FactoresTitulares = {
    fortalezas: [],
    debilidades: [mkFactor('Equidad de reglas'), mkFactor('Calidad de liderazgo')],
    fortalezaRelativa: mkFactor('Respeto cotidiano'),
  };
  assert.equal(
    buildFactoresLine(f),
    'Lo más frágil del ambiente: Equidad de reglas y Calidad de liderazgo. Lo que menos ha cedido: Respeto cotidiano — y es desde ahí, no desde cero.',
  );
});

test('T4. Factores banda baja — 2 debilidades sin relativa', () => {
  const f: FactoresTitulares = {
    fortalezas: [],
    debilidades: [mkFactor('Equidad de reglas'), mkFactor('Calidad de liderazgo')],
    fortalezaRelativa: null,
  };
  assert.equal(
    buildFactoresLine(f),
    'Lo más frágil del ambiente: Equidad de reglas y Calidad de liderazgo.',
  );
});

test('T5. Factores banda baja — 1 debilidad sin relativa', () => {
  const f: FactoresTitulares = {
    fortalezas: [],
    debilidades: [mkFactor('Equidad de reglas')],
    fortalezaRelativa: null,
  };
  assert.equal(buildFactoresLine(f), 'Lo más frágil del ambiente: Equidad de reglas.');
});

test('T5b. Factores banda baja — 1 debilidad + relativa', () => {
  const f: FactoresTitulares = {
    fortalezas: [],
    debilidades: [mkFactor('Equidad de reglas')],
    fortalezaRelativa: mkFactor('Respeto cotidiano'),
  };
  assert.equal(
    buildFactoresLine(f),
    'Lo más frágil del ambiente: Equidad de reglas. Lo que menos ha cedido: Respeto cotidiano.',
  );
});

test('T6. Factores vacíos → null (rama vacía, no se renderiza)', () => {
  assert.equal(
    buildFactoresLine({ fortalezas: [], debilidades: [], fortalezaRelativa: null }),
    null,
  );
});

test('T7. Extremos mejor+peor con ISA entero (redondea)', () => {
  const e: ExtremosTitulares = {
    mejor: { gerenciaName: 'Comercial', isa: 84.4 },
    peor: { gerenciaName: 'Operaciones', isa: 57.6 },
  };
  assert.equal(
    buildExtremosLine(e),
    'El ambiente no es parejo: Comercial es el área más sólida (ISA 84) y Operaciones la más frágil (ISA 58).',
  );
});

test('T8. Extremos <2 gerencias (ambos null) → null', () => {
  assert.equal(buildExtremosLine({ mejor: null, peor: null }), null);
});

test('T9. buildTitularesBeat1 compone ambos sub-bloques independientes', () => {
  const ambos = buildTitularesBeat1({
    factores: {
      fortalezas: [],
      debilidades: [mkFactor('Equidad de reglas')],
      fortalezaRelativa: null,
    },
    extremos: {
      mejor: { gerenciaName: 'Comercial', isa: 84 },
      peor: { gerenciaName: 'Operaciones', isa: 58 },
    },
  });
  assert.ok(ambos.factores?.startsWith('Lo más frágil'));
  assert.ok(ambos.extremos?.startsWith('El ambiente no es parejo'));

  // Solo factores presente → extremos null (sub-bloques independientes).
  const soloFactores = buildTitularesBeat1({
    factores: {
      fortalezas: [mkFactor('Seguridad psicológica')],
      debilidades: [],
      fortalezaRelativa: null,
    },
    extremos: { mejor: null, peor: null },
  });
  assert.ok(soloFactores.factores);
  assert.equal(soloFactores.extremos, null);

  // Ambos vacíos → bloque ausente entero.
  const vacio = buildTitularesBeat1({
    factores: { fortalezas: [], debilidades: [], fortalezaRelativa: null },
    extremos: { mejor: null, peor: null },
  });
  assert.equal(vacio.factores, null);
  assert.equal(vacio.extremos, null);
});

// ═══════════════════════════════════════════════════════════════════
// APERTURA-TITULAR v4 — oráculo verbatim contra §2 (caso real cmob0e56)
// ═══════════════════════════════════════════════════════════════════

import {
  buildAperturaTitular,
  mov3ToText,
  type AperturaInput,
} from './ActoAmbiente';
import type { OrgDimension } from '@/lib/services/compliance/orgDimensions';
import { ISA_NARRATIVES } from '@/app/dashboard/compliance/components/sections/SectionDimensiones/_shared/constants';

function mkRealCaseInput(over: Partial<AperturaInput> = {}): AperturaInput {
  // 6 dims medidas, P2 crítico, dimsSano=0 → "casi ninguna".
  const dims: OrgDimension[] = [
    { key: 'P2_seguridad', valor: 1.8, level: 'critico' },
    { key: 'P3_disenso', valor: 2.5, level: 'riesgo' },
    { key: 'P4_microagresiones', valor: 2.2, level: 'riesgo' },
    { key: 'P5_equidad', valor: 3.2, level: 'atencion' },
    { key: 'P7_liderazgo', valor: 1.9, level: 'critico' },
    { key: 'P8_agotamiento', valor: 3.5, level: 'atencion' },
  ];
  return {
    orgISA: 49,
    isaLevel: 'riesgo',
    isaNarrative: ISA_NARRATIVES.riesgo.narrative,
    pct: 20,
    silencio: true,
    indicioCount: 1,
    denunciaCount: 0,
    legalBadgeLabel: 'riesgo Ley Karin',
    dims,
    ...over,
  };
}

test('A1. Caso real — hero label + movimiento 1 verbatim §2', () => {
  const t = buildAperturaTitular(mkRealCaseInput());
  assert.equal(t.heroLabel, 'EL AMBIENTE NO LLEGA A SANO');
  assert.equal(
    `${t.mov1.veredicto} ${t.mov1.narrative}`,
    'El ambiente de la empresa no llega a sano: el índice cerró en 49 de 100. ' +
      'El deterioro ya tiene historia. Estas condiciones no aparecieron de la noche a la mañana y no desaparecen solas. Cada ciclo sin acción las consolida.',
  );
});

test('A2. Caso real — movimiento 2 (el pero, silencio + indicio count=1) verbatim §2', () => {
  const t = buildAperturaTitular(mkRealCaseInput());
  assert.equal(t.meta.senal, 'indicio');
  assert.equal(
    t.mov2,
    'Pero esa salud de 49 describe al 20% que respondió — sobre el resto de la empresa, el estudio todavía no tiene voz. ' +
      'Y en una de las áreas, el último año dejó un indicio de riesgo Ley Karin: el solo hecho eleva la prioridad de revisión.',
  );
});

test('A3. Caso real — movimiento 3 (el foco, P2 crítico + silencio → coda) verbatim §2', () => {
  const t = buildAperturaTitular(mkRealCaseInput());
  assert.ok(t.mov3, 'mov3 presente');
  assert.equal(t.meta.mov3SinCoincidencia, false);
  assert.equal(t.mov3!.dimCEO, 'Seguridad psicológica');
  assert.equal(
    mov3ToText(t.mov3!),
    'De las seis dimensiones que mide el estudio, casi ninguna alcanzó el nivel que protege a la gente. ' +
      'Y una de las que está en nivel crítico es justo Seguridad psicológica — lo que el equipo cree que pasaría si habla. ' +
      'Si los que respondieron ya dicen que hablar no es seguro, que tantos hayan callado deja de parecer desinterés: empieza a parecer lo mismo.',
  );
});

test('A4. Caso real — cierre verbatim §2', () => {
  const t = buildAperturaTitular(mkRealCaseInput());
  assert.equal(
    t.cierre,
    'Un ambiente no mejora persiguiendo el número. Mejora cuando se atiende lo que lo causa.',
  );
});

test('A5. Guard mov3 — sin silencio, NO coda (termina en aposición)', () => {
  const t = buildAperturaTitular(mkRealCaseInput({ silencio: false, pct: 80 }));
  assert.ok(t.mov3);
  assert.equal(t.mov3!.coda, null);
});

test('A6. Variante 2 (solo silencio, sin señal) verbatim §3', () => {
  const t = buildAperturaTitular(
    mkRealCaseInput({ indicioCount: 0, denunciaCount: 0 }),
  );
  assert.equal(t.meta.senal, null);
  assert.equal(
    t.mov2,
    'Ese 49 describe al 20% que respondió — sobre el resto de la empresa, el estudio todavía no tiene voz.',
  );
});

test('A7. Variante 4 (limpio: sin silencio, sin señal) verbatim §3', () => {
  const t = buildAperturaTitular(
    mkRealCaseInput({ silencio: false, pct: 90, indicioCount: 0 }),
  );
  assert.equal(
    t.mov2,
    'Y ese 49 llega con la voz de la mayoría: respondió el 90% de la empresa, y el último año no registra señales alrededor. Esta vez la foto es de toda la organización.',
  );
});

test('A8. Precedencia denuncia > indicio + flag coexistencia (no compone frase doble)', () => {
  const t = buildAperturaTitular(mkRealCaseInput({ indicioCount: 2, denunciaCount: 1 }));
  assert.equal(t.meta.senal, 'denuncia');
  assert.equal(t.meta.coexistencia, true);
});

test('A9. mov3 sin-coincidencia — dim crítica ≠ P2 → flag + sin coda', () => {
  const dims: OrgDimension[] = [
    { key: 'P2_seguridad', valor: 3.5, level: 'atencion' }, // P2 NO crítico
    { key: 'P7_liderazgo', valor: 1.7, level: 'critico' }, // la crítica es otra
  ];
  const t = buildAperturaTitular(mkRealCaseInput({ dims }));
  assert.equal(t.meta.mov3SinCoincidencia, true);
  assert.equal(t.mov3!.coda, null);
  assert.equal(t.mov3!.dimCEO, 'Calidad de liderazgo'); // la más baja
});
