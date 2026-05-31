// ═══════════════════════════════════════════════════════════════════
// deriveBeat1Slots — tests (node:test + node:assert/strict)
// src/lib/services/compliance/deriveBeat1Slots.test.ts
// ═══════════════════════════════════════════════════════════════════
// Run:
//   npx tsx --test src/lib/services/compliance/deriveBeat1Slots.test.ts
//
// 14 tests · inputs sintéticos (anti-fitting). Cubre:
//   - empty rollups → todo null/0
//   - gerencia_top_1 / gerencia_alta_1 (alias) + gerencia_baja_1 (ISA)
//   - tiebreak alfabético en ISA
//   - gerencias_sanas_count vs gerencias_medidas_total
//   - gerencia_muda_1 (canonical < SILENCIO_PARTICIPATION_THRESHOLD, importado)
//   - gerencia_muda_1 boundary (exactly 50% → no muda) + null (no invitada)
//   - gerencia_muda_con_externa_1 (silencioVozExterna.count > 0)
//   - gerencia_teatro_1 / gerencia_contradiccion_1 (alias, === true estricto)
//   - gerencia_denuncia_1 (3-estado: null y 0 quedan fuera)
//   - exit_alerts_count suma global
// ═══════════════════════════════════════════════════════════════════

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { deriveBeat1Slots } from './deriveBeat1Slots';
import type { GerenciaRollup } from './buildGerenciaRollup';
import { SILENCIO_PARTICIPATION_THRESHOLD } from '@/lib/services/compliance/ComplianceAlertService';

// ═══════════════════════════════════════════════════════════════════
// FACTORY — rollup minimal con overrides anidados
// ═══════════════════════════════════════════════════════════════════

function mkRollup(
  overrides: Partial<GerenciaRollup> & { groupId: string; groupName: string },
): GerenciaRollup {
  return {
    groupId: overrides.groupId,
    groupName: overrides.groupName,
    standalone: overrides.standalone ?? false,
    totalChildren: overrides.totalChildren ?? 1,
    isa: overrides.isa ?? {
      weighted: null,
      min: null,
      max: null,
      deptosConIsa: 0,
    },
    silencio: overrides.silencio ?? {
      invited: 0,
      responded: 0,
      empleadosActivos: 0,
      participationRate: null,
      coverageRate: null,
      deptosNoInvitados: 0,
      deptosSubThreshold: 0,
    },
    exit: overrides.exit ?? {
      alertsCount: 0,
      pesoTotal: 0,
      deptosConAlerta: 0,
    },
    denuncias: overrides.denuncias ?? {
      count: null,
      deptosConDatoCargado: 0,
      deptosSinDatoCargado: 1,
      deptosConDenuncia: 0,
    },
    teatro: overrides.teatro ?? {
      anyTeatro: null,
      deptosConTeatro: 0,
      deptosConFlagPresente: 0,
    },
    silencioVozExterna: overrides.silencioVozExterna ?? {
      deptosMudosConSenalExterna: [],
      count: 0,
    },
    convergencia: overrides.convergencia ?? {
      worstNivelFinal: null,
      maxScoreExterno: null,
    },
    riesgo: overrides.riesgo ?? { maxScore: 0, worstDept: null },
    deptosEnRiesgo: overrides.deptosEnRiesgo ?? 0,
    genero: overrides.genero ?? { hasAlerta: false, evidenciaGenero: null },
    leyKarin: overrides.leyKarin ?? { signalsCount: 0, deptosConSenal: 0 },
  };
}

/** Ctx default — la mayoría de los tests no exercitan banda/coverage_gap_pct.
 *  Acepta overrides para los tests que sí lo hacen. */
function ctx(over?: { orgISA?: number; coverageGapPct?: number }) {
  return {
    orgISA: over?.orgISA ?? 50,
    coverageGapPct: over?.coverageGapPct ?? 0,
  };
}

// ═══════════════════════════════════════════════════════════════════
// CASE 1 — rollups vacíos
// ═══════════════════════════════════════════════════════════════════

test('1. rollups === [] → todos los slots null + counts en 0', () => {
  const s = deriveBeat1Slots([], ctx());
  assert.equal(s.exit_alerts_count, 0);
  assert.equal(s.gerencias_sanas_count, 0);
  assert.equal(s.gerencias_medidas_total, 0);
  assert.equal(s.gerencias_mudas_count, 0);
  assert.equal(s.gerencias_universo_total, 0);
  assert.equal(s.gerencia_top_1, null);
  assert.equal(s.gerencia_alta_1, null);
  assert.equal(s.gerencia_baja_1, null);
  assert.equal(s.gerencia_muda_1, null);
  assert.equal(s.gerencia_muda_con_externa_1, null);
  assert.equal(s.gerencia_teatro_1, null);
  assert.equal(s.gerencia_contradiccion_1, null);
  assert.equal(s.gerencia_denuncia_1, null);
});

