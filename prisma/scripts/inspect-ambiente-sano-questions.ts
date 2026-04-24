// Read-only inspection script. No writes.
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const campaignType = await prisma.campaignType.findUnique({
    where: { slug: 'pulso-ambientes-sanos' },
    select: { id: true, name: true, slug: true },
  });

  if (!campaignType) {
    console.log('CampaignType "pulso-ambientes-sanos" no encontrado.');
    return;
  }

  const questions = await prisma.question.findMany({
    where: { campaignTypeId: campaignType.id },
    orderBy: { questionOrder: 'asc' },
    select: {
      id: true,
      questionOrder: true,
      text: true,
      responseType: true,
      minValue: true,
      maxValue: true,
      minLabel: true,
      maxLabel: true,
      scaleLabels: true,
      choiceOptions: true,
      responseValueMapping: true,
    },
  });

  for (const q of questions) {
    console.log('─'.repeat(90));
    console.log(`P${q.questionOrder}  ${q.responseType}`);
    console.log(`  text: ${q.text.slice(0, 120)}`);
    console.log(`  minValue: ${q.minValue ?? 'null'}   maxValue: ${q.maxValue ?? 'null'}`);
    console.log(`  minLabel: ${JSON.stringify(q.minLabel)}`);
    console.log(`  maxLabel: ${JSON.stringify(q.maxLabel)}`);
    console.log(`  scaleLabels: ${JSON.stringify(q.scaleLabels)}`);
    if (q.choiceOptions) {
      console.log(`  choiceOptions: ${JSON.stringify(q.choiceOptions)}`);
    }
    if (q.responseValueMapping) {
      console.log(`  responseValueMapping: ${JSON.stringify(q.responseValueMapping)}`);
    }
  }
  console.log('─'.repeat(90));
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
