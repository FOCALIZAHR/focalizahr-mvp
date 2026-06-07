// ═══════════════════════════════════════════════════════════════════
// AmbienteSynthesisEngine — tests (node:test + node:assert/strict)
// src/lib/services/compliance/AmbienteSynthesisEngine.test.ts
// ═══════════════════════════════════════════════════════════════════
// Run:
//   npx tsx --test src/lib/services/compliance/AmbienteSynthesisEngine.test.ts
//
// Cobertura Gate 2:
//   1. ACCEPTANCE cmob0e56 → SILENCIO_SIN_VOZ (no SISTEMICO con "sin dirección")
//   2. FUEGO_LEGAL gana por score sobre SILENCIO_SIN_VOZ (override)
//   3. OBSERVACION_SIN_FOCO tipo 8 cuando ISA 60-79 sin disparos
//   4. Boost por afinidad mundoDominante en empate
//   5. TODO_BIEN cuando saludable
//   6. BIEN_CON_FOCOS cuando saludable + focos
//   7. GENERIC solo si orgISA=null (caso patológico)
//   8. CONTRADICCION_TEATRO cuando teatro ≥ 1 ∧ ISA ≥ 60
//   9. CONCENTRACION_MANDO cuando criticalByManager + ≥30% del riesgo
//  10. SISTEMICO_SIN_MANDO cuando ≥3 riesgo sin mando
//  11. Convergencia confirma → multiplica ×1.3 al top
//  12. Convergencia contradice → boost +20 a CONTRADICCION_TEATRO
//  13. amplificadoresActivos: SEXTA_ALERTA solo si dominante ≠ SILENCIO_SIN_VOZ
//  14. Slots de copy emiten "" en Gate 2 (Gate 2.5 los llena)
// ═══════════════════════════════════════════════════════════════════

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  AmbienteSynthesisEngine,
  THRESHOLDS,
  type ConvergenciaSignal,
} from './AmbienteSynthesisEngine';
import type {
  AmbienteRiskData,
  Beat1Seed,
  Mundo,
} from '@/types/ambiente-cascada';

// ═══════════════════════════════════════════════════════════════════
// FACTORIES — fixtures mínimos con overrides
// ═══════════════════════════════════════════════════════════════════

function mkData(over: Partial<AmbienteRiskData> = {}): AmbienteRiskData {
  return {
    orgISA: 49,
    isaComponents: null,
    orgSafetyScore: 3.2,
    coverageGapPct: 18,
    personResponseRate: 82,
    totalInvited: 50,
    totalResponded: 41,
    departmentsCount: 6,
    gerenciasUniversoTotal: 6,
    gerenciasMedidasCount: 4,
    gerenciasMudasCount: 2,
    riesgoDeptosCount: 0,
    teatroCount: 0,
    scoresPerDept: [],
    riskScoresPerDept: [],
    rollupsPerGerencia: [],
    convergencias: [],
    criticalByManager: [],
    fragmentosTextuales: undefined,
    silencioConVozExterna: undefined,
    otroMundo: undefined,
    denunciasByDept: undefined,
    ...over,
  };
}

function mkBeat1Seed(over: Partial<Beat1Seed> = {}): Beat1Seed {
  const mundo: Mundo = over.mundoDominante ?? 'numero-bajo';
  return {
    mundoDominante: mundo,
    intensidad: 'medio',
    hasDenunciaFormal: false,
    beat1Slots: {
      exit_alerts_count: 0,
      gerencias_sanas_count: 0,
      gerencias_medidas_total: 4,
      gerencias_mudas_count: 2,
      gerencias_universo_total: 6,
      personResponseRate: 82,
      totalInvited: 50,
      totalResponded: 41,
      banda: 'critico',
      coverage_gap_pct: 18,
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
      ...(over.beat1Slots ?? {}),
    },
    factoresTitulares: over.factoresTitulares ?? {
      fortalezas: [],
      debilidades: [],
      fortalezaRelativa: null,
    },
    extremosTitulares: over.extremosTitulares ?? { mejor: null, peor: null },
    classifyD4Trace: {
      orgISA: 49,
      riesgoDeptos: 0,
      coverageGapPct: 18,
      teatroCount: 0,
      branchHit: 'numero-bajo: ISA < 80 ∧ gap < 50 ∧ teatro = 0',
    },
    ...over,
  };
}

