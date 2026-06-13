// ═══════════════════════════════════════════════════════════════════
// Test de INTEGRIDAD del hilo único — Beat 1 (titular) ↔ Beat 6 (La Decisión)
// src/lib/services/compliance/cascadaHiloUnico.test.ts
// ═══════════════════════════════════════════════════════════════════
// Run: npx tsx --test src/lib/services/compliance/cascadaHiloUnico.test.ts
//
// El bug que rompió la cascada 4 meses: Beat 1 planta silencio → Beat 6 cierra
// "sin dirección clara". Este test construye AMBOS artefactos desde el MISMO
// dato (la Apertura `buildAperturaTitular` y La Decisión `AmbienteSynthesisEngine`)
// y asserta que NO se contradicen — "Beat 1 planta X → Beat 6 nombra X".
//
// Reglas de integridad (cross-beat):
//   R1  denuncia: titular.meta.senal==='denuncia'  ⟺  synth==='FUEGO_LEGAL'
//   R2  silencio: titular.meta.silencio ∧ no-denuncia ⇒ synth ∉ {TODO_BIEN, BIEN_CON_FOCOS}
//   R3  todo-bien: synth==='TODO_BIEN' ⇒ titular sano (isaLevel sano, sin silencio, sin señal)
// ═══════════════════════════════════════════════════════════════════

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { AmbienteRiskOrchestrator } from './AmbienteRiskOrchestrator';
import { AmbienteSynthesisEngine } from './AmbienteSynthesisEngine';
import { buildGerenciaRollup } from './buildGerenciaRollup';
import { computeOrgDimensions } from './orgDimensions';
import { legalBadgeForCountry } from './CoverageNarrativeDictionary';
import { buildAperturaTitular } from '@/components/compliance/cascada/ActoAmbiente';
import {
  classifyIsa,
  ISA_NARRATIVES,
} from '@/app/dashboard/compliance/components/sections/SectionDimensiones/_shared/constants';
import type { ComplianceReportResponse } from '@/types/compliance';
import type { DiagnosticType } from '@/types/ambiente-cascada';

// ─── Construye AMBOS artefactos desde el mismo response (espejo de ActoAmbiente) ─
function buildBoth(response: ComplianceReportResponse) {
  const payload = AmbienteRiskOrchestrator.buildAmbientePayload(response);
  const orgISA = Math.round(response.data.orgISA ?? 0);
  const isaLevel = classifyIsa(orgISA);
  const rollups = buildGerenciaRollup(response);
  const indicioCount = rollups.reduce((s, r) => s + r.leyKarin.signalsCount, 0);
  const denunciaCount = (response.data.riskScores ?? []).reduce((s, rs) => {
    const d = rs.inputs.denuncias_12m;
    return d !== null && d !== undefined ? s + d : s;
  }, 0);
  const pct = payload.beat1Seed.beat1Slots.personResponseRate ?? 0;

  const titular = buildAperturaTitular({
    orgISA,
    isaLevel,
    isaNarrative: ISA_NARRATIVES[isaLevel].narrative,
    pct,
    silencio: pct < 50,
    indicioCount,
    denunciaCount,
    legalBadgeLabel: legalBadgeForCountry(response.company.country).label,
    dims: computeOrgDimensions(response.data.departments ?? []),
  });
  const synth = AmbienteSynthesisEngine.generate({
    beat1Seed: payload.beat1Seed,
    data: payload.data,
  });
  return { titular, synth, isaLevel, mundo: payload.beat1Seed.mundoDominante };
}

