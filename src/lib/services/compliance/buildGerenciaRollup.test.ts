// ═══════════════════════════════════════════════════════════════════
// buildGerenciaRollup — tests (node:test + node:assert/strict)
// src/lib/services/compliance/buildGerenciaRollup.test.ts
// ═══════════════════════════════════════════════════════════════════
// Run:
//   npx tsx --test src/lib/services/compliance/buildGerenciaRollup.test.ts
//
// 8 casos del SPEC §11 (regla anti-fitting: inputs sintéticos, no campaña real):
//   1.  Payload sin riskScores                          → []
//   1b. riskScores === []                                → []
//   2.  1 gerencia, 3 hijos con_isa                      → ISA weighted + silencio
//   3.  Todos denuncias_12m null                         → count: null
//   4.  Todos denuncias_12m 0                            → count: 0 afirmable
//   5.  Mixto denuncias (1 con dato, 1 sin)              → count del cargado
//   6.  Standalone dept (parentGerenciaId === null)      → standalone: true
//   6b. parentGerenciaId === undefined (legacy payload)  → standalone: true
//   7a. Teatro: 1 true + 1 false                         → anyTeatro: true
//   7b. Teatro: ningún hijo trae el campo                → anyTeatro: null
//   8.  Gerencia entera no invitada                      → participationRate: null
// ═══════════════════════════════════════════════════════════════════

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { buildGerenciaRollup } from './buildGerenciaRollup';

import type {
  ComplianceReportResponse,
  ComplianceReportDepartment,
  DepartmentRiskScore,
  SilencioVozExternaItem,
} from '@/types/compliance';
import type {
  CoverageDeptItem,
  CoverageAnalyzedStatus,
} from '@/lib/services/compliance/CoverageAnalysisService';
import type { DepartmentConvergencia } from '@/lib/services/compliance/ConvergenciaEngine';

// ═══════════════════════════════════════════════════════════════════
// FACTORIES — minimal builders. Solo poblar lo que el util lee.
// ═══════════════════════════════════════════════════════════════════

function mkRiskScore(
  opts: Partial<DepartmentRiskScore> & { departmentId: string },
): DepartmentRiskScore {
  return {
    departmentId: opts.departmentId,
    departmentName: opts.departmentName ?? `name-${opts.departmentId}`,
    score: opts.score ?? 0,
    bucket: opts.bucket ?? 'con_isa',
    drivers: opts.drivers ?? {
      confiabilidad: 0,
      voz_externa: 0,
      piso_denuncia: 0,
    },
    reason: opts.reason ?? 'suma',
    inputs: opts.inputs ?? {
      participacion: null,
      pesoAlertas: 0,
      denuncias_12m: null,
    },
    alertas: opts.alertas ?? [],
    parentGerenciaId: opts.parentGerenciaId,
    parentGerenciaName: opts.parentGerenciaName,
  };
}

function mkDept(
  opts: Partial<ComplianceReportDepartment> & { departmentId: string },
): ComplianceReportDepartment {
  return {
    departmentId: opts.departmentId,
    departmentName: opts.departmentName ?? `name-${opts.departmentId}`,
    safetyScore: opts.safetyScore ?? 0,
    riskLevel: opts.riskLevel ?? 'safe',
    respondentCount: opts.respondentCount ?? 0,
    dimensionScores: opts.dimensionScores ?? {
      P2_seguridad: null,
      P3_disenso: null,
      P4_microagresiones: null,
      P5_equidad: null,
      P7_liderazgo: null,
      P8_agotamiento: null,
    },
    isaScore: opts.isaScore ?? null,
    deltaVsAnterior: opts.deltaVsAnterior ?? null,
    // teatroCumplimiento: solo incluir si el caller lo pasa explícito (true o false).
    // Omitido cuando undefined para simular payload legacy sin el campo.
    ...(opts.teatroCumplimiento !== undefined
      ? { teatroCumplimiento: opts.teatroCumplimiento }
      : {}),
  };
}

function mkCoverage(
  opts: Partial<CoverageDeptItem> & { departmentId: string },
): CoverageDeptItem {
  const analyzed: CoverageAnalyzedStatus = opts.analyzed ?? 'not_invited';
  return {
    departmentId: opts.departmentId,
    departmentName: opts.departmentName ?? `name-${opts.departmentId}`,
    empleadosActivos: opts.empleadosActivos ?? 0,
    invited: opts.invited ?? 0,
    responded: opts.responded ?? 0,
    participationRate: opts.participationRate ?? null,
    analyzed,
    exoScore: opts.exoScore ?? null,
    eisScore: opts.eisScore ?? null,
    externalAlertCount: opts.externalAlertCount ?? 0,
  };
}

function makeReport(opts: {
  riskScores?: DepartmentRiskScore[];
  departments?: ComplianceReportDepartment[];
  deptosCobertura?: CoverageDeptItem[];
  /** Top-level `silencioVozExterna` (sexta alerta pre-cocida). El util lee
   *  desde acá, NO desde `coverage.silencioConVozExterna` (otra shape). */
  silencioVozExterna?: SilencioVozExternaItem[];
  convergenciaDepartments?: DepartmentConvergencia[];
  /** Alertas de género del LLM org-level. El rollup las mappea per-gerencia
   *  por `parentDepartmentName` (no-standalone) o `departmentName` (standalone). */
  alertasGenero?: Array<{
    departmentName: string;
    parentDepartmentName: string | null;
    evidenciaGenero: string;
    analisisGenero: string;
    contextoGenero: string;
  }>;
}): ComplianceReportResponse {
  // Construimos solo los paths que el util documenta leer (spec §2). El
  // resto del shape se completa con valores irrelevantes y se castea por
  // unknown — los tests cubren contrato del util, no del wire completo.
  const report = {
    success: true as const,
    type: 'executive' as const,
    generatedAt: '2026-05-30T00:00:00Z',
    campaign: {
      id: 'c1',
      name: 'test',
      startDate: '2026-01-01',
      endDate: '2026-02-01',
      completedAt: '2026-02-01',
    },
    company: { name: 'Test Co' },
    narratives: {
      alertasGenero: opts.alertasGenero ?? [],
    },
    data: {
      orgSafetyScore: null,
      orgISA: null,
      isaComponents: null,
      totalTextResponses: null,
      totalRespondents: null,
      coverage: {
        totalDeptos: 0,
        deptosConVoz: 0,
        pctCobertura: 0,
        rama: 'C',
        // coverage.silencioConVozExterna usa OTRA shape (CoverageAnalysisService).
        // El util no lee acá — lee de data.data.silencioVozExterna (top-level).
        silencioConVozExterna: [],
        participacionAnomala: [],
        deptosCobertura: opts.deptosCobertura ?? [],
        avgExoParticipantes: null,
        avgExoNoParticipantes: null,
        avgEisParticipantes: null,
        avgEisNoParticipantes: null,
      },
      departments: opts.departments ?? [],
      skippedByPrivacy: [],
      metaAnalysis: null,
      convergencia: {
        activeSources: [],
        departments: opts.convergenciaDepartments ?? [],
        criticalByManager: [],
      },
      alerts: [],
      silencioVozExterna: opts.silencioVozExterna,
      riskScores: opts.riskScores,
    },
    legalNotice: '',
  };
  return report as unknown as ComplianceReportResponse;
}

// ═══════════════════════════════════════════════════════════════════
// CASE 1 — Payload vacío
// ═══════════════════════════════════════════════════════════════════

test('1. riskScores === undefined → []', () => {
  const report = makeReport({});
  assert.deepEqual(buildGerenciaRollup(report), []);
});

test('1b. riskScores === [] → []', () => {
  const report = makeReport({ riskScores: [] });
  assert.deepEqual(buildGerenciaRollup(report), []);
});

// ═══════════════════════════════════════════════════════════════════
// CASE 2 — 1 gerencia, 3 hijos con_isa: ISA weighted + silencio correctos
// ═══════════════════════════════════════════════════════════════════

