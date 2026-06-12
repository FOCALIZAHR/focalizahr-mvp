// ═══════════════════════════════════════════════════════════════════
// buildTriageGroups — tests (node:test + node:assert/strict)
// src/lib/services/compliance/buildTriageGroups.test.ts
// ═══════════════════════════════════════════════════════════════════
// Run:
//   npx tsx --test src/lib/services/compliance/buildTriageGroups.test.ts
//
// Oráculos VERBATIM:
//   A. Intro conectora APROBADA (caso real cmob0e56: pct=20, conVoz=2, total=6).
//   B. Drift-guard: el singular del resolver == el verbatim sobre el que se
//      construyeron las adaptaciones plurales (si el dictionary cambia, falla).
//   C. Fixture sintético que reproduce la topología del caso real:
//      - HUMO/A-legal (merge de ancestro → "vía" suprimido)
//      - HUMO/B (hijo genuino → "vía" emitido)
//      - PUNTO_CIEGO ×2 (plural + omisión de "señales 0" + vía mixto)
//      - orden editorial, links, hero, extremos guard.
// ═══════════════════════════════════════════════════════════════════

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  buildTriageGroups,
  buildTriageIntro,
  triageInstanceLine,
  triageInstanceName,
  triageFactoredKicker,
  buildTriageExtremosLine,
} from './buildTriageGroups';
import {
  resolveDepartmentRiskNarrative,
  type DepartmentRiskNarrativeState,
} from './DepartmentRiskNarrativeDictionary';
import type {
  ComplianceReportResponse,
  DepartmentRiskScore,
  DepartmentRiskAlertItem,
} from '@/types/compliance';
import type { CoverageDeptItem } from '@/lib/services/compliance/CoverageAnalysisService';

// ═══════════════════════════════════════════════════════════════════
// FACTORIES
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

function mkCoverage(
  opts: Partial<CoverageDeptItem> & { departmentId: string },
): CoverageDeptItem {
  return {
    departmentId: opts.departmentId,
    departmentName: opts.departmentName ?? `name-${opts.departmentId}`,
    empleadosActivos: opts.empleadosActivos ?? 0,
    invited: opts.invited ?? 0,
    responded: opts.responded ?? 0,
    participationRate: opts.participationRate ?? null,
    analyzed: opts.analyzed ?? 'not_invited',
    exoScore: opts.exoScore ?? null,
    eisScore: opts.eisScore ?? null,
    externalAlertCount: opts.externalAlertCount ?? 0,
  };
}

function makeReport(opts: {
  riskScores: DepartmentRiskScore[];
  deptosCobertura?: CoverageDeptItem[];
  pctCobertura?: number;
  silencioVozExterna?: Array<{
    departmentId: string | null;
    departmentName: string | null;
    narrativa: string;
    signalsCount: number;
  }>;
  otroMundo?: Array<{
    departmentId: string;
    departmentName: string;
    signalsCount: number;
  }>;
}): ComplianceReportResponse {
  const report = {
    success: true,
    type: 'executive',
    company: { name: 'Test Co', country: 'CL' },
    narratives: { alertasGenero: [] },
    data: {
      orgISA: null,
      coverage: {
        totalDeptos: 0,
        deptosConVoz: 0,
        pctCobertura: opts.pctCobertura ?? 0,
        silencioConVozExterna: [],
        participacionAnomala: [],
        deptosCobertura: opts.deptosCobertura ?? [],
      },
      departments: [],
      convergencia: { departments: [] },
      silencioVozExterna: opts.silencioVozExterna ?? [],
      otroMundo: opts.otroMundo ?? [],
      riskScores: opts.riskScores,
    },
  };
  return report as unknown as ComplianceReportResponse;
}

const onbAlert: DepartmentRiskAlertItem = {
  alertType: 'onboarding_friction',
  producto: 'onboarding',
  pesoEfectivo: 4,
};
const karinAlert: DepartmentRiskAlertItem = {
  alertType: 'ley_karin',
  producto: 'exit',
  pesoEfectivo: 3,
};

// ═══════════════════════════════════════════════════════════════════
// A — INTRO CONECTORA APROBADA (caso real)
// ═══════════════════════════════════════════════════════════════════

