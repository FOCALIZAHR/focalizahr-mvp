// prisma/scripts/backfill-products-rating-labels.ts
// Backfill idempotente: agrega minLabel/maxLabel canónicos a las preguntas rating_scale
// de Pulso Express y Experiencia Full que aún no los tengan. Espeja el patrón de
// update-ambiente-sano-labels.ts.
//
// Las preguntas de ambos productos son afirmaciones tipo Likert de acuerdo, por lo que el
// ancla canónica es "Muy en desacuerdo" / "Muy de acuerdo".
//
// Dry-run por defecto (solo reporta). Para persistir: pasar --apply.
//
// Uso:  npm run backfill:products-rating-labels            (dry-run)
//       npm run backfill:products-rating-labels -- --apply (persiste)

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SLUGS = ['pulso-express', 'experiencia-full'];
const MIN_LABEL = 'Muy en desacuerdo';
const MAX_LABEL = 'Muy de acuerdo';

async function main() {
  const apply = process.argv.includes('--apply');
  console.log(`🔧 Backfill minLabel/maxLabel rating_scale — ${apply ? 'APPLY' : 'DRY-RUN'}`);

  let totalTouched = 0;

  for (const slug of SLUGS) {
    const campaignType = await prisma.campaignType.findUnique({
      where: { slug },
      select: { id: true, name: true },
    });

    if (!campaignType) {
      console.log(`⚠️  CampaignType "${slug}" no existe. Corre primero: npm run db:seed`);
      continue;
    }

    // Preguntas rating_scale a las que les falta al menos un label.
    const questions = await prisma.question.findMany({
      where: {
        campaignTypeId: campaignType.id,
        responseType: 'rating_scale',
        OR: [{ minLabel: null }, { maxLabel: null }],
      },
      select: { id: true, questionOrder: true, minLabel: true, maxLabel: true },
    });

    console.log(`\n📋 ${slug}: ${questions.length} preguntas rating_scale sin labels completos`);

    for (const q of questions) {
      console.log(`   P${q.questionOrder}: "${q.minLabel ?? '∅'}" / "${q.maxLabel ?? '∅'}" → "${MIN_LABEL}" / "${MAX_LABEL}"`);
      if (apply) {
        await prisma.question.update({
          where: { id: q.id },
          data: { minLabel: MIN_LABEL, maxLabel: MAX_LABEL },
        });
      }
      totalTouched++;
    }
  }

  console.log(`\n📊 Total preguntas ${apply ? 'actualizadas' : 'a actualizar'}: ${totalTouched}`);
  if (!apply && totalTouched > 0) {
    console.log(`ℹ️  Dry-run. Para persistir: npm run backfill:products-rating-labels -- --apply`);
  }
  console.log(`\n🎉 Backfill ${apply ? 'completado' : '(dry-run) completado'}.`);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
