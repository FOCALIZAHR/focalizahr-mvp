// Read-only. Inspecciona TODOS los ComplianceAnalysis en status PENDING globalmente,
// con sus retryCount y scope — para detectar jobs exhausted.
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const pending = await prisma.complianceAnalysis.findMany({
    where: { status: { in: ['PENDING', 'RUNNING'] } },
    include: {
      department: { select: { displayName: true } },
      campaign: { select: { name: true } },
    },
    orderBy: [{ campaignId: 'asc' }, { scope: 'asc' }],
  });

  console.log(`Encontrados ${pending.length} jobs PENDING/RUNNING globalmente\n`);

  // Agrupar por campaña
  const byCampaign = new Map<string, typeof pending>();
  for (const r of pending) {
    const arr = byCampaign.get(r.campaignId) ?? [];
    arr.push(r);
    byCampaign.set(r.campaignId, arr);
  }

  for (const [cid, jobs] of byCampaign.entries()) {
    console.log('═'.repeat(100));
    console.log(`Campaign: ${cid}  (${jobs[0].campaign.name})`);
    console.log('═'.repeat(100));

    for (const j of jobs) {
      const blockedByRetry = j.retryCount >= 3;
      const dept = j.department?.displayName ?? '(org)';
      console.log(
        `  ${j.scope.padEnd(11)} ${j.status.padEnd(8)} retry=${j.retryCount}${blockedByRetry ? ' [EXHAUSTED]' : ''}  dept=${dept}`
      );
      if (j.errorMessage) {
        console.log(`    lastError: ${j.errorMessage}`);
      }
    }

    // Diagnóstico del deadlock
    const deptStuck = jobs.filter(
      (j) => j.scope === 'DEPARTMENT' && j.status === 'PENDING' && j.retryCount >= 3
    );
    const deptLive = jobs.filter(
      (j) => j.scope === 'DEPARTMENT' && ['PENDING', 'RUNNING'].includes(j.status) && j.retryCount < 3
    );
    const orgPending = jobs.filter((j) => j.scope === 'ORG' && j.status === 'PENDING');

    if (deptStuck.length > 0 && orgPending.length > 0) {
      console.log('');
      console.log(
        `  ⚠️  DEADLOCK: ${deptStuck.length} DEPARTMENT exhausted (retry>=3) bloquean al ORG.`
      );
      console.log(
        `      El Orchestrator cuenta DEPARTMENTs en PENDING para decidir si el ORG puede correr.`
      );
      console.log(
        `      Como estos exhausted siguen en PENDING, ORG nunca se ejecuta y no hay forma de avanzar.`
      );
    }
    if (deptLive.length === 0 && deptStuck.length === 0 && orgPending.length > 0) {
      console.log('');
      console.log(`  ℹ️  ORG pending sin DEPARTMENTs. Si no hay DEPARTMENT COMPLETED, ORG fallará.`);
    }
  }
  console.log('═'.repeat(100));
}

main().catch(console.error).finally(() => prisma.$disconnect());