test('2. 1 gerencia con 3 hijos: ISA ponderado + silencio + max risk', () => {
  const parentId = 'gA';
  const parentName = 'Gerencia A';
  const riskScores: DepartmentRiskScore[] = [
    mkRiskScore({
      departmentId: 'd1',
      parentGerenciaId: parentId,
      parentGerenciaName: parentName,
      score: 30,
    }),
    mkRiskScore({
      departmentId: 'd2',
      parentGerenciaId: parentId,
      parentGerenciaName: parentName,
      score: 60,
    }),
    mkRiskScore({
      departmentId: 'd3',
      parentGerenciaId: parentId,
      parentGerenciaName: parentName,
      score: 10,
    }),
  ];
  const departments: ComplianceReportDepartment[] = [
    mkDept({ departmentId: 'd1', isaScore: 60, respondentCount: 10 }),
    mkDept({ departmentId: 'd2', isaScore: 80, respondentCount: 20 }),
    mkDept({ departmentId: 'd3', isaScore: 40, respondentCount: 5 }),
  ];
  const deptosCobertura: CoverageDeptItem[] = [
    mkCoverage({
      departmentId: 'd1',
      invited: 12,
      responded: 10,
      empleadosActivos: 15,
    }),
    mkCoverage({
      departmentId: 'd2',
      invited: 22,
      responded: 20,
      empleadosActivos: 25,
    }),
    mkCoverage({
      departmentId: 'd3',
      invited: 6,
      responded: 5,
      empleadosActivos: 8,
    }),
  ];
  const report = makeReport({ riskScores, departments, deptosCobertura });
  const rollups = buildGerenciaRollup(report);

  assert.equal(rollups.length, 1);
  const r = rollups[0];
  assert.equal(r.groupId, parentId);
  assert.equal(r.groupName, parentName);
  assert.equal(r.standalone, false);
  assert.equal(r.totalChildren, 3);

  // ISA: (60·10 + 80·20 + 40·5) / 35 = 2400 / 35
  assert.notEqual(r.isa.weighted, null);
  assert.ok(Math.abs((r.isa.weighted as number) - 2400 / 35) < 1e-9);
  assert.equal(r.isa.min, 40);
  assert.equal(r.isa.max, 80);
  assert.equal(r.isa.deptosConIsa, 3);

  // Silencio
  assert.equal(r.silencio.invited, 40);
  assert.equal(r.silencio.responded, 35);
  assert.equal(r.silencio.empleadosActivos, 48);
  assert.ok(
    Math.abs((r.silencio.participationRate as number) - 35 / 40) < 1e-9,
  );
  assert.ok(
    Math.abs((r.silencio.coverageRate as number) - 40 / 48) < 1e-9,
  );

  // Riesgo: max es d2 con score 60
  assert.equal(r.riesgo.maxScore, 60);
  assert.equal(r.riesgo.worstDept?.departmentId, 'd2');
});

// ═══════════════════════════════════════════════════════════════════
// CASE 3 — denuncias_12m null en todos → count: null (no afirmar 0)
// ═══════════════════════════════════════════════════════════════════

test('3. denuncias_12m null en todos → count: null (no cargada)', () => {
  const riskScores: DepartmentRiskScore[] = [
    mkRiskScore({
      departmentId: 'd1',
      parentGerenciaId: 'gA',
      parentGerenciaName: 'A',
      inputs: { participacion: null, pesoAlertas: 0, denuncias_12m: null },
    }),
    mkRiskScore({
      departmentId: 'd2',
      parentGerenciaId: 'gA',
      parentGerenciaName: 'A',
      inputs: { participacion: null, pesoAlertas: 0, denuncias_12m: null },
    }),
  ];
  const report = makeReport({ riskScores });
  const r = buildGerenciaRollup(report)[0];

  assert.equal(r.denuncias.count, null);
  assert.equal(r.denuncias.deptosConDatoCargado, 0);
  assert.equal(r.denuncias.deptosSinDatoCargado, 2);
  assert.equal(r.denuncias.deptosConDenuncia, 0);
});

// ═══════════════════════════════════════════════════════════════════
// CASE 4 — denuncias 0 + 0 → count: 0 afirmable (sí se cargó la métrica)
// ═══════════════════════════════════════════════════════════════════

test('4. denuncias_12m 0 + 0 → count: 0 afirmable, 2 deptos con dato', () => {
  const riskScores: DepartmentRiskScore[] = [
    mkRiskScore({
      departmentId: 'd1',
      parentGerenciaId: 'gA',
      parentGerenciaName: 'A',
      inputs: { participacion: null, pesoAlertas: 0, denuncias_12m: 0 },
    }),
    mkRiskScore({
      departmentId: 'd2',
      parentGerenciaId: 'gA',
      parentGerenciaName: 'A',
      inputs: { participacion: null, pesoAlertas: 0, denuncias_12m: 0 },
    }),
  ];
  const report = makeReport({ riskScores });
  const r = buildGerenciaRollup(report)[0];

  assert.equal(r.denuncias.count, 0);
  assert.equal(r.denuncias.deptosConDatoCargado, 2);
  assert.equal(r.denuncias.deptosSinDatoCargado, 0);
  assert.equal(r.denuncias.deptosConDenuncia, 0);
});