test('A. intro conectora — verbatim caso real (20% · 2 de 6 · otras 4)', () => {
  assert.equal(
    buildTriageIntro(20, 2, 6, 4),
    'El 20% que respondió se concentra en 2 de las 6 gerencias. ' +
      'En las otras 4 el índice no llega — y ahí, las señales externas son la única lectura disponible.',
  );
});

// ═══════════════════════════════════════════════════════════════════
// B — DRIFT GUARD: singular del resolver == base de las adaptaciones plurales
// ═══════════════════════════════════════════════════════════════════

test('B. drift-guard: lecturas singulares verbatim del dictionary no cambiaron', () => {
  // FUEGO ([Área] sustituido por departmentName)
  const fuego = resolveDepartmentRiskNarrative(
    mkRiskScore({
      departmentId: 'f',
      departmentName: 'Comercial',
      inputs: { participacion: null, pesoAlertas: 0, denuncias_12m: 2 },
    }),
  );
  assert.equal(
    fuego?.narrativa,
    'El riesgo en esta área ya no es algo por anticipar: una denuncia formal por Ley Karin fijó el nivel al máximo e invalidó la lectura oficial. El sistema entero existe para evitar llegar acá — en Comercial el límite ya se cruzó.',
  );

  // HUMO A-legal
  const aLegal = resolveDepartmentRiskNarrative(
    mkRiskScore({
      departmentId: 'al',
      bucket: 'sub_threshold',
      inputs: { participacion: null, pesoAlertas: 3, denuncias_12m: null },
      alertas: [karinAlert],
    }),
  );
  assert.equal(
    aLegal?.narrativa,
    'El equipo guarda silencio masivo en los canales oficiales, pero quien se fue dejó una señal de Ley Karin. Esto no es rotación: es un riesgo jurídico en formación, del tipo que suele preceder a una denuncia formal. Actuar sobre la señal ahora es lo que separa la prevención de un pasivo legal activo.',
  );

  // HUMO B (onboarding domina)
  const humoB = resolveDepartmentRiskNarrative(
    mkRiskScore({
      departmentId: 'b',
      bucket: 'sub_threshold',
      inputs: { participacion: null, pesoAlertas: 4, denuncias_12m: null },
      alertas: [onbAlert],
    }),
  );
  assert.equal(
    humoB?.narrativa,
    'El núcleo del equipo no reporta, pero el talento nuevo detecta fricción en sus primeros 90 días. Cuando el rechazo cultural ocurre en la fase de entrada, no es un problema de adaptación individual; es una falla estructural en el ciclo de vida del área.',
  );

  // PUNTO CIEGO
  const pc = resolveDepartmentRiskNarrative(
    mkRiskScore({
      departmentId: 'pc',
      bucket: 'sub_threshold',
      inputs: { participacion: null, pesoAlertas: 0, denuncias_12m: null },
    }),
  );
  assert.equal(
    pc?.narrativa,
    'Ceguera operativa. El equipo no participó en la medición interna y no registra señales de alerta externas. No asumas que existe una crisis oculta, pero ten en cuenta que en esta área estás gestionando sin radar.',
  );
});

// ═══════════════════════════════════════════════════════════════════
// D — FIXTURE SINTÉTICO (topología del caso real)
// ═══════════════════════════════════════════════════════════════════

/** Reproduce: Comercial (merge ancestro, A-legal), Personas (hijo, B),
 *  Finanzas + Operaciones (PUNTO_CIEGO ×2). */
function realLikeReport(extras?: {
  silencioVozExterna?: Array<{
    departmentId: string | null;
    departmentName: string | null;
    narrativa: string;
    signalsCount: number;
  }>;
  otroMundo?: Array<{
    departmentId: string;
    departmentName: string;
    signalsCount: number;
  }>;
}): ComplianceReportResponse {
  const riskScores: DepartmentRiskScore[] = [
    // ── Gerencia Comercial: ancestro invitado directo (A-legal, 75) + hijo PC.
    mkRiskScore({
      departmentId: 'com',
      departmentName: 'Gerencia Comercial',
      score: 75,
      bucket: 'sub_threshold',
      drivers: { confiabilidad: 50, voz_externa: 25, piso_denuncia: 0 },
      inputs: { participacion: null, pesoAlertas: 3, denuncias_12m: null },
      alertas: [karinAlert],
      parentGerenciaId: null, // level-2 invitada directa
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
    // ── GERENCIA DE PERSONAS: gerencia con 2 hijos, worst = Cultura y DO (B, 85).
    mkRiskScore({
      departmentId: 'per-c1',
      departmentName: 'Subgerencia de Cultura y DO',
      score: 85,
      bucket: 'sub_threshold',
      drivers: { confiabilidad: 50, voz_externa: 35, piso_denuncia: 0 },
      inputs: { participacion: null, pesoAlertas: 4, denuncias_12m: null },
      alertas: [onbAlert],
      parentGerenciaId: 'per',
      parentGerenciaName: 'GERENCIA DE PERSONAS',
    }),
    mkRiskScore({
      departmentId: 'per-c2',
      departmentName: 'Compensaciones',
      score: 30,
      bucket: 'sub_threshold',
      drivers: { confiabilidad: 30, voz_externa: 0, piso_denuncia: 0 },
      parentGerenciaId: 'per',
      parentGerenciaName: 'GERENCIA DE PERSONAS',
    }),
    // ── Gerencia de Finanzas: standalone PUNTO_CIEGO (sin vía).
    mkRiskScore({
      departmentId: 'fin',
      departmentName: 'Gerencia de Finanzas',
      score: 50,
      bucket: 'sub_threshold',
      drivers: { confiabilidad: 50, voz_externa: 0, piso_denuncia: 0 },
      parentGerenciaId: null,
    }),
    // ── Gerencia de Operaciones: 2 hijos PUNTO_CIEGO, worst = Seguridad (vía).
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
      departmentId: 'ops-c2',
      departmentName: 'Logística',
      score: 30,
      bucket: 'sub_threshold',
      drivers: { confiabilidad: 30, voz_externa: 0, piso_denuncia: 0 },
      parentGerenciaId: 'ops',
      parentGerenciaName: 'Gerencia de Operaciones',
    }),
  ];
  // Cobertura: solo Comercial y Personas tienen respondedores (conVoz=2).
  const deptosCobertura: CoverageDeptItem[] = [
    mkCoverage({ departmentId: 'com', invited: 10, responded: 4 }),
    mkCoverage({ departmentId: 'per-c1', invited: 10, responded: 6 }),
    mkCoverage({ departmentId: 'com-c1', invited: 8, responded: 0 }),
    mkCoverage({ departmentId: 'per-c2', invited: 6, responded: 0 }),
    mkCoverage({ departmentId: 'fin', invited: 6, responded: 0 }),
    mkCoverage({ departmentId: 'ops-seg', invited: 5, responded: 0 }),
    mkCoverage({ departmentId: 'ops-c2', invited: 5, responded: 0 }),
  ];
  return makeReport({
    riskScores,
    deptosCobertura,
    pctCobertura: 18,
    silencioVozExterna: extras?.silencioVozExterna,
    otroMundo: extras?.otroMundo,
  });
}

test('D1. grupos por lectura — orden editorial + counts', () => {
  const acto = buildTriageGroups(realLikeReport());
  assert.deepEqual(
    acto.groups.map((g) => g.key),
    ['HUMO/A-legal', 'HUMO/B', 'PUNTO_CIEGO'],
  );
  assert.deepEqual(acto.counts, { fuego: 0, humo: 2, puntoCiego: 2, confiable: 0 });
});

test('D2. HUMO/A-legal — merge de ancestro suprime "vía" + narrativa singular', () => {
  const g = buildTriageGroups(realLikeReport()).groups.find(
    (x) => x.key === 'HUMO/A-legal',
  )!;
  assert.equal(g.kicker, 'EN HUMO · Señal legal tras el silencio');
  assert.equal(g.count, 1);
  assert.equal(g.homogeneous, false); // count 1 → no factoriza
  assert.equal(
    triageInstanceLine(g.instances[0]),
    'Gerencia Comercial · riesgo 75 de 100',
  );
  assert.equal(g.instances[0].viaWorstDept, null);
  assert.equal(
    g.narrativa,
    'El equipo guarda silencio masivo en los canales oficiales, pero quien se fue dejó una señal de Ley Karin. Esto no es rotación: es un riesgo jurídico en formación, del tipo que suele preceder a una denuncia formal. Actuar sobre la señal ahora es lo que separa la prevención de un pasivo legal activo.',
  );
  assert.equal(g.link, 'Ver departamentos →');
});

