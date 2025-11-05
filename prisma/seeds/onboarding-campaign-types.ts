// prisma/seeds/onboarding-campaign-types.ts
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

const onboardingCampaignTypes = [
  {
    name: 'Onboarding - Día 1',
    slug: 'onboarding-day-1',
    isPermanent: true,
    category: '4C_onboarding',
    methodology: 'Modelo 4C Bauer - Dimensión Compliance',
    description: 'Evaluación inicial del proceso de bienvenida y cumplimiento normativo',
    estimatedDuration: 2,
    questionCount: 5,
    isActive: true,
    sortOrder: 1
  },
  {
    name: 'Onboarding - Día 7',
    slug: 'onboarding-day-7',
    isPermanent: true,
    category: '4C_onboarding',
    methodology: 'Modelo 4C Bauer - Dimensión Clarification',
    description: 'Evaluación de claridad sobre rol, objetivos y expectativas',
    estimatedDuration: 3,
    questionCount: 6,
    isActive: true,
    sortOrder: 2
  },
  {
    name: 'Onboarding - Día 30',
    slug: 'onboarding-day-30',
    isPermanent: true,
    category: '4C_onboarding',
    methodology: 'Modelo 4C Bauer - Dimensión Culture',
    description: 'Evaluación de adaptación cultural y valores organizacionales',
    estimatedDuration: 4,
    questionCount: 8,
    isActive: true,
    sortOrder: 3
  },
  {
    name: 'Onboarding - Día 90',
    slug: 'onboarding-day-90',
    isPermanent: true,
    category: '4C_onboarding',
    methodology: 'Modelo 4C Bauer - Dimensión Connection',
    description: 'Evaluación de conexiones interpersonales y sentido de pertenencia',
    estimatedDuration: 4,
    questionCount: 7,
    isActive: true,
    sortOrder: 4
  }
]

async function seedOnboardingCampaignTypes() {
  console.log('🌱 Seeding Onboarding CampaignTypes...')
  
  for (const type of onboardingCampaignTypes) {
    await prisma.campaignType.upsert({
      where: { slug: type.slug },
      update: type,
      create: type
    })
    console.log(`  ✅ ${type.name}`)  // ✅ CORREGIDO
  }
  
  console.log('✅ Onboarding CampaignTypes seeded successfully')
}

seedOnboardingCampaignTypes()
  .catch((e) => {
    console.error('❌ Error seeding CampaignTypes:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

export default seedOnboardingCampaignTypes