// ═══════════════════════════════════════════════════════════════════
// CASE 2 — gerencia_top_1 / gerencia_alta_1 son alias del mejor ISA
// ═══════════════════════════════════════════════════════════════════

test('2. 3 gerencias con ISA → top/alta = MEJOR (≡ mismo objeto), baja = peor', () => {
  const rollups: GerenciaRollup[] = [
    mkRollup({
      groupId: 'gA',
      groupName: 'A',
      isa: { weighted: 60, min: 50, max: 70, deptosConIsa: 2 },
    }),
    mkRollup({
      groupId: 'gB',
      groupName: 'B',
      isa: { weighted: 85, min: 80, max: 90, deptosConIsa: 3 },
    }),
    mkRollup({
      groupId: 'gC',
      groupName: 'C',
      isa: { weighted: 42, min: 38, max: 46, deptosConIsa: 1 },
    }),
  ];
  const s = deriveBeat1Slots(rollups, ctx());

  assert.equal(s.gerencia_top_1?.groupId, 'gB');
  assert.equal(s.gerencia_top_1?.isaWeighted, 85);
  assert.equal(s.gerencia_alta_1?.groupId, 'gB');
  assert.deepEqual(s.gerencia_top_1, s.gerencia_alta_1);

  assert.equal(s.gerencia_baja_1?.groupId, 'gC');
  assert.equal(s.gerencia_baja_1?.isaWeighted, 42);
});

// ═══════════════════════════════════════════════════════════════════
// CASE 2b — tiebreak alfabético en ISA empatado
// ═══════════════════════════════════════════════════════════════════

test('2b. dos gerencias con MISMO ISA → tiebreak alfabético', () => {
  const rollups: GerenciaRollup[] = [
    mkRollup({
      groupId: 'gZ',
      groupName: 'Zapatos',
      isa: { weighted: 80, min: 80, max: 80, deptosConIsa: 1 },
    }),
    mkRollup({
      groupId: 'gA',
      groupName: 'Almacenes',
      isa: { weighted: 80, min: 80, max: 80, deptosConIsa: 1 },
    }),
  ];
  const s = deriveBeat1Slots(rollups, ctx());
  assert.equal(s.gerencia_top_1?.groupName, 'Almacenes');
  assert.equal(s.gerencia_baja_1?.groupName, 'Almacenes');
});

// ═══════════════════════════════════════════════════════════════════
// CASE 3 — gerencias_sanas_count usa getISARiskLevel (≥80) NO threshold suelto
// ═══════════════════════════════════════════════════════════════════

test('3. sanas_count: solo getISARiskLevel === "saludable" (≥80); 79 NO cuenta', () => {
  const rollups: GerenciaRollup[] = [
    mkRollup({
      groupId: 'g1',
      groupName: 'g1',
      isa: { weighted: 85, min: 85, max: 85, deptosConIsa: 1 },
    }), // saludable
    mkRollup({
      groupId: 'g2',
      groupName: 'g2',
      isa: { weighted: 80, min: 80, max: 80, deptosConIsa: 1 },
    }), // saludable (boundary)
    mkRollup({
      groupId: 'g3',
      groupName: 'g3',
      isa: { weighted: 79, min: 79, max: 79, deptosConIsa: 1 },
    }), // observacion — NO sana
    mkRollup({
      groupId: 'g4',
      groupName: 'g4',
      isa: { weighted: null, min: null, max: null, deptosConIsa: 0 },
    }), // no medida
  ];
  const s = deriveBeat1Slots(rollups, ctx());

  assert.equal(s.gerencias_sanas_count, 2);
  // Denominador: gerencias con ISA medido (excluye la null).
  assert.equal(s.gerencias_medidas_total, 3);
});

// ═══════════════════════════════════════════════════════════════════
// CASE 4 — gerencia_muda_1: importa la constante canónica (sin literal)
// ═══════════════════════════════════════════════════════════════════

