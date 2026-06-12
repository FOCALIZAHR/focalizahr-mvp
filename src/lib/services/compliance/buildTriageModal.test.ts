// ═══════════════════════════════════════════════════════════════════
// buildTriageModal — tests (node:test + node:assert/strict) · GATE 2b
// src/lib/services/compliance/buildTriageModal.test.ts
// ═══════════════════════════════════════════════════════════════════
// Run:
//   npx tsx --test src/lib/services/compliance/buildTriageModal.test.ts
//
// Oráculos:
//   A. Helpers de copy (scoreNarrada, drivers, declararon, señales).
//   B. Modal INDIVIDUAL (HUMO/A-legal, 1 gerencia): estructura completa §2b,
//      veredicto singular verbatim, SUS DEPARTAMENTOS excluye la gerencia-misma.
//   C. Modal de GRUPO (PUNTO_CIEGO, >1 gerencia): veredicto plural UNA vez,
//      bloques compactos (drivers/declararon/señales null), departamentos por bloque.
// ═══════════════════════════════════════════════════════════════════

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  buildTriageModal,
  buildScoreNarrada,
  buildDriversText,
  buildSenalesText,
  buildDeclararonText,
} from './buildTriageModal';
import type { GerenciaRollup } from './buildGerenciaRollup';
import type {
  ComplianceReportResponse,
  DepartmentRiskScore,
  DepartmentRiskAlertItem,
} from '@/types/compliance';
import type { CoverageDeptItem } from '@/lib/services/compliance/CoverageAnalysisService';

// ═══════════════════════════════════════════════════════════════════
// FACTORIES (espejo de buildTriageGroups.test.ts)
// ═══════════════════════════════════════════════════════════════════

function mkRiskScore(
  opts: Partial<DepartmentRiskScore> & { departmentId: string },
): DepartmentRiskScore {
  return {
    departmentId: opts.departmentId,
    departmentName: opts.departmentName ?? `name-${opts.departmentId}`,
    score: opts.score ?? 0,
    bucket: opts.bucket ?? 'sub_threshold',
    drivers: opts.drivers ?? { confiabilidad: 0, voz_externa: 0, piso_denuncia: 0 },
    reason: opts.reason ?? 'suma',
    inputs: opts.inputs ?? { participacion: null, pesoAlertas: 0, denuncias_12m: null },
    alertas: opts.alertas ?? [],
    parentGerenciaId: opts.parentGerenciaId,
    parentGerenciaName: opts.parentGerenciaName,
  };
}

function makeReport(opts: {
  riskScores: DepartmentRiskScore[];
  country?: string;
}): ComplianceReportResponse {
  const report = {
    success: true,
    type: 'executive',
    company: { name: 'Test Co', country: opts.country ?? 'CL' },
    narratives: { alertasGenero: [] },
    data: {
      orgISA: null,
      coverage: {
        totalDeptos: 0,
        deptosConVoz: 0,
        pctCobertura: 18,
        silencioConVozExterna: [],
        participacionAnomala: [],
        deptosCobertura: [] as CoverageDeptItem[],
      },
      departments: [],
      convergencia: { departments: [] },
      silencioVozExterna: [],
      otroMundo: [],
      riskScores: opts.riskScores,
    },
  };
  return report as unknown as ComplianceReportResponse;
}

const karinAlert: DepartmentRiskAlertItem = {
  alertType: 'ley_karin',
  producto: 'exit',
  pesoEfectivo: 3,
};

/** Comercial (merge ancestro, A-legal, Karin) + 1 hijo PC; + Operaciones PC con
 *  2 hijos (Seguridad PC worst + un con_isa CONFIABLE). */
