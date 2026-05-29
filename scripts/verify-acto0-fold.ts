// scripts/verify-acto0-fold.ts
// Reproduce la lógica que el ActoCobertura.tsx aplica sobre cmob0e56:
//   - 3 buckets per-dept (FUEGO cards / HUMO cards / PUNTO_CIEGO names)
//   - 3 casos de FUEGO mode (cards / positive_line / hidden) según denuncia
//   - cross-ref silencioVozExterna ↔ HUMO para la sección de Convergencia
//
// Lo que el script confirma para cmob0e56:
//   FUEGO mode  → 'hidden' (denuncias_12m=null en los 11)
//   HUMO cards  → 2 (Cultura B, Comercial A-legal — visibles vía silencioVozExterna)
//   PUNTO_CIEGO → 7 nombres en una línea
//   CONFIABLE   → skip (no render en este ciclo)
//   BandaSilencioExterna → 2 items renderizables (Cultura, Comercial)

import 'dotenv/config';
import { prisma } from '../src/lib/prisma';
import { computeCoverageAnalysis } from '../src/lib/services/compliance/CoverageAnalysisService';
import { computeDepartmentRiskScores } from '../src/lib/services/compliance/DepartmentRiskScoreService';
import { resolveDepartmentRiskNarrative } from '../src/lib/services/compliance/DepartmentRiskNarrativeDictionary';

async function main() {
  const campaign = await prisma.campaign.findFirst({
    where: { id: { startsWith: 'cmob0e56' } },
    select: { id: true, name: true, accountId: true },
  });
  if (!campaign) {
    console.error('Campaña cmob0e56 no encontrada.');
    process.exit(1);
  }
  console.log(`Campaign: ${campaign.id}  "${campaign.name}"\n`);

  const coverage = await computeCoverageAnalysis(campaign.id, campaign.accountId);
  const riskScores = await computeDepartmentRiskScores({
    accountId: campaign.accountId,
    coverageItems: coverage.deptosCobertura,
  });

  // ─── FUEGO mode ─────────────────────────────────────────────────────────
  let denunciaNull = 0, denunciaZero = 0, denunciaReal = 0;
  const fuegoCards: Array<{ name: string; score: number }> = [];
  const humoByDeptId = new Map<string, { rama?: string; score: number; narrativa: string }>();
  const puntoCiego: string[] = [];

  for (const rs of riskScores) {
    const d = rs.inputs.denuncias_12m;
    if (d === null) denunciaNull += 1;
    else if (d === 0) denunciaZero += 1;
    else if (d >= 1) denunciaReal += 1;

    const n = resolveDepartmentRiskNarrative(rs);
    if (!n) continue;
    if (n.state === 'FUEGO') fuegoCards.push({ name: rs.departmentName, score: rs.score });
    else if (n.state === 'HUMO') humoByDeptId.set(rs.departmentId, {
      rama: n.rama, score: n.chip.score, narrativa: n.narrativa,
    });
    else if (n.state === 'PUNTO_CIEGO') puntoCiego.push(rs.departmentName);
  }
  puntoCiego.sort((a, b) => a.localeCompare(b, 'es'));

  let fuegoMode: 'cards' | 'positive_line' | 'hidden';
  if (denunciaReal > 0) fuegoMode = 'cards';
  else if (denunciaNull === riskScores.length) fuegoMode = 'hidden';
  else fuegoMode = 'positive_line';

  console.log(`Denuncia stats: null=${denunciaNull}  loaded_zero=${denunciaZero}  loaded_real=${denunciaReal}`);
  console.log(`→ FUEGO mode: ${fuegoMode}\n`);

  if (fuegoMode === 'cards') {
    console.log('FUEGO cards:');
    for (const c of fuegoCards) console.log(`   ${c.name} — Riesgo ${c.score}`);
  } else if (fuegoMode === 'positive_line') {
    console.log('FUEGO positive line: "0 denuncias formales confirmadas este ciclo."');
  } else {
    console.log('FUEGO: NO render (denuncias_12m=null en todos los deptos — métrica no cargada).');
  }

  // ─── HUMO cards (cross-ref con silencioConVozExterna) ───────────────────
  console.log('\nHUMO cards (cross-ref con silencioConVozExterna):');
  let renderedHumo = 0;
  for (const item of coverage.silencioConVozExterna) {
    if (!item.departmentId) continue;
    const h = humoByDeptId.get(item.departmentId);
    if (!h) {
      console.log(`   [skip] ${item.departmentName} — sin HUMO en motor`);
      continue;
    }
    console.log(`   ${item.departmentName} — rama ${h.rama} — Riesgo ${h.score}`);
    renderedHumo += 1;
  }
  console.log(`   (${renderedHumo} cards renderizadas en Acto 0)`);

  // ─── PUNTO_CIEGO línea ──────────────────────────────────────────────────
  console.log('\nPUNTO_CIEGO línea compacta:');
  if (puntoCiego.length === 0) {
    console.log('   — (sin deptos en este estado)');
  } else {
    console.log(`   El resto del silencio (${puntoCiego.length} áreas) opera sin señales externas:`);
    console.log(`   ${puntoCiego.join(', ')}.`);
  }

  // ─── Banda en Convergencia ─────────────────────────────────────────────
  console.log('\nBandaSilencioExterna (Señales cruzadas):');
  let renderedBanda = 0;
  for (const item of coverage.silencioConVozExterna) {
    if (!item.departmentId) continue;
    const h = humoByDeptId.get(item.departmentId);
    if (!h) continue;
    console.log(`   ${item.departmentName} — Riesgo ${h.score}${h.rama === 'A-legal' ? ' + LegalBadgePill' : ''}`);
    renderedBanda += 1;
  }
  console.log(`   (${renderedBanda} items renderizados)`);

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