test('4. muda_1: corte canónico < SILENCIO_PARTICIPATION_THRESHOLD (importado)', () => {
  const thresholdFraction = SILENCIO_PARTICIPATION_THRESHOLD / 100; // 0.5
  const justBelow = thresholdFraction - 0.001; // 0.499 → muda
  const justAt = thresholdFraction; // 0.5  → NO muda (estricto <)
  const above = thresholdFraction + 0.2; // 0.7  → NO muda

  const rollups: GerenciaRollup[] = [
    mkRollup({
      groupId: 'gA',
      groupName: 'A',
      silencio: {
        invited: 100,
        responded: Math.round(justBelow * 100),
        empleadosActivos: 100,
        participationRate: justBelow,
        coverageRate: 1,
        deptosNoInvitados: 0,
        deptosSubThreshold: 0,
      },
    }),
    mkRollup({
      groupId: 'gB',
      groupName: 'B',
      silencio: {
        invited: 100,
        responded: 50,
        empleadosActivos: 100,
        participationRate: justAt,
        coverageRate: 1,
        deptosNoInvitados: 0,
        deptosSubThreshold: 0,
      },
    }),
    mkRollup({
      groupId: 'gC',
      groupName: 'C',
      silencio: {
        invited: 100,
        responded: 70,
        empleadosActivos: 100,
        participationRate: above,
        coverageRate: 1,
        deptosNoInvitados: 0,
        deptosSubThreshold: 0,
      },
    }),
  ];
  const s = deriveBeat1Slots(rollups, ctx());

  // Solo gA cae bajo el umbral; gB en el boundary queda fuera (estricto <).
  assert.equal(s.gerencia_muda_1?.groupId, 'gA');
  assert.equal(s.gerencia_muda_1?.participationRate, justBelow);
  assert.equal(s.gerencia_muda_1?.reason, 'low_participation');
});

// ═══════════════════════════════════════════════════════════════════
// CASE 5 — gerencia_muda_1: gerencia NO invitada (coverageRate === 0)
//   → fallback con reason="no_invitada" (semántica equivalente a la sexta
//   alerta canónica que incluye "sin cobertura" como candidato).
// ═══════════════════════════════════════════════════════════════════

test('5. muda_1: no invitada (coverageRate === 0) → fallback reason="no_invitada"', () => {
  const rollups: GerenciaRollup[] = [
    mkRollup({
      groupId: 'gA',
      groupName: 'A',
      silencio: {
        invited: 0,
        responded: 0,
        empleadosActivos: 50,
        participationRate: null,
        coverageRate: 0,
        deptosNoInvitados: 2,
        deptosSubThreshold: 0,
      },
    }),
  ];
  const s = deriveBeat1Slots(rollups, ctx());
  assert.equal(s.gerencia_muda_1?.groupId, 'gA');
  assert.equal(s.gerencia_muda_1?.reason, 'no_invitada');
  assert.equal(s.gerencia_muda_1?.participationRate, null);
});

// ═══════════════════════════════════════════════════════════════════
// CASE 5b — Precedencia: low_participation gana sobre no_invitada
// ═══════════════════════════════════════════════════════════════════

test('5b. muda_1: low_participation tiene PRECEDENCIA sobre no_invitada', () => {
  const rollups: GerenciaRollup[] = [
    mkRollup({
      groupId: 'gA',
      groupName: 'A',
      silencio: {
        invited: 10,
        responded: 3,
        empleadosActivos: 10,
        participationRate: 0.3,
        coverageRate: 1,
        deptosNoInvitados: 0,
        deptosSubThreshold: 0,
      },
    }),
    mkRollup({
      groupId: 'gB',
      groupName: 'B',
      silencio: {
        invited: 0,
        responded: 0,
        empleadosActivos: 5,
        participationRate: null,
        coverageRate: 0,
        deptosNoInvitados: 1,
        deptosSubThreshold: 0,
      },
    }),
  ];
  const s = deriveBeat1Slots(rollups, ctx());
  // Primary (low_participation) gana; fallback no_invitada solo si primary vacío.
  assert.equal(s.gerencia_muda_1?.groupId, 'gA');
  assert.equal(s.gerencia_muda_1?.reason, 'low_participation');
});

// ═══════════════════════════════════════════════════════════════════
// CASE 6 — gerencia_muda_1: múltiples mudas → elige la de MENOR participación
// ═══════════════════════════════════════════════════════════════════

test('6. muda_1: varias bajo umbral → elige la de menor participationRate', () => {
  const rollups: GerenciaRollup[] = [
    mkRollup({
      groupId: 'gA',
      groupName: 'A',
      silencio: {
        invited: 100,
        responded: 40,
        empleadosActivos: 100,
        participationRate: 0.4,
        coverageRate: 1,
        deptosNoInvitados: 0,
        deptosSubThreshold: 0,
      },
    }),
    mkRollup({
      groupId: 'gB',
      groupName: 'B',
      silencio: {
        invited: 100,
        responded: 20,
        empleadosActivos: 100,
        participationRate: 0.2,
        coverageRate: 1,
        deptosNoInvitados: 0,
        deptosSubThreshold: 0,
      },
    }),
  ];
  const s = deriveBeat1Slots(rollups, ctx());
  assert.equal(s.gerencia_muda_1?.groupId, 'gB');
  assert.equal(s.gerencia_muda_1?.participationRate, 0.2);
  assert.equal(s.gerencia_muda_1?.reason, 'low_participation');
});

