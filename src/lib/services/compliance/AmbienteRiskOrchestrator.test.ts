// ═══════════════════════════════════════════════════════════════════
// AmbienteRiskOrchestrator + AmbienteSynthesisEngine — wire end-to-end
// src/lib/services/compliance/AmbienteRiskOrchestrator.test.ts
// ═══════════════════════════════════════════════════════════════════
// Run:
//   npx tsx --test src/lib/services/compliance/AmbienteRiskOrchestrator.test.ts
//
// Cobertura Gate 3 (wire endpoint → orchestrator → engine):
//   1. ACCEPTANCE wire cmob0e56 — Response shape mínimo →
//      Orchestrator → Engine → SILENCIO_SIN_VOZ + mundoDominante='silencio'
//   2. classifyD4Trace.branchHit auditable
//   3. AREA_MANAGER fixture (criticalByManager=[]) sigue dando silencio
//   4. Empty response → graceful degradation (no throw)
// ═══════════════════════════════════════════════════════════════════

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { AmbienteRiskOrchestrator } from './AmbienteRiskOrchestrator';
import { AmbienteSynthesisEngine } from './AmbienteSynthesisEngine';
import type { ComplianceReportResponse } from '@/types/compliance';

// ═══════════════════════════════════════════════════════════════════
// FIXTURE — ComplianceReportResponse shape mínimo cmob0e56
// ═══════════════════════════════════════════════════════════════════
// Estructura "as if" salida del endpoint para campaña 18% cobertura con
// 1 gerencia muda + voz externa. NO usa Prisma — fixture en memoria.

function mkCmob0e56Response(): ComplianceReportResponse {
  return {
    success: true,
    type: 'executive',
    generatedAt: new Date('2026-06-06').toISOString(),
    campaign: {
      id: 'cmob0e56',
      name: 'Ambiente Sano Semestre 1 2026',
      startDate: new Date('2026-01-15'),
      endDate: new Date('2026-06-15'),
      completedAt: new Date('2026-06-15'),
    },
    company: {
      name: 'Test Co',
      country: 'CL',
    },
    narratives: {
      portada: { titular: '', subtitular: '' },
      ancla: { titular: '', descripcion: '' },
      artefacto1_dimensiones: { headline: '', body: '', planSugerido: '' },
      artefacto2_patrones: [],
      alertasGenero: [],
      artefacto3_convergencia: [],
      cruceNarrativa: null,
      criticalByManagerNarrativa: null,
      artefacto4_alertas: [],
      cierre: { titular: '', body: '' },
      cascada: undefined,
    } as ComplianceReportResponse['narratives'],
    data: {
      orgSafetyScore: 2.8,
      orgISA: 49,
      isaComponents: null,
      totalTextResponses: 5,
      totalRespondents: 9,
      totalDeptosUniverso: 6,
      coverage: {
        totalDeptos: 6,
        deptosConVoz: 1,
        pctCobertura: 18,
        rama: 'cobertura_baja',
        silencioConVozExterna: [],
        participacionAnomala: [],
        deptosCobertura: [
          {
            departmentId: 'd-comercial',
            departmentName: 'Comercial',
            analyzed: 'no_response',
            invited: 8,
            responded: 0,
            participationRate: 0,
            respondentCount: 0,
          },
          {
            departmentId: 'd-tech',
            departmentName: 'TI',
            analyzed: 'completed',
            invited: 10,
            responded: 9,
            participationRate: 90,
            respondentCount: 9,
          },
        ] as ComplianceReportResponse['data']['coverage']['deptosCobertura'],
      } as ComplianceReportResponse['data']['coverage'],
      departments: [
        {
          departmentId: 'd-tech',
          departmentName: 'TI',
          safetyScore: 2.45,
          riskLevel: 'critical',
          respondentCount: 9,
          dimensionScores: {
            P2_seguridad: 1.8,
            P3_disenso: 2.5,
            P4_microagresiones: 2.0,
            P5_equidad: 2.7,
            P7_liderazgo: 2.2,
            P8_agotamiento: 3.5,
          },
          isaScore: 49,
          deltaVsAnterior: null,
          teatroCumplimiento: false,
        },
      ],
      skippedByPrivacy: [],
      metaAnalysis: null,
      convergencia: {
        activeSources: [],
        departments: [],
        criticalByManager: [],
      },
      alerts: [],
      silencioVozExterna: [
        {
          departmentId: 'd-comercial',
          departmentName: 'Comercial',
          narrativa: 'Comercial no completó la medición pero...',
          signalsCount: 3,
          analyzed: 'no_response',
        },
      ],
      otroMundo: [],
      riskScores: [
        {
          departmentId: 'd-comercial',
          departmentName: 'Comercial',
          score: 60,
          bucket: 'sub_threshold',
          drivers: { confiabilidad: 50, voz_externa: 10, piso_denuncia: 0 },
          reason: 'suma',
          inputs: { participacion: 0, pesoAlertas: 3, denuncias_12m: 0 },
          alertas: [],
        },
        {
          departmentId: 'd-tech',
          departmentName: 'TI',
          score: 30,
          bucket: 'con_isa',
          drivers: { confiabilidad: 5, voz_externa: 25, piso_denuncia: 0 },
          reason: 'suma',
          inputs: { participacion: 90, pesoAlertas: 5, denuncias_12m: 0 },
          alertas: [],
        },
      ],
    },
    legalNotice: 'Test',
  };
}