function report(): ComplianceReportResponse {
  return makeReport({
    riskScores: [
      mkRiskScore({
        departmentId: 'com',
        departmentName: 'Gerencia Comercial',
        score: 75,
        bucket: 'sub_threshold',
        drivers: { confiabilidad: 50, voz_externa: 25, piso_denuncia: 0 },
        inputs: { participacion: null, pesoAlertas: 3, denuncias_12m: null },
        alertas: [karinAlert],
        parentGerenciaId: null,
      }),
      mkRiskScore({
        departmentId: 'com-c1',
        departmentName: 'Ventas Norte',
        score: 50,
        bucket: 'sub_threshold',
        drivers: { confiabilidad: 50, voz_externa: 0, piso_denuncia: 0 },
        parentGerenciaId: 'com',
        parentGerenciaName: 'Gerencia Comercial',
      }),
      // Operaciones PC: Seguridad worst (sub_threshold 50) + Equipos con_isa CONFIABLE.
      mkRiskScore({
        departmentId: 'ops-seg',
        departmentName: 'Seguridad',
        score: 50,
        bucket: 'sub_threshold',
        drivers: { confiabilidad: 50, voz_externa: 0, piso_denuncia: 0 },
        parentGerenciaId: 'ops',
        parentGerenciaName: 'Gerencia de Operaciones',
      }),
      mkRiskScore({
        departmentId: 'ops-eq',
        departmentName: 'Equipos',
        score: 20,
        bucket: 'con_isa',
        drivers: { confiabilidad: 20, voz_externa: 0, piso_denuncia: 0 },
        inputs: { participacion: 90, pesoAlertas: 0, denuncias_12m: null },
        parentGerenciaId: 'ops',
        parentGerenciaName: 'Gerencia de Operaciones',
      }),
      // Finanzas PC standalone (sin sub-departamentos genuinos).
      mkRiskScore({
        departmentId: 'fin',
        departmentName: 'Gerencia de Finanzas',
        score: 50,
        bucket: 'sub_threshold',
        drivers: { confiabilidad: 50, voz_externa: 0, piso_denuncia: 0 },
        parentGerenciaId: null,
      }),
    ],
  });
}

// ═══════════════════════════════════════════════════════════════════
// A — HELPERS DE COPY
// ═══════════════════════════════════════════════════════════════════

test('A1. buildScoreNarrada', () => {
  assert.equal(buildScoreNarrada(50, 25, 'suma'), '50 puntos de silencio, 25 de señales del año');
  assert.equal(buildScoreNarrada(50, 0, 'suma'), '50 puntos de silencio');
  assert.equal(buildScoreNarrada(50, 25, 'piso_aplicado'), 'piso directo por denuncia formal del año');
});

test('A2. buildDriversText — verbatim §2b-3, condicional por driver', () => {
  assert.equal(
    buildDriversText(50, 25, 'suma'),
    'El silencio pesa porque sin voz interna el área no se puede leer por dentro. ' +
      'Las señales pesan porque son hechos del último año, dejados por quienes salieron o entraron.',
  );
  assert.equal(
    buildDriversText(50, 0, 'suma'),
    'El silencio pesa porque sin voz interna el área no se puede leer por dentro.',
  );
  assert.equal(
    buildDriversText(0, 0, 'piso_aplicado'),
    '75 directo: hubo denuncia formal en el año — el hecho solo pone al área en prioridad, diga lo que diga el resto.',
  );
});

test('A3. buildSenalesText — slot legal en prosa; denuncia ≠ indicio, JAMÁS sumados', () => {
  // Indicio Ley Karin (CL) — prosa "bajo Ley Karin".
  assert.equal(
    buildSenalesText(
      mkRiskScore({ departmentId: 'x', alertas: [karinAlert], inputs: { participacion: null, pesoAlertas: 3, denuncias_12m: null } }),
      'CL',
    ),
    'En los últimos 12 meses, una salida dejó un indicio bajo Ley Karin. Es un indicio, no una denuncia.',
  );
  // Indicio (país no-CL) — prosa "de riesgo de cumplimiento".
  assert.equal(
    buildSenalesText(
      mkRiskScore({ departmentId: 'x2', alertas: [karinAlert], inputs: { participacion: null, pesoAlertas: 3, denuncias_12m: null } }),
      'AR',
    ),
    'En los últimos 12 meses, una salida dejó un indicio de riesgo de cumplimiento. Es un indicio, no una denuncia.',
  );
  // Denuncia formal — rama propia (no menciona indicios).
  assert.equal(
    buildSenalesText(
      mkRiskScore({ departmentId: 'y', alertas: [karinAlert], inputs: { participacion: null, pesoAlertas: 3, denuncias_12m: 2 } }),
      'CL',
    ),
    'En el último año hubo 2 denuncias formales en el área.',
  );
  // Sin señales → null.
  assert.equal(buildSenalesText(mkRiskScore({ departmentId: 'z' }), 'CL'), null);
});

test('A4. buildDeclararonText — con_isa formato canónico "ISA {n} · {Nivel}"', () => {
  const conIsa = mkRiskScore({ departmentId: 'ci', bucket: 'con_isa' });
  const rollup = { isa: { weighted: 72 } } as unknown as GerenciaRollup;
  assert.equal(
    buildDeclararonText(conIsa, rollup),
    'El equipo sí dejó lectura interna: ISA 72 · Atención.',
  );
  // sub_threshold → "Nada medible…"
  const sub = mkRiskScore({ departmentId: 's', bucket: 'sub_threshold' });
  assert.equal(
    buildDeclararonText(sub, { isa: { weighted: null } } as unknown as GerenciaRollup),
    'Nada medible este ciclo: el equipo no alcanzó el mínimo de respuestas para una lectura interna.',
  );
});