// ═══════════════════════════════════════════════════════════════════
// CASE 7 — gerencia_muda_con_externa_1: count > 0 (con signalsCount sumado)
// ═══════════════════════════════════════════════════════════════════

test('7. muda_con_externa_1: prefiere mayor count; suma signalsCountTotal', () => {
  const rollups: GerenciaRollup[] = [
    mkRollup({
      groupId: 'gA',
      groupName: 'A',
      silencioVozExterna: {
        deptosMudosConSenalExterna: [
          { departmentId: 'd1', departmentName: 'D1', signalsCount: 2 },
        ],
        count: 1,
      },
    }),
    mkRollup({
      groupId: 'gB',
      groupName: 'B',
      silencioVozExterna: {
        deptosMudosConSenalExterna: [
          { departmentId: 'd2', departmentName: 'D2', signalsCount: 3 },
          { departmentId: 'd3', departmentName: 'D3', signalsCount: 4 },
        ],
        count: 2,
      },
    }),
  ];
  const s = deriveBeat1Slots(rollups, ctx());

  assert.equal(s.gerencia_muda_con_externa_1?.groupId, 'gB');
  assert.equal(s.gerencia_muda_con_externa_1?.deptosMudosCount, 2);
  assert.equal(s.gerencia_muda_con_externa_1?.signalsCountTotal, 7); // 3+4
});

// ═══════════════════════════════════════════════════════════════════
// CASE 8 — gerencia_muda_con_externa_1: null cuando ninguna gerencia matchea
// ═══════════════════════════════════════════════════════════════════

test('8. muda_con_externa_1: count === 0 en todas → null', () => {
  const rollups: GerenciaRollup[] = [
    mkRollup({ groupId: 'gA', groupName: 'A' }),
    mkRollup({ groupId: 'gB', groupName: 'B' }),
  ];
  const s = deriveBeat1Slots(rollups, ctx());
  assert.equal(s.gerencia_muda_con_externa_1, null);
});

// ═══════════════════════════════════════════════════════════════════
// CASE 9 — gerencia_teatro_1 = gerencia_contradiccion_1 (alias)
// ═══════════════════════════════════════════════════════════════════

test('9. teatro_1 y contradiccion_1: alias del mismo pick (anyTeatro === true)', () => {
  const rollups: GerenciaRollup[] = [
    mkRollup({
      groupId: 'gA',
      groupName: 'A',
      teatro: { anyTeatro: false, deptosConTeatro: 0, deptosConFlagPresente: 2 },
      riesgo: { maxScore: 80, worstDept: null }, // fuerza primer lugar en sort externo del rollup
    }),
    mkRollup({
      groupId: 'gB',
      groupName: 'B',
      teatro: { anyTeatro: true, deptosConTeatro: 1, deptosConFlagPresente: 2 },
      riesgo: { maxScore: 40, worstDept: null },
    }),
  ];
  const s = deriveBeat1Slots(rollups, ctx());
  // gA tiene anyTeatro=false (medido sin teatro) → descartada. gB es la elegida.
  assert.equal(s.gerencia_teatro_1?.groupId, 'gB');
  assert.equal(s.gerencia_contradiccion_1?.groupId, 'gB');
  assert.deepEqual(s.gerencia_teatro_1, s.gerencia_contradiccion_1);
});

// ═══════════════════════════════════════════════════════════════════
// CASE 10 — teatro_1: null cuando anyTeatro === null o false en todas
// ═══════════════════════════════════════════════════════════════════

test('10. teatro_1: anyTeatro null (legacy) y false NO disparan → null', () => {
  const rollups: GerenciaRollup[] = [
    mkRollup({
      groupId: 'gA',
      groupName: 'A',
      teatro: { anyTeatro: null, deptosConTeatro: 0, deptosConFlagPresente: 0 },
    }),
    mkRollup({
      groupId: 'gB',
      groupName: 'B',
      teatro: { anyTeatro: false, deptosConTeatro: 0, deptosConFlagPresente: 3 },
    }),
  ];
  const s = deriveBeat1Slots(rollups, ctx());
  assert.equal(s.gerencia_teatro_1, null);
  assert.equal(s.gerencia_contradiccion_1, null);
});

// ═══════════════════════════════════════════════════════════════════
// CASE 11 — gerencia_denuncia_1: count === null queda fuera (3-estado)
// ═══════════════════════════════════════════════════════════════════

