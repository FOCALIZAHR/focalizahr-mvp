// scripts/gate6-ladecision-render.ts
// Gate 6 FINAL — render de La Decisión (SILENCIO_SIN_VOZ, caso cmob0e56) con el
// título ampliado + el puente (Regla del Río). Fixture silencio compacto.
//
// Run: npx tsx scripts/gate6-ladecision-render.ts

import { AmbienteRiskOrchestrator } from '@/lib/services/compliance/AmbienteRiskOrchestrator';
import { AmbienteSynthesisEngine } from '@/lib/services/compliance/AmbienteSynthesisEngine';
import type { ComplianceReportResponse } from '@/types/compliance';

const response = {
  success: true,
  type: 'executive',
  generatedAt: '2026-06-13',
  campaign: { id: 'c', name: 'c', startDate: '', endDate: '', completedAt: null },
  company: { name: 'demo', country: 'CL' },
  narratives: { alertasGenero: [] },
  data: {
    orgSafetyScore: 2.8,
    orgISA: 49,
    isaComponents: null,
    coverage: {
      totalDeptos: 6, deptosConVoz: 1, pctCobertura: 18, silencioConVozExterna: [], participacionAnomala: [],
      deptosCobertura: [
        { departmentId: 'd-com', departmentName: 'Comercial', analyzed: 'no_response', invited: 40, responded: 0, participationRate: 0, respondentCount: 0 },
        { departmentId: 'd-tech', departmentName: 'TI', analyzed: 'completed', invited: 10, responded: 9, participationRate: 90, respondentCount: 9 },
      ],
    },
    departments: [
      { departmentId: 'd-tech', departmentName: 'TI', safetyScore: 2.45, riskLevel: 'critical', respondentCount: 9, dimensionScores: { P2_seguridad: 1.8, P3_disenso: 2.5, P4_microagresiones: 2.0, P5_equidad: 2.7, P7_liderazgo: 2.2, P8_agotamiento: 3.5 }, isaScore: 49, deltaVsAnterior: null, teatroCumplimiento: false },
    ],
    skippedByPrivacy: [], metaAnalysis: null,
    convergencia: { activeSources: [], departments: [], criticalByManager: [] },
    alerts: [],
    silencioVozExterna: [{ departmentId: 'd-com', departmentName: 'Comercial', narrativa: 'x', signalsCount: 3, analyzed: 'no_response' }],
    otroMundo: [],
    riskScores: [
      { departmentId: 'd-com', departmentName: 'Comercial', score: 60, bucket: 'sub_threshold', drivers: { confiabilidad: 50, voz_externa: 10, piso_denuncia: 0 }, reason: 'suma', inputs: { participacion: 0, pesoAlertas: 3, denuncias_12m: 0 }, alertas: [] },
      { departmentId: 'd-tech', departmentName: 'TI', score: 30, bucket: 'con_isa', drivers: { confiabilidad: 5, voz_externa: 25, piso_denuncia: 0 }, reason: 'suma', inputs: { participacion: 90, pesoAlertas: 5, denuncias_12m: 0 }, alertas: [] },
    ],
  },
  legalNotice: '',
} as unknown as ComplianceReportResponse;

const payload = AmbienteRiskOrchestrator.buildAmbientePayload(response);
const synth = AmbienteSynthesisEngine.generate({ beat1Seed: payload.beat1Seed, data: payload.data });

console.log('\n╔══ GATE 6 FINAL · LA DECISIÓN (cmob0e56, SILENCIO_SIN_VOZ) ══╗\n');
console.log(`LA DECISIÓN   (tipo: ${synth.diagnosticType})\n`);
console.log(`  TÍTULO: ${synth.classification}\n`);
for (const p of synth.implication.split('\n\n')) console.log(`  ${p}\n`);
console.log(`  ┃ ${synth.path}\n`);
console.log(`  ${synth.accountability}`);
console.log(`\n  [Ir al plan →]`);