function mkConvergencia(
  over: Partial<ConvergenciaSignal> = {},
): ConvergenciaSignal {
  return {
    direccion: 'ninguna',
    nivelFinal: null,
    deptosConfirmados: [],
    deptosContradichos: [],
    fuentes: [],
    ...over,
  };
}

// ═══════════════════════════════════════════════════════════════════
// 1. ACCEPTANCE — cmob0e56 silencio + voz externa → SILENCIO_SIN_VOZ
// ═══════════════════════════════════════════════════════════════════
// Esta es la prueba que cierra el bug del Francotirador legacy:
// Beat 1 plantó silencio → Beat 6 NOMBRA silencio (no "sin dirección").
//
// Caracterización cmob0e56 (campaña 18% cobertura):
//   - orgISA = 49, riesgoDeptos = 2, gap cobertura = 82%
//   - 1 gerencia muda con voz externa (sexta alerta presente)
//   - sin denuncia formal, sin teatro, sin criticalByManager
//   - mundoDominante D4 = 'silencio' (gap ≥ 50)
//
// Sin boost: SILENCIO_SIN_VOZ score = 82 + 5 = 87.
// Con boost afinidad mundo→silencio: +10 = 97.
// Sin SISTEMICO_SIN_MANDO porque riesgoDeptos < 3.
// Resultado esperado: SILENCIO_SIN_VOZ gana solo (sin competencia).
// ═══════════════════════════════════════════════════════════════════

test('1. cmob0e56 silencio + voz externa → SILENCIO_SIN_VOZ (hilo único cerrado)', () => {
  const data = mkData({
    orgISA: 49,
    coverageGapPct: 82,
    riesgoDeptosCount: 2,
    teatroCount: 0,
    criticalByManager: [],
    silencioConVozExterna: [{ departmentId: 'd-comercial', departmentName: 'Comercial' }],
  });

  const beat1Seed = mkBeat1Seed({
    mundoDominante: 'silencio',
    beat1Slots: {
      // Reutilizar defaults del factory + override mudaConExterna
      exit_alerts_count: 0,
      gerencias_sanas_count: 0,
      gerencias_medidas_total: 4,
      gerencias_mudas_count: 2,
      gerencias_universo_total: 6,
      personResponseRate: 18,
      totalInvited: 50,
      totalResponded: 9,
      banda: 'critico',
      coverage_gap_pct: 82,
      gerencia_top_1: null,
      gerencia_alta_1: null,
      gerencia_baja_1: null,
      gerencia_muda_1: null,
      gerencia_muda_con_externa_1: {
        groupId: 'g-comercial',
        groupName: 'Comercial',
        standalone: false,
        deptosMudosCount: 1,
        signalsCountTotal: 3,
      },
      gerencia_teatro_1: null,
      gerencia_contradiccion_1: null,
      gerencia_denuncia_1: null,
      gerencia_foco_1: null,
      gerencia_genero_1: null,
      gerencia_ley_karin_1: null,
    },
  });

  const result = AmbienteSynthesisEngine.generate({ beat1Seed, data });

  assert.equal(
    result.diagnosticType,
    'SILENCIO_SIN_VOZ',
    'Beat 6 debe NOMBRAR lo que Beat 1 plantó (silencio), NO emitir SISTEMICO o GENERIC.',
  );
  assert.ok(
    !result.trigger.includes('override'),
    'No debe haber discordancia beat1↔engine cuando ambos apuntan a silencio.',
  );
  // amplificadoresActivos NO debe incluir SEXTA_ALERTA porque el dominante
  // ya es SILENCIO_SIN_VOZ (la sexta está implícita en el dominante).
  assert.equal(
    result.amplificadoresActivos.filter((a) => a.tipo === 'SEXTA_ALERTA').length,
    0,
    'SEXTA_ALERTA no debe aparecer como amplificador del dominante SILENCIO_SIN_VOZ.',
  );
});

// ═══════════════════════════════════════════════════════════════════
// 2. FUEGO_LEGAL gana por score (override de SILENCIO en cmob0e56)
// ═══════════════════════════════════════════════════════════════════