test('11. denuncia_1: count === null (no cargada) → null. count === 0 → null.', () => {
  const rollups: GerenciaRollup[] = [
    mkRollup({
      groupId: 'gA',
      groupName: 'A',
      denuncias: {
        count: null,
        deptosConDatoCargado: 0,
        deptosSinDatoCargado: 3,
        deptosConDenuncia: 0,
      },
    }),
    mkRollup({
      groupId: 'gB',
      groupName: 'B',
      denuncias: {
        count: 0,
        deptosConDatoCargado: 2,
        deptosSinDatoCargado: 0,
        deptosConDenuncia: 0,
      },
    }),
  ];
  const s = deriveBeat1Slots(rollups, ctx());
  assert.equal(s.gerencia_denuncia_1, null);
});

// ═══════════════════════════════════════════════════════════════════
// CASE 12 — gerencia_denuncia_1: count >= 1 → elige el mayor
// ═══════════════════════════════════════════════════════════════════

test('12. denuncia_1: varias con denuncias → elige el mayor count', () => {
  const rollups: GerenciaRollup[] = [
    mkRollup({
      groupId: 'gA',
      groupName: 'A',
      denuncias: {
        count: 1,
        deptosConDatoCargado: 1,
        deptosSinDatoCargado: 0,
        deptosConDenuncia: 1,
      },
    }),
    mkRollup({
      groupId: 'gB',
      groupName: 'B',
      denuncias: {
        count: 4,
        deptosConDatoCargado: 2,
        deptosSinDatoCargado: 0,
        deptosConDenuncia: 2,
      },
    }),
  ];
  const s = deriveBeat1Slots(rollups, ctx());
  assert.equal(s.gerencia_denuncia_1?.groupId, 'gB');
  assert.equal(s.gerencia_denuncia_1?.denunciasCount, 4);
});

// ═══════════════════════════════════════════════════════════════════
// CASE 13 — exit_alerts_count: suma global cross-gerencias
// ═══════════════════════════════════════════════════════════════════

test('13. exit_alerts_count: suma cross-gerencias', () => {
  const rollups: GerenciaRollup[] = [
    mkRollup({
      groupId: 'gA',
      groupName: 'A',
      exit: { alertsCount: 3, pesoTotal: 2.5, deptosConAlerta: 2 },
    }),
    mkRollup({
      groupId: 'gB',
      groupName: 'B',
      exit: { alertsCount: 5, pesoTotal: 4.0, deptosConAlerta: 1 },
    }),
    mkRollup({ groupId: 'gC', groupName: 'C' }), // sin exit
  ];
  const s = deriveBeat1Slots(rollups, ctx());
  assert.equal(s.exit_alerts_count, 8);
});

// ═══════════════════════════════════════════════════════════════════
// CASE 14 — Smoke: 0 gerencias con ISA → top/alta/baja todos null
// ═══════════════════════════════════════════════════════════════════

test('13d. personResponseRate: Σ responded / Σ invited (person-level, NO dept-level)', () => {
  // Distinto de coverage.pctCobertura (que cuenta áreas). Acá el numerador
  // y denominador son PERSONAS — para la narrativa "del equipo respondió".
  const rollups: GerenciaRollup[] = [
    mkRollup({
      groupId: 'gA', groupName: 'A',
      silencio: {
        invited: 50, responded: 30, empleadosActivos: 50,
        participationRate: 0.6, coverageRate: 1,
        deptosNoInvitados: 0, deptosSubThreshold: 0,
      },
    }),
    mkRollup({
      groupId: 'gB', groupName: 'B',
      silencio: {
        invited: 20, responded: 10, empleadosActivos: 20,
        participationRate: 0.5, coverageRate: 1,
        deptosNoInvitados: 0, deptosSubThreshold: 0,
      },
    }),
  ];
  const s = deriveBeat1Slots(rollups, ctx());
  // 30+10 = 40 respondieron, 50+20 = 70 invitados → 40/70 = 57.14 → 57.
  assert.equal(s.personResponseRate, 57);
});

test('13e. personResponseRate: nadie invitado → null (defensivo, no 0)', () => {
  const rollups: GerenciaRollup[] = [
    mkRollup({
      groupId: 'gA', groupName: 'A',
      silencio: {
        invited: 0, responded: 0, empleadosActivos: 10,
        participationRate: null, coverageRate: 0,
        deptosNoInvitados: 1, deptosSubThreshold: 0,
      },
    }),
  ];
  const s = deriveBeat1Slots(rollups, ctx());
  // 0 invited → null (no afirmar "0% respondió" — distinto de "nadie invitado").
  assert.equal(s.personResponseRate, null);
});

