// prisma/seeds/onboarding-questions.ts
// ✅ SEED v4.2 DEFINITIVO - MIGRACIÓN SEGURA PRODUCCIÓN
// 🎯 Estrategia: Upsert Lógico (UPDATE existentes, CREATE faltantes)
// 🛡️ Safety Net: Repara huecos, mantiene IDs, preserva responses
// 🔧 Cobertura: 10 single_choice con responseValueMapping completo
// 🔧 FIX: Usar undefined en lugar de null para campos JSON (TypeScript)

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedOnboardingQuestionsV42() {
  console.log('🚀 Iniciando Seed Onboarding v4.2 - Migración Segura')
  console.log('📊 Estrategia: Upsert Lógico (Mantiene IDs + Responses)')
  console.log('')
  
  // ════════════════════════════════════════════════════════════════
  // PASO 1: Obtener CampaignTypes
  // ════════════════════════════════════════════════════════════════
  
  console.log('📋 Obteniendo CampaignTypes...')
  
  const campaignTypes = {
    day1: await prisma.campaignType.findUnique({ where: { slug: 'onboarding-day-1' } }),
    day7: await prisma.campaignType.findUnique({ where: { slug: 'onboarding-day-7' } }),
    day30: await prisma.campaignType.findUnique({ where: { slug: 'onboarding-day-30' } }),
    day90: await prisma.campaignType.findUnique({ where: { slug: 'onboarding-day-90' } })
  }
  
  if (!campaignTypes.day1 || !campaignTypes.day7 || !campaignTypes.day30 || !campaignTypes.day90) {
    throw new Error('❌ CampaignTypes no encontrados. Ejecutar seed de CampaignTypes primero.')
  }
  
  console.log('✅ CampaignTypes encontrados')
  console.log('')
  
  // ════════════════════════════════════════════════════════════════
  // PASO 2: Definir las 26 Preguntas v4.2
  // ════════════════════════════════════════════════════════════════
  
  const questionsDefinition = [
    
    // ═══════════════════════════════════════════════════════════════
    // DÍA 1: COMPLIANCE (5 preguntas)
    // ═══════════════════════════════════════════════════════════════
    
    {
      campaignTypeId: campaignTypes.day1.id,
      questionOrder: 1,
      text: '¿Tenías tu computador, accesos a sistemas y herramientas necesarias listas el día 1?',
      category: 'desarrollo',
      subcategory: 'compliance',
      responseType: 'single_choice',
      choiceOptions: [
        "Sí, todo estaba perfectamente listo",
        "Sí, tenía lo principal (computador y accesos)",
        "Tenía lo básico pero faltaban complementos",
        "Faltaban herramientas críticas para trabajar",
        "No, nada estaba preparado"
      ],
      responseValueMapping: {
        "Sí, todo estaba perfectamente listo": 5.0,
        "Sí, tenía lo principal (computador y accesos)": 4.0,
        "Tenía lo básico pero faltaban complementos": 3.0,
        "Faltaban herramientas críticas para trabajar": 2.0,
        "No, nada estaba preparado": 1.0
      },
      minValue: undefined,
      maxValue: undefined,
      isRequired: true,
      isActive: true
    },
    
    {
      campaignTypeId: campaignTypes.day1.id,
      questionOrder: 2,
      text: '¿Alguien de tu equipo te recibió personalmente y te mostró las instalaciones?',
      category: 'liderazgo',
      subcategory: 'compliance',
      responseType: 'single_choice',
      choiceOptions: [
        "Sí, me recibieron muy bien",
        "Solo brevemente",
        "No, nadie me recibió"
      ],
      responseValueMapping: {
        "Sí, me recibieron muy bien": 5.0,
        "Solo brevemente": 3.0,
        "No, nadie me recibió": 1.0
      },
      minValue: undefined,
      maxValue: undefined,
      isRequired: true,
      isActive: true
    },
    
    {
      campaignTypeId: campaignTypes.day1.id,
      questionOrder: 3,
      text: '¿Tu espacio de trabajo estaba preparado y en buenas condiciones?',
      category: 'bienestar',
      subcategory: 'compliance',
      responseType: 'single_choice',
      choiceOptions: [
        "Sí, excelentes condiciones",
        "Regular/Básico",
        "No tenía espacio/Mal estado"
      ],
      responseValueMapping: {
        "Sí, excelentes condiciones": 5.0,
        "Regular/Básico": 3.0,
        "No tenía espacio/Mal estado": 1.0
      },
      minValue: undefined,
      maxValue: undefined,
      isRequired: true,
      isActive: true
    },
    
    {
      campaignTypeId: campaignTypes.day1.id,
      questionOrder: 4,
      text: '¿Recibiste información clara sobre políticas, horarios y normativas de la empresa?',
      category: 'desarrollo',
      subcategory: 'compliance',
      responseType: 'single_choice',
      choiceOptions: [
        "Sí, completa y clara",
        "Parcial/Poca información",
        "No recibí información"
      ],
      responseValueMapping: {
        "Sí, completa y clara": 5.0,
        "Parcial/Poca información": 3.0,
        "No recibí información": 1.0
      },
      minValue: undefined,
      maxValue: undefined,
      isRequired: true,
      isActive: true
    },
    
    {
      campaignTypeId: campaignTypes.day1.id,
      questionOrder: 5,
      text: '¿Cómo calificarías tu primera impresión general del día 1?',
      category: 'liderazgo',
      subcategory: 'compliance',
      responseType: 'rating_scale',
      choiceOptions: undefined,
      responseValueMapping: undefined,
      minValue: 1,
      maxValue: 5,
      isRequired: true,
      isActive: true
    },
    
    // ═══════════════════════════════════════════════════════════════
    // DÍA 7: CLARIFICATION (6 preguntas)
    // ═══════════════════════════════════════════════════════════════
    
    {
      campaignTypeId: campaignTypes.day7.id,
      questionOrder: 1,
      text: '¿Qué tan claro tienes lo que se espera de ti en tu rol?',
      category: 'desarrollo',
      subcategory: 'clarification',
      responseType: 'rating_scale',
      choiceOptions: undefined,
      responseValueMapping: undefined,
      minValue: 1,
      maxValue: 5,
      isRequired: true,
      isActive: true
    },
    
    {
      campaignTypeId: campaignTypes.day7.id,
      questionOrder: 2,
      text: '¿Conoces los objetivos específicos y cómo se medirá tu desempeño?',
      category: 'desarrollo',
      subcategory: 'clarification',
      responseType: 'single_choice',
      choiceOptions: [
        "Sí, completamente claros",
        "Mayormente claros",
        "Tengo una idea general",
        "Poco claros",
        "No los conozco"
      ],
      responseValueMapping: {
        "Sí, completamente claros": 5.0,
        "Mayormente claros": 4.0,
        "Tengo una idea general": 3.0,
        "Poco claros": 2.0,
        "No los conozco": 1.0
      },
      minValue: undefined,
      maxValue: undefined,
      isRequired: true,
      isActive: true
    },
    
    {
      campaignTypeId: campaignTypes.day7.id,
      questionOrder: 3,
      text: '¿Tu supervisor/jefe directo te ha explicado claramente tus responsabilidades?',
      category: 'comunicacion',
      subcategory: 'clarification',
      responseType: 'single_choice',
      choiceOptions: [
        "Sí, muy claramente",
        "Mayormente claro",
        "Explicación básica",
        "Confusa/Poca explicación",
        "No me ha explicado"
      ],
      responseValueMapping: {
        "Sí, muy claramente": 5.0,
        "Mayormente claro": 4.0,
        "Explicación básica": 3.0,
        "Confusa/Poca explicación": 2.0,
        "No me ha explicado": 1.0
      },
      minValue: undefined,
      maxValue: undefined,
      isRequired: true,
      isActive: true
    },
    
    {
      campaignTypeId: campaignTypes.day7.id,
      questionOrder: 4,
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
      responseValueMapping: {
        "Sí, completamente": 5.0,
        "Mayormente sí": 4.0,
        "Parcialmente": 3.0,
        "Mayormente no": 2.0,
        "No coinciden en absoluto": 1.0
      },
      minValue: undefined,
      maxValue: undefined,
      isRequired: true,
      isActive: true
    },
    
    {
      campaignTypeId: campaignTypes.day7.id,
      questionOrder: 5,
      text: '¿Has recibido la capacitación o formación necesaria para empezar tu rol?',
      category: 'desarrollo',
      subcategory: 'clarification',
      responseType: 'single_choice',
      choiceOptions: [
        "Sí, capacitación completa",
        "Capacitación suficiente",
        "Capacitación básica",
        "Capacitación insuficiente",
        "Ninguna capacitación"
      ],
      responseValueMapping: {
        "Sí, capacitación completa": 5.0,
        "Capacitación suficiente": 4.0,
        "Capacitación básica": 3.0,
        "Capacitación insuficiente": 2.0,
        "Ninguna capacitación": 1.0
      },
      minValue: undefined,
      maxValue: undefined,
      isRequired: true,
      isActive: true
    },
    
    {
      campaignTypeId: campaignTypes.day7.id,
      questionOrder: 6,
      text: '¿Sabes a quién acudir si tienes dudas o necesitas ayuda?',
      category: 'comunicacion',
      subcategory: 'clarification',
      responseType: 'single_choice',
      choiceOptions: [
        "Sí, perfectamente",
        "Mayormente sí",
        "Idea general",
        "Poco claro",
        "No sé a quién acudir"
      ],
      responseValueMapping: {
        "Sí, perfectamente": 5.0,
        "Mayormente sí": 4.0,
        "Idea general": 3.0,
        "Poco claro": 2.0,
        "No sé a quién acudir": 1.0
      },
      minValue: undefined,
      maxValue: undefined,
      isRequired: true,
      isActive: true
    },
    
    // ═══════════════════════════════════════════════════════════════
    // DÍA 30: CULTURE (8 preguntas)
    // ═══════════════════════════════════════════════════════════════
    
    {
      campaignTypeId: campaignTypes.day30.id,
      questionOrder: 1,
      text: '¿Te ves trabajando en esta empresa en un año?',
      category: 'satisfaccion',
      subcategory: 'culture',
      responseType: 'single_choice',
      choiceOptions: [
        "Definitivamente sí",
        "Probablemente sí",
        "No estoy seguro/a",
        "Probablemente no",
        "Definitivamente no"
      ],
      responseValueMapping: {
        "Definitivamente sí": 5.0,
        "Probablemente sí": 4.0,
        "No estoy seguro/a": 3.0,
        "Probablemente no": 2.0,
        "Definitivamente no": 1.0
      },
      minValue: undefined,
      maxValue: undefined,
      isRequired: true,
      isActive: true
    },
    
    {
      campaignTypeId: campaignTypes.day30.id,
      questionOrder: 2,
      text: '¿Sientes que encajas con la cultura y valores de la empresa?',
      category: 'satisfaccion',
      subcategory: 'culture',
      responseType: 'rating_scale',
      choiceOptions: undefined,
      responseValueMapping: undefined,
      minValue: 1,
      maxValue: 5,
      isRequired: true,
      isActive: true
    },
    
    {
      campaignTypeId: campaignTypes.day30.id,
      questionOrder: 3,
      text: '¿Te sientes valorado/a y reconocido/a por tu trabajo?',
      category: 'satisfaccion',
      subcategory: 'culture',
      responseType: 'rating_scale',
      choiceOptions: undefined,
      responseValueMapping: undefined,
      minValue: 1,
      maxValue: 5,
      isRequired: true,
      isActive: true
    },
    
    {
      campaignTypeId: campaignTypes.day30.id,
      questionOrder: 4,
      text: '¿Sientes que puedes ser auténtico/a en tu trabajo?',
      category: 'seguridad_psicologica',
      subcategory: 'culture',
      responseType: 'rating_scale',
      choiceOptions: undefined,
      responseValueMapping: undefined,
      minValue: 1,
      maxValue: 5,
      isRequired: true,
      isActive: true
    },
    
    {
      campaignTypeId: campaignTypes.day30.id,
      questionOrder: 5,
      text: '¿Te sientes apoyado/a por tu equipo de trabajo?',
      category: 'seguridad_psicologica',
      subcategory: 'culture',
      responseType: 'rating_scale',
      choiceOptions: undefined,
      responseValueMapping: undefined,
      minValue: 1,
      maxValue: 5,
      isRequired: true,
      isActive: true
    },
    
    {
      campaignTypeId: campaignTypes.day30.id,
      questionOrder: 6,
      text: '¿Crees que esta empresa te brinda oportunidades para aprender y crecer?',
      category: 'desarrollo',
      subcategory: 'culture',
      responseType: 'rating_scale',
      choiceOptions: undefined,
      responseValueMapping: undefined,
      minValue: 1,
      maxValue: 5,
      isRequired: true,
      isActive: true
    },
    
    {
      campaignTypeId: campaignTypes.day30.id,
      questionOrder: 7,
      text: '¿Estás satisfecho/a con tu salario y beneficios?',
      category: 'satisfaccion',
      subcategory: 'culture',
      responseType: 'rating_scale',
      choiceOptions: undefined,
      responseValueMapping: undefined,
      minValue: 1,
      maxValue: 5,
      isRequired: true,
      isActive: true
    },
    
    {
      campaignTypeId: campaignTypes.day30.id,
      questionOrder: 8,
      text: '¿Has podido construir relaciones positivas con tus compañeros?',
      category: 'seguridad_psicologica',
      subcategory: 'culture',
      responseType: 'rating_scale',
      choiceOptions: undefined,
      responseValueMapping: undefined,
      minValue: 1,
      maxValue: 5,
      isRequired: true,
      isActive: true
    },
    
    // ═══════════════════════════════════════════════════════════════
    // DÍA 90: CONNECTION (7 preguntas)
    // ═══════════════════════════════════════════════════════════════
    
    {
      campaignTypeId: campaignTypes.day90.id,
      questionOrder: 1,
      text: '¿Recomendarías trabajar en esta empresa a un amigo o familiar?',
      category: 'satisfaccion',
      subcategory: 'connection',
      responseType: 'nps_scale',
      choiceOptions: undefined,
      responseValueMapping: undefined,
      minValue: 0,
      maxValue: 10,
      isRequired: true,
      isActive: true
    },
    
    {
      campaignTypeId: campaignTypes.day90.id,
      questionOrder: 2,
      text: '¿Qué tan competente te sientes realizando las tareas de tu rol?',
      category: 'desarrollo',
      subcategory: 'connection',
      responseType: 'rating_scale',
      choiceOptions: undefined,
      responseValueMapping: undefined,
      minValue: 1,
      maxValue: 5,
      isRequired: true,
      isActive: true
    },
    
    {
      campaignTypeId: campaignTypes.day90.id,
      questionOrder: 3,
      text: '¿Sientes que estás contribuyendo efectivamente a los objetivos del equipo?',
      category: 'desarrollo',
      subcategory: 'connection',
      responseType: 'rating_scale',
      choiceOptions: undefined,
      responseValueMapping: undefined,
      minValue: 1,
      maxValue: 5,
      isRequired: true,
      isActive: true
    },
    
    {
      campaignTypeId: campaignTypes.day90.id,
      questionOrder: 4,
      text: '¿Has establecido una red de apoyo sólida en la empresa?',
      category: 'seguridad_psicologica',
      subcategory: 'connection',
      responseType: 'rating_scale',
      choiceOptions: undefined,
      responseValueMapping: undefined,
      minValue: 1,
      maxValue: 5,
      isRequired: true,
      isActive: true
    },
    
    {
      campaignTypeId: campaignTypes.day90.id,
      questionOrder: 5,
      text: '¿Te sientes comprometido/a con el éxito de la organización?',
      category: 'satisfaccion',
      subcategory: 'connection',
      responseType: 'rating_scale',
      choiceOptions: undefined,
      responseValueMapping: undefined,
      minValue: 1,
      maxValue: 5,
      isRequired: true,
      isActive: true
    },
    
    {
      campaignTypeId: campaignTypes.day90.id,
      questionOrder: 6,
      text: '¿Puedes mantener un buen equilibrio entre tu trabajo y vida personal?',
      category: 'seguridad_psicologica',
      subcategory: 'connection',
      responseType: 'rating_scale',
      choiceOptions: undefined,
      responseValueMapping: undefined,
      minValue: 1,
      maxValue: 5,
      isRequired: true,
      isActive: true
    },
    
    {
      campaignTypeId: campaignTypes.day90.id,
      questionOrder: 7,
      text: '¿Ves oportunidades de desarrollo y crecimiento en esta empresa?',
      category: 'satisfaccion',
      subcategory: 'connection',
      responseType: 'rating_scale',
      choiceOptions: undefined,
      responseValueMapping: undefined,
      minValue: 1,
      maxValue: 5,
      isRequired: true,
      isActive: true
    }
  ]
  
  // ════════════════════════════════════════════════════════════════
  // PASO 3: Ejecutar Upsert Lógico
  // ════════════════════════════════════════════════════════════════
  
  console.log('🔧 Ejecutando Upsert Lógico (26 preguntas)...')
  console.log('')
  
  let updatedCount = 0
  let createdCount = 0
  
  for (const questionDef of questionsDefinition) {
    // Buscar pregunta existente
    const existing = await prisma.question.findFirst({
      where: {
        campaignTypeId: questionDef.campaignTypeId,
        questionOrder: questionDef.questionOrder
      }
    })
    
    if (existing) {
      // ✅ EXISTE: UPDATE (mantener ID)
      await prisma.question.update({
        where: { id: existing.id },
        data: {
          text: questionDef.text,
          category: questionDef.category,
          subcategory: questionDef.subcategory,
          responseType: questionDef.responseType,
          choiceOptions: questionDef.choiceOptions,
          responseValueMapping: questionDef.responseValueMapping,
          minValue: questionDef.minValue ?? 1,
          maxValue: questionDef.maxValue ?? 5,
          isRequired: questionDef.isRequired,
          isActive: questionDef.isActive
        }
      })
      updatedCount++
      console.log(`  ✅ Updated: Order ${questionDef.questionOrder} (ID: ${existing.id})`)
    } else {
      // 🆕 NO EXISTE: CREATE (safety net)
      const created = await prisma.question.create({
        data: {
          campaignTypeId: questionDef.campaignTypeId,
          text: questionDef.text,
          category: questionDef.category,
          subcategory: questionDef.subcategory,
          questionOrder: questionDef.questionOrder,
          responseType: questionDef.responseType,
          choiceOptions: questionDef.choiceOptions,
          responseValueMapping: questionDef.responseValueMapping,
          minValue: questionDef.minValue ?? 1,
          maxValue: questionDef.maxValue ?? 5,
          isRequired: questionDef.isRequired,
          isActive: questionDef.isActive
        }
      })
      createdCount++
      console.log(`  🆕 Created: Order ${questionDef.questionOrder} (ID: ${created.id})`)
    }
  }
  
  console.log('')
  console.log('═══════════════════════════════════════════════════')
  console.log('✅ SEED COMPLETADO')
  console.log('═══════════════════════════════════════════════════')
  console.log('')
  console.log('📊 RESUMEN:')
  console.log(`   ✅ Preguntas actualizadas: ${updatedCount}`)
  console.log(`   🆕 Preguntas creadas: ${createdCount}`)
  console.log(`   📝 Total procesadas: ${questionsDefinition.length}`)
  console.log('')
  console.log('📋 COBERTURA responseValueMapping:')
  console.log('   ✅ Día 1: 4 single_choice (Q1-Q4)')
  console.log('   ✅ Día 7: 5 single_choice (Q2-Q6)')
  console.log('   ✅ Día 30: 1 single_choice (Q1)')
  console.log('   📊 Total: 10 preguntas con metadata')
  console.log('')
  console.log('🎯 RESULTADO:')
  console.log('   ✅ Sistema preparado para normalizedScore')
  console.log('   ✅ Alertas desacopladas de textos')
  console.log('   ✅ EXO Score con todas las preguntas mapeadas')
  console.log('   ✅ Idempotente (ejecutar múltiples veces = mismo resultado)')
  console.log('')
}

seedOnboardingQuestionsV42()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

export default seedOnboardingQuestionsV42