// ═══════════════════════════════════════════════════════════════════
// CASE 5 — denuncias mixto (1 con dato + 1 sin dato)
// ═══════════════════════════════════════════════════════════════════

test('5. denuncias mixto: 1 con 2, 1 con null → count: 2, 1 sin dato', () => {
  const riskScores: DepartmentRiskScore[] = [
    mkRiskScore({
      departmentId: 'd1',
      parentGerenciaId: 'gA',
      parentGerenciaName: 'A',
      inputs: { participacion: null, pesoAlertas: 0, denuncias_12m: 2 },
    }),
    mkRiskScore({
      departmentId: 'd2',
      parentGerenciaId: 'gA',
      parentGerenciaName: 'A',
      inputs: { participacion: null, pesoAlertas: 0, denuncias_12m: null },
    }),
  ];
  const report = makeReport({ riskScores });
  const r = buildGerenciaRollup(report)[0];

  assert.equal(r.denuncias.count, 2);
  assert.equal(r.denuncias.deptosConDatoCargado, 1);
  assert.equal(r.denuncias.deptosSinDatoCargado, 1);
  assert.equal(r.denuncias.deptosConDenuncia, 1);
});

// ═══════════════════════════════════════════════════════════════════
// CASE 6 — Standalone dept (sin parentGerenciaId)
// ═══════════════════════════════════════════════════════════════════

test('6. dept con parentGerenciaId null → standalone: true', () => {
  const riskScores: DepartmentRiskScore[] = [
    mkRiskScore({
      departmentId: 'd-solo',
      departmentName: 'Dept Solo',
      parentGerenciaId: null,
      parentGerenciaName: null,
    }),
  ];
  const report = makeReport({ riskScores });
  const rollups = buildGerenciaRollup(report);

  assert.equal(rollups.length, 1);
  assert.equal(rollups[0].standalone, true);
  assert.ok(rollups[0].groupId.startsWith('__dept__:'));
  assert.equal(rollups[0].groupName, 'Dept Solo');
  assert.equal(rollups[0].totalChildren, 1);
});

test('6b. dept con parentGerenciaId undefined (legacy) → standalone: true', () => {
  const riskScores: DepartmentRiskScore[] = [
    mkRiskScore({ departmentId: 'd-legacy', departmentName: 'Legacy Dept' }),
  ];
  const report = makeReport({ riskScores });
  const rollups = buildGerenciaRollup(report);

  assert.equal(rollups[0].standalone, true);
});

// ═══════════════════════════════════════════════════════════════════
// CASE 7 — Teatro: presente / ausente (null ≠ false)
// ═══════════════════════════════════════════════════════════════════

test('7a. teatro: 1 hijo true + 1 hijo false → anyTeatro: true', () => {
  const riskScores: DepartmentRiskScore[] = [
    mkRiskScore({
      departmentId: 'd1',
      parentGerenciaId: 'gA',
      parentGerenciaName: 'A',
    }),
    mkRiskScore({
      departmentId: 'd2',
      parentGerenciaId: 'gA',
      parentGerenciaName: 'A',
    }),
  ];
  const departments: ComplianceReportDepartment[] = [
    mkDept({ departmentId: 'd1', teatroCumplimiento: true }),
    mkDept({ departmentId: 'd2', teatroCumplimiento: false }),
  ];
  const report = makeReport({ riskScores, departments });
  const r = buildGerenciaRollup(report)[0];

  assert.equal(r.teatro.anyTeatro, true);
  assert.equal(r.teatro.deptosConTeatro, 1);
  assert.equal(r.teatro.deptosConFlagPresente, 2);
});