test('13c. gerencias_universo_total: cuenta TODAS las invitadas (incluyendo las mudas)', () => {
  // Caveat semántico: gerencias_medidas_total EXCLUYE las mudas (porque su
  // ISA.weighted === null). Usar gerencias_medidas_total como denominador de
  // SILENCIO ("N de M sin voz") undercount → M < N + medidas. Este slot da
  // el universo real (rollups.length) — TODAS las gerencias invitadas.
  const rollups: GerenciaRollup[] = [
    // Medida sana
    mkRollup({
      groupId: 'gA',
      groupName: 'A',
      isa: { weighted: 85, min: 85, max: 85, deptosConIsa: 1 },
    }),
    // Muda low_participation
    mkRollup({
      groupId: 'gB',
      groupName: 'B',
      isa: { weighted: null, min: null, max: null, deptosConIsa: 0 },
      silencio: {
        invited: 10, responded: 3, empleadosActivos: 10,
        participationRate: 0.3, coverageRate: 1,
        deptosNoInvitados: 0, deptosSubThreshold: 0,
      },
    }),
    // Muda no_invitada (defensa de invariante — no debería aparecer con el
    // fix de universo campaign-scope, pero el contrato del slot lo permite)
    mkRollup({
      groupId: 'gC',
      groupName: 'C',
      isa: { weighted: null, min: null, max: null, deptosConIsa: 0 },
      silencio: {
        invited: 0, responded: 0, empleadosActivos: 5,
        participationRate: null, coverageRate: 0,
        deptosNoInvitados: 1, deptosSubThreshold: 0,
      },
    }),
  ];
  const s = deriveBeat1Slots(rollups, ctx());
  // Comparación clave: el universo es 3 (todas las gerencias). Las medidas
  // son solo 1 (gA). Las mudas son 2 (gB + gC). El denominador de SILENCIO
  // debe ser 3 (universo), no 1 (medidas) — si fuera 1, "2 de 1 sin voz"
  // sería absurdo (más mudas que medidas).
  assert.equal(s.gerencias_universo_total, 3);
  assert.equal(s.gerencias_medidas_total, 1);
  assert.equal(s.gerencias_mudas_count, 2);
});

test('13b. gerencias_mudas_count: cuenta low_participation + no_invitada combinadas', () => {
  const rollups: GerenciaRollup[] = [
    // low_participation
    mkRollup({
      groupId: 'gA',
      groupName: 'A',
      silencio: {
        invited: 10, responded: 3, empleadosActivos: 10,
        participationRate: 0.3, coverageRate: 1,
        deptosNoInvitados: 0, deptosSubThreshold: 0,
      },
    }),
    // no_invitada
    mkRollup({
      groupId: 'gB',
      groupName: 'B',
      silencio: {
        invited: 0, responded: 0, empleadosActivos: 5,
        participationRate: null, coverageRate: 0,
        deptosNoInvitados: 1, deptosSubThreshold: 0,
      },
    }),
    // above threshold — NO muda
    mkRollup({
      groupId: 'gC',
      groupName: 'C',
      silencio: {
        invited: 10, responded: 7, empleadosActivos: 10,
        participationRate: 0.7, coverageRate: 1,
        deptosNoInvitados: 0, deptosSubThreshold: 0,
      },
    }),
  ];
  const s = deriveBeat1Slots(rollups, ctx());
  // gA (low_part) + gB (no_inv) = 2. gC sobre umbral, no cuenta.
  assert.equal(s.gerencias_mudas_count, 2);
});

test('14. ningún rollup con ISA medido → top/alta/baja null + counts en 0', () => {
  const rollups: GerenciaRollup[] = [
    mkRollup({ groupId: 'gA', groupName: 'A' }), // isa.weighted: null por default
    mkRollup({ groupId: 'gB', groupName: 'B' }),
  ];
  const s = deriveBeat1Slots(rollups, ctx());
  assert.equal(s.gerencia_top_1, null);
  assert.equal(s.gerencia_alta_1, null);
  assert.equal(s.gerencia_baja_1, null);
  assert.equal(s.gerencias_sanas_count, 0);
  assert.equal(s.gerencias_medidas_total, 0);
});

// ═══════════════════════════════════════════════════════════════════
// CASE 15 — banda + coverage_gap_pct (passthrough del ctx)
// ═══════════════════════════════════════════════════════════════════

test('15. banda: derivada vía getISARiskLevel(ctx.orgISA) — boundaries 80/60/40', () => {
  const s1 = deriveBeat1Slots([], ctx({ orgISA: 85 }));
  assert.equal(s1.banda, 'saludable');
  const s2 = deriveBeat1Slots([], ctx({ orgISA: 60 }));
  assert.equal(s2.banda, 'observacion');
  const s3 = deriveBeat1Slots([], ctx({ orgISA: 40 }));
  assert.equal(s3.banda, 'riesgo');
  const s4 = deriveBeat1Slots([], ctx({ orgISA: 39 }));
  assert.equal(s4.banda, 'critico');
});