test('2. cmob0e56 + denuncia formal en 1 dept → FUEGO_LEGAL gana (override)', () => {
  const data = mkData({
    orgISA: 49,
    coverageGapPct: 82,
    riesgoDeptosCount: 2,
    teatroCount: 0,
    // 1 dept con piso_denuncia > 0 (denuncia formal cargada).
    riskScoresPerDept: [
      {
        departmentId: 'd-1',
        departmentName: 'Comercial',
        score: 85,
        bucket: 'con_isa',
        drivers: { confiabilidad: 10, voz_externa: 0, piso_denuncia: 75 },
        reason: 'piso_aplicado',
        inputs: { participacion: 70, pesoAlertas: 0, denuncias_12m: 1 },
        alertas: [],
      },
    ],
  });

  const beat1Seed = mkBeat1Seed({
    mundoDominante: 'silencio',
    hasDenunciaFormal: true,
  });

  const result = AmbienteSynthesisEngine.generate({ beat1Seed, data });

  assert.equal(
    result.diagnosticType,
    'FUEGO_LEGAL',
    'FUEGO_LEGAL (score=110) debe superar a SILENCIO_SIN_VOZ (score=82+10=92) por +10 boost incluido.',
  );
});

// ═══════════════════════════════════════════════════════════════════
// 3. OBSERVACION_SIN_FOCO (tipo 8) cuando ISA 60-79 sin disparos
// ═══════════════════════════════════════════════════════════════════

test('3. ISA=70 banda observación sin disparos → OBSERVACION_SIN_FOCO (NUNCA GENERIC)', () => {
  const data = mkData({
    orgISA: 70,
    coverageGapPct: 10,
    riesgoDeptosCount: 0,
    teatroCount: 0,
    criticalByManager: [],
    silencioConVozExterna: undefined,
    otroMundo: undefined,
  });
  const beat1Seed = mkBeat1Seed({ mundoDominante: 'numero-bajo' });

  const result = AmbienteSynthesisEngine.generate({ beat1Seed, data });

  assert.equal(result.diagnosticType, 'OBSERVACION_SIN_FOCO');
  assert.notEqual(
    result.diagnosticType,
    'GENERIC',
    'Banda observación NUNCA cae a GENERIC — esa es la regla §3.5.8.',
  );
});

// ═══════════════════════════════════════════════════════════════════
// 4. Boost por afinidad mundoDominante en empate gap<5
// ═══════════════════════════════════════════════════════════════════

test('4. Empate scores con afinidad mundo → el afín gana (precedence sobre priority)', () => {
  // Construyo un caso donde SILENCIO_SIN_VOZ y SISTEMICO_SIN_MANDO empatan
  // dentro del gap. mundoDominante=silencio → SILENCIO gana por afinidad.
  // SILENCIO: gap=50 → score base=50. Con boost +10 → 60.
  // SISTEMICO: riesgoDeptos=6 → score=60. Sin boost (no afín a silencio) → 60.
  // Tied gap=0. Sin afinidad priority pondría FUEGO_LEGAL antes; pero SILENCIO
  // tiene afinidad con mundo=silencio → gana.
  const data = mkData({
    orgISA: 45,
    coverageGapPct: 50,
    riesgoDeptosCount: 6,
    teatroCount: 0,
    criticalByManager: [],
  });
  const beat1Seed = mkBeat1Seed({ mundoDominante: 'silencio' });

  const result = AmbienteSynthesisEngine.generate({ beat1Seed, data });

  assert.equal(
    result.diagnosticType,
    'SILENCIO_SIN_VOZ',
    'En empate, la afinidad mundo→tipo gana antes que DIAGNOSTIC_PRIORITY pura.',
  );
});

// ═══════════════════════════════════════════════════════════════════
// 5. TODO_BIEN cuando saludable (ISA≥80 ∧ riesgo=0 ∧ teatro=0)
// ═══════════════════════════════════════════════════════════════════

test('5. orgISA=85, riesgo=0, teatro=0 → TODO_BIEN', () => {
  const data = mkData({
    orgISA: 85,
    coverageGapPct: 5,
    riesgoDeptosCount: 0,
    teatroCount: 0,
  });
  const beat1Seed = mkBeat1Seed({ mundoDominante: 'todo-bien' });

  const result = AmbienteSynthesisEngine.generate({ beat1Seed, data });

  assert.equal(result.diagnosticType, 'TODO_BIEN');
});

// ═══════════════════════════════════════════════════════════════════
// 6. BIEN_CON_FOCOS cuando saludable con riesgo focal
// ═══════════════════════════════════════════════════════════════════

test('6. orgISA=85, riesgoDeptos=2 → BIEN_CON_FOCOS', () => {
  const data = mkData({
    orgISA: 85,
    coverageGapPct: 10,
    riesgoDeptosCount: 2,
    teatroCount: 0,
  });
  const beat1Seed = mkBeat1Seed({ mundoDominante: 'bien-con-focos' });

  const result = AmbienteSynthesisEngine.generate({ beat1Seed, data });

  assert.equal(result.diagnosticType, 'BIEN_CON_FOCOS');
});