/** Aplica las 3 reglas de integridad a un par titular↔synth. */
function assertIntegridad(
  label: string,
  r: ReturnType<typeof buildBoth>,
) {
  const dt: DiagnosticType = r.synth.diagnosticType;
  const senal = r.titular.meta.senal;
  const silencio = r.titular.meta.silencio;

  // R1 — denuncia es el MISMO hecho en ambos lados.
  assert.equal(
    dt === 'FUEGO_LEGAL',
    senal === 'denuncia',
    `${label} · R1: FUEGO_LEGAL ⟺ titular.senal='denuncia' (dt=${dt}, senal=${senal})`,
  );

  // R2 — el silencio que el "pero" planta no puede cerrar como todo-bien.
  if (silencio && senal !== 'denuncia') {
    assert.ok(
      dt !== 'TODO_BIEN' && dt !== 'BIEN_CON_FOCOS',
      `${label} · R2: titular planta silencio pero Beat 6 cierra ${dt} (contradicción)`,
    );
  }

  // R3 — TODO_BIEN solo si el titular dice sano (sin problema plantado).
  if (dt === 'TODO_BIEN') {
    assert.equal(silencio, false, `${label} · R3: TODO_BIEN con silencio`);
    assert.equal(senal, null, `${label} · R3: TODO_BIEN con señal legal`);
    assert.equal(r.isaLevel, 'sano', `${label} · R3: TODO_BIEN con isaLevel=${r.isaLevel}`);
  }
}

// ═══════════════════════════════════════════════════════════════════
// FIXTURE base (cmob0e56: silencio, gap 82%, ISA 49, sin denuncia)
// ═══════════════════════════════════════════════════════════════════

function baseResponse(): ComplianceReportResponse {
  return {
    success: true,
    type: 'executive',
    generatedAt: '2026-06-13',
    campaign: { id: 'c', name: 'c', startDate: '', endDate: '', completedAt: null },
    company: { name: 'Test Co', country: 'CL' },
    narratives: { alertasGenero: [] },
    data: {
      orgSafetyScore: 2.8,
      orgISA: 49,
      isaComponents: null,
      coverage: {
        totalDeptos: 6,
        deptosConVoz: 1,
        pctCobertura: 18, // gap 82 → silencio
        silencioConVozExterna: [],
        participacionAnomala: [],
        deptosCobertura: [
          { departmentId: 'd-com', departmentName: 'Comercial', analyzed: 'no_response', invited: 40, responded: 0, participationRate: 0, respondentCount: 0 },
          { departmentId: 'd-tech', departmentName: 'TI', analyzed: 'completed', invited: 10, responded: 9, participationRate: 90, respondentCount: 9 },
        ],
      },
      departments: [
        {
          departmentId: 'd-tech',
          departmentName: 'TI',
          safetyScore: 2.45,
          riskLevel: 'critical',
          respondentCount: 9,
          dimensionScores: { P2_seguridad: 1.8, P3_disenso: 2.5, P4_microagresiones: 2.0, P5_equidad: 2.7, P7_liderazgo: 2.2, P8_agotamiento: 3.5 },
          isaScore: 49,
          deltaVsAnterior: null,
          teatroCumplimiento: false,
        },
      ],
      skippedByPrivacy: [],
      metaAnalysis: null,
      convergencia: { activeSources: [], departments: [], criticalByManager: [] },
      alerts: [],
      silencioVozExterna: [
        { departmentId: 'd-com', departmentName: 'Comercial', narrativa: 'x', signalsCount: 3, analyzed: 'no_response' },
      ],
      otroMundo: [],
      riskScores: [
        { departmentId: 'd-com', departmentName: 'Comercial', score: 60, bucket: 'sub_threshold', drivers: { confiabilidad: 50, voz_externa: 10, piso_denuncia: 0 }, reason: 'suma', inputs: { participacion: 0, pesoAlertas: 3, denuncias_12m: 0 }, alertas: [] },
        { departmentId: 'd-tech', departmentName: 'TI', score: 30, bucket: 'con_isa', drivers: { confiabilidad: 5, voz_externa: 25, piso_denuncia: 0 }, reason: 'suma', inputs: { participacion: 90, pesoAlertas: 5, denuncias_12m: 0 }, alertas: [] },
      ],
    },
    legalNotice: '',
  } as unknown as ComplianceReportResponse;
}

// ═══════════════════════════════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════════════════════════════