test('7b. teatro: ningún hijo trae el campo → anyTeatro: null', () => {
  const riskScores: DepartmentRiskScore[] = [
    mkRiskScore({
      departmentId: 'd1',
      parentGerenciaId: 'gA',
      parentGerenciaName: 'A',
    }),
    mkRiskScore({
      departmentId: 'd2',
      parentGerenciaId: 'gA',
      parentGerenciaName: 'A',
    }),
  ];
  const departments: ComplianceReportDepartment[] = [
    mkDept({ departmentId: 'd1' }), // sin teatroCumplimiento
    mkDept({ departmentId: 'd2' }),
  ];
  const report = makeReport({ riskScores, departments });
  const r = buildGerenciaRollup(report)[0];

  assert.equal(r.teatro.anyTeatro, null);
  assert.equal(r.teatro.deptosConTeatro, 0);
  assert.equal(r.teatro.deptosConFlagPresente, 0);
});

// ═══════════════════════════════════════════════════════════════════
// CASE 8 — Silencio total: gerencia entera no invitada
//   participationRate: null (NO 0% — "nadie invitado" ≠ "0% participó")
//   coverageRate: 0 (sí hay empleados, ninguno invitado — afirmable)
// ═══════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════
// CASE 9 — deptosEnRiesgo: cuenta hijos con riskLevel risk|critical
// ═══════════════════════════════════════════════════════════════════

test('9. deptosEnRiesgo: cuenta hijos en risk/critical, ignora safe y missing', () => {
  const riskScores: DepartmentRiskScore[] = [
    mkRiskScore({
      departmentId: 'd1', parentGerenciaId: 'gA', parentGerenciaName: 'A',
    }),
    mkRiskScore({
      departmentId: 'd2', parentGerenciaId: 'gA', parentGerenciaName: 'A',
    }),
    mkRiskScore({
      departmentId: 'd3', parentGerenciaId: 'gA', parentGerenciaName: 'A',
    }),
    mkRiskScore({
      departmentId: 'd4', parentGerenciaId: 'gA', parentGerenciaName: 'A',
    }),
  ];
  const departments: ComplianceReportDepartment[] = [
    mkDept({ departmentId: 'd1', riskLevel: 'safe' }),
    mkDept({ departmentId: 'd2', riskLevel: 'risk' }),
    mkDept({ departmentId: 'd3', riskLevel: 'critical' }),
    // d4 sin entry en departments → undefined dept en rollup, no cuenta
  ];
  const report = makeReport({ riskScores, departments });
  const r = buildGerenciaRollup(report)[0];

  assert.equal(r.deptosEnRiesgo, 2);
});

// ═══════════════════════════════════════════════════════════════════
// CASE 10 — genero: matches por parentDepartmentName (non-standalone)
//            o por departmentName (standalone)
// ═══════════════════════════════════════════════════════════════════

test('10. genero non-standalone: match por parentDepartmentName + cita literal', () => {
  const riskScores: DepartmentRiskScore[] = [
    mkRiskScore({
      departmentId: 'd1',
      parentGerenciaId: 'gA',
      parentGerenciaName: 'Gerencia A',
    }),
  ];
  const report = makeReport({
    riskScores,
    alertasGenero: [
      {
        departmentName: 'd1-name',
        parentDepartmentName: 'Gerencia A',
        evidenciaGenero: 'no deberían hablar de las chiquillas',
        analisisGenero: 'analisis...',
        contextoGenero: 'analisis...',
      },
    ],
  });
  const r = buildGerenciaRollup(report)[0];

  assert.equal(r.genero.hasAlerta, true);
  assert.equal(r.genero.evidenciaGenero, 'no deberían hablar de las chiquillas');
});

test('10b. genero standalone: match por departmentName cuando no hay parent', () => {
  const riskScores: DepartmentRiskScore[] = [
    mkRiskScore({
      departmentId: 'd-solo',
      departmentName: 'Dept Solo',
      parentGerenciaId: null,
      parentGerenciaName: null,
    }),
  ];
  const report = makeReport({
    riskScores,
    alertasGenero: [
      {
        departmentName: 'Dept Solo',
        parentDepartmentName: null,
        evidenciaGenero: 'cita',
        analisisGenero: 'a',
        contextoGenero: 'a',
      },
    ],
  });
  const r = buildGerenciaRollup(report)[0];

  assert.equal(r.standalone, true);
  assert.equal(r.genero.hasAlerta, true);
  assert.equal(r.genero.evidenciaGenero, 'cita');
});

