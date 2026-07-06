// prisma/scripts/recompute-clima-insights.ts
// Re-ejecuta la agregación de clima de una campaña cerrada (Gate 2).
// Idempotente por diseño (upsert por clave de período) — es el mecanismo de
// re-ejecución del MAESTRO ante climaAggregationStatus=FAILED y el "backfill
// para pruebas" de campañas cerradas antes del wiring.
// Patrón drain-compliance-campaign.ts: directo, sin HTTP ni auth.
//
// Uso: npx tsx prisma/scripts/recompute-clima-insights.ts <campaignId>
//      (o npm run recompute:clima-insights -- <campaignId> fuera de PowerShell)

import { prisma } from '../../src/lib/prisma';
import { ClimaAggregationService } from '../../src/lib/services/clima/ClimaAggregationService';

const CAMPAIGN_ID = process.argv[2];

if (!CAMPAIGN_ID) {
  console.error('Uso: npx tsx prisma/scripts/recompute-clima-insights.ts <campaignId>');
  process.exit(1);
}

async function printState(label: string) {
  const campaign = await prisma.campaign.findUnique({
    where: { id: CAMPAIGN_ID },
    select: {
      name: true,
      status: true,
      climaAggregationStatus: true,
      campaignType: { select: { slug: true } },
    },
  });
  if (!campaign) {
    console.error(`❌ Campaña ${CAMPAIGN_ID} no encontrada`);
    process.exit(1);
  }
  console.log(`${label}:`);
  console.log(`  campaña: ${campaign.name} [${campaign.campaignType.slug}]`);
  console.log(`  status: ${campaign.status} · climaAggregationStatus: ${campaign.climaAggregationStatus ?? 'null'}`);
}

async function main() {
  console.log(`🔄 Recompute clima insights — campaña ${CAMPAIGN_ID}\n`);
  await printState('Estado inicial');

  const result = await ClimaAggregationService.processClimaResults(CAMPAIGN_ID);

  console.log('\nResultado:');
  console.log(`  status: ${result.status}`);
  console.log(`  deptos procesados: ${result.deptosProcesados}`);
  console.log(`  insights generados: ${result.insightsGenerados}`);
  console.log(`  duración: ${result.durationMs}ms`);
  if (result.deptosFallidos.length > 0) {
    console.log('  deptos fallidos:');
    for (const f of result.deptosFallidos) {
      console.log(`    ${f.departmentId}: ${f.error.slice(0, 150)}`);
    }
  }

  console.log('');
  await printState('Estado final');

  // Tabla de insights de la campaña
  const insights = await prisma.departmentClimaInsight.findMany({
    where: { campaignId: CAMPAIGN_ID },
    include: { department: { select: { displayName: true } } },
    orderBy: { departmentId: 'asc' },
  });

  console.log(`\n📊 Insights de la campaña (${insights.length}):`);
  for (const i of insights) {
    const drivers = i.driverScores ? Object.keys(i.driverScores as object).length : 0;
    console.log(
      `  ${i.department.displayName.padEnd(30)} ${i.period} ${i.productType} ` +
      `followUp=${i.isFollowUp} EI=${i.engagementFavorability ?? 'null'} ` +
      `drivers=${drivers} nps=${i.npsScore ?? 'null'} ` +
      `particip=${i.totalResponded}/${i.totalInvited}`
    );
  }
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
