// prisma/seeds/onboarding-questions.ts
// ✅ VERSIÓN v3.2.5 - CORRIGE TODOS LOS ERRORES (LÓGICA, DATOS Y TÉCNICOS)

import { PrismaClient, Prisma } from '@prisma/client'

const prisma = new PrismaClient()

async function seedOnboardingQuestions() {
  console.log('🌱 Seeding Onboarding Questions (26 preguntas)...')

  // 1. Obtener IDs de CampaignTypes
  const day1 = await prisma.campaignType.findUnique({ where: { slug: 'onboarding-day-1' } })
  const day7 = await prisma.campaignType.findUnique({ where: { slug: 'onboarding-day-7' } })
  const day30 = await prisma.campaignType.findUnique({ where: { slug: 'onboarding-day-30' } })
  const day90 = await prisma.campaignType.findUnique({ where: { slug: 'onboarding-day-90' } })

  if (!day1 || !day7 || !day30 || !day90) {
    throw new Error('CampaignTypes onboarding no encontrados. Ejecuta seed de CampaignTypes primero.')
  }

  const campaignTypeIds = [day1.id, day7.id, day30.id, day90.id];

  // 2. Definir todas las preguntas (DATOS 100% VALIDADOS)
  const allQuestions: Prisma.QuestionCreateManyInput[] = [
    // DÍA 1: COMPLIANCE (5 preguntas) - Basado en SECCION_PREGUNTAS_ONBOARDING_COMPLE.txt
    {
      campaignTypeId: day1.id,
      text: '¿Tenías tu computador, accesos a sistemas y herramientas necesarias listas el día 1?',
      category: 'desarrollo',
      subcategory: 'compliance',
      questionOrder: 1,
      responseType: 'rating_scale',
      isRequired: true,
      isActive: true,
      minValue: 1,
      maxValue: 5,
    },
    {
      campaignTypeId: day1.id,
      text: '¿Alguien de tu equipo te recibió personalmente y te mostró las instalaciones?',
      category: 'liderazgo',
      subcategory: 'compliance',
      questionOrder: 2,
      responseType: 'single_choice',
      choiceOptions: ["Sí, me recibieron muy bien", "Solo brevemente", "No, nadie me recibió"],
      isRequired: true,
      isActive: true,
      // Se omiten minValue y maxValue para que usen el default(1) y default(5) del schema
    },
    {
      campaignTypeId: day1.id,
      text: '¿Tu espacio de trabajo estaba preparado y en buenas condiciones?',
      category: 'bienestar',
      subcategory: 'compliance',
      questionOrder: 3,
      responseType: 'rating_scale',
      isRequired: true,
      isActive: true,
      minValue: 1,
      maxValue: 5,
    },
    {
      campaignTypeId: day1.id,
      text: '¿Recibiste información clara sobre políticas, horarios y normativas de la empresa?',
      category: 'desarrollo',
      subcategory: 'compliance',
      questionOrder: 4,
      responseType: 'rating_scale',
      isRequired: true,
      isActive: true,
      minValue: 1,
      maxValue: 5,
    },
    {
      campaignTypeId: day1.id,
      text: '¿Cómo calificarías tu primera impresión general del día 1?',
      category: 'liderazgo',
      subcategory: 'compliance',
      questionOrder: 5,
      responseType: 'rating_scale',
      isRequired: true,
      isActive: true,
      minValue: 1,
      maxValue: 5,
    },

    // DÍA 7: CLARIFICATION (6 preguntas)
    {
      campaignTypeId: day7.id,
      text: '¿Qué tan claro tienes lo que se espera de ti en tu rol?',
      category: 'desarrollo', // ✅ CORREGIDO
      subcategory: 'clarification',
      questionOrder: 1,
      responseType: 'rating_scale',
      isRequired: true,
      isActive: true,
      minValue: 1,
      maxValue: 5,
    },
    {
      campaignTypeId: day7.id,
      text: '¿Conoces los objetivos específicos y cómo se medirá tu desempeño?',
      category: 'desarrollo',
      subcategory: 'clarification',
      questionOrder: 2,
      responseType: 'rating_scale',
      isRequired: true,
      isActive: true,
      minValue: 1,
      maxValue: 5,
    },
    {
      campaignTypeId: day7.id,
      text: '¿Tu supervisor/jefe directo te ha explicado claramente tus responsabilidades?',
      category: 'comunicacion',
      subcategory: 'clarification',
      questionOrder: 3,
      responseType: 'rating_scale',
      isRequired: true,
      isActive: true,
      minValue: 1,
      maxValue: 5,
    },
    {
      campaignTypeId: day7.id,
      text: '¿Tienes las herramientas y recursos necesarios para realizar tu trabajo?',
      category: 'autonomia',
      subcategory: 'clarification',
      questionOrder: 4,
      responseType: 'rating_scale',
      isRequired: true,
      isActive: true,
      minValue: 1,
      maxValue: 5,
    },
    {
      campaignTypeId: day7.id,
      text: '¿Has recibido la capacitación o formación necesaria para empezar tu rol?',
      category: 'desarrollo',
      subcategory: 'clarification',
      questionOrder: 5,
      responseType: 'rating_scale',
      isRequired: true,
      isActive: true,
      minValue: 1,
      maxValue: 5,
    },
    {
      campaignTypeId: day7.id,
      text: '¿Sabes a quién acudir si tienes dudas o necesitas ayuda?',
      category: 'comunicacion',
      subcategory: 'clarification',
      questionOrder: 6,
      responseType: 'rating_scale',
      isRequired: true,
      isActive: true,
      minValue: 1,
      maxValue: 5,
    },

    // DÍA 30: CULTURE (8 preguntas)
    {
      campaignTypeId: day30.id,
      text: '¿Te ves trabajando en esta empresa en un año?',
      category: 'satisfaccion',
      subcategory: 'culture',
      questionOrder: 1,
      responseType: 'single_choice',
      choiceOptions: ["Definitivamente sí", "Probablemente sí", "No estoy seguro/a", "Probablemente no", "Definitivamente no"],
      isRequired: true,
      isActive: true,
    },
    {
      campaignTypeId: day30.id,
      text: '¿Los valores de la empresa se alinean con tus valores personales?',
      category: 'satisfaccion',
      subcategory: 'culture',
      questionOrder: 2,
      responseType: 'rating_scale',
      isRequired: true,
      isActive: true,
      minValue: 1,
      maxValue: 5,
    },
    {
      campaignTypeId: day30.id,
      text: '¿Te sientes parte del equipo?',
      category: 'seguridad_psicologica',
      subcategory: 'culture',
      questionOrder: 3,
      responseType: 'rating_scale',
      isRequired: true,
      isActive: true,
      minValue: 1,
      maxValue: 5,
    },
    {
      campaignTypeId: day30.id,
      text: '¿Te sientes cómodo/a expresando tus opiniones en el trabajo?',
      category: 'seguridad_psicologica',
      subcategory: 'culture',
      questionOrder: 4,
      responseType: 'rating_scale',
      isRequired: true,
      isActive: true,
      minValue: 1,
      maxValue: 5,
    },
    {
      campaignTypeId: day30.id,
      text: '¿El ambiente de trabajo es respetuoso e inclusivo?',
      category: 'seguridad_psicologica',
      subcategory: 'culture',
      questionOrder: 5,
      responseType: 'rating_scale',
      isRequired: true,
      isActive: true,
      minValue: 1,
      maxValue: 5,
    },
    {
      campaignTypeId: day30.id,
      text: '¿Qué tan satisfecho/a estás con tu experiencia hasta ahora?',
      category: 'satisfaccion',
      subcategory: 'culture',
      questionOrder: 6,
      responseType: 'rating_scale',
      isRequired: true,
      isActive: true,
      minValue: 1,
      maxValue: 5,
    },
    {
      campaignTypeId: day30.id,
      text: '¿Sientes que tu trabajo es valorado por tu equipo y supervisor?',
      category: 'satisfaccion',
      subcategory: 'culture',
      questionOrder: 7,
      responseType: 'rating_scale',
      isRequired: true,
      isActive: true,
      minValue: 1,
      maxValue: 5,
    },
    {
      campaignTypeId: day30.id,
      text: '¿Has podido construir relaciones positivas con tus compañeros?',
      category: 'seguridad_psicologica',
      subcategory: 'culture',
      questionOrder: 8,
      responseType: 'rating_scale',
      isRequired: true,
      isActive: true,
      minValue: 1,
      maxValue: 5,
    },

    // DÍA 90: CONNECTION (7 preguntas)
    {
      campaignTypeId: day90.id,
      text: '¿Recomendarías trabajar en esta empresa a un amigo o familiar?',
      category: 'satisfaccion',
      subcategory: 'connection',
      questionOrder: 1,
      responseType: 'rating_scale',
      isRequired: true,
      isActive: true,
      minValue: 0,
      maxValue: 10,
    },
    {
      campaignTypeId: day90.id,
      text: '¿Qué tan competente te sientes realizando las tareas de tu rol?',
      category: 'desarrollo',
      subcategory: 'connection',
      questionOrder: 2,
      responseType: 'rating_scale',
      isRequired: true,
      isActive: true,
      minValue: 1,
      maxValue: 5,
    },
    {
      campaignTypeId: day90.id,
      text: '¿Sientes que estás contribuyendo efectivamente a los objetivos del equipo?',
      category: 'desarrollo',
      subcategory: 'connection',
      questionOrder: 3,
      responseType: 'rating_scale',
      isRequired: true,
      isActive: true,
      minValue: 1,
      maxValue: 5,
    },
    {
      campaignTypeId: day90.id,
      text: '¿Has establecido una red de apoyo sólida en la empresa?',
      category: 'seguridad_psicologica',
      subcategory: 'connection',
      questionOrder: 4,
      responseType: 'rating_scale',
      isRequired: true,
      isActive: true,
      minValue: 1,
      maxValue: 5,
    },
    {
      campaignTypeId: day90.id,
      text: '¿Te sientes comprometido/a con el éxito de la organización?',
      category: 'satisfaccion',
      subcategory: 'connection',
      questionOrder: 5,
      responseType: 'rating_scale',
      isRequired: true,
      isActive: true,
      minValue: 1,
      maxValue: 5,
    },
    {
      campaignTypeId: day90.id,
      text: '¿Puedes mantener un buen equilibrio entre tu trabajo y vida personal?',
      category: 'seguridad_psicologica',
      subcategory: 'connection',
      questionOrder: 6,
      responseType: 'rating_scale',
      isRequired: true,
      isActive: true,
      minValue: 1,
      maxValue: 5,
    },
    {
      campaignTypeId: day90.id,
      text: '¿Ves oportunidades de desarrollo y crecimiento en esta empresa?',
      category: 'satisfaccion',
      subcategory: 'connection',
      questionOrder: 7,
      responseType: 'rating_scale',
      isRequired: true,
      isActive: true,
      minValue: 1,
      maxValue: 5,
    }
  ]

  // 3. Lógica de Seed Segura (Borrar y Re-crear)
  console.log('Borrando preguntas de onboarding existentes...')
  await prisma.question.deleteMany({
    where: {
      campaignTypeId: {
        in: campaignTypeIds
      }
    }
  });
  console.log('Preguntas existentes borradas.');

  // 4. Crear las nuevas preguntas
  console.log('Creando 26 nuevas preguntas de onboarding...');
  
  await prisma.question.createMany({
    data: allQuestions.map(q => ({
        ...q,
        // CORRECCIÓN TS(2322): Usar 'undefined' para campos Json? en lugar de 'null'
        choiceOptions: q.choiceOptions ?? undefined, 
        conditionalLogic: undefined,
        methodologyReference: undefined
    }))
  })

  console.log(`✅ ${allQuestions.length} preguntas onboarding seeded successfully`)
}

// Llama a la función principal
seedOnboardingQuestions()
  .catch((e) => {
    console.error('❌ Error seeding questions:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

export default seedOnboardingQuestions