test('D3. HUMO/B — hijo genuino emite "vía" + narrativa singular', () => {
  const g = buildTriageGroups(realLikeReport()).groups.find(
    (x) => x.key === 'HUMO/B',
  )!;
  assert.equal(g.kicker, 'EN HUMO · Fricción en la entrada');
  assert.equal(
    triageInstanceLine(g.instances[0]),
    'GERENCIA DE PERSONAS · riesgo 85 de 100 — el foco: Subgerencia de Cultura y DO',
  );
  assert.equal(g.instances[0].viaWorstDept, 'Subgerencia de Cultura y DO');
});

test('D4. PUNTO_CIEGO — homogéneo (mismo score) factoriza + línea corrida', () => {
  const g = buildTriageGroups(realLikeReport()).groups.find(
    (x) => x.key === 'PUNTO_CIEGO',
  )!;
  assert.equal(g.count, 2);
  assert.equal(g.kicker, 'PUNTO CIEGO · Gestión sin radar');
  // Ambos score 50 → homogéneo: el número se factoriza al kicker (§2).
  assert.equal(g.homogeneous, true);
  assert.equal(g.sharedScore, 50);
  assert.equal(
    triageFactoredKicker(g),
    'PUNTO CIEGO · Gestión sin radar · 2 gerencias · riesgo 50 de 100 cada una',
  );
  // Instancias = solo nombres, con (foco: …) cuando aplique. Orden alfabético.
  assert.deepEqual(
    g.instances.map((i) => triageInstanceName(i)),
    ['Gerencia de Finanzas', 'Gerencia de Operaciones (foco: Seguridad)'],
  );
  // Narrativa PLURAL (count>1) — adaptación gramatical aprobada.
  assert.equal(
    g.narrativa,
    'Ceguera operativa. Estos equipos no participaron en la medición interna y no registran señales de alerta externas. No asumas que existe una crisis oculta, pero ten en cuenta que en estas áreas estás gestionando sin radar.',
  );
  assert.equal(g.link, 'Ver las 2 y sus departamentos →');
});

test('D4b. PUNTO_CIEGO — scores distintos → NO factoriza (líneas normales)', () => {
  // Operaciones worst sube a 60 → scores difieren (Finanzas 50 vs Operaciones 60).
  const base = realLikeReport();
  const rs = base.data.riskScores!;
  const seg = rs.find((r) => r.departmentId === 'ops-seg')!;
  seg.score = 60;
  const g = buildTriageGroups(base).groups.find((x) => x.key === 'PUNTO_CIEGO')!;
  assert.equal(g.homogeneous, false);
  assert.equal(g.sharedScore, null);
  // Orden por score desc: Operaciones (60) antes que Finanzas (50).
  assert.deepEqual(
    g.instances.map((i) => triageInstanceLine(i)),
    [
      'Gerencia de Operaciones · riesgo 60 de 100 — el foco: Seguridad',
      'Gerencia de Finanzas · riesgo 50 de 100',
    ],
  );
});

test('D5. hero + intro + extremos guard', () => {
  const acto = buildTriageGroups(realLikeReport());
  assert.equal(acto.hero.number, '82%');
  assert.equal(acto.hero.label, 'del mapa de gerencias, sin voz medible');
  assert.equal(acto.hero.sub, '2 en humo · 2 punto ciego');
  // conVoz=2 (Comercial+Personas), total=4 gerencias (Comercial, Personas,
  // Finanzas, Operaciones), mudas=2; pct = 10/50 = 20%.
  assert.equal(
    acto.intro,
    buildTriageIntro(20, 2, 4, 2),
  );
  // Todas sub_threshold (sin ISA) → extremos no se emite.
  assert.equal(acto.extremosLine, null);
});

