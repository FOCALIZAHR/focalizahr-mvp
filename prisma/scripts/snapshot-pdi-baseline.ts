// prisma/scripts/snapshot-pdi-baseline.ts
// ════════════════════════════════════════════════════════════════════════════
// SNAPSHOT determinista del output ACTUAL de PDISuggestionEngine (Gate 5B-i).
//
// Objetivo: capturar el comportamiento de los 3 consumidores ANTES de extender
// el motor con climaContext?, y volver a correrlo DESPUÉS — el output de los
// casos SIN climaContext debe ser BYTE-IDÉNTICO.
//
// GOTCHA: el motor NO es determinista — `selectCoachingTip` usa Math.random()
// (PDISuggestionEngine.ts:145). Para que la comparación antes/después tenga
// sentido, aquí se FIJA Math.random a un valor constante (mismo en ambas
// corridas) y se silencian los console.log de debug del motor. Así cualquier
// diferencia es atribuible SOLO al cambio de código, no al RNG.
//
// Correr:  npx tsx prisma/scripts/snapshot-pdi-baseline.ts
// Uso:     ... > before.txt  (antes)  ·  ... > after.txt  (después)  ·  diff
// ════════════════════════════════════════════════════════════════════════════

import { PDISuggestionEngine } from '../../src/lib/services/PDISuggestionEngine';
import type {
  GapAnalysisInput,
  PerformanceTrack,
} from '../../src/lib/types/pdi-suggestion';
import type { RoleFitResult } from '../../src/lib/services/RoleFitAnalyzer';

// ── Determinismo: fijar Math.random (coachingTip) para toda la corrida ──
const FIXED_RANDOM = 0.5;
Math.random = () => FIXED_RANDOM;

// ── Silenciar el debug del motor (no forma parte del output a comparar) ──
const realLog = console.log;
const realWarn = console.warn;
function mute() {
  console.log = () => {};
  console.warn = () => {};
}
function unmute() {
  console.log = realLog;
  console.warn = realWarn;
}

// ── Escenarios SIN clima (los 3 consumidores funnelan a generateSuggestions) ──
const genScenarios: { track: PerformanceTrack; gaps: GapAnalysisInput[] }[] = [
  {
    track: 'EJECUTIVO',
    gaps: [
      { competencyCode: 'STRAT-VISION', competencyName: 'Visión Estratégica', selfScore: 4.5, managerScore: 3.0, gapType: 'BLIND_SPOT', gapValue: 1.5 },
      { competencyCode: 'LEAD-TEAM', competencyName: 'Liderazgo de Equipos', selfScore: 2.5, managerScore: 4.0, gapType: 'DEVELOPMENT_AREA', gapValue: -1.5 },
    ],
  },
  {
    track: 'MANAGER',
    gaps: [
      { competencyCode: 'CORE-COMM', competencyName: 'Comunicación', selfScore: 3.0, managerScore: 4.0, peerAvgScore: 3.5, gapType: 'PEER_DISCONNECT', gapValue: -1.0 },
      { competencyCode: 'LEAD-FEEDBACK', competencyName: 'Feedback', selfScore: 4.0, managerScore: 2.5, gapType: 'HIDDEN_STRENGTH', gapValue: 1.5 },
    ],
  },
  {
    track: 'COLABORADOR',
    gaps: [
      { competencyCode: 'CORE-RESULTS', competencyName: 'Orientación a Resultados', selfScore: 2.0, managerScore: 3.5, gapType: 'DEVELOPMENT_AREA', gapValue: -1.5 },
    ],
  },
];

// ── Escenario Role Fit (consumidor pdi/generate-suggestion) — precomputado, sin BD ──
const roleFit: RoleFitResult = {
  employeeId: 'emp-1',
  employeeName: 'Test',
  standardJobLevel: 'MANAGER',
  roleFitScore: 72,
  gaps: [
    { competencyCode: 'LEAD-DELEG', competencyName: 'Delegación', actualScore: 2.0, targetScore: 4.0, rawGap: -2.0, fitPercent: 50, status: 'CRITICAL' },
    { competencyCode: 'CORE-ADAPT', competencyName: 'Adaptabilidad', actualScore: 5.0, targetScore: 3.0, rawGap: 2.0, fitPercent: 100, status: 'EXCEEDS' },
    { competencyCode: 'CORE-COMM', competencyName: 'Comunicación', actualScore: 3.0, targetScore: 4.0, rawGap: -1.0, fitPercent: 75, status: 'IMPROVE' },
    { competencyCode: 'CORE-TEAM', competencyName: 'Trabajo en Equipo', actualScore: 4.0, targetScore: 4.0, rawGap: 0, fitPercent: 100, status: 'MATCH' },
  ],
  summary: { totalCompetencies: 4, matching: 1, needsImprovement: 1, critical: 1, exceeds: 1 },
};

async function run() {
  mute();

  const generateSuggestions = genScenarios.map((s) => {
    const suggestions = PDISuggestionEngine.generateSuggestions(s.gaps, s.track);
    return {
      track: s.track,
      suggestions,
      executiveSummary: PDISuggestionEngine.generateExecutiveSummary(suggestions),
    };
  });

  const roleFitSuggestions = await PDISuggestionEngine.generateFromRoleFit(
    'emp-1',
    'cycle-1',
    'MANAGER',
    roleFit
  );
  const generateFromRoleFit = {
    suggestions: roleFitSuggestions,
    executiveSummary: PDISuggestionEngine.generateExecutiveSummary(roleFitSuggestions),
  };

  unmute();

  // ÚNICO output a stdout (para comparar antes/después)
  const snapshot = { generateSuggestions, generateFromRoleFit };
  process.stdout.write(JSON.stringify(snapshot, null, 2) + '\n');
}

run();