test('10c. genero sin alerta → hasAlerta: false, evidenciaGenero: null', () => {
  const riskScores: DepartmentRiskScore[] = [
    mkRiskScore({
      departmentId: 'd1',
      parentGerenciaId: 'gA',
      parentGerenciaName: 'A',
    }),
  ];
  const report = makeReport({ riskScores }); // sin alertasGenero
  const r = buildGerenciaRollup(report)[0];

  assert.equal(r.genero.hasAlerta, false);
  assert.equal(r.genero.evidenciaGenero, null);
});

// ═══════════════════════════════════════════════════════════════════
// CASE 11 — leyKarin: filtra alertas exit con alertType ∈ ley_karin*
// ═══════════════════════════════════════════════════════════════════

test('11. leyKarin: suma alertas exit con alertType ley_karin/ley_karin_indicios', () => {
  const riskScores: DepartmentRiskScore[] = [
    mkRiskScore({
      departmentId: 'd1',
      parentGerenciaId: 'gA',
      parentGerenciaName: 'A',
      alertas: [
        { alertType: 'ley_karin', producto: 'exit', pesoEfectivo: 3 },
        { alertType: 'ley_karin_indicios', producto: 'exit', pesoEfectivo: 2 },
        { alertType: 'nps_critico', producto: 'exit', pesoEfectivo: 1 }, // NO cuenta
        { alertType: 'ley_karin', producto: 'onboarding', pesoEfectivo: 1 }, // NO (producto onboarding)
      ],
    }),
    mkRiskScore({
      departmentId: 'd2',
      parentGerenciaId: 'gA',
      parentGerenciaName: 'A',
      alertas: [
        { alertType: 'ley_karin', producto: 'exit', pesoEfectivo: 3 },
      ],
    }),
    mkRiskScore({
      departmentId: 'd3',
      parentGerenciaId: 'gA',
      parentGerenciaName: 'A',
      alertas: [], // sin alertas
    }),
  ];
  const report = makeReport({ riskScores });
  const r = buildGerenciaRollup(report)[0];

  // d1: 2 (ley_karin + ley_karin_indicios exit), d2: 1, d3: 0
  assert.equal(r.leyKarin.signalsCount, 3);
  assert.equal(r.leyKarin.deptosConSenal, 2); // d1 y d2
});

test('11b. leyKarin sin señales → signalsCount: 0', () => {
  const riskScores: DepartmentRiskScore[] = [
    mkRiskScore({
      departmentId: 'd1',
      parentGerenciaId: 'gA',
      parentGerenciaName: 'A',
      alertas: [
        { alertType: 'nps_critico', producto: 'exit', pesoEfectivo: 1 },
      ],
    }),
  ];
  const report = makeReport({ riskScores });
  const r = buildGerenciaRollup(report)[0];
  assert.equal(r.leyKarin.signalsCount, 0);
  assert.equal(r.leyKarin.deptosConSenal, 0);
});

test('8. gerencia entera no invitada → participationRate: null', () => {
  const riskScores: DepartmentRiskScore[] = [
    mkRiskScore({
      departmentId: 'd1',
      parentGerenciaId: 'gA',
      parentGerenciaName: 'A',
      bucket: 'no_invitado',
    }),
    mkRiskScore({
      departmentId: 'd2',
      parentGerenciaId: 'gA',
      parentGerenciaName: 'A',
      bucket: 'no_invitado',
    }),
  ];
  const deptosCobertura: CoverageDeptItem[] = [
    mkCoverage({
      departmentId: 'd1',
      invited: 0,
      responded: 0,
      empleadosActivos: 10,
    }),
    mkCoverage({
      departmentId: 'd2',
      invited: 0,
      responded: 0,
      empleadosActivos: 7,
    }),
  ];
  const report = makeReport({ riskScores, deptosCobertura });
  const r = buildGerenciaRollup(report)[0];

  assert.equal(r.silencio.invited, 0);
  assert.equal(r.silencio.responded, 0);
  assert.equal(r.silencio.empleadosActivos, 17);
  assert.equal(r.silencio.participationRate, null);
  // coverageRate: 0/17 → 0 (no null porque empleadosActivos > 0)
  assert.equal(r.silencio.coverageRate, 0);
  assert.equal(r.silencio.deptosNoInvitados, 2);
});
