import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixQuestion4Day7() {
  console.log('🔧 Reparando pregunta #4 Día 7...')
  
  const day7 = await prisma.campaignType.findUnique({
    where: { slug: 'onboarding-day-7' }
  })
  
  if (!day7) {
    throw new Error('CampaignType onboarding-day-7 no encontrado')
  }
  
  const existingQ4 = await prisma.question.findFirst({
    where: {
      campaignTypeId: day7.id,
      questionOrder: 4
    }
  })
  
  if (existingQ4) {
    console.log('⚠️  Pregunta #4 ya existe. Actualizando...')
    
    await prisma.question.update({
      where: { id: existingQ4.id },
      data: {
        text: '¿Las tareas que realizas coinciden con lo que se te explicó cuando aceptaste el trabajo?',
        category: 'desarrollo',
        subcategory: 'clarification',
        responseType: 'single_choice',
        choiceOptions: [
          "Sí, completamente",
          "Mayormente sí",
          "Parcialmente",
          "Mayormente no",
          "No coinciden en absoluto"
        ],
        isRequired: true,
        isActive: true
      }
    })
    
    console.log('✅ Pregunta #4 actualizada')
  } else {
    console.log('➕ Pregunta #4 no existe. Creando nueva...')
    
    await prisma.question.create({
      data: {
        campaignTypeId: day7.id,
        text: '¿Las tareas que realizas coinciden con lo que se te explicó cuando aceptaste el trabajo?',
        category: 'desarrollo',
        subcategory: 'clarification',
        questionOrder: 4,
        responseType: 'single_choice',
        choiceOptions: [
          "Sí, completamente",
          "Mayormente sí",
          "Parcialmente",
          "Mayormente no",
          "No coinciden en absoluto"
        ],
        isRequired: true,
        isActive: true
      }
    })
    
    console.log('✅ Pregunta #4 creada')
  }
  
  console.log('✅ Reparación completada')
}

fixQuestion4Day7()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })