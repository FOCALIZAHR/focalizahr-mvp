// scripts/test-api-submit.ts
// ✅ Simula envío de respuestas y verifica normalizedScore

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testAPISubmit() {
  console.log('🧪 Testing API Submit con normalizedScore...\n')

  // ========================================================================
  // PASO 1: Encontrar un participant válido para testing
  // ========================================================================
  
  const participant = await prisma.participant.findFirst({
    where: {
      campaign: {
        campaignType: {
          isPermanent: true,
          slug: { startsWith: 'onboarding-day' }
        }
      },
      hasResponded: false
    },
    include: {
      campaign: {
        include: {
          campaignType: {
            include: {
              questions: {
                where: { isActive: true },
                orderBy: { questionOrder: 'asc' },
                take: 3  // Solo 3 preguntas para testing
              }
            }
          }
        }
      }
    }
  })

  if (!participant) {
    console.log('❌ No hay participants disponibles para testing')
    console.log('   Necesitas crear un journey de prueba primero')
    return
  }

  console.log('📋 Participant encontrado:')
  console.log(`   ID: ${participant.id}`)
  console.log(`   Token: ${participant.uniqueToken}`)
  console.log(`   Campaign: ${participant.campaign.name}`)
  console.log(`   Questions disponibles: ${participant.campaign.campaignType.questions.length}`)
  console.log('')

  // ========================================================================
  // PASO 2: Preparar payload de respuestas
  // ========================================================================
  
  const questions = participant.campaign.campaignType.questions
  
  const responses = questions.map((q, index) => {
    // Generar respuesta según tipo
    if (q.responseType === 'single_choice') {
      const options = Array.isArray(q.choiceOptions) ? q.choiceOptions : []
      return {
        questionId: q.id,
        choiceResponse: [options[index % options.length]]  // Rotar entre opciones
      }
    } else if (q.responseType === 'rating_scale') {
      return {
        questionId: q.id,
        rating: (index % 5) + 1  // Rating 1-5
      }
    } else if (q.responseType === 'nps_scale') {
      return {
        questionId: q.id,
        rating: index * 3  // NPS 0-10
      }
    } else {
      return {
        questionId: q.id,
        textResponse: `Respuesta de prueba ${index + 1}`
      }
    }
  })

  console.log('📤 Payload preparado:')
  responses.forEach((r, i) => {
    console.log(`   Q${i + 1}: ${JSON.stringify(r)}`)
  })
  console.log('')

  // ========================================================================
  // PASO 3: Simular llamada a API (usando fetch interno)
  // ========================================================================
  
  console.log('🚀 Enviando a API...')
  
  try {
    const response = await fetch(`http://localhost:3000/api/onboarding/survey/${participant.uniqueToken}/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ responses })
    })

    const result = await response.json()

    console.log(`\n📊 Respuesta API: ${response.status}`)
    console.log(JSON.stringify(result, null, 2))

    if (!result.success) {
      console.log('\n❌ API retornó error')
      return
    }

  } catch (fetchError) {
    console.log('\n⚠️  Fetch falló (¿servidor no corriendo?)')
    console.log('   Probando directamente en BD...\n')
  }

  // ========================================================================
  // PASO 4: Verificar en BD que normalizedScore se guardó
  // ========================================================================
  
  console.log('🔍 Verificando respuestas guardadas...\n')

  const savedResponses = await prisma.response.findMany({
    where: {
      participantId: participant.id
    },
    include: {
      question: {
        select: {
          questionOrder: true,
          text: true,
          responseType: true
        }
      }
    },
    orderBy: {
      question: {
        questionOrder: 'asc'
      }
    }
  })

  if (savedResponses.length === 0) {
    console.log('⚠️  No se guardaron respuestas')
    return
  }

  console.log(`✅ Respuestas guardadas: ${savedResponses.length}\n`)

  savedResponses.forEach((r, i) => {
    const hasNormalized = r.normalizedScore !== null
    console.log(`📝 Respuesta ${i + 1}:`)
    console.log(`   Pregunta: Q${r.question.questionOrder} (${r.question.responseType})`)
    console.log(`   Texto: ${r.question.text.substring(0, 50)}...`)
    console.log(`   Rating: ${r.rating}`)
    console.log(`   Choice: ${r.choiceResponse}`)
    console.log(`   ${hasNormalized ? '✅' : '❌'} normalizedScore: ${r.normalizedScore}`)
    console.log('')
  })

  // ========================================================================
  // PASO 5: Resumen
  // ========================================================================
  
  const withNormalized = savedResponses.filter(r => r.normalizedScore !== null).length
  const withoutNormalized = savedResponses.filter(r => r.normalizedScore === null).length

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('📊 RESUMEN:')
  console.log(`   Total respuestas: ${savedResponses.length}`)
  console.log(`   ✅ Con normalizedScore: ${withNormalized}`)
  console.log(`   ❌ Sin normalizedScore: ${withoutNormalized}`)
  
  if (withNormalized === savedResponses.length) {
    console.log('\n🎉 ¡PERFECTO! Todas las respuestas tienen normalizedScore')
  } else if (withNormalized > 0) {
    console.log('\n⚠️  Algunas respuestas no tienen normalizedScore')
    console.log('   (Puede ser normal para text_open)')
  } else {
    console.log('\n❌ ERROR: Ninguna respuesta tiene normalizedScore')
    console.log('   Revisar función calculateNormalizedScore()')
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
}

testAPISubmit()
  .catch(console.error)
  .finally(() => prisma.$disconnect())