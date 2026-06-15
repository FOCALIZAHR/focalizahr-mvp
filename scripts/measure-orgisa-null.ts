// scripts/measure-orgisa-null.ts
// READ-ONLY. Mide cuántas campañas compliance CERRADAS tienen orgISA null
// teniendo respuestas (causa: ningún depto >= 5). No escribe nada.
// Run: npx tsx scripts/measure-orgisa-null.ts

import { prisma } from '../src/lib/prisma';
import { PRIVACY_THRESHOLD } from '../src/lib/services/SafetyScoreService';

async function main() {
  // Todos los análisis ORG (con o sin isaScore).
  const orgRows = await prisma.complianceAnalysis.findMany({
    where: { scope: 'ORG' },
    select: {
      isaScore: true,
      status: true,
      campaignId: true,
      campaign: {
        select: { id: true, name: true, status: true, totalInvited: true, totalResponded: true },
      },
    },
  });

  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`ANÁLISIS ORG totales: ${orgRows.length}  ·  PRIVACY_THRESHOLD=${PRIVACY_THRESHOLD}`);
  console.log('═══════════════════════════════════════════════════════════════');

  let afectadas = 0;
  for (const r of orgRows) {
    const c = r.campaign;
    const afectada =
      r.isaScore === null && c.status === 'completed' && c.totalResponded > 0;
    if (afectada) afectadas++;
    console.log(
      `\n  ${c.name}\n    id=${c.id}  status=${c.status}  job=${r.status}` +
        `  isaScore=${r.isaScore ?? 'NULL'}  resp=${c.totalResponded}/${c.totalInvited}` +
        (afectada ? '  <<< AFECTADA (cerrada + respuestas + orgISA null)' : ''),
    );
  }

  // Para las que tienen ISA: distribución de respondentes por depto (¿cuántos >=5?).
  console.log('\n───────────────────────────────────────────────────────────────');
  console.log('DESGLOSE POR DEPTO (rows DEPARTMENT) — cuántos pasaron el umbral 5:');
  for (const r of orgRows) {
    const depRows = await prisma.complianceAnalysis.findMany({
      where: { campaignId: r.campaignId, scope: 'DEPARTMENT' },
      select: { departmentId: true, respondentCount: true, isaScore: true, status: true },
    });
    const pasaron = depRows.filter((d) => (d.respondentCount ?? 0) >= PRIVACY_THRESHOLD);
    console.log(
      `\n  ${r.campaign.name}: ${depRows.length} deptos analizados · ${pasaron.length} con n>=5` +
        ` · respondentes/depto=[${depRows.map((d) => d.respondentCount ?? 0).join(', ')}]`,
    );
  }

  console.log('\n───────────────────────────────────────────────────────────────');
  console.log(`CAMPAÑAS AFECTADAS HOY (orgISA null por falta de depto >=5): ${afectadas}`);
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
