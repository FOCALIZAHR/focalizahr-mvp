// prisma/scripts/update-ambiente-sano-labels.ts
// Backfill idempotente: setea minLabel/maxLabel en P4, P7, P8 del CampaignType
// "pulso-ambientes-sanos". Corresponde al FIX UX de la rating_scale que venía
// mostrándose sin etiquetas en producción/dev.
//
// - Dry-run por defecto (reporta).
// - Con --apply: ejecuta los UPDATE.
//
// Uso:
//   npm run migrate:ambiente-sano-labels              # dry-run
//   npm run migrate:ambiente-sano-labels -- --apply

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SLUG = 'pulso-ambientes-sanos';

const LABEL_MAPPINGS: Record<number, { minLabel: string; maxLabel: string }> = {
  4: { minLabel: 'Nunca', maxLabel: 'Siempre' },
  7: { minLabel: 'Puede mejorar', maxLabel: 'Excelente' },
  8: { minLabel: 'Nunca', maxLabel: 'Siempre' },
};

async function main() {
  const apply = process.argv.includes('--apply');
  console.log(`🏷️  Backfill minLabel/maxLabel en "${SLUG}" (${apply ? 'APPLY' : 'DRY-RUN'})`);
  console.log('');

  const campaignType = await prisma.campaignType.findUnique({
    where: { slug: SLUG },
    include: {
      questions: {
        where: { questionOrder: { in: [4, 7, 8] } },
        orderBy: { questionOrder: 'asc' },
        select: {
          id: true,
          questionOrder: true,
          responseType: true,
          minLabel: true,
          maxLabel: true,
        },
      },
    },
  });

  if (!campaignType) {
    console.log(`⚠️  CampaignType "${SLUG}" no existe. Corre primero: npm run db:seed:ambiente-sano`);
    return;
  }

  if (campaignType.questions.length === 0) {
    console.log(`⚠️  No se encontraron P4/P7/P8 en "${SLUG}".`);
    return;
  }

  const rows: Array<{
    id: string;
    order: number;
    currentMin: string | null;
    currentMax: string | null;
    targetMin: string;
    targetMax: string;
    action: 'no-op' | 'update';
  }> = [];

  for (const q of campaignType.questions) {
    const target = LABEL_MAPPINGS[q.questionOrder];
    if (!target) continue;

    const needsUpdate = q.minLabel !== target.minLabel || q.maxLabel !== target.maxLabel;

    rows.push({
      id: q.id,
      order: q.questionOrder,
      currentMin: q.minLabel,
      currentMax: q.maxLabel,
      targetMin: target.minLabel,
      targetMax: target.maxLabel,
      action: needsUpdate ? 'update' : 'no-op',
    });
  }

  console.log('Detalle:');
  console.log('─'.repeat(96));
  console.log(
    `${'P'.padEnd(3)} ${'current min'.padEnd(20)} ${'current max'.padEnd(20)} ${'target min'.padEnd(16)} ${'target max'.padEnd(14)} ${'acción'.padStart(8)}`
  );
  console.log('─'.repeat(96));
  for (const r of rows) {
    console.log(
      `${('P' + r.order).padEnd(3)} ${String(r.currentMin ?? 'null').padEnd(20)} ${String(r.currentMax ?? 'null').padEnd(20)} ${r.targetMin.padEnd(16)} ${r.targetMax.padEnd(14)} ${r.action.padStart(8)}`
    );
  }
  console.log('─'.repeat(96));
  console.log('');

  const toUpdate = rows.filter((r) => r.action === 'update');

  if (toUpdate.length === 0) {
    console.log('✅ Todas las preguntas ya tienen los labels correctos.');
    return;
  }

  if (!apply) {
    console.log(`🔍 DRY-RUN: ${toUpdate.length} preguntas requieren UPDATE.`);
    console.log('   Para aplicar: npm run migrate:ambiente-sano-labels -- --apply');
    return;
  }

  console.log(`🔄 Aplicando UPDATE a ${toUpdate.length} preguntas...\n`);
  for (const r of toUpdate) {
    await prisma.question.update({
      where: { id: r.id },
      data: { minLabel: r.targetMin, maxLabel: r.targetMax },
    });
    console.log(`   ✅ P${r.order}: "${r.targetMin}" / "${r.targetMax}"`);
  }

  console.log('');
  console.log(`🎉 Backfill completado.`);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