test('D6. extremos — se emite con ≥3 gerencias con ISA y mejor≠peor', () => {
  // 3 gerencias standalone con_isa (isaScore vía departments).
  const riskScores: DepartmentRiskScore[] = [
    mkRiskScore({ departmentId: 'a', departmentName: 'Gerencia A', bucket: 'con_isa', parentGerenciaId: null }),
    mkRiskScore({ departmentId: 'b', departmentName: 'Gerencia B', bucket: 'con_isa', parentGerenciaId: null }),
    mkRiskScore({ departmentId: 'c', departmentName: 'Gerencia C', bucket: 'con_isa', parentGerenciaId: null }),
  ];
  const report = makeReport({ riskScores });
  // Inyectar departments con isaScore para que isa.weighted != null.
  (report.data as any).departments = [
    { departmentId: 'a', isaScore: 90, respondentCount: 10 },
    { departmentId: 'b', isaScore: 60, respondentCount: 10 },
    { departmentId: 'c', isaScore: 75, respondentCount: 10 },
  ];
  const acto = buildTriageGroups(report);
  assert.equal(
    acto.extremosLine,
    'El ambiente no es parejo: Gerencia A es el área más sólida (ISA 90) y Gerencia B la más frágil (ISA 60).',
  );
});

test('D8. Sexta / OTRO MUNDO — dedupe contra entidades nombradas en grupos', () => {
  const acto = buildTriageGroups(
    realLikeReport({
      silencioVozExterna: [
        // 'com' = gerencia HUMO/A-legal (nombrada) → fuera.
        { departmentId: 'com', departmentName: 'Gerencia Comercial', narrativa: 'x', signalsCount: 1 },
        // 'per-c1' = vía de GERENCIA DE PERSONAS (nombrada) → fuera.
        { departmentId: 'per-c1', departmentName: 'Subgerencia de Cultura y DO', narrativa: 'y', signalsCount: 1 },
        // 'per' = gerencia (nombrada por groupId) → fuera.
        { departmentId: 'per', departmentName: 'GERENCIA DE PERSONAS', narrativa: 'z', signalsCount: 1 },
        // 'ghost' = no nombrada → SE QUEDA.
        { departmentId: 'ghost', departmentName: 'Área Fantasma', narrativa: 'w', signalsCount: 2 },
      ],
      otroMundo: [
        // 'ops-seg' = vía de Operaciones (nombrada) → fuera.
        { departmentId: 'ops-seg', departmentName: 'Seguridad', signalsCount: 1 },
        // 'nm-1' = no invitada, no nombrada → SE QUEDA.
        { departmentId: 'nm-1', departmentName: 'Sucursal Sur', signalsCount: 3 },
      ],
    }),
  );
  assert.deepEqual(
    acto.sexta.map((s) => s.departmentId),
    ['ghost'],
  );
  assert.deepEqual(
    acto.otroMundo.map((o) => o.departmentId),
    ['nm-1'],
  );
});

test('D9. caso real — ambas entidades de Sexta nombradas → bandas vacías', () => {
  // Espejo del caso real cmob0e56: Sexta = {Comercial, Subgerencia Cultura y DO},
  // ambas nombradas en grupos → Sexta queda vacía. OTRO MUNDO sin items.
  const acto = buildTriageGroups(
    realLikeReport({
      silencioVozExterna: [
        { departmentId: 'com', departmentName: 'Gerencia Comercial', narrativa: 'x', signalsCount: 1 },
        { departmentId: 'per-c1', departmentName: 'Subgerencia de Cultura y DO', narrativa: 'y', signalsCount: 1 },
      ],
    }),
  );
  assert.equal(acto.sexta.length, 0);
  assert.equal(acto.otroMundo.length, 0);
});

test('D7. buildTriageExtremosLine — <3 con ISA → null', () => {
  const rollups = [
    { groupId: 'a', groupName: 'A', isa: { weighted: 90 } },
    { groupId: 'b', groupName: 'B', isa: { weighted: 60 } },
  ] as any;
  assert.equal(buildTriageExtremosLine(rollups), null);
});
