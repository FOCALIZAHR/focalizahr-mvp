// prisma/scripts/update-ambiente-sano-flowtype.ts
// Migración idempotente: actualiza CampaignType "pulso-ambientes-sanos" para Fase 1 de Ambiente Sano.
// - flowType: 'employee-based' (primer producto temporal que lee de Employee)
// - isPermanent: false
// - responseValueMapping en P2, P3, P5 (binario 5/1 para Safety Score)
//
// Seguro de ejecutar múltiples veces en dev y producción. No borra ni recrea nada.
//
// Uso: npm run migrate:ambiente-sano-flowtype

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SLUG = 'pulso-ambientes-sanos';

const QUESTION_MAPPINGS: Record<number, Record<string, number>> = {
  2: {
    'Qué valiente por alzar la voz': 5,
    'Qué arriesgado, mejor no meterse': 1,
  },
  3: {
    'Se genera una discusión constructiva': 5,
    'El líder lo toma de forma personal': 1,
  },
  5: {
    'Es un sistema equitativo y transparente': 5,
    'Hay más flexibilidad según la persona': 1,
  },
};

async function main() {
  console.log(`🔧 Migración flowType + responseValueMapping para "${SLUG}"`);

  const campaignType = await prisma.campaignType.findUnique({
    where: { slug: SLUG },
    include: { questions: { select: { id: true, questionOrder: true, responseValueMapping: true } } },
  });

  if (!campaignType) {
    console.log(`⚠️  CampaignType "${SLUG}" no existe. Corre primero: npm run db:seed:ambiente-sano`);
    return;
  }

  if (campaignType.flowType !== 'employee-based' || campaignType.isPermanent !== false) {
    await prisma.campaignType.update({
      where: { id: campaignType.id },
      data: { flowType: 'employee-based', isPermanent: false },
    });
    console.log(`✅ CampaignType actualizado: flowType='employee-based', isPermanent=false`);
  } else {
    console.log(`ℹ️  CampaignType ya tenía flowType='employee-based' e isPermanent=false`);
  }

  let updatedQuestions = 0;
  let skippedQuestions = 0;

  for (const [orderStr, mapping] of Object.entries(QUESTION_MAPPINGS)) {
    const order = Number(orderStr);
    const question = campaignType.questions.find((q) => q.questionOrder === order);

    if (!question) {
      console.log(`⚠️  P${order} no encontrada`);
      continue;
    }

    const current = question.responseValueMapping as Record<string, number> | null;
    const alreadyMatches =
      current &&
      Object.keys(mapping).every((k) => current[k] === mapping[k]) &&
      Object.keys(current).length === Object.keys(mapping).length;

    if (alreadyMatches) {
      skippedQuestions++;
      continue;
    }

    await prisma.question.update({
      where: { id: question.id },
      data: { responseValueMapping: mapping },
    });
    updatedQuestions++;
    console.log(`✅ P${order} responseValueMapping actualizado`);
  }

  const nullCount = await prisma.response.count({
    where: {
      normalizedScore: null,
      question: {
        campaignTypeId: campaignType.id,
        questionOrder: { in: [2, 3, 5] },
      },
    },
  });

  console.log(`\n📊 Resumen:`);
  console.log(`   - Preguntas actualizadas: ${updatedQuestions}`);
  console.log(`   - Preguntas sin cambios: ${skippedQuestions}`);
  console.log(`   - Respuestas históricas de P2/P3/P5 con normalizedScore NULL: ${nullCount}`);
  if (nullCount > 0) {
    console.log(
      `   ℹ️  Esas respuestas históricas no tenían mapping al momento del submit.`
    );
    console.log(
      `   ℹ️  Para Safety Score, se excluyen automáticamente (filtro normalizedScore != null).`
    );
  }

  console.log(`\n🎉 Migración completada.`);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