test('15b. coverage_gap_pct: passthrough del ctx (sin transform)', () => {
  const s = deriveBeat1Slots([], ctx({ coverageGapPct: 42 }));
  assert.equal(s.coverage_gap_pct, 42);
});

// ═══════════════════════════════════════════════════════════════════
// CASE 16 — gerencia_foco_1: BIEN CON FOCOS sabor riesgo
// ═══════════════════════════════════════════════════════════════════

test('16. foco_1: filtra deptosEnRiesgo>0, sort por peor ISA, tiebreak alfabético', () => {
  const rollups: GerenciaRollup[] = [
    // Sin foco (riesgo=0) — descartada
    mkRollup({
      groupId: 'gX',
      groupName: 'X',
      deptosEnRiesgo: 0,
      isa: { weighted: 85, min: 85, max: 85, deptosConIsa: 1 },
    }),
    // Con foco, ISA 70
    mkRollup({
      groupId: 'gA',
      groupName: 'Alfa',
      deptosEnRiesgo: 1,
      isa: { weighted: 70, min: 70, max: 70, deptosConIsa: 1 },
    }),
    // Con foco, ISA 50 — peor, debe ganar
    mkRollup({
      groupId: 'gB',
      groupName: 'Beta',
      deptosEnRiesgo: 2,
      isa: { weighted: 50, min: 50, max: 50, deptosConIsa: 1 },
    }),
  ];
  const s = deriveBeat1Slots(rollups, ctx());
  assert.equal(s.gerencia_foco_1?.groupId, 'gB');
  assert.equal(s.gerencia_foco_1?.isaWeighted, 50);
});

test('16b. foco_1: sabor cobertura (sin riesgo en hijos) → null', () => {
  const rollups: GerenciaRollup[] = [
    mkRollup({
      groupId: 'gA',
      groupName: 'A',
      deptosEnRiesgo: 0,
      isa: { weighted: 85, min: 85, max: 85, deptosConIsa: 1 },
    }),
  ];
  const s = deriveBeat1Slots(rollups, ctx({ coverageGapPct: 35 }));
  assert.equal(s.gerencia_foco_1, null);
  // El sabor "cobertura" lo resuelve el componente leyendo slots.coverage_gap_pct.
  assert.equal(s.coverage_gap_pct, 35);
});

// ═══════════════════════════════════════════════════════════════════
// CASE 17 — gerencia_genero_1 (ortogonal)
// ═══════════════════════════════════════════════════════════════════

test('17. genero_1: gerencia con hasAlerta + evidenciaGenero literal', () => {
  const rollups: GerenciaRollup[] = [
    mkRollup({
      groupId: 'gA',
      groupName: 'A',
      genero: { hasAlerta: true, evidenciaGenero: 'cita literal' },
    }),
    mkRollup({
      groupId: 'gB',
      groupName: 'B',
      genero: { hasAlerta: false, evidenciaGenero: null },
    }),
  ];
  const s = deriveBeat1Slots(rollups, ctx());
  assert.equal(s.gerencia_genero_1?.groupId, 'gA');
  assert.equal(s.gerencia_genero_1?.evidenciaGenero, 'cita literal');
});

test('17b. genero_1: hasAlerta=true PERO evidenciaGenero=null → degrada (null)', () => {
  const rollups: GerenciaRollup[] = [
    mkRollup({
      groupId: 'gA',
      groupName: 'A',
      genero: { hasAlerta: true, evidenciaGenero: null }, // ← caso payload legacy
    }),
  ];
  const s = deriveBeat1Slots(rollups, ctx());
  // No se afirma "hay alerta sin cita" — slot null, cláusula se omite.
  assert.equal(s.gerencia_genero_1, null);
});

test('17c. genero_1: ninguna gerencia con alerta → null', () => {
  const rollups: GerenciaRollup[] = [
    mkRollup({ groupId: 'gA', groupName: 'A' }),
    mkRollup({ groupId: 'gB', groupName: 'B' }),
  ];
  const s = deriveBeat1Slots(rollups, ctx());
  assert.equal(s.gerencia_genero_1, null);
});

// ═══════════════════════════════════════════════════════════════════
// CASE 18 — gerencia_ley_karin_1 (ortogonal)
// ═══════════════════════════════════════════════════════════════════

