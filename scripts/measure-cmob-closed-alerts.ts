// scripts/measure-cmob-closed-alerts.ts
// READ-ONLY. ¿Las ExitAlerts CERRADAS de cmob0e56 están en los deptos ANALIZADOS
// (los que entran a convergencia) o fuera de scope? No escribe nada.
// Run: npx tsx scripts/measure-cmob-closed-alerts.ts

import { prisma } from '../src/lib/prisma';

const CAMPAIGN_ID = 'cmob0e56u0005f7g42l11urw0';

async function main() {
  const campaign = await prisma.campaign.findUnique({
    where: { id: CAMPAIGN_ID },
    select: { accountId: true, name: true },
  });
  if (!campaign) throw new Error('Campaña no encontrada');
  const accountId = campaign.accountId;

  const cutoff12m = new Date();
  cutoff12m.setMonth(cutoff12m.getMonth() - 12);

  // Deptos ANALIZADOS de la campaña (con isaScore = los que entran a convergencia).
  const analyzed = await prisma.complianceAnalysis.findMany({
    where: { campaignId: CAMPAIGN_ID, scope: 'DEPARTMENT', status: 'COMPLETED', isaScore: { not: null } },
    select: { departmentId: true, department: { select: { displayName: true } } },
  });
  const analyzedIds = new Set(analyzed.map((a) => a.departmentId));
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`cmob0e56 — deptos analizados (convergencia): ${analyzed.map((a) => a.department?.displayName).join(', ')}`);
  console.log('═══════════════════════════════════════════════════════════════');

  // ExitAlerts resolved/dismissed en 12m, por depto.
  const resolvedExits = await prisma.exitAlert.findMany({
    where: { accountId, status: { in: ['resolved', 'dismissed'] }, createdAt: { gte: cutoff12m } },
    select: { departmentId: true, alertType: true, status: true, department: { select: { displayName: true } } },
  });

  let enScope = 0;
  console.log(`\nExitAlerts CERRADAS en 12m (${resolvedExits.length}):`);
  for (const e of resolvedExits) {
    const inScope = e.departmentId ? analyzedIds.has(e.departmentId) : false;
    if (inScope) enScope++;
    console.log(`  ${e.department?.displayName ?? e.departmentId ?? 'sin depto'} · ${e.alertType} · ${e.status}` +
      (inScope ? '  <<< EN SCOPE (depto analizado)' : '  (fuera de scope convergencia)'));
  }

  console.log('\n───────────────────────────────────────────────────────────────');
  console.log(`Cerradas EN deptos analizados (afectarían convergencia de cmob0e56): ${enScope}`);
  console.log(enScope === 0
    ? '→ estado->fecha NO mueve la convergencia/ISA de cmob0e56 (las cerradas están fuera de scope).'
    : '→ estado->fecha SÍ movería la convergencia de cmob0e56 (re-análisis necesario para ver el delta).');

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