test('I1. SILENCIO (cmob0e56) — Beat 1 silencio → Beat 6 SILENCIO_SIN_VOZ, sin contradicción', () => {
  const r = buildBoth(baseResponse());
  assert.equal(r.mundo, 'silencio');
  assert.equal(r.synth.diagnosticType, 'SILENCIO_SIN_VOZ');
  assert.equal(r.titular.meta.silencio, true);
  assert.equal(r.isaLevel, 'riesgo'); // ISA 49 → "no llega a sano"
  assertIntegridad('SILENCIO', r);
});

test('I2. FUEGO — denuncia formal → Beat 6 FUEGO_LEGAL ⟺ titular señala denuncia', () => {
  const response = baseResponse();
  // Inyectar denuncia formal en TI (piso_denuncia>0 ⇒ denuncias_12m≥1).
  const ti = response.data.riskScores!.find((r) => r.departmentId === 'd-tech')!;
  ti.drivers.piso_denuncia = 75;
  ti.reason = 'piso_aplicado';
  ti.inputs.denuncias_12m = 2;

  const r = buildBoth(response);
  assert.equal(r.synth.diagnosticType, 'FUEGO_LEGAL');
  assert.equal(r.titular.meta.senal, 'denuncia');
  assertIntegridad('FUEGO', r);
});

test('I3. TODO-BIEN — ISA 85 sano + cobertura plena → Beat 6 TODO_BIEN ⟺ titular sano', () => {
  const response = baseResponse();
  response.data.orgISA = 85;
  response.data.coverage.pctCobertura = 100; // gap 0
  response.data.departments[0].riskLevel = 'safe';
  response.data.departments[0].isaScore = 85;
  response.data.departments[0].dimensionScores = { P2_seguridad: 4.8, P3_disenso: 4.5, P4_microagresiones: 4.6, P5_equidad: 4.7, P7_liderazgo: 4.3, P8_agotamiento: 4.4 };
  // Cobertura plena de personas (pct alto → silencio=false).
  response.data.coverage.deptosCobertura = [
    { departmentId: 'd-tech', departmentName: 'TI', analyzed: 'completed', invited: 10, responded: 10, participationRate: 100, respondentCount: 10 },
  ] as unknown as ComplianceReportResponse['data']['coverage']['deptosCobertura'];
  response.data.silencioVozExterna = [];
  response.data.riskScores = [
    { departmentId: 'd-tech', departmentName: 'TI', score: 10, bucket: 'con_isa', drivers: { confiabilidad: 0, voz_externa: 0, piso_denuncia: 0 }, reason: 'suma', inputs: { participacion: 100, pesoAlertas: 0, denuncias_12m: 0 }, alertas: [] },
  ] as unknown as ComplianceReportResponse['data']['riskScores'];

  const r = buildBoth(response);
  assert.equal(r.mundo, 'todo-bien');
  assert.equal(r.synth.diagnosticType, 'TODO_BIEN');
  assert.equal(r.isaLevel, 'sano');
  assert.equal(r.titular.meta.silencio, false);
  assert.equal(r.titular.meta.senal, null);
  assertIntegridad('TODO-BIEN', r);
});

test('I4. NÚMERO-BAJO — ISA 49 + cobertura media (gap<50) → Beat 6 NO cierra todo-bien', () => {
  const response = baseResponse();
  response.data.coverage.pctCobertura = 70; // gap 30 < 50 → no silencio mundo
  response.data.coverage.deptosCobertura = [
    { departmentId: 'd-tech', departmentName: 'TI', analyzed: 'completed', invited: 10, responded: 9, participationRate: 90, respondentCount: 9 },
  ] as unknown as ComplianceReportResponse['data']['coverage']['deptosCobertura'];
  response.data.silencioVozExterna = [];

  const r = buildBoth(response);
  assert.equal(r.mundo, 'numero-bajo');
  assert.notEqual(r.synth.diagnosticType, 'TODO_BIEN');
  assert.notEqual(r.synth.diagnosticType, 'BIEN_CON_FOCOS');
  assertIntegridad('NUMERO-BAJO', r);
});