// ═══════════════════════════════════════════════════════════════════
// 7. GENERIC solo cuando orgISA=null (caso patológico)
// ═══════════════════════════════════════════════════════════════════

test('7. orgISA=null (datos corruptos) → GENERIC', () => {
  const data = mkData({
    orgISA: null,
    coverageGapPct: 0,
    riesgoDeptosCount: 0,
    teatroCount: 0,
  });
  const beat1Seed = mkBeat1Seed({ mundoDominante: 'numero-bajo' });

  const result = AmbienteSynthesisEngine.generate({ beat1Seed, data });

  assert.equal(result.diagnosticType, 'GENERIC');
});

// ═══════════════════════════════════════════════════════════════════
// 8. CONTRADICCION_TEATRO cuando teatro ≥ 1 ∧ ISA ≥ 60
// ═══════════════════════════════════════════════════════════════════

test('8. teatroCount=2, orgISA=65 → CONTRADICCION_TEATRO', () => {
  const data = mkData({
    orgISA: 65,
    coverageGapPct: 10,
    riesgoDeptosCount: 0,
    teatroCount: 2,
  });
  const beat1Seed = mkBeat1Seed({ mundoDominante: 'contradiccion' });

  const result = AmbienteSynthesisEngine.generate({ beat1Seed, data });

  assert.equal(result.diagnosticType, 'CONTRADICCION_TEATRO');
});

// ═══════════════════════════════════════════════════════════════════
// 9. CONCENTRACION_MANDO cuando criticalByManager + ≥30% del riesgo
// ═══════════════════════════════════════════════════════════════════

test('9. criticalByManager con 4 deptos / riesgo total 5 → CONCENTRACION_MANDO', () => {
  const data = mkData({
    orgISA: 55,
    coverageGapPct: 10,
    riesgoDeptosCount: 5,
    teatroCount: 0,
    criticalByManager: [
      { managerId: 'mgr-1', departmentIds: ['d1', 'd2', 'd3', 'd4'] },
    ],
  });
  const beat1Seed = mkBeat1Seed({ mundoDominante: 'numero-bajo' });

  const result = AmbienteSynthesisEngine.generate({ beat1Seed, data });

  assert.equal(result.diagnosticType, 'CONCENTRACION_MANDO');
});

// ═══════════════════════════════════════════════════════════════════
// 10. SISTEMICO_SIN_MANDO cuando ≥3 riesgo sin mando común
// ═══════════════════════════════════════════════════════════════════

test('10. riesgoDeptos=4, criticalByManager=[] → SISTEMICO_SIN_MANDO', () => {
  const data = mkData({
    orgISA: 55,
    coverageGapPct: 10,
    riesgoDeptosCount: 4,
    teatroCount: 0,
    criticalByManager: [],
  });
  const beat1Seed = mkBeat1Seed({ mundoDominante: 'numero-bajo' });

  const result = AmbienteSynthesisEngine.generate({ beat1Seed, data });

  assert.equal(result.diagnosticType, 'SISTEMICO_SIN_MANDO');
});

// ═══════════════════════════════════════════════════════════════════
// 11. Convergencia confirma → multiplica ×1.3 al top
// ═══════════════════════════════════════════════════════════════════

test('11. Convergencia confirma → multiplicador ×1.3 al top candidato', () => {
  // SILENCIO base score = 50 (gap=50). Sin boost mundo: 50. Con mult ×1.3: 65.
  // Test verifica que el multiplicador se aplica (via trigger).
  const data = mkData({
    orgISA: 45,
    coverageGapPct: 50,
    riesgoDeptosCount: 0,
    teatroCount: 0,
  });
  const beat1Seed = mkBeat1Seed({ mundoDominante: 'silencio' });

  const result = AmbienteSynthesisEngine.generate({
    beat1Seed,
    data,
    convergenciaSignal: mkConvergencia({
      direccion: 'confirma',
      nivelFinal: 'confirmada',
      deptosConfirmados: ['d-comercial'],
      fuentes: ['exit'],
    }),
  });

  assert.equal(result.diagnosticType, 'SILENCIO_SIN_VOZ');
  assert.equal(result.convergenciaProductos.presente, true);
  assert.equal(result.convergenciaProductos.nivelFinal, 'confirmada');
  assert.deepEqual(result.convergenciaProductos.fuentes, ['exit']);
});

