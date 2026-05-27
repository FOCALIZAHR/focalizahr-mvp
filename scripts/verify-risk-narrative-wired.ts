// scripts/verify-risk-narrative-wired.ts
// Verificación read-only del cableado Gate 2 sobre cmob0e56*.
// Reproduce EXACTAMENTE el bloque `silencioVozExterna:` del route handler
// (src/app/api/compliance/report/route.ts) — sin inventar datos.

import 'dotenv/config';
import { prisma } from '../src/lib/prisma';
import { computeCoverageAnalysis } from '../src/lib/services/compliance/CoverageAnalysisService';
import { computeDepartmentRiskScores } from '../src/lib/services/compliance/DepartmentRiskScoreService';
import { attachRiskNarrativeToSilencioItems } from '../src/lib/services/compliance/DepartmentRiskNarrativeDictionary';
import type { DepartmentRiskScore, SilencioVozExternaItem } from '../src/types/compliance';

async function main() {
  // 1. Resolver campaña.
  const campaign = await prisma.campaign.findFirst({
    where: { id: { startsWith: 'cmob0e56' } },
    select: { id: true, name: true, accountId: true },
  });
  if (!campaign) {
    console.error('Campaña con prefijo cmob0e56 no encontrada.');
    process.exit(1);
  }
  console.log(`Campaign: ${campaign.id}  "${campaign.name}"`);

  // 2. Coverage + riskScores (mismas llamadas que el route).
  const coverage = await computeCoverageAnalysis(campaign.id, campaign.accountId);
  const riskScores = await computeDepartmentRiskScores({
    accountId: campaign.accountId,
    coverageItems: coverage.deptosCobertura,
  });

  // 3. Alertas activas filtradas a 'silencio_con_voz_externa' — mismo filter
  //    que el route handler.
  const alertsRaw = await prisma.complianceAlert.findMany({
    where: {
      accountId: campaign.accountId,
      campaignId: campaign.id,
      alertType: 'silencio_con_voz_externa',
    },
    include: { department: { select: { displayName: true } } },
  });
  console.log(`Alerts raised (silencio_con_voz_externa): ${alertsRaw.length}`);

  if (alertsRaw.length === 0) {
    console.log('');
    console.log(
      'AVISO: la sexta alerta NO está raised sobre ningún depto en esta campaña.',
    );
    console.log(
      'El bloque `silencioVozExterna[]` quedaría vacío en el payload, así que',
    );
    console.log('no hay nada que cablear en ESTA campaña — el wiring igual viaja');
    console.log('porque el helper se ejecuta sin items.');
    console.log('');
    console.log(
      'Para ver el cableado activo: hace falta una campaña donde el ComplianceAlertService',
    );
    console.log(
      'haya disparado la sexta alerta (depto silencioso + ≥1 alerta externa de peso medio+).',
    );
    await prisma.$disconnect();
    return;
  }

  // 4. Construir items + adjuntar voz (idéntico al route handler).
  const baseItems = alertsRaw.map((a) => ({
    departmentId: a.departmentId,
    departmentName: a.department?.displayName ?? null,
    narrativa: a.description,
    signalsCount: a.signalsCount ?? 0,
  }));
  const items = attachRiskNarrativeToSilencioItems(baseItems, riskScores);

  // 5. Tabla.
  console.log('');
  const rows = items.map((item) => ({
    depto: item.departmentName ?? '—',
    legacy_signals: item.signalsCount,
    risk_score: item.riskChip?.score ?? '—',
    risk_C: item.riskChip?.confiabilidad ?? '—',
    risk_A: item.riskChip?.alertasExternas ?? '—',
    voz: item.riskNarrativa ? 'HUMO (nuevo)' : 'legacy',
  }));
  console.table(rows);

  // 6. Dump completo de los items relevantes.
  for (const item of items) {
    console.log('');
    console.log(`=== ${item.departmentName ?? '—'} ===`);
    console.log(JSON.stringify(item, null, 2));
  }

  // 7. CASO SINTÉTICO FUEGO — cmob0e56 no tiene denuncias cargadas, así que
  //    el branch FUEGO del helper no se ejercita con dato real. Lo cubrimos
  //    con un par item+score armado a mano que comparte departmentId, para
  //    confirmar que adjunta el string de FUEGO y un chip SOLO con `score`.
  console.log('');
  console.log('═══ CASO SINTÉTICO · FUEGO ═══');
  const fuegoScore: DepartmentRiskScore = {
    departmentId: 'synth-fuego-id',
    departmentName: 'Depto Sintético FUEGO',
    score: 75,                            // = max(inferido, piso 75)
    bucket: 'sub_threshold',
    drivers: {
      confiabilidad: 50,
      voz_externa: 25,
      piso_denuncia: 75,
    },
    reason: 'piso_aplicado',
    inputs: {
      participacion: 0,
      pesoAlertas: 3,
      denuncias_12m: 1,                   // ← dispara FUEGO
    },
    alertas: [
      { alertType: 'ley_karin', producto: 'exit', pesoEfectivo: 3 },
    ],
  };
  const fuegoItem: SilencioVozExternaItem = {
    departmentId: 'synth-fuego-id',
    departmentName: 'Depto Sintético FUEGO',
    narrativa: '(legacy fallback — no debería renderizarse)',
    signalsCount: 1,
  };
  const [fuegoOut] = attachRiskNarrativeToSilencioItems([fuegoItem], [fuegoScore]);
  console.log(JSON.stringify(fuegoOut, null, 2));

  const chip = fuegoOut.riskChip;
  const checks = [
    ['adjuntó riskNarrativa', typeof fuegoOut.riskNarrativa === 'string' && fuegoOut.riskNarrativa.includes('Ley Karin')],
    ['adjuntó riskChip',                   chip !== undefined],
    ['chip tiene score',                   chip?.score === 75],
    ['chip NO tiene confiabilidad',        chip?.confiabilidad === undefined],
    ['chip NO tiene alertasExternas',      chip?.alertasExternas === undefined],
  ] as const;
  console.log('');
  for (const [label, pass] of checks) {
    console.log(`${pass ? '✓' : '✗'} ${label}`);
  }
  const allPass = checks.every(([, pass]) => pass);
  console.log('');
  console.log(allPass ? '✓ Caso sintético FUEGO OK.' : '✗ FALLO en caso sintético FUEGO.');

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
