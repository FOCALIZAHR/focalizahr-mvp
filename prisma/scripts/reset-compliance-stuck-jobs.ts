// prisma/scripts/reset-compliance-stuck-jobs.ts
// Resetea jobs ComplianceAnalysis. Dos modos:
//
//  1. Default (sin flags): jobs stuck en status='PENDING' con retryCount >=
//     MAX_RETRIES. Producto del bug donde la rama !llmResult.success nunca
//     marcaba FAILED.
//
//  2. Con --include-failed: también incluye jobs en status='FAILED'. Útil
//     cuando la falla fue por problema de infraestructura (rate limit, API
//     contract change, etc.) y el operador quiere re-intentar tras un fix.
//
// Filtros:
//  --campaign=<id>     Limita el scope a una campaña específica.
//  --apply             Sin este flag es dry-run.
//
// Uso:
//   npm run reset:compliance-stuck-jobs                                # dry-run global, solo PENDING stuck
//   npm run reset:compliance-stuck-jobs -- --apply                     # apply
//   npm run reset:compliance-stuck-jobs -- --include-failed            # dry-run incluye FAILED
//   npm run reset:compliance-stuck-jobs -- --campaign=abc --include-failed --apply

import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();
const MAX_RETRIES = 3;

function parseFlag(name: string): string | true | undefined {
  const prefix = `--${name}`;
  for (const arg of process.argv.slice(2)) {
    if (arg === prefix) return true;
    if (arg.startsWith(`${prefix}=`)) return arg.slice(prefix.length + 1);
  }
  return undefined;
}

async function main() {
  const apply = !!parseFlag('apply');
  const includeFailed = !!parseFlag('include-failed');
  const campaignFlag = parseFlag('campaign');
  const campaignId = typeof campaignFlag === 'string' ? campaignFlag : undefined;

  console.log(
    `🔧 Reset ComplianceAnalysis (${apply ? 'APPLY' : 'DRY-RUN'}, includeFailed=${includeFailed}, campaign=${campaignId ?? 'ALL'})`
  );
  console.log('');

  const where: Prisma.ComplianceAnalysisWhereInput = campaignId ? { campaignId } : {};

  // Modo default: PENDING stuck. Modo extendido: también FAILED.
  const statusClause: Prisma.ComplianceAnalysisWhereInput = includeFailed
    ? { OR: [{ status: 'PENDING', retryCount: { gte: MAX_RETRIES } }, { status: 'FAILED' }] }
    : { status: 'PENDING', retryCount: { gte: MAX_RETRIES } };

  const candidates = await prisma.complianceAnalysis.findMany({
    where: { ...where, ...statusClause },
    include: {
      department: { select: { displayName: true } },
      campaign: { select: { name: true } },
    },
    orderBy: [{ campaignId: 'asc' }, { scope: 'asc' }],
  });

  if (candidates.length === 0) {
    console.log('✅ No hay jobs que resetear bajo los criterios dados.');
    return;
  }

  console.log(`Encontrados ${candidates.length} jobs:\n`);
  for (const j of candidates) {
    const dept = j.department?.displayName ?? '(org)';
    console.log(
      `  ${j.id}  ${j.scope.padEnd(11)} ${j.status.padEnd(8)} retry=${j.retryCount}  dept=${dept}`
    );
    console.log(`    campaign: ${j.campaignId} (${j.campaign.name})`);
    if (j.errorMessage) {
      const msg = j.errorMessage.slice(0, 140);
      console.log(`    lastError: ${msg}${j.errorMessage.length > 140 ? '...' : ''}`);
    }
  }
  console.log('');

  if (!apply) {
    console.log(`🔍 DRY-RUN: ${candidates.length} jobs se resetearían.`);
    console.log('   Para aplicar: agregá --apply');
    return;
  }

  const { count } = await prisma.complianceAnalysis.updateMany({
    where: { id: { in: candidates.map((j) => j.id) } },
    data: {
      status: 'PENDING',
      retryCount: 0,
      errorMessage: null,
      startedAt: null,
      completedAt: null,
    },
  });

  console.log(`🎉 ${count} jobs reseteados. Listos para re-intentar con el CRON o drain directo.`);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
