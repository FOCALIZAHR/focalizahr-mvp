// prisma/scripts/migrate-products-flowtype.ts
// Migración idempotente: cambia flowType a 'employee-based' para Pulso Express y
// Experiencia Full. Habilita el Paso 3B del wizard (carga desde nómina) y el endpoint
// genérico de generación de participantes. NO toca isPermanent (queda false: no son
// productos permanentes como Retención/Onboarding/Exit).
//
// Seguro de ejecutar múltiples veces. No borra ni recrea nada.
//
// Uso: npm run migrate:products-flowtype

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SLUGS = ['pulso-express', 'experiencia-full'];

async function main() {
  console.log(`🔧 Migración flowType='employee-based' para: ${SLUGS.join(', ')}`);

  for (const slug of SLUGS) {
    const campaignType = await prisma.campaignType.findUnique({
      where: { slug },
      select: { id: true, name: true, flowType: true, isPermanent: true },
    });

    if (!campaignType) {
      console.log(`⚠️  CampaignType "${slug}" no existe. Corre primero: npm run db:seed`);
      continue;
    }

    if (campaignType.flowType === 'employee-based') {
      console.log(`ℹ️  "${slug}" ya tenía flowType='employee-based'`);
      continue;
    }

    await prisma.campaignType.update({
      where: { id: campaignType.id },
      data: { flowType: 'employee-based' },
    });
    console.log(`✅ "${slug}" actualizado: flowType='employee-based' (isPermanent=${campaignType.isPermanent})`);
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
