// prisma/scripts/backfill-compliance-total-invited.ts
// Backfill idempotente: sincroniza Campaign.totalInvited con el count real de
// Participants para campañas Ambiente Sano creadas antes del fix en
// ComplianceParticipantGenerator.
//
// - Dry-run por defecto: reporta qué cambiaría sin tocar la DB.
// - Con --apply: ejecuta los UPDATE.
//
// Uso:
//   npm run backfill:compliance-total-invited         # dry-run
//   npm run backfill:compliance-total-invited -- --apply

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SLUG = 'pulso-ambientes-sanos';

async function main() {
  const apply = process.argv.includes('--apply');
  console.log(`🔧 Backfill Compliance totalInvited (${apply ? 'APPLY' : 'DRY-RUN'})`);
  console.log('');

  const campaigns = await prisma.campaign.findMany({
    where: { campaignType: { slug: SLUG } },
    select: {
      id: true,
      name: true,
      status: true,
      totalInvited: true,
      accountId: true,
      account: { select: { companyName: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  if (campaigns.length === 0) {
    console.log(`ℹ️  No hay campañas "${SLUG}" en la DB.`);
    return;
  }

  console.log(`Encontradas ${campaigns.length} campañas Ambiente Sano.\n`);

  const rows: Array<{
    id: string;
    name: string;
    company: string;
    status: string;
    current: number;
    real: number;
    delta: number;
    action: 'no-op' | 'update';
  }> = [];

  for (const c of campaigns) {
    const real = await prisma.participant.count({ where: { campaignId: c.id } });
    const delta = real - c.totalInvited;
    rows.push({
      id: c.id,
      name: c.name,
      company: c.account.companyName,
      status: c.status,
      current: c.totalInvited,
      real,
      delta,
      action: delta === 0 ? 'no-op' : 'update',
    });
  }

  const needsUpdate = rows.filter((r) => r.action === 'update');
  const noops = rows.filter((r) => r.action === 'no-op');

  console.log('📊 Resumen:');
  console.log(`   Total campañas:         ${rows.length}`);
  console.log(`   Ya consistentes:        ${noops.length}`);
  console.log(`   Requieren UPDATE:       ${needsUpdate.length}`);
  console.log('');

  if (rows.length > 0) {
    console.log('Detalle:');
    console.log('─'.repeat(100));
    console.log(
      `${'ID'.padEnd(26)} ${'Empresa'.padEnd(24)} ${'Status'.padEnd(10)} ${'Actual'.padStart(7)} ${'Real'.padStart(6)} ${'Δ'.padStart(6)} ${'Acción'.padStart(8)}`
    );
    console.log('─'.repeat(100));
    for (const r of rows) {
      console.log(
        `${r.id.padEnd(26)} ${r.company.slice(0, 24).padEnd(24)} ${r.status.padEnd(10)} ${String(r.current).padStart(7)} ${String(r.real).padStart(6)} ${(r.delta >= 0 ? '+' + r.delta : String(r.delta)).padStart(6)} ${r.action.padStart(8)}`
      );
    }
    console.log('─'.repeat(100));
    console.log('');
  }

  if (needsUpdate.length === 0) {
    console.log('✅ Todas las campañas Ambiente Sano ya tienen totalInvited correcto.');
    return;
  }

  if (!apply) {
    console.log('🔍 DRY-RUN: no se modificó nada.');
    console.log('   Para aplicar: npm run backfill:compliance-total-invited -- --apply');
    return;
  }

  console.log(`🔄 Aplicando UPDATE a ${needsUpdate.length} campañas...\n`);

  for (const r of needsUpdate) {
    await prisma.campaign.update({
      where: { id: r.id },
      data: { totalInvited: r.real },
    });
    console.log(`   ✅ ${r.id}  ${r.current} → ${r.real}  (${r.name})`);
  }

  console.log('');
  console.log(`🎉 Backfill completado. ${needsUpdate.length} campañas actualizadas.`);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