test('18. ley_karin_1: filtra signalsCount>0, sort por más señales primero', () => {
  const rollups: GerenciaRollup[] = [
    mkRollup({
      groupId: 'gA',
      groupName: 'A',
      leyKarin: { signalsCount: 2, deptosConSenal: 1 },
    }),
    mkRollup({
      groupId: 'gB',
      groupName: 'B',
      leyKarin: { signalsCount: 5, deptosConSenal: 3 }, // ← más, gana
    }),
    mkRollup({
      groupId: 'gC',
      groupName: 'C',
      leyKarin: { signalsCount: 0, deptosConSenal: 0 },
    }),
  ];
  const s = deriveBeat1Slots(rollups, ctx());
  assert.equal(s.gerencia_ley_karin_1?.groupId, 'gB');
  assert.equal(s.gerencia_ley_karin_1?.signalsCount, 5);
});

test('18b. ley_karin_1: signalsCount === 0 en todas → null', () => {
  const rollups: GerenciaRollup[] = [
    mkRollup({ groupId: 'gA', groupName: 'A' }),
    mkRollup({ groupId: 'gB', groupName: 'B' }),
  ];
  const s = deriveBeat1Slots(rollups, ctx());
  assert.equal(s.gerencia_ley_karin_1, null);
});

test('18c. ortogonales independientes: género + Ley Karin pueden coexistir en gerencias distintas', () => {
  const rollups: GerenciaRollup[] = [
    mkRollup({
      groupId: 'gA',
      groupName: 'A',
      genero: { hasAlerta: true, evidenciaGenero: 'cita A' },
    }),
    mkRollup({
      groupId: 'gB',
      groupName: 'B',
      leyKarin: { signalsCount: 3, deptosConSenal: 2 },
    }),
  ];
  const s = deriveBeat1Slots(rollups, ctx());
  assert.equal(s.gerencia_genero_1?.groupId, 'gA');
  assert.equal(s.gerencia_ley_karin_1?.groupId, 'gB');
});

// ═══════════════════════════════════════════════════════════════════
// CASE 19 — exit_alerts_count de-duplica ley_karin (subset de exit total)
//   r.exit.alertsCount cuenta TODAS las exit (cualquier alertType).
//   r.leyKarin.signalsCount es estrictamente un subset (alertType ∈ ley_karin*).
//   El slot exit_alerts_count debe restar para no contar el mismo evento dos
//   veces (una en SILENCIO "pero", otra en la cláusula ortogonal Ley Karin).
//   Math.max(0, ...) defensivo por si alguna vez se rompe el invariante.
// ═══════════════════════════════════════════════════════════════════

test('19. exit_alerts_count: resta ley_karin del total exit (de-dup ortogonal)', () => {
  const rollups: GerenciaRollup[] = [
    mkRollup({
      groupId: 'gA', groupName: 'A',
      exit: { alertsCount: 5, pesoTotal: 0, deptosConAlerta: 1 },   // 5 exit total
      leyKarin: { signalsCount: 2, deptosConSenal: 1 },              // de los cuales 2 son ley_karin
    }),
    mkRollup({
      groupId: 'gB', groupName: 'B',
      exit: { alertsCount: 3, pesoTotal: 0, deptosConAlerta: 1 },
      leyKarin: { signalsCount: 0, deptosConSenal: 0 },
    }),
  ];
  const s = deriveBeat1Slots(rollups, ctx());
  // gA: max(0, 5-2)=3, gB: max(0, 3-0)=3 → total 6 "exit no Ley Karin".
  assert.equal(s.exit_alerts_count, 6);
});

test('19b. exit_alerts_count: invariante roto (ley_karin > exit) → 0, no negativo', () => {
  const rollups: GerenciaRollup[] = [
    mkRollup({
      groupId: 'gA', groupName: 'A',
      // Caso "imposible" pero defensivo: ley_karin > exit total. Math.max(0, ...)
      // protege la narrativa de "−2 señales".
      exit: { alertsCount: 1, pesoTotal: 0, deptosConAlerta: 1 },
      leyKarin: { signalsCount: 3, deptosConSenal: 1 },
    }),
  ];
  const s = deriveBeat1Slots(rollups, ctx());
  assert.equal(s.exit_alerts_count, 0);
});

test('19c. exit_alerts_count: sin ley_karin en ninguna gerencia → comportamiento original', () => {
  const rollups: GerenciaRollup[] = [
    mkRollup({
      groupId: 'gA', groupName: 'A',
      exit: { alertsCount: 4, pesoTotal: 0, deptosConAlerta: 2 },
    }),
    mkRollup({
      groupId: 'gB', groupName: 'B',
      exit: { alertsCount: 2, pesoTotal: 0, deptosConAlerta: 1 },
    }),
  ];
  const s = deriveBeat1Slots(rollups, ctx());
  // Sin ley_karin (default 0): la suma es idéntica al pre-fix.
  assert.equal(s.exit_alerts_count, 6);
});
