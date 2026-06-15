// scripts/gancho-render-2-mundos.ts
// READ-ONLY. Render-oráculo del Gancho para visto: imprime lo que SectionSintesis
// mostraría en 2 mundos, usando el selector + copy reales (ganchoVariants).
// No toca DB ni nada. Run: npx tsx scripts/gancho-render-2-mundos.ts

import {
  selectGanchoVariant,
  interpolateGancho,
  GANCHO_VARIANTS,
} from '../src/app/dashboard/compliance/lib/ganchoVariants';
import type { DiagnosticType } from '../src/types/ambiente-cascada';

function render(
  label: string,
  diagnosticType: DiagnosticType,
  coverageGapPct: number,
  orgISA: number | null,
) {
  const key = selectGanchoVariant(diagnosticType, coverageGapPct, orgISA);
  const v = GANCHO_VARIANTS[key];
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log(label);
  console.log(`  inputs:  diagnosticType=${diagnosticType} · gap=${coverageGapPct}% · orgISA=${orgISA}`);
  console.log(`  variante: ${key}`);
  console.log('───────────────────────────────────────────────────────────────');
  console.log(`  [BADGE]  ${v.badgeLabel.toUpperCase()}   (tono ${v.tone})`);
  if (v.titular) console.log(`\n  ${interpolateGancho(v.titular, orgISA)}`);
  if (v.insight) console.log(`\n  (cursiva) ${v.insight}`);
  console.log(`\n  [ CTA → Ver evidencia → ]`);
}

console.log('RENDER GANCHO — 2 mundos para visto');

// Mundo 1 — SILENCIO real (campaña cmob0e56: orgISA 49 riesgo, ~82% mapa sin voz
// → diagnosticType SILENCIO_SIN_VOZ por gap >= 50).
render('MUNDO 1 — SILENCIO real (cmob0e56)', 'SILENCIO_SIN_VOZ', 82, 49);

// Mundo 2 — Sano sintético pleno (ISA alto, casi todos respondieron).
render('MUNDO 2 — Sano pleno (sintético)', 'TODO_BIEN', 12, 88);

// Bonus — el mismo ISA alto pero "de pocos" (gap >= 30) → cambia la variante.
render('BONUS — Sano de pocos (TODO_BIEN + gap alto)', 'TODO_BIEN', 40, 88);

console.log('\n═══════════════════════════════════════════════════════════════');
