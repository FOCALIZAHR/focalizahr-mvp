// scripts/test-onboarding-complete.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// ✅ TU ACCOUNT ID
const ACCOUNT_ID = 'cmfgedx7b00012413i92048wl'

async function testOnboardingComplete() {
  console.log('🧪 Testing Onboarding Complete Flow v4.2...\n')

  // ========================================================================
  // PASO 1: Verificar Account y Department
  // ========================================================================
  
  console.log('📋 PASO 1: Verificando account...')
  
  const account = await prisma.account.findUnique({
    where: { id: ACCOUNT_ID },
    include: {
      departments: true
    }
  })
  
  if (!account) {
    console.log(`❌ Account ${ACCOUNT_ID} no encontrado`)
    return
  }

  console.log(`✅ Account: ${account.companyName || account.adminEmail}`)

  // Buscar o crear department
  let department = account.departments[0]

  if (!department) {
    console.log('⚠️ Creando department de prueba...')
    department = await prisma.department.create({
      data: {
        accountId: account.id,
        displayName: 'Testing Normalización',
        standardCategory: 'other',
        unitType: 'department'
      }
    })
  }

  console.log(`✅ Department: ${department.displayName}\n`)
  
  // ========================================================================
  // PASO 2: Crear Journey de Prueba
  // ========================================================================
  
  console.log('📋 PASO 2: Creando journey de prueba...')
  
  const journey = await prisma.journeyOrchestration.create({
    data: {
      accountId: account.id,
      nationalId: '12345678-9',
      fullName: 'Test Normalización v4.2',
      participantEmail: 'test-norm@test.com',
      phoneNumber: '+56912345678',
      departmentId: department.id,
      hireDate: new Date(),
      status: 'active',
      currentStage: 1
    }
  })
  
  console.log(`✅ Journey: ${journey.id}\n`)
  
  // ========================================================================
  // PASO 3: Buscar Campaña Día 1
  // ========================================================================
  
  console.log('📋 PASO 3: Buscando campaña Día 1...')
  
  const day1Campaign = await prisma.campaign.findFirst({
    where: {
      campaignType: {
        slug: 'onboarding-day-1'
      },
      accountId: account.id
    }
  })
  
  if (!day1Campaign) {
    console.log('❌ No hay campaña onboarding-day-1')
    console.log('💡 Ejecuta primero: npx tsx prisma/seeds/onboardingCampaignTypes.ts')
    return
  }

  console.log(`✅ Campaña: ${day1Campaign.name}\n`)
  
  // ========================================================================
  // PASO 4: Crear Participant
  // ========================================================================
  
  console.log('📋 PASO 4: Creando participant...')
  
  const participant = await prisma.participant.create({
    data: {
      campaignId: day1Campaign.id,
      nationalId: journey.nationalId,
      email: journey.participantEmail || undefined,
      phoneNumber: journey.phoneNumber || undefined,
      hasResponded: false,
      uniqueToken: `test-${Date.now()}`
    }
  })
  
  // Link a journey
  await prisma.journeyOrchestration.update({
    where: { id: journey.id },
    data: { stage1ParticipantId: participant.id }
  })
  
  console.log(`✅ Participant: ${participant.id}`)
  console.log(`✅ Token: ${participant.uniqueToken}\n`)
  
  // ========================================================================
  // PASO 5: Obtener Preguntas
  // ========================================================================
  
  console.log('📋 PASO 5: Obteniendo preguntas...')
  
  const questions = await prisma.question.findMany({
    where: {
      campaignType: {
        slug: 'onboarding-day-1'
      }
    },
    orderBy: { questionOrder: 'asc' }
  })

  console.log(`✅ Preguntas encontradas: ${questions.length}\n`)
  
  if (questions.length === 0) {
    console.log('❌ No hay preguntas para Día 1')
    console.log('💡 Ejecuta: npx tsx prisma/seeds/onboarding-questions.ts')
    return
  }
  
  // ========================================================================
  // PASO 6: Enviar Respuestas (valores críticos)
  // ========================================================================
  
  console.log('📋 PASO 6: Enviando respuestas críticas...\n')
  
  const responses = [
    {
      questionId: questions[0].id,  // Q1: Equipamiento
      choiceResponse: ["Faltaban herramientas críticas para trabajar"]  // 2.0 → ALERTA
    },
    {
      questionId: questions[1].id,  // Q2: Recepción
      choiceResponse: ["No, nadie me recibió"]  // 1.0 → ALERTA CRÍTICA
    },
    {
      questionId: questions[2].id,  // Q3: Espacio
      choiceResponse: ["Regular/Básico"]  // 3.0 → OK
    },
    {
      questionId: questions[3].id,  // Q4: Información
      choiceResponse: ["Parcial/Poca información"]  // 3.0 → OK
    },
    {
      questionId: questions[4].id,  // Q5: Primera impresión
      rating: 2  // 2.0 → Bajo
    }
  ]

  console.log('🔄 Llamando API Submit...')
  
  const apiResponse = await fetch(
    `http://localhost:3000/api/onboarding/survey/${participant.uniqueToken}/submit`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ responses })
    }
  )
  
  const apiResult = await apiResponse.json()
  
  console.log(`📊 API Status: ${apiResponse.status}`)
  console.log(JSON.stringify(apiResult, null, 2))
  console.log('')
  
  if (!apiResult.success) {
    console.log('❌ API Submit falló')
    return
  }
  
  // ========================================================================
  // PASO 7: Verificar Resultados
  // ========================================================================
  
  console.log('📋 PASO 7: Verificando resultados...\n')
  
  // 7.1 Responses guardadas
  const savedResponses = await prisma.response.findMany({
    where: { participantId: participant.id },
    include: {
      question: {
        select: {
          questionOrder: true,
          text: true,
          responseType: true
        }
      }
    },
    orderBy: { question: { questionOrder: 'asc' } }
  })
  
  console.log('🔍 RESPUESTAS GUARDADAS:')
  savedResponses.forEach(r => {
    console.log(`   Q${r.question.questionOrder}: ${r.question.responseType}`)
    console.log(`      normalizedScore: ${r.normalizedScore}`)
    console.log(`      rating: ${r.rating}`)
    console.log(`      choice: ${r.choiceResponse}`)
    console.log('')
  })
  
  // 7.2 Journey actualizado
  const updatedJourney = await prisma.journeyOrchestration.findUnique({
    where: { id: journey.id }
  })
  
  console.log('📊 JOURNEY ACTUALIZADO:')
  console.log(`   complianceScore: ${updatedJourney?.complianceScore}`)
  console.log(`   exoScore: ${updatedJourney?.exoScore}`)
  console.log(`   retentionRisk: ${updatedJourney?.retentionRisk}`)
  console.log('')
  
  // 7.3 Alertas generadas
  const alerts = await prisma.journeyAlert.findMany({
    where: { journeyId: journey.id },
    orderBy: { severity: 'desc' }
  })
  
  console.log('🚨 ALERTAS GENERADAS:')
  if (alerts.length === 0) {
    console.log('   ⚠️ No se generaron alertas')
  } else {
    alerts.forEach(alert => {
      console.log(`   ${alert.severity}: ${alert.alertType}`)
      console.log(`      ${alert.title}`)
    })
  }
  console.log('')
  
  // ========================================================================
  // PASO 8: Resumen Final
  // ========================================================================
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('📊 RESUMEN FINAL:')
  console.log(`   Journey ID: ${journey.id}`)
  console.log(`   Respuestas guardadas: ${savedResponses.length}/5`)
  console.log(`   Con normalizedScore: ${savedResponses.filter(r => r.normalizedScore !== null).length}`)
  console.log(`   Compliance Score: ${updatedJourney?.complianceScore || 'null'}`)
  console.log(`   EXO Score: ${updatedJourney?.exoScore || 'null'}`)
  console.log(`   Alertas generadas: ${alerts.length}`)
  console.log('')
  
  const esperadas = ['BIENVENIDA_FALLIDA', 'ABANDONO_DIA_1']
  const generadas = alerts.map(a => a.alertType)
  const faltantes = esperadas.filter(e => !generadas.includes(e))
  
  if (savedResponses.every(r => r.normalizedScore !== null)) {
    console.log('✅ NORMALIZACIÓN: Todas las respuestas tienen normalizedScore')
  } else {
    console.log('⚠️ NORMALIZACIÓN: Algunas respuestas sin normalizedScore')
  }
  
  if (updatedJourney?.complianceScore !== null) {
    console.log('✅ SCORES: complianceScore calculado correctamente')
  } else {
    console.log('⚠️ SCORES: complianceScore no se calculó')
  }
  
  if (faltantes.length === 0) {
    console.log('✅ ALERTAS: Todas las esperadas se generaron')
  } else {
    console.log(`⚠️ ALERTAS: Faltantes: ${faltantes.join(', ')}`)
  }
  
  console.log('\n🎯 TESTING v4.2 COMPLETADO')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
}

testOnboardingComplete()
  .catch(console.error)
  .finally(() => prisma.$disconnect())