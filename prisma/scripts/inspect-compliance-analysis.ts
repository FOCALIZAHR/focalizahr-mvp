// Read-only. Inspecciona ComplianceAnalysis de una campaña.
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const CAMPAIGN_ID = process.argv[2];
if (!CAMPAIGN_ID) {
  console.log('Uso: tsx prisma/scripts/inspect-compliance-analysis.ts <campaignId>');
  process.exit(1);
}

async function main() {
  const rows = await prisma.complianceAnalysis.findMany({
    where: { campaignId: CAMPAIGN_ID },
    include: { department: { select: { displayName: true } } },
    orderBy: [{ scope: 'asc' }, { createdAt: 'asc' }],
  });
  console.log(`Encontrados ${rows.length} jobs para ${CAMPAIGN_ID}\n`);
  for (const r of rows) {
    console.log('─'.repeat(90));
    console.log(`scope=${r.scope}  status=${r.status}  dept=${r.department?.displayName ?? '(org)'}`);
    console.log(`  id=${r.id}`);
    console.log(`  respondentCount=${r.respondentCount}  safetyScore=${r.safetyScore}`);
    console.log(`  retryCount=${r.retryCount}  startedAt=${r.startedAt?.toISOString() ?? 'null'}  completedAt=${r.completedAt?.toISOString() ?? 'null'}`);
    console.log(`  errorMessage: ${r.errorMessage ?? 'null'}`);
  }
  console.log('─'.repeat(90));
}
main().catch(console.error).finally(() => prisma.$disconnect());