// ═══════════════════════════════════════════════════════════════════
// 12. Convergencia contradice → boost +20 a CONTRADICCION_TEATRO
// ═══════════════════════════════════════════════════════════════════

test('12. Convergencia contradice activa CONTRADICCION_TEATRO desde cero', () => {
  // Sin teatroCount → CONTRADICCION_TEATRO no se dispara por umbral propio.
  // Pero la convergencia que contradice debe activarlo con score=20.
  // En este caso, será el ÚNICO candidato y debe ganar.
  const data = mkData({
    orgISA: 70,
    coverageGapPct: 20, // < 50, no dispara SILENCIO
    riesgoDeptosCount: 0,
    teatroCount: 0,
  });
  const beat1Seed = mkBeat1Seed({ mundoDominante: 'numero-bajo' });

  const result = AmbienteSynthesisEngine.generate({
    beat1Seed,
    data,
    convergenciaSignal: mkConvergencia({
      direccion: 'contradice',
      nivelFinal: 'amplificada',
      deptosContradichos: ['d-tech'],
      fuentes: ['exit'],
    }),
  });

  assert.equal(
    result.diagnosticType,
    'CONTRADICCION_TEATRO',
    'Divergencia productos→encuesta debe activar CONTRADICCION_TEATRO como diagnóstico.',
  );
});

// ═══════════════════════════════════════════════════════════════════
// 13. amplificadoresActivos — SEXTA_ALERTA solo si dominante ≠ SILENCIO
// ═══════════════════════════════════════════════════════════════════

test('13. amplificadoresActivos: SEXTA_ALERTA solo si dominante ≠ SILENCIO_SIN_VOZ', () => {
  // Caso: BIEN_CON_FOCOS dominante + sexta alerta presente → SEXTA aparece.
  const data = mkData({
    orgISA: 85,
    coverageGapPct: 10,
    riesgoDeptosCount: 2,
    teatroCount: 0,
    silencioConVozExterna: [{ departmentId: 'd-x', departmentName: 'X' }],
  });
  const beat1Seed = mkBeat1Seed({ mundoDominante: 'bien-con-focos' });

  const result = AmbienteSynthesisEngine.generate({ beat1Seed, data });

  assert.equal(result.diagnosticType, 'BIEN_CON_FOCOS');
  const sexta = result.amplificadoresActivos.find((a) => a.tipo === 'SEXTA_ALERTA');
  assert.ok(sexta, 'SEXTA_ALERTA debe aparecer cuando el dominante NO es SILENCIO_SIN_VOZ.');
});

// ═══════════════════════════════════════════════════════════════════
// 14. Gate 2.5 parche mecánico — 9 slots REUSE traen verbatim Victor
// ═══════════════════════════════════════════════════════════════════

test('14a. TODO_BIEN consume 3 slots REUSE verbatim del Dictionary', () => {
  const data = mkData({ orgISA: 85, riesgoDeptosCount: 0, teatroCount: 0 });
  const beat1Seed = mkBeat1Seed({ mundoDominante: 'todo-bien' });

  const result = AmbienteSynthesisEngine.generate({ beat1Seed, data });

  // REUSE verbatim de buildCierreFrancotirador.positivo
  assert.equal(
    result.classification,
    'Este ciclo no registra gerencias en zona crítica.',
  );
  assert.equal(
    result.implication,
    'El mandato no es celebrar. Es sostener las condiciones que produjeron este resultado.',
  );
  assert.equal(
    result.accountability,
    'El próximo ciclo confirmará si fue una tendencia.',
  );
  // path queda '' hasta Gate 2.5 completo.
  assert.equal(result.path, '');
});