// ═══════════════════════════════════════════════════════════════════
// B — MODAL INDIVIDUAL (HUMO/A-legal)
// ═══════════════════════════════════════════════════════════════════

test('B1. individual — estructura §2b completa + veredicto singular', () => {
  const m = buildTriageModal(report(), 'HUMO/A-legal')!;
  assert.equal(m.mode, 'individual');
  assert.equal(m.kicker, 'EN HUMO · Señal legal tras el silencio');
  assert.equal(m.blocks.length, 1);
  const b = m.blocks[0];
  assert.equal(b.gerenciaName, 'Gerencia Comercial');
  assert.equal(b.score, 75);
  assert.equal(b.scoreNarrada, '50 puntos de silencio, 25 de señales del año');
  assert.equal(
    b.drivers,
    'El silencio pesa porque sin voz interna el área no se puede leer por dentro. ' +
      'Las señales pesan porque son hechos del último año, dejados por quienes salieron o entraron.',
  );
  assert.equal(
    b.declararon,
    'Nada medible este ciclo: el equipo no alcanzó el mínimo de respuestas para una lectura interna.',
  );
  assert.equal(
    b.senales,
    'En los últimos 12 meses, una salida dejó un indicio bajo Ley Karin. Es un indicio, no una denuncia.',
  );
  // Veredicto verbatim singular del dictionary.
  assert.equal(
    m.veredicto,
    'El equipo guarda silencio masivo en los canales oficiales, pero quien se fue dejó una señal de Ley Karin. Esto no es rotación: es un riesgo jurídico en formación, del tipo que suele preceder a una denuncia formal. Actuar sobre la señal ahora es lo que separa la prevención de un pasivo legal activo.',
  );
  assert.equal(
    m.pie,
    'Las señales cuentan por fecha del hecho — últimos 12 meses, sin importar estado ni desenlace.',
  );
  // SUS DEPARTAMENTOS: excluye la gerencia-misma ('com'), muestra el hijo.
  assert.deepEqual(
    b.departamentos.map((d) => `${d.departmentName} · ${d.score} ${d.familyLabel}`),
    ['Ventas Norte · 50 PUNTO CIEGO'],
  );
});

// ═══════════════════════════════════════════════════════════════════
// C — MODAL DE GRUPO (PUNTO_CIEGO)
// ═══════════════════════════════════════════════════════════════════

test('C1. grupo — veredicto plural UNA vez + bloques compactos', () => {
  const m = buildTriageModal(report(), 'PUNTO_CIEGO')!;
  assert.equal(m.mode, 'grupo');
  // 2 gerencias PC: Finanzas (standalone) + Operaciones.
  assert.deepEqual(
    m.blocks.map((b) => b.gerenciaName),
    ['Gerencia de Finanzas', 'Gerencia de Operaciones'],
  );
  // Bloques compactos: sin drivers/declararon/señales.
  for (const b of m.blocks) {
    assert.equal(b.drivers, null);
    assert.equal(b.declararon, null);
    assert.equal(b.senales, null);
  }
  // Veredicto plural (adaptación aprobada) UNA vez.
  assert.equal(
    m.veredicto,
    'Ceguera operativa. Estos equipos no participaron en la medición interna y no registran señales de alerta externas. No asumas que existe una crisis oculta, pero ten en cuenta que en estas áreas estás gestionando sin radar.',
  );
  // Finanzas standalone → sin sub-departamentos.
  const fin = m.blocks.find((b) => b.gerenciaName === 'Gerencia de Finanzas')!;
  assert.equal(fin.departamentos.length, 0);
  // Operaciones → Seguridad (PC) + Equipos (CONFIABLE, con_isa), orden score desc.
  const ops = m.blocks.find((b) => b.gerenciaName === 'Gerencia de Operaciones')!;
  assert.deepEqual(
    ops.departamentos.map((d) => `${d.departmentName} · ${d.score} ${d.familyLabel}`),
    ['Seguridad · 50 PUNTO CIEGO', 'Equipos · 20 CONFIABLE'],
  );
});

test('C2. lecturaKey inexistente en el caso → null', () => {
  assert.equal(buildTriageModal(report(), 'FUEGO'), null);
});
