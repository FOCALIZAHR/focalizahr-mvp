// ════════════════════════════════════════════════════════════════════════════
// SEED: Performance Evaluation - 26 Preguntas con Competency Library
// prisma/seeds/performance-evaluation-seed.ts
// ════════════════════════════════════════════════════════════════════════════
// Estrategia: Upsert Lógico (UPDATE existentes, CREATE faltantes)
// Preguntas organizadas por competencia:
// - CORE (10 preguntas) → Todos los tracks
// - LEADERSHIP (8 preguntas) → minTrack: MANAGER
// - STRATEGIC (6 preguntas) → minTrack: EJECUTIVO
// - FEEDBACK (2 preguntas) → Sin competencia, texto abierto
// ════════════════════════════════════════════════════════════════════════════

import { PrismaClient, Prisma } from '@prisma/client'

const prisma = new PrismaClient()

// ════════════════════════════════════════════════════════════════
// CONSTANTES DE COMPETENCIAS (evita errores de typo)
// ════════════════════════════════════════════════════════════════
const CORE_COMM = 'CORE-COMM'
const CORE_TEAM = 'CORE-TEAM'
const CORE_RESULTS = 'CORE-RESULTS'
const CORE_ADAPT = 'CORE-ADAPT'
const CORE_CLIENT = 'CORE-CLIENT'
const LEAD_DEV = 'LEAD-DEV'
const LEAD_TEAM = 'LEAD-TEAM'
const LEAD_DELEG = 'LEAD-DELEG'
const LEAD_FEEDBACK = 'LEAD-FEEDBACK'
const STRAT_VISION = 'STRAT-VISION'
const STRAT_CHANGE = 'STRAT-CHANGE'
const STRAT_INFLUENCE = 'STRAT-INFLUENCE'

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
      questionCount: 26,
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
      questionCount: 26,
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
  // PASO 2: Definir las 26 preguntas con competencyCode y audienceRule
  // ════════════════════════════════════════════════════════════════

  console.log('📝 Definiendo 26 preguntas...')

  const questionsDefinition = [

    // ═══════════════════════════════════════════════════════════════
    // CORE - Comunicación Efectiva (CORE-COMM) - 2 preguntas
    // audienceRule: null → Todos los tracks
    // ═══════════════════════════════════════════════════════════════
    {
      questionOrder: 1,
      text: 'Comunica sus ideas de forma clara y comprensible para diferentes audiencias.',
      category: CORE_COMM,
      subcategory: 'comunicacion',
      responseType: 'competency_behavior',
      competencyCode: CORE_COMM,
      audienceRule: null,
      minValue: 1,
      maxValue: 5,
      isRequired: true
    },
    {
      questionOrder: 2,
      text: 'Escucha activamente y considera las opiniones de otros antes de responder.',
      category: CORE_COMM,
      subcategory: 'comunicacion',
      responseType: 'competency_behavior',
      competencyCode: CORE_COMM,
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
      category: CORE_TEAM,
      subcategory: 'equipo',
      responseType: 'competency_behavior',
      competencyCode: CORE_TEAM,
      audienceRule: null,
      minValue: 1,
      maxValue: 5,
      isRequired: true
    },
    {
      questionOrder: 4,
      text: 'Apoya a sus compañeros y contribuye positivamente al ambiente laboral.',
      category: CORE_TEAM,
      subcategory: 'equipo',
      responseType: 'competency_behavior',
      competencyCode: CORE_TEAM,
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
      category: CORE_RESULTS,
      subcategory: 'resultados',
      responseType: 'competency_behavior',
      competencyCode: CORE_RESULTS,
      audienceRule: null,
      minValue: 1,
      maxValue: 5,
      isRequired: true
    },
    {
      questionOrder: 6,
      text: 'Prioriza tareas según su impacto y busca mejorar continuamente.',
      category: CORE_RESULTS,
      subcategory: 'resultados',
      responseType: 'competency_behavior',
      competencyCode: CORE_RESULTS,
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
      category: CORE_ADAPT,
      subcategory: 'adaptabilidad',
      responseType: 'competency_behavior',
      competencyCode: CORE_ADAPT,
      audienceRule: null,
      minValue: 1,
      maxValue: 5,
      isRequired: true
    },
    {
      questionOrder: 8,
      text: 'Mantiene su efectividad bajo presión y propone alternativas ante obstáculos.',
      category: CORE_ADAPT,
      subcategory: 'adaptabilidad',
      responseType: 'competency_behavior',
      competencyCode: CORE_ADAPT,
      audienceRule: null,
      minValue: 1,
      maxValue: 5,
      isRequired: true
    },

    // ═══════════════════════════════════════════════════════════════
    // CORE - Orientación al Cliente (CORE-CLIENT) - 2 preguntas
    // audienceRule: null → Todos los tracks
    // ═══════════════════════════════════════════════════════════════
    {
      questionOrder: 9,
      text: 'Entiende las necesidades del cliente interno o externo y responde oportunamente a sus solicitudes.',
      category: CORE_CLIENT,
      subcategory: 'cliente',
      responseType: 'competency_behavior',
      competencyCode: CORE_CLIENT,
      audienceRule: null,
      minValue: 1,
      maxValue: 5,
      isRequired: true
    },
    {
      questionOrder: 10,
      text: 'Busca superar las expectativas del cliente y mantiene relaciones positivas.',
      category: CORE_CLIENT,
      subcategory: 'cliente',
      responseType: 'competency_behavior',
      competencyCode: CORE_CLIENT,
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
      questionOrder: 11,
      text: 'Dedica tiempo a desarrollar las habilidades de los miembros de su equipo.',
      category: LEAD_DEV,
      subcategory: 'desarrollo_personas',
      responseType: 'competency_behavior',
      competencyCode: LEAD_DEV,
      audienceRule: { minTrack: 'MANAGER' },
      minValue: 1,
      maxValue: 5,
      isRequired: true
    },
    {
      questionOrder: 12,
      text: 'Proporciona feedback constructivo de manera regular y oportuna.',
      category: LEAD_DEV,
      subcategory: 'desarrollo_personas',
      responseType: 'competency_behavior',
      competencyCode: LEAD_DEV,
      audienceRule: { minTrack: 'MANAGER' },
      minValue: 1,
      maxValue: 5,
      isRequired: true
    },

    // ═══════════════════════════════════════════════════════════════
    // LEADERSHIP - Liderazgo de Equipos (LEAD-TEAM) - 2 preguntas
    // ═══════════════════════════════════════════════════════════════
    {
      questionOrder: 13,
      text: 'Establece una dirección clara y motiva al equipo hacia los objetivos.',
      category: LEAD_TEAM,
      subcategory: 'liderazgo_equipos',
      responseType: 'competency_behavior',
      competencyCode: LEAD_TEAM,
      audienceRule: { minTrack: 'MANAGER' },
      minValue: 1,
      maxValue: 5,
      isRequired: true
    },
    {
      questionOrder: 14,
      text: 'Genera confianza y credibilidad en su equipo.',
      category: LEAD_TEAM,
      subcategory: 'liderazgo_equipos',
      responseType: 'competency_behavior',
      competencyCode: LEAD_TEAM,
      audienceRule: { minTrack: 'MANAGER' },
      minValue: 1,
      maxValue: 5,
      isRequired: true
    },

    // ═══════════════════════════════════════════════════════════════
    // LEADERSHIP - Delegación Efectiva (LEAD-DELEG) - 2 preguntas
    // ═══════════════════════════════════════════════════════════════
    {
      questionOrder: 15,
      text: 'Delega responsabilidades de forma apropiada según las capacidades de cada persona.',
      category: LEAD_DELEG,
      subcategory: 'delegacion',
      responseType: 'competency_behavior',
      competencyCode: LEAD_DELEG,
      audienceRule: { minTrack: 'MANAGER' },
      minValue: 1,
      maxValue: 5,
      isRequired: true
    },
    {
      questionOrder: 16,
      text: 'Da seguimiento sin caer en microgestión y asume responsabilidad por los resultados del equipo.',
      category: LEAD_DELEG,
      subcategory: 'delegacion',
      responseType: 'competency_behavior',
      competencyCode: LEAD_DELEG,
      audienceRule: { minTrack: 'MANAGER' },
      minValue: 1,
      maxValue: 5,
      isRequired: true
    },

    // ═══════════════════════════════════════════════════════════════
    // LEADERSHIP - Feedback y Coaching (LEAD-FEEDBACK) - 2 preguntas
    // audienceRule: { minTrack: "MANAGER" } → Solo managers y ejecutivos
    // ═══════════════════════════════════════════════════════════════
    {
      questionOrder: 17,
      text: 'Proporciona retroalimentación oportuna y constructiva que ayuda a mejorar el desempeño.',
      category: LEAD_FEEDBACK,
      subcategory: 'feedback_coaching',
      responseType: 'competency_behavior',
      competencyCode: LEAD_FEEDBACK,
      audienceRule: { minTrack: 'MANAGER' },
      minValue: 1,
      maxValue: 5,
      isRequired: true
    },
    {
      questionOrder: 18,
      text: 'Dedica tiempo a conversaciones de coaching que desarrollan el potencial de su equipo.',
      category: LEAD_FEEDBACK,
      subcategory: 'feedback_coaching',
      responseType: 'competency_behavior',
      competencyCode: LEAD_FEEDBACK,
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
      questionOrder: 19,
      text: 'Tiene una visión clara del rumbo estratégico de la organización.',
      category: STRAT_VISION,
      subcategory: 'vision_estrategica',
      responseType: 'competency_behavior',
      competencyCode: STRAT_VISION,
      audienceRule: { minTrack: 'EJECUTIVO' },
      minValue: 1,
      maxValue: 5,
      isRequired: true
    },
    {
      questionOrder: 20,
      text: 'Comunica la visión de forma inspiradora y genera compromiso.',
      category: STRAT_VISION,
      subcategory: 'vision_estrategica',
      responseType: 'competency_behavior',
      competencyCode: STRAT_VISION,
      audienceRule: { minTrack: 'EJECUTIVO' },
      minValue: 1,
      maxValue: 5,
      isRequired: true
    },

    // ═══════════════════════════════════════════════════════════════
    // STRATEGIC - Gestión del Cambio (STRAT-CHANGE) - 2 preguntas
    // ═══════════════════════════════════════════════════════════════
    {
      questionOrder: 21,
      text: 'Lidera efectivamente iniciativas de cambio organizacional.',
      category: STRAT_CHANGE,
      subcategory: 'gestion_cambio',
      responseType: 'competency_behavior',
      competencyCode: STRAT_CHANGE,
      audienceRule: { minTrack: 'EJECUTIVO' },
      minValue: 1,
      maxValue: 5,
      isRequired: true
    },
    {
      questionOrder: 22,
      text: 'Maneja las resistencias al cambio de manera constructiva.',
      category: STRAT_CHANGE,
      subcategory: 'gestion_cambio',
      responseType: 'competency_behavior',
      competencyCode: STRAT_CHANGE,
      audienceRule: { minTrack: 'EJECUTIVO' },
      minValue: 1,
      maxValue: 5,
      isRequired: true
    },

    // ═══════════════════════════════════════════════════════════════
    // STRATEGIC - Influencia Organizacional (STRAT-INFLUENCE) - 2 preguntas
    // audienceRule: { minTrack: "EJECUTIVO" } → Solo ejecutivos
    // ═══════════════════════════════════════════════════════════════
    {
      questionOrder: 23,
      text: 'Construye relaciones estratégicas que facilitan el logro de objetivos organizacionales.',
      category: STRAT_INFLUENCE,
      subcategory: 'influencia_organizacional',
      responseType: 'competency_behavior',
      competencyCode: STRAT_INFLUENCE,
      audienceRule: { minTrack: 'EJECUTIVO' },
      minValue: 1,
      maxValue: 5,
      isRequired: true
    },
    {
      questionOrder: 24,
      text: 'Influye positivamente en decisiones clave a través de argumentos sólidos y credibilidad.',
      category: STRAT_INFLUENCE,
      subcategory: 'influencia_organizacional',
      responseType: 'competency_behavior',
      competencyCode: STRAT_INFLUENCE,
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
      questionOrder: 25,
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
      questionOrder: 26,
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

  console.log('⚙️ Procesando 26 preguntas...')

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
  console.log('   COLABORADOR: 10 preguntas (CORE) + 2 feedback = 12')
  console.log('   MANAGER: 18 preguntas (CORE + LEADERSHIP) + 2 feedback = 20')
  console.log('   EJECUTIVO: 24 preguntas (CORE + LEADERSHIP + STRATEGIC) + 2 feedback = 26')
  console.log('')
  console.log('📋 Preguntas por competencia:')
  console.log('   CORE-COMM: 2')
  console.log('   CORE-TEAM: 2')
  console.log('   CORE-RESULTS: 2')
  console.log('   CORE-ADAPT: 2')
  console.log('   CORE-CLIENT: 2')
  console.log('   LEAD-DEV: 2')
  console.log('   LEAD-TEAM: 2')
  console.log('   LEAD-DELEG: 2')
  console.log('   LEAD-FEEDBACK: 2')
  console.log('   STRAT-VISION: 2')
  console.log('   STRAT-CHANGE: 2')
  console.log('   STRAT-INFLUENCE: 2')
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
