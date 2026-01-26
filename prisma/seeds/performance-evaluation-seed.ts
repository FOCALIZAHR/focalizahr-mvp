// ════════════════════════════════════════════════════════════════════════════
// SEED: Performance Evaluation - 20 Preguntas con Competency Library
// prisma/seeds/performance-evaluation-seed.ts
// ════════════════════════════════════════════════════════════════════════════
// Estrategia: Upsert Lógico (UPDATE existentes, CREATE faltantes)
// Preguntas organizadas por competencia:
// - CORE (8 preguntas) → Todos los tracks
// - LEADERSHIP (6 preguntas) → minTrack: MANAGER
// - STRATEGIC (4 preguntas) → minTrack: EJECUTIVO
// - FEEDBACK (2 preguntas) → Sin competencia, texto abierto
// ════════════════════════════════════════════════════════════════════════════

import { PrismaClient, Prisma } from '@prisma/client'

const prisma = new PrismaClient()

async function seedPerformanceEvaluation() {
  console.log('🎯 Iniciando Seed Performance Evaluation v1.0')
  console.log('📊 Estrategia: Upsert Lógico con Competency Library')
  console.log('')

  // ════════════════════════════════════════════════════════════════
  // PASO 1: Crear o actualizar CampaignType
  // ════════════════════════════════════════════════════════════════

  console.log('📋 Creando/actualizando CampaignType...')

  const campaignType = await prisma.campaignType.upsert({
    where: { slug: 'performance-evaluation' },
    update: {
      name: 'Evaluación de Desempeño',
      description: 'Evaluación integral de competencias organizacionales con filtrado por nivel (COLABORADOR/MANAGER/EJECUTIVO)',
      questionCount: 20,
      estimatedDuration: 15,
      methodology: 'Competency-Based Assessment + FocalizaHR Framework',
      category: 'desempeno',
      isActive: true,
      sortOrder: 10,
      isPermanent: false,
      flowType: 'employee-based'  // 🔑 Habilita Paso 3B en wizard
    },
    create: {
      name: 'Evaluación de Desempeño',
      slug: 'performance-evaluation',
      description: 'Evaluación integral de competencias organizacionales con filtrado por nivel (COLABORADOR/MANAGER/EJECUTIVO)',
      questionCount: 20,
      estimatedDuration: 15,
      methodology: 'Competency-Based Assessment + FocalizaHR Framework',
      category: 'desempeno',
      isActive: true,
      sortOrder: 10,
      isPermanent: false,
      flowType: 'employee-based'  // 🔑 Habilita Paso 3B en wizard
    }
  })

  console.log(`✅ CampaignType: ${campaignType.id} (${campaignType.slug})`)
  console.log('')

  // ════════════════════════════════════════════════════════════════
  // PASO 2: Definir las 20 preguntas con competencyCode y audienceRule
  // ════════════════════════════════════════════════════════════════

  console.log('📝 Definiendo 20 preguntas...')

  const questionsDefinition = [

    // ═══════════════════════════════════════════════════════════════
    // CORE - Comunicación Efectiva (CORE-COMM) - 2 preguntas
    // audienceRule: null → Todos los tracks
    // ═══════════════════════════════════════════════════════════════
    {
      questionOrder: 1,
      text: 'Comunica sus ideas de forma clara y comprensible para diferentes audiencias.',
      category: 'competencia',
      subcategory: 'comunicacion',
      responseType: 'rating_scale',
      competencyCode: 'CORE-COMM',
      audienceRule: null,
      minValue: 1,
      maxValue: 5,
      isRequired: true
    },
    {
      questionOrder: 2,
      text: 'Escucha activamente y considera las opiniones de otros antes de responder.',
      category: 'competencia',
      subcategory: 'comunicacion',
      responseType: 'rating_scale',
      competencyCode: 'CORE-COMM',
      audienceRule: null,
      minValue: 1,
      maxValue: 5,
      isRequired: true
    },

    // ═══════════════════════════════════════════════════════════════
    // CORE - Trabajo en Equipo (CORE-TEAM) - 2 preguntas
    // ═══════════════════════════════════════════════════════════════
    {
      questionOrder: 3,
      text: 'Colabora efectivamente con su equipo para lograr objetivos comunes.',
      category: 'competencia',
      subcategory: 'equipo',
      responseType: 'rating_scale',
      competencyCode: 'CORE-TEAM',
      audienceRule: null,
      minValue: 1,
      maxValue: 5,
      isRequired: true
    },
    {
      questionOrder: 4,
      text: 'Apoya a sus compañeros y contribuye positivamente al ambiente laboral.',
      category: 'competencia',
      subcategory: 'equipo',
      responseType: 'rating_scale',
      competencyCode: 'CORE-TEAM',
      audienceRule: null,
      minValue: 1,
      maxValue: 5,
      isRequired: true
    },

    // ═══════════════════════════════════════════════════════════════
    // CORE - Orientación a Resultados (CORE-RESULTS) - 2 preguntas
    // ═══════════════════════════════════════════════════════════════
    {
      questionOrder: 5,
      text: 'Cumple sus compromisos y entrega resultados en tiempo y forma.',
      category: 'competencia',
      subcategory: 'resultados',
      responseType: 'rating_scale',
      competencyCode: 'CORE-RESULTS',
      audienceRule: null,
      minValue: 1,
      maxValue: 5,
      isRequired: true
    },
    {
      questionOrder: 6,
      text: 'Prioriza tareas según su impacto y busca mejorar continuamente.',
      category: 'competencia',
      subcategory: 'resultados',
      responseType: 'rating_scale',
      competencyCode: 'CORE-RESULTS',
      audienceRule: null,
      minValue: 1,
      maxValue: 5,
      isRequired: true
    },

    // ═══════════════════════════════════════════════════════════════
    // CORE - Adaptabilidad (CORE-ADAPT) - 2 preguntas
    // ═══════════════════════════════════════════════════════════════
    {
      questionOrder: 7,
      text: 'Se adapta positivamente a los cambios y nuevos desafíos.',
      category: 'competencia',
      subcategory: 'adaptabilidad',
      responseType: 'rating_scale',
      competencyCode: 'CORE-ADAPT',
      audienceRule: null,
      minValue: 1,
      maxValue: 5,
      isRequired: true
    },
    {
      questionOrder: 8,
      text: 'Mantiene su efectividad bajo presión y propone alternativas ante obstáculos.',
      category: 'competencia',
      subcategory: 'adaptabilidad',
      responseType: 'rating_scale',
      competencyCode: 'CORE-ADAPT',
      audienceRule: null,
      minValue: 1,
      maxValue: 5,
      isRequired: true
    },

    // ═══════════════════════════════════════════════════════════════
    // LEADERSHIP - Desarrollo de Personas (LEAD-DEV) - 2 preguntas
    // audienceRule: { minTrack: "MANAGER" } → Solo managers y ejecutivos
    // ═══════════════════════════════════════════════════════════════
    {
      questionOrder: 9,
      text: 'Dedica tiempo a desarrollar las habilidades de los miembros de su equipo.',
      category: 'competencia',
      subcategory: 'desarrollo_personas',
      responseType: 'rating_scale',
      competencyCode: 'LEAD-DEV',
      audienceRule: { minTrack: 'MANAGER' },
      minValue: 1,
      maxValue: 5,
      isRequired: true
    },
    {
      questionOrder: 10,
      text: 'Proporciona feedback constructivo de manera regular y oportuna.',
      category: 'competencia',
      subcategory: 'desarrollo_personas',
      responseType: 'rating_scale',
      competencyCode: 'LEAD-DEV',
      audienceRule: { minTrack: 'MANAGER' },
      minValue: 1,
      maxValue: 5,
      isRequired: true
    },

    // ═══════════════════════════════════════════════════════════════
    // LEADERSHIP - Liderazgo de Equipos (LEAD-TEAM) - 2 preguntas
    // ═══════════════════════════════════════════════════════════════
    {
      questionOrder: 11,
      text: 'Establece una dirección clara y motiva al equipo hacia los objetivos.',
      category: 'competencia',
      subcategory: 'liderazgo_equipos',
      responseType: 'rating_scale',
      competencyCode: 'LEAD-TEAM',
      audienceRule: { minTrack: 'MANAGER' },
      minValue: 1,
      maxValue: 5,
      isRequired: true
    },
    {
      questionOrder: 12,
      text: 'Genera confianza y credibilidad en su equipo.',
      category: 'competencia',
      subcategory: 'liderazgo_equipos',
      responseType: 'rating_scale',
      competencyCode: 'LEAD-TEAM',
      audienceRule: { minTrack: 'MANAGER' },
      minValue: 1,
      maxValue: 5,
      isRequired: true
    },

    // ═══════════════════════════════════════════════════════════════
    // LEADERSHIP - Delegación Efectiva (LEAD-DELEG) - 2 preguntas
    // ═══════════════════════════════════════════════════════════════
    {
      questionOrder: 13,
      text: 'Delega responsabilidades de forma apropiada según las capacidades de cada persona.',
      category: 'competencia',
      subcategory: 'delegacion',
      responseType: 'rating_scale',
      competencyCode: 'LEAD-DELEG',
      audienceRule: { minTrack: 'MANAGER' },
      minValue: 1,
      maxValue: 5,
      isRequired: true
    },
    {
      questionOrder: 14,
      text: 'Da seguimiento sin caer en microgestión y asume responsabilidad por los resultados del equipo.',
      category: 'competencia',
      subcategory: 'delegacion',
      responseType: 'rating_scale',
      competencyCode: 'LEAD-DELEG',
      audienceRule: { minTrack: 'MANAGER' },
      minValue: 1,
      maxValue: 5,
      isRequired: true
    },

    // ═══════════════════════════════════════════════════════════════
    // STRATEGIC - Visión Estratégica (STRAT-VISION) - 2 preguntas
    // audienceRule: { minTrack: "EJECUTIVO" } → Solo ejecutivos
    // ═══════════════════════════════════════════════════════════════
    {
      questionOrder: 15,
      text: 'Tiene una visión clara del rumbo estratégico de la organización.',
      category: 'competencia',
      subcategory: 'vision_estrategica',
      responseType: 'rating_scale',
      competencyCode: 'STRAT-VISION',
      audienceRule: { minTrack: 'EJECUTIVO' },
      minValue: 1,
      maxValue: 5,
      isRequired: true
    },
    {
      questionOrder: 16,
      text: 'Comunica la visión de forma inspiradora y genera compromiso.',
      category: 'competencia',
      subcategory: 'vision_estrategica',
      responseType: 'rating_scale',
      competencyCode: 'STRAT-VISION',
      audienceRule: { minTrack: 'EJECUTIVO' },
      minValue: 1,
      maxValue: 5,
      isRequired: true
    },

    // ═══════════════════════════════════════════════════════════════
    // STRATEGIC - Gestión del Cambio (STRAT-CHANGE) - 2 preguntas
    // ═══════════════════════════════════════════════════════════════
    {
      questionOrder: 17,
      text: 'Lidera efectivamente iniciativas de cambio organizacional.',
      category: 'competencia',
      subcategory: 'gestion_cambio',
      responseType: 'rating_scale',
      competencyCode: 'STRAT-CHANGE',
      audienceRule: { minTrack: 'EJECUTIVO' },
      minValue: 1,
      maxValue: 5,
      isRequired: true
    },
    {
      questionOrder: 18,
      text: 'Maneja las resistencias al cambio de manera constructiva.',
      category: 'competencia',
      subcategory: 'gestion_cambio',
      responseType: 'rating_scale',
      competencyCode: 'STRAT-CHANGE',
      audienceRule: { minTrack: 'EJECUTIVO' },
      minValue: 1,
      maxValue: 5,
      isRequired: true
    },

    // ═══════════════════════════════════════════════════════════════
    // FEEDBACK ABIERTO - Sin competencia (2 preguntas)
    // Aplica a todos los tracks
    // ═══════════════════════════════════════════════════════════════
    {
      questionOrder: 19,
      text: '¿Qué aspectos destacarías del desempeño de esta persona?',
      category: 'feedback',
      subcategory: 'fortalezas',
      responseType: 'text_open',
      competencyCode: null,
      audienceRule: null,
      minValue: 1,
      maxValue: 5,
      isRequired: false
    },
    {
      questionOrder: 20,
      text: '¿Qué áreas de mejora identificas y qué sugerencias le darías?',
      category: 'feedback',
      subcategory: 'mejoras',
      responseType: 'text_open',
      competencyCode: null,
      audienceRule: null,
      minValue: 1,
      maxValue: 5,
      isRequired: false
    }
  ]

  // ════════════════════════════════════════════════════════════════
  // PASO 3: Upsert de preguntas
  // ════════════════════════════════════════════════════════════════

  console.log('⚙️ Procesando 20 preguntas...')

  let updatedCount = 0
  let createdCount = 0

  for (const qDef of questionsDefinition) {
    const existing = await prisma.question.findFirst({
      where: {
        campaignTypeId: campaignType.id,
        questionOrder: qDef.questionOrder
      }
    })

    if (existing) {
      await prisma.question.update({
        where: { id: existing.id },
        data: {
          text: qDef.text,
          category: qDef.category,
          subcategory: qDef.subcategory,
          responseType: qDef.responseType,
          competencyCode: qDef.competencyCode,
          audienceRule: qDef.audienceRule === null ? Prisma.JsonNull : qDef.audienceRule,
          minValue: qDef.minValue,
          maxValue: qDef.maxValue,
          isRequired: qDef.isRequired,
          isActive: true
        }
      })
      updatedCount++
      console.log(`   ✏️ Actualizada: Q${qDef.questionOrder} - ${qDef.competencyCode || 'FEEDBACK'}`)
    } else {
      await prisma.question.create({
        data: {
          campaignTypeId: campaignType.id,
          questionOrder: qDef.questionOrder,
          text: qDef.text,
          category: qDef.category,
          subcategory: qDef.subcategory,
          responseType: qDef.responseType,
          competencyCode: qDef.competencyCode,
          audienceRule: qDef.audienceRule === null ? Prisma.JsonNull : qDef.audienceRule,
          minValue: qDef.minValue,
          maxValue: qDef.maxValue,
          isRequired: qDef.isRequired,
          isActive: true
        }
      })
      createdCount++
      console.log(`   ✅ Creada: Q${qDef.questionOrder} - ${qDef.competencyCode || 'FEEDBACK'}`)
    }
  }

  console.log('')
  console.log('════════════════════════════════════════════════════════════════')
  console.log('📊 RESUMEN')
  console.log('════════════════════════════════════════════════════════════════')
  console.log(`   Preguntas actualizadas: ${updatedCount}`)
  console.log(`   Preguntas creadas: ${createdCount}`)
  console.log(`   Total: ${updatedCount + createdCount}`)
  console.log('')
  console.log('📈 Preguntas por nivel:')
  console.log('   COLABORADOR: 8 preguntas (CORE)')
  console.log('   MANAGER: 14 preguntas (CORE + LEADERSHIP)')
  console.log('   EJECUTIVO: 18 preguntas (CORE + LEADERSHIP + STRATEGIC)')
  console.log('   + 2 preguntas de feedback abierto (todos)')
  console.log('')
  console.log('📋 Preguntas por competencia:')
  console.log('   CORE-COMM: 2')
  console.log('   CORE-TEAM: 2')
  console.log('   CORE-RESULTS: 2')
  console.log('   CORE-ADAPT: 2')
  console.log('   LEAD-DEV: 2')
  console.log('   LEAD-TEAM: 2')
  console.log('   LEAD-DELEG: 2')
  console.log('   STRAT-VISION: 2')
  console.log('   STRAT-CHANGE: 2')
  console.log('   FEEDBACK: 2')
  console.log('')
  console.log('✅ Seed Performance Evaluation completado exitosamente')
}

seedPerformanceEvaluation()
  .catch((e) => {
    console.error('❌ Error ejecutando seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