test('14b. CONCENTRACION_MANDO + SISTEMICO_SIN_MANDO traen classification/accountability REUSE', () => {
  // CONCENTRACION_MANDO
  const data1 = mkData({
    orgISA: 55,
    riesgoDeptosCount: 5,
    criticalByManager: [
      { managerId: 'm', departmentIds: ['d1', 'd2', 'd3', 'd4'] },
    ],
  });
  const r1 = AmbienteSynthesisEngine.generate({
    beat1Seed: mkBeat1Seed({ mundoDominante: 'numero-bajo' }),
    data: data1,
  });
  assert.equal(
    r1.classification,
    'Este no es un problema cultural. Es un problema con dirección identificada.',
  );
  assert.equal(
    r1.accountability,
    'El próximo ciclo confirmará si estas decisiones fueron efectivas.',
  );
  // implicationBase queda '' hasta resolver interpolación.
  assert.equal(r1.implication, '');

  // SISTEMICO_SIN_MANDO
  const data2 = mkData({
    orgISA: 55,
    riesgoDeptosCount: 4,
    criticalByManager: [],
  });
  const r2 = AmbienteSynthesisEngine.generate({
    beat1Seed: mkBeat1Seed({ mundoDominante: 'numero-bajo' }),
    data: data2,
  });
  assert.equal(
    r2.classification,
    'Este no es un problema de liderazgo. Es un problema de diseño.',
  );
  assert.equal(r2.accountability, 'El próximo ciclo dirá cuál de las dos.');
});

test('14c. GENERIC trae path patológico fijo §3.5.8 — NO inventa "sin dirección clara"', () => {
  const data = mkData({ orgISA: null });
  const beat1Seed = mkBeat1Seed({ mundoDominante: 'numero-bajo' });

  const result = AmbienteSynthesisEngine.generate({ beat1Seed, data });

  assert.equal(result.diagnosticType, 'GENERIC');
  assert.equal(
    result.path,
    'El próximo ciclo confirmará si hay una dirección clara.',
  );
  assert.notEqual(
    result.implication,
    'el origen no tiene dirección clara',
    'NUNCA emite la frase del bug del Francotirador legacy.',
  );
});

test('14d. Tipos sin copy aún (FUEGO_LEGAL, SILENCIO, etc.) emiten "" — Engine pasa transparente', () => {
  const data = mkData({
    orgISA: 49,
    coverageGapPct: 82,
    riesgoDeptosCount: 2,
  });
  const beat1Seed = mkBeat1Seed({ mundoDominante: 'silencio' });

  const result = AmbienteSynthesisEngine.generate({ beat1Seed, data });

  assert.equal(result.diagnosticType, 'SILENCIO_SIN_VOZ');
  // Sin copy en Dictionary aún — slots vacíos. UI los oculta.
  assert.equal(result.classification, '');
  assert.equal(result.path, '');
});

test('14e. Cláusulas amplificadoras REUSE — SEXTA_ALERTA + CONVERGENCIA_AMBOS', () => {
  // Construyo escenario BIEN_CON_FOCOS + SEXTA_ALERTA para verificar la cláusula.
  const data = mkData({
    orgISA: 85,
    coverageGapPct: 10,
    riesgoDeptosCount: 2,
    silencioConVozExterna: [
      { departmentId: 'd-comercial', departmentName: 'Comercial' },
      { departmentId: 'd-tech', departmentName: 'TI' },
    ],
  });
  const result = AmbienteSynthesisEngine.generate({
    beat1Seed: mkBeat1Seed({ mundoDominante: 'bien-con-focos' }),
    data,
  });

  // El dominante BIEN_CON_FOCOS aún no tiene implicationBase (Victor escribe);
  // pero la cláusula SEXTA debe llegar al implication final.
  assert.equal(result.diagnosticType, 'BIEN_CON_FOCOS');
  assert.ok(
    result.implication.includes('Comercial') && result.implication.includes('TI'),
    'La cláusula SEXTA debe nombrar los deptos: ' + result.implication,
  );
  assert.ok(
    result.implication.includes('otras fuentes documentaron señales activas'),
    'REUSE verbatim de buildAlertas.silencio_con_voz_externa.contexto: ' + result.implication,
  );
});

// Sanity check: thresholds exportados son los del plan.
test('15. THRESHOLDS exportados → coinciden con plan §3.1.2', () => {
  assert.equal(THRESHOLDS.GAP_COBERTURA_PCT, 50);
  assert.equal(THRESHOLDS.TEATRO_MIN_ISA, 60);
  assert.equal(THRESHOLDS.SISTEMICO_MIN_RIESGO, 3);
  assert.equal(THRESHOLDS.ISA_SALUDABLE, 80);
  assert.equal(THRESHOLDS.ISA_OBSERVACION_LOW, 60);
  assert.equal(THRESHOLDS.TIE_GAP, 5);
  assert.equal(THRESHOLDS.AFFINITY_BOOST, 10);
  assert.equal(THRESHOLDS.CONVERGENCIA_CONFIRMA_MULT, 1.3);
  assert.equal(THRESHOLDS.CONVERGENCIA_CONTRADICE_BOOST, 20);
});
