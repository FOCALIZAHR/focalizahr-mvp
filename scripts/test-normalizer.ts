// scripts/test-normalizer.ts
// ✅ Prueba la función con casos reales

import { PrismaClient } from '@prisma/client'
import { calculateNormalizedScore } from '../src/lib/utils/responseNormalizer'

const prisma = new PrismaClient()

async function testNormalizer() {
  console.log('🧪 Testing calculateNormalizedScore()...\n')

  // Obtener pregunta con metadata (Día 30 Q1)
  const questionWithMapping = await prisma.question.findFirst({
    where: {
      campaignType: { slug: 'onboarding-day-30' },
      questionOrder: 1
    }
  })

  if (!questionWithMapping) {
    throw new Error('Pregunta no encontrada')
  }

  console.log('📋 Pregunta de prueba:')
  console.log(`   Texto: ${questionWithMapping.text}`)
  console.log(`   Tipo: ${questionWithMapping.responseType}`)
  console.log(`   Mapping: ${JSON.stringify(questionWithMapping.responseValueMapping, null, 2)}`)
  console.log('')

  // ═══════════════════════════════════════════════════════════════
  // TEST 1: single_choice con metadata
  // ═══════════════════════════════════════════════════════════════
  
  const tests = [
    {
      name: 'Choice "Definitivamente sí"',
      response: { choiceResponse: '["Definitivamente sí"]' },
      expected: 5.0
    },
    {
      name: 'Choice "Probablemente sí"',
      response: { choiceResponse: '["Probablemente sí"]' },
      expected: 4.0
    },
    {
      name: 'Choice "No estoy seguro/a"',
      response: { choiceResponse: '["No estoy seguro/a"]' },
      expected: 3.0
    },
    {
      name: 'Choice "Probablemente no"',
      response: { choiceResponse: '["Probablemente no"]' },
      expected: 2.0
    },
    {
      name: 'Choice "Definitivamente no"',
      response: { choiceResponse: '["Definitivamente no"]' },
      expected: 1.0
    }
  ]

  console.log('🧪 TESTS - single_choice con metadata:')
  for (const test of tests) {
    const result = calculateNormalizedScore(test.response, questionWithMapping)
    const pass = result === test.expected
    console.log(`   ${pass ? '✅' : '❌'} ${test.name}: ${result} (esperado: ${test.expected})`)
  }

  // ═══════════════════════════════════════════════════════════════
  // TEST 2: rating_scale
  // ═══════════════════════════════════════════════════════════════
  
  const ratingQuestion = await prisma.question.findFirst({
    where: {
      campaignType: { slug: 'onboarding-day-1' },
      questionOrder: 5
    }
  })

  console.log('\n🧪 TESTS - rating_scale:')
  const ratingTests = [
    { rating: 5, expected: 5.0 },
    { rating: 4, expected: 4.0 },
    { rating: 3, expected: 3.0 },
    { rating: 2, expected: 2.0 },
    { rating: 1, expected: 1.0 }
  ]

  for (const test of ratingTests) {
    const result = calculateNormalizedScore({ rating: test.rating }, ratingQuestion!)
    const pass = result === test.expected
    console.log(`   ${pass ? '✅' : '❌'} Rating ${test.rating}: ${result} (esperado: ${test.expected})`)
  }

  // ═══════════════════════════════════════════════════════════════
  // TEST 3: nps_scale
  // ═══════════════════════════════════════════════════════════════
  
  const npsQuestion = await prisma.question.findFirst({
    where: {
      campaignType: { slug: 'onboarding-day-90' },
      questionOrder: 1
    }
  })

  console.log('\n🧪 TESTS - nps_scale:')
  const npsTests = [
    { rating: 10, expected: 5.0 },
    { rating: 8, expected: 4.0 },
    { rating: 5, expected: 2.5 },
    { rating: 0, expected: 0.0 }
  ]

  for (const test of npsTests) {
    const result = calculateNormalizedScore({ rating: test.rating }, npsQuestion!)
    const pass = result === test.expected
    console.log(`   ${pass ? '✅' : '❌'} NPS ${test.rating}: ${result} (esperado: ${test.expected})`)
  }

  console.log('\n✅ Testing completado')
}

testNormalizer()
  .catch(console.error)
  .finally(() => prisma.$disconnect())