// ═══════════════════════════════════════════════════════════════════
// 1. ACCEPTANCE — wire end-to-end cmob0e56 → SILENCIO_SIN_VOZ
// ═══════════════════════════════════════════════════════════════════

test('1. Wire cmob0e56: response → Orchestrator → Engine → SILENCIO_SIN_VOZ', () => {
  const response = mkCmob0e56Response();

  // Paso 1 — Orchestrator wrappea el response.
  const payload = AmbienteRiskOrchestrator.buildAmbientePayload(response);

  // Verificación Orchestrator: el mundo es 'silencio' (gap=82% ≥ 50).
  assert.equal(
    payload.beat1Seed.mundoDominante,
    'silencio',
    'classifyD4 server-side debe emitir mundo=silencio con gap=82%.',
  );

  // synthesis aún null hasta que el Engine se llame.
  assert.equal(payload.synthesis, null);

  // Paso 2 — Engine emite synthesis.
  const synthesis = AmbienteSynthesisEngine.generate({
    beat1Seed: payload.beat1Seed,
    data: payload.data,
  });

  // ACCEPTANCE BLOQUEANTE: el hilo único Beat 1 → Beat 6 está cableado.
  assert.equal(
    synthesis.diagnosticType,
    'SILENCIO_SIN_VOZ',
    'Beat 6 (Engine) debe NOMBRAR lo que Beat 1 (Orchestrator) plantó: silencio. NO emite SISTEMICO ni GENERIC.',
  );
});

// ═══════════════════════════════════════════════════════════════════
// 2. classifyD4Trace auditable
// ═══════════════════════════════════════════════════════════════════

test('2. classifyD4Trace registra rama disparada para audit', () => {
  const response = mkCmob0e56Response();
  const payload = AmbienteRiskOrchestrator.buildAmbientePayload(response);

  assert.ok(payload.beat1Seed.classifyD4Trace.branchHit.includes('silencio'));
  assert.ok(payload.beat1Seed.classifyD4Trace.coverageGapPct >= 50);
});

// ═══════════════════════════════════════════════════════════════════
// 3. AREA_MANAGER fixture (criticalByManager=[]) sigue silencio
// ═══════════════════════════════════════════════════════════════════

test('3. AREA_MANAGER scope (criticalByManager=[]) preserva silencio', () => {
  const response = mkCmob0e56Response();
  // El endpoint ya filtra criticalByManager=[] para AREA_MANAGER. El wire
  // no debe sentirse afectado — el mundo sigue siendo silencio.
  response.data.convergencia.criticalByManager = [];

  const payload = AmbienteRiskOrchestrator.buildAmbientePayload(response);
  const synthesis = AmbienteSynthesisEngine.generate({
    beat1Seed: payload.beat1Seed,
    data: payload.data,
  });

  assert.equal(synthesis.diagnosticType, 'SILENCIO_SIN_VOZ');
});

// ═══════════════════════════════════════════════════════════════════
// 4. Empty response → graceful degradation (no throw)
// ═══════════════════════════════════════════════════════════════════

test('4. Response con shape mínimo vacío → no throw, emite GENERIC', () => {
  const empty: ComplianceReportResponse = {
    success: true,
    type: 'executive',
    generatedAt: '',
    campaign: {
      id: '',
      name: '',
      startDate: '',
      endDate: '',
      completedAt: null,
    },
    company: { name: '' },
    narratives: {
      portada: { titular: '', subtitular: '' },
      ancla: { titular: '', descripcion: '' },
      artefacto1_dimensiones: { headline: '', body: '', planSugerido: '' },
      artefacto2_patrones: [],
      alertasGenero: [],
      artefacto3_convergencia: [],
      cruceNarrativa: null,
      criticalByManagerNarrativa: null,
      artefacto4_alertas: [],
      cierre: { titular: '', body: '' },
      cascada: undefined,
    } as ComplianceReportResponse['narratives'],
    data: {
      orgSafetyScore: null,
      orgISA: null,
      isaComponents: null,
      totalTextResponses: null,
      totalRespondents: null,
      coverage: {
        totalDeptos: 0,
        deptosConVoz: 0,
        pctCobertura: 100, // gap=0, no dispara silencio
        rama: 'sin_universo',
        silencioConVozExterna: [],
        participacionAnomala: [],
        deptosCobertura: [],
      } as ComplianceReportResponse['data']['coverage'],
      departments: [],
      skippedByPrivacy: [],
      metaAnalysis: null,
      convergencia: {
        activeSources: [],
        departments: [],
        criticalByManager: [],
      },
      alerts: [],
      riskScores: [],
    },
    legalNotice: '',
  };

  let payload;
  let synthesis;
  assert.doesNotThrow(() => {
    payload = AmbienteRiskOrchestrator.buildAmbientePayload(empty);
    synthesis = AmbienteSynthesisEngine.generate({
      beat1Seed: payload.beat1Seed,
      data: payload.data,
    });
  });

  // orgISA=null + nada disparado → GENERIC (caso patológico).
  assert.equal(synthesis!.diagnosticType, 'GENERIC');
});
