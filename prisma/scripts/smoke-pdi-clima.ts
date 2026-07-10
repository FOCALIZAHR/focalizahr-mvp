// prisma/scripts/smoke-pdi-clima.ts
// ════════════════════════════════════════════════════════════════════════════
// SMOKE Gate 5B-i — path CLIMA del PDISuggestionEngine (capacidad NUEVA).
//
// Demuestra que buildClimaGapInput (opción B: dimensión clima → competencia 360°
// vía mapeo PROVISIONAL) alimenta generateSuggestions y produce una sugerencia
// que arrastra climaEvidence. Complementa el snapshot antes/después (que prueba
// que el flujo 360 puro quedó intacto).
//
// Correr:  npx tsx prisma/scripts/smoke-pdi-clima.ts
// (se borra al sellar)
// ════════════════════════════════════════════════════════════════════════════

import { PDISuggestionEngine } from '../../src/lib/services/PDISuggestionEngine';
import {
  CLIMA_COMPETENCY_MAPPING_STATUS,
  mapClimaDimensionToCompetency,
} from '../../src/lib/data/clima-competency-mapping';

// Determinismo del coachingTip (mismo criterio que el snapshot).
Math.random = () => 0.5;
const realLog = console.log;
console.log = () => {}; // silenciar debug del motor durante las llamadas

let pass = 0;
let fail = 0;
const results: string[] = [];
function check(label: string, cond: boolean) {
  cond ? pass++ : fail++;
  results.push(`  ${cond ? '✅' : '❌'} ${label}`);
}

// ── Mapeo PROVISIONAL ──
check('mapeo marcado PROVISIONAL', CLIMA_COMPETENCY_MAPPING_STATUS === 'PROVISIONAL');
check('liderazgo → LEAD-TEAM (mapeo provisional)', mapClimaDimensionToCompetency('liderazgo').competencyCode === 'LEAD-TEAM');
check('dimensión sin mapeo → fallback GENERIC (no revienta)', mapClimaDimensionToCompetency('dimension-inexistente').competencyCode === 'GENERIC');

// ── buildClimaGapInput: brecha de clima liderazgo 45% ──
const climaGap = PDISuggestionEngine.buildClimaGapInput('liderazgo', 45, -1.2);
check('buildClimaGapInput mapea liderazgo → LEAD-TEAM', climaGap.competencyCode === 'LEAD-TEAM');
check('gapValue negativo (fav 45 bajo target 75)', climaGap.gapValue < 0);
check('climaContext presente con driver+teamFavorability+gap360', climaGap.climaContext?.driver === 'liderazgo' && climaGap.climaContext?.teamFavorability === 45 && climaGap.climaContext?.gap360 === -1.2);

// ── generateSuggestions con el gap de clima → sugerencia con climaEvidence ──
const climaSuggestions = PDISuggestionEngine.generateSuggestions([climaGap], 'MANAGER');
check('generó ≥1 sugerencia desde clima', climaSuggestions.length >= 1);
check('la sugerencia arrastra climaEvidence (evidencia cruzada)', climaSuggestions.every((s) => s.climaEvidence?.driver === 'liderazgo' && s.climaEvidence?.teamFavorability === 45));
check('la sugerencia apunta a la competencia mapeada (LEAD-TEAM)', climaSuggestions.every((s) => s.competencyCode === 'LEAD-TEAM'));

// ── Prueba de aditividad in-situ: gap 360 puro (sin climaContext) NO trae climaEvidence ──
const puro360 = PDISuggestionEngine.generateSuggestions(
  [{ competencyCode: 'CORE-COMM', competencyName: 'Comunicación', selfScore: 3, managerScore: 4, gapType: 'DEVELOPMENT_AREA', gapValue: -1 }],
  'MANAGER'
);
check('gap 360 puro (sin climaContext) → sugerencia SIN clave climaEvidence', puro360.every((s) => !('climaEvidence' in s)));

console.log = realLog; // restaurar

console.log(results.join('\n'));
console.log('\n════════════════════════════════════════════════════════════════');
console.log('OUTPUT REAL — primera sugerencia generada desde clima (liderazgo 45%)');
console.log('════════════════════════════════════════════════════════════════');
const first = climaSuggestions[0];
console.log(JSON.stringify(
  {
    competencyCode: first.competencyCode,
    competencyName: first.competencyName,
    gapType: first.gapType,
    priority: first.priority,
    suggestionTitle: first.suggestion.title,
    coachingTip: first.coachingTip,
    climaEvidence: first.climaEvidence,
  },
  null,
  2
));

console.log('\n════════════════════════════════════════════════════════════════');
console.log(`RESULTADO: ${pass} PASS · ${fail} FAIL`);
console.log('════════════════════════════════════════════════════════════════');
if (fail > 0) process.exit(1);
