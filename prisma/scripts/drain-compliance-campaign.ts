// prisma/scripts/drain-compliance-campaign.ts
// Dispara la misma lógica que el CRON pero directo, sin HTTP ni CRON_SECRET.
// Útil para verificación empírica durante desarrollo.
//
// Uso: tsx prisma/scripts/drain-compliance-campaign.ts <campaignId>

import { PrismaClient } from '@prisma/client';
import { processBatch } from '../../src/lib/services/compliance/ComplianceAnalysisOrchestrator';

const prisma = new PrismaClient();
const CAMPAIGN_ID = process.argv[2];

if (!CAMPAIGN_ID) {
  console.error('Uso: tsx prisma/scripts/drain-compliance-campaign.ts <campaignId>');
  process.exit(1);
}

async function main() {
  console.log(`🔄 Drenando cola de campaña ${CAMPAIGN_ID}\n`);

  const before = await prisma.complianceAnalysis.groupBy({
    by: ['status'],
    where: { campaignId: CAMPAIGN_ID },
    _count: true,
  });
  console.log('Estado inicial:');
  for (const b of before) {
    console.log(`  ${b.status}: ${b._count}`);
  }
  console.log('');

  const deadline = Date.now() + 60_000;
  const { processed } = await processBatch(CAMPAIGN_ID, deadline);
  console.log(`\n✅ Procesados en esta tanda: ${processed}\n`);

  const after = await prisma.complianceAnalysis.groupBy({
    by: ['status'],
    where: { campaignId: CAMPAIGN_ID },
    _count: true,
  });
  console.log('Estado final:');
  for (const a of after) {
    console.log(`  ${a.status}: ${a._count}`);
  }

  // Detalle por job
  const jobs = await prisma.complianceAnalysis.findMany({
    where: { campaignId: CAMPAIGN_ID },
    include: { department: { select: { displayName: true } } },
    orderBy: [{ scope: 'asc' }, { createdAt: 'asc' }],
  });

  console.log('\nDetalle:');
  for (const j of jobs) {
    const dept = j.department?.displayName ?? '(org)';
    console.log(
      `  ${j.scope.padEnd(11)} ${j.status.padEnd(10)} retry=${j.retryCount}  dept=${dept}`
    );
    if (j.errorMessage) {
      console.log(`    error: ${j.errorMessage.slice(0, 150)}`);
    }
    if (j.status === 'COMPLETED' && j.senalDominante) {
      console.log(`    señal_dominante: ${j.senalDominante}  confianza: ${j.confianzaAnalisis ?? 'n/a'}`);
    }
  }

  // Alertas generadas
  const alertsCount = await prisma.complianceAlert.count({
    where: { campaignId: CAMPAIGN_ID },
  });
  console.log(`\n📢 Alertas totales en la campaña: ${alertsCount}